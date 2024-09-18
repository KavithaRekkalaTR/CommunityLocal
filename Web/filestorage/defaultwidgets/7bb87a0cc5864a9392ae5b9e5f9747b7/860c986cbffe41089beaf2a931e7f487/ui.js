(function($){

	var changePassword = function(context) {
		var data = {
			newPassword: $(context.newPasswordInput).val(),
			successUrl: context.successUrl
		};
		// if there was a current password, add it to the data
		var currentPasswordInput = $(context.currentPasswordInput);
		if(currentPasswordInput.length > 0) {
			data.currentPassword = currentPasswordInput.val();
		}
		else {
		    data.verificationContext = context.verificationContext;
		}
		$.telligent.evolution.post({
			url: context.changeUrl,
			data: data,
			success: function(response) {
				alert(context.changeSuccessMessage);
				window.location.href = context.successUrl;
			}
		});
	};

	var api = {
		register: function(context) {
			context = $.extend({}, api.defaults, context);
			context.submitPasswordInput = $(context.submitPasswordInput)
				.evolutionValidation({
					validateOnLoad : false,
					onValidated: function(isValid, buttonClicked, c) { },
					onSuccessfulClick: function(e) {
						e.preventDefault();
						changePassword(context);
					}
				})
				.evolutionValidation('addField',
					context.newPasswordInput, {
						required: true,
						passwordvalid: true,
						minlength: context.passwordMinLength,
						messages: {
							required: context.requiredMessage,
							minlength: context.passwordLimitsMessage
						}
					},
					'#' + context.wrapperId + ' .field-item.new-password .field-item-validation', null)
				.evolutionValidation('addField',
					context.newPasswordConfirmInput, {
						required: true,
						equalTo: context.newPasswordInput,
						messages: {
							required: context.requiredMessage,
							equalTo: context.passwordMatchMessage
						}
					},
					'#' + context.wrapperId + ' .field-item.new-password-confirm .field-item-validation', null);

			// if there was a current password field, validate for it as well
			if($(context.currentPasswordInput).length > 0) {
				context.submitPasswordInput
					.evolutionValidation('addField',
						context.currentPasswordInput, {
							required: true,
							messages: {
								required: context.requiredMessage
							}
						},
						'#' + context.wrapperId + ' .field-item.current-password .field-item-validation', null);
			}
		}
	};
	$.extend(api, {
		defaults: {
			wrapperId: '',
			successMessageDiv: '',
			// inputs
			currentPasswordInput: '',
			newPasswordInput: '',
			newPasswordConfirmInput: '',
			submitPasswordInput: '',
			// messages
			passwordMinLength: 5,
			requiredMessage: '*',
			passwordErrorMessage: 'ChangePassword_InvalidRegExContent',
			passwordLimitsMessage: 'ChangePassword_InvalidLength',
			passwordMatchMessage: 'ChangePassword_ReEnterNewPasswordInvalid',
			changeSuccessMessage: 'ChangePassword_Success',
			// urls
			changeUrl: '',
			successUrl: '',
			errorUrl: ''
		}
	});

	// expose api in a public namespace
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.changePassword = api;

}(jQuery));