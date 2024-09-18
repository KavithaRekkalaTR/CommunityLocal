(function($, global, undef) {

	var model = {
		update: function(context, options) {
			return $.telligent.evolution.post({
				url: context.updateUrl,
				dataType: 'json',
				data: options
			});
		}
	};

	var api = {
		register: function(context) {

			var header = $($.telligent.evolution.template.compile(context.saveTemplateId)({}));
			var saveButton = header.find('a.save');

			$.telligent.evolution.administration.header(header);

			context.attachment = $('#' + context.attachmentId);
			context.attachmentUpload = context.attachment.find('a.upload');
			context.attachmentRemove = context.attachment.find('a.remove');
			context.attachmentName = context.attachment.find('input');
			context.attachmentPreview = context.attachment.find('.preview');

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

			context.attachmentRemove.hide();
			if (context.file && context.file.fileName) {
				context.attachmentName.attr('readonly', 'readonly');
				context.attachmentUpload.html(context.attachmentChangeText).removeClass('add').addClass('change');
				context.attachmentRemove.show();
			} else if (context.attachment.data('link') != 'True') {
				context.attachmentName.attr('readonly', 'readonly');
			}

			loadPreview();

			context.attachmentName.on('keyup change', function () {
				if (!context.attachmentName.attr('readonly')) {
					context.file = {
						url: $(this).val(),
						isRemote: false,
						isNew: true
					}
					loadPreview();
				}
			});

			context.attachmentRemove.on('click', function () {
				context.file = null;
				context.fileRemoved = 1;
				context.attachmentName.val('');
				context.attachmentUpload.html(context.attachmentAddText).removeClass('change').addClass('add')
				if (context.attachment.data('link') == 'True') {
					context.attachmentName.removeAttr('readonly');
				}
				context.attachmentRemove.hide();
				loadPreview();
				return false;
			});

			context.attachmentUpload.glowUpload({
				fileFilter: null,
				uploadUrl: context.uploadFileUrl,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				context.uploading = true;
				context.attachmentUpload.html(context.attachmentProgressText.replace('{0}', 0));
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					context.file = {
						fileName: file.name,
						isRemote: false,
						isNew: true
					}
					context.attachmentName.val(context.file.fileName).attr('readonly', 'readonly');
					loadPreview();
					context.uploading = false;
					context.attachmentUpload.html(context.attachmentChangeText).removeClass('add').addClass('change');
					context.attachmentRemove.show();

				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				context.attachmentUpload.html(context.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				loadPreview();
				context.uploading = false;
				context.attachmentUpload.html(context.attachmentChangeText).removeClass('change').addClass('add');
			});
			
			if (context.reviewWorkflowIsEditable) {
    			var reviewWorkflow = $(context.inputs.reviewWorkflow);
    			reviewWorkflow.on('change', function() {
        		    var reviewWorkflowId = reviewWorkflow.val();
        
        		    var data = context.reviewWorkflowConfiguration.getValues();
        		    reviewWorkflow.closest('li').nextAll().remove();
        
        		    if (reviewWorkflowId == '') {
        		        return;
        		    }
        
        		    $.telligent.evolution.post({
        		        url: context.updateReviewWorkflowConfigurationFormUrl,
        		        data: {
        		            reviewWorkflowId: reviewWorkflowId,
        		            reviewWorkflowConfiguration: data != null ? $.telligent.evolution.url.serializeQuery(data) : ''
        		        }
        		    })
        		        .then(function(formHtml) {
        		           reviewWorkflow.closest('li').after(formHtml);
        		        });
        		});
			}

			saveButton.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var updateOptions = {
						enableComments: $(context.inputs.enableComments).is(':checked'),
						enableRating: $(context.inputs.enableRating).is(':checked'),
						displayTrackbacks: $(context.inputs.displayTrackbacks).is(':checked'),
						commentExpirationDays: $(context.inputs.commentExpirationDays).val(),
						aggregatePosts: $(context.inputs.aggregatePosts).is(':checked'),
						enableExcerpts: $(context.inputs.enableExcerpts).is(':checked'),
						excerptLength: $(context.inputs.excerptLength).val(),
						enableAutoName: $(context.inputs.enableAutoName).is(':checked'),
						commentModeration: $(context.inputs.commentModeration).val()
					};
					
					if (context.reviewWorkflowIsEditable) {
					    var reviewConfigurationData = context.reviewWorkflowConfiguration.getValues();
					    
					    updateOptions.reviewWorkflowId = reviewWorkflow.val();
						updateOptions.reviewWorkflowConfiguration = reviewConfigurationData != null ? $.telligent.evolution.url.serializeQuery(reviewConfigurationData) : '';
					}

					if (context.file && context.file.isNew) {
						updateOptions.FileChanged = '1';
						updateOptions.FileName = context.file.fileName;
						updateOptions.FileContextId = context.uploadContextId;
					} else if (context.fileRemoved == 1) {
						updateOptions.FileRemoved = 1;
					}

					model.update(context, updateOptions).then(function(){
						$.telligent.evolution.notifications.show(context.text.updateSuccess, { type: 'success' });
					});
				}
			})
			.evolutionValidation('addField', $(context.inputs.excerptLength), { digits: true }, $(context.inputs.excerptLength).closest('.field-item').find('.field-item-validation'), null)
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.blogPostOptionsApplicationPanel = api;

})(jQuery, window);