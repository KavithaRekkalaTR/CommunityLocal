var text = core_v2_page.GetQueryStringValue('_w_querytext');

var categories = articles_v1_categories.Lookup(text, { ArticleCollectionId: context.ArticleCollection.Id });

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

var matches = [];
for (var i = 0; i < categories.Count; i++) {
    matches.push({
        id: categories[i].Id,
        name: categories[i].Name + getCategoryLocation(categories[i])
    });
}

return {
    matches: matches
};