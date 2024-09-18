(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.scorePluginAddMetrics = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.saveButton = context.headerWrapper.find('.save');

            context.metricsList.on('change', 'input[type="checkbox"]', function() {
                if (context.metricsList.find('input[type="checkbox"]:checked').length > 0) {
                    context.saveButton.removeClass('disabled');
                } else {
                    context.saveButton.addClass('disabled');
                }
            });

            context.saveButton.addClass('disabled');

			context.saveButton.on('click', function() {
			    if (!context.saveButton.hasClass('disabled')) {
			        context.saveButton.addClass('disabled');

			        var metrics = [];
			        context.metricsList.find('input[type="checkbox"]:checked').each(function() {
			            metrics.push($(this).val());
			        })

			        $.telligent.evolution.post({
			            url: context.urls.addmetrics,
			            data: {
			                metrics: metrics
			            }
			        })
			            .then(function() {
			               $.telligent.evolution.notifications.show(context.text.addSuccessful, {
                                type: 'success'
                            });
                            $.telligent.evolution.messaging.publish('scoreplugin.refresh', {
                                addedMetrics: true
                            });
                            $.telligent.evolution.administration.close();
			            })
			            .always(function() {
			                context.saveButton.removeClass('disabled');
			            });
			    }

			    return false;
			});
		}
	};

}(jQuery, window));