(function($, global){

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};

	var speed = 100,
		locks = {};

	function handleTreeTraversal(context, hierarchy) {
		hierarchy.on('click', '.hierarchy-item.with-children .expand-collapse', function(e){
			e.preventDefault();

			var expandCollapse = $(this);
			var currentItem = expandCollapse.closest('li');
			var children = currentItem.children('.hierarchy-children');

			if (children && children.length > 0) {
				if (!children.is(':visible'))
					children.slideDown(speed, function() {
						expandCollapse.html('-').removeClass('collapsed').addClass('expanded');
					});
				else
					children.slideUp(speed, function() {
						expandCollapse.html('+').removeClass('expanded').addClass('collapsed');
					});
			} else {
				loadChildren(context, currentItem);
			}
		});
	};

	function loadChildren(context, parent) {
		var parentTagId = parent.data('tagid');

		if (locks[parentTagId])
			return;

		locks[parentTagId] = true;

		$.telligent.evolution.get({
			url: context.loadTagsUrl,
			data: {
				w_knowledgeCollectionId: context.knowledgeCollectionId,
				w_parentTagId: parentTagId
			}
		}).then(function(response){
			$(response).hide()
				.appendTo(parent)
				.slideDown(speed, function() {
					parent.find('.expand-collapse').first()
						.html('-').removeClass('collapsed').addClass('expanded');
				});
			locks[parentTagId] = false;
		})
	};

	var maxHeight = 0,
		win = $(global),
		contextualBanner = $('.header-fragments .layout-region.content'),
		sideBar = $('.layout-region.right-sidebar, .layout-region.left-sidebar');

	function resize(context) {
		var availableContentHeight = getAvailableContentHeight();
		var nonTocSidebarHeight = sideBar.height() - context.wrapper.height();
		var measuredMaxHeight = (availableContentHeight - nonTocSidebarHeight);

		if (measuredMaxHeight != maxHeight) {
			maxHeight = measuredMaxHeight;
			context.wrapper.css({'overflow': 'auto', 'max-height': maxHeight });
		}
	}

	function getAvailableContentHeight() {
		return win.height() - contextualBanner.height() - contextualBanner.position().top;
	}

	function handleSizing(context) {
		context.wrapper = $(context.wrapper);

		resize(context);
		setTimeout(function(){
			resize(context);
		}, 250);
		$.telligent.evolution.messaging.subscribe('window.scrollableheight', function(data) {
			resize(context);
		});
	}

	function scrollToSelectedItem(context) {
		var item = $("div.hierarchy-item.selected");
		var container = $("div.hierarchy-item.selected").closest(".content-fragment.knowledgemanagement-topics");
		scrollContainerToFocusOnSelection(container, item);
	}

	function scrollContainerToFocusOnSelection (container, item, scrollOffsetFactor) {
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
			container.stop().animate({
				scrollTop: (container.scrollTop() - containerOffset.top + itemOffset.top - (item.height() * scrollOffsetFactor))
			}, 50);
		}
	}

	$.telligent.evolution.widgets.knowledgeManagementTopics = {
		register: function(context) {
			handleTreeTraversal(context, context.hierarchy);
			handleSizing(context);
			scrollToSelectedItem();
		}
	};

})(jQuery, window);