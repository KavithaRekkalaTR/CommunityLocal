(function ($, global) {
	var headerList = null;

	function validateThrottling(context) {
		if ($(context.inputs.throttlingId).is(':checked')) {
			$('.field-item.throttling-attempts').show();
			$('.field-item.throttling-duration').show();
		}
		else {			
			$('.field-item.throttling-attempts').hide();
			$('.field-item.throttling-duration').hide();
		}
	}

	var api = {
		register: function (options) {
			options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);
			
			options.wrapper = $.telligent.evolution.administration.panelWrapper();
			
			var headingTemplate = $.telligent.evolution.template.compile(options.headerTemplateId);
			options.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			validateThrottling(options);
            $(options.inputs.throttlingId).on('change', function() {
                validateThrottling(options);
            });
            
            if(!options.ssoEnabled)
            {
                $.telligent.evolution.messaging.subscribe('logout-users', function(){
                if (global.confirm(options.resources.logoutUsersConfirm)) {
                    $.telligent.evolution.post({
        	            url: options.urls.logoutUsers,
        	            data: {}
        	        });
                    }
    			});
            }

			button = $('a.save', $.telligent.evolution.administration.header());
			button.evolutionValidation({
				validateOnLoad: false,
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {

					var data = {
						AllowLogin: $(options.inputs.allowLoginId).is(':checked'),
						AllowNewUserRegistration: $(options.inputs.allowRegistrationId).is(':checked'),
						ShowContactCheckboxes: $(options.inputs.showContactCheckboxesId).is(':checked'),
						UsernameRegex: $(options.inputs.usernameRegexId).val(),
						UsernameMinLength: $(options.inputs.usernameMinLengthId).val(),
						UsernameMaxLength: $(options.inputs.usernameMaxLengthId).val(),
						EmailRegex: $(options.inputs.emailRegexId).val(),
						AccountActivationMode: $(options.inputs.accountActivationModeId).val(),
						PasswordRecovery: $(options.inputs.passwordRecoveryId).val(),
						AuthCookieTimeout: $(options.inputs.authCookieTimeout).val(),
						EnableSlidingAuth: $(options.inputs.enableSlidingAuth).is(':checked'),
						LogoutOnBrowserClose: $(options.inputs.logoutOnBrowserClose).is(':checked'),
						Throttling: $(options.inputs.throttlingId).is(':checked'),
						ThrottlingAttempts: $(options.inputs.throttlingAttemptsId).val(),
						ThrottlingDuration: $(options.inputs.throttlingDurationId).val(),
						PasswordLength: $(options.inputs.passwordLength).val(),
						PasswordMinLowercase: $(options.inputs.passwordMinLowercase).val(),
						PasswordMinUppercase: $(options.inputs.passwordMinUppercase).val(),
						PasswordMinNumbers: $(options.inputs.passwordMinNumbers).val(),
						PasswordMinSpecial: $(options.inputs.passwordMinSpecial).val(),
						PasswordFailAttempts: $(options.inputs.passwordFailAttempts).val(),
						PasswordFailWindow: $(options.inputs.passwordFailWindow).val(),
						LockoutTime: $(options.inputs.lockoutTime).val(),
					};

					$.telligent.evolution.post({
					 	url: options.urls.save,
					 	data: data
					})
					.then(function() {
					 	$.telligent.evolution.notifications.show(options.resources.settingsUpdated);
					});

					return false;
				}
			})
			.evolutionValidation('addField', options.inputs.usernameRegexId, { required: true }, '.field-item.username-regex .field-item-validation')
			.evolutionValidation('addField', options.inputs.usernameMinLengthId, { required: true, digits: true, range: [1,255] }, '.field-item.username-minlength .field-item-validation')
			.evolutionValidation('addField', options.inputs.usernameMaxLengthId, { required: true, digits: true,range: [2,256] }, '.field-item.username-maxlength .field-item-validation')
			.evolutionValidation('addField', options.inputs.emailRegexId, { required: true }, '.field-item.email-regex .field-item-validation')
		
			if(!options.ssoEnabled)
			{
			    	button.evolutionValidation('addField', options.inputs.throttlingAttemptsId, { required: false, digits: true, range: [1,30] }, '.field-item.throttling-attempts .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.throttlingDurationId, { required: false, digits: true, range: [1,60] }, '.field-item.throttling-duration .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.authCookieTimeout, { required: true, digits: true, range: [1,999999] }, '.field-item.auth-cookie-timeout .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.passwordLength, { required: true, digits: true, range: [1,999999] }, '.field-item.password-requirements .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.passwordMinLowercase, { required: true, digits: true, range: [0,999999] }, '.field-item.password-requirements .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.passwordMinUppercase, { required: true, digits: true, range: [0,999999] }, '.field-item.password-requirements .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.passwordMinNumbers, { required: true, digits: true, range: [0,999999] }, '.field-item.password-requirements .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.passwordMinSpecial, { required: true, digits: true, range: [0,999999] }, '.field-item.password-requirements .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.passwordFailAttempts, { required: true, digits: true, range: [1,999999] }, '.field-item.password-failures .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.passwordFailWindow, { required: true, digits: true, range: [1,999999] }, '.field-item.password-failurewindow .field-item-validation')
        			button.evolutionValidation('addField', options.inputs.lockoutTime, { required: true, digits: true, range: [1,999999] }, '.field-item.password-lockout .field-item-validation')
			
			}
		}
		
		
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.authenticationSettingsPanel = api;

})(jQuery, window);