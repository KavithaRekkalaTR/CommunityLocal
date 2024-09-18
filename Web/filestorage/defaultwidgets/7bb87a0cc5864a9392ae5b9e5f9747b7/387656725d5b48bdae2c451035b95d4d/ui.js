(function($, global, undef) {

	var messaging = $.telligent.evolution.messaging;

	function moveTo(context, index, duration) {
		global.clearTimeout(context.moveDebounce);
		context.moveDebounce = global.setTimeout(function(){
			if(index >= context.items.length)
				index = context.items.length - 1;
			else if(index < 0)
				index = 0;
			context.currentIndex = index;

			context.list.evolutionTransform({
				left: (-1 * context.currentIndex * (context.list.width() / context.items.length))
			}, {
				duration: (duration === undef ? 600 : duration),
				easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)'
			});

			// highlight dot
			context.wrapper.find('.feature-link')
				.removeClass('active')
				.filter('[data-featureindex='+ index +']')
				.addClass('active');

			// adjust foreground color of navigation to match item
			context.navigationItems.css({
				color: $(context.items[index]).data('foreground')
			});

			// animate current slide
			$(context.items.removeClass('active')[index]).addClass('active');
		}, 10);
	}

	function moveNext(context, duration) {
		if((context.currentIndex || 0) >= context.items.length - 1)
			moveTo(context, 0, duration);
		else
			moveTo(context, (context.currentIndex || 0) + 1, duration);
	}

	function movePrevious(context, duration) {
		if((context.currentIndex || 0) <= 0)
			moveTo(context, context.items.length - 1, duration);
		else
			moveTo(context, (context.currentIndex || 0) - 1, duration);
	}

	function startAutoNavigation(context) {
		global.clearTimeout(context.pageHandle);
		if (context.automatic && !context.mouseover) {
			context.pageHandle = global.setTimeout(function(){
				if(!context.panning)
					moveNext(context);
				startAutoNavigation(context);
			}, context.duration);
		}
	}

	function stopAutoNavigation(context) {
		global.clearTimeout(context.pageHandle);
	}

	function initManualNavigation(context) {
		messaging.subscribe('widget.featured-content-carousel.prev', function(data){
			if (data.target && $.contains($(context.wrapper).get(0), data.target))
				movePrevious(context);
		});
		messaging.subscribe('widget.featured-content-carousel.next', function(data){
			if (data.target && $.contains($(context.wrapper).get(0), data.target))
				moveNext(context);
		});
		messaging.subscribe('widget.featured-content-carousel.feature', function(data){
			if (data.target && $.contains($(context.wrapper).get(0), data.target))
				moveTo(context, $(data.target).data('featureindex'));
		});

		context.wrapper.on('click', function(e){
			if($(e.target).is('a'))
				return;
			var featureUrl = $(context.items[context.currentIndex]).data('featureurl');
			if(featureUrl && !context.panning) {
				global.location = featureUrl;
			}
		});
	}

	function initTouchNavigation(context) {
		if(context.items.length <= 1)
			return;
		var startX;
		var diff;
		var currentOffset;
		context.container.off('swipeleft swiperight panstart pan panend')
			.on({
				swipeleft: function(e) {
					moveNext(context, 250);
					startAutoNavigation(context);
					e.preventDefault();
					return false;
				},
				swiperight: function(e) {
					movePrevious(context, 250);
					startAutoNavigation(context);
					e.preventDefault();
					return false;
				},
				pointermove: function(e) {
					if(context.panning) {
						e.preventDefault();
						return false;
					}
				},
				panstart: function(e) {
					if(!(e.direction == 'left' || e.direction == 'right'))
						return;
					startX = e.pageX;
					context.panning = true;

					currentOffset = (-1 * context.currentIndex * (context.list.width() / context.items.length));

					stopAutoNavigation(context);
				},
				pan: function(e) {
					if(e.direction == 'left' || e.direction == 'right') {
						e.preventDefault();
						diff = e.pageX - startX;
						context.list.evolutionTransform({
							left: (currentOffset + diff)
						})
						return false;
					}
				},
				panend: function(e) {
					diff = e.pageX - startX;
					var duration = 150;
					if(Math.abs(diff) >= ((context.list.width() / context.items.length) / 2)) {
						if(diff > 0) {
							if(context.currentIndex > 0)
								movePrevious(context, duration);
							else
								moveTo(context, context.items.length - 1, duration);
						}
						else if(diff <= 0) {
							if(context.currentIndex < context.items.length - 1)
								moveNext(context, duration);
							else
								moveTo(context, 0, duration);
						}
						else {
							moveTo(context, context.currentIndex || 0, duration);
						}
						return false;
					} else {
						moveTo(context, context.currentIndex || 0, duration);
					}
					setTimeout(function(){
						context.panning = false;
					}, 50);
					startAutoNavigation(context);
				}
			});
	}

	var api = {
		register: function(options) {
			var context = $.extend({}, api.defaults, options || {}, {
				itemCount: 0
			});

			context.wrapper = $(options.wrapper);
			context.wrapperContent = context.wrapper.find('.content-fragment-content');
			context.container = context.wrapper.find('.slider-container');
			context.list = context.wrapper.find('.content-list.content');
			context.items = context.wrapper.find('li.content-item');
			context.navigationItems = context.container.find('.feature-navigation .navigation, .feature-navigation .feature-links .feature-link');

			// pause on hover
			context.wrapperContent.on({
				mouseenter: function(){
					context.mouseover = true;
					stopAutoNavigation(context);
				},
				mouseleave: function(){
					context.mouseover = false;
					startAutoNavigation(context);
				}
			});

			$(global).on('resized', function(){
				moveTo(context, (context.currentIndex || 0), 0);
			});

			initManualNavigation(context);
			initTouchNavigation(context);
			startAutoNavigation(context);
			moveTo(context, 0);
		}
	};

	api.defaults = {
		automatic: true,
		duration: 5000
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.featuredContentList = api;

})(jQuery, window);
