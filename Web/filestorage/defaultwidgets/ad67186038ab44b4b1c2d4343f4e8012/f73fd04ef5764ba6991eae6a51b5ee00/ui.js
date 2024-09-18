(function ($, global) {
		if (typeof $.telligent === 'undefined') { $.telligent = {}; }
		if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
		if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

		$.telligent.evolution.widgets.changeUserAvatar = {
				register: function (context) {

						context.avatar = $('#' + context.avatarId);
						context.avatarUpload = context.avatar.find('a.upload');
						context.avatarRemove = context.avatar.find('a.remove');
						context.avatarSelect = context.avatar.find('a.select');
						context.avatarName = context.avatar.find('input');
						context.avatarPreview = context.avatar.find('.preview');

						function loadPreview() {
								global.clearTimeout(context.avatarPreviewTimeout);
								context.avatarPreviewTimeout = global.setTimeout(function () {
										var data = {
												w_uploadContextId: context.uploadContextId
										};
										if (context.file) {
												if (context.file.url) {
														data.w_url = context.file.url;
												}
												if (context.file.fileName) {
														data.w_filename = context.file.fileName;
												}
										}
										$.telligent.evolution.post({
												url: context.previewUrl,
												data: data,
												success: function (response) {
														response = $.trim(response);
														if (response && response.length > 0 && response !== context.avatarPreviewContent) {
																context.avatarPreviewContent = response;
																context.avatarPreview.html(context.avatarPreviewContent).removeClass('empty');
														}
												}
										});
								}, 150);
						}

						if (context.file) {
								context.avatarUpload.html(context.avatarChangeText).removeClass('add').addClass('change');
						} else {
								context.avatarRemove.hide();
						}

						if (context.file && !context.file.isRemote) {
								context.avatarName.attr('readonly', 'readonly').hide();
						}

						if (context.avatar.data('link') != 'True') {
								context.avatarName.attr('readonly', 'readonly').hide();
						}

						$('#' + context.wrapperId + ' .selectable-avatars').hide();

						context.avatarName.on('change input', function () {
								if (!context.avatarName.attr('readonly')) {
										context.file = {
												url: $(this).val(),
												isRemote: true,
												isNew: true
										}
										if ($(this).val().length > 0) {
												context.avatarRemove.show();
										} else {
												context.avatarRemove.hide();
										}
										context.fileRemoved = false;
										context.validateFile();
										loadPreview();
								}
						});

						context.avatarRemove.on('click', function () {
								context.file = null;
								context.fileRemoved = true;
								context.avatarName.val('');
								context.avatarUpload.html(context.addText).removeClass('change').addClass('add')
								if (context.avatar.data('link') == 'True') {
										context.avatarName.removeAttr('readonly').show();
								}
								context.avatarRemove.hide();
								context.validateFile();
								loadPreview();
								return false;
						});

						context.avatarUpload.glowUpload({
								fileFilter: null,
								uploadUrl: context.uploadFileUrl,
								renderMode: 'link',
								type: 'image'
						})
			.on('glowUploadBegun', function (e) {
					context.uploading = true;
					context.avatarUpload.html(context.progressText.replace('{0}', 0));
					context.validateFile();
			})
					.on('glowUploadComplete', function (e, file) {
							if (file && file.name.length > 0) {
									context.file = {
											fileName: file.name,
											isRemote: false,
											isNew: true
									}
									context.fileRemoved = false;
									context.avatarName.val(context.file.fileName).attr('readonly', 'readonly').hide();
									context.uploading = false;
									context.validateFile();
									loadPreview();
									context.avatarUpload.html(context.changeText).removeClass('add').addClass('change');
									context.avatarRemove.show();
							}
					})
					.on('glowUploadFileProgress', function (e, details) {
							context.uploading = true;
							context.avatarUpload.html(context.progressText.replace('{0}', details.percent));
							context.validateFile();
					})
					.on('glowUploadError', function(e) {
						context.uploading = false;
						context.validateFile();
						loadPreview();
						context.avatarUpload.html(context.changeText).removeClass('change').addClass('add');
					});

					context.avatarSelect.on('click', function() {
							$('title').html(context.selectTitleText);
								$('#' + context.wrapperId + ' .change-avatar').hide();
								$('#' + context.wrapperId + ' .selectable-avatars').show();
								return false;
					});

					$('#' + context.wrapperId + ' a.cancel-selection').on('click', function() {
								$('#' + context.wrapperId + ' .change-avatar').show();
								$('#' + context.wrapperId + ' .selectable-avatars').hide();
								$('title').html(context.titleText);
								return false;
					});

					$('#' + context.wrapperId + ' .selectable-avatars').on('click', 'a.selectable-avatar', function() {
							var url = $(this).data('url');
							context.file = {
									url: url,
									name: null,
									isRemote: false,
									isNew: true
							};
							context.fileRemoved = false;
							context.avatarName.val(context.file.fileName).attr('readonly', 'readonly').hide();
								context.uploading = false;
								context.validateFile();
								loadPreview();
								context.avatarUpload.html(context.changeText).removeClass('add').addClass('change');
								context.avatarRemove.show();
								$('#' + context.wrapperId + ' .change-avatar').show();
								$('#' + context.wrapperId + ' .selectable-avatars').hide();
								$('title').html(context.titleText);
								return false;
					});

					var saveButton = $('#' + context.wrapperId + ' a.save-avatar');
						saveButton.evolutionValidation({
								validateOnLoad: true,
								onValidated: function (isValid, buttonClicked, c) {
										if (isValid) {
												saveButton.removeClass('disabled');
										} else {
												saveButton.addClass('disabled');
										}
								},
								onSuccessfulClick: function (e) {
										saveButton.parent().addClass('processing');
										saveButton.addClass('disabled');

										var data = {};

										if (context.file && context.file.fileName && context.file.isNew) {
									data.FileChanged = '1';
									data.FileName = context.file.fileName;
									data.FileContextId = context.uploadContextId;
								}
								else if (context.file && context.file.url && context.file.isNew) {
										data.FileChanged = '2';
										data.FileName = context.file.url;
								} else if (context.fileRemoved == 1)
									data.FileRemoved = 1;

										$.telligent.evolution.post({
												url: context.saveUrl,
												data: data,
										})
												.then(function() {
													$.glowModal.close();
												})
												.catch(function() {
													saveButton.parent().removeClass('processing');
													saveButton.removeClass('disabled');
												});

										return false;
								}
						});

						// File uploaded
						context.validateFile = saveButton.evolutionValidation('addCustomValidation', 'mediafileuploaded', function () {
								return (!context.uploading);
						},
								context.waitForUploadText,
								'#' + context.wrapperId + ' .field-item.post-attachment .field-item-validation',
								null
						);
				}
		};
})(jQuery, window);
