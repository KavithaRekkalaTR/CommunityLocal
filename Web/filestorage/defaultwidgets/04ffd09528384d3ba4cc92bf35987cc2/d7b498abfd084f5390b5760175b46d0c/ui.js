(function ($, global) {

	var _changes = {};

	function saveChanges(options) {
		if (options.save.hasClass('disabled')) {
			return;
		}

		options.save.addClass('disabled');

		var tasks = [];
		var count = 0;
		var batchId = null;
		$.each(_changes, function(id, node) {
			if (batchId === null || count >= 100) {
				if (count >= 100) {
					tasks.push($.telligent.evolution.batch.process(batchId, {
						sequential: false
					}));
				}
				batchId = $.telligent.evolution.batch.create();
				count = 0;
			}

			var data = {
				Id: id,
				WikiId: options.wikiId,
				SaveRevision: false
			}

			if (node.value.parentId != node.value.originalParentId) {
			   data.ParentPageId = node.value.parentId === null ? -1 : node.value.parentId;
			}
			if (node.value.position != node.value.originalPosition) {
				data.Position = node.value.position === null ? -1 : node.value.position;
			}
			if (node.value.hidden != node.value.originalHidden) {
				data.HideInTableOfContents = node.value.hidden;
			}

			$.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/{WikiId}/pages/{Id}.json?IncludeFields=WikiPage.Id',
				data: data,
				batch: batchId
			})
				.then(function() {
					node.value.originalParentId = node.value.parentId;
					node.value.originalPosition = node.value.position;
					node.value.originalHidden = node.value.hidden;
					trackChange(options, node);
				});

			count++;
		});

		if (count > 0) {
			tasks.push($.telligent.evolution.batch.process(batchId, {
				sequential: false
			}));
		}

		$.when.apply($, tasks)
			.then(function() {
				$.telligent.evolution.notifications.show(options.text.saveSuccessful, {
					type: 'success'
				})
			})
			.always(function() {
			  options.save.removeClass('disabled');
			});
	}

	function trackChange(options, node) {
		if (node.value.parentId != node.value.originalParentId
			|| node.value.position != node.value.originalPosition
			|| node.value.hidden != node.value.originalHidden) {
			_changes[node.value.id] = node;
		} else {
			delete _changes[node.value.id];
		}
	}

	function resizeTree(options) {
		var panel = $.telligent.evolution.administration.panelWrapper();
		options.tree.glowTree('resize', panel.width(), panel.height() - panel.find('.tree-options').outerHeight() - panel.find('p').outerHeight() - 80);
	}

	function formatTitle(options, title, hidden) {
		if (hidden) {
			return options.text.hiddenPage.replace(/\{0\}/g, title);
		} else {
			return title;
		}
	}

	function nodeSelected(options, node) {
		if (node.value.hidden) {
			options.hideToggle.html(options.text.show);
		} else {
			options.hideToggle.html(options.text.hide);
		}
	}

	function toggleHidden(options) {
		var node = options.tree.glowTree('selected');
		if (node) {
			node.value.hidden = !node.value.hidden;
			node.html = formatTitle(options, node.value.title, node.value.hidden);
			trackChange(options, node);
			node.refresh();
			nodeSelected(options, node);
		}
	}

	function nodeMoved(options, node, originalParent) {
		var parent = node.getParent();
		if (parent !== originalParent) {
			if (parent === null) {
				node.value.parentId = null;
			} else {
				node.value.parentId = parent.value.id;
			}
			trackChange(options, node);
			reviewOrder(options, originalParent);
		}
		reviewOrder(options, parent);
	}

	function reviewOrder(options, parentNode) {
		var items = [];
		var itemCount = 0;
		var item;
		var i;

		if (parentNode) {
			itemCount = parentNode.count();
			for (i = 0; i < itemCount; i++) {
				item = parentNode.getByIndex(i);
				item.value.position = i;
				items.push({
					item: item,
					originalIndex: i
				});
			}
		} else {
			itemCount = options.tree.glowTree('count');
			for (i = 0; i < itemCount; i++) {
				item = options.tree.glowTree('getByIndex', i);
				item.value.position = i;
				items.push({
					item: item,
					originalIndex: i
				});
			}
		}

		items.sort(function(a, b) {
			if (a.item.value.isDefault == b.item.value.isDefault) {
			   return a.item.value.title.localeCompare(b.item.value.title);
			} else if (a.item.value.isDefault) {
				return -1;
			} else {
				return 1;
			}
		});

		var allAreNatural = true;
		for ( i = 0; i < itemCount; i++) {
			items[i].item.value.naturalPosition = i;
			if (items[i].item.value.position != i) {
				allAreNatural = false;
			}
		}

		if (allAreNatural) {
			for (i = 0; i < itemCount; i++) {
				items[i].item.value.position = null;
				trackChange(options, items[i].item);
			}
		} else {
			for (i = 0; i < itemCount; i++) {
				trackChange(options, items[i].item);
			}
		}
	}

	function getChildNodes(options, tree, node) {
		$.telligent.evolution.get({
			url: options.urls.getChildNodes,
			data: {
				_w_wikiId: options.wikiId,
				_w_wikiPageId: node === null ? null : node.value.id
			}
		})
			.then(function(response) {
			   var childNode;
			   for (var i = 0; i < response.pages.length; i++) {
				   childNode = options.tree.glowTree('createTreeNode', {
					   value: {
							id: response.pages[i].id,
							originalParentId: node === null ? null : node.value.id,
							parentId: node === null ? null : node.value.id,
							originalPosition: response.pages[i].position,
							naturalPosition: null,
							position: response.pages[i].position,
							title: response.pages[i].title,
							hidden: response.pages[i].hidden,
							originalHidden: response.pages[i].hidden,
							isDefault: response.pages[i].isDefault
						},
					   html: formatTitle(options, response.pages[i].title, response.pages[i].hidden)
				   });

				   if (!response.pages[i].hasChildren) {
					   childNode.expanded(true, false);
				   }

				   if (node === null) {
					options.tree.glowTree('add', childNode);
				   } else {
					node.add(childNode);
				   }
			   }

			   if (node === null) {
				   options.tree.glowTree('refresh');
			   } else {
				   node.refresh();
				   node.expanded(true, false);
			   }
			});
	}

	var api = {
		register: function (options) {
			options.tree.glowTree({
				enableDragDrop: true,
				getSubNodes: function(tree, node) {
					getChildNodes(options, tree, node);
				},
				expandedImageUrl: options.urls.expandedImage,
				collapsedImageUrl: options.urls.collapsedImage,
				blankImageUrl: options.urls.blankImage
			})
				.on('glowTreeNodeSelected', function(e, node) {
					nodeSelected(options, node);
				})
				.on('glowTreeNodeMoved', function(e, node, originalParent) {
					nodeMoved(options, node, originalParent);
				});

			$(global).on('resized.wikiTocManager', function() {
				resizeTree(options);
			});

			$.telligent.evolution.administration.on('panel.unloaded', function(){
			   $(window).off('.wikiTocManager');
			});

			options.hideToggle.on('click', function() {
				toggleHidden(options);
				return false;
			});

			global.setTimeout(function() {
				resizeTree(options);
				getChildNodes(options, options.tree, null);
			}, 249);

			var header = $.telligent.evolution.administration.header('<fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="#" class="button save">Save</a></span></li></ul></fieldset>');
			options.save = $.telligent.evolution.administration.header().find('.button.save');
			options.save.on('click', function() {
				saveChanges(options);
				return false;
			})
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.wikiTocManagement = api;

})(jQuery, window);