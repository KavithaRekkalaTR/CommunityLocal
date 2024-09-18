(function($)
{
	if (typeof $.telligent === 'undefined') {$.telligent = {};}
	if (typeof $.telligent.evolution === 'undefined') {$.telligent.evolution = {};}
	if (typeof $.telligent.evolution.widgets === 'undefined') {$.telligent.evolution.widgets = {};}

	var approveContactRequest = function(context, contactRequestId)
	{
		$.telligent.evolution.put({
			url: context.approveContactUrl,
			data: { GroupId: context.groupId, ContactRequestId: contactRequestId },
			success: function(response)
			{
				reloadPage();
			}
		});
	},
	deleteContactRequest = function(context, contactRequestId)
	{
		$.telligent.evolution.del({
			url: context.deleteContactUrl,
			data: { GroupId: context.groupId, ContactRequestId: contactRequestId },
			success: function(response)
			{
				reloadPage();
			}
		});
	},
	reloadPage = function()
	{
		window.location = window.location;
	};

	$.telligent.evolution.widgets.groupContactRequestList = {
		register: function(context) {
			$.telligent.evolution.messaging.subscribe('deny-contact-request', function(data) {
				var e = $(data.target);
				if (confirm(context.deleteConfirmationText)) {
					deleteContactRequest(context, e.data('request-id'));
				}
			});

			$.telligent.evolution.messaging.subscribe('approve-contact-request', function(data) {
				var e = $(data.target);
				approveContactRequest(context, e.data('request-id'));
			});
		}
	};
}(jQuery));
