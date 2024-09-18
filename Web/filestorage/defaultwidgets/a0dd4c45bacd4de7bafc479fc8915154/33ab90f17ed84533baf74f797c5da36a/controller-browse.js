/*

StudioBrowseController

	Could potentially raise:

		studio.view.new
		studio.view.import
		studio.view.multiselect
		studio.view.settings

	options:
		// ui
		browseHeaderTemplate
		browseViewItemTemplate
		actionsTemplate
		multiSelectActionsTemplate
		multiSelectActions: [] // list of actions, of format { message: '', label: '' }
		linkNew: true
		linkUpload: true
		linkSettings: true
		container
		modelDepth: default: 0. // depth at which model entities are expected to render in the tree. Non-zero when there are initialNodes

		onGetInitialNodes: function() // returns list of initial nodes to include (used primarily for non-model nodes like groupings of models (not groupings within models)).

		onConvertModelToNode: function(model) // converts a model to an object matching browseview node interface. Can be nested or include any other properites for use by custom template. Can also include special parentKey property to define placement within an initially rendered non-model node (from initialNodes).

		// model-related
		onGetAndSelect:
		onList: filterOptions
			name
			provider
			theme
			query

		// serialization
		onSerializeRequest: function(request, options) {},
		onParseRequest: function(request) {},

		onSelected: function(request) {}
		onSort: function(parentRequest, childRequests) {}
	Methods:
		select(request)
		loadInitial()  // returns promise
		update(request, model)
		remove(request)
		add(request, model)
		cleanup()
		toggleSelectMode() // toggles selection mode
		focusOnSearch(options)
			focusedElement // element to re-focus on after escaping search
		view() // returns underlying StudioBrowseView
		clearSearch()
*/
define('StudioBrowseController', ['StudioBrowseView'], function(StudioBrowseView, $, global, undef) {
	var messaging = $.telligent.evolution.messaging;

	var defaults = {
		browseHeaderContent: null,
		browseViewItemTemplate: null,
		actionsTemplate: null,
		wrapperCssClass: null,
		multiSelectActionsTemplate: 'studioShell-browseMultiSelectOptions',
		commonHeaderLinksTemplate: 'studioShell-browseStudioLinks',
		multiSelectActions: [],
		container: null,
		linkNew: true,
		linkUpload: true,
		linkSettings: true,
		searchPlaceholder: '',
		modelDepth: 0,
		onConvertModelToNode: function(model) {},

		onList: function(request) {},
		onGetAndSelect: function(request) {},

		onSerializeRequest: function(request, options) {},
		onParseRequest: function(request) {},

		onSort: function(parentRequest, childRequests) {},

		onGetInitialNodes: function() { return $.Deferred(function(d){ d.resolve([]); }).promise(); },
	};

	function collectSelected(context) {
		return context.browseView.list({
			checked: true,
			depth: context.modelDepth,
			minDepth: context.modelDepth
		}).map(function(m){
			return context.onParseRequest(m.key);
		});
	}

	function updateCounts(context, checkedCount) {
		if(!checkedCount) {
			var checked = context.browseView.list({
				checked: true,
				depth: context.modelDepth,
				minDepth: context.modelDepth
			});

			var checkedCount = checked.length;
		}

		if(!checkedCount || checkedCount == 0) {
			context.selectionCounters.hide();
		} else {
			context.selectionCounters.html("(" + checkedCount + ")").show();
		}

		if ( checkedCount > 0 ) {
			context.multiSelectActionLinks.show();
		} else {
			context.multiSelectActionLinks.hide();
		}
	}

	function handleMultiSelection(context) {
		if(!context.multiSelectActions || context.multiSelectActions.length == 0)
			return;

		var multiSelectHeadingContainer = $($.telligent.evolution.template(context.multiSelectActionsTemplate)({
			actions: context.multiSelectActions
		}));

		context.headerContentContainer.prepend(multiSelectHeadingContainer);

		context.selectionCounters = context.headerContentContainer.find('.selection_count');
		context.selectAll = context.headerContentContainer.find('a.select-all');
		context.deSelectAll = context.headerContentContainer.find('a.de-select-all').hide();
		context.multiSelectActionLinks = context.headerContentContainer.find('a.multiselect-action').hide();

		context.selectAll.on('click', function(e){
			e.preventDefault();

			context.browseView.selectAll();
			context.selectAll.hide();
			context.deSelectAll.show();

			updateCounts(context);

			return false;
		});

		context.deSelectAll.on('click', function(e){
			e.preventDefault();

			context.browseView.deSelectAll();
			context.selectAll.show();
			context.deSelectAll.hide();

			updateCounts(context);

			return false;
		});

		context.multiSelectActionLinks.on('click', function(e){
			e.preventDefault();

			var requests = collectSelected(context);

			messaging.publish($(this).data('multiselect-messagename'), {
				requests: requests
			});

			return false;
		});
	}

	function handleEvents(context) {
		// when hovering over a node and the actions haven't been rendered yet...
		context.container.on('mouseenter', 'li.node.overview', function(e){
			var target = $(this);
			var actionsWrapper = target.find('.node-actions');
			if(actionsWrapper.find('ul').length === 0) {
				// then find a matching model for it in local cache
				var key = target.data('key');
				var nodeModel = context.browseView.get({
					key: key
				});

				if(!nodeModel)
					return;

				// then add it to the node as ui-links
				var renderedActions = context.actionsTemplate($.extend({
					requestKey: key
				}, nodeModel.model));

				actionsWrapper.append(renderedActions);
			}
		});
	}

	function innerSelect(context, requestOrKey) {
		var key;
		if(typeof requestOrKey == 'string') {
			key = requestOrKey;
		} else {
			key = context.onSerializeRequest(requestOrKey);
			context.lastSelectedRequest = requestOrKey;
		}

		context.browseView.select({
			key: key
		});
	}

	function select(context, requestOrKey, resetFields) {
		if(!requestOrKey)
			return;

		var key = typeof requestOrKey == 'string' ?  requestOrKey : context.onSerializeRequest(requestOrKey);

		var existingViewNode = context.browseView.get({ key: key });
		if(!existingViewNode) {
			if(resetFields) {
				context.onGetAndSelect(requestOrKey).then(function(){
					loadAndRenderCurrentQuery(context).then(function(){
						innerSelect(context, requestOrKey);
					});
				});
			} else {
				loadAndRenderCurrentQuery(context).then(function(){
					innerSelect(context, requestOrKey);
				});
			}
		} else {
			innerSelect(context, requestOrKey);
		}
	}

	function initBrowseView(context) {
		context.headerContentContainer = $('<div></div>');
		if(context.browseHeaderContent) {
			context.headerContentContainer.append(context.browseHeaderContent);
		}

		context.browseView = new StudioBrowseView({
			container: context.container,
			headerContent: context.headerContentContainer,
			wrapperCssClass: context.wrapperCssClass,
			treeNodeTemplate: context.browseViewItemTemplate,
			searchPlaceholder: context.searchPlaceholder,
			onSort: function(key, children) {
				if(context.onSort) {
					context.onSort(
						context.onParseRequest(key),
						children.map(function(c){
							return context.onParseRequest(c.key);
						}));
				}
			},
			onSelected: function(key) {
				select(context, context.onParseRequest(key) || key, false);
				if(context.onSelected) {
					context.onSelected(key);
				}
			},
			onExpanded: function(key) {},
			onCollapsed: function(key) {},
			onSearchQuery: function(query) {
				context.currentlyExpanded = context.browseView.list({
					expanded: true
				});
				return loadResults(context, { query: query }).then(function(nodes){
					context.browseView.select();
					return {
						nodes: nodes,
						query: query
					};
				});
			},
			onSearchExit: function() {
				loadAndRenderCurrentQuery(context).then(function(){
					if(context.currentlyExpanded) {
						context.currentlyExpanded.forEach(function(expandableNode){
							context.browseView.expand(expandableNode);
						});
						context.currentlyExpanded = null;
					}
					if(context.lastSelectedRequest) {
						context.browseView.select({
							key: context.onSerializeRequest(context.lastSelectedRequest)
						});
					}
				})
			},
			onCheckChange: function(key) {
				var checkedCount = context.browseView.list({
					checked: true,
					depth: context.modelDepth,
					minDepth: context.modelDepth
				}).length;

				var uncheckedCount = context.browseView.list({
					checked: false,
					depth: context.modelDepth,
					minDepth: context.modelDepth
				}).length;

				updateCounts(context, checkedCount);

				if(checkedCount > 0) {
					context.deSelectAll.show();
				} else {
					context.deSelectAll.hide();
				}

				if(uncheckedCount > 0) {
					context.selectAll.show();
				} else {
					context.selectAll.hide();
				}
			}
		});
	}

	function initCommonHeaderLinks(context) {

		var commonHeaderLinksTemplate = $.telligent.evolution.template(context.commonHeaderLinksTemplate);

		if(context.linkNew) {
			context.browseView.addHeaderLink({
				element: commonHeaderLinksTemplate({ link: 'new' }),
				visible: true
			});
		}
		if(context.linkUpload) {
			context.browseView.addHeaderLink({
				element: commonHeaderLinksTemplate({ link: 'import' }),
				visible: true
			});
		}
		if(context.multiSelectActions && context.multiSelectActions.length > 0) {
			context.browseView.addHeaderLink({
				element: commonHeaderLinksTemplate({ link: 'select' }),
				visible: true
			});
		}
		if(context.linkSettings) {
			context.browseView.addHeaderLink({
				element: commonHeaderLinksTemplate({ link: 'settings' }),
				visible: true
			});
		}
	}

	var completedPromise = $.Deferred(function(d){ d.resolve(); }).promise();

	function loadAndRenderCurrentQuery(context, explicitQuery) {
		return loadResults(context, explicitQuery).then(function(results){
			context.browseView.removeAll();

			return (context.onGetInitialNodes || completedPromise)().then(function(initialNodes) {
				if(initialNodes && initialNodes.length > 0) {
					context.browseView.add({
						nodes: initialNodes
					});
				}

				// partition nodes into groupings by parent, if specified
				var newRootResults = [];
				var partitiondNewChildResults = {};
				for (var i = 0; i < results.length; i++) {
					if (results[i].parentKey) {
						if (!partitiondNewChildResults[results[i].parentKey])
							partitiondNewChildResults[results[i].parentKey] = [];
						partitiondNewChildResults[results[i].parentKey].push(results[i]);
					} else {
						newRootResults.push(results[i])
					}
				}

				// add nodes
				// ungrouped
				if (newRootResults.length > 0) {
					context.browseView.add({
						nodes: newRootResults
					});
				}
				// grouped
				for (var parentKey in partitiondNewChildResults) {
					if (partitiondNewChildResults.hasOwnProperty(parentKey)) {
						if (partitiondNewChildResults[parentKey].length > 0) {
							context.browseView.add({
								nodes: partitiondNewChildResults[parentKey],
								parent: parentKey
							});
						}
					}
				}

				context.browseView.select();
				return results;
			})
		});
	}

	function loadResults(context, explicitQuery) {
		return context.onList(explicitQuery).then(function(models){
			return models.map(function(n){
				return context.onConvertModelToNode(n);
			});
		});
	}

	var StudioBrowseController = function(options){
		var context = $.extend({}, defaults, options || {});

		initBrowseView(context);
		initCommonHeaderLinks(context);
		handleEvents(context);
		handleMultiSelection(context);

		return {
			captureSelectionState: function() {
				context.capturingAndRestoring = true;

				// capture pre-update ui state
				context.currentlyExpanded = context.browseView.list({
					expanded: true
				});
			},
			reApplySelectionSate: function() {
				// re-apply pre-update ui state
				if (context.currentlyExpanded) {
					context.currentlyExpanded.forEach(function(n){
						context.browseView.expand(n);
					});
				}

				if(context.lastSelectedRequest) {
					context.browseView.select({
						key: context.onSerializeRequest(context.lastSelectedRequest)
					});
				};

				context.capturingAndRestoring = false;
			},
			update: function(request, model) {
				if (!context.capturingAndRestoring) {
					// capture pre-update ui state
					var currentlyExpanded = context.browseView.list({
						expanded: true
					});
				}

				// update ui
				context.browseView.update({
					node: context.onConvertModelToNode(model)
				});

				if (!context.capturingAndRestoring) {
					// re-apply pre-update ui state
					currentlyExpanded.forEach(function(n){
						context.browseView.expand(n);
					});

					if(context.lastSelectedRequest) {
						context.browseView.select({
							key: context.onSerializeRequest(context.lastSelectedRequest)
						});
					};
				}
			},
			remove: function(request) {
				context.browseView.remove({
					key: context.onSerializeRequest($.extend({}, request, {
						type: 'overview'
					}))
				});
			},
			add: function(request, model) {
				var modelNode = context.onConvertModelToNode(model);
				var newBrowseViewOptions = {
					node: modelNode
				};
				if (modelNode.parentKey) {
					newBrowseViewOptions.parent = modelNode.parentKey
				}
				context.browseView.add(newBrowseViewOptions);
			},
			loadInitial: function() {
				return loadAndRenderCurrentQuery(context);
			},
			select: function(request) {
				select(context, request, true);
			},
			cleanup: function() {
				context.browseView.cleanup();
				global.clearTimeout(context.selectFirstTimeout);
			},
			view: function() {
				return context.browseView;
			},
			focusOnSearch: function(options) {
				context.browseView.focusOnSearch({
					returnElement: options.focusedElement
				});
			},
			toggleSelectMode: function() {
				context.container.find('.studio-shell.browse').toggleClass('multiselect');
				context.browseView.toggleCheckMode();
			},
			addHeaderLink: function(options) {
				context.browseView.addHeaderLink(options);
			},
			// re-loads and renders based on current query, if any
			// options
			//   modelDepth (new model depth, if any)
			load: function(options) {
				if (options) {
					if (options.modelDepth !== undef) {
						context.modelDepth = options.modelDepth
					}
				}
				loadAndRenderCurrentQuery(context).then(function(r){
					context.browseView.deSelectAll();
					context.browseView.select();
				});
			},
			clearSearch: function() {
				context.browseView.clearSearch();
			},
			modelDepth: function (newDepth) {
				if (newDepth !== undef) {
					context.modelDepth = newDepth;
				}
				return context.modelDepth;
			}
		}
	};

	return StudioBrowseController;

}, jQuery, window);
