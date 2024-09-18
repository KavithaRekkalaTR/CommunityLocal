core_v2_page.SetContentType('application/json');

var options = {
	Query: core_v2_page.GetQueryStringValue('query'),
	PageSize: core_v2_page.GetQueryStringValue('pageSize'),
	PageIndex: core_v2_page.GetQueryStringValue('pageIndex')
};

if (core_v2_page.GetQueryStringValue('staged') == 'true' ||
	core_v2_page.GetQueryStringValue('staged') == 'false')
{
	options.Staged = core_v2_page.GetQueryStringValue('staged');
}

if (core_v2_page.GetQueryStringValue('factoryDefaultProvider')) {
	options.FactoryDefaultProviderId = core_v2_page.GetQueryStringValue('factoryDefaultProvider');
}

if (core_v2_page.GetQueryStringValue('state')) {
	options.State = core_v2_page.GetQueryStringValue('state');
}

this.embeddables = context.ListEmbeddables(options);

if (this.embeddables.HasErrors())
	core_v2_page.SendJsonError(this.embeddables.Errors);

return {
	options: options,
	items: this.embeddables,
	renderedItems: core_v2_widget.ExecuteFile('render-list.vm')
};