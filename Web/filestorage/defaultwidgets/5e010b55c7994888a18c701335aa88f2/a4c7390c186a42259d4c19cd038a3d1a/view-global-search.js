/*

Global Search View

var view = new GlobalSearchView(options)
	options:
		template
		resultTemplate
		model

	Methods:
		render
*/
define('GlobalSearchView',
	['QuickSearch', 'Utility'],
	function(QuickSearch, Utility, $, global, undef)
{

	var isActive = false;

	var defaults = {
		template: null,
		resultTemplate: null,
		model: null,
		headingText: ''
	};

	var GlobalSearchView = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			render: function() {
				if (isActive)
					return;

				context.compiledTemplate = context.compiledTemplate || $.telligent.evolution.template(context.template);

				var modalContent = $(context.compiledTemplate({}));
				var searchInput = modalContent.find('input');
				var searchResults = modalContent.find('.results');

				var qs = new QuickSearch({
					searchInput: searchInput,
					resultContainer: searchResults,
					template: context.resultTemplate,
					itemSelector: 'li',
					noResultsMessage: context.noResultsMessage,
					onSearch: function(query) {
						return context.model.search(query, '', 100);
					},
					onSelect: function() {
						$.glowModal.close();
						isActive = false;
						window.location.href = $(this).find('a').first().attr('href');
					},
					onResultsShown: function() {
					},
					onNoResultsShown: function(query) {
					},
					onExit: function() {
						$.glowModal.close();
						isActive = false;
					},
					onKeyboardNavigation: function(direction, item) {
						Utility.scrollContainerToFocusOnSelection(searchResults, item);
					}
				});

				var modal = $.glowModal({
					title: context.headingText,
					html: modalContent,
					width: $(window).width() * .4,
					height: $(window).height() * .75,
					focusOnOpen: false,
					onClose: function() {
						isActive = false;
					}
				});

				isActive = true;

				setTimeout(function(){
					modalContent.find('input').trigger('focus');
					var resultWrapper = modalContent.find('.results').first();
					var formWrapper = modalContent.find('fieldset').first();

					modalContent.css({
						width: resultWrapper.closest('.modal-content').width(),
						overflow: 'hidden'
					});

				}, 200);
			}
		}
	};

	return GlobalSearchView;

}, jQuery, window);
