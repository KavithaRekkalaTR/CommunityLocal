(function($){

	var authorizeClient = function(context) {
		$('processing', context.wrapper).show();
		$.telligent.evolution.post({
			url: context.authorizeUrl,
			data: {
				clientId: context.clientId,
				callbackUrl: context.callbackUrl,
				response_type: context.responseType,
				scope: context.scope,
				state: context.state,
				codeChallenge:context.codeChallenge,
				codeChallengeMethod:context.codeChallengeMethod
			},
			success: function(response) {
				if (response.returnUrl)
					window.location.href = response.returnUrl;
			}
		});
	},
	denyClient = function(context) {
		$('processing', context.wrapper).show();
		$.telligent.evolution.post({
			url: context.denyUrl,
			data: {
				clientId: context.clientId,
				callbackUrl: context.callbackUrl,
				response_type: context.responseType,
				scope: context.scope,
				state: context.state
			},
			success: function(response) {
				if (response.returnUrl)
					window.location.href = response.returnUrl;
			}
		});
	};

	var api = {
		register: function(context) {
			context.wrapper = $(context.wrapperSelector);

			$(context.submitButtonSelector).on('click', function() {
				authorizeClient(context);
			});
			$(context.denyButtonSelector).on('click', function() {
				denyClient(context);
			});
		}
	};

	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.oauthClientAuthorize = api;

}(jQuery))