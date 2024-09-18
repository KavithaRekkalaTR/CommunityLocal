(function ($, global, undef) {

	var defaults = {};
	var refreshInterval = 10 * 1000;

	function loadAndRenderIndicators(context) {
		$.telligent.evolution.get({
			url: context.indicatorsUrl,
			cache: false
		}).then(function (r) {
			if ($(context.wrapper).find('li.system-indicator').length == 0) {
				$(context.wrapper).html(r);
			} else {
				var indicatorsContainer = $(context.wrapper).find('.content-list.system-indicators');
				$(context.wrapper).find('div.indicator.message').replaceWith($(r).filter('div.indicator.message'));
				$(r).find('li.system-indicator').each(function () {
					var updatedIndicator = $(this);
					var existingIndicator = $(context.wrapper).find('li.system-indicator[data-indicator="' + updatedIndicator.data('indicator') + '"]');

					existingIndicator.find('h4.indicator.name').replaceWith(updatedIndicator.find('h4.indicator.name'));
					existingIndicator.find('.indicator.attributes').replaceWith(updatedIndicator.find('.indicator.attributes'));
					existingIndicator.find('.indicator.description').empty().append(updatedIndicator.find('.indicator.description').html());

					var existingViewMore = existingIndicator.find('.view-more');
					var updatedViewMore = updatedIndicator.find('.view-more');
					existingViewMore.find('a').attr('href', updatedViewMore.find('a').attr('href'));

					existingIndicator.appendTo(indicatorsContainer);
					if (updatedViewMore.data('empty') !== undef) {
						existingViewMore.hide();
					} else {
						existingViewMore.show();
					}
				});

			}

			if (context.initiallyFocusedIndicator) {
				var initiallyFocusOn = $(context.wrapper).find('li.system-indicator[data-indicator="' + context.initiallyFocusedIndicator + '"]');
				initiallyFocusOn.click();
				context.initiallyFocusedIndicator = null;
			}

			$.telligent.evolution.administration.refreshBadges();
		})
	}

	var api = {
		register: function(options) {
			var context = $.extend({}, defaults, options || {});

			var refreshOnInterval;
			var refreshOnSocketMessage;
			var initiallyFocusedIndicator = $.telligent.evolution.url.hashData()['CurrentIndicator'];
			if (initiallyFocusedIndicator) {
				context.initiallyFocusedIndicator = initiallyFocusedIndicator;
			}

			function rescheduleRefreshOnInterval() {
				clearInterval(refreshOnInterval);
				refreshOnInterval = setInterval(function () {
					loadAndRenderIndicators(context);
				}, refreshInterval);
			}

			function rescheduleOnMessage(){
				clearTimeout(refreshOnSocketMessage);
				refreshOnSocketMessage = setTimeout(function () {
					loadAndRenderIndicators(context);
				}, 200);
			}

			loadAndRenderIndicators(context);
			rescheduleRefreshOnInterval();

			$.telligent.evolution.messaging.subscribe('socket.connected', 'systemStatusPanel', function () {
				if ($.telligent.evolution.sockets.systemStatusPanel) {
					$.telligent.evolution.sockets.systemStatusPanel.on('refresh', function (data) {
						rescheduleOnMessage();
						rescheduleRefreshOnInterval();
					});
				}
			});

			$.telligent.evolution.administration.on('panel.unloaded', function () {
				if ($.telligent.evolution.sockets.systemStatusPanel)
					$.telligent.evolution.sockets.systemStatusPanel.off('refresh');
				clearInterval(refreshOnInterval);
				$.telligent.evolution.messaging.unsubscribe('systemStatusPanel');
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.systemStatusPanel = api;

})($, window);
