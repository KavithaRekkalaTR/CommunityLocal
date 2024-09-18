(function ($, global) {

	var spinner = '<span class="ui-loading" width="48" height="48"></span>'

	function attachHandlers(context) {
		var saveButton = $('a.save-pointfactor', $.telligent.evolution.administration.header());
		saveButton.evolutionValidation({
			validateOnLoad: context.pointFactorId != null,
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
						Description: context.description.getValue(),
						Points: context.fields.points.val(),
						UpdatePoints: context.fields.updatePoints.is(':checked'),
						Enabled: context.fields.enable.is(':checked'),
						AutomationId: context.fields.automation.val()
					};

					if (data.AutomationId == '') {
					    data.RemoveAutomation = true;
					} else {
					    var configData = context.automationConfiguration.getValues();
					    if (configData != null) {
					        data.AutomationConfiguration = $.telligent.evolution.url.serializeQuery(configData);
					    }
                    }

					if (context.pointFactorId) {
					    data.PointFactorId = context.pointFactorId;
					}

                    $.telligent.evolution.post({
						url: context.urls.addUpdatePointFactor,
						data: data
                    })
		            .then(function() {
                        if (context.pointFactorId) {
						    $.telligent.evolution.notifications.show(context.text.pointFactorEditedSuccessful);
						} else {
                            $.telligent.evolution.notifications.show(context.text.pointFactorCreatedSuccessful);
						}

                        $.telligent.evolution.messaging.publish('pointFactors.refresh', {});
						$.telligent.evolution.administration.close();
                    })
		            .always(function() {
		                saveButton.removeClass('disabled');
		            });
				}

				return false;
			}
		});

		saveButton.evolutionValidation('addField', context.fieldIds.automation, { required: true }, '.field-item.automation .field-item-validation');
		saveButton.evolutionValidation('addField', context.fieldIds.title, { required: true }, '.field-item.title .field-item-validation');
		saveButton.evolutionValidation('addField', context.fieldIds.points, { required: true }, '.field-item.points .field-item-validation');

		var descriptionValidate = saveButton.evolutionValidation('addCustomValidation', 'description', function() {
		    return $.trim(context.description.getValue().replace(/<[^>]*>/g, '')).length > 0;
		}, context.text.descriptionRequired, '.field-item.description .field-item-validation', null);
		context.description.attachChange(descriptionValidate);

		context.fields.points.on('keyup', function() {
            if (context.fields.points.val() != context.fields.points.data('originalvalue') && context.fields.updatePoints.is(":visible") == false)
                $(".field-item.update-points").show();
            if (context.fields.points.val() == context.fields.points.data('originalvalue') && context.fields.updatePoints.is(":visible") == true)
                $(".field-item.update-points").hide();
        });

        var validatePoints = saveButton.evolutionValidation(
            'addCustomValidation',
            'points',
            function() {
                var points = context.fields.points.val();
                if (points.length == 0) {
                    return false;
                }
                if (isNaN(parseInt(points, 10))) {
                    return false;
                }
                return true;
            },
            context.text.pointsRequired,
            context.fields.points.closest('.field-item').find('.field-item-validation'),
            null
            );

        context.fields.points.on('input', function() {
            validatePoints();
        });

		context.fields.automation.on('change', function() {
		    var automationId = context.fields.automation.val();
		    var data = context.automationConfiguration.getValues();

            context.fields.automation.closest('ul').children('div.automation-configuration-form').remove();

		    if (automationId == '') {
		        return;
		    }

            $.telligent.evolution.post({
		        url: context.urls.updateAutomationConfigurationForm,
		        data: {
		            pointFactorId: context.pointFactorId,
		            automationId: automationId,
		            automationConfiguration: data != null ? $.telligent.evolution.url.serializeQuery(data) : ''
		        }
		    })
		        .done(function(formHtml) {
                    var span = $('<div class="automation-configuration-form"></li>').append(formHtml);
		           context.fields.automation.closest('ul').append(span);
		        });
		});
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};

	$.telligent.evolution.widgets.administrationPointsAddEdit = {
	    register: function (context) {
			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

            context.fields = {
                title: $(context.fieldIds.title),
                enable: $(context.fieldIds.enable),
                points: $(context.fieldIds.points),
                updatePoints: $(context.fieldIds.updatePoints),
                automation: $(context.fieldIds.automation)
            };

            attachHandlers(context);
	    }
	}

})(jQuery, window);