(function($, global, undef) {

	function prefix(options) {
		var data = {};
		$.each(options, function(k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	function buildExportUrl(context, options) {
		return $.telligent.evolution.url.modify({
			url: context.exportCallbackUrl,
			query: prefix(options || {})
		});
	}

	function buildExportAllUrl(context, options) {
		return $.telligent.evolution.url.modify({
			url: context.exportAllCallbackUrl,
			query: prefix(options || {})
		});
	}

	function queriesMatch(queryA, queryB) {
		return (queryA && queryB &&
			queryA.type == queryB.type &&
			queryA.query == queryB.query);
	}

	function listEvents(context, pageIndex) {
		var listQuery = $.extend({}, context.listQueryContext, {
			pageIndex: pageIndex
		});

		return $.telligent.evolution.get({
			url: context.listCallbackUrl,
			data: listQuery,
			cache: false
		}).then(function(r){
			return queriesMatch(listQuery, context.listQueryContext) ? r : null;
		});
	}

	var api = {
		register: function(options) {

			var context = $.extend(options, {
				eventsList: $(options.eventsListId),
				eventCount: $(options.eventCountId),
				machineNamesSelector: $(options.machineNamesId),
				eventTypesSelector: $(options.eventTypesId),
				searchInput: $(options.searchInputId),
				listQueryContext: {}
			});

			// header
			$.telligent.evolution.administration.header(
				$.telligent.evolution.template(context.headerTemplateId)({}));

			$(context.startDateId).val(new Date(context.startDate).toISOString()).glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: false,
					})
			)
				.on('glowDateTimeSelectorChange', function() {
					var startDate = $.telligent.evolution.formatDate($(context.startDateId).glowDateTimeSelector('val'));
					if (startDate != '') {
						context.listQueryContext.startDate = startDate;
						context.eventsList.empty();
						context.scrollableResults.reset();
					}
				}
			);

			$(context.endDateId).glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: true,
					})
			)
				 .on('glowDateTimeSelectorChange', function() {
					var endDate = $.telligent.evolution.formatDate($(context.endDateId).glowDateTimeSelector('val'));
					context.listQueryContext.endDate = endDate;
					context.eventsList.empty();
					context.scrollableResults.reset();
				 }
			);

			context.listQueryContext.pageIndex = 0;
			context.listQueryContext.pageSize = 20;
			context.listQueryContext.startDate  = context.startDate;
			context.listQueryContext.endDate = context.endDate;

			// paging
			context.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.eventsList,
				load: function(pageIndex) {
					return $.Deferred(function(d){
						listEvents(context, pageIndex).then(function(r){
							if (!r.list)
								d.reject();

							context.eventCount.empty().append(r.count);
							// if there was more content, resolve it as true to continue loading
							if($.trim(r.list).length > 0) {
								context.eventsList.append(r.list);
								d.resolve();
							} else {
								d.reject();
								// if still the first page, then show the 'no content message'
								if(pageIndex === 0) {
									context.eventsList.append('<div class="message norecords">' + context.noEventsText + '</div>');
								}
							}
						}).catch(function(){
							d.reject();
						})
					});
				}
			});

			// filtering
			context.eventTypesSelector.on('change', function() {
				context.listQueryContext.eventType = context.eventTypesSelector.val();
				context.eventsList.empty();
				context.scrollableResults.reset();
			});

			context.machineNamesSelector.on('change', function() {
				context.listQueryContext.machineName = context.machineNamesSelector.val();
				context.eventsList.empty();
				context.scrollableResults.reset();
			});

			// searching
			var searchTimeout;
			context.searchInput.on('input', function(){
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(function() {
					context.listQueryContext.query = context.searchInput.val();
					context.eventsList.empty();
					context.scrollableResults.reset();
				}, 150);
			});

			// events + handlers
			var messageHandlers = {
				'events-export': function(data){
					var exportUrl = buildExportUrl(context, { EventId: $(data.target).data('eventid') } );
					if(exportUrl) {
						window.location = exportUrl;
						return false;
					}
				},
				'events-export-all': function(data){
					var exportUrl = buildExportAllUrl(context, context.listQueryContext);
					if(exportUrl) {
						window.location = exportUrl;
						return false;
					}
				},
				'events-refresh': function(data){
					context.eventsList.empty();
					context.scrollableResults.reset();
				}
			};
			for(var messageName in messageHandlers) {
				$.telligent.evolution.messaging.subscribe(messageName, messageHandlers[messageName]);
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.eventsPanel = api;

})(jQuery, window);