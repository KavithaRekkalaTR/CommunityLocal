(function($)
{
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }


    $.telligent.evolution.widgets.flattenForumRepliesPanel = {
        register: function(context) {
				$.telligent.evolution.messaging.subscribe('flatten-threaded-replies', function () {
				    if (confirm(context.flattenConfirmation)) {
					    $.telligent.evolution.post({
						    url: context.scheduleJobUrl,
						    success: function(response)
    						{
    							$.telligent.evolution.notifications.show(context.threadedRepliesFlattened);
    						}
					    });
				    }
				});
			}
	};
})(jQuery, window);
