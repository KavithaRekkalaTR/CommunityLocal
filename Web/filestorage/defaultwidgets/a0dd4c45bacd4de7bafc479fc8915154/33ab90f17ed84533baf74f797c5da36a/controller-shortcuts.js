/*

StudioShortcutsController

Low-Level Studio Shell API for orchestrating OS-specific keyboard shortcuts across the StudioBrowseView, StudioTabListView, and StudioTabSwitchView. Also injects a link into the browseview for rendering a list of registered shortcuts in the ShortcutsView. Automaticallly associates shortcuts with current panel's namespace.

*Usage:*

	var shortcutsController = new StudioShortcutsController(options);

*options:*

	`tabListView`: instance of a StudioTabListView
	`browseView`: instance of a StudioBrowseView

*methods:*

	shortcutsController.registerDefaultShortcuts()

*/
define('StudioShortcutsController', [
	'StudioEnvironment',
	'StudioUtility',
	'StudioTabSwitchView',
	'StudioClientResources'],
function(
	StudioEnvironment,
	StudioUtility,
	StudioTabSwitchView,
	clientResources,
	$, global, undef)
{

	var messaging = $.telligent.evolution.messaging;
	var administration = $.telligent.evolution.administration;

	var defaults = {
		tabListView: null,
		browseView: null
	};

	function getDefaultShortcutCombinations(context) {

		var combos = {};

		// define os-specific shortcuts -> message mappings with descriptions
		if(StudioEnvironment.os.ios || StudioEnvironment.os.mac) {
			combos = {
				'ctrl + q': { message: 'studioshell.tab.switch.next', description: clientResources.shortcutSwitch },
				'ctrl': { message: 'studioshell.tab.switch.select', direction: 'up', bubble: true },
				'ctrl + shift + meta + left': { message: 'studioshell.tab.left', description: clientResources.shortcutSwitchLeft },
				'ctrl + shift + meta + right': { message: 'studioshell.tab.right', description: clientResources.shortcutSwitchRight },
				'ctrl + w': { message: 'studioshell.tab.close', description: clientResources.shortcutCloseTab },
				'ctrl + shift + w': { message: 'studioshell.tab.isolate', description: clientResources.shortcutCloseOtherTabs },
				'ctrl + shift + alt + meta + left': { message: 'studioshell.tab.moveleft', description: clientResources.shortcutRepositionLeft },
				'ctrl + shift + alt + meta + right': { message: 'studioshell.tab.moveright', description: clientResources.shortcutRepositionRight },
				'ctrl + r': { message: 'studioshell.tab.reveal', description: clientResources.shortcutRevealInTree }
			}
		} else {
			if(StudioEnvironment.browser.firefox) {
				combos = {
					'ctrl + q': { message: 'studioshell.tab.switch.next', description: clientResources.shortcutSwitch },
					'ctrl': { message: 'studioshell.tab.switch.select', direction: 'up', bubble: true },
					'ctrl + shift + left': { message: 'studioshell.tab.left', description: clientResources.shortcutSwitchLeft },
					'ctrl + shift + right': { message: 'studioshell.tab.right', description: clientResources.shortcutSwitchRight },
					'alt + w': { message: 'studioshell.tab.close', description: clientResources.shortcutCloseTab },
					'alt + shift + w': { message: 'studioshell.tab.isolate', description: clientResources.shortcutCloseOtherTabs },
					'alt + shift + ctrl + left': { message: 'studioshell.tab.moveleft', description: clientResources.shortcutRepositionLeft },
					'alt + shift + ctrl + right': { message: 'studioshell.tab.moveright', description: clientResources.shortcutRepositionRight },
					'alt + r': { message: 'studioshell.tab.reveal', description: clientResources.shortcutRevealInTree }
				}
			} else if(StudioEnvironment.browser.edge) {
				combos = {
					'ctrl + q': { message: 'studioshell.tab.switch.next', description: clientResources.shortcutSwitch },
					'ctrl': { message: 'studioshell.tab.switch.select', direction: 'up', bubble: true },
					'alt + shift + left': { message: 'studioshell.tab.left', description: clientResources.shortcutSwitchLeft },
					'alt + shift + right': { message: 'studioshell.tab.right', description: clientResources.shortcutSwitchRight },
					'alt + w': { message: 'studioshell.tab.close', description: clientResources.shortcutCloseTab },
					'alt + shift + w': { message: 'studioshell.tab.isolate', description: clientResources.shortcutCloseOtherTabs },
					'alt + shift + ctrl + left': { message: 'studioshell.tab.moveleft', description: clientResources.shortcutRepositionLeft },
					'alt + shift + ctrl + right': { message: 'studioshell.tab.moveright', description: clientResources.shortcutRepositionRight },
					'alt + r': { message: 'studioshell.tab.reveal', description: clientResources.shortcutRevealInTree }
				}
			} else {
				combos = {
					'alt + q': { message: 'studioshell.tab.switch.next', description: clientResources.shortcutSwitch },
					'alt': { message: 'studioshell.tab.switch.select', direction: 'up', bubble: true },
					'alt + shift + left': { message: 'studioshell.tab.left', description: clientResources.shortcutSwitchLeft },
					'alt + shift + right': { message: 'studioshell.tab.right', description: clientResources.shortcutSwitchRight },
					'alt + w': { message: 'studioshell.tab.close', description: clientResources.shortcutCloseTab },
					'alt + shift + w': { message: 'studioshell.tab.isolate', description: clientResources.shortcutCloseOtherTabs },
					'alt + shift + ctrl + left': { message: 'studioshell.tab.moveleft', description: clientResources.shortcutRepositionLeft },
					'alt + shift + ctrl + right': { message: 'studioshell.tab.moveright', description: clientResources.shortcutRepositionRight },
					'alt + r': { message: 'studioshell.tab.reveal', description: clientResources.shortcutRevealInTree }
				}
			}
		}

		return combos;
	}

	function handleMessages(context) {
		var messages = {
			'studioshell.tab.switch.next': function() {
				// if not yet showing tab switcher,
				// get a list of tabs in order of last access
				// and render them
				if(!context.tabSwitchView.shown()) {
					var recentTabs = context.tabListView.list({
						orderBy: 'lastAccessed'
					}).map(function(t){
						return {
							key: t.key,
							content: t.content()
						};
					});
					if(recentTabs && recentTabs.length > 1) {
						context.tabSwitchView.show(recentTabs);
					}
				} else {
					context.tabSwitchView.next()
				}
			},
			'studioshell.tab.switch.select': function() {
				// if tab switcher shown, then get its current request and then close it
				if(context.tabSwitchView.shown()) {
					var selection = context.tabSwitchView.current();
					context.tabSwitchView.close();
					if(selection) {
						context.tabListView.addOrSelect({
							key: selection
						})
					}
				}
			},
			'studioshell.tab.left': function() {
				var currentTabKey = context.tabListView.current();
				var allOpenTabKeys = context.tabListView.list({
					visibleOnly: true
				});

				var currentIndex = null;
				var newIndex = null;
				for(var i = 0; i < allOpenTabKeys.length; i++) {
					if(allOpenTabKeys[i].key == currentTabKey) {
						currentIndex = i;
						break;
					}
				}

				if(currentIndex !== null) {
					if(currentIndex == 0) {
						newIndex = allOpenTabKeys.length - 1;
					} else {
						newIndex = currentIndex - 1;
					}
				}

				if(newIndex !== null) {
					var tabToSelect = allOpenTabKeys[newIndex];
					if(tabToSelect) {
						context.tabListView.addOrSelect({
							key: tabToSelect.key
						});
					}
				}
			},
			'studioshell.tab.right': function() {
				var currentTabKey = context.tabListView.current();
				var allOpenTabKeys = context.tabListView.list({
					visibleOnly: true
				});

				var currentIndex = null;
				var newIndex = null;
				for(var i = 0; i < allOpenTabKeys.length; i++) {
					if(allOpenTabKeys[i].key == currentTabKey) {
						currentIndex = i;
						break;
					}
				}

				if(currentIndex !== null) {
					if(currentIndex == allOpenTabKeys.length - 1) {
						newIndex = 0;
					} else {
						newIndex = currentIndex + 1;
					}
				}

				if(newIndex !== null) {
					var tabToSelect = allOpenTabKeys[newIndex];
					if(tabToSelect) {
						context.tabListView.addOrSelect({
							key: tabToSelect.key
						});
					}
				}
			},
			'studioshell.tab.close': function() {
				var currentTabKey = context.tabListView.current();
				context.tabListView.close({
					key: currentTabKey
				});
			},
			'studioshell.tab.isolate': function() {
				var currentTabKey = context.tabListView.current();
				var allTabs = context.tabListView.list();
				for(var i = 0; i < allTabs.length; i++) {
					if(allTabs[i].key !== currentTabKey) {
						context.tabListView.close({
							key: allTabs[i].key
						});
					}
				}
			},
			'studioshell.tab.moveleft': function() {
				var currentTabKey = context.tabListView.current();
				var allTabs = context.tabListView.list({ visibleOnly: true });
				var currentIndex = null;
				for(var i = 0; i < allTabs.length; i++) {
					if(allTabs[i].key == currentTabKey) {
						currentIndex = i;
						break;
					}
				}

				if(currentIndex !== null) {
					if(currentIndex == 0) {
						allTabs.push(allTabs.shift());
					} else {
						var temp = allTabs[currentIndex - 1];
						allTabs[currentIndex - 1] = allTabs[currentIndex];
						allTabs[currentIndex] = temp;
					}
				}

				context.tabListView.reorder(allTabs);
			},
			'studioshell.tab.moveright': function() {
				var currentTabKey = context.tabListView.current();
				var allTabs = context.tabListView.list({ visibleOnly: true });
				var currentIndex = null;
				for(var i = 0; i < allTabs.length; i++) {
					if(allTabs[i].key == currentTabKey) {
						currentIndex = i;
						break;
					}
				}

				if(currentIndex !== null) {
					if(currentIndex === allTabs.length - 1) {
						allTabs.unshift(allTabs.pop());
					} else {
						var temp = allTabs[currentIndex + 1];
						allTabs[currentIndex + 1] = allTabs[currentIndex];
						allTabs[currentIndex] = temp;
					}
				}

				context.tabListView.reorder(allTabs);
			},
			'studioshell.tab.reveal': function() {
				var currentTabKey = context.tabListView.current();
				context.browseView.select({
					key: currentTabKey
				});
			}
		}

		StudioUtility.forEach(messages, function(messageName, handler) {
			messaging.subscribe(messageName, function(data){
				handler(data);
			});
		});
	}

	function registerCombinations(combos) {
		// register mappings
		var shortcuts = $.telligent.evolution.shortcuts;
		var evolutionCodeEditorCommandOverrides = {};

		StudioUtility.forEach(combos, function(k, v) {
			// register it with the shortcut registrar
			shortcuts.register(k, function(){
				messaging.publish(v.message);
				return (v.bubble ? true : false);
			}, {
				direction: (v.direction || 'down'),
				description: v.description,
				namespace: administration.panelNameSpace()
			});

			// register it as an evolutionCodeEditor override
			evolutionCodeEditorCommandOverrides[k] = function(){
				messaging.publish(v.message);
				return (v.bubble ? true : false);
			};
		});

		// apply evolutionCodeEditor command overrides
		$.extend($.fn.evolutionCodeEditor.defaults.commandOverrides,
			evolutionCodeEditorCommandOverrides);
	}

	function addBrowseHeaderLink(context) {
		var shortcutsLink = $($.telligent.evolution.template.compile('<a href="#" data-messagename="shortcuts.list"><%: resources.shortcutsTitle %></a>')({
			resources: clientResources
		}));

		context.browseView.addHeaderLink({
			element: shortcutsLink,
			visible: false
		});
	}

	var StudioShortcutsController = function(options){
		var context = $.extend({}, defaults, options || {});
		context.tabSwitchView = new StudioTabSwitchView();

		return {
			registerDefaultShortcuts: function() {
				var combos = getDefaultShortcutCombinations(context);
				registerCombinations(combos);
				handleMessages(context);
				addBrowseHeaderLink(context);
			}
		}
	};

	return StudioShortcutsController;

}, jQuery, window);
