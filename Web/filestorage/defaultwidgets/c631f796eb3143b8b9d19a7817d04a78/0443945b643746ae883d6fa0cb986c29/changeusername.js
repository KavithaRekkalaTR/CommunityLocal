(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.userAdministrationChangeUsername = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.fields.newUsername.on('input', function() {
			   if (context.fields.newUsername.val().length > 0) {
				   context.changeUsernameButton.removeClass('disabled');
			   } else {
				   context.changeUsernameButton.addClass('disabled');
			   }
			});

			context.changeUsernameButton = context.headerWrapper.find('.changeusername').addClass('disabled');
			context.changeUsernameButton.on('click', function() {
				if (!context.changeUsernameButton.hasClass('disabled')) {
					context.changeUsernameButton.addClass('disabled');
					$.telligent.evolution.post({
						url: context.urls.changeUsername,
						data: {
							Username: context.fields.newUsername.val(),
							IgnoreDisallowedNames: context.fields.ignoreDisallowedNames.is(':checked')
						}
					})
						.then(function() {
						   $.telligent.evolution.notifications.show(context.text.changeUsernameSuccessful.replace(/\{newusername\}/g, context.fields.newUsername.val()), {
							  type: 'success'
						   });
						   $.telligent.evolution.messaging.publish('entity.updated', {
								entity: 'User',
								id: context.userId,
								properties: ['Username']
							});
						   $.telligent.evolution.administration.close();
						})
						.always(function() {
							context.changeUsernameButton.removeClass('disabled');
						});
				}

				return false;
			});
		}
	};

}(jQuery, window));