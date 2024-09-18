define('Utility', function($, global, undef) {

	var Utility = {
		parseUrl: function (context, url) {
			data = {};
			var urlParts = url.split("#"),
				rejoinedParts = '';
			// firefox workaround
			if(urlParts.length > 2) {
				$.each(urlParts, function(i, part) {
					if(i > 0) {
						if(i > 1) {
							rejoinedParts += '#';
						}
						rejoinedParts += part;
					}
				});
				urlParts = [ urlParts[0], rejoinedParts ];
			}
			if(urlParts.length === 2) {
				data = $.telligent.evolution.url.parseQuery(urlParts[1]);
			}
			return data;
		},
		scrollContainerToFocusOnSelection: function (container, item, scrollOffsetFactor, immediate) {
			scrollOffsetFactor = scrollOffsetFactor || 1;
			// get current offsets
			var containerOffset = container.offset();
			if(!containerOffset)
				return;
			var itemOffset = item.offset();
			if(!itemOffset)
				return;

			// if not currently visible (above or beneath currently visible window, then scroll it)
			if(itemOffset.top < containerOffset.top || (itemOffset.top + item.height()) > (containerOffset.top + container.height())) {
				var scrollTop = (container.scrollTop() - containerOffset.top + itemOffset.top - (item.height() * scrollOffsetFactor));
				if(immediate) {
					container.stop().scrollTop(scrollTop);
				} else {
					container.stop().animate({
						scrollTop: scrollTop
					}, 100);
				}
			}
		},
		setHtml: function(parent, content) {
			return $.Deferred(function(d) {
				parent.one('rendered', function() {
					d.resolve();
				}).html(content);
			}).promise();
		},
		appendHtml: function(parent, content) {
			return $.Deferred(function(d) {
				parent.one('rendered', function() {
					d.resolve();
				}).append(content);
			}).promise();
		},
		debounce: function(fn, limit) {
			var bounceTimout;
			return function(){
				var scope = this,
					args = arguments;
				clearTimeout(bounceTimout);
				bounceTimout = setTimeout(function(){
					fn.apply(scope, args);
				}, limit || 10);
			}
		}
	};

	return Utility;

}, jQuery, window);
