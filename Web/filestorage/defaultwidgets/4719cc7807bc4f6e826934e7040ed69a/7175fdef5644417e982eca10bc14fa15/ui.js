(function($, global, undef) {

	var searchTimeout = null;

	function prefix(options) {
		var data = {};
		$.each(options, function(k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	function parseFilter(context) {
		return {
			name: context.filter.find('.nameFilter').val(),
			pageIndex: 0
			//sortBy: context.filter.find('.sortBy').val(),
		};
	}

	var Model = {
		listJobs: function(context, options) {
			return $.telligent.evolution.get({
				url: context.getJobsUrl,
				data: prefix(options)
			});
		},
	};

	var api = {
		register: function(context) {
			// init
			context.list = $(context.list);
			context.filter = $(context.filter);
			context.selections = [];

			// filtering
			context.currentFilter = parseFilter(context);
			context.filter.on('input', function(e){
				global.clearTimeout(searchTimeout);
				searchTimeout = global.setTimeout(function() {
					// adjust filter
					context.currentFilter = parseFilter(context);
					context.list.empty();
					context.scrollable.reset();

				}, 500);
			});

			$.telligent.evolution.messaging.subscribe('jobs-refresh', function()
				{
					context.list.empty();
					context.scrollable.reset();
				});

			// paging
			context.scrollable = $.telligent.evolution.administration.scrollable({
				target: context.list,
				load: function(pageIndex) {
					return $.Deferred(function(d) {

						var filter = $.extend({}, context.currentFilter, {
							pageIndex: pageIndex
						});

						Model.listJobs(context, filter)
							.then(function(response){
								response = $.trim(response);
								if(response.length > 0) {
									context.list.append(response);
									d.resolve();
								} else {
									d.reject();
								}
							})
							.catch(function(){
								d.reject();
							});
					});
				}
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.jobsPanel = api;

})(jQuery, window);
