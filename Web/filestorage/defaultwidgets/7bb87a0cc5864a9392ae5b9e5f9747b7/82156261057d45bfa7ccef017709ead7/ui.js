(function(j, global){

	if (typeof j.telligent === 'undefined') {
		j.telligent = {};
	}

	if (typeof j.telligent.evolution === 'undefined') {
		j.telligent.evolution = {};
	}

	if (typeof j.telligent.evolution.widgets === 'undefined') {
		j.telligent.evolution.widgets = {};
	}

	var _height = 0,
		_maximumViewableHeight = $(global).height(),
		_usingScrollableHeight = false,
		_processPage = function(context, jQ)
		{
			jQ.filter('.slideshow-item')
				.each(function() {
					var t = j(this);
					t.data('mediaGallerySlideshow', { mediaId: t.find('input').val(), index: context._media.length});
					context._media[context._media.length] = t;

					t
						.on('mouseover', function() {
							if (j(this).data('mediaGallerySlideshow').index !== context._currentIndex) {
								j(this).children().css('background-color', '#333');
							}
						})
						.on('mouseout', function() {
							if (j(this).data('mediaGallerySlideshow').index === context._currentIndex) {
								j(this).children().css('background-color', '#222');
							} else {
								j(this).children().css('background-color','');
							}
						})
						.on('click', function() {
							_showItem(context, j(this).data('mediaGallerySlideshow').index);
						});
				});
		},
		_showItem = function(context, index, ignoreReload)
		{
			if ((!ignoreReload && context._currentIndex === index) || index >= context._media.length || index < 0) {
				return;
			}

			context._media[context._currentIndex].children().css('background-color', '');
			context._currentIndex = index;
			context._media[index].children().css('background-color', '#222');

			j.telligent.evolution.get({
					url: context.viewUrl,
					data: { w_mediaId: context._media[index].data('mediaGallerySlideshow').mediaId, w_height: _height },
					success: function(response)
					{
						context.currentMedia.animate({ opacity: .1 }, 'fast', function() {
							context.currentMedia.html(response);
							context.currentMedia.animate({ opacity: 1 }, 'fast');
							if (context._playing)
							{
								global.clearTimeout(context._playHandle);
								context._playHandle = global.setTimeout(function() { _moveNext(context); }, context.itemDuration);
							}
						});
					},
					error: function(xhr, desc)
					{
						$.telligent.evolution.notifications.show(desc,{type:'error'});
						if (context._playing)
						{
							global.clearTimeout(context._playHandle);
							context._playHandle = global.setTimeout(function() { _moveNext(context); }, context.itemDuration);
						}
					}
				});

			var scrollIndex = (index - Math.floor((context.allMedia.parent().width() / (context.itemWidth * 2)) - 0.5)) * -context.itemWidth;
			if (scrollIndex > 0) {
				scrollIndex = 0;
			}

			context.allMedia.animate({ left: scrollIndex + 'px' }, 499, function() { _validatePageLoaded(context); });

			_validatePageLoaded(context);
		},
		_validatePageLoaded = function(context)
		{
			if (context._currentIndex + 1 + Math.ceil(context.allMedia.parent().width() / context.itemWidth) > context._media.length && context._media.length !== context.totalItems)
			{
				var pageToLoad = Math.ceil(context._media.length / context.itemsPerPage);
				if (pageToLoad > context._lastPageLoaded)
				{
					context._lastPageLoaded = pageToLoad;
					j.telligent.evolution.get({
						url: context.pageUrl,
						data: { w_pageIndex: pageToLoad, w_offset: (context._media.length * context.itemWidth) },
						success: function(response)
						{
							var p = j(response);
							_processPage(context, p);
							context.allMedia.append(p);
						},
						error: function(xhr, desc)
						{
							$.telligent.evolution.notifications.show(desc,{type:'error'});
							context._lastPageLoaded = pageToLoad - 1;
						}
					});
				}
			}
		},
		_moveNext = function(context)
		{
			if (context._currentIndex + 1 < context.totalItems) {
				_showItem(context, context._currentIndex + 1);
			} else {
				_showItem(context, 0);
			}
		},
		_movePrevious = function(context)
		{
			if (context._currentIndex > 0) {
				_showItem(context, context._currentIndex - 1);
			}
		},
		_resizeViewer = function(context) {
			var height = Math.round(_maximumViewableHeight * .8) - 180;
			if (height != _height && (_height <= 0 || (Math.abs(height - _height) / _height) >= .2)) {
				_height = height;
				_showItem(context, context._currentIndex, true);
			}
		}

	j.telligent.evolution.widgets.mediaGallerySlideshow = {
		register: function(context) {
			context._media = [];
			_processPage(context, context.allMedia.children());
			context._currentIndex = 0;
			context._playing = true;
			context._lastPageLoaded = 0;
			context._playHandle = global.setTimeout(function() { _moveNext(context); }, context.itemDuration);
			$(context.wrapper).on('mouseover', function() {
				if (context._playing) {
					context._playing = false;
					global.clearTimeout(context._playHandle);
				}
			}).on('mouseout', function() {
				if (!context._playing) {
					context._playing = true;
					context._playHandle = global.setTimeout(function() { _moveNext(context); }, context.itemDuration);
				}
			});

			if (context._media.length > 0) {
				context._media[0].children().css('background-color', '#222');
			}

			if (context.totalItems <= 1) {
				context.next.find('img').attr('src', context.nextDisabledImageUrl);
			}

			_resizeViewer(context);

			$(window).on('resized', function() {
				if (!_usingScrollableHeight) {
					_maximumViewableHeight = $(window).height();
					_resizeViewer(context);
				}
			});

			$.telligent.evolution.messaging.subscribe('window.scrollableheight', function(data) {
				_maximumViewableHeight = data.height;
				_usingScrollableHeight = true;
				_resizeViewer(context);
			});
		}
	};

})(jQuery, window);
