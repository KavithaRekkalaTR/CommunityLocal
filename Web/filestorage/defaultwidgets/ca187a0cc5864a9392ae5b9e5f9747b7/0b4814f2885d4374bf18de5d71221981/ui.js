(function ($) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var _confirmRegistration = function (context, token) {
		$.telligent.evolution.post({
			url: context.confirmUrl,
			data: _populateData(context, token),
			success: function (response) {
				window.location = context.baseUrl;
			},
			defaultErrorMessage: context.confirmErrorText,
			error: function (xhr, desc, ex) {
				$.telligent.evolution.notifications.show(desc, { type: 'error' });
			}
		});
	},
	_cancelRegistration = function (context, token) {
		$.telligent.evolution.post({
			url: context.cancelUrl,
			data: _populateData(context, token),
			success: function (response) {
				window.location = context.baseUrl;
			},
			defaultErrorMessage: context.cancelErrorText,
			error: function (xhr, desc, ex) {
				$.telligent.evolution.notifications.show(desc, { type: 'error' });
			}
		});
	},
	_populateData = function (context, token) {
		var data = {
			eventId: context.EventId,
			Token: token
		};

		return data;
	}
	_attachHandlers = function (context) {

		$(context.content).on("click", 'a.confirm-registration', function () {
			_confirmRegistration(context, $(this).attr('Token'));
		});

		$(context.content).on("click", 'a.cancel-registration', function () {
			_cancelRegistration(context, $(this).attr('Token'));
		});

		$.telligent.evolution.widgets.eventRegistrationList.content = context.content;

		var qString = '&' + window.location.search.slice(1);

		$(context.content).on("reload", function () {
			$.telligent.evolution.post({
				url: [context.loadUrl, qString.length > 1 ? qString : ''].join(''),
				data: {eventId : context.eventId},
				success: function(response) {
					$(context.content).html(response);
				}
			});
		});
	};

	$.telligent.evolution.widgets.eventRegistrationList = {
		register: function (context) {
			_attachHandlers(context);
		}
	};
})(jQuery);
