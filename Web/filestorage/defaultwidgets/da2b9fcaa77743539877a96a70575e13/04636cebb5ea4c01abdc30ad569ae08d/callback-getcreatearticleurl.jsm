core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost) {
    return null;
}

var threadId = parseInt(core_v2_page.GetFormValue('threadId'), 10);
var articleCollectionId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('articleCollectionId'));

var thread = core_v2_forumThread.Get(threadId);
if (thread == null || thread.HasErrors()) {
  return null;
}

var createUrl = articles_v1_articleUrls.CreateArticle(articleCollectionId, true);
if (createUrl == null || createUrl.length == 0) {
    return null;
}

var normalizeHtmlContent = function(html) {
    html = html || '';
    if (html.indexOf('<div') < 0 && html.indexOf('<p') < 0) {
        return '<p>' + html + '</p>\n';
    } else {
        return html;
    }
}

var content = [];
content.push('<h2>');
content.push(thread.Subject);
content.push('</h2>\n');
content.push(normalizeHtmlContent(thread.Body('Raw')));

if (thread.ThreadType == 'Discussion') {
	var forumReplies = core_v2_forumReply.List(thread.Id, {
	    PageSize: 100,
	    PageIndex: 0
		});
		
	if (forumReplies && forumReplies.length > 0) {
	    content.push('<h2>');
	    content.push(core_v2_language.GetResource('Discussion'));
	    content.push('<h2>\n');

    	forumReplies.forEach(function(forumReply) {
            content.push(normalizeHtmlContent(forumReply.Body('Raw')));
    	});
	}
} else {
    var verifiedAnswers = core_v2_forumReply.List(thread.Id, {
	    PageSize: 100,
	    PageIndex: 0,
	    ForumReplyQueryType: 'verified-answers'
		});
		
	var unverifiedAnswers = core_v2_forumReply.List(thread.Id, {
	    PageSize: 100,
	    PageIndex: 0,
	    ForumReplyQueryType: 'non-verified-answers'
		});
		
	if ((verifiedAnswers && verifiedAnswers.length > 0) || (unverifiedAnswers && unverifiedAnswers.length > 0)) {
	    content.push('<h2>');
	    content.push(core_v2_language.GetResource('Answer'));
	    content.push('<h2>\n');

        if (verifiedAnswers) {
        	verifiedAnswers.forEach(function(forumReply) {
                content.push(normalizeHtmlContent(forumReply.Body('Raw')));
        	});
        }
    	
    	if (unverifiedAnswers) {
        	unverifiedAnswers.forEach(function(forumReply) {
                content.push(normalizeHtmlContent(forumReply.Body('Raw')));
        	});
    	}
	}
}

var tempStorageId = core_v2_utility.StoreTemporaryData(JSON.stringify({
    title: '',
    body: content.join(''),
    contentId: thread.ContentId.ToString(),
    contentTypeId: core_v2_forumThread.ContentTypeId.ToString()
}));

return {
  url: core_v2_page.AdjustQueryString(createUrl, 'tid=' + core_v2_encoding.UrlEncode(tempStorageId))
};