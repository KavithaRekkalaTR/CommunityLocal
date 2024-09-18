(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.userAdministrationImpersonate = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.impersonateButton = context.headerWrapper.find('.impersonate');
			context.impersonateButton.on('click', function() {
			    if (!context.impersonateButton.hasClass('disabled')) {
			        context.impersonateButton.addClass('disabled');
			        $.telligent.evolution.post({
			            url: context.urls.impersonate,
			            data: {}
			        })
			            .then(function() {
			               global.alert(context.text.impersonateSuccessful);
			               global.location = $.telligent.evolution.site.getBaseUrl();
			            })
			            .always(function() {
			                context.impersonateButton.removeClass('disabled');
			            });
			    }

			    return false;
			});
		}
	};

}(jQuery, window));