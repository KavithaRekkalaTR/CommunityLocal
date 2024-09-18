this.wikis = context.ListWikis({
    NameFilter: core_v2_page.GetQueryStringValue("nameQuery"),
    PageIndex: core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue("pageIndex")),
    PageSize: core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue("pageSize")),
});

core_v2_page.SetContentType('application/json');

return { count: core_v2_widget.ExecuteFile('render-count.vm'), list: core_v2_widget.ExecuteFile('render-wikis.vm') };