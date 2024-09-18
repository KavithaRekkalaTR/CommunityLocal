(function ($, global, undef) {

	var administration = $.telligent.evolution.administration;
	var messaging = $.telligent.evolution.messaging;

	function prefix(options) {
		var data = {};
		$.each(options, function (k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	var Model = {
		listNotifications: function (context, options) {
			return $.telligent.evolution.get({
				url: context.getNotificationsUrl,
				data: prefix(options)
			});
		},
		// options
		//   notificationIds: [] or null
		deleteNotifications: function (context, options) {
			var data = {
				notificationIds: (options.notificationIds || []).join()
			};

			return $.telligent.evolution.post({
				url: context.deleteNotificationsUrl,
				data: prefix(data)
			});
		}
	};

	var notificationListApi = {
		register: function (context) {
			administration.size('normal');

			var headingTemplate = $.telligent.evolution.template(context.headerTemplateId);
			administration.header(headingTemplate());

			// init
			context.list = $(context.list);
			context.filter = 'unresolved';

			// paging
			context.scrollable = administration.scrollable({
				target: context.list,
				load: function (pageIndex) {
					return $.Deferred(function (d) {

						var filter = {
							pageIndex: pageIndex,
							unresolved: context.filter == 'unresolved'
						};

						Model.listNotifications(context, filter)
							.then(function (response) {
								response = $.trim(response);
								if (pageIndex == 0 && response.length == 0) {
									$('.no-matches', administration.panelWrapper()).show();
								} else if (pageIndex == 0) {
									$('.no-matches', administration.panelWrapper()).hide();
								}

								if (response.length > 0) {
									context.list.append(response);
									administration.loading(false);
									d.resolve();
								} else {
									administration.loading(false);
									d.reject();
								}
							})
							.catch(function () {
								administration.loading(false);
								d.reject();
							});
					});
				}
			});

			messaging.subscribe('widget.systemnotifications.filter', function (data) {
				var filter = $(data.target).data('filter');
				context.filter = filter;
				context.list.empty();
				$('.no-matches', administration.panelWrapper()).hide();
				context.scrollable.reset();

				$(data.target).closest('ul').children('li').removeClass('selected');
				$(data.target).parent().addClass('selected');
				administration.header();
			});

			messaging.subscribe('widget.systemnotification.view', function (data) {
				var id = $(data.target).data('notificationid');
				var name = $(data.target).data('name');

				administration.open({
					name: name,
					content: $.telligent.evolution.get({
						url: context.notificationsUrl,
						data: prefix({ id: id })
					}),
					cssClass: 'systemnotification-view'
				});
			});

			messaging.subscribe('systemnotification.resolved', function (data) {
				context.list.find('[data-notificationid="' + data.id + '"]').remove();
				if (context.list.children().length == 0) {
					context.scrollable.reset();
				}
			});

			if (context.notification.notificationid > 0 && $.telligent.evolution.url.hashData()['viewnotification'] == '1') {
				administration.open({
					name: context.notification.name,
					content: $.telligent.evolution.get({
						url: context.notificationsUrl,
						data: prefix({ id: context.notification.notificationid })
					}),
					cssClass: 'systemnotification-view'
				});
			}
		}
	};

	var notificationApi = {
		register: function (context) {
			administration.size('wide');

			if (context.isResolvable && context.headerTemplateId) {
				administration.header($.telligent.evolution.template(context.headerTemplateId)({
					id: context.notificationId
				}));
			}

			messaging.subscribe('widget.systemnotifications.resolve', function (data) {
				if (confirm(context.deleteConfirmText)) {
					Model.deleteNotifications(context, {
							notificationIds: [$(data.target).data('notificationid')]
						})
						.then(function () {
							$.telligent.evolution.notifications.show(context.markedResolvedText, {
								type: 'success'
							});

							administration.close();
						})
						.catch(function () {
							administration.loading(false);
						});
				}
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.systemNotificationsPanel = notificationListApi;
	$.telligent.evolution.widgets.systemNotificationsNotificationPanel = notificationApi;

})(jQuery, window);