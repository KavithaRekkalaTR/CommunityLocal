(function($){

	var validationMessage = '*',
		createContactRequest = function(context) {
			$.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/contactrequests.json',
				data: {
					BlogId: context.blogId,
					Subject: context.subject.val(),
					Body: context.body.val(),
					Name: context.name.val(),
					EmailAddress: context.email.val(),
					IPAddress: context.ipAddress
				},
				success: function(response) {
					alert(context.successMessage);
					window.location.href = context.blogUrl;
				}
			});
		},
		api = {
			register: function(context) {
				context.subject = $(context.subject);
				context.wrapper = $(context.wrapper);
				context.name = $(context.name);
				context.email = $(context.email);
				context.body = $(context.body);
				context.success = $(context.success);
				context.submit = $(context.submit)
					.evolutionValidation({
						onValidated: function(isValid, buttonClicked, c) { },
						onSuccessfulClick: function(e) {
							e.preventDefault();
							createContactRequest(context);
						}})
					.evolutionValidation('addField',
						context.subject, {
							required: true,
							messages: {
								required: validationMessage
							}
						},
						context.subject.closest('.field-item').find('.field-item-validation'), null)
					.evolutionValidation('addField',
						context.name, {
							required: true,
							messages: {
								required: validationMessage
							}
						},
						context.name.closest('.field-item').find('.field-item-validation'), null)
					.evolutionValidation('addField',
						context.email, {
							required: true,
							email: true,
							messages: {
								required: validationMessage,
								email: validationMessage
							}
						},
						context.email.closest('.field-item').find('.field-item-validation'), null)
					.evolutionValidation('addField',
						context.body, {
							required: true,
							messages: {
								required: validationMessage
							}
						},
						context.body.closest('.field-item').find('.field-item-validation'), null);
			}
	};

	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.contactBlog = api;

}(jQuery));
