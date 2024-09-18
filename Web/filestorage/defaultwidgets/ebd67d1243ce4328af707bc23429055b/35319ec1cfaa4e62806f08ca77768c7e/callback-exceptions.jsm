var endDate = core_v2_page.GetQueryStringValue("_w_endDate");
if (endDate && endDate.length > 0)
    endDate = core_v2_utility.ParseDate(endDate);
else
    endDate = core_v2_utility.CurrentUserDate;

var categoryIdString = core_v2_page.GetQueryStringValue("_w_categoryId");
var categoryId = '';
if (categoryIdString != '')
    categoryId = core_v2_utility.ParseGuid(categoryIdString);

this.exceptions = context_exceptions.List({
    MinFrequency: core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue("_w_minFrequency")),
    StartDate: core_v2_utility.ParseDate(core_v2_page.GetQueryStringValue("_w_startDate")),
    EndDate: endDate,
    IncludeUnknown: 'True',
    MachineName: core_v2_page.GetQueryStringValue("_w_machineName"),
    SearchText: core_v2_page.GetQueryStringValue("_w_query"),
    AffectedType: core_v2_page.GetQueryStringValue("_w_affectedType"),
    SortBy: core_v2_page.GetQueryStringValue("_w_sortBy"),
    PageIndex: core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue("_w_pageIndex")),
    PageSize: 20,
    CategoryId: categoryId
});

core_v2_page.SetContentType('application/json');

return { count: this.exceptions.TotalCount, list: core_v2_widget.ExecuteFile('render-list.vm') };