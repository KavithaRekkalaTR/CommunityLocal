(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	function checkRevertButtonEnablement(context) {
	    if (context.fields.revertMetrics.is(':checked') || context.fields.revertDecay.is(':checked')) {
	        context.revertButton.removeClass('disabled');
	    } else {
	        context.revertButton.addClass('disabled');
	    }
	}

	$.telligent.evolution.widgets.scorePluginRevert = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.revertButton = context.headerWrapper.find('.revert');
            context.revertButton.addClass('disabled');

            context.fields.revertMetrics.on('change', function() {
                checkRevertButtonEnablement(context);
            });

            context.fields.revertDecay.on('change', function() {
                checkRevertButtonEnablement(context);
            });

			context.revertButton.on('click', function() {
			    if (!context.revertButton.hasClass('disabled')) {
			        context.revertButton.addClass('disabled');

			        $.telligent.evolution.post({
			            url: context.urls.revert,
			            data: {
			                metrics: context.fields.revertMetrics.is(':checked'),
			                decay: context.fields.revertDecay.is(':checked')
			            }
			        })
			            .then(function() {
			               $.telligent.evolution.notifications.show(context.text.revertSuccessful, {
                                type: 'success'
                            });
                            $.telligent.evolution.messaging.publish('scoreplugin.refresh', {
                                changedDecay: context.fields.revertDecay.is(':checked'),
                                changedMetrics: context.fields.revertMetrics.is(':checked')
                            });
                            $.telligent.evolution.administration.close();
			            })
			            .always(function() {
			                context.revertButton.removeClass('disabled');
			            });
			    }

			    return false;
			});
		}
	};

}(jQuery, window));