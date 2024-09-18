(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.userAdministrationAddRemovePoints = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.saveButton = context.headerWrapper.find('.addremovepoints');
			context.saveButton.evolutionValidation({
                onValidated: function(isValid, buttonClicked, c) {
                    if (isValid) {
                        context.saveButton.removeClass('disabled');
                    } else {
                        context.saveButton.addClass('disabled');
                    }
                },
                onSuccessfulClick: function(e) {
                    context.saveButton.addClass('disabled');

                    $.telligent.evolution.post({
    		            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/pointtransactions.json',
    		            data: {
    		                UserId: context.userId,
    		                Value: parseInt(context.fields.pointsToAdd.val(), 10),
    		                ContentId: context.contentId,
    		                ContentTypeId: context.contentTypeId,
    		                Description: context.fields.pointsReason.val()
    		            }
    		        })
                        .then(function() {
                            $.telligent.evolution.notifications.show(context.text.addRemotePointsSuccessful, {
                                type: 'success'
                            });
                            $.telligent.evolution.messaging.publish('entity.updated', {
                                entity: 'User',
                                properties: ['Points']
                            });
                            $.telligent.evolution.administration.close();
                        })
                        .always(function() {
                            context.saveButton.removeClass('disabled');
                        });

                    return false;
                }
            });

            context.saveButton.evolutionValidation('addField',
                '#' + context.fields.pointsReason.attr('id'),
                {
                    required: true
                },
                context.fields.pointsReason.closest('.field-item').find('.field-item-validation'), null);

            var validatePoints = context.saveButton.evolutionValidation(
                'addCustomValidation',
                'points',
                function() {
                    var points = context.fields.pointsToAdd.val();
                    if (points.length == 0) {
                        return false;
                    }
                    if (isNaN(parseInt(points, 10))) {
                        return false;
                    }
                    return true;
                },
                context.text.pointsRequired,
                context.fields.pointsToAdd.closest('.field-item').find('.field-item-validation'),
                null
                );

            context.fields.pointsToAdd.on('input', function() {
                validatePoints();
            });
		}
	};

}(jQuery, window));