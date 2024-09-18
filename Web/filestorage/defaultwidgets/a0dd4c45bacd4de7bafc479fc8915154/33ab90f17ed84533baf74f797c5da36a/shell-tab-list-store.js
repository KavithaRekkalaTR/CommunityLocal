/*

# StudioTabListStore

Storage module which tracks currently-open tabs and attempts to reload them across reloads. Ensures that tabs are reloaded, including in the order they were last persisted.

Wrapped along with StudioTabListView by the higher-level StudioTabListController for high-level studio shell usage.

## Constructor:

	var tabListStore = new StudioTabListStore(options)

*options:*

 * `tabListView`: required StudioTabListView instance
 * `storageNameSpace`: required studio-specific namespace string for storage
 * `onLoad`: required function called for each tab id it tries to restore. Passed the string tab key. Must return a promise which resolves to a tab node (of same type that would be passed to TabViewList.addOrSelect())

## Methods:

### persist()

Persists the current state of the tab list view. Should be called in the TabListView's onChange

	tabListStore.persist();

### restore

Restores the persisted tabs. Returns a promise which resolves once all tabs have been re-loaded and rendered in previously-saved order.

	tabListStore.restore();

*/
define('StudioTabListStore', [
	'StudioStorageProxy' ],
function(StudioStorageProxy,
	$, global, undef)
{

	var defaults = {
		tabListView: null,
		storageNameSpace: '',
		onLoad: function(key) {},
		onAddTab: null
	};

	var storageKey = 'open-tabs';

	var StudioTabListStore = function(options){
		var context = $.extend({}, defaults, options || {});
		context.storage = new StudioStorageProxy($.telligent.evolution.user.accessing, context.storageNameSpace);

		if(!context.onAddTab) {
			context.onAddTab = function(item) {
				context.tabListView.addOrSelect(item, false);
			}
		}

		return {
			persist: function() {
				var openTabKeys = context.tabListView.list({
					orderBy: 'display'
				}).map(function(tab){
					return tab.key;
				});

				var currentTabKey = context.tabListView.current();

				context.storage.set(storageKey, {
					keys: openTabKeys,
					current: currentTabKey
				});
			},
			restore: function() {
				return $.Deferred(function(d){
					var storedTabs = context.storage.get(storageKey);
					if(!storedTabs || !storedTabs.keys) {
						d.resolve();
						return;
					}

					var loadedNodes = {};

					// load all nodes in promises, capturing their results as they will likely be received out of order
					var loadPromises = storedTabs.keys.map(function(key){
						return context.onLoad(key).then(function(tabNode){
							loadedNodes[key] = tabNode;
							return tabNode;
						});
					});

					// wait for all loads to complete
					$.when.apply($, loadPromises).then(function(){
						// then create a correctly-ordered array of tab nodes
						var orderedNodes = storedTabs.keys.map(function(key){
							return loadedNodes[key]
						});

						// render each tab node after reversing them since most recent is left-most in tab list
						orderedNodes.reverse().forEach(function(node){
							context.onAddTab(node);
							//context.tabListView.addOrSelect(node, false);
						});

						// resolve, passing the key of the tab that should be set to current
						d.resolve(storedTabs.current);
						return;
					});

				}).promise();
			}
		}
	};

	return StudioTabListStore;

}, jQuery, window);
