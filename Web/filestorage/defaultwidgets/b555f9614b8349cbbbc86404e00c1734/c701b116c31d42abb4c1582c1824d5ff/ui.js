(function($, global, undef) {

	var containerTypes = ['header', 'page', 'footer'];
	var revertWrapper = null, editWrapper = null, editHeaderWrapper = null, widgetsWrapper = null, layoutsWrapper = null, widgetFilter = null, widgetInstructions = null, layoutInstructions = null, reversionOptionsWrapper = null, reversionDetailsWrapper = null;
	var currentPanel = '', currentSubView = '', currentContainerType = null, currentReversionContainerType = null;
	var searchTimeout = null;

	function isStaged(options) {
		var containerCount = 0;
		for (var i = 0; i < containerTypes.length && containerCount == 0; i++) {
			(function(cfc) {
				if (cfc && cfc.isEditable() && cfc.info().isStaged) {
					containerCount++;
				}
			})($.telligent.evolution.contentFragmentContainers[containerTypes[i]]);
		}
		return containerCount > 0;
	}

	function updateStagedNote(options) {
		var note = $('.staged-note', $.telligent.evolution.administration.header());
		if (isStaged(options)) {
			note.show();
		} else {
			note.hide();
		}
		$.telligent.evolution.administration.header();
	}

	function hasRevertOptions(options) {
		var containerCount = 0;
		for (var i = 0; i < containerTypes.length && containerCount < 2; i++) {
			(function(cfc) {
				if (!cfc || !cfc.isEditable()) {
					return;
				}
				containerCount++;
			})($.telligent.evolution.contentFragmentContainers[containerTypes[i]]);
		}
		return containerCount > 1 || options.hasReversionOptions;
	}

	function filterWidgets(options, searchText) {
		global.clearTimeout(searchTimeout);
		searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0) {
				$('.content-fragment-type', widgetsWrapper).show();
			} else {
				var searchTerms = searchText.split(' ');
				$('.content-fragment-type', widgetsWrapper).each(function() {
					var cft = $(this);
					var text = cft.data('text');
					var match = true;
					for (var i = 0; i < searchTerms.length; i++) {
						if (text.indexOf(searchTerms[i]) == -1) {
							match = false;
							break;
						}
					}
					if (match) {
						cft.slideDown('fast');
					} else {
						cft.slideUp('fast');
					}
				})
			}
		}, 125);
	}

	function resetSearch(options) {
		$('input', editHeaderWrapper).val('');
	}

	function save(options, staged) {
		return $.Deferred(function(d) {
			var whens = [];
			var hasChanges = false;
			var hasStagedChanges = false;
			var initialPromise = $.Deferred(function(d2) { d2.resolve(); });

			if (options.hasReversionOptions && !staged) {
				var scopedProperties = [];
				reversionDetailsWrapper.find('input[type="checkbox"]:checked').each(function() {
					scopedProperties.push($(this).attr('value'));
				});

				if (scopedProperties.length > 0) {
					hasChanges = true;
					initialPromise = $.telligent.evolution.post({
						url: options.urls.publishRevert,
						data: {
							scopedproperties: scopedProperties
						}
					});
				}
			}

			initialPromise
				.then(function() {
					for (var i = 0; i < containerTypes.length; i++) {
						(function(containerType, cfc) {
							if (cfc && cfc.isEditable()) {
								var info = cfc.info();
								if (info && (cfc.isChanged() || (!staged && info.isStaged))) {
									whens.push(
										cfc.save(staged, currentContainerType == info.contentFragmentContainerType)
									);
									hasChanges = true;
								}

								hasStagedChanges = hasStagedChanges || (staged && info.isStaged);
							}
						})(containerTypes[i], $.telligent.evolution.contentFragmentContainers[containerTypes[i]]);
					}

					$.when.apply($, whens)
						.then(function(response) {
							if (!hasChanges && hasStagedChanges) {
								// nothing to do
							} else if (hasChanges) {
								$.telligent.evolution.notifications.show(staged ? options.text.saveAndPreviewSuccessful : options.text.saveAndPublishSuccessful, { type: 'success' });
							} else {
								$.telligent.evolution.notifications.show(staged ? options.text.saveAndPreviewNoChanges : options.text.saveAndPublishNoChanges, { type: 'warning' });
							}
							if (!staged) {
								$.telligent.evolution.post({
									url: options.urls.updateReversionOptions
								})
									.then(function(response) {
										options.hasReversionOptions = response.hasReversionOptions;
										options.reversionHtml = response.reversionHtml;
										options.reversionOptionsRendered = false;
									})
									.always(function() {
										updateReversionOptions(options);
										updateStagedNote(options);
										d.resolve(hasChanges || hasStagedChanges, options.hasRelatedStagedItems || (response && response.hasRelatedStagedItems));
									});
							} else {
								updateReversionOptions(options);
								updateStagedNote(options);
								d.resolve(hasChanges || hasStagedChanges, options.hasRelatedStagedItems || (response && response.hasRelatedStagedItems));
							}
						})
						.catch(function(response) {
							if (response.hasStagedItems === true) {
									global.alert(options.text.publishContainsStagedItems);
							}
							d.reject();
						});
				})
				.catch(function() {
				   d.reject();
				});
		}).promise();
	}

	function getContextName(options, info) {
		if (!info.supportsDefault) {
			return 'nodefault';
		} else if (options.isDefault) {
			return 'default';
		} else {
			return 'contextual';
		}
	}

	function revert(options, containerType, staged) {
		return $.Deferred(function(d) {
			var cfc = null;
			if (containerType) {
				cfc = $.telligent.evolution.contentFragmentContainers[containerType];
			}

			if (!cfc || !cfc.isEditable()) {
				d.reject();
				return;
			}

			var hasStagedChanges = false;
			for (var i = 0; i < containerTypes.length; i++) {
				if (containerTypes[i] != containerType) {
					(function(containerType, cfc) {
						if (cfc && cfc.isEditable()) {
							var info = cfc.info();
							hasStagedChanges = hasStagedChanges || info.isStaged;
						}
					})(containerTypes[i], $.telligent.evolution.contentFragmentContainers[containerTypes[i]]);
				}
			}

			var info = cfc.info();
			var message, successMessage;

			if (staged) {
				message = options.text.contextSpecific[getContextName(options, info)].revertToPublishedConfirmation.replace(/\{0\}/g, info.themeTypeName.toLowerCase()).replace(/\{1\}/g, info.themeApplicationName);
				successMessage = options.text.contextSpecific[getContextName(options, info)].revertToPublishedSuccessful.replace(/\{0\}/g, info.themeTypeName.toLowerCase()).replace(/\{1\}/g, info.themeApplicationName);
			} else {
				message = options.text.contextSpecific[getContextName(options, info)].revertToParentConfirmation.replace(/\{0\}/g, info.themeTypeName.toLowerCase()).replace(/\{1\}/g, info.themeApplicationName);
				successMessage = options.text.contextSpecific[getContextName(options, info)].revertToParentSuccessful.replace(/\{0\}/g, info.themeTypeName.toLowerCase()).replace(/\{1\}/g, info.themeApplicationName);
			}

			if (global.confirm(message)) {
				cfc.revert(staged, currentContainerType == info.contentFragmentContainerType)
					.then(function() {
						if (!hasStagedChanges && !options.hasRelatedStagedItems) {
							$.telligent.evolution.themePreview.enabled(false);
						}
						updateReversionOptions(options);
						updateStagedNote(options);
						$.telligent.evolution.notifications.show(successMessage, { type: 'success' });
						d.resolve();
					})
					.catch(function() {
						d.reject();
					});
			}
		}).promise();
	}

	function updateEditOptions(options) {
		// setup filters
		editHeaderWrapper.empty();

		editHeaderWrapper.append(
			$('<fieldset></fieldset>')
				.append(
					$('<ul class="field-list"></ul>')
						.append(
							$('<li class="field-item"></li>')
								.append(
									$('<span class="field-item-input"></span>')
										.append(
											$('<a href="#"></a>')
												.addClass('button save two-wide')
												.text(options.text.saveAndPreview)
												.on('click', function(e) {
													var b = $(e.target);
													if (!b.hasClass('disabled')) {
														b.addClass('disabled');
														save(options, true)
															.then(function(wasSaved, hasRelatedStagedItems) {
																if (!$.telligent.evolution.themePreview.enabled() && (wasSaved || isStaged(options))) {
																	$.telligent.evolution.themePreview.enabled(true);
																	if (hasRelatedStagedItems) {
																		if (global.confirm(options.text.reviewRelatedStagedChanges)) {
																			global.location = options.previewUrl;
																		}
																	} else {
																		global.alert(options.text.previewEnabled);
																	}
																}
															})
															.always(function() {
																b.removeClass('disabled');
															});
													}
													return false;
												})
											)
										.append(
											$('<a href="#"></a>')
												.addClass('button save two-wide')
												.text(options.text.saveAndPublish)
												.on('click', function(e) {
													var b = $(e.target);
													if (!b.hasClass('disabled')) {
														b.addClass('disabled');
														save(options, false)
															.then(function() {
																$.telligent.evolution.themePreview.enabled(false);
															})
															.always(function() {
																b.removeClass('disabled');
															});
													}
													return false;
												})
											)
										)
									)
						.append(
							$('<li class="field-item edit-details"></li>')
						)
						.append(
							$('<li class="field-item"></li>')
								.append(
									$('<span class="field-item-input"></span>')
										.append(
											$('<a href="#"></a>')
												.addClass('revert inline-button')
												.text(options.text.revert)
												.on('click', function() {
													if (hasRevertOptions(options)) {
														showRevert(options);
													} else {
														for (var i = 0; i < containerTypes.length; i++) {
															var cfc = $.telligent.evolution.contentFragmentContainers[containerTypes[i]];
															if (cfc && cfc.isEditable()) {
																showRevertOptions(options, containerTypes[i]);
																break;
															}
														}
													}
													return false;
												})
												.hide()
										)
										.append(
											$('<a href="#"></a>')
												.addClass('open-preview inline-button')
												.text(options.text.openPreview)
												.on('click', function() {
													global.open((global.location + '').split(/\#/)[0]);
													return false;
												})
												.hide()
										)
									)
								)
							)
						);

		editHeaderWrapper.append(
			$('<ul class="filter"></ul>')
				.append(
					$('<li class="filter-option widgets"></li>')
						.append(
							$('<a href="#" class="widgets"></a>')
								.text(options.text.widgets)
								.on('click', function() {
									layoutsWrapper.hide();
									layoutInstructions.hide();
									widgetsWrapper.show();
									widgetFilter.show();
									widgetInstructions.show();
									$('li.filter-option', $(this).closest('ul')).removeClass('selected');
									$(this).parent().addClass('selected');
									$.telligent.evolution.administration.header();
									return false;
								})
							)
				)
				.append(
					$('<li class="filter-option layouts"></li>')
						.append(
							$('<a href="#" class="layouts"></a>')
								.text(options.text.layout)
								.on('click', function() {
									widgetsWrapper.hide();
									widgetFilter.hide();
									widgetInstructions.hide();
									layoutsWrapper.show();
									layoutInstructions.show();
									$('li.filter-option', $(this).closest('ul')).removeClass('selected');
									$(this).parent().addClass('selected');
									$.telligent.evolution.administration.header();
									return false;
								})
							)
				)
		);

		widgetFilter.append(
			$('<form><fieldset></fieldset></form>')
				.children()
				.append(
					$('<ul class="field-list"></ul>')
						.append(
							$('<li class="field-item"></li>')
								.append(
									$('<span class="field-item-input"></span>')
										.append(
											$('<input type="text" />')
												.attr('placeholder', options.text.searchPlaceholder)
												.on('keyup paste click', function() {
													filterWidgets(options, $(this).val());
												})
										)
								)
						)
				)
				.parent()
		);

		if (currentSubView == 'layout') {
			layoutsWrapper.show();
			layoutInstructions.show();

			$.telligent.evolution.administration.header();
			$('li.filter-option.layouts', editHeaderWrapper).addClass('selected');
		} else {
			widgetsWrapper.show();
			widgetFilter.show();
			widgetInstructions.show();
			$('li.filter-option.widgets', editHeaderWrapper).addClass('selected');
			$.telligent.evolution.administration.header();
		}

		options.openPreview = $('.open-preview', $.telligent.evolution.administration.header());
		if ($.telligent.evolution.themePreview.enabled()) {
			options.openPreview.show();
		}

		$.telligent.evolution.contentFragmentContainers[currentContainerType].edit();
	}

	function updateReversionOptions(options) {
		revertWrapper.empty();

		var wrotePageWrapper = false;
		var hasRevertOptions = options.hasReversionOptions;
		for (var i = 0; i < containerTypes.length; i++) {
			(function(containerType, cfc) {
				if (!cfc) {
					return;
				}

				if (cfc.isEditable()) {
					var info = cfc.info();
					if (cfc.isEditable() && ((info.hasFactoryDefault && !info.isFactoryDefault) || (info.supportsDefault && info.hasDefault && !info.isDefault) || cfc.isChanged() || info.isStaged)) {
						hasRevertOptions = true;
					}

					function getModifiedMessage() {
						var elements = [];

						if ((info.supportsDefault && info.hasDefault && !options.isDefault && !info.isDefault) || ((!info.supportsDefault || options.isDefault) && info.hasFactoryDefault && !info.isFactoryDefault)) {
							elements.push($('<span></span>').addClass('modified').text(options.text.customized));
						} else {
							elements.push($('<span></span>').text(options.text.notCustomized));
						}
						elements.push(', ');
						if (!cfc.isChanged() && !info.isStaged) {
							elements.push($('<span></span>').text(options.text.notModified));
						} else {
							if (info.isStaged) {
								elements.push($('<span></span>').addClass('modified').text(options.text.staged));
							}
							if (cfc.isChanged()) {
								if (info.isStaged) {
									elements.push(', ');
								}
								elements.push($('<span></span>').addClass('modified').text(options.text.modified));
							}
						}

						return elements;
					};

					if (!wrotePageWrapper) {
						wrotePageWrapper = true;
						revertWrapper.append(
							$('<p></p>')
								.text(options.text.revertInstructions)
						);
					}

					revertWrapper.append(
						$('<a href="#"></a>')
							.addClass('page-component')
							.addClass(containerType)
							.on('click', function() {
								showRevertOptions(options, containerType);
								return false;
							})
							.text(options.text[containerType])
							.append(
								$('<span></span>')
									.append(getModifiedMessage())
								)
							);
				} else {
					revertWrapper.append(
						$('<span></span>')
							.addClass('page-component readonly')
							.addClass(containerType)
							.text(options.text[containerType])
							.append(
								$('<span></span>')
									.append(
										$('<span></span>').text(options.text.notEditable)
									)
								)
							);
				}
			})(containerTypes[i], $.telligent.evolution.contentFragmentContainers[containerTypes[i]]);
		}

		if (options.hasReversionOptions) {
			if (!options.reversionOptionsRendered) {
				reversionDetailsWrapper.empty();
				revertWrapper.off('click.editpage', 'input[type="checkbox"]');
				reversionDetailsWrapper.append(options.reversionHtml);
				revertWrapper.on('click.editpage', 'input[type="checkbox"]', function() {
					var cb = $(this);

					$.telligent.evolution.post({
						url: options.urls.setRevert,
						data: {
							scopedpropertyid: cb.attr('value'),
							revert: cb.is(':checked')
						}
					})
						.then(function() {
							for (var i = 0; i < containerTypes.length; i++) {
								(function(containerType, cfc) {
									if (cfc && cfc.isEditable()) {
										cfc.reset(currentContainerType == containerType);
									}
								})(containerTypes[i], $.telligent.evolution.contentFragmentContainers[containerTypes[i]]);
							}
						});
				});
				options.reversionOptionsRendered = true;
			}
		} else {
			reversionDetailsWrapper.empty();
		}
		revertWrapper.append(reversionDetailsWrapper);

		if (hasRevertOptions) {
			$('a.revert', editHeaderWrapper).show();
			$.telligent.evolution.administration.header();
		} else {
			$('a.revert', editHeaderWrapper).hide();
			$.telligent.evolution.administration.header();
			if ($.telligent.evolution.administration.panelWrapper().find(revertWrapper.get(0)).length > 0) {
					$.telligent.evolution.administration.close();
			}
		}

		if (currentReversionContainerType) {
			var list = $('<ul class="field-list"></ul>');
			var cfc = $.telligent.evolution.contentFragmentContainers[currentReversionContainerType];
			var info = cfc.info();
			var hasOptions = false;

			if (cfc.isChanged()) {
				hasOptions = true;
				list
					.append(
						$('<li class="field-item"></li>')
							.append(
								$('<span class="field-item-name"></span>')
									.append(
										$('<a href="#" class="inline-button"></a>')
											.text(options.text.reset.replace(/\{0\}/g, info.themeTypeName.toLowerCase()))
											.on('click', function(e) {
												var b = $(e.target);
												if (!b.hasClass('disabled')) {
													b.addClass('disabled');
													cfc.reset(currentContainerType == currentReversionContainerType)
														.then(function() {
															$.telligent.evolution.notifications.show(options.text.resetSuccessful, { type: 'success' });
															$.telligent.evolution.administration.close();
														})
														.always(function() {
															b.removeClass('disabled');
														});
												}
												return false;
											})
									)
							)
							.append(
								$('<span class="field-item-description"></span>')
									.text(options.text.resetDescription.replace(/\{0\}/g, info.themeTypeName.toLowerCase()).replace(/\{1\}/g, info.themeApplicationName))
							)
					);
			}

			if (info.isStaged) {
				hasOptions = true;
				list
					.append(
						$('<li class="field-item"></li>')
							.append(
								$('<span class="field-item-name"></span>')
									.append(
										$('<a href="#" class="inline-button"></a>')
											.text(options.text.contextSpecific[getContextName(options, info)].revertToPublished.replace(/\{0\}/g, info.themeTypeName.toLowerCase()))
											.on('click', function(e) {
												var b = $(e.target);
												if (!b.hasClass('disabled')) {
													b.addClass('disabled');
													revert(options, currentReversionContainerType, true)
														.then(function() {
															$.telligent.evolution.administration.close();
														})
														.always(function() {
															b.removeClass('disabled');
														});
												}
												return false;
											})
									)
							)
							.append(
								$('<span class="field-item-description"></span>')
									.text(options.text.contextSpecific[getContextName(options, info)].revertToPublishedDescription.replace(/\{0\}/g, info.themeTypeName.toLowerCase()).replace(/\{1\}/g, info.themeApplicationName))
							)
					);
			}

			if ((!options.isDefault && info.supportsDefault && info.hasDefault && !info.isDefault) || ((options.isDefault || !info.supportsDefault) && info.isAdministrator && info.hasFactoryDefault && !info.isFactoryDefault)) {
				hasOptions = true;
				list
					.append(
						$('<li class="field-item"></li>')
							.append(
								$('<span class="field-item-name"></span>')
									.append(
										$('<a href="#" class="inline-button"></a>')
											.text(options.text.contextSpecific[getContextName(options, info)].revertToParent.replace(/\{0\}/g, info.themeTypeName.toLowerCase()))
											.on('click', function(e) {
												var b = $(e.target);
												if (!b.hasClass('disabled')) {
													b.addClass('disabled');
													revert(options, currentReversionContainerType, false)
														.then(function() {
															$.telligent.evolution.administration.close();
														})
														.always(function() {
															b.removeClass('disabled');
														});
												}
												return false;
											})
									)
							)
							.append(
								$('<span class="field-item-description"></span>')
									.text(options.text.contextSpecific[getContextName(options, info)].revertToParentDescription.replace(/\{0\}/g, info.themeTypeName.toLowerCase()).replace(/\{1\}/g, info.themeApplicationName))
							)
					);
			}

			if (!hasOptions) {
				reversionOptionsWrapper.html($('<p></p>').text(options.text.noRevertOptions));
			} else {
				reversionOptionsWrapper.html($('<fieldset></fieldset>').append(list));
			}
		}
	}

	function showRevertOptions(options, containerType) {
		currentPanel = 'revertOptions';
		currentReversionContainerType = containerType;
		$.telligent.evolution.administration.open({
			name: options.text.revertOptions,
			content: $.Deferred(function(d) {
				updateReversionOptions(options);
				d.resolve(reversionOptionsWrapper);
			}),
			cssClass: 'contextual-edit-page'
		});
	}

	function showRevert(options) {
		currentPanel = 'revert';
		$.telligent.evolution.administration.open({
			name: options.text.revert,
			content: $.Deferred(function(d) {
				updateReversionOptions(options);
				d.resolve(revertWrapper);
			}),
			cssClass: 'contextual-edit-page'
		});
	}

	function showEdit(options) {
		currentPanel = 'edit';
		$.telligent.evolution.administration.header(editHeaderWrapper);
		editWrapper.append(widgetInstructions.hide());
		editWrapper.append(layoutInstructions.hide())
		editWrapper.append(widgetFilter.hide());
		editWrapper.append(widgetsWrapper.hide());
		editWrapper.append(layoutsWrapper.hide());
		updateEditOptions(options);
	}

	var api = {
		register: function(options) {

			editWrapper = $.telligent.evolution.administration.panelWrapper();
			revertWrapper = $('<div></div>');
			editHeaderWrapper = $('<div></div>');
			widgetsWrapper = $('<div class="content-fragment-type-list"></div>');
			layoutsWrapper = $('<div class="layout-list"></div>');
			widgetFilter = $('<div></div>');
			layoutInstructions = $('<p></p>').text(options.text.layoutInstructions);
			widgetInstructions = $('<p></p>').text(options.text.widgetInstructions);
			reversionOptionsWrapper = $('<div></div>');
			reversionDetailsWrapper = $('<div></div>');

			if ($('.single-column.header-fragments, .single-column.content-fragment-page, .single-column.footer-fragments').filter(function(i, e) { return $(e).css('display') != 'none'; }).length > 0) {
				editWrapper.html(options.text.editingNotAllowedOnSmallScreens);
				return;
			}

	  if ($.telligent.evolution.contentFragmentContainers != null) {
				var editorConfiguration = {
					contentFragmentListContainer: widgetsWrapper,
					layoutListContainer: layoutsWrapper,
					afterInitialization: function(settings) {
						updateReversionOptions(options);
						resetSearch(options);

						var info = $.telligent.evolution.contentFragmentContainers[settings.contentFragmentContainerType].info();

						$('.edit-details', editHeaderWrapper)
							.empty()
							.append(
								$('<div class="editing-title"></div>')
									.html(options.text.contextSpecific[getContextName(options, info)].containerTitle[settings.contentFragmentContainerType].replace(/\{0\}/g, info.themeTypeName.toLowerCase()).replace(/\{1\}/g, info.themeApplicationName))
							)
							.append(
								$('<div class="editing-description"></div>')
									.html($.parseHTML(
										options.text.contextSpecific[getContextName(options, info)].containerDescription[settings.contentFragmentContainerType].replace(/\{0\}/g, info.themeTypeName.toLowerCase()).replace(/\{1\}/g, info.themeApplicationName) +
										' <span class="staged-note"' + (!isStaged(options) ? ' style="display: none;"' : '') + '>' + options.text.containsStagedChanges + '</span>'
										))
							);

						$.telligent.evolution.administration.header();
						currentContainerType = settings.contentFragmentContainerType;
					},
					isChanged: function(changed) {
						updateReversionOptions(options);
					}
				};

				for (var i = 0; i < containerTypes.length; i++) {
					(function(cfc) {
						if (!cfc || !cfc.isEditable()) {
							return;
						}

					cfc.registerEditor(editorConfiguration)
							.then(function() {
								updateStagedNote(options);
							});

						if (!currentContainerType || containerTypes[i] == 'page') {
							currentContainerType = containerTypes[i];
						}
					})($.telligent.evolution.contentFragmentContainers[containerTypes[i]]);
				}

				var data = $.telligent.evolution.url.hashData();

				if (data['_epc'] && $.telligent.evolution.contentFragmentContainers[data['_epc']] && $.telligent.evolution.contentFragmentContainers[data['_epc']].isEditable()) {
					currentContainerType = data['_epc'];
				}

				if (!currentContainerType) {
					$.telligent.evolution.administration.close();
					return;
				}

				if (data['_epv'] == 'layout') {
					currentSubView = 'layout';
					showEdit(options);
				} else {
					currentSubView = 'widgets';
					showEdit(options);
				}

				if (data['_epv'] == 'revert') {
					showRevert(options);
				}

				$.telligent.evolution.messaging.subscribe('administration.panel.shown', function(){
					$.telligent.evolution.administration.header();
				});

			$.telligent.evolution.messaging.subscribe('themepreview.disabled', function() {
				options.openPreview.hide();
			});

			$.telligent.evolution.messaging.subscribe('themepreview.enabled', function() {

				options.openPreview.show();
			});
	  }
	}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.editThemePage = api;

})(jQuery, window);