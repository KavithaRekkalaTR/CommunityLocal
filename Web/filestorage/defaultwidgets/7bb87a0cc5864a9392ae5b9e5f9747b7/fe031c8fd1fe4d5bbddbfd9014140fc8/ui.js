(function($){

	var createContactRequest = function(context) {
			$.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/contactrequests.json',
				data: {
					GroupId: context.groupId,
					Subject: context.subject.val(),
					Body: context.message.val(),
					Name: context.name.val(),
					EmailAddress: context.email.val()
				},
				success: function(response) {
					// show success message
					$.telligent.evolution.notifications.show(context.successMessage, { type: 'success' });
					// empty the form
					context.subject.val('');
					context.message.val('');
				}
			});
		},
		api = {
			register: function(context) {
				context.subject = $(context.subject);
				context.name = $(context.name);
				context.email = $(context.email);
				context.message = $(context.message);
				context.success = $(context.success);
				context.submit = $(context.submit)
					.evolutionValidation({
						onValidated: function(isValid, buttonClicked, c) { 
							if (isValid) {
								context.submit.removeClass('disabled');
							} else {
								context.submit.addClass('disabled');
							}
						},
						onSuccessfulClick: function(e) {
							e.preventDefault();
							createContactRequest(context);
						},
						validateOnLoad: false
					})
					.evolutionValidation('addField',
						context.subject, {
							required: true,
							messages: {
								required: context.subjectRequired
							}
						},
						context.subject.closest('.field-item').find('.field-item-validation'), null)
					.evolutionValidation('addField',
						context.name, {
							required: true,
							messages: {
								required: context.nameRequired
							}
						},
						context.name.closest('.field-item').find('.field-item-validation'), null)
					.evolutionValidation('addField',
						context.email, {
							required: true,
							email: true,
							messages: {
								required: context.emailRequired,
								email: context.emailRequired
							}
						},
						context.email.closest('.field-item').find('.field-item-validation'), null)
					.evolutionValidation('addField',
						context.message, {
							required: true,
							messages: {
								required: context.messageRequired
							}
						},
						context.message.closest('.field-item').find('.field-item-validation'), null);
			}
	};

	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.groupContact = api;

}(jQuery));
