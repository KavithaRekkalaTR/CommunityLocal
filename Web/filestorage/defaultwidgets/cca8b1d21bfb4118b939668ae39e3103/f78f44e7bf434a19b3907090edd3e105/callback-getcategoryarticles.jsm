core_v2_page.SetContentType('application/json');

var categoryId = null;
if (core_v2_page.GetFormValue('categoryId')) {
    categoryId = core_v2_utility.ParseInt(core_v2_page.GetFormValue('categoryId'));
}

var articles = [];
articles_v1_articleCategories.List(categoryId, {
    IncludeUnpublished: false,
    PageIndex: 0,
    PageSize: 200,
    SortBy: 'SortOrder',
    SortOrder: 'Ascending'
}).AsArray().forEach(function(articleCategory) {
    articles.push({
        name: articleCategory.Article.Title,
        sortOrder: articleCategory.SortOrder,
        id: articleCategory.Article.Id
    });
})

return {
    articles: articles
};