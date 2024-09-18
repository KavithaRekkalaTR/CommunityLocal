function addCategory(category, crumbs) {
    if (category && !category.HasErrors()) {
        crumbs.unshift({
            Url: category.Url,
            Label: category.Name,
            CssClass: 'category'
        });
        addCategory(category.Parent, crumbs);
    }
}

return {
    listCrumbs: function() {
        var crumbs = [];
        var currentUrl = articles_v1_articleUrls.Current;
        
        if (currentUrl != 'ArticleCollection') {
            var category = articles_v1_categories.Current;
            if (category && currentUrl == 'Category') {
                addCategory(category.Parent, crumbs);
            } else {
                var article = articles_v1_articles.Current;
                if (article && !article.HasErrors()) {
                    if (category && !category.HasErrors()) {
                        addCategory(category, crumbs);
                    } 
                } else if (category && !category.HasErrors()) {
                    addCategory(category.Parent, crumbs);
                }
            }
            
            var collection = articles_v1_articleCollections.Current;
            if (collection) {
                crumbs.unshift({
                    Url: collection.Url,
                    Label: collection.Name,
                    CssClass: 'collection'
                });
            }
        }
        
        return crumbs;
    }
};