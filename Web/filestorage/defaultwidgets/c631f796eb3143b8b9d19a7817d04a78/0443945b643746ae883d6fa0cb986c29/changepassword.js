(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    function validate(context) {
        var v1 = context.fields.newPassword1.val();
        var v2 = context.fields.newPassword2.val();

        if (v1.length == 0) {
            context.changePasswordButton.addClass('disabled');
            context.fields.newPassword2.closest('.field-item').find('.field-item-validation').hide();
            return false;
        }

        if (v2.length == 0) {
            context.changePasswordButton.addClass('disabled');
            context.fields.newPassword2.closest('.field-item').find('.field-item-validation').hide();
            return false;
        }

        if (v1 != v2) {
            context.changePasswordButton.addClass('disabled');
            context.fields.newPassword2.closest('.field-item').find('.field-item-validation').show();
            return false;
        }

        context.fields.newPassword2.closest('.field-item').find('.field-item-validation').hide();
        context.changePasswordButton.removeClass('disabled');
        return true;
    }

	$.telligent.evolution.widgets.userAdministrationChangePassword = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.changePasswordButton = context.headerWrapper.find('.changepassword');

			validate(context);

			context.fields.newPassword1.on('input', function() {
			    validate(context);
			});

			context.fields.newPassword2.on('input', function() {
			    validate(context);
			});

			context.changePasswordButton.on('click', function() {
			    if (!context.changePasswordButton.hasClass('disabled')) {
			        context.changePasswordButton.addClass('disabled');
			        $.telligent.evolution.put({
			            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json',
			            data: {
			                UserId: context.userId,
			                NewPassword: context.fields.newPassword1.val(),
			                OldPassword: ''
			            }
			        })
			            .then(function() {
			               $.telligent.evolution.notifications.show(context.text.changePasswordSuccessful, {
			                  type: 'success'
			               });
			               $.telligent.evolution.administration.close();
			            })
			            .always(function() {
			                context.changePasswordButton.removeClass('disabled');
			            });
			    }

			    return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.sendpasswordresetemail', function (data) {
        		if (global.confirm(context.text.sendPasswordResetEmailConfirmation)) {
        		    $.telligent.evolution.post({
        		        url: context.urls.sendPasswordResetEmail
        		    })
        		        .then(function() {
        		            $.telligent.evolution.notifications.show(context.text.sendPasswordResetEmailSuccessful, {
        		                type: 'success'
        		            });
        		            $.telligent.evolution.administration.close()
        		        })
        		}
    			return false;
        	});
		}
	};

}(jQuery, window));