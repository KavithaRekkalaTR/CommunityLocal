(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.forgottenPassword = {
		register: function(context) {

			context.recover.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					e.preventDefault();
					context.recover.prop('disabled',true);
					context.message.hide();

					$.telligent.evolution.post({
						url: context.recoverUrl,
						data: { emailAddress: $(context.emailAddressSelector).val() },
						success: function(response)
						{
							var message = '';
							var encodedEmail = $.telligent.evolution.html.encode($(context.emailAddressSelector).val());

							if (context.recoveryMethod == 'Reset') {
								message = '<b>' + context.linkTitle + '</b><div>' + context.linkMessage.replace(/\{0\}/g, encodedEmail) + '</div>';
							}
							else {
								message = '<b>' + context.resetTitle + '</b><div>' + context.resetMessage.replace(/\{0\}/g, encodedEmail) + '</div>';
							}

							if (response.success === 'true')
							{
								context.message.html(message).attr('class','message success margin-top').show();
								$('fieldset h1, .message.directions, .field-list-header, .field-list, .field-list-footer', $('#' + context.wrapperId)).hide();
							}
							else
							{
								context.message.html(response.message).attr('class','message error margin-top').show();
							}

							context.recover.prop('disabled',false);
						},
						defaultErrorMessage: context.errorText,
						error: function(xhr, desc, ex)
						{
							context.message.html(desc).attr('class','message error margin-top').show();
							context.recover.prop('disabled',false);
						}
					});

					return false;
				}
			});

			context.recover.evolutionValidation('addField', context.emailAddressSelector, {
					required: true,
					email: true
				},
				'#' + context.wrapperId + ' .field-item.email-address .field-item-validation',
				null
			);

		}
	};
}(jQuery, window));
