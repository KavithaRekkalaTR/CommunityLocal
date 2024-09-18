/*
StudioTabListController

options
	container: null,
	tabViewItemTemplate: null,
	onGetSettings
	onChange: function(requests) // raised on any change for notification purposes, with complete set of current tabs
	onSerializeRequest: function
	onParseRequest: function,
	onSerializeModelIdentifier: function(request, modelType) // modelType: 'component' or 'primary'
	onUpdateTab: function(tabRequest, updateRequest, updateModel, controller) // implements studio-specific approach for updating a tab
		controller exposes methods for safely applying changes after performing any necessary before steps
		controller.applyModelChanges(model)

Raises Messages:
	studio.view.select
		request
	studio.view.close
		request

Methods
	select: function(request)
	addOrSelect: function(request, model)
	update: function(request, model) // also returns how many instances were updated
	closeAll: function()
	close: function(request)
	listAll: function(options)
		visibleOnly: false
		orderBy: 'display'|'lastAccessed'
	getCurrent: function()  // returns current request
	reorder: function([]) // array of { request: {}, index: 0 }
	view: function()  // returns underlying StudioTabList

*/
define('StudioTabListController', ['StudioTabListView'], function(StudioTabListView, $, global, undef) {

	var messaging = $.telligent.evolution.messaging;

	var defaults = {
		container: null,
		tabViewItemTemplate: 'studioShell-tabListItem',
		onSerializeRequest: function(request, options) {},
		onParseRequest: function(request) {},
		onSerializeModelIdentifier: function(request, modelType) {} // modelType: 'component' or 'primary'
	};

	function requestPrimaryModelsMatch(context, a, b) {
		return context.onSerializeModelIdentifier(a, 'primary') == context.onSerializeModelIdentifier(b, 'primary');
	}

	// returns editors that match the request's model
	// regardless of whether it matches the component of the model
	function filterTabsMatchingPrimaryModelOf(context, request) {
		var allTabs = context.tabListView.list();
		if(!allTabs || !request)
			return [];

		var filteredTabs = [];
		$.each(allTabs, function(i, tab) {
			var parsedRequest = context.onParseRequest(tab.key);
			if(requestPrimaryModelsMatch(context, parsedRequest, request)) {
				filteredTabs.push(tab);
			}
		});
		return filteredTabs;
	}

	var StudioTabListController = function(options){
		var context = $.extend({}, defaults, options || {});

		context.tabViewItemTemplate = $.telligent.evolution.template(context.tabViewItemTemplate);

		// id
		//    request
		//    model
		context.tabModels = {};

		context.tabListView = new StudioTabListView({
			container: context.container,
			onChange: function(keys) {
				if(context.onChange) {
					context.onChange(keys);
				}
			},
			onSelected: function(key) {
				var request = key ? context.onParseRequest(key) : null;
				messaging.publish('studio.view.select', request);
			},
			onClosed: function(key) {
				var request = context.onParseRequest(key);
				messaging.publish('studio.view.close', request);
			}
		});

		return {
			addOrSelect: function(request, model, shouldSelect) {
				var id = context.onSerializeRequest(request);

				var newContent = null;
				if(model) {
					newContent = context.tabViewItemTemplate({
						request: $.extend({}, request),
						model: model,
						id: id
					});

					context.tabModels[id] = {
						request: $.extend({}, request),
						model: model
					};
				}

				context.tabListView.addOrSelect({
					key: id,
					content: newContent
				}, shouldSelect);
			},
			select: function(request) {
				var id = context.onSerializeRequest(request);

				return context.tabListView.select({
					key: id,
				});
			},
			closeAll: function() {
				context.tabModels = {};

				context.tabListView.closeAll();
			},
			update: function(request, model) {
				// filter tabs instances to models for the request
				var filteredTabs = filterTabsMatchingPrimaryModelOf(context, request);
				// instruct each tabs to update itslef
				$.each(filteredTabs, function(i, renderedTab){
					var tab = context.tabModels[renderedTab.key];
					var originalTabRequest = $.extend({}, tab.request);
					context.onUpdateTab(tab.request, request, model, {
						applyModelChanges: function(modelChanges) {
							// update referenced model instance with new data
							$.extend(tab.model, modelChanges);

							var oldId = context.onSerializeRequest(originalTabRequest);
							var newId = context.onSerializeRequest(tab.request);

							// re-render the tab's content with new data
							var reRenderedTabContent = context.tabViewItemTemplate({
								request: tab.request,
								model: tab.model,
								id: newId
							});

							context.tabListView.update({
								key: oldId,
								content: reRenderedTabContent,
								newKey: newId
							});

							// replace the locally cached model
							if(oldId != newId) {
								delete context.tabModels[oldId];
								context.tabModels[newId] = tab;
							}
						}
					});
				});
				return filteredTabs.length;
			},
			close: function(request, forAnyMatchingModel) {
				if(forAnyMatchingModel) {
					// close items matching the model id
					$.each(context.tabModels, function(i, tab){
						if(requestPrimaryModelsMatch(context, tab.request, request)) {
							var id = context.onSerializeRequest(tab.request);
							context.tabListView.close({ key: id });
							delete context.tabModels[id];
						}
					});
				} else {
					// remove the specific closed item
					var id = context.onSerializeRequest(request);
					context.tabListView.close({ key: id });
					delete context.tabModels[id];
				}
			},
			// options
			//		visibleOnly: false
			//		orderBy: 'display'|'lastAccessed'
			listAll: function(options) {
				var tabs = context.tabListView.list(options);
				var tabModels = tabs.map(function(tab) {
					return {
						request: context.tabModels[tab.key].request,
						model: context.tabModels[tab.key].model,
						lastAccessed: tab.lastAccessed,
						key: tab.key,
						content: tab.content()
					}
				});
				return tabModels;
			},
			getCurrent: function() {
				var currentKey = context.tabListView.current();
				if(!currentKey)
					return null;

				var tabModel = context.tabModels[currentKey];
				if(!tabModel)
					return null;

				return tabModel.request;
			},
			reorder: function(tabs) {
				var mappedTabs = tabs.map(function(t) {
					return { key: context.onSerializeRequest(t.request)};
				});

				context.tabListView.reorder(mappedTabs);
			},
			view: function() {
				return context.tabListView;
			},
			cleanup: function() {
				context.tabListView.cleanup();
			}
		}
	};

	return StudioTabListController;

}, jQuery, window);
