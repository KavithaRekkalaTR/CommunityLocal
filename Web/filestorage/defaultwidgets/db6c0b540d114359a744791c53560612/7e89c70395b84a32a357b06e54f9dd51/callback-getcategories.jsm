var categoryId = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue('_w_categoryId'));
var collectionId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('_w_collectionId'));

var categories = articles_v1_categories.List(collectionId, {
    ParentId: categoryId > 0 ? categoryId : null,
    RootLevelOnly: (categoryId == 0)
});

function getCategoryLocation(c) {
    var location = [];
    var parent = c.Parent;
    while (parent != null) {
        location.unshift(parent.Name);
        parent = parent.Parent;
    }
    if (location.length == 0)
        return '';
    else
        return ' (' + location.join(' &gt; ') + ')';
}

var response = [];
for (var i = 0; i < categories.Count; i++) {
    response.push({
       id: categories[i].Id,
       name: categories[i].Name,
       location: getCategoryLocation(categories[i]),
       description: categories[i].Description || '',
       sortOrder: categories[i].SortOrder,
       hasChildren: categories[i].HasChildren,
       defaultArticleId: categories[i].DefaultArticle != null ? categories[i].DefaultArticle.Id : null,
       url: categories[i].Url,
       image: {
           url: categories[i].ImageUrl
       }
    });
}

core_v2_page.SetContentType('text/json');

return {
    categories: response
};