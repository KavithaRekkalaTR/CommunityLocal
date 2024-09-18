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

var notCategorized = core_v2_language.GetResource('NotCategorized');
if (query.length == 0 || notCategorized.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
    matches.push({
        id: '',
        name: notCategorized
    })
}

for (var i = 0; i < categories.Count; i++) {
    matches.push({
        id: categories[i].Id,
        name: core_v2_language.FormatString(core_v2_language.GetResource('in_category'), categories[i].Name) + getLocation(categories[i])
    });
}

return {
    matches: matches
};