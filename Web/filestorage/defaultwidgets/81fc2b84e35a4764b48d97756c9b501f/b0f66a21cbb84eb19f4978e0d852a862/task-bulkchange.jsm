var pageSize = 200;
var sortOrder = core_v2_widget.GetExecutionParameterValue('sortOrder');
var sortBy = core_v2_widget.GetExecutionParameterValue('sortBy');
var filter = core_v2_widget.GetExecutionParameterValue('filter');
var isDefault = core_v2_widget.GetExecutionParameterValue('isDefault');
var queryText = core_v2_widget.GetExecutionParameterValue('queryText');
var publishGroupId = core_v2_widget.GetExecutionParameterValue('publishGroupId');
var categoryId = core_v2_widget.GetExecutionParameterValue('categoryId');
var inCategory = core_v2_widget.GetExecutionParameterValue('inCategory');
var exceptRaw = core_v2_widget.GetExecutionParameterValue('except');
var action = core_v2_widget.GetExecutionParameterValue('action');
var currentArticleId = core_v2_widget.GetExecutionParameterValue('currentArticleId');
var affectedCurrentArticle = false;

var except = {
    length: 0
};

if (exceptRaw && exceptRaw != '') {
    exceptRaw.split(';').forEach(function(k) {
       except[k] = true;
       except.length++;
    });
}

var options = {
    PageSize: pageSize,
    InCategory: inCategory
};

if (sortBy && sortBy != '')
    options['SortBy'] = sortBy
else
    options['SortBy'] = 'Title';

if (sortOrder && sortOrder != '')
    options['SortOrder'] = sortOrder;
else
    options['SortOrder'] = 'Ascending';

if (queryText && queryText != '')
    options['TitleSearch'] = queryText;

if (publishGroupId && publishGroupId != '')
    options['PublishGroupId'] = publishGroupId;

if (categoryId && categoryId != '')
    options['CategoryIds'] = categoryId;
    
if (isDefault == '1')
    options['IsDefault'] = true;
else if (isDefault == '0')
    options['IsDefault'] = false;

var done = false, pageIndex = -1, articles, i, progress, totalCount, currentIndex = 0;
do {
    pageIndex++;
    options['PageIndex'] = pageIndex;
    
    if (filter == 'deletedarticles') {
        options['IsDeleted'] = true;
        articles = context.ListArticles(options);
    } else if (filter == 'drafted') {
        options['IsPublished'] = false;
        articles = context.ListArticleVersions(options);
    } else if (filter == 'deleteddrafts') {
        options['IsPublished'] = false;
        options['IsDeleted'] = true
        articles = context.ListArticleVersions(options);
    } else {
        filter = 'published';
        options['IsPublished'] = true;
        articles = context.ListArticles(options);
    }
    
    if (articles == null) {
        break;
    } else if (articles.HasErrors()) {
        context_v2_scheduledFile.End(articles.Errors[0].Message);
    } else if (articles.Count < pageSize) {
        done = true;
    }
    
    totalCount = articles.TotalCount - except.length;
    articles = articles.AsArray();
    
    articles.forEach(function(article) {
        if (!except[article.Id.ToString() + ':' + article.Version.ToString()]) {
            currentIndex++;
            context_v2_scheduledFile.Report({ 
                Message: article.Identifier, 
                PercentComplete:  currentIndex / (totalCount - except.length)
            });
            
            if (currentArticleId == article.Id && filter != 'drafted' && filter != 'deleteddrafts') {
                affectedCurrentArticle = true;
            }
            
            var result = core_v2_widget.ExecuteFile('internal-performaction.jsm', {
                Parameters: {
                    action: action,
                    articleId: article.Id.ToString(),
                    version: article.Version.ToString(),
                    isVersion: (filter == 'drafted' || filter == 'deleteddrafts') ? '1' : '0'
                }
            });
            
            if (result && result.errors) {
                if (Array.isArray(result.errors)) {
                    context_v2_scheduledFile.End(result.errors[0].Message);
                } else {
                    context_v2_scheduledFile.End(result.errors.Message);
                }
            }
        }
    });
} while (!done);

return {
    complete: true,
    affectedCurrentArticle: affectedCurrentArticle
}