(function($, global) {
	var api = {
		register: function(context) {
		    $.telligent.evolution.messaging.subscribe('deletestory', function(e) {
				if(confirm(context.deleteActivityMessage)) {
				    $.telligent.evolution.del({
    					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/stories/{StoryId}.json',
    					data: { 
    					    StoryId: $(e.target).data('storyid')
    					}
    				})
    				    .then(function() {
    				        global.location = context.allActivityUrl; 
    				    });
				}
				return false;
			});

			$.telligent.evolution.messaging.subscribe('start-private-message', function(e){
				global.location = $(e.target).data('conversationurl');
			});
		}
	};

	if (!$.telligent) { $.telligent = {}; }
	if (!$.telligent.evolution) { $.telligent.evolution = {}; }
	if (!$.telligent.evolution.widgets) { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.activityStory = api;

})(jQuery, window);
