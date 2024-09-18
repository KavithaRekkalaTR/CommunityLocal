(function($, global) {

	var options = null;
	var formOptions = null;
	var revertOptionsContainer = null;

	function revertToPublished() {
		return $.telligent.evolution.post({
			url: options.revertToPublishedUrl
		});
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
    				$.telligent.evolution.notifications.show(success, { type: 'success' });
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
													.addClass('button revert')
													.text(options.text.revert)
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

	function updateGroupFilter() {
		if (!formOptions) {
			return;
		}

		options.groupFilter.empty();
		var groups = [];

		var panes = formOptions.container.find('.configuration-tab');
		if (panes.length > 1) {
			panes.each(function() {
			   var g = $(this).hide();
			   groups.push([
				   groups.length,
				   g.data('name'),
				   null,
				   function() {
					   formOptions.container.find('.configuration-tab').hide();
					   g.show();
				   },
				   null
				]);
			});
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

	function updateSaveStatus(options) {
	    if (options.isStaged) {
	        options.save.removeClass('disabled');
	    } else {
	        options.save.addClass('disabled');
	    }
	}

	// Prompts for a language, and returns a promise that resolves with the language key or rejects if canceled
	function promptLanguage(context) {
		return new Promise((resolve, reject) => {
			var modalContent = $(context.selectLanguageTemplate({}));
			var langSelect = modalContent.find('.select-language select');

			modalContent.on('click', 'a.continue', e => {
				e.preventDefault();
				$.glowModal.close(langSelect.val());
				return false;
			});

			$.glowModal({
				title: context.text.sendSample,
				html: modalContent,
				width: 550,
				onClose: result => {
					if (!result)
						reject();
					else
						resolve(result);
				}
			});
		});
	}

	var api = {
		register: function(o) {
			options = o;
			options.groupFilter = $('<div></div>');

			options.autoSaveTimeoutHandle = null;

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

			options.selectLanguageTemplate = $.telligent.evolution.template(options.selectLanguageTemplate);

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
													.addClass('button save')
													.text(options.text.save)
													.on('click', function(e) {
														if (formOptions) {
															var b = $(e.target);
															if (!b.hasClass('disabled')) {
																b.addClass('disabled');
																formOptions.save(false)
																	.then(function() {
																		$.telligent.evolution.post({
																			url: options.revertChangesUrl
																		})
																			.then(function() {
																				options.isStaged = false;
																				formOptions.isStaged = false;

																				$.telligent.evolution.notifications.show(options.text.saveSuccessful, {
																					type: 'success'
																				});
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
									))
							.append(
								$('<li class="field-item panel-instructions"></li>')
									.append($('<div></div>')
										.html($.parseHTML(options.text.instructions))
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
													.addClass('preview-email inline-button')
													.text(options.text.previewEmail)
													.on('click', async e => {
														e.preventDefault();

														global.open(options.getPreviewHtmlUrl, 'preview-template');
														return false;
													})
											)
											.append(
												$('<a href="#"></a>')
													.addClass('send-preview-email inline-button')
													.text(options.text.sendPreviewEmail)
													.on('click', async e => {
														e.preventDefault();

														var language = null;
														if (options.languagesCount > 1) {
															try {
																language = await promptLanguage(options);
															} catch (e) {
																return;
															}
														}

														await $.telligent.evolution.post({
															url: options.sendPreviewEmailUrl,
															data: {
																language: language
															}
														});

														$.telligent.evolution.notifications.show(options.text.sendPreviewEmailSuccessful, {
															type: 'success'
														});

														return false;
													})
											)
									)
							)
					)
				),
				options.groupFilter
				]
			);

			options.save = $('.button.save', $.telligent.evolution.administration.header());
			updateSaveStatus(options);

			formOptions = {
				container: options.form,
				isStaged: options.isStaged,
				save: function(stage) {
				    global.clearTimeout(options.autoSaveTimeoutHandle);
					return $.Deferred(function(d) {
						$.telligent.evolution.post({
							url: options.saveUrl,
							data: {
								stage: stage,
								configuration: $.telligent.evolution.url.serializeQuery(options.form.dynamicForm('getValues'))
							}
						})
						.then(function(r) {
						    if (stage) {
						        options.isStaged = true;
						    } else {
						        options.isStaged = false;
						    }
						    updateSaveStatus(options);

							d.resolve(r);
						})
						.catch(function() {
							d.reject();
						})
					}).promise();
				}
			};
			updateGroupFilter();

			options.form.dynamicForm('onChange', function() {
			    global.clearTimeout(options.autoSaveTimeoutHandle);
			    options.autoSaveTimeoutHandle = global.setTimeout(function() {
			        formOptions.save(true);
			    }, 1000);
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.configureEmailTemplate = api;

})(jQuery, window);