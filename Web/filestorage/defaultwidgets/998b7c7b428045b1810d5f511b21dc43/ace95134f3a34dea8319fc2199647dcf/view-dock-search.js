define('GlobalSearchDockView', ['GlobalSearch'], function(GlobalSearch, $, global, undef) {

	var defaults = {
		globalSearchTemplate: '',
		globalSearchResultTemplate: '',
		globalSearchResultOverviewTemplate: '',
		globalSearchResultLoadingTemplate: '',
		onNavigate: function(request)  {},
		onSearch: function(options) {}
	};

	function GlobalSearchDockView(options) {

		var context = $.extend({}, defaults, options || {});

		return {
			id: 'search',
			name: 'Find in Emails',
			render: function(options) {
				return $.Deferred(function(d){
					context.globalSearch = new GlobalSearch({
						container: options.container,
						globalSearchTemplate: context.globalSearchTemplate,
						globalSearchResultTemplate: context.globalSearchResultTemplate,
						globalSearchResultOverviewTemplate: context.globalSearchResultOverviewTemplate,
						globalSearchResultLoadingTemplate: context.globalSearchResultLoadingTemplate,
						onNavigate: context.onNavigate,
						onSearch: context.onSearch
					});
					if(options.editorTabState && options.editorTabState.id) {
						context.globalSearch.setCurrentEmail(options.editorTabState);
					}
					d.resolve();
				}).promise();
			},
			cleanup: function() {},
			setEditorTabState: function(requestState) {
				if(context.globalSearch) {
					context.globalSearch.setCurrentEmail(requestState);
				}
			},
			hidden: function() {},
			shown: function() {},
			resized: function() {}
		}
	}

	return GlobalSearchDockView;

}, jQuery, window);
