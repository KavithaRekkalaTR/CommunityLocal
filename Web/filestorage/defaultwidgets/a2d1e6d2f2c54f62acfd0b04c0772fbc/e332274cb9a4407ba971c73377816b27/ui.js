(function($, global, undef) {

	function listRequests(context, pageIndex) {
		return $.telligent.evolution.get({
			url: context.listCallback,
			data: {
				blogId: context.blogId,
				pageIndex: pageIndex
			}
		});
	}

	function deleteRequest(context, link, requestId) {
		if(confirm(context.deleteVerificationText)) {
			$.telligent.evolution.del({
				url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/contactrequests/{ContactRequestId}.json',
				data: {
					BlogId: context.blogId,
					ContactRequestId: requestId
				},
				success: function(response) {
					link.parents('li.content-item')
						.slideUp(function() {
							link.parents('li.content-item').remove();
						})
					.find('.ui-links').uilinks('hide');
				}
			});
		}
	}

	var api = {
		register: function(options) {
			var context = options;
			context.requestList = $(options.requestListId);

			// pagings
			context.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.requestList,
				load: function(pageIndex) {
					return $.Deferred(function(d){
						listRequests(context, pageIndex).then(function(r){
							// if there was more content, resolve it as true to continue loading
							if($.trim(r).length > 0) {
								context.requestList.append(r);
								d.resolve();
							} else {
								d.reject();
								// if still the first page, then show the 'no content message'
								if(pageIndex === 0) {
									context.requestList.append('<div class="message norecords">' + context.noRequestsText + '</div>');
								}
							}
						}).catch(function(){
							d.reject();
						})
					});
				}
			});

			// deleting
			$.telligent.evolution.messaging.subscribe('contextual-delete-request', function(data){
				deleteRequest(options, $(data.target), $(data.target).data('requestid'));
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.blogContactRequestsApplicationPanel = api;

})(jQuery, window);
