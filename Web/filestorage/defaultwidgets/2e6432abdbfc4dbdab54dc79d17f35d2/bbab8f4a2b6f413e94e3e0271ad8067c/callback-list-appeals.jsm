core_v2_page.SetContentType('application/json');

var guidEmpty = core_v2_utility.ParseGuid('');
var pageIndex = parseInt(core_v2_page.GetQueryStringValue('w_pageindex'), 10);
var listOptions = { 
    PageIndex: pageIndex, 
    PageSize: 20 
};

var sortBy = core_v2_page.GetQueryStringValue('w_sort');
if (sortBy) {
	listOptions.SortBy = sortBy;
}

var sortOrder = core_v2_page.GetQueryStringValue('w_sortorder');
if (sortOrder) {
	listOptions.SortOrder = sortOrder;
}

var appealStates = core_v2_page.GetQueryStringValue('w_state');
if (appealStates == 'AllActionRequired') {
    listOptions.AppealState = 'ModerationRequired,AuthorResponded';
} else if (appealStates == 'ReviewRequired' || appealStates == 'PendingReview') {
    return {
	    content: [],
	    hasMore: hasMore
	};
} else if (appealStates == 'Reported') {
	listOptions.AbuseState = appealStates;
} else {
	listOptions.AppealState = appealStates;
} 

var sortAppealKeyFunc = function(item) {
    var d;
    if (appealStates == 'Reported') {
        return "1"; // shortcut because this won't be merged
    } else if (sortBy == 'LastUpdatedDate') {
        d = item.ModifiedDate;
        if (d) {
            return core_v2_utility.GetTimestamp(d);
        } else {
            return core_v2_utility.GetTimestamp(core_v2_utility.CurrentDate);
        }
    } else if (sortBy == 'ContentDate') {
        if (item.Content && item.Content.CreatedDate) {
            return core_v2_utility.GetTimestamp(item.Content.CreatedDate);
        } else {
            return core_v2_utility.GetTimestamp(core_v2_utility.CurrentDate);
        }
    } else if (sortBy == 'AuthorDisplayName') {
        if (item.AuthorUser) {
            return item.AuthorUser.DisplayName;
        } else {
            return "";
        }
    } else {
        d = item.AppealInitiatedDate;
        if (d) {
            return core_v2_utility.GetTimestamp(d);
        } else {
            return core_v2_utility.GetTimestamp(core_v2_utility.CurrentDate);
        }
    }
};

var age = parseInt(core_v2_page.GetQueryStringValue('w_age'), 10);

var authorId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_authorid'));
if (authorId && authorId != guidEmpty) {
	listOptions.AuthorUserId = authorId;
	listOptions.ContentAuthorId = authorId;
}

var contentTypeId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_contenttypeid'));
if (contentTypeId && contentTypeId != guidEmpty) {
    listOptions.ContentTypeId = contentTypeId;
}

var containerId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_containerid'));
var containerTypeId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_containertypeid'));

var applicationId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_applicationid'));
var applicationTypeId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_applicationtypeid'));

var hasPermission = false;
if (applicationId && applicationTypeId && applicationId != guidEmpty && applicationTypeId != guidEmpty) {
	hasPermission = core_v2_abuseAppeal.CanReviewAppealsInApplication(applicationId, applicationTypeId);
	listOptions.ApplicationId = applicationId;
} else if (containerId && containerTypeId && containerId != guidEmpty && containerTypeId != guidEmpty) {
	hasPermission = core_v2_abuseAppeal.CanReviewAppealsInContainer(containerId, containerTypeId);
	listOptions.ContainerId = containerId;
} else {
	hasPermission = true;
}

this.hasModerateUsersPermission = core_v3_permission.CheckPermission(core_v2_sitePermissions.ManageMembership, core_v2_user.Accessing.Id).IsAllowed;

if (hasPermission) {
	if (appealStates == 'Reported') {
		listOptions.IncludeIgnoredContent = false;

        if (age < 0) {
            var startReportDate = core_v2_utility.CurrentDate;
            startReportDate.setDate(startReportDate.getDate() + age);
            listOptions.StartReportDate = startReportDate;
        }

		var abusiveContents = core_v2_abusiveContent.List(listOptions);
		var currentPagedQuantity = (abusiveContents.PageIndex + 1) * abusiveContents.PageSize;
		var hasMore = (abusiveContents.TotalCount > currentPagedQuantity);
		
		var response = {
		    content: [],
		    hasMore: hasMore,
		    noContent: '<div class="message norecords">' + core_v2_language.GetResource('No_Appeals') + '</div>'
		};
		
		for (var i = 0; i < abusiveContents.Count; i++) {
		    this.abusiveContent = abusiveContents[i];
		    var content = core_v2_widget.ExecuteFile('abusivecontent.vm');
		    response.content.push({
		        order: core_v2_utility.GetTimestamp(abusiveContents[i].LastUpdatedDate), // TODO: Should be based on sort order
		        html: content
		    });
		}
		
		return response;
	} else { 
		var appeals = core_v2_abuseAppeal.List(listOptions);
		var currentPagedQuantity = (appeals.PageIndex + 1) * appeals.PageSize;
		var hasMore = (appeals.TotalCount > currentPagedQuantity);
		
		var response = {
		    content: [],
		    hasMore: hasMore
		};
		
		for (var i = 0; i < appeals.Count; i++) {
		    this.appeal = appeals[i];
		    var content = core_v2_widget.ExecuteFile('appeal.vm');
		    response.content.push({
		        order: sortAppealKeyFunc(appeals[i]),
		        html: content
		    });
		}
		
		return response;
	}
} else {
    return {
        content: [],
        hasMore: false
    };
}