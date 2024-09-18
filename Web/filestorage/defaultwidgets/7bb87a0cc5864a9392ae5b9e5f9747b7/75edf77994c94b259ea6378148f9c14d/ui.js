(function ($) {
		if (typeof $.telligent === 'undefined') { $.telligent = {}; }
		if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
		if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

		var _attachHandlers = function (context) {
				$.telligent.evolution.navigationConfirmation.enable();

				var saveButton = $('#' + context.wrapperId + ' a.save-post');

				$.telligent.evolution.navigationConfirmation.enable();
				$.telligent.evolution.navigationConfirmation.register(saveButton);
		},

		_trackChars = function (context, field, maxLength) {
				var curLen = field.val().length;
				var togo = maxLength - curLen;
				var label = field.parent().next('span.character-count');

				if (togo >= 0) {
						label.html(curLen + ' ' + context.charactersRemain);
						label.removeClass('field-item-validation');
				}
				else {
						label.html((togo * -1) + ' ' + context.charactersOver);
						label.addClass('field-item-validation');
				}
		},
		_addValidation = function (context) {
				var saveButton = $('#' + context.wrapperId + ' a.save-post');

				saveButton.evolutionValidation({
						validateOnLoad: context.mediaId <= 0 ? false : null,
						onValidated: function (isValid, buttonClicked, c) {
								if (isValid && !context.isSaving) {
										saveButton.removeClass('disabled');
								} else {
										saveButton.addClass('disabled');
										var tabbedPane = $('#' + context.tabId).glowTabbedPanes('getByIndex', 0);
										if (tabbedPane) {
												$('#' + context.tabId).glowTabbedPanes('selected', tabbedPane);
										}
								}
						},
						onSuccessfulClick: function (e) {
                            if (!context.isSaving) {
                                context.isSaving = true;
								saveButton.parent().addClass('processing');
								saveButton.addClass('disabled');
								_save(context);
                                return false;
                            }
						}
				});

				// File uploaded
				context.validateFile = saveButton.evolutionValidation('addCustomValidation', 'mediafileuploaded', function () {
						return (context.file != null && !context.uploading && ((!context.file.isRemote && context.file.fileName && context.file.fileName.length > 0) || (context.file.isRemote && context.file.url && context.file.url.length > 0)));
				},
						context.requiredFieldText,
						'#' + context.wrapperId + ' .field-item.post-attachment .field-item-validation',
						null
				);

				// Has name
				saveButton.evolutionValidation('addField', '#' + context.postNameId,
						{
								required: true,
								messages: { required: context.requiredFieldText }
						},
						'#' + context.wrapperId + ' .field-item.post-name .field-item-validation',
						null
				);
		},
		_save = function (context) {
				var data = _createPostRequestData(context);

				$.telligent.evolution.post({
						url: context.saveUrl,
						data: data,
						success: function (response) {
								if (response.message) {
										alert(response.message);
								}

								if (response.redirectUrl) {
										window.location = response.redirectUrl;
								}
						},
						defaultErrorMessage: context.saveErrorText,
						error: function (xhr, desc, ex) {
								if (xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0) {
										$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0], { type: 'error' });
								}
								else {
										$.telligent.evolution.notifications.show(desc, { type: 'error' });
								}
								$('#' + context.wrapperId + ' a.save-post').parent().removeClass('processing');
                                $('#' + context.wrapperId + ' a.save-post').removeClass('disabled');
                                context.isSaving = false;
						}
				});
		},
		_createPostRequestData = function (context) {
				var inTags = $('#' + context.tagBoxId).val().split(/[,;]/g);
				var tags = [];
				for (var i = 0; i < inTags.length; i++) {
						var tag = $.trim(inTags[i]);
						if (tag) {
								tags[tags.length] = tag;
						}
				}
				tags = tags.join(',');

				var data = {
						Title: $('#' + context.postNameId).evolutionComposer('val'),
						Body: context.getBody(),
						Tags: tags,
						GalleryId: context.galleryId,
						FileChanged: '0'
				};

				var subscribe = $('#' + context.subscribeId);
				if (subscribe.length > 0)
						data.Subscribe = subscribe.is(':checked') ? 1 : 0;
				else
						data.Subscribe = -1;

				if (context.file && context.file.isNew) {
						data.FileChanged = '1';
						if (context.file.isRemote) {
								data.FileName = context.file.url;
								data.FileUrl = context.file.url;
								data.FileIsRemote = '1';
						}
						else {
								data.FileName = context.file.fileName;
								data.FileContextId = context.uploadContextId;
								data.FileIsRemote = '0';
						}
				}

				if (context.mediaId > 0) {
						data.Id = context.mediaId;
				}

				// ogImage
				if (context.ogImage) {
						if (context.ogImage.isNew) {
								data.OpenGraphImageFileName = context.ogImage.fileName;
								data.OpenGraphImageContext = context.ogUploadContextId;
						}
				} else {
						data.RemoveOpenGraphImage = 'True'
				}

				if (context.metaTitle && context.metaTitle.length > 0)
						data.MetaTitle = context.metaTitle.val();
				if (context.metaKeywords && context.metaKeywords.length > 0)
						data.MetaKeywords = context.metaKeywords.val();
				if (context.metaDescription && context.metaDescription.length > 0)
						data.MetaDescription = context.metaDescription.val();
				return data;
		};

		$.telligent.evolution.widgets.uploadEditMediaGalleryPost = {
				register: function (context) {
						$('#' + context.postNameId).evolutionComposer({
								plugins: ['hashtags'],
								contentTypeId: context.mediaContentTypeId
						}).evolutionComposer('onkeydown', function (e) {
								if (e.which === 13) {
										return false;
								} else {
										return true;
								}
						});

						// tab setup
						$(context.tabsSelector).glowTabbedPanes({
								cssClass: 'tab-pane',
								tabSetCssClass: 'tab-set with-panes',
								tabCssClasses: ['tab'],
								tabSelectedCssClasses: ['tab selected'],
								tabHoverCssClasses: ['tab hover'],
								enableResizing: false,
								tabs: [
								[context.writeTabId, context.writeTabLabel, null],
								[context.optionsTabId, context.optionsTabLabel, null]
								]
						});

						$('#' + context.tagBoxId).evolutionTagTextBox({ applicationId: context.applicationId });

						context.attachment = $('#' + context.attachmentId);
						context.attachmentUpload = context.attachment.find('a.upload');
						context.attachmentRemove = context.attachment.find('a.remove');
						context.attachmentName = context.attachment.find('input');
						context.attachmentPreview = context.attachment.find('.preview');

						context.ogImageFile = $('#' + context.openGraphImageId);
						context.ogImageUpload = context.ogImageFile.find('a.upload');
						context.ogImageName = context.ogImageFile.find('input');
						context.ogImagePreview = context.ogImageFile.find('.preview');
						context.ogImageRemove = context.ogImageFile.find('a.remove');

						function loadPreview() {
								if (context.file && (context.file.fileName || context.file.url)) {
										clearTimeout(context.attachmentPreviewTimeout);
										context.attachmentPreviewTimeout = setTimeout(function () {
												var data = {
														w_uploadContextId: context.uploadContextId
												};
												if (context.file.url) {
														data.w_url = context.file.url;
												}
												if (context.file.fileName) {
														data.w_filename = context.file.fileName;
												}
												$.telligent.evolution.post({
														url: context.previewAttachmentUrl,
														data: data,
														success: function (response) {
																response = $.trim(response);
																if (response && response.length > 0 && response !== context.attachmentPreviewContent) {
																		context.attachmentPreviewContent = response;
																		context.attachmentPreview.html(context.attachmentPreviewContent).removeClass('empty');
																}
														}
												});
										}, 150);
								} else {
										context.attachmentPreviewContent = '';
										context.attachmentPreview.html('').addClass('empty');
								}
						}
						function loadOpenGraphPreview() {
								if (context.ogImage && (context.ogImage.fileName || context.ogImage.url)) {
										clearTimeout(context.ogImagePreviewTimeout);
										context.ogImagePreviewTimeout = setTimeout(function () {
												var data = {
														w_uploadContextId: context.ogUploadContextId
												};
												if (context.ogImage.fileName) {
														data.w_filename = context.ogImage.fileName;
												}


												if (context.ogImage.url) {
														data.w_url = context.ogImage.url;
												}

												$.telligent.evolution.post({
														url: context.previewAttachmentUrl,
														data: data,
														success: function (response) {
																response = $.trim(response);
																if (response && response.length > 0 && response !== context.attachmentPreviewContent) {
																		context.attachmentPreviewContent = response;
																		context.ogImagePreview.html(context.attachmentPreviewContent).removeClass('empty');
																}
														}
												});
										}, 150);
								} else {
										context.attachmentPreviewContent = '';
										context.ogImagePreview.html('').addClass('empty');
								}
						}
						context.attachmentRemove.hide();
						if (context.file && context.file.url && context.file.isRemote) {
								context.attachmentRemove.hide();
						} else if (context.file && context.file.fileName && !context.file.isRemote) {
								context.attachmentName.attr('readonly', 'readonly');
								context.attachmentUpload.html(context.attachmentChangeText).removeClass('add').addClass('change');
								context.attachmentRemove.show();
						} else if (context.attachment.data('link') != 'True') {
								context.attachmentName.attr('readonly', 'readonly');
						}

						loadOpenGraphPreview();
						loadPreview();

						context.attachmentName.on('keyup change', function () {
								if (!context.attachmentName.attr('readonly')) {
										context.file = {
												url: $(this).val(),
												isRemote: true,
												isNew: true
										}
										context.validateFile();
										loadPreview();
								}
						});


						_trackChars(context, context.metaTitle, 55);
						context.metaTitle.on('keyup', function () {
								_trackChars(context, $(this), 55);
						});
						_trackChars(context, context.metaDescription, 150);
						context.metaDescription.on('keyup', function () {
								_trackChars(context, $(this), 150);
						});


						context.attachmentRemove.on('click', function () {
								context.file = null;
								context.attachmentName.val('');
								context.attachmentUpload.html(context.attachmentAddText).removeClass('change').addClass('add')
								if (context.attachment.data('link') == 'True') {
										context.attachmentName.removeAttr('readonly');
								}
								context.attachmentRemove.hide();
								context.validateFile();
								loadPreview();
								return false;
						});

						context.attachmentUpload.glowUpload({
								fileFilter: null,
								uploadUrl: context.uploadFileUrl,
								renderMode: 'link',
								contentTypeId: context.mediaContentTypeId,
                				applicationTypeId: context.applicationTypeId,
                				applicationId: context.applicationId
						})
			.on('glowUploadBegun', function (e) {
					context.uploading = true;
					context.attachmentUpload.html(context.attachmentProgressText.replace('{0}', 0));
					context.validateFile();
			})
					.on('glowUploadComplete', function (e, file) {
							if (file && file.name.length > 0) {
									context.file = {
											fileName: file.name,
											isRemote: false,
											isNew: true
									}
									context.attachmentName.val(context.file.fileName).attr('readonly', 'readonly');
									context.uploading = false;
									context.validateFile();
									loadPreview();
									context.attachmentUpload.html(context.attachmentChangeText).removeClass('add').addClass('change');
									context.attachmentRemove.show();

									context.validateFile();
							}
					})
					.on('glowUploadFileProgress', function (e, details) {
							context.uploading = true;
							context.attachmentUpload.html(context.attachmentProgressText.replace('{0}', details.percent));
							context.validateFile();
					})
					.on('glowUploadError', function(e) {
						 context.uploading = false;
						 context.file = null;
						context.attachmentName.val('');
						context.attachmentUpload.html(context.attachmentAddText).removeClass('change').addClass('add')
						if (context.attachment.data('link') == 'True') {
								context.attachmentName.removeAttr('readonly');
						}
						context.attachmentRemove.hide();
						context.validateFile();
						loadPreview();
					});

						$('#' + context.wrapperId + ' .delete-post').on('click', function () {
								if (window.confirm(context.deleteConfirmation)) {
										var redirectUrl = $(this).data('successurl');
										$.telligent.evolution.del({
												url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/media/{MediaGalleryId}/files/{FileId}.json',
												data: {
														MediaGalleryId: context.galleryId,
														FileId: context.mediaId
												},
												success: function (response) {
														$.telligent.evolution.navigationConfirmation.ignoreClick();
														window.location = redirectUrl;
												}
										});
								}
								return false;
						});
						
            			$(context.cancelLink).on('click', function () {
            				if (confirm(context.cancelConfirmationText)) {
            				    $.telligent.evolution.navigationConfirmation.ignoreClick();
                                window.history.back();
            				}
            				return false;
            			});						

						context.ogImageRemove.on('click', function () {
								context.ogImage = null;
								context.ogImageName.val('');
								context.ogImageUpload.html(context.attachmentAddText).removeClass('change').addClass('add');
								context.ogImageRemove.hide();
								loadOpenGraphPreview();
								return false;
						});

						context.ogImageUpload.glowUpload({
								fileFilter: null,
								uploadUrl: context.ogUploadFileUrl,
								renderMode: 'link',
								type: 'image',
								contentTypeId: context.mediaContentTypeId,
                				applicationTypeId: context.applicationTypeId,
                				applicationId: context.applicationId
						})
							.on('glowUploadBegun', function (e) {
									context.uploading = true;
									context.ogImageUpload.html(context.attachmentProgressText.replace('{0}', 0));
							})
							.on('glowUploadComplete', function (e, file) {
									if (file && file.name.length > 0) {
											context.ogImage = {
													fileName: file.name,
													url: null,
													isNew: true
											};
											context.ogImageName.val(context.ogImage.fileName).attr('readonly', 'readonly');
											loadOpenGraphPreview();
											context.uploading = false;
											context.ogImageUpload.html(context.attachmentChangeText).removeClass('add').addClass('change');
											context.ogImageRemove.show();
									}
							})
							.on('glowUploadFileProgress', function (e, details) {
									context.ogImageUpload.html(context.attachmentProgressText.replace('{0}', details.percent));
							})
							.on('glowUploadError', function(e) {
								context.uploading = false;
								context.ogImage = null;
								context.ogImageName.val('');
								context.ogImageUpload.html(context.attachmentAddText).removeClass('change').addClass('add');
								context.ogImageRemove.hide();
								loadOpenGraphPreview();
							});

						_attachHandlers(context);
						_addValidation(context);

				}
		};
})(jQuery);