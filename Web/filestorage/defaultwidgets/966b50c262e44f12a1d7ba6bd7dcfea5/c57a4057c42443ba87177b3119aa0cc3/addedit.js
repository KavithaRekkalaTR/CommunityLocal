(function ($, global) {

	var spinner = '<span class="ui-loading" width="48" height="48"></span>'

	function attachHandlers(context) {
		var saveButton = $('a.save-achievement', $.telligent.evolution.administration.header());
		saveButton.evolutionValidation({
			validateOnLoad: context.achievementId != null,
			onValidated: function(isValid, buttonClicked, c) {
			    if (isValid) {
			        saveButton.removeClass('disabled');
			    } else {
			        saveButton.addClass('disabled');
			    }
			},
			onSuccessfulClick: function(e) {
                if (!saveButton.hasClass('disabled')) {
					saveButton.addClass('disabled');

					var data = {
						Title: context.fields.title.val(),
						Criteria: context.criteria.getValue(),
						Enabled: context.fields.enable.is(':checked'),
						AutomationId: context.fields.automation.val()
					};

					if (data.AutomationId == '') {
					    data.RemoveAutomation = true;
					} else {
					    var automationConfiguration = context.automationConfiguration.getValues();
					    if (automationConfiguration != null) {
					        data.AutomationConfiguration = $.telligent.evolution.url.serializeQuery(automationConfiguration);
					    }
					}

					if (context.file && context.file.fileName) {
						data.BadgeIconName = context.file.fileName;
						data.BadgeIconUploadContext = context.uploadContextId;
					}

					var saveUrl = $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/achievement.json';
					var saveFunc = $.telligent.evolution.post;
					if (context.achievementId) {
					    saveUrl = $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/achievement/{AchievementId}.json';
					    saveFunc = $.telligent.evolution.put;
					    data.AchievementId = context.achievementId;
					}

					saveFunc({
						url: saveUrl,
						data: data
					})
					.then(function(response) {
						if (context.achievementId) {
						    $.telligent.evolution.notifications.show(context.text.achievementEditedSuccessful);
						} else {
							$.telligent.evolution.notifications.show(context.text.achievementCreatedSuccessful);
						}
						$.telligent.evolution.messaging.publish('achievements.refresh', {});
						$.telligent.evolution.administration.close();
					})
    					.always(function() {
                            saveButton.removeClass('disabled');
    					});
				}

				return false;
			}
		});

		saveButton.evolutionValidation('addField', context.fieldIds.title, { required: true }, '.field-item.title .field-item-validation');

		var criteriaValidate = saveButton.evolutionValidation('addCustomValidation', 'criteria', function() {
		    return $.trim(context.criteria.getValue().replace(/<[^>]*>/g, '')).length > 0;
		}, context.text.criteriaRequired, '.field-item.criteria .field-item-validation', null);
		context.criteria.attachChange(criteriaValidate);

		var iconValidate = saveButton.evolutionValidation('addCustomValidation', 'icon', function() {
		    return context.file != null;
		}, context.text.iconRequired, '.field-item.icon .field-item-validation', null);
		context.fields.icon_upload.on('glowUploadComplete glowUploadError', function () {
		    global.setTimeout(iconValidate, 100);
		});

		context.fields.automation.on('change', function() {
		    var automationId = context.fields.automation.val();

		    var data = context.automationConfiguration.getValues();
		    context.fields.automation.closest('li').nextAll().remove();

		    if (automationId == '') {
		        return;
		    }

		    $.telligent.evolution.post({
		        url: context.urls.updateAutomationConfigurationForm,
		        data: {
		            achievementId: context.achievementId,
		            automationId: automationId,
		            automationConfiguration: data != null ? $.telligent.evolution.url.serializeQuery(data) : ''
		        }
		    })
		        .then(function(formHtml) {
		           context.fields.automation.closest('li').after(formHtml);
		        });
		});
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};

	$.telligent.evolution.widgets.administrationAchievementsAddEdit = {
	    register: function (context) {
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			$.telligent.evolution.administration.header($.telligent.evolution.template.compile(context.headerTemplateId)());

            context.fields = {
                title: $(context.fieldIds.title),
                icon: $(context.fieldIds.icon),
                enable: $(context.fieldIds.enable),
                automation: $(context.fieldIds.automation)
            };

			context.fields.icon_upload = context.fields.icon.find('a.upload');
			context.fields.icon_preview = context.fields.icon.find('.preview');

			function loadPreview() {
				if (context.file && (context.file.url || context.file.fileName)) {
					clearTimeout(context.iconPreviewTimeout);
					context.iconPreviewTimeout = setTimeout(function () {
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
							url: context.urls.previewFile,
							data: data
						})
                            .then(function (response) {
								response = $.trim(response);
								if (response && response.length > 0 && response != context.filePreviewHtml) {
									context.filePreviewHtml = response;
									context.fields.icon_preview.html(context.filePreviewHtml).removeClass('empty');
								}
    						});
					}, 150);
				} else {
					context.filePreviewHtml = '';
					context.fields.icon_preview.html('').addClass('empty');
				}
			}

			loadPreview();

			context.fields.icon_upload.glowUpload({
				uploadUrl: context.urls.uploadFile,
				renderMode: 'link',
				type: 'image'
			})
    			.on('glowUploadBegun', function (e) {
    				context.fields.icon_upload.html(context.text.uploadProgress.replace('{0}', 0));
    			})
    			.on('glowUploadComplete', function (e, file) {
    				if (file && file.name.length > 0) {
    					context.file = {
    						fileName: file.name
    					};
    					loadPreview();
    					context.fields.icon_upload.html(context.text.upload);
    				}
    			})
    			.on('glowUploadFileProgress', function (e, details) {
    			    context.fields.icon_upload.html(context.text.uploadProgress.replace('{0}', details.percent));
    			})
    			.on('glowUploadError', function(e) {
    				loadPreview();
    				context.fields.icon_upload.html(context.text.upload);
    			});

            attachHandlers(context);
	    }
	}

})(jQuery, window);