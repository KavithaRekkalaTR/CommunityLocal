(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	function save(context) {
		return $.telligent.evolution.post({
			url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users.json?IncludeFields=Id',
			data: {
				Username: context.fields.username.val(),
				Password: context.fields.password1.val(),
				PrivateEmail: context.fields.privateEmail.val(),
				TimeZoneId: context.fields.timezone.val()
			}
		});
	}

	$.telligent.evolution.widgets.membersCreate = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.saveButton = context.headerWrapper.find('.save');
			context.saveButton.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
					if (isValid)
						context.saveButton.removeClass('disabled');
					else {
						context.saveButton.addClass('disabled');
					}
				},
				onSuccessfulClick: function(e) {
					context.saveButton.addClass('disabled');

					save(context)
						.then(function(response) {
							$.telligent.evolution.notifications.show(context.text.saveSuccessful, {
								type: 'success'
							});

							$.telligent.evolution.messaging.publish('membersearch.refresh', {});
							// wait for this create panel to fully close and an additional delay before triggering a redirect to the newly created user
							$.telligent.evolution.administration.on('panel.unloaded', function(){
								setTimeout(function(){
									$.telligent.evolution.messaging.publish('membersearch.usercreated', {
										userId: response.User.Id
									});
								}, 500);
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
				'#' + context.fieldIds.privateEmail,
				{
					required: true,
					email: true,
					emailexists: true,
					messages: {
						email: context.text.emailInvalid,
						emailexists: context.text.emailDuplicate
					}
				},
				context.fields.privateEmail.closest('.field-item').find('.field-item-validation'), null);

			context.saveButton.evolutionValidation('addField',
				'#' + context.fieldIds.username,
				{
					required: true,
					minlength: context.usernameMinLength,
					maxlength: context.usernameMaxLength,
					username: (context.mode != 'login'),
					usernameexists: true,
					messages: {
						username: context.text.usernameInvalidUserName,
						usernameexists: context.text.usernameDuplicateUserName
					}
				},
				context.fields.username.closest('.field-item').find('.field-item-validation'), null);

			context.saveButton.evolutionValidation('addField',
				'#' + context.fieldIds.password1,
				{
					required: true,
					minlength: context.passwordMinLength,
					passwordvalid: true,
					messages: {
						passwordvalid: context.text.passwordError,
						minlength: context.text.passwordLimits
					}
				},
				context.fields.password1.closest('.field-item').find('.field-item-validation'), null);


			context.saveButton.evolutionValidation('addField',
				'#' + context.fieldIds.password2,
				{
					required: true,
					equalTo: '#' + context.fieldIds.password1,
					messages: {
						equalTo: context.text.passwordMatch
					}
				},
				context.fields.password2.closest('.field-item').find('.field-item-validation'), null);
		}
	};

}(jQuery, window));