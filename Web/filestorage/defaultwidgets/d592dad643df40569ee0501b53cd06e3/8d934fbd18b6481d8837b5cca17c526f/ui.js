(function($, global) {

	var options = null;
	var formOptions = null;
	var frameResizeHandle = null;
	var revertOptionsContainer = null;

	function revertToPublished() {
		return $.telligent.evolution.post({
			url: options.revertToPublishedUrl
		});
	}

	function updateStagedNote() {
		if (formOptions.isStaged) {
			options.stagedNote.show();
		} else {
			options.stagedNote.hide();
		}
		$.telligent.evolution.administration.header();
	}

	function reloadConfiguration() {
		$.telligent.evolution.administration.refresh();
	}

	function processRevert(stage) {
		return $.Deferred(function(d) {
			var message = options.text.revertConfirmation;
			var success = options.text.revertSuccess;
			var successReload = options.text.revertSuccessReload;

			if (stage || global.confirm(message)) {
				var refresh = false;
				var properties = [], files= [], scopedproperties = [];
				$('input[type="checkbox"]:checked', revertOptionsContainer).each(function() {
					var cb = $(this);
					var t = cb.data('type');

					if (cb.data('refresh')) {
						refresh = true;
					}

					if (t == 'property') {
						properties.push(cb.attr('value'));
					} else if (t == 'file') {
						files.push(cb.attr('value'));
					} else if (t == 'scopedproperty') {
						scopedproperties.push(cb.attr('value'));
					}
				});

				$.telligent.evolution.post({
					url: options.revertUrl,
					data: {
						stage: stage,
						properties: properties,
						files: files,
						scopedproperties: scopedproperties
					}
				})
				.then(function(response) {
					$.telligent.evolution.administration.close();
					reloadConfiguration();

					if (stage) {
						$.telligent.evolution.notifications.show(success, { type: 'success' });
						if (!$.telligent.evolution.themePreview.enabled()) {
							$.telligent.evolution.themePreview.enabled(true);
							if (response.hasRelatedStagedItems) {
								if (global.confirm(options.text.reviewRelatedStagedChanges)) {
									global.location = options.previewUrl;
								}
							} else {
								global.alert(options.text.previewEnabled);
							}
						}
					} else {
						if (!response.hasRelatedStagedItems) {
							$.telligent.evolution.themePreview.enabled(false);
						}
						if (refresh) {
							if (global.confirm(successReload)) {
								global.location.reload();
							}
						} else {
							$.telligent.evolution.notifications.show(success, { type: 'success' });
						}
					}

					d.resolve();
				})
				.catch(function() {
					d.reject();
				});
			} else {
				d.reject();
			}
		});
	}

	function showRevertOptions() {
		currentPanel = 'revert-options';
		$.telligent.evolution.administration.open({
			name: options.text.revertOptions,
			content: $.Deferred(function(d) {
				var fields = $('<fieldset></fieldset>');
				var list = $('<ul class="field-list"></ul>');
				fields.append(list);

				list
					.append(
						$('<li class="field-item"></li>')
							.append(
								$('<span class="field-item-name"></span>')
									.append(
										$('<a href="#" class="inline-button"></a>')
											.html(options.text.reset))
											.on('click', function() {
												$.telligent.evolution.administration.close();
												$.telligent.evolution.themePreview.enabled(false);
												reloadConfiguration();
												$.telligent.evolution.notifications.show(options.text.resetSuccessful, { type: 'success' });
												return false;
											})
									)
							.append(
								$('<span class="field-item-description"></span>')
									.html(options.text.resetDescription)
							)
					);

				if (options.isStaged) {
					list
						.append(
							$('<li class="field-item"></li>')
								.append(
									$('<span class="field-item-name"></span>')
										.append(
											$('<a href="#" class="inline-button"></a>')
												.html(options.text.revertToPublished)
												.on('click', function(e) {
													var b = $(e.target);
													if (!b.hasClass('disabled')) {
														if (global.confirm(options.text.revertToPublishedConfirmation)) {
															b.addClass('disabled');
															revertToPublished()
																.then(function() {
																	options.isStaged = false;
																	$.telligent.evolution.administration.close();
																	$.telligent.evolution.themePreview.enabled(false);
																	reloadConfiguration();
																	$.telligent.evolution.notifications.show(options.text.revertToPublishedSuccessful, { type: 'success' });
																})
																.always(function() {
																	b.removeClass('disabled');
																});
															}
													}
													return false;
												})
										)
								)
								.append(
									$('<span class="field-item-description"></span>')
										.html(options.text.revertToPublishedDescription)
								)
						);
				}

				list
					.append(
						$('<li class="field-item"></li>')
							.append(
								$('<span class="field-item-name"></span>')
									.append(
										$('<a href="#" class="inline-button"></a>')
											.html(options.text.revertToParent)
											.on('click', function() {
												showRevert();
												return false;
											})
									)
							)
							.append(
								$('<span class="field-item-description"></span>')
									.html(options.text.revertToParentDescription)
							)
					);

				d.resolve(fields);
			}).promise(),
			cssClass: 'contextual-configure-theme',
		});
	}

	function showRevert() {
		currentPanel = 'revert-options';
		$.telligent.evolution.administration.open({
			name: options.text.revertToParent,
			content: $.Deferred(function(d) {
				$.telligent.evolution.get({
					url: options.revertOptionsUrl
				})
				.then(function(content) {
					revertOptionsContainer.html(content);
					d.resolve(revertOptionsContainer);
				})
				.catch(function() {
					d.reject();
				});
			}).promise(),
			header: $.Deferred(function(d) {

				var elm = $('<fieldset></fieldset>')
					.append(
						$('<ul class="field-list"></ul>')
							.append(
								$('<li class="field-item"></li>')
									.append(
										$('<span class="field-item-input"></span>')
											.append(
												$('<a href="#"></a>')
													.addClass('button revert two-wide')
													.text(options.text.revertAndPreview)
													.on('click', function(e) {
														var b = $(e.target);
														if (!b.hasClass('disabled')) {
															b.addClass('disabled');
															processRevert(true)
																.always(function() {
																	b.removeClass('disabled');
																});
														}
														return false;
													})
												)
											.append(
												$('<a href="#"></a>')
													.addClass('button revert two-wide')
													.text(options.text.revertAndPublish)
													.on('click', function(e) {
														var b = $(e.target);
														if (!b.hasClass('disabled')) {
															b.addClass('disabled');
															processRevert(false)
																.always(function() {
																	b.removeClass('disabled');
																});
														}
														return false;
													})
												)
											)
										)
									);
				d.resolve(elm);
			}).promise(),
			cssClass: 'contextual-configure-theme',
			shown: function() {
				if ($('input[type="checkbox"]', $.telligent.evolution.administration.panelWrapper()).length == 0) {
					$.telligent.evolution.administration.header().empty();
					$.telligent.evolution.administration.header();
				}
			}
		});
	}

	function savePalettes(stage) {
		return $.Deferred(function(d) {
			var q = {};
			$('select', options.paletteTypesWrapper).each(function() {
				var s = $(this);
				q[s.data('palettetypeid')] = s.val();
			});
			var qs = $.telligent.evolution.url.serializeQuery(q);
			if (qs.length == 0) {
				d.resolve();
				return;
			}

			$.telligent.evolution.post({
				url: options.savePalettesUrl,
				data: {
					defaultPalettes: qs,
					stage: stage
				}
			})
			.then(function(r) {
				d.resolve();
			})
			.catch(function() {
				d.reject();
			})
		});
	}

	function initializePalettes() {
		$('select', options.paletteTypesWrapper).each(function() {
			var s = $(this);
			var itemsHtml = [];
			$('option', s).each(function() {
			   var o = $(this);
			   var css = o.data('previewcss') || '';
			   itemsHtml.push('<div style="' + css + '">' + o.html() + '</div>');
			});

			s.glowDropDownList({
				itemsHtml: itemsHtml,
				showHtml: true,
				selectedItemWidth: 320,
				itemsWidth: 320
			});
		});
	}

	function updateGroupFilter() {
		if (!formOptions) {
			return;
		}

		options.groupFilter.empty();
		var groups = [];

		var panes = formOptions.container.find('.configuration-tab');
		if (panes.length > 1 || (panes.length == 1 && options.paletteTypesWrapper.length > 0)) {
			panes.each(function() {
			   var g = $(this).hide();
			   groups.push([
				   groups.length,
				   g.data('name'),
				   null,
				   function() {
					   formOptions.container.find('.configuration-tab').hide();
					   options.paletteTypesWrapper.hide();
					   g.show();
				   },
				   null
				]);
			});
		}

		if (groups.length > 0 && options.paletteTypesWrapper.length > 0)
		{
			options.paletteTypesWrapper.hide();
			groups.push([
				groups.length,
				options.text.paletteTypes,
				null,
				function() {
					formOptions.container.find('.configuration-tab').hide();
					options.paletteTypesWrapper.show();
				},
				null
			]);
		}

		if (groups.length > 1) {
			var tabs = $('<div></div>');
			options.groupFilter.append(tabs);
			tabs.glowTabSet({
				cssClass: 'filter',
				tabCssClasses: ['filter-option'],
				tabSelectedCssClasses: ['filter-option selected'],
				tabHoverCssClasses: ['filter-option'],
				enableResizing: true,
				tabs: groups
			});

			global.setTimeout(function() {
				$.telligent.evolution.administration.header();
				if (groups.length > 0) {
					tabs.glowTabSet('selected', tabs.glowTabSet('getByIndex', 0));
				}
			}, 200);
		}
	}

	var api = {
		register: function(o) {
			options = o;
			options.groupFilter = $('<div></div>');

			revertOptionsContainer = $('<div></div>');
			revertOptionsContainer.on('click', '.select-all', function() {
				var a = $(this);
				var type = a.data('type');
				var select = a.data('select') || 'all';

				$('input[type="checkbox"]', revertOptionsContainer).each(function() {
					var cb = $(this);
					if (cb.data('type') == type) {
						cb.prop('checked', select == 'all');
					}
				});

				if (select == 'all') {
					a.data('select', 'none').text(options.text.selectNone);
				} else {
					a.data('select', 'all').text(options.text.selectAll);
				}

				return false;
			});

			$.telligent.evolution.administration.header(
				[$('<fieldset></fieldset>')
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
															if (formOptions) {
																var b = $(e.target);
																if (!b.hasClass('disabled')) {
																	b.addClass('disabled');
																	formOptions.save(true)
																		.then(function(response) {
																			savePalettes(true)
																				.then(function() {
																					options.isStaged = true;
																					formOptions.isStaged = true;
																					updateStagedNote();

																					$.telligent.evolution.notifications.show(options.text.saveAndPreviewSuccessful, {
																						type: 'success'
																					});

																					if (!$.telligent.evolution.themePreview.enabled()) {
																						$.telligent.evolution.themePreview.enabled(true);
																						if (response.hasRelatedStagedItems) {
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
																		})
																		.catch(function() {
																			$.telligent.evolution.notifications.show(options.text.saveFailed, {
																				type: 'error'
																			});
																			b.removeClass('disabled');
																		});
																}
															}
															return false;
														})
												)
											.append(
												$('<a href="#"></a>')
													.addClass('button save two-wide')
													.text(options.text.saveAndPublish)
													.on('click', function(e) {
														if (formOptions) {
															var b = $(e.target);
															if (!b.hasClass('disabled')) {
																b.addClass('disabled');
																formOptions.save(false)
																	.then(function() {
																		savePalettes(false)
																			.then(function() {
																				$.telligent.evolution.post({
																					url: options.revertChangesUrl
																				})
																					.then(function() {
																						options.isStaged = false;
																						formOptions.isStaged = false;
																						updateStagedNote();

																						$.telligent.evolution.notifications.show(options.text.saveAndPublishSuccessful, {
																							type: 'success'
																						});
																						$.telligent.evolution.themePreview.enabled(false);
																					})
																					.always(function() {
																						b.removeClass('disabled');
																					});
																			})
																			.catch(function() {
																				b.removeClass('disabled');
																			});
																	})
																	.catch(function() {
																		$.telligent.evolution.notifications.show(options.text.saveFailed, {
																			type: 'error'
																		});
																		b.removeClass('disabled');
																	});
															}
														}
														return false;
													})
											)
									)
							.append(
								$('<li class="field-item panel-instructions"></li>')
									.append($('<div></div>')
										.html(
											$.parseHTML(options.text.instructions +
											' <span class="staged-note" style="display: none;">' + options.text.containsStagedChanges + '</span>')
										))
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
														showRevertOptions();
														return false;
													})
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
				),
				options.groupFilter
				]
			);
			options.openPreview = $('.open-preview', $.telligent.evolution.administration.header());
			options.stagedNote = $('.staged-note', $.telligent.evolution.administration.header());

			formOptions = {
				container: options.form,
				isStaged: options.isStaged,
				save: function(stage) {
					return $.Deferred(function(d) {
						$.telligent.evolution.post({
							url: options.saveUrl,
							data: {
								stage: stage,
								configuration: $.telligent.evolution.url.serializeQuery(options.form.dynamicForm('getValues'))
							}
						})
						.then(function(r) {
							d.resolve(r);
						})
						.catch(function() {
							d.reject();
						})
					}).promise();
				}
			};
			updateStagedNote();
			updateGroupFilter();

			initializePalettes();

			if ($.telligent.evolution.themePreview.enabled()) {
				options.openPreview.show();
			}

			$.telligent.evolution.messaging.subscribe('themepreview.disabled', function() {
				options.openPreview.hide();
			});

			$.telligent.evolution.messaging.subscribe('themepreview.enabled', function() {
				options.openPreview.show();
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.configureTheme = api;

})(jQuery, window);