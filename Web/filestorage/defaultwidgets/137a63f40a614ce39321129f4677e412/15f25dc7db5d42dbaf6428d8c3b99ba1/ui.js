(function($)
{
		if (typeof $.telligent === 'undefined') { $.telligent = {}; }
		if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
		if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var headerList = null;

		var _attachHandlers = function(context) {
				var saveButton = $('a.save-feature');
				saveButton.on('click', function()
				{
						if (!$(this).evolutionValidation('isValid')) {
								return;
						}

						_save(context);
						$.telligent.evolution.administration.close();
						return false;
				});
		},
		_addValidation = function(context) {
            var saveButton = $('a.save-feature');

            saveButton.evolutionValidation({
                validateOnLoad: null,
                onValidated: function(isValid, buttonClicked, c) {
                    if (isValid) {
                            saveButton.removeClass('disabled');
                    } else {
                            saveButton.addClass('disabled');
                    }
                },
                onSuccessfulClick: function(e) {
                    saveButton.parent().addClass('processing');
                    saveButton.addClass('disabled');
                }
            });

            saveButton.evolutionValidation('addCustomValidation', context.endDate,
                function() {
                    var start = $(context.startDate).glowDateTimeSelector('val');
                    var end = $(context.endDate).glowDateTimeSelector('val');

                    if (start == "" || end == "")
                        return true;
                    else
                        return (start < end) && (new Date() < end);
                },
                context.invalidDateRange,
                $(context.endDate).closest('.field-item').find('.field-item-validation'), null);

            $(context.startDate).on('glowDateTimeSelectorChange', function () {
                saveButton.evolutionValidation('validate');
            });

            $(context.endDate).on('glowDateTimeSelectorChange', function () {
                saveButton.evolutionValidation('validate');
            });
		},
		_save = function(context) {
            var saveButton = $('a.save-feature');
            var data = _createPostRequestData(context);

            $.telligent.evolution.post({
                url: context.saveUrl,
                data: data,
                success: function(response)
                {
                    $.telligent.evolution.messaging.publish('ui-feature', {
                        contentId: context.contentId,
                        contentTypeId: context.contentTypeId,
                        typeId: context.typeId,
                        value: true
                    });
                    $.telligent.evolution.notifications.show(context.featuresaved);
                },
                defaultErrorMessage: context.saveErrorText,
                error: function(xhr, desc, ex)
                {
                    if(xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0){
                        $.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0],{type:'error'});
                    }
                    else{
                        $.telligent.evolution.notifications.show(desc,{type:'error'});
                    }
                            saveButton.parent().removeClass('processing');
                            saveButton.removeClass('disabled');
                    }
            });
		},
		_createPostRequestData = function(context) {
            var data = {
                    ContentId: context.contentId,
                    ContentTypeId: context.contentTypeId,
                    TypeId: context.TypeId,
                    StartDate: $.telligent.evolution.formatDate(context.startDate.glowDateTimeSelector('val')),
                    EndDate: $.telligent.evolution.formatDate(context.endDate.glowDateTimeSelector('val')),
                    FileChanged: '0'
            };

            var targets = '';
            var target = $('#' + context.featureTargets).val();
            if (target == 'site')
                    targets = '[{"containerid":"' + context.rootGroupId + '","containertypeid":"' + context.groupContainerTypeId + '"}]'
            else if (target == 'group')
                    targets = '[{"containerid":"' + context.currentGroupId + '","containertypeid":"' + context.groupContainerTypeId + '"}]'
            else if (target == 'both')
                    targets = '[{"containerid":"' + context.rootGroupId + '","containertypeid":"' + context.groupContainerTypeId + '"}, {"containerid":"' + context.currentGroupId + '","containertypeid":"' + context.groupContainerTypeId + '"}]';

            data.Targets = targets;
            if (context.file && context.file.isNew) {
                    data.FileChanged = '1';
                    data.FileName = context.file.fileName;
                    data.FileContextId = context.uploadContextId;
            }
            else if (context.fileRemoved == 1)
                    data.FileRemoved = 1;

            return data;
		};

		$.telligent.evolution.widgets.featuredContentPanel = {
			register: function(context) {

		headerList = $('<ul class="field-list"></ul>')
			.append(
				$('<li class="field-item"></li>')
					.append(
						$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#"></a>')
									.addClass('button save-feature')
									.text(context.text.save)
					)
				)
			);

				$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(headerList));

					context.attachment = $('#' + context.attachmentId);
					context.attachmentUpload = context.attachment.find('a.upload');
					context.attachmentRemove = context.attachment.find('a.remove');
					context.attachmentName = context.attachment.find('input');
					context.attachmentPreview = context.attachment.find('.preview');

					function loadPreview() {
							if (context.file && (context.file.fileName || context.file.url)) {
								clearTimeout(context.attachmentPreviewTimeout);
						 context.attachmentPreviewTimeout = setTimeout(function(){
									var data = {
										w_uploadContextId: context.uploadContextId
									};
									if(context.file.url) {
											data.w_url = context.file.url;
									}
									if (context.file.fileName) {
										data.w_filename = context.file.fileName;
									}
								 $.telligent.evolution.post({
											url: context.previewAttachmentUrl,
											data: data,
											success: function(response) {
													response = $.trim(response);
								if(response && response.length > 0 && response !== context.attachmentPreviewContent) {
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

					context.attachmentName.on('keyup change', function() {
						if (!context.attachmentName.attr('readonly')) {
							context.file = {
								url: $(this).val(),
								isRemote: false,
								isNew: true
							}
							loadPreview();
						}
					});

					context.attachmentRemove.on('click', function() {
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
				fileFilter: [
						{ title : "Image files", extensions : "bmp,jpg,jpeg,gif,png,svg" }
					],
				uploadUrl: context.uploadFileUrl,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function(e) {
							context.uploading = true;
							context.attachmentUpload.html(context.attachmentProgressText.replace('{0}', 0));
					})
					.on('glowUploadComplete', function(e, file) {
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
					.on('glowUploadFileProgress', function(e, details) {
						context.attachmentUpload.html(context.attachmentProgressText.replace('{0}', details.percent));
					})
					.on('glowUploadError', function(e) {
						loadPreview();
						context.uploading = false;
						context.attachmentUpload.html(context.attachmentAddText).removeClass('change').addClass('add')
					});

			$.telligent.evolution.messaging.subscribe('contextual-delete-feature', function (data) {
				var contentId = $(data.target).data('contentid');
				var contentTypeId = $(data.target).data('contenttypeid');

				context.contentId = contentId;
				context.contentTypeId = contentTypeId;

				if (window.confirm(context.deleteConfirmation)) {
					$.telligent.evolution.del({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v3/features.json?contentId=' + context.contentId + '&contentTypeId=' + context.contentTypeId + '&TypeId=' + context.typeId,
						success: function(response) {
                            $.telligent.evolution.messaging.publish('ui-feature', {
                                    contentId: context.contentId,
                                    contentTypeId: context.contentTypeId,
                                    typeId: context.typeId,
                                    value: false
                            });

                            $.telligent.evolution.notifications.show(context.featuredeleted);
                            $.telligent.evolution.administration.close();
						}
					});
				}
				return false;
			});

			context.startDate.glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: false,
					})
			);

			context.endDate.glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: false,
					})
			);

						_attachHandlers(context);
						_addValidation(context);
				}
		};
})(jQuery);
