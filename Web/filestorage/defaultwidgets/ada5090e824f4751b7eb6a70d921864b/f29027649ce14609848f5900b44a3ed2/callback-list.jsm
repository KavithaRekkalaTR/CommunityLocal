var pageIndex = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue("w_pageIndex"));

var query = {
    Query: core_v2_page.GetQueryStringValue("w_query"),
    PageSize: 20,
    PageIndex: pageIndex,
    SortBy: core_v2_page.GetQueryStringValue("w_sortBy"),
    SortOrder: core_v2_page.GetQueryStringValue("w_sortOrder")
}

var roleId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue("w_roleId"));
if (roleId != null && roleId != "00000000-0000-0000-0000-000000000000") {
    query.RoleId = roleId;
}

var userIds = core_v2_page.GetQueryStringValue("w_userIds");
if (userIds && userIds.Length > 0) {
    query.UserIds = userIds;
}

var accountStatus = core_v2_page.GetQueryStringValue("w_accountStatus");
query.AccountStatus = accountStatus;

var dateComparison = core_v2_page.GetQueryStringValue("w_dateComparison");
var date1 = core_v2_utility.ParseDate(core_v2_page.GetQueryStringValue("w_date1"));
var date2 = core_v2_utility.ParseDate(core_v2_page.GetQueryStringValue("w_date2"));

if(dateComparison == "JoinedBefore") {
    query.JoinedDateComparison = 'LessThan';
    query.JoinedDate1 = date1;
}
else if(dateComparison == "JoinedAfter") {
    query.JoinedDateComparison = 'GreaterThan';
    query.JoinedDate1 = date1;
}
else if(dateComparison == "JoinedBetween") {
    query.JoinedDateComparison = 'Between';
    query.JoinedDate1 = date1;
    query.JoinedDate2 = date2;
}
else if(dateComparison == "VisitedBefore") {
    query.LastVisitedDateComparison = 'LessThan';
    query.LastVisitedDate1 = date1;
}
else if(dateComparison == "VisitedAfter") {
    query.LastVisitedDateComparison = 'GreaterThan';
    query.LastVisitedDate1 = date1;
}

this.exactUsers = false;
if (pageIndex == 0) {
    this.exactUsers = context.ListExact(query);
    if (this.exactUsers && this.exactUsers.HasErrors()) {
        core_v2_page.SendJsonError(this.exactUsers.Errors);
    }
}

this.users = context.List(query);
if (this.users && this.users.HasErrors()) {
    core_v2_page.SendJsonError(this.users.Errors);
}

core_v2_page.SetContentType("application/json");

return { count: core_v2_widget.ExecuteFile('render-count.vm'), list: core_v2_widget.ExecuteFile('render-userlist.vm') };