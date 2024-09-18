(function($, global, undef) {

	function prefix(options) {
		var data = {};
		$.each(options, function(k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	function parseFilter(context) {
		return {
			notificationType: context.filter.find('.notificationType').val(),
			resolved: context.filter.find('.resolved').val(),
			minFrequency: context.filter.find('.minFrequency').val(),
			pageIndex: 0,
			sortBy: context.filter.find('.sortBy').val(),
			pluginType: context.pluginType
		};
	}

	function handleMultiSelectionUi(context) {
		if(context.selections.length > 0) {
			context.deleteSelectedButton.html(context.deleteSelectedText + ' (' + context.selections.length + ')');
			context.deleteSelectedButton.show();
			context.deSelectAllButton.show();
		} else {
			context.deleteSelectedButton.hide();
			context.deSelectAllButton.hide();
		}
	}

	var Model = {
		listNotifications: function(context, options) {
			return $.telligent.evolution.get({
				url: context.getNotificationsUrl,
				data: prefix(options)
			});
		},
		// options
		//   notificationIds: [] or null
		deleteNotifications: function(context, options) {
			var data = {
				notificationIds: (options.notificationIds || []).join()
			};

			return $.telligent.evolution.post({
				url: context.deleteNotificationsUrl,
				data: prefix(data)
			});
		}
	};

	var api = {
		register: function(context) {
			// init
			context.list = $(context.list);
			context.filter = $(context.filter);
			context.selections = [];
			context.notificationsTypesWrapper = $(context.notificationsTypesWrapper);
			context.deleteSelectedButton = $(context.deleteSelectedButton);
			context.deSelectAllButton = $(context.deSelectAllButton);

			handleMultiSelectionUi(context);

			// filtering
			context.currentFilter = parseFilter(context);
			context.filter.on('change', function(e){
				// adjust filter
				context.selections = [];
				context.deleteSelectedButton.html(context.deleteSelectedText);
				$.telligent.evolution.administration.loading(true);
				context.currentFilter = parseFilter(context);
				context.list.empty();
				context.scrollable.reset();
				handleMultiSelectionUi(context);
			});

			// paging
			context.scrollable = $(context.list).evolutionScrollable({
				load: function(pageIndex) {
					return $.Deferred(function(d) {

						var filter = $.extend({}, context.currentFilter, {
							pageIndex: pageIndex
						});

						Model.listNotifications(context, filter)
							.then(function(response){
								response = $.trim(response);

								if (pageIndex == 0 && response.length == 0) {
									$('.no-matches', $.telligent.evolution.administration.panelWrapper()).show();
								}
								else if (pageIndex == 0 ) {
									$('.no-matches', $.telligent.evolution.administration.panelWrapper()).hide();
								}

								if(response.length > 0) {
									$.telligent.evolution.administration.loading(false);
									d.resolve(response);
								} else {
									$.telligent.evolution.administration.loading(false);
									d.reject();
								}
							})
							.catch(function(){
								$.telligent.evolution.administration.loading(false);
								d.reject();
							});
					});
				}
			});

			// multi-selection
			context.list.on('click','input[type="checkbox"]', function(e){
				e.stopPropagation();
			});
			context.list.on('change','input[type="checkbox"]', function(){
				context.selections = [];
				context.list.find('input[type="checkbox"]:checked').each(function(){
					context.selections.push($(this).attr('id'));
				});
				handleMultiSelectionUi(context);
			});

			// delete selected
			context.deleteSelectedButton.on('click', function(e){
				e.preventDefault();
				if(confirm(context.deleteSelectedConfirmText)) {
					$.telligent.evolution.administration.loading(true);
					Model.deleteNotifications(context, {
							notificationIds: context.selections
						})
						.then(function(){
							$.telligent.evolution.administration.loading(false);
							$.each(context.selections, function(i, id){
								context.list.find('[data-notificationId="' + id + '"]').remove();
							});
							context.selections = [];
							handleMultiSelectionUi(context);
						})
						.catch(function(){
							$.telligent.evolution.administration.loading(false);
						});
				}
				return false;
			});

			// deselect
			context.deSelectAllButton.on('click', function(e){
				e.preventDefault();
				context.selections = [];
				context.list.find('input[type="checkbox"]').prop('checked', false);
				handleMultiSelectionUi(context);
				return false;
			});

			$.telligent.evolution.messaging.subscribe('delete-notification', function(data)
				{
					if(confirm(context.deleteConfirmText)) {
						var selections = [ $(data.target).data('notificationid') ];
						Model.deleteNotifications(context, {
							notificationIds: selections
						})
						.then(function(){
							$.telligent.evolution.administration.loading(false);
							$.each(selections, function(i, id){
								context.list.find('[data-notificationid="' + id + '"]').remove();
							});
						})
						.catch(function(){
							$.telligent.evolution.administration.loading(false);
						});
					}
				});

			$.telligent.evolution.messaging.subscribe('systemnotification.resolved', function(data)
				{
					context.list.find('[data-notificationid="' + data.id + '"]').remove();
				});

			$.telligent.evolution.messaging.subscribe('notifications-refresh', function()
				{
					context.list.empty();
					context.scrollable.reset();
				});

		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.systemNotificationsPanel = api;

})(jQuery, window);
