(function ($, global) {

	function loadNext(options) {
		if (options.isLoadingMore || !options.hasMore)
			return;

		options.isLoadingMore = true;
		options.loading.show();

		var data = $.extend({}, options.query);
		data[options.pageIndexKey] = options.pageIndex + 1;

		$.telligent.evolution.get({
				url: options.moreUrl,
				data: data
			})
			.then(function (response) {
				setMarkAllVisibility(options, $(response));
				var items = $(response).find('li.content-item');
				if (items.length > 0) {
					options.hasMore = items.data('hasmore') === true;
					options.list.append(items);
					options.pageIndex++;
					options.noResults.hide();
				} else {
					options.hasMore = false;
					if (options.pageIndex == 0) {
						options.noResults.show();
					}
				}
			})
			.always(function () {
				options.isLoadingMore = false;
				options.loading.hide();
			});
	}

	function reset(options) {
		options.isLoadingMore = false;
		options.hasMore = true;
		options.pageIndex = 0;
		options.list.empty();
		options.pageUntilScrollAttempts = 5;
		if (options.infiniteScroll) {
			pageUntilScrolls(options);
		} else {
			loadNext(options);
		}
	}

	function markAllAsRead(categoryId) {
		var data = {
			MarkAsRead: true
		};
		if (categoryId) {
			data.NotificationCategoryId = categoryId;
		}

		return $.telligent.evolution.put({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notifications.json',
			data: data
		});
	}

	function setMarkAllVisibility(options, list) {
		var includeMarkAction = $(list).data('markall');
		if (includeMarkAction) {
			options.markActions.show();
		} else {
			options.markActions.hide();
		}
	}

	function pageUntilScrolls(options) {
		if (options.pageUntilScrollAttempts > 0 && options.list.outerHeight(true) < $('body').height()) {
			options.pageUntilScrollAttempts--;
			options.isLoadingMore = true;
			options.loading.show();

			var data = $.extend({}, options.query);
			data[options.pageIndexKey] = options.pageIndex + 1;

			$.telligent.evolution.get({
					url: options.moreUrl,
					data: data
				})
				.then(function (response) {
					if ($.trim(response).length > 0)
						setMarkAllVisibility(options, $(response));
					var items = $(response).find('li.content-item');
					if (items.length > 0) {
						options.hasMore = items.data('hasmore') === true;
						options.list.append(items);
						options.pageIndex++;
						options.noResults.hide();
					} else {
						options.hasMore = false;
						if (options.pageIndex == 0) {
							options.noResults.show();
						}
					}

					if (options.hasMore) {
						pageUntilScrolls(options);
					}
				})
				.always(function () {
					options.isLoadingMore = false;
					options.loading.hide();
				});
		}
	}

	var api = {
		register: function (options) {
			options.isLoadingMore = false;
			options.pageIndex = 1;
			options.loading = $('.ui-loading', options.wrapper).hide();
			options.list = $('ul.content-list', options.wrapper);
			options.noResults = $('.message.norecords', options.wrapper).hide();
			options.markActions = $('.actions.markall', options.wrapper);
			setMarkAllVisibility(options, options.list);

			options.wrapper.on('click', 'li.notification', function (e) {
				var n = $(this);
				var url = n.data('targeturl');
				if (n.hasClass('unread')) {
					$.telligent.evolution.put({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notification/{NotificationId}.json',
						data: {
							NotificationId: n.data('notificationid'),
							MarkAsRead: 'True'
						},
						success: function (r) {
							n.removeClass('unread');
							$.telligent.evolution.messaging.publish('notification.read', {
								typeId: n.data('notificationtypeid'),
								unreadCount: '-=1'
							}, {
								crossWindow: true
							});
							if (url) {
								$.telligent.evolution.url.navigateTo(url);
							}
						}
					});
				} else if (url) {
					$.telligent.evolution.url.navigateTo(url);
				}
			});

			$('select', options.wrapper).on('change', function () {
				var s = $(this);
				options.query[s.data('query')] = s.val();
				reset(options);
			});

			if (options.infiniteScroll) {
				$(document).on('scrollend', function (e) {
					loadNext(options);
				});
			}

			options.wrapper.on('click', '.mark a', function (e) {
				e.preventDefault();
				var markLink = $(e.target);
				var notificationLineItem = $(this).closest('li');
				var notificationId = notificationLineItem.data('notificationid');

				if (notificationId) {
					var markNotificationPromise = $.telligent.evolution.put({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notification/{NotificationId}.json',
						data: {
							NotificationId: notificationId,
							MarkAsRead: true
						}
					});
					markNotificationPromise.then(function () {
						markLink.hide();
						notificationLineItem.removeClass('unread');
					});
				}
				return false;
			});

			$.telligent.evolution.messaging.subscribe('notification.raised', function (d) {
				var data = $.extend({}, options.query);
				data[options.pageIndexKey] = 1;

				$.telligent.evolution.get({
						url: options.moreUrl,
						data: data
					})
					.then(function (response) {
						var lastItem = null;
						$(response).find('li.content-item').each(function () {
							var item = $(this);
							options.list.find('li.content-item[data-notificationid="' + item.data('notificationid') + '"]').remove();
							if (lastItem) {
								lastItem.after(item);
							} else {
								options.list.prepend(item);
							}
							lastItem = item;
						});

						if (options.maxItems > 0) {
							while (options.list.children().length > options.maxItems) {
								options.list.children().last().remove();
							}
						}
					});
			});

			$.telligent.evolution.messaging.subscribe('notification.read', function (d) {
				var item = options.list.find('.content-item[data-notificationid="' + d.id + '"]');
				if (item.length > 0) {
					if (options.query.w_nr != 'false') {
						item.removeClass('unread').find('.mark').remove();
					} else {
						item.fadeOut(100, function () {
							item.remove();
							if (options.list.children().length == 0) {
								reset(options);
							}
						});
					}
				}
			});

			$.telligent.evolution.messaging.subscribe(options.markAllAsReadMessage, function (d) {
				markAllAsRead($('select.category', options.wrapper).val()).then(function () {
					reset(options);
				});
			});

			if (options.infiniteScroll) {
				options.pageUntilScrollAttempts = 5;
				pageUntilScrolls(options);
			}
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.notificationList = api;

})(jQuery, window);