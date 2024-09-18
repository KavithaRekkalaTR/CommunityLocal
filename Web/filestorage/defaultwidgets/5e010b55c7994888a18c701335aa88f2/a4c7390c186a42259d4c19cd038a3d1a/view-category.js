/*

Administration Shell Category View:

var view = new CategoryView(options)
	options:
		parent: element

	Methods:
		render: function(content)
		unrender: function()
		selectAdministrativePanel: function(panelId, shouldScroll)
		selectPluginPanel: function(pluginTypeName, shouldScroll)
		setPluginState: function(pluginTypeName, state)
		collapsePluginTypesPanel: function(pluginTypesPanelTypeName)
		expandPluginTypesPanel: function(pluginTypesPanelTypeName)
		updatePluginState: function(pluginTypeName, state)
		addCustomSidebarContent: function(panelId, content)
		hide: function()
		show: function()

*/
define('CategoryView',
	['QuickSearch', 'Utility'],
	function(QuickSearch, Utility, $, global, undef)
{

	// options
	//	parent
	var CategoryView = function(options){
		var context = options,
			scrollableWrapper;

		function getScrollableWrapper(child) {
			scrollableWrapper = (scrollableWrapper || child.closest('.administration-panel-category-wrapper.administration-pane-wrapper .administration-pane'));
			return scrollableWrapper;
		}

		function initPluginSearching(context) {
			var searchables = $(context.parent).find('.plugin-types-search');
			searchables.each(function(){

				var searchable = $(this);
				var searchInput = searchable.find('input');
				var searchResults = searchable.find('.results');

				searchInput.one('focus', function(){
					var category = searchable.closest('.navigation-list-item.plugins');
					var typeName = $(this).closest('.plugin-types-search').data('typename');

					var qs = new QuickSearch({
						searchInput: searchInput,
						resultContainer: searchResults,
						template: context.pluginTypesPanelSearchResultTemplateId,
						itemSelector: 'li',
						noResultsMessage: context.noResultsMessage,
						onSearch: function(query) {
							return context.model.search(query, typeName, 20).then(function(r){
								return {
									results: $.map(r.results, function(r){
										r.Url = r.UnescapedUrl.replace(/\{0\}/g, $.telligent.evolution.url.encode(typeName));
										r.TypeName = Utility.parseUrl(context, r.UnescapedUrl)._applugintype;
										return r;
									})
								};
							});
						},
						onSelect: function() {
							window.location.href = $(this).find('a').first().attr('href');
						},
						onResultsShown: function() {
							category.find('.navigation-list.unfiltered').hide();
						},
						onNoResultsShown: function(query) {
							if(!query)
								category.find('.navigation-list.unfiltered').show();
						},
						onExit: function() {
							category.find('.navigation-list.unfiltered').show();
						},
						onKeyboardNavigation: function(direction, item) {
							Utility.scrollContainerToFocusOnSelection(getScrollableWrapper(item), item);
						}
					});
				});
			})
		}

		return {
			render: function(content) {
				$(context.parent).html(content);
				$(context.parent).parent().show();
				initPluginSearching(context);
				$(context.parent).find('.plugin-type-category').on('click', function(e){
					if($(e.target).is('a'))
						return;
					$(this).find('a:visible').trigger('click');
				});
			},
			unrender: function() {
				$(context.parent).empty();
				$(context.parent).parent().hide();
			},
			selectAdministrativePanel: function(panelId, shouldScroll) {
				$(context.parent).find('.category-members .navigation-list-item').removeClass('selected');
				$(context.parent).find('.category-members > .navigation-list-item.panel[data-id="'+panelId+'"]').addClass('selected');
				var panelLink = $(context.parent).find('.category-members > .navigation-list-item.panel[data-id="'+panelId+'"]');
				Utility.scrollContainerToFocusOnSelection(getScrollableWrapper(panelLink), panelLink, null, !shouldScroll);
			},
			selectPluginPanel: function(pluginTypeName, shouldScroll) {
				$(context.parent).find('.category-members .navigation-list-item').removeClass('selected');
				var pluginTypeItem = $(context.parent).find('.category-members .navigation-list-item.plugin-type[data-typename="'+pluginTypeName+'"]');
				pluginTypeItem.addClass('selected');
				var pluginTypesPanel = pluginTypeItem.closest('.navigation-list-item.plugins').data('typename');
				Utility.scrollContainerToFocusOnSelection(getScrollableWrapper(pluginTypeItem), pluginTypeItem, null, !shouldScroll);
				this.expandPluginTypesPanel(pluginTypesPanel, function(){
					Utility.scrollContainerToFocusOnSelection(getScrollableWrapper(pluginTypeItem), pluginTypeItem, null, !shouldScroll);
				});
			},
			setPluginState: function(pluginTypeName, state) {
			},
			collapsePluginTypesPanel: function(pluginTypesPanelTypeName) {
				var category = $(context.parent).find('.navigation-list-item.plugins[data-typename="'+pluginTypesPanelTypeName+'"]').removeClass('expanded');
				category.find('a.expand').show();
				category.find('a.collapse').hide();
				category.find('.panel-type-content').first().stop().slideUp({ duration: 200 });
			},
			expandPluginTypesPanel: function(pluginTypesPanelTypeName, complete) {
				var category = $(context.parent).find('.navigation-list-item.plugins[data-typename="'+pluginTypesPanelTypeName+'"]').addClass('expanded');
				category.find('a.expand').hide();
				category.find('a.collapse').show();
				category.find('.panel-type-content').first().stop().slideDown({ duration: 200, complete: complete });
			},
			updatePluginState: function(pluginTypeName, state) {
				var tipText;
				switch(state) {
					case 'Enabled':
						tipText = context.enabledText;
						break;
					case 'Disabled':
						tipText = context.disabledText;
						break;
					case 'Misconfigured':
						tipText = context.misconfiguredText;
						break;
				}
				var link = $('li.navigation-list-item.plugin-type[data-typename="'+pluginTypeName+'"]')
					.removeClass('enabled disabled misconfigured')
					.addClass(state.toLowerCase())
					.find('a').first()
					.data('tip', tipText)
					.prop('data-tip', tipText)
					.attr('data-tip', tipText)
					.attr('title', tipText);
			},
			addCustomSidebarContent: function(panelId, content) {
				var added = false;
				var addTimeout;

				return $.Deferred(function(d){

					function tryAddingSidebarContent() {
						addTimeout = setTimeout(function(){
							if(added) {
								return;
							}
							var panelLink = $(context.parent).find('.category-members > .navigation-list-item.panel[data-id="'+panelId+'"]')
							if(!panelLink || panelLink.length == 0) {
								tryAddingSidebarContent();
							} else {
								added = true;

								var link = panelLink.find('a').first().detach();
								panelLink.empty().append(link).append(content);
								// unhide the category in case it was hidden due to lack of of siblings
								$(context.parent).parent().show();
								d.resolve();
							}
						}, 50);
					}

					tryAddingSidebarContent();

				}).promise();
			},
			getCustomSidebarContent: function(panelId) {
				var panelLink = $(context.parent).find('.category-members > .navigation-list-item.panel[data-id="'+panelId+'"]');
				return panelLink.children().last();
			},
			show: function() {
				$(context.parent).parent().show();
			},
			hide: function() {
				$(context.parent).parent().hide();
			},
			setBadgeCount: function (panelId, count) {
				$(context.parent).find('.badge[data-panelid="' + panelId + '"]').html(count).attr('data-count', count);
			}
		}
	};

	return CategoryView;

}, jQuery, window);
