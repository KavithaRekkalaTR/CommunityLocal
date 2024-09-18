var endDate = core_v2_page.GetQueryStringValue("endDate");
if (endDate && endDate.length > 0)
    endDate = core_v2_utility.ParseDate(endDate);
else
    endDate = core_v2_utility.CurrentUserDate;

this.events = context.ListEvents({
    EventType: core_v2_page.GetQueryStringValue("eventType"),
    StartDate: core_v2_utility.ParseDate(core_v2_page.GetQueryStringValue("startDate")),
    EndDate: endDate,
    MachineName: core_v2_page.GetQueryStringValue("machineName"),
    SearchText: core_v2_page.GetQueryStringValue("query"),
    PageIndex: core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue("pageIndex")),
    PageSize: core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue("pageSize")),
});

core_v2_page.SetContentType('application/json');

return { count: core_v2_widget.ExecuteFile('render-count.vm'), list: core_v2_widget.ExecuteFile('render-list.vm') };