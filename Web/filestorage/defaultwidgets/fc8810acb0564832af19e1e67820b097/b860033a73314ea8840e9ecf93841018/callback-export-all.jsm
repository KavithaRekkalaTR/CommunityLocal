var endDate = core_v2_page.GetQueryStringValue("_w_endDate");
if (endDate && endDate.length > 0)
    endDate = core_v2_utility.ParseDate(endDate);
else
    endDate = core_v2_utility.CurrentUserDate;

var options = {
    AuditType: core_v2_page.GetQueryStringValue("_w_auditType"),
    StartDate: core_v2_utility.ParseDate(core_v2_page.GetQueryStringValue("_w_startDate")),
    EndDate: endDate,
    MachineName: core_v2_page.GetQueryStringValue("_w_machineName"),
    SearchText: core_v2_page.GetQueryStringValue("_w_query"),
    UserId: core_v2_page.GetQueryStringValue("_w_userId"),
    PageIndex: core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue("_w_pageIndex")),
    PageSize: 20
};

context.HandleExportAllRequest(options);