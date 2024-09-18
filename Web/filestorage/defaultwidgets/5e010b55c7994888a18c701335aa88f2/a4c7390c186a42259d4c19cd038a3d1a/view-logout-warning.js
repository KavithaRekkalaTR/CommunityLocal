/*
Logout Warning View

options:
	template
	titleText: '',

methods:
	show()

Automatically opens in response to authentication client API events and supports renewing
	user.logout.warning
	user.logout.warning.canceled

Mirrors the functionality of User - Logout Warning front-end widget

*/
define('LogoutWarningView', function($, global, undef) {

	var defaults = {
		template: 'studioShell-logoutWarning',
		absoluteTemplate: 'studioShell-logoutWarningAbsolute',
		titleText: 'Still here?'
	};

	var LogoutWarningView = function(options) {
		var context = $.extend({}, defaults, options || {});

		context.template = $.telligent.evolution.template(context.template);
		context.absoluteTemplate = $.telligent.evolution.template(context.absoluteTemplate);

		var modalContent;

		// show or update warning modal
		$.telligent.evolution.messaging.subscribe('user.logout.warning', function (data) {
			if (data.renewable) {
				if (!modalContent) {
					modalContent = $('<div></div>').html(context.template(data));

					var modal = $.glowModal({
						title: context.titleText,
						html: modalContent,
						width: 450,
						onClose: function () {
							modalContent = null;
						}
					});
				} else {
					modalContent.html(context.template(data));
				}
			} else {
				$.telligent.evolution.notifications.show(context.absoluteTemplate(data), {
					id: '_logout_warning',
					type: 'warning'
				});
			}
		}, { excludeAutoNameSpaces: true });

		// hide warning modal
		$.telligent.evolution.messaging.subscribe('user.logout.warning.canceled', function() {
			$.glowModal.close();
			$.telligent.evolution.notifications.hide('_logout_warning');
		}, { excludeAutoNameSpaces: true });

		// manually renew authentication via modal's button
		$.telligent.evolution.messaging.subscribe('admin.user-logout-warning.renew', function(data) {
			$(data.target).addClass('disabled').parent().find('.processing').show();
			$.telligent.evolution.authentication.renew();
		}, { excludeAutoNameSpaces: true });

		return {
			updateReturnUrl: function () {
				// Unlike front UI, admin is a SPA, so its login url with return url is always the same
				// as such, necessary to tell authentication client api that the hash-based URL
				// has changed as user navigates UI to restore on re-login
				$.telligent.evolution.authentication.configure({
					returnUrl: global.location.pathname + global.location.hash
				});
			}
		};
	};

	return LogoutWarningView;

}, jQuery, window);