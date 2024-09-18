var includeEmpty = core_v2_widget.GetBoolValue('includeEmpty', false);
var includeArticles = core_v2_widget.GetBoolValue('includeArticles', false);
var PAGE_SIZE = 200;

function loadRootCategories(articleCollectionId) {
	var query = {
		CategoryOrChildrenHaveArticles: !includeEmpty,
		RootLevelOnly: true
	};

	var categories = articles_v1_categories.List(articleCollectionId, query);

	return categories.map(function(c) {
		return {
			Id: c.Id,
			HasChildren: c.HasChildren,
			Url: c.Url,
			Name: c.Name,
			Level: 1,
			IsExpanded: false
		};
	});
}

function loadSiblings(articleCollectionId, categoryId) {
	var category = articles_v1_categories.Get({ ArticleCollectionId: articleCollectionId, Id: categoryId });
	if (!category)
		return [];

	var parentCategory = category.Parent;
	if (!parentCategory)
		return [];

	// first add sibling categories at category evel
	var siblings = articles_v1_categories.List(articleCollectionId, {
		CategoryOrChildrenHaveArticles: !includeEmpty,
		ParentId: parentCategory.Id,
		RootLevelOnly: false
	});

	// then add articles cast to same shape as categories
	if (includeArticles) {

		var articleCategories = articles_v1_articleCategories.List(parentCategory.Id, {
			IncludeUnpublished: false,
			PageIndex: 0,
			PageSize: PAGE_SIZE,
			SortBy: 'SortOrder',
			SortOrder: 'Ascending'
		});

		siblings = siblings.concat(articleCategories.map(function (ac) {
			return {
				HasChildren: false,
				Name: ac.Article.Title,
				Url: ac.Article.Url,
				Id: ac.Article.Id
			};
		}));
	}

	return siblings;
}

function loadChildren(articleCollectionId, categoryId) {
	// first get categories...
	var nodes = articles_v1_categories.List(articleCollectionId, {
		RootLevelOnly: false,
		ParentId: categoryId,
		CategoryOrChildrenHaveArticles: !includeEmpty
	});

	// then add articles cast to same shape as categories
	if (includeArticles) {

		var articleCategories = articles_v1_articleCategories.List(categoryId, {
			IncludeUnpublished: false,
			PageIndex: 0,
			PageSize: PAGE_SIZE,
			SortBy: 'SortOrder',
			SortOrder: 'Ascending'
		});

		nodes = nodes.concat(articleCategories.map(function (ac) {
			return {
				HasChildren: false,
				Name: ac.Article.Title,
				Url: ac.Article.Url,
				Id: ac.Article.Id
			};
		}));
	}

	return nodes;
}

function listAncestorCategories(articleCollectionId, categoryId) {
	var ancestors = [];
	traverseAncestorCategories(articleCollectionId, categoryId, ancestors);
	return ancestors;
}

function traverseAncestorCategories(articleCollectionId, categoryId, ancestors) {
	var category = articles_v1_categories.Get({ ArticleCollectionId: articleCollectionId, Id: categoryId });
	if (category) {
		ancestors.push(category);
		if (category.Parent) {
			traverseAncestorCategories(articleCollectionId, category.Parent.Id, ancestors);
		}
	}
}

return {
	listChildren: loadChildren,
	listFlattenedHierarchy: function(articleCollectionId, currentCategoryId) {
		var nodes = loadRootCategories(articleCollectionId);

		if (currentCategoryId) {
			// merge ancestors into list of nodes
			var ancestors = listAncestorCategories(articleCollectionId, currentCategoryId);
			if (ancestors && ancestors.length > 0) {
				var deepestAncestor = ancestors[ancestors.length - 1];
				var mergedNodes = [];
				for (var i = 0; i < nodes.length; i++) {
					// look for the oldest ancestor of the category in the root list, and add the ancestors in place of it
					if (nodes[i].Id == deepestAncestor.Id) {
						for (var j = ancestors.length - 1; j >= 0; j--) {
							mergedNodes.push({
								Id: ancestors[j].Id,
								HasChildren: ancestors[j].HasChildren,
								Url: ancestors[j].Url,
								Name: ancestors[j].Name,
								Level: (ancestors.length - j),
								IsExpanded: j > 0
							});
						}
					} else {
						mergedNodes.push(nodes[i]);
					}
				}
				nodes = mergedNodes;

				// merge siblings at each ancestor level
				for (var s = ancestors.length - 1; s >= 0; s--) {
					var ancestor = ancestors[s];
					var siblings = loadSiblings(articleCollectionId, ancestor.Id);
					if (siblings && siblings.length > 0) {
						var mergedNodes = [];

						for (var i = 0; i < nodes.length; i++) {
							// look for the current node in the list, and add its siblings (with itself) in place of it
							if (nodes[i].Id == ancestor.Id) {
								var currentNodeLevel = nodes[i].Level;
								var deeperNodeLevel;
								var spliceStop = null;
								var spliced = null;

								// find any possible range of children of parent to splice and re-add after
								if (nodes.length > i + 1 && nodes[i+1].Level > currentNodeLevel) {
									deeperNodeLevel = nodes[i+1].Level
									for (var spl = i+1; spl < nodes.length; spl++) {
										if (nodes[spl].Level < deeperNodeLevel) {
											spliceStop = spl;
											break;
										}
									}
									spliced = nodes.splice(i + 1, spliceStop - (i + 1));
								}

								for (var j = 0; j < siblings.length; j++) {
									mergedNodes.push({
										Id: siblings[j].Id,
										HasChildren: siblings[j].HasChildren,
										Url: siblings[j].Url,
										Name: siblings[j].Name,
										Level: currentNodeLevel, // all the same level
										IsExpanded: false
									});

									// re-add any spliced children
									if (spliced && siblings[j].Id == ancestor.Id) {
										mergedNodes[mergedNodes.length - 1].IsExpanded = true;
										for (var spl = 0; spl < spliced.length; spl++) {
											mergedNodes.push(spliced[spl]);
										}
										spliced = null;
									}
								}

							} else {
								mergedNodes.push(nodes[i]);
							}
						}

						nodes = mergedNodes;
					}
				}
			}

			// merge children
			var children = loadChildren(articleCollectionId, currentCategoryId);
			if (children && children.length > 0) {
				var mergedNodes = [];

				for (var i = 0; i < nodes.length; i++) {
					mergedNodes.push(nodes[i]);
					// look for the current category the list, and add its children after it
					if (nodes[i].Id == currentCategoryId) {
						var currentNodeLevel = nodes[i].Level;
						nodes[i].IsExpanded = true;
						for (var j = 0; j < children.length; j++) {
							mergedNodes.push({
								Id: children[j].Id,
								HasChildren: children[j].HasChildren,
								Url: children[j].Url,
								Name: children[j].Name,
								Level: currentNodeLevel + 1, // all at next level
								IsExpanded: false
							});
						}
					}
				}

				nodes = mergedNodes;
			}
		}

		return nodes;
	}
};
