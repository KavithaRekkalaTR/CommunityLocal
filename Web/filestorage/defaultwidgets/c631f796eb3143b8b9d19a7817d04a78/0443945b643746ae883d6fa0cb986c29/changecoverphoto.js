(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	function validate(context) {
		var selectedOption = $('input[type="radio"]:checked', context.fields.options);
		var v = selectedOption.val();

		if (v == 'default') {
			return true;
		} else if (v == 'upload') {
			return !context.isUploading && context.file != null && context.file.fileName != null;
		} else {
			return false;
		}
	}

	function updateButtonState(context) {
		if (validate(context)) {
			context.saveButton.removeClass('disabled');
		} else {
			context.saveButton.addClass('disabled');
		}
	}

	$.telligent.evolution.widgets.userAdministrationChangeCoverPhoto = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.saveButton = context.headerWrapper.find('.changecoverphoto');
			context.saveButton.on('click', function() {
				if (!context.saveButton.hasClass('disabled')) {
					context.saveButton.addClass('disabled');

					var selectedOption = $('input[type="radio"]:checked', context.fields.options);
					var v = selectedOption.val();

					var data = {};

					if (v == 'default') {
						data.Change = 'default';
					} else if (v == 'upload') {
						data.Change = 'file';
						data.Filename = context.file.fileName;
						data.UploadContextId = context.uploadContextId
					}

					if (data.Change) {
						$.telligent.evolution.post({
							url: context.urls.save,
							data: data
						})
						.then(function() {
							$.telligent.evolution.notifications.show(context.text.changeCoverPhotoSuccessful, {
								type: 'success'
							});
							$.telligent.evolution.messaging.publish('entity.updated', {
								entity: 'User',
								id: context.userId,
								properties: ['CoverPhotoUrl']
							});
							$.telligent.evolution.administration.close();
						})
						.always(function() {
							context.saveButton.removeClass('disabled');
						});
					} else {
						context.saveButton.removeClass('disabled');
					}
				}
				return false;
			});

			context.lastOption = null;
			$('input[type="radio"]', context.fields.options).on('change input', function() {
				var selectedOption = $('input[type="radio"]:checked', context.fields.options);
				if (selectedOption.val() != context.lastOption) {
					context.lastOption = selectedOption.val();
					$('.field-item-input.options', context.wrapper).slideUp('fast');
					selectedOption.closest('.field-item').find('.options').slideDown('fast');
					updateButtonState(context);
				}
			});

			var uploadParent = context.fields.upload.closest('.field-item');
			context.fields.remove = uploadParent.find('a.remove');
			context.fields.uploadPreview = uploadParent.find('.preview');

			function loadPreview() {
				if (context.file && (context.file.fileName || context.file.url)) {
					clearTimeout(context.uploadPreviewTimeout);
					context.uploadPreviewTimeout = setTimeout(function () {
						$.telligent.evolution.post({
							url: context.urls.preview,
							data: {
								w_uploadContextId: context.uploadContextId,
								w_filename: context.file.fileName,
								w_width: 800,
								w_height: 600,
								w_resizeMethod: 'ScaleDown'
							},
							success: function (response) {
								response = $.trim(response);
								if (response && response.length > 0) {
									if (response !== context.uploadPreviewContent) {
										context.uploadPreviewContent = response;
										context.fields.uploadPreview.html(context.uploadPreviewContent).removeClass('empty');
									}
								} else {
									context.fields.uploadPreview.empty().addClass('empty');
								}
							}
						});
					}, 150);
				} else {
					context.uploadPreviewContent = '';
					context.fields.uploadPreview.empty().addClass('empty');
				}
			}

			context.fields.remove.hide();
			loadPreview();

			context.fields.remove.on('click', function () {
				context.file = null;
				context.fields.upload.html(context.text.uploadAdd).removeClass('change').addClass('add');
				context.fields.remove.hide();
				loadPreview();
				updateButtonState(context);
				return false;
			});

			context.fields.upload.glowUpload({
				uploadUrl: context.urls.uploadFile,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				context.uploading = true;
				context.fields.upload.html(context.text.uploadProgress.replace('{0}', 0));
				updateButtonState(context);
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					context.file = {
						fileName: file.name,
						isRemote: false,
						isNew: true
					};
					loadPreview();
					context.uploading = false;
					context.fields.upload.html(context.text.uploadChange).removeClass('add').addClass('change');
					context.fields.remove.show();
				}
				updateButtonState(context);
			})
			.on('glowUploadFileProgress', function (e, details) {
				context.fields.upload.html(context.text.uploadProgress.replace('{0}', details.percent));
				updateButtonState(context);
			})
			.on('glowUploadError', function(e) {
				loadPreview();
				context.uploading = false;
				context.fields.upload.html(context.text.uploadChange).removeClass('change').addClass('add');
			});

			$('.field-item-input.options', context.wrapper).slideUp('fast');
		}
	};

}(jQuery, window));
