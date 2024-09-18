core_v2_page.SetContentType('application/json');

var query = core_v2_page.GetFormValue('query');
var articleCollectionId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('articleCollectionId'));

var articles = articles_v1_articles.Lookup(query, { ArticleCollectionId: articleCollectionId });
var matches = [];

for (var i = 0; i < articles.Count; i++) {
    matches.push({
        id: articles[i].Id,
        name: core_v2_language.FormatString(core_v2_language.GetResource('for_article'), articles[i].Title)
    });
}

return {
    matches: matches
};