(function ($) {
	var maxHeight = 400,
		checkResize = function () {
			$('.systemnotification-view .content .content-scrollable-wrapper').each(function () {
				var w = $(this);
				var sw = w.prop('scrollWidth') || w.width();
				if (sw > w.outerWidth()) {
					w.addClass('content-scrollable-wrapper-scrolled').css('max-height', (maxHeight * .8) + 'px');
				} else {
					w.removeClass('content-scrollable-wrapper-scrolled').css('max-height', 'none');
				}
			});
		}

	$(window).on('resized', function () {
		checkResize();
	});

	$(function () {
		$('.systemnotification-view .content  table, .systemnotification-view .content pre').each(function () {
			var t = $(this);
			if (t.parents('.content-scrollable-wrapper').length == 0) {
				t.wrap('<div class="content-scrollable-wrapper" style="max-width: 100%; overflow: auto;"></div>');
			}
		});
		checkResize();
	});
})(jQuery);