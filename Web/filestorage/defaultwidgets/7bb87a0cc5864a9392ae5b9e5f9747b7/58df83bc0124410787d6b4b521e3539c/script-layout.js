var Layout = function(context) {
	var SIDEBAR_WIDTH = 250;
	var testResizeHandle = null;
	var lastSize = null;
	var lastSingleColumn = false;

	function isSingleColumn() {
		return context.layoutRegions.wrapper.parents('.single-column').length > 0 || context.layoutRegions.wrapper.width() <= (SIDEBAR_WIDTH * 2.5);
	}

	function measure() {
		var size = {
		  wrapperHeight: context.layoutRegions.wrapper.height(),
		  wrapperWidth: context.layoutRegions.wrapper.width(),
		  conversationHeaderHeight : context.layoutRegions.conversationHeader.outerHeight(),
		  conversationListHeaderHeight: context.layoutRegions.conversationListHeader.outerHeight(),
		  editorHeight: context.layoutRegions.editor.outerHeight()
		};

		return size;
	}

	function initialize() {
		context.layoutRegions.wrapper.parents('div').css({
		   'padding-top': '0px',
		   'padding-bottom': '0px',
		   'margin-top': '0px',
		   'margin-buttom': '0px'
		});
		$('.footer-fragments-header, .footer-fragments, .footer-fragments-footer').css({
			'height': '0px',
			'min-height': '0px',
			'overflow': 'hidden'
		});
		context.layoutRegions.wrapper.css({
			position: 'relative',
			width: '100%',
			height: '100%'
		});
		context.layoutRegions.conversationListHeader.css({
			position: 'absolute'
		});
		context.layoutRegions.conversationList.css({
			position: 'absolute',
			overflow: 'auto'
		});
		context.layoutRegions.conversationHeader.css({
			position: 'absolute'
		});
		context.layoutRegions.conversation.css({
			position: 'absolute',
			overflow: 'auto'
		});
		context.layoutRegions.editor.css({
			position: 'absolute'
		});
	}

	function refresh(force) {
		global.clearTimeout(testResizeHandle);

		var wrapperHeight = $('body').innerHeight();

		$('.header-fragments-header, .header-fragments, .header-fragments-footer').each(function() {
		   var height = $(this).outerHeight();
		   if (!isNaN(height)) {
			   wrapperHeight -= height;
		   }
		});

		var fixedOffset = 0;
		$('.header-fragments div').each(function() {
			var header = $(this);
			if (header.is(':visible') && header.css('position') == 'fixed') {
				var offset = parseInt(header.css('top'), 10);
				if (isNaN(offset)) {
					offset = 0;
				}
				offset += header.outerHeight();
				if (offset > fixedOffset) {
					fixedOffset = offset;
				}
			}
		});
		wrapperHeight -= fixedOffset;

		context.layoutRegions.wrapper.css({
			height: wrapperHeight + 'px',
			visibility: 'visible'
		});

		var size = measure();
		var singleColumn = isSingleColumn();

		if (force === true
			|| lastSize == null
			|| lastSize.wrapperHeight != size.wrapperHeight
			|| lastSize.wrapperWidth != size.wrapperWidth
			|| lastSize.conversationHeaderHeight != size.conversationHeaderHeight
			|| lastSize.conversationListHeaderHeight != size.conversationListHeaderHeight
			|| lastSize.editorHeight != size.editorHeight
			|| lastSingleColumn != singleColumn) {
			    var isShorter = lastSize && lastSize.wrapperHeight > size.wrapperHeight;
			    
				lastSize = size;
				lastSingleColumn = singleColumn;

			context.layoutRegions.conversationListHeader.css({
				left: '0px',
				top: '0px',
				width: singleColumn ? '100%' : SIDEBAR_WIDTH + 'px'
			});
			context.layoutRegions.conversationList.css({
				top: size.conversationListHeaderHeight + 'px',
				left: '0px',
				width: singleColumn ? '100%' : SIDEBAR_WIDTH + 'px',
				height: (size.wrapperHeight - size.conversationListHeaderHeight) + 'px'
			});
			context.layoutRegions.conversationHeader.css({
				top: '0px',
				left: singleColumn ? '0px' : SIDEBAR_WIDTH + 'px',
				width: singleColumn ? '100%' : (size.wrapperWidth - SIDEBAR_WIDTH) + 'px'
			});
			context.layoutRegions.conversation.css({
				top: size.conversationHeaderHeight + 'px',
				left: singleColumn ? '0px' : SIDEBAR_WIDTH + 'px',
				width: singleColumn ? '100%' : (size.wrapperWidth - SIDEBAR_WIDTH) + 'px',
				height: (size.wrapperHeight - size.conversationHeaderHeight - size.editorHeight) + 'px'
			});
			
			if (isShorter) {
			    context.layoutRegions.conversation.scrollTop(context.fields.messageList.outerHeight(true) - context.layoutRegions.conversation.outerHeight(true));
			}
			
			context.layoutRegions.editor.css({
				top: (size.wrapperHeight - size.editorHeight) + 'px',
				left: singleColumn ? '0px' : SIDEBAR_WIDTH + 'px',
				width: singleColumn ? '100%' : (size.wrapperWidth - SIDEBAR_WIDTH) + 'px'
			});

			if (singleColumn) {
				if (context.view == 'conversation') {
					context.layoutRegions.conversationListHeader.css({
						left: (size.wrapperWidth * -2) + 'px'
					});
					context.layoutRegions.conversationList.css({
						left: (size.wrapperWidth * -2) + 'px'
					});
				} else {
					context.layoutRegions.conversationHeader.css({
						left: (size.wrapperWidth * -2) + 'px'
					});
					context.layoutRegions.conversation.css({
						left: (size.wrapperWidth * -2) + 'px'
					});
					context.layoutRegions.editor.css({
						left: (size.wrapperWidth * -2) + 'px'
					});
				}
			}

			$.telligent.evolution.messaging.publish('conversations-resized', {
				isSingleColumn: singleColumn
			});
		}
	}

	initialize();

	$(function() {
		$(global).on('resized', function() {
			refresh();
		});

		global.setTimeout(function() {
			refresh();
		}, 150);

		$.telligent.evolution.messaging.subscribe('conversations-resize', function(d) {
		   refresh(true);
		});
	});
};