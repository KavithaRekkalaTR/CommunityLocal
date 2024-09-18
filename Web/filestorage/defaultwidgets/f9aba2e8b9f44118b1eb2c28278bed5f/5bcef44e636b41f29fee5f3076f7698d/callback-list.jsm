core_v2_page.SetContentType('application/json');

var options = {
	Query: core_v2_page.GetQueryStringValue('query'),
	PageSize: core_v2_page.GetQueryStringValue('pageSize'),
	PageIndex: core_v2_page.GetQueryStringValue('pageIndex')
};

if (core_v2_page.GetQueryStringValue('enabled') == 'true' ||
	core_v2_page.GetQueryStringValue('enabled') == 'false')
{
	options.Enabled = core_v2_page.GetQueryStringValue('enabled');
}

if (core_v2_page.GetQueryStringValue('automationId')) {
	options.AutomationId = core_v2_page.GetQueryStringValue('automationId');
}

this.configuredAutomations = context.ListConfiguredAutomations(options);

if (this.configuredAutomations.HasErrors())
	core_v2_page.SendJsonError(this.configuredAutomations.Errors);

return {
	options: options,
	list: core_v2_widget.ExecuteFile('render-list.vm')
};