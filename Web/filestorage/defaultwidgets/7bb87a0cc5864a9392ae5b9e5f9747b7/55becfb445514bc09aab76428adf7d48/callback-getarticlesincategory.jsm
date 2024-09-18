core_v2_page.SetContentType('application/json');

var categoryId = null;
if (core_v2_page.GetFormValue('categoryId')) {
    categoryId = core_v2_utility.ParseInt(core_v2_page.GetFormValue('categoryId'));
}

var publishGroupId = null;
if (core_v2_page.GetFormValue('publishGroupId')) {
    publishGroupId = core_v2_utility.ParseInt(core_v2_page.GetFormValue('publishGroupId'));
}

var publishedArticles = articles_v1_articleCategories.List(categoryId, {
    IncludeUnpublished: false,
    PageIndex: 0,
    PageSize: 200,
    SortBy: 'SortOrder',
    SortOrder: 'Ascending'
}).AsArray();

var publishGroupArticles = [];
var publishGroupArticlesByArticleId = {};
if (publishGroupId) {
    publishGroupArticles = articles_v1_articleVersionCategories.List(categoryId, publishGroupId, {
        PageIndex: 0,
        PageSize: 200,
        SortBy: 'SortOrder',
        SortOrder: 'Ascending'
    });
    
    publishGroupArticles.forEach(function(ar) {
        publishGroupArticlesByArticleId[ar.ArticleVersion.Id] = ar;
    });
}

var isBefore = function(leftArticleCategory, rightArticleCategory) {
    if (leftArticleCategory.SortOrder !== null && rightArticleCategory.SortOrder !== null) {
        return leftArticleCategory.SortOrder <= rightArticleCategory.SortOrder;
    } else if (leftArticleCategory.SortOrder !== null) {
        return true;
    } else if (rightArticleCategory.SortOrder !== null) {
        return false;
    } else {
        return (leftArticleCategory.Article.Title.toLowerCase() <= rightArticleCategory.ArticleVersion.Title.toLowerCase());
    }
}

var combinedArticles = [];
var i = 0, j = 0;
while (i < publishedArticles.length || j < publishGroupArticles.length) {
    while (i < publishedArticles.length && publishGroupArticlesByArticleId[publishedArticles[i].Article.Id]) {
        i++;
    }

    if (i < publishedArticles.length && j < publishGroupArticles.length) {
        if (isBefore(publishedArticles[i], publishGroupArticles[j])) {
            combinedArticles.push({
                name: publishedArticles[i].Article.Title,
                sortOrder: publishedArticles[i].SortOrder,
                articleId: publishedArticles[i].Article.Id,
                version: null,
                publishGroupId: null
            });
            i++;
        } else {
            combinedArticles.push({
                name: publishGroupArticles[j].ArticleVersion.Title,
                sortOrder: publishGroupArticles[j].SortOrder,
                articleId: publishGroupArticles[j].ArticleVersion.Id,
                version: publishGroupArticles[j].ArticleVersion.Version,
                publishGroupId: publishGroupId
            });
            j++;
        }
    } else if (i < publishedArticles.length) {
        combinedArticles.push({
            name: publishedArticles[i].Article.Title,
            sortOrder: publishedArticles[i].SortOrder,
            articleId: publishedArticles[i].Article.Id,
            version: null,
            publishGroupId: null
        });
        i++;
    } else if (j < publishGroupArticles.length) {
        combinedArticles.push({
            name: publishGroupArticles[j].ArticleVersion.Title,
            sortOrder: publishGroupArticles[j].SortOrder,
            articleId: publishGroupArticles[j].ArticleVersion.Id,
            version: publishGroupArticles[j].ArticleVersion.Version,
            publishGroupId: publishGroupId
        });
        j++;
    }
}

return {
    articles: combinedArticles
};