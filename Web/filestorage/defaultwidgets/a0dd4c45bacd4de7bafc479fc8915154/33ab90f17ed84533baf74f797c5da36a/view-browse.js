/*

# StudioBrowseView

Low-level UI-only sidebar/browsing implementation for low-level studio shells.

Wrapped by the higher-level StudioBrowseController for high-level studio shell usage.

Provides:

 * N-level deep tree navigation and manipulation
 * Optional studio-specific custom tree node rendering
 * Drag/Drop sortability within tree branches
 * Checkbox/Multi-select tree mode
 * Search
 * Sticky heading
 * Sticky Toolbar
 * Custom Sticky Heading Content
 * Category Navigation Column Collapsing

## Constructor:

	var browseView = new StudioBrowseView(options);

 *options:*

  * `container`: Host container
  * `wrapperCssClass`: Optional CSS class to add to entire browse view
  * `treeNodeTemplate`: Optional string ID of template for custom node rendering
  * `headerContent`: Optional content (string, dom, jQ) to add to sticky header beneath toolbar, above search
  * `onExpanded`: Optional. Called when a tree node is expanded. Passed string `key` of expanded node.
  * `onCollapsed`: Optional. Called when a tree node is collapsed. Passed string `key` of collapsed node.
  * `onSelected`: Called when a tree node is selected/clicked. Passed string `key` of selected node. Also passed object of key options
  * `onSort`: Called when a sortable tree branch is sorted. Passed string `key` of parent node and array of child `Node` objects.
  * `onCheckChange`: Called when a multi-selectable node's checked state is changed. Passed `key` of node.
  * `onSearchQuery`: Optional search implementation. When provided, renders a searh box in the sticky heading. Passed string `query`. Must return a `Promise` which resolves with an object of type `{ nodes: [], query: '' }` where nodes is an array of `Node` objects.
  * `onSearchExit`: Optional. Called when the the search input is cleared
  * `searchPlaceholder`: Optional placeholder string to override default search input placeholder
  * `treeTemplate`: Tree template. Should not be overriden unless necessary.
  * `wrapperTemplate`: Wrapper Template. Should not be overriden unless necessary.

## Node Format:

A node model object is a JS object which implements the following properties. It can (and often will) implement more.

* `key`: Required. String identifier for node.
* `label`: Required. Visual label for node. For more complex node content, use custom node rendering (below)
* `cssClass`: Optional. String.
* `children`: Optional. Array of child node objects.
* `sortable`: Optional. Boolean of whether children should be drag/drop sortable.
* `expanded`: Optional. Boolean of whether children should be pre-expanded. Default: *false*.

A node model may also contain any other properties as needed by the studio implementation. They will be ignored by the BrowseView, but can be consumed by your own custom tree node template.

## Custom Tree Node Rendering Templates:

By default, tree nodes render just their label as provided by the `node` object. This rendering is performed by a default built-in template. Custom templates can be provided by template ID string via the `treeNodeTemplate` constructor option. The custom template is passed the entire node object, and in this fashion can render any additional custom attributes/UI as needed by the specific studio. (i.e. in Widget Studio: icons, widget actions, attachment actions, staged/custom/themed/translated state badges, tool tips)

Default template implementation:

	<span class="<%: node.cssClass %>"><%= node.label %></span>

Note the reference to `node`.

## Methods:

### select(options)

Selects a node in the tree, which highlights it, scrolls to to it, and expands all (grand)parent nodes of the node.

	browseView.select(options);

 *options:*

  * `key`: Key to select

### get(options)

Gets the node model for a given key. Node model is an intact reference from when it was first rendered, including any custom properties.

	var node = browseView.get(options);

 *options:*

  * `key`: Key to get

 *returns*: `node` model

### list(options)

Lists node models. Node model are intact references from when they were first rendered, including any custom properties.

	var nodes = browseView.list(options);

 *options:*

  * `minDepth`: Optional int. 0-based min depth of nodes to return. Depth is counted from root or `parent` when `parent` is provided. (default: `0`)
  * `depth`: Optional int. 0-based max depth of nodes to return. Depth is counted from root or `parent` when `parent` is provided. (default: `0`)
  * `parent`: Optional string. Key of parent node of nodes to list. (default: `null`)
  * `checked`: Optional bool. When provided returns only nodes that whose checked state (in multi-select mode) matches the value. (default: `null`)
  * `expanded`: Optional bool. When provided, returns only nodes whose expanded state matches the value. (default: `null`)
  * `selected`: Optional bool. When provided, returns only selected nodes. (default: `null`)

*returns*: Array of `node` models

### add(options)

Adds a new node or array of nodes to the tree. See `node` type below.

	browseView.add(options);

 *options:*

  * `node`: Single `node` object.
  * `nodes`: Array of `node` objects
  * `parent`: Optional string. Key of parent node of nodes to add node(s) to. (default: `null`)

### update(options)

Updates a single node object, identified by its key

	browseView.update(options);

 *options:*

  * `node`: `Node` object.

### remove(options)

Removes a node and any of its children

	browseView.remove(options);

 *options:*

  * `key`: String key

### removeAll(options)

Removes all nodes

	browseView.removeAll();

### cleanup()

Releases held resources. Should be called when panel is closed.

	browseView.cleanup

### toggleCheckMode()

Toggles the multi-select (checkbox) mode in the tree. Can be used in conjunction with `selectAll()`, `deselectAll()`, and `list()` to manipulate and identify checked items.

	browseView.toggleCheckMode()

### selectAll()

Checks all nodes in check mode

	browseView.selectAll()

### deSelectAll()

Unchecks all nodes in check mode

	browseView.deSelectAll()

### expand(options, shouldExpand)

Expands or collapses a node. When expanding, if an expanded node has collapsed parents, expands those as well.

	browseView.expand(options, true);

 *options:*

  * `key`: String key

### togglePrimaryNavigation()

Toggles visibility of primary category navigation in Administration

	browseView.togglePrimaryNavigation(;

### focusOnSearch(options)

Focuses on the search input when search is enabled

	browseView.focusOnSearch(options);

 *options:*

  * `refocusOnElementAfterExit`: Optiona element to refocus on after exiting from search via `Escape`. Defaults to currently-focused input.

### addHeaderLink(options)

Adds a toolbar link.

	browseView.addHeaderLink(options);

 *options:*

  * `element`: DOM element to add as a toolbar item
  * `visible`: Optional bool. When set, specifies whether toolbar link is visible or contained under the collapsed/more drop-down.

### clearSearch(options)

Adds a toolbar link.

	browseView.clearSearch();

*/
define('StudioBrowseView', [
		'StudioQuickSearch',
		'StudioUtility',
		'evolutionSticky' ],
	function(
		StudioQuickSearch,
		StudioUtility,
		evolutionSticky,
		$, global, undef)
{
	var messaging = $.telligent.evolution.messaging;
	var template = $.telligent.evolution.template;

	var defaults = {
		container: null,
		wrapperCssClass: null,

		wrapperTemplate: 'studioShell-browseWrapper',
		treeTemplate: 'studioShell-browseTree',
		treeNodeTemplate: 'studioShell-browseTreeNode',

		headerContent: null,
		onExpanded: function(key) {},
		onCollapsed: function(key) {},
		onSelected: function(key) {},
		onSearchQuery: null, //function(query) {}
		onSearchExit: null,
		onSort: function(parentKey, children) {},
		onCheckChange: function(key) {},
		searchPlaceholder: null
	};

	function recurseNode(node, callback, depth) {
		depth = depth || 0;
		if(!node)
			return;

		callback(node, null, depth);
		if(node.children) {
			recurseNodes(node.children, callback, node, (depth + 1));
		}
	}

	function recurseNodes(nodes, callback, parent, depth) {
		depth = depth || 0;
		if(!nodes || nodes.length === 0)
			return;

		for(var i = 0; i < nodes.length; i++) {
			callback(nodes[i], parent, depth);
			if(nodes[i].children) {
				recurseNodes(nodes[i].children, callback, nodes[i], (depth + 1));
			}
		}
	}

	// Updates cache for a set of nodes, removing any existing matching records, recursively
	function setCache(context, nodes, initialParent, initialDepth) {
		recurseNodes(nodes, function(node, parent, depth) {
			delCache(context, node.key);
			if (node.__parent === undef)
				node.__parent = parent;
			if (node.__depth === undef)
				node.__depth = depth;
			context.nodeCache[node.key] = node;
		}, initialParent, initialDepth);
	}

	// Remove node from cache along with all children of that node
	function delCache(context, key) {
		var node = context.nodeCache[key];
		if(node) {
			if (node.__parent && node.__parent.children) {
				node.__parent.children = node.__parent.children.filter(function(n){
					return n.key !== node.key;
				});
			}
			recurseNode(node, function(n, parent, depth) {
				delete context.nodeCache[n.key];
			});
		}
	}

	function each(obj, callback) {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				callback(prop, obj[prop]);
			}
		}
	}

	function filter(obj, callback) {
		var filtered = [];
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				if(callback(prop, obj[prop])) {
					filtered.push(obj[prop]);
				}
			}
		}
		return filtered;
	}

	function getTreeNode(context, key) {
		return context.container.find('li.node[data-key="' + key + '"]');
	}

	function scrollIntoView(context, item) {
		context.scrollingContainer = context.scrollingContainer || context.container.closest('.administration-pane');
		StudioUtility.scrollContainerToFocusOnSelection(context.scrollingContainer, item,
			context.headerFixed ? context.container.find('.browse-header-wrapper').first().outerHeight() * 1.3 : 0);
		global.clearTimeout(context.scrollIntoViewTimeout);
		context.scrollIntoViewTimeout = setTimeout(function(){
			StudioUtility.scrollContainerToFocusOnSelection(context.scrollingContainer, item,
				context.headerFixed ? context.container.find('.browse-header-wrapper').first().outerHeight() * 1.3 : 0);
		}, 150);
	}

	function init(context) {
		context.wrapperTemplate = template(context.wrapperTemplate);
		context.treeTemplate = template(context.treeTemplate);

		context.container.append(context.wrapperTemplate({
			searchPlaceholder: context.searchPlaceholder
		}));
		context.wrapper = context.container.find('.browse').first();
		if(context.wrapperCssClass)
			context.wrapper.addClass(context.wrapperCssClass);
		context.treeContainer = context.container.find('.browse-tree > ul').first();
		context.headerContainer = context.container.find('.browse-header-wrapper').first();
		context.headerContentContainer = context.headerContainer.find('.browse-header').first();
		context.headerLinks = context.headerContainer.find('.browse-actions').first();
		context.searchHeader = context.headerContainer.find('.search-header').first();
		context.searchInput = context.searchHeader.find('input').first();

		// apply custom header content
		if(context.headerContent) {
			context.headerContentContainer.append(context.headerContent);
		}

		// stickify header
		context.headerContainer.evolutionSticky({
			scrollContainer: context.container.closest('.administration-pane')
		}).on('evolutionStickeyFixed.studioShellBrowseView', function(){
			context.headerFixed = true;
		}).on('evolutionStickeyUnfixed.studioShellBrowseView', function(){
			context.headerFixed = false;
		});

		// flattened cache of all nodes
		context.nodeCache = {};

		if(context.onSearchQuery) {
			initSearch(context);
		} else {
			context.searchHeader.hide();
		}
	}

	function highlightNode(context, key) {
		context.treeContainer.find('li.node.selected').removeClass('selected');

		var node = getTreeNode(context, key);
		if(!node)
			return false;

		node.addClass('selected');
	}

	function initSearch(context) {
		context.quickSearch = new StudioQuickSearch({
			searchInput: context.searchInput,
			resultContainer: context.treeContainer,
			template: context.treeTemplate,
			itemSelector: 'li.node:visible',
			noResultsMessage: 'No Results',
			selectOnClick: false,
			onSearch: function(query) {
				return context.onSearchQuery(query).then(function(r){
					if(r.nodes) {
						removeAll(context);
						setCache(context, r.nodes);
					}
					return $.extend({}, r, {
						treeNodeTemplate: (context.treeNodeTemplate || defaults.treeNodeTemplate)
					});
				});
			},
			onSelect: function() {
				if(context.onSelected) {
					context.onSelected($(this).data('key'));
				}
			},
			onResultsShown: function() { },
			onNoResultsShown: function(query) { },
			onExit: function() {
				context.searchInput.val('');
				removeAll(context);
				if(context.onSearchExit) {
					context.onSearchExit();
				}
				if(context.refocusOnElementAfterExit) {
					// hack to support re-focusing on token editors by hiding their processed version and showing their edit
					if($(context.refocusOnElementAfterExit).parent().is('.token-editor')) {
						$(context.refocusOnElementAfterExit).show().trigger('focus');
						$(context.refocusOnElementAfterExit).parent().find('.processed').hide();
					} else {
						// normally re-focus on element
						$(context.refocusOnElementAfterExit).trigger('focus');
					}
				}
			},
			onKeyboardNavigation: function(direction, item) {
				//highlightNode(context, options.key);
				scrollIntoView(context, item);
			}
		});
	}

	function handleEvents(context) {
		// selections
		context.container.on('click.studioShellBrowseView', '.node-label', function(e){
			if($(e.target).data('messagename'))
				return;

			if(context.onSelected) {
				var key = $(this).data('key');
				highlightNode(context, key);
				context.onSelected(key, {
					ctrlKey: e.ctrlKey,
					altKey: e.altKey,
					metaKey: e.metaKey,
					shiftKey: e.shiftKey
				});
			}
			return false;
		});

		// primary navigtation toggling
		context.container.on('click.studioShellBrowseView', '.collapse-nav', function(e){
			e.preventDefault();

			togglePrimaryNavigation();

			return false;
		});

		// tree navigation
		context.container.on('click.studioShellBrowseView', '.expander .handle', function(e){
			e.preventDefault();

			var key = $(e.target).closest('li.node').data('key');
			if(!key)
				return false;

			var node = getTreeNode(context, key);
			if(!node)
				return false;

			if(node.hasClass('expanded')) {
				node.removeClass('expanded');
				if(context.onCollapsed) {
					context.onCollapsed(key);
				}
			} else {
				node.addClass('expanded');
				if(context.onExpanded) {
					context.onExpanded(key);
				}
			}

			return false;
		});
	}

	function togglePrimaryNavigation() {
		$('body').toggleClass('collapsed-categories');
		$(global).trigger('resize');
		$.fn.evolutionTip.hide();
	}

	function toggleCheckMode(context) {
		context.treeContainer
			.toggleClass('select-mode')
			.on('change', '.node-select', function(e) {
				var key = $(e.target).closest('.node').data('key');
				if(key && context.onCheckChange) {
					context.onCheckChange(key);
				}
			});
	}

	function selectAll(context) {
		context.treeContainer.find('.node-select').prop('checked', true);
	}

	function deSelectAll(context) {
		context.treeContainer.find('.node-select').prop('checked', false);
	}

	function removeAll(context) {
		context.treeContainer.empty();
		context.nodeCache = {};
	}

	function expand(context, options, expand) {
		options = options || {};
		if(!options.key)
			return;

		var node = context.nodeCache[options.key];
		if(expand) {
			var expandedNode;

			while(node) {
				var domNode = getTreeNode(context, node.key);
				expandedNode = expandedNode || domNode;

				domNode.addClass('expanded');
				if(context.onExpanded) {
					context.onExpanded(node.key);
				}

				node = node.__parent;
			}
		} else {
			node.removeClass('expanded');
		}
	}

	function initSortables(context, renderedNodes) {
		var newSortableNodes = renderedNodes.find('.node-children.sortable');
		if(newSortableNodes.length > 0) {
			newSortableNodes.sortable({
				axis: 'y',
				scroll: true,
				start: function() {
					$.fn.evolutionTip.hide();
				}
			}).on('sortupdate.studioShellBrowseView', function(){
				if(context.onSort) {
					var key = $(this).closest('.node').data('key');
					var children = $.map($(this).children('.node'), function(n){
						return context.nodeCache[$(n).data('key')];
					});
					context.onSort(key, children);
				}
			}).on('sortstart.studioShellBrowseView', function(){
				$(this).addClass('sorting');
			}).on('sortstop.studioShellBrowseView', function(){
				$(this).removeClass('sorting');
			});
		}
	}

	function update(context, options) {
		if(!options.node)
			return;

		var initialDepth = 0;
		var initialParent = null;
		var existingNode = context.nodeCache[options.node.key];
		if (existingNode) {
			initialDepth = existingNode.__depth;
			initialParent = existingNode.__parent;
			if (initialParent && initialParent.children) {
				initialParent.children = initialParent.children.filter(function(n){
					return n.key !== options.node.key;
				});
				initialParent.children.push(options.node);
			}
		}

		if (initialParent) {
			setCache(context, [ initialParent ], initialParent.__parent, initialParent.__depth);
		} else {
			setCache(context, [ options.node ], initialParent, initialDepth);
		}

		var renderedNodes = $(context.treeTemplate({
			nodes: [ options.node ],
			treeNodeTemplate: (context.treeNodeTemplate || defaults.treeNodeTemplate)
		}));

		getTreeNode(context, options.node.key).replaceWith(renderedNodes);

		initSortables(context, renderedNodes);
	}

	function mergeNodes(nodesA, nodesB) {
		var newNodes = {};
		if(nodesA && nodesA.length > 0) {
			for(var i = 0; i < nodesA.length; i++) {
				newNodes[nodesA[i].key] = nodesA[i];
			}
		}
		if(nodesB && nodesB.length > 0) {
			for(var i = 0; i < nodesB.length; i++) {
				newNodes[nodesB[i].key] = nodesB[i];
			}
		}
		var nodeList = [];
		each(newNodes, function(k, v) {
			nodeList.push(v);
		});
		return nodeList;
	}

	var StudioBrowseView = function(options){
		var context = $.extend({}, defaults, options || {});

		init(context);
		handleEvents(context);

		return {
			select: function (options) {
				options = options || {};
				if(!options.key)
					scrollIntoView(context, context.treeContainer);

				var node = context.nodeCache[options.key];
				var selectedNode;

				while(node) {
					var domNode = getTreeNode(context, node.key);
					selectedNode = selectedNode || domNode;

					domNode.addClass('expanded');
					if(context.onExpanded) {
						context.onExpanded(node.key);
					}

					node = node.__parent;
				}

				highlightNode(context, options.key);

				scrollIntoView(context, selectedNode);
			},
			get: function (options) {
				options = options || {};
				if(!options.key)
					return null;

				return context.nodeCache[options.key];
			},
			list: function (options) {
				options = options || {};
				var minDepth = options.minDepth || 0;
				var depth = options.depth || 0;
				var parent = options.parent || null;
				var checked = options.checked || null;
				var expanded = options.expanded || null;
				var selected = options.selected || null;

				// first collect set of base nodes
				var nodes = [];

				// if parent provided, base are the parent's children
				if(parent) {
					var parent = context.nodeCache[parent];
					if(parent && parent.children) {
						var nodes = parent.children;
					}
				// otherwise, base are the root nodes
				} else {
					nodes = filter(context.nodeCache, function(k, v) {
						return v.__depth === 0;
					});
				}

				// if a depth provided, also include (grand)children of base nodes to that depth in flattened list
				if(depth > 0) {
					var chidlNodes = [];
					recurseNodes(nodes, function(node, parent, relativeDepth){
						if(relativeDepth > 0 && relativeDepth <= depth) {
							chidlNodes.push(node);
						}
					});
					nodes = mergeNodes(nodes, chidlNodes);
				}

				// min depth
				if(minDepth > 0) {
					nodes = nodes.filter(function(n){
						return n.__depth >= minDepth
					});
				}

				// if checked-only, filter to nodes with checked (or not checked) checkboxes
				if(checked !== null) {
					nodes = nodes.filter(function(n){
						var node = getTreeNode(context, n.key);
						return node && node.find('input.node-select').first().is(':checked') === checked;
					});
				}

				// if expanded selected
				if(expanded) {
					nodes = nodes.filter(function(n){
						var node = getTreeNode(context, n.key);
						return node && node.hasClass('expanded') === expanded;
					});
				}

				// if 'selected' option
				if(selected) {
					nodes = nodes.filter(function(n){
						var node = getTreeNode(context, n.key);
						return node && node.hasClass('selected') === selected;
					});
				}

				return nodes;
			},
			add: function (options) {
				var nodes = options.nodes || [];
				if(options.node) {
					nodes.push(options.node);
				}

				// if a parent key is specified, add node(s) as children of parent
				var parentNode = null;
				if (options.parent) {
					parentNode = context.nodeCache[options.parent];
					if (parentNode) {
						for (var i = 0; i < nodes.length; i++) {
							parentNode.children = parentNode.children || [];
							if(!parentNode.children) {
								parentNode.children = [];
							} else {
								// remove any currently matching child node from parent's children
								parentNode.children = parentNode.children.filter(function(c){
									return c.key !== nodes[i].key;
								});
							}
							parentNode.children.push(nodes[i]);
							nodes[i].__parent = parentNode;
							nodes[i].__depth = parentNode.__depth + 1;
						}
					}
				}


				// if was adding to a parent, just re-render parent
				if (parentNode) {
					setCache(context, [ parentNode ]);
					update(context, { node: parentNode });
				// otherwise render new root
				} else {
					setCache(context, nodes);
					var renderedNodes = $(context.treeTemplate({
						nodes: nodes,
						treeNodeTemplate: (context.treeNodeTemplate || defaults.treeNodeTemplate)
					})).appendTo(context.treeContainer);

					initSortables(context, renderedNodes);
				}

			},
			update: function (options) {
				return update(context, options);
			},
			remove: function (options) {
				options = options || {};
				if(!options.key)
					return;

				var node = context.nodeCache[options.key];
				if(!node)
					return;

				delCache(context, options.key);
				getTreeNode(context, options.key).remove();
			},
			removeAll: function (options) {
				removeAll(context);
			},
			cleanup: function () {
				context.container.off('studioShellBrowseView');
				global.clearTimeout(context.scrollIntoViewTimeout);
			},
			toggleCheckMode: function() {
				toggleCheckMode(context);
			},
			selectAll: function() {
				selectAll(context);
			},
			deSelectAll: function() {
				deSelectAll(context);
			},
			expand: function(options, shouldExpand) {
				if(shouldExpand === undef || shouldExpand === true) {
					expand(context, options, true);
				} else {
					expand(context, options, false)
				}
			},
			togglePrimaryNavigation: togglePrimaryNavigation,
			focusOnSearch: function (options) {
				options = options || {};
				context.refocusOnElementAfterExit = options.returnElement
					? options.returnElement
					: document.activeElement;

				context.searchInput.trigger('focus');
			},
			addHeaderLink: function (options) {
				options = options || {};
				if(!options.element)
					return;

				if(!context.addedHeaderLinks) {
					context.addedHeaderLinks = {
						visible: [],
						hidden: []
					};
				}

				// track where to add link (visible or hidden)
				var insertAt = 0;
				// hidden link
				if(options.visible !== undef && options.visible === false) {
					context.addedHeaderLinks.hidden.push(options);
					insertAt = context.addedHeaderLinks.visible.length + context.addedHeaderLinks.hidden.length;
				// visible link
				} else {
					context.addedHeaderLinks.visible.push(options);
					insertAt = context.addedHeaderLinks.visible.length;
				}

				// reconfigure ui-links for current amount of visible links
				var visibleLinks = 1 + context.addedHeaderLinks.visible.length;
				$(context.headerLinks).uilinks('reconfigure', {
					minLinks: visibleLinks,
					maxLinks: visibleLinks
				});

				// add link
				var insertedLink = $(context.headerLinks).uilinks('insert',
					options.element,
					insertAt);
			},
			clearSearch: function() {
				if(context.searchInput.val() !== '') {
					context.searchInput.val('');
					removeAll(context);
					if(context.onSearchExit) {
						context.onSearchExit();
					}
				}
			}
		}
	};

	return StudioBrowseView;

}, jQuery, window);
