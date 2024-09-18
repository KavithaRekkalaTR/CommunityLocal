var categoryId = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue('_w_categoryId'));

var category = articles_v1_categories.Get({ Id: categoryId });

core_v2_page.SetContentType('text/json');

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

if (category && !category.HasErrors()) {
    return {
       id: category.Id,
       name: category.Name,
       location: getCategoryLocation(category),
       description: category.Description || '',
       sortOrder: category.SortOrder,
       hasChildren: category.HasChildren,
       parentId: category.Parent != null ? category.Parent.Id : null,
       defaultArticleId: category.DefaultArticle != null ? category.DefaultArticle.Id : null,
       url: category.Url,
       image: {
           url: category.ImageUrl
       }
    };
} else {
    return null;
}