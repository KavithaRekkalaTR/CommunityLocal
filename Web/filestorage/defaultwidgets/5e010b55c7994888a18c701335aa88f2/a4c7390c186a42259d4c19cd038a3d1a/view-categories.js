/*

Administration Shell Categories View:

var view = new CategoriesView(options)
	options:
		parent: element

	Methods:
		render: function(content)
		unrender: function()
		selectCategory: function(categoryId, shouldScroll)
		toggleResponsiveOpen: function(bool forceClosed)

*/
define('CategoriesView', ['Utility'], function(Utility, $, global, undef) {

	// options
	//	parent
	var CategoriesView = function(options){
		var context = options,
			scrollableWrapper;

		return {
			render: function(content) {
				$(context.parent).html(content);
			},
			unrender: function() {
				$(context.parent).empty();
			},
			selectCategory: function(categoryId, shouldScroll) {
				$(context.parent).find('.administration-links > .navigation-list-item').removeClass('selected');
				var categoryItem = $(context.parent).find('.administration-links > .navigation-list-item[data-id="'+categoryId+'"]');
				categoryItem.addClass('selected');

				scrollableWrapper = (scrollableWrapper || categoryItem.closest('.administration-pane'));
				Utility.scrollContainerToFocusOnSelection(scrollableWrapper, categoryItem, null, !shouldScroll);
			},
			toggleResponsiveOpen: function(forceClosed) {
				if(forceClosed !== undef && forceClosed === true) {
					$('body').removeClass('with-categories');
				} else {
					$('body').toggleClass('with-categories');
				}
			},
			setBadgeCount: function (categoryId, count) {
				$(context.parent).find('.badge[data-categoryid="' + categoryId + '"]').html(count).attr('data-count', count);
			}
		}
	};

	return CategoriesView;

}, jQuery, window);
