var threadId = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue('threadId')),
    answerType = core_v2_page.GetQueryStringValue('answerType');

// verified-answers, non-verified-answers

core_v2_page.SetContentType('application/json');

if (threadId > 0) {
    var answers = core_v2_forumReply.List(threadId, {
        ForumReplyQueryType: answerType, 
        SortBy: 'PostDate', 
        SortOrder: 'Descending', 
        PageSize: 1, 
        PageIndex: 0, 
        IncludeThreadStarter: false 
    });
    
    if (answers.length > 0) {
        return {
            ContentId: answers[0].ContentId.ToString(),
            ContentTypeId: core_v2_forumReply.ContentTypeId.ToString()
        };
    }
}

return { ContentId: null, ContentTypeId: null };