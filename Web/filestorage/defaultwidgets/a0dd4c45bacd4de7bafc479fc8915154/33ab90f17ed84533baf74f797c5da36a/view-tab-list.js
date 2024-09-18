/*

# StudioTabListView

Low-level UI-only Tab List implementation for low-level studio shells.

Wrapped by the higher-level StudioTabListController for high-level studio shell usage.

Provides:

 * Custom Tab rendering
 * Tab collapsing
 * Tab controls, including closing current or other tabs
 * Tab manipulation
 * Auto-selection of next availabl tab when tab is closed
 * Tab listing by last recency of use
 * Tab drag/drop sorting

## Constructor:

	var tabListView = new StudioTabListView(options)

*options:*

 * `container`: Host container
 * `onChange`: Called whenever a change in tabs occurs (added, removed, re-ordered). Passed an array of key strings.
 * `onSelected`: Called when a tab is selected. Passed a key string.
 * `onClosed`: Called when a tab is closed. Passed a key string.
 * `tabViewActionsTemplate`: Actions template. Should not usually be overriden.
 * `tabViewWrapperTemplate`: Wrapper template. Should not usually be overriden.
 * `tabViewItemWrapperTemplate`: Item wrapper template. Should not usually be overriden.

## Methods:

### addOrSelect(options, shouldSelect)

Adds and selects tab content. If key already exists, just selects.

	tabListView.addOrSelect(options, shouldSelect);

 *options:*

  * `key`: String key of tab
  * `content`: String content of tab. See content notes below.

 * `shouldSelect`: Optional bool of whether to select tab when adding. Defaults to `true`

### select(options)

Selects tab content. Returns true if exists and is selectable.

	tabListView.select(options);

 *options:*

  * `key`: String key of tab

### update(options)

Updates content of a tab. Optionally replaces the tab's key as well.

	tabListView.update(options);

 *options:*

  * `key`: String key of existing tab
  * `content`: String content to update in tab. See content notes below.
  * `newKey`: Optional replacement value of the tab key

### close(options)

Closes a tab. Selects the next available tab or first tab if last tab was closed.

	tabListView.close(options);

 *options:*

  * `key`: Key to close

### closeAll()

Closes all tabs

	tabListView.closeAll(options);

### list(options)

Lists tabs

	var tabs = tabListView.list(options);

*options:*

  * `visibleOnly`: When true, only returns tabs not collapsed in the more menu. Default: `false`
  * `orderBy`: String order. `display` or `lastAccessed`. Default: `display`

*returns:*

Array of objects, each containing a `lastAccessed` and `key` property.

### current()

Returns the currently-selected tab key

	var currentKey = tabListView.current();

 *options:*

  * `key`: Key to select

*returns:*

Currently selected tab's key

### reorder(tabs)

Explicitly reorders tabs.

	tabListView.reorder(tabs);

`tabs` is an array of objects, each containing `key` and `index` properties.

### cleanup()

Releases held resources. Should be called when panel is closed.

	tabListView.cleanup();

*/
define('StudioTabListView', function($, global, undef) {

	var messaging = $.telligent.evolution.messaging;
	var template = $.telligent.evolution.template;

	var defaults = {
		container: null,
		tabViewWrapperTemplate: 'studioShell-tabListWrapper',
		tabViewItemWrapperTemplate: 'studioShell-tabListItemWrapper',
		tabViewActionsTemplate: 'studioShell-tabListActions',
		onChange: function(keys) {},
		onSelected: function(keys) {},
		onClosed: function(keys) {}
	};

	var StudioTabListView = function(options){
		var context = $.extend({}, defaults, options || {});

		context.tabViewWrapperTemplate = template(context.tabViewWrapperTemplate);
		context.tabViewItemWrapperTemplate = template(context.tabViewItemWrapperTemplate);
		context.tabViewActionsTemplate = template(context.tabViewActionsTemplate);

		context.container.append(context.tabViewWrapperTemplate({}));
		context.tabsContainer = context.container.find('.tabs');

		messaging.subscribe('ui.links.change', function(data) {
			if($(data.target).get(0) == context.tabsContainer.get(0)) {
				updateMoreBadge();
			}
		})

		// tab
		//    key
		//    tabElement
		// 	  lastAccessed
		context.tabs = {};

		messaging.subscribe('studio.tablistview.close', function(data) {
			var key = $(data.target).data('key');
			close({ key: key });
		});

		messaging.subscribe('studio.tablistview.isolate', function(data) {
			var currentKey = $(data.target).data('key');
			var allTabs = list();
			for(var i = 0; i < allTabs.length; i++) {
				if (currentKey != allTabs[i].key) {
					close({ key: allTabs[i].key });
				}
			}
		});

		$('body').on('click.studioShellTabListView', '.tab', function(e){
			if(!$(e.target).is('div.tab') && $(e.target).data('messagename'))
				return;

			var key = $(this).data('key');
			addOrSelect({ key: key });
			return false;
		});

		var popup = null;
		messaging.subscribe('studio.tablistview.actions', function(data) {
			var t = $(data.target);
			var key = t.data('key');

			var links = $(context.tabViewActionsTemplate({
				key: key
			}));
			links.on('glowDelayedMouseLeave', 500, function(e){
				if(popup) {
					popup.glowPopUpPanel('hide');
				}
			});

			if(popup) {
				popup.glowPopUpPanel('hide', true);
			} else {
				popup = $('<div></div>')
					.glowPopUpPanel({
						cssClass: 'links-popup-panel',
						zIndex: 1500,
						hideOnDocumentClick: true
					});
			}

			popup.glowPopUpPanel('html', links)
				.off('.studiotabs')
				.on('glowPopUpPanelShowing.studiotabs', function() {
					t.addClass('links-expanded');
				})
				.on('glowPopUpPanelHiding.studiotabs', function() {
					t.removeClass('links-expanded');
				})
				.glowPopUpPanel('show', t);
		});

		function isSelected(tab) {
			return tab.tabElement.hasClass('selected');
		}

		function select(tab) {
			tab.lastAccessed = new Date();
			var currentlySelected;
			$.each(context.tabs, function(k, t) {
				if(t.tabElement.hasClass('selected')) {
					currentlySelected = t;
					t.tabElement.removeClass('selected');
				}
			});
			tab.tabElement.addClass('selected');

			if(context.onSelected && (!currentlySelected || currentlySelected.key != tab.key))
				context.onSelected(tab.key);

			raiseChange(context);
		}

		function initOrRefreshSortable(context) {
			var sorter = $(context.tabsContainer).find('li').first().closest('ul');
			if(sorter && sorter.sortable('instance')) {
				$(context.tabsContainer).find('li').first().closest('ul').sortable('refresh');
			} else {
				$(context.tabsContainer).find('li').first().closest('ul').sortable({
					axis: 'x',
					scroll: false,
					start: function() {
						$.fn.evolutionTip.hide();
					}
				}).on('sortupdate.sortableTab', function(){
					$($(context.tabsContainer).find('.tab[data-key]').get().reverse()).each(function(){
						var tab = context.tabs[$(this).data('key')];
						if(tab) {
							$(context.tabsContainer).uilinks('update', tab.tabElement, {
								index: 0
							});
						}
					});
					initOrRefreshSortable(context);
					raiseChange(context);
				});
			}
		}

		function raiseChange(context) {
			if(context.onChange) {
				var keys = [];
				var links = $(context.tabsContainer).uilinks('list');
				for(var i = 0; i < links.length; i++) {
					keys.push($(links[i].element).data('key'));
				}
				context.onChange(keys);
			}
		}

		function applyOrUnapplyEmptyContentStyling(context) {
			var wrapper = $.telligent.evolution.administration.panelWrapper().closest('.administration-panel');
			// hide empty editor styling
			if(Object.keys(context.tabs).length > 0) {
				wrapper.removeClass('empty-editor');
			// show empty editor styling
			} else {
				wrapper.addClass('empty-editor');
			}
		}

		function close(options) {
			var key = options.key;

			// remove the specific closed item
			var tab = context.tabs[key];
			if(!tab)
				return;

			$(context.tabsContainer).uilinks('remove', tab.tabElement);
			delete context.tabs[key];

			// select the next tab when tab closed
			if(context.tabsContainer.find('.selected').length == 0) {
				var nextTabKey = context.tabsContainer.find('.tab').first().data('key');
				var prevTabKey = context.tabsContainer.find('.tab').last().data('key');
				var effectiveNextTabKey = nextTabKey || prevTabKey;
				if(effectiveNextTabKey) {
					addOrSelect({ key: effectiveNextTabKey });
				} else if (context.onSelected) {
					// inform the host that we're selecting nothing
					context.onSelected(null);
				}
			}

			if(popup) {
				popup.glowPopUpPanel('hide');
			}

			initOrRefreshSortable(context);

			if(context.onClosed)
				context.onClosed(key);

			raiseChange(context);
			applyOrUnapplyEmptyContentStyling(context);
			updateMoreBadge();
		}

		function list(options) {
			var tabList = []

			var test = $(context.tabsContainer).uilinks('list').map(function(m){
				return m.element;
			});

			// build set of tabs
			if(options && options.visibleOnly) {
				context.tabsContainer.find('.tab[data-key]').each(function(){
					var elm = this;
					tabList.push({
						key: $(elm).data('key'),
						lastAccessed: new Date(),
						content: function() { return $(elm).find('.tab-content').html() }
					});
				});
			} else {
				$(context.tabsContainer).uilinks('list').forEach(function(m){
					var elm = m.element;
					var tabKey = $(elm).data('key');
					var tab = context.tabs[tabKey];
					if(tab) {
						tabList.push({
							key: tabKey,
							lastAccessed: tab.lastAccessed,
							content: function() { return $(elm).find('.tab-content').html() }
						});
					}
				});
			}

			if(options && options.orderBy == 'lastAccessed') {
				tabList.sort(function(a,b){
					if (a.lastAccessed > b.lastAccessed) {
						return -1;
					}
					if (a.lastAccessed < b.lastAccessed) {
						return 1;
					}
					return 0;
				});
			}

			return tabList;
		}

		function selectIfAvailable(options) {
			var key = options.key;
			var tab = context.tabs[key];
			if (!tab)
				return false;

			// if hidden under "more", re-show by moving forward in list
			if(!$(context.tabsContainer).uilinks('isVisible', tab.tabElement)) {
				$(context.tabsContainer).uilinks('update', tab.tabElement, {
					index: 0
				});
			}

			select(tab);

			return true;
		}

		function addOrSelect(options, shouldSelect) {
			var key = options.key;
			var content = options.content;
			var tab = context.tabs[key];
			shouldSelect = shouldSelect === undef ? true : shouldSelect;

			// selecting an existing tab
			if(tab) {
				// if hidden under "more", re-show by moving forward in list
				if(!$(context.tabsContainer).uilinks('isVisible', tab.tabElement)) {
					$(context.tabsContainer).uilinks('update', tab.tabElement, {
						index: 0
					});
				}
				if(shouldSelect) {
					select(tab);
				} else {
					tab.lastAccessed = new Date();
				}

				return;
			// new tab
			} else {
				var tabSource = context.tabViewItemWrapperTemplate({
					content: content,
					key: key
				});

				var tabElement = $(context.tabsContainer).uilinks('insert', tabSource, 0);

				tab = context.tabs[key] = {
					tabElement: tabElement,
					key: key
				};

				if(shouldSelect) {
					select(tab);
				} else {
					tab.lastAccessed = new Date();
				}

				initOrRefreshSortable(context);
				raiseChange(context);

				applyOrUnapplyEmptyContentStyling(context);
				updateMoreBadge();
			}
		}

		function updateMoreBadge() {
			var hiddenLinks = $(context.tabsContainer).uilinks('list', { hidden: true });
			if(context.hiddenLinksCount !== hiddenLinks.length) {
				context.hiddenLinksCount = hiddenLinks.length
				$(context.tabsContainer).find('.navigation-list-item .more .count .badge').html(context.hiddenLinksCount);
			}
		}

		applyOrUnapplyEmptyContentStyling(context);

		return {
			addOrSelect: addOrSelect,
			select: selectIfAvailable,
			update: function(options) {
				var key = options.key;
				var content = options.content;
				var newKey = options.newKey;
				var tab = context.tabs[key];
				if(tab) {
					var reRenderedTabElement = context.tabViewItemWrapperTemplate({
						content: content,
						key: newKey || key
					});

					var shouldSelect = isSelected(tab);

					// replace the old tab element's content with newly-rendered
					tab.tabElement.html($(reRenderedTabElement).html());

					// optionally replace the key
					if(newKey) {
						tab.key = newKey;
						tab.tabElement.data('key', newKey)
						tab.tabElement.attr('data-key', newKey);
						delete context.tabs[key];
						context.tabs[newKey] = tab;
					}

					if(shouldSelect) {
						select(tab);
					}

					$(context.tabsContainer).uilinks('resize');
				}
			},
			closeAll: function() {
				$.each(context.tabs, function(key, tab) {
					$(context.tabsContainer).uilinks('remove', tab.tabElement);
					delete context.tabs[key];
					messaging.publish('studio.view.tabList.tab.closed', {
						key: key
					});
				});
				initOrRefreshSortable(context);
				applyOrUnapplyEmptyContentStyling(context);
				updateMoreBadge();
			},
			close: close,
			// options
			//		visibleOnly: false
			//		orderBy: 'display'|'lastAccessed'
			list: list,
			current: function() {
				var current = null;
				$.each(context.tabs, function(key, tab) {
					if(current == null && isSelected(tab)) {
						current = tab;
						return;
					}
				})
				return current ? current.key : null;
			},
			reorder: function(tabs) {
				for(var i = 0; i < tabs.length; i++) {
					var tab = context.tabs[tabs[i].key];
					if(tab) {
						$(context.tabsContainer).uilinks('update', tab.tabElement, {
							index: i
						});
					}
				}
				initOrRefreshSortable(context);
				raiseChange(context);
			},
			cleanup: function() {
				$('body').off('.studioShellTabListView');
			}
		}
	};

	return StudioTabListView;

}, jQuery, window);
