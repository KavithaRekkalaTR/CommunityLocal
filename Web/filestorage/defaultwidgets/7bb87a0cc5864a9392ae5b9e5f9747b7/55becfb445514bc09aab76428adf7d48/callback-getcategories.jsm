core_v2_page.SetContentType('application/json');

var api = core_v2_widget.ExecuteFile('api.jsm');

var query = core_v2_page.GetFormValue('query');
var articleCollectionId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('articleCollectionId'));

var categories = articles_v1_categories.Lookup(query, { ArticleCollectionId: articleCollectionId });

var matches = [];
for (var i = 0; i < categories.Count; i++) {
    matches.push({
        id: categories[i].Id,
        name: categories[i].Name + api.getCategoryLocation(categories[i])
    });
}

return {
    matches: matches
};