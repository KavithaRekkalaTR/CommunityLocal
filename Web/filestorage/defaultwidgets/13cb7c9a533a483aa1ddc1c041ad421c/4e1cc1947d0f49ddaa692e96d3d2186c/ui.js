(function($, global, undef)
{
		var importOptionsContainer = null;

		function processImport(context, fileName, stage) {
			return $.Deferred(function(d) {
				var message = context.text.importConfirmation;
				var success = context.text.importSuccess;
				var successReload = context.text.importSuccessReload;
				var successPreview = context.text.importPreviewSuccess;
				if (context.isDefault) {
					message = context.text.importAsDefaultConfirmation;
					success = context.text.importAsDefaultSuccess;
					successReload = context.text.importAsDefaultSuccessReload;
					successPreview = context.text.importAsDefaultPreviewSuccess;
				}

				if (stage || global.confirm(message)) {
					var refresh = false;
					var ids = [];
					$('input[type="checkbox"]:checked', importOptionsContainer).each(function() {
						var cb = $(this);

						if (cb.data('pagename') == context.currentPageName || cb.data('refresh')) {
							refresh = true;
						}

						ids.push(cb.attr('value'));
					});

					$.telligent.evolution.post({
						url: context.importUrl,
						data: {
							filename: fileName,
							uploadContextId: context.uploadContextId,
							import: ids,
							stage: stage
						}
					})
					.then(function() {
						if (stage) {
							$.telligent.evolution.notifications.show(successPreview, { type: 'success' });
							$.telligent.evolution.themePreview.enabled(true);
							global.location = context.previewThemeUrl;
						} else {
							if (refresh) {
								if (global.confirm(successReload)) {
									global.location.reload();
								}
							} else {
								$.telligent.evolution.notifications.show(success, { type: 'success' });
							}

							if (context.isDefault) {
								$.telligent.evolution.administration.close();
							}
							$.telligent.evolution.administration.close();
						}
						d.resolve();
					})
					.catch(function() {
						d.reject();
					})
				} else {
					d.reject();
				}
			});
		}

		function showOptions(context, fileName, loaded) {
			return $.telligent.evolution.administration.open({
				name: context.text.importComponents,
				content: $.Deferred(function(d) {
					$.telligent.evolution.get({
						url: context.importOptionsUrl,
						data: {
							_w_filename: fileName,
							_w_uploadContextId: context.uploadContextId
						}
					})
					.then(function(content) {
						importOptionsContainer.html(content);
						d.resolve(importOptionsContainer);
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
														.addClass('button import stage two-wide')
														.text(context.text.importAndPreview)
														.on('click', function(e) {
															var b = $(e.target);
															if (!b.hasClass('disabled')) {
																b.addClass('disabled');
																processImport(context, fileName, true)
																	.always(function() {
																		b.removeClass('disabled');
																	});
															}

															return false;
														})
													)
												.append(
													$('<a href="#"></a>')
														.addClass('button import publish two-wide')
														.text(context.text.importAndPublish)
														.on('click', function(e) {
															var b = $(e.target);
															if (!b.hasClass('disabled')) {
																b.addClass('disabled');
																processImport(context, fileName, false)
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
				cssClass: 'contextual-import-theme',
				loaded: loaded,
				shown: function() {
					if ($('input[type="checkbox"]', $.telligent.evolution.administration.panelWrapper()).length == 0) {
						$.telligent.evolution.administration.header().empty();
						$.telligent.evolution.administration.header();
					}
				}
			});
		}

		var api = {
			register: function(context) {
				importOptionsContainer = $('<div></div>');
				importOptionsContainer.on('click', '.select-all', function() {
					var a = $(this);
					var type = a.data('type');
					var select = a.data('select') || 'all';

					$('input[type="checkbox"]', importOptionsContainer).each(function() {
						var cb = $(this);
						if (cb.data('type') == type) {
							cb.prop('checked', select == 'all');
						}
					});

					if (select == 'all') {
						a.data('select', 'none').text(context.text.selectNone);
					} else {
						a.data('select', 'all').text(context.text.selectAll);
					}

					return false;
				});

				context.uploadForm = $('fieldset', $.telligent.evolution.administration.panelWrapper());

				context.uploadButton.glowUpload({
					fileFilter: [
						{ title : "Theme export files", extensions : "xml" }
					],
					fileFilter: null,
					uploadUrl: context.uploadUrl,
					renderMode: 'link'
				})
				.on('glowUploadBegun', function(e) {
					context.uploadForm.hide();
					context.uploading.fadeIn('fast');
					context.uploading.html(context.text.uploading.replace(/\{0\}/g, '0'));
				})
				.on('glowUploadComplete', function(e, file) {
					if (file && file.name.length > 0) {
						showOptions(context, file.name, function() {
							context.uploadForm.show();
							context.uploading.hide();
						});
					}
				})
				.on('glowUploadFileProgress', function(e, details) {
					context.uploading.html(context.text.uploading.replace(/\{0\}/g, details.percent));
				})
				.on('glowUploadError', function() {
					context.uploadForm.show();
					context.uploading.hide();
				})
			}
		};

		if (typeof $.telligent === 'undefined') { $.telligent = {}; }
		if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
		if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

		$.telligent.evolution.widgets.importTheme = api;

})(jQuery, window);
