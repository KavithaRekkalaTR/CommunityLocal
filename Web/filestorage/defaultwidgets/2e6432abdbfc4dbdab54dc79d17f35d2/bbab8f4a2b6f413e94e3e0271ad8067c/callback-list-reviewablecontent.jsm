core_v2_page.SetContentType('application/json');

var guidEmpty = core_v2_utility.ParseGuid('');
var pageIndex = parseInt(core_v2_page.GetQueryStringValue('w_pageindex'), 10);
var listOptions = { 
    PageIndex: pageIndex, 
    PageSize: 20 
};

var sortBy = core_v2_page.GetQueryStringValue('w_sort');
listOptions.SortBy = 'CreatedDate';
if (sortBy) {
    if (sortBy == 'LastUpdateDate') {
        listOptions.SortBy = 'LastActionDate';
    } else if (sortBy == 'AuthorDisplayName') {
        listOptions.SortBy = 'AuthorDisplayName';
    } 
}


var sortOrder = core_v2_page.GetQueryStringValue('w_sortorder');
if (sortOrder) {
	listOptions.SortOrder = sortOrder;
}

var appealStates = core_v2_page.GetQueryStringValue('w_state');
// All relevant options: AllActionRequired, ModerationRequired, ReviewRequired, AuthorRespondedReported, Initiated, Accepted, Rejected, Expired
if (appealStates == 'AllActionRequired' || appealStates == 'ReviewRequired') {
    listOptions.Filter = 'PendingReview';
    listOptions.IsActive = true;
} else if (appealStates == 'PendingReview') {
    listOptions.Filter = 'AllPendingReview';
    listOptions.IsActive = true;
} else if (appealStates == 'Accepted') {
    listOptions.Filter = 'Approved'
    listOptions.IsActive = false;
} else if (appealStates == 'Rejected') {
    listOptions.Filter = 'Denied'
    listOptions.IsActive = false;
} else {
	return {
	    content: [],
	    hasMore: false
	};
} 

var sortReviewableKeyFunc = function(item) {
    if (sortBy == 'LastUpdateDate') {
        if (item.History && item.History.Count > 0) {
            return core_v2_utility.GetTimestamp(item.History[item.History.Count - 1].Date);
        } else {
            return core_v2_utility.GetTimestamp(core_v2_utility.CurrentDate);
        }
    } else if (sortBy == 'AuthorDisplayName') {
        if (item.Author) {
            return item.Author.DisplayName;
        } else {
            return "";
        }
    } else {
        if (item.CreatedDate) {
            return core_v2_utility.GetTimestamp(item.CreatedDate);
        } else {
            return core_v2_utility.GetTimestamp(core_v2_utility.CurrentDate);
        }
    }
};

// doesn't honor age -- age is only honored for "reported" status which reviewables don't support.

var authorId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_authorid'));
if (authorId && authorId != guidEmpty) {
	listOptions.AuthorId = authorId;
}

var contentTypeId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_contenttypeid'));
if (contentTypeId && contentTypeId != guidEmpty) {
    listOptions.ContentTypeId = contentTypeId;
}

var containerId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_containerid'));
var containerTypeId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_containertypeid'));

var applicationId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_applicationid'));
var applicationTypeId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_applicationtypeid'));

if (applicationId && applicationTypeId && applicationId != guidEmpty && applicationTypeId != guidEmpty) {
	listOptions.ApplicationId = applicationId;
} else if (containerId && containerTypeId && containerId != guidEmpty && containerTypeId != guidEmpty) {
	listOptions.ContainerId = containerId;
}

this.hasModerateUsersPermission = core_v3_permission.CheckPermission(core_v2_sitePermissions.ManageMembership, core_v2_user.Accessing.Id).IsAllowed;

var reviewableContents = context.ListReviewableContent(listOptions);
var currentPagedQuantity = (reviewableContents.PageIndex + 1) * reviewableContents.PageSize;
var hasMore = (reviewableContents.TotalCount > currentPagedQuantity);

var response = {
    content: [],
    hasMore: hasMore
};

for (var i = 0; i < reviewableContents.Count; i++) {
    this.reviewableContent = reviewableContents[i];
    var content = core_v2_widget.ExecuteFile('reviewablecontent.vm');
    response.content.push({
        order: sortReviewableKeyFunc(reviewableContents[i]),
        html: content
    });
}

return response;