core_v2_page.SetContentType('application/json');

var query = core_v2_page.GetFormValue('query');
var articleCollectionId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('articleCollectionId'));

var categories = articles_v1_categories.Lookup(query, { ArticleCollectionId: articleCollectionId });

var getLocation = function(c) {
    var location = [];
    var parent = c.Parent;
    while (parent != null && !parent.HasErrors()) {
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
        name: categories[i].Name + getLocation(categories[i])
    });
}

return {
    matches: matches
};