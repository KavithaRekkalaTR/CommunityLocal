define('evolutionSticky', function($, global, undef) {

	var scrollTimeout;

	function defix(settings) {

		// rest other fixes
		for(var i = 0; i < settings.elms.length; i++) {
			settings.elms[i].elm.css({
				position: 'static',
				top: 'auto'
			});
			settings.elms[i].fixed = false;
			if(settings.elms[i].clone)
				settings.elms[i].clone.remove();
		}
	}

	function affix(settings, elm) {
		defix(settings);

		// fix new one
		elm.fixed = true;

		elm.clone = elm.clone || $('<div></div>').css({
			width: elm.elm.outerWidth(),
			height: elm.elm.outerHeight(),
			margin: elm.elm.css('margin'),
			padding: elm.elm.css('padding')
		});

		elm.elm.before(elm.clone);

		elm.elm.css({
			position: 'fixed',
			top: 0,
		});
	}

	function reposition(settings) {
		var scrolled = settings.scrollContainer.scrollTop();
		for(var i = 0; i < settings.elms.length; i++) {
			if(scrolled >= settings.elms[i].top && !settings.elms[i].fixed) {
				affix(settings, settings.elms[i]);
				settings.elms[i].elm.trigger('evolutionStickeyFixed');
			} else if(scrolled <= settings.elms[i].top && settings.elms[i].fixed) {
				defix(settings);
				settings.elms[i].elm.trigger('evolutionStickeyUnFixed');
			}
		}
	}

	$.fn.evolutionSticky = function(options) {

		var settings = $.extend({}, $.fn.evolutionSticky.defaults, options || {});

		settings.defaultContainerPosition = $(settings.scrollContainer).css('position');

		settings.elms = [];
		$(this).each(function(){
			var elm = $(this);
			settings.elms.push({
				elm: elm,
				top: elm.offset().top,
				height: elm.height(),
				width: elm.outerWidth()
			});
			// persist the width
			elm.css({
				width: elm.outerWidth()
			})
		});

		$(settings.scrollContainer).off('.evolutionSticky').on('scroll.evolutionSticky', function(){
			reposition(settings);
		});
		reposition(settings);

		return this;
	};
	$.fn.evolutionSticky.defaults = {
		scrollContainer: global
	};

	return {};

}, jQuery, window);
