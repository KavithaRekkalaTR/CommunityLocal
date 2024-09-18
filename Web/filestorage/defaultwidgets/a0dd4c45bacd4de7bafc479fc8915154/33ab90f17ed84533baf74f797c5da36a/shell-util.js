/*

StudioUtility

API:

StudioUtility.scrollContainerToFocusOnSelection(container, item, extraOffset)
StudioUtility.guid()

*/
define('StudioUtility', function($, global, undef) {

	function r4() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	};

	var StudioUtility = {
		scrollContainerToFocusOnSelection: function (container, item, extraOffset) {
			// get current offsets
			var containerOffset = container.offset();
			if(!containerOffset)
				return;
			if(!item)
				return;
			var itemOffset = item.offset();
			if(!itemOffset)
				return;

			var itemOffsetTop = itemOffset.top - extraOffset;

			// if not currently visible (above or beneath currently visible window, then scroll it)
			if((itemOffsetTop) < (containerOffset.top ) ||
				(itemOffsetTop + item.height()) > (containerOffset.top + container.height() - extraOffset)) {
				container.stop().animate({
					scrollTop: (container.scrollTop() - containerOffset.top + itemOffsetTop)
				}, 100);
			}
		},
		guid: function() {
			return r4() + r4() + '-' + r4() + '-' + r4() + '-' + r4() + '-' + r4() + r4() + r4();
		},
		forEach: function(obj, fn) {
			for(var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					fn(prop, obj[prop]);
				}
			}
		},
		/*
		options
			normalizeEmpty: true,
			normalizeLineEndings: true,
			normalizeLeadingAndTrailing: true,
			normalizeLineLeadingAndTrailing: true)
		*/
		normalize: function(value, options) {
			options = $.extend({
				normalizeEmpty: true,
				normalizeLineEndings: true,
				normalizeLeadingAndTrailing: true,
				normalizeLineLeadingAndTrailing: true
			}, options || {});

			if (options.normalizeEmpty)
				value = value || '';

			if (value === null)
				return null;

			if (options.normalizeLeadingAndTrailing)
				value = $.trim(value);

			if (options.normalizeLineEndings)
				value = value.replace(/\r\n/g,'\n');

			if (options.normalizeLineLeadingAndTrailing)
				value = value.split('\n').map(function(l) { return $.trim(l); }).join('\n');

			return value;
		}
	};

	return StudioUtility;

}, jQuery, window);
