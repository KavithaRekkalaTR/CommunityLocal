(function($){

	var loadFeedIntoWrapper = function(context, wrapper) {
		var feedUrl = wrapper.find('a').attr('href');

		$.telligent.evolution.get({
			url: context.feedItemsUrl,
			data: {
				w_feedUrl: feedUrl,
				w_pageSize: context.pageSize
			},
			success: function(response) {
				wrapper.html(response);
			}
		});
	};

	var api = {
		register: function(context) {
			$('#' + context.wrapperId + ' div.content-fragment-content div.feed')
				.each(function(){ loadFeedIntoWrapper(context, $(this)); });
		}
	};

	// expose API
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.temporaryRssFeedList = api;

}(jQuery))
