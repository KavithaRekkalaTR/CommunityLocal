core_v2_page.SetContentType('application/json');

var api = core_v2_widget.ExecuteFile('api.jsm');

var articleCollectionId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('articleCollectionId'));
var articleCollection = articles_v1_articleCollections.Get({ Id: articleCollectionId });

var articleId = null;
if (core_v2_page.GetFormValue('articleId')) {
    articleId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('articleId'));
}

var versionId = null;
if ((core_v2_page.GetFormValue('versionId') || '') != '') {
    versionId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('versionId'));
}

var publishGroupId = null;
var publishGroup = null;
if (core_v2_page.GetFormValue('publishGroupId')) {
    publishGroupId = core_v2_utility.ParseInt(core_v2_page.GetFormValue('publishGroupId'));
    publishGroup = articles_v1_publishGroups.Get(publishGroupId);
    if (publishGroup && !publishGroup.HasErrors()) {
        publishGroup = {
            id: publishGroup.Id,
            name: publishGroup.Name,
            formattedPublishDate: publishGroup.PublishDate ? core_v2_language.FormatDateAndTime(publishGroup.PublishDate) : null,
            formattedPublishEndDate: publishGroup.PublishEndDate ? core_v2_language.FormatDateAndTime(publishGroup.PublishEndDate) : null,
            isActive: !publishGroup.IsPublished && !publishGroup.IsDeleted
        }
    } else {
        publishGroup = null;
    }
}
var exists = false;

if (!articleId) {
    return {
        originalVersionId: null,
        exists: exists,
        id: null,
        identifier: '',
        title: '',
        body: '',
        tags: '',
        typeId: articleCollection.DefaultType == null ? null : articleCollection.DefaultType.Id,
        version: null,
        createDate: null,
        formattedCreateDate: null,
        publishGroupId: null,
        readyToPublish: false,
        isPublished: false,
        isPendingReview: false,
        publishDate: null,
        formattedPublishDate: null,
        publishEndDate: null,
        formattedPublishEndDate: null,
        lastUpdateDate: null,
        formattedLasUpdateDate: null,
        author: null,
        categories: [],
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        publishGroup: publishGroup,
        defaultFor: null
    };
}

var defaultFor = [];
if (articleCollection.DefaultArticle && articleCollection.DefaultArticle.Id == articleId) {
    if (articleCollection.Url) {
        defaultFor.push('<a href="' + core_v2_encoding.HtmlAttributeEncode(articleCollection.Url) + '">' + articleCollection.Name + '</a>');   
    } else {
        defaultFor.push(articleCollection.Name);
    }
}

var defaultCategories = articles_v1_categories.List(articleCollectionId, {
    DefaultArticleId: articleId,
    PageSize: 5,
    PageIndex: 0
});
defaultCategories.forEach(function(c) {
    if (c.Url) {
        defaultFor.push('<a href="' + core_v2_encoding.HtmlAttributeEncode(c.Url) + '">' + c.Name + '</a>');
    } else {
        defaultFor.push(c.Name);
    }
});
if (defaultCategories.TotalCount > defaultCategories.PageSize) {
    defaultFor.push(core_v2_language.FormatString(core_v2_language.GetResource('and_x_more'), (defaultCategories.TotalCount - defaultCategories.PageSize)));
}

var version = null;

if (versionId) {
    version = articles_v1_articleVersions.Get(articleId, versionId);
    if (version) {
        if (version.HasErrors()) {
            core_v2_page.SendJsonError(version.Errors);
        } else if (!version.IsPublished) {
            exists = true;
        }
    }
} else {
    var versions = articles_v1_articleVersions.List(articleId, {
       PublishGroupId: publishGroupId,
       InPublishGroup: publishGroupId != null,
       PageSize: 1,
       PageIndex: 0,
       SortOrder: 'Descending',
       SortBy: 'LastUpdateDate',
       IsPublished: false,
       IsDeleted: false,
       InCategory: ''
    });
    
    if (versions.Count == 0) {
        // get the current published version
        var article = articles_v1_articles.Get({ Id: articleId });
        if (article && !article.HasErrors()) {
            version = articles_v1_articleVersions.Get(articleId, article.Version);
            
            // copy tags from the current article
            if (version != null)
                version.Tags = article.Tags;
        }
    } else {
        version = versions[0];
        if (publishGroup == null && version.PublishGroup == null) {
            exists = true;
        } else if (publishGroup != null && version.PublishGroup != null && publishGroup.id == version.PublishGroup.Id) {
            exists = true;
        }
    }
}

if (version) {
    var categories = [];
    for (var i = 0; i < version.Categories.length; i++) {
        categories.push({
            id: version.Categories[i].Category.Id,
            name: version.Categories[i].Category.Name + api.getCategoryLocation(version.Categories[i].Category),
            sortOrder: version.Categories[i].SortOrder
        });
    }
    
    return {
        originalVersionId: version.Version,
        exists: exists,
        id: articleId,
        identifier: version.Identifier,
        title: version.Title,
        body: version.Body('Raw'),
        tags: version.Tags.length > 0 ? version.Tags.join(',') : '',
        typeId: version.Type.Id,
        version: exists ? version.Version : null,
        createDate: version.CreateDate ? core_v2_utility.GetTimestamp(version.CreateDate) : null,
        formattedCreateDate: version.CreateDate ? core_v2_language.FormatDateAndTime(version.CreateDate) : null,
        publishGroupId: version.PublishGroup == null ? null : version.PublishGroup.Id,
        readyToPublish: exists ? version.ReadyToPublish : false,
        isPublished: exists ? version.IsPublished : false,
        sourceIsPublished: version.IsPublished,
        isPendingReview: exists ? version.IsPendingReview : false,
        publishDate: version.PublishDate && exists ? core_v2_utility.GetTimestamp(version.PublishDate) : null,
        formattedPublishDate: version.PublishDate && exists ? core_v2_language.FormatDateAndTime(version.PublishDate) : null,
        publishEndDate: version.PublishEndDate && exists ? core_v2_utility.GetTimestamp(version.PublishEndDate) : null,
        formattedPublishEndDate: version.PublishEndDate && exists ? core_v2_language.FormatDateAndTime(version.PublishEndDate) : null,
        lastUpdateDate: version.LastUpdateDate ? core_v2_utility.GetTimestamp(version.LastUpdateDate) : null,
        formattedLastUpdateDate: version.LastUpdateDate ? core_v2_language.FormatDateAndTime(version.LastUpdateDate) : null,
        author: {
            name: version.Author.Username,
            displayName: version.Author.DisplayName,
            url: version.Author.Url,
            avatarUrl: version.Author.AvatarUrl
        },
        categories: categories,
        metaTitle: version.MetaTitle,
        metaDescription: version.MetaDescription,
        metaKeywords: version.MetaKeywords,
        publishGroup: publishGroup,
        defaultFor: defaultFor.length == 0 ? null : core_v2_language.FormatString(core_v2_language.GetResource('default_for'), defaultFor.join(', '))
    };
} else {
    // no article with that ID was found
    return {
        originalVersionId: null,
        exists: false,
        id: null,
        identifier: '',
        title: '',
        body: '',
        tags: '',
        typeId: articleCollection.DefaultType == null ? null : articleCollection.DefaultType.Id,
        version: null,
        createDate: null,
        formattedCreateDate: null,
        publishGroupId: null,
        readyToPublish: false,
        isPublished: false,
        sourceIsPublished: false,
        isPendingReview: false,
        publishDate: null,
        formattedPublishDate: null,
        publishEndDate: null,
        formattedPublishEndDate: null,
        lastUpdateDate: null,
        formattedLastUpdateDate: null,
        author: null,
        categories: [],
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        publishGroup: publishGroup,
        defaultFor: null
    };
}