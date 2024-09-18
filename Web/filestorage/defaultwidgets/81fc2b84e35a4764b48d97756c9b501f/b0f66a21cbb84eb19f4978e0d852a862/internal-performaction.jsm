var action = core_v2_widget.GetExecutionParameterValue('action');
var isVersion = core_v2_widget.GetExecutionParameterValue('isversion') == '1';
var articleId = core_v2_utility.ParseGuid(core_v2_widget.GetExecutionParameterValue('articleId'));
var version = core_v2_utility.ParseGuid(core_v2_widget.GetExecutionParameterValue('version'));

var result;

if (action == 'publish') {
    if (isVersion) {
        result = articles_v1_articleVersions.Update(articleId, version, {
           ReadyToPublish: true 
        });
    } else {
        result = context.PublishArticle(articleId);
    }
    
    if (result && result.IsPendingReview) {
        return {
            errors: null,
            warnings: core_v2_utility.CreateWarning('Warning', core_v2_language.GetResource('PublishPendingReview'))
        };
    }
} else if (action == 'unpublish') {
    if (isVersion) {
        result = articles_v1_articleVersions.Update(articleId, version, {
           PublishEndDate: core_v2_utility.CurrentDate
        });
    } else {
        result = context.UnpublishArticle(articleId);
    }
} else if (action == 'delete') {
    if (isVersion) {
        result = articles_v1_articleVersions.Delete(articleId, version);
    } else {
        result = articles_v1_articles.Delete(articleId);
    }
} else if (action == 'undelete') {
    if (isVersion) {
        result = articles_v1_articleVersions.Undelete(articleId, version);
    } else {
        result = context.RestoreArticle(articleId);
    }
} else {
    return {
        errors: core_v2_utility.CreateError('Error', 'Unknown action'),
        warnings: null
    }
}

if (result && result.HasWarningsOrErrors()) {
    return {
        errors: result.Errors.length > 0 ? result.Errors : null,
        warnings: result.Warnings.length > 0 ? result.Warnings : null
    }
}

return null;