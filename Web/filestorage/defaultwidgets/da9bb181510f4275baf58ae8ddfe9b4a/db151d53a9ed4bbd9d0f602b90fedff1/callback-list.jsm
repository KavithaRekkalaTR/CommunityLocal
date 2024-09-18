core_v2_page.SetContentType('application/json');

var options = {
	Query: core_v2_page.GetQueryStringValue('query'),
	PageSize: core_v2_page.GetQueryStringValue('pageSize'),
	PageIndex: core_v2_page.GetQueryStringValue('pageIndex')
};

if (core_v2_page.GetQueryStringValue('isStaged') == 'true' ||
	core_v2_page.GetQueryStringValue('isStaged') == 'false')
{
	options.Staged = core_v2_page.GetQueryStringValue('isStaged');
}

if (core_v2_page.GetQueryStringValue('typeId')) {
	options.TypeId = core_v2_page.GetQueryStringValue('typeId');
}

if (core_v2_page.GetQueryStringValue('state')) {
	options.State = core_v2_page.GetQueryStringValue('state');
}

this.themes = context.ListThemes(options);

if (this.themes.HasErrors())
	core_v2_page.SendJsonError(this.themes.Errors);

return {
	options: options,
	items: this.themes,
	renderedItems: core_v2_widget.ExecuteFile('render-list.vm')
};