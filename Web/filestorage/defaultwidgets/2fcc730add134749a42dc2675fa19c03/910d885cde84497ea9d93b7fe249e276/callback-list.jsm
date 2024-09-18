core_v2_page.SetContentType('application/json');

var options = {
	Query: core_v2_page.GetQueryStringValue('query'),
	PageSize: core_v2_page.GetQueryStringValue('pageSize'),
	PageIndex: core_v2_page.GetQueryStringValue('pageIndex')
};

if (core_v2_page.GetQueryStringValue('isStaged') == 'true' ||
	core_v2_page.GetQueryStringValue('isStaged') == 'false')
{
	options.IsStaged = core_v2_page.GetQueryStringValue('isStaged');
}

if (core_v2_page.GetQueryStringValue('factoryDefaultProvider')) {
	options.FactoryDefaultProvider = core_v2_page.GetQueryStringValue('factoryDefaultProvider');
}

if (core_v2_page.GetQueryStringValue('themeId')) {
	options.ThemeId = core_v2_page.GetQueryStringValue('themeId');
}

if (core_v2_page.GetQueryStringValue('includeNonThemed')) {
	options.IncludeNonThemed = core_v2_page.GetQueryStringValue('includeNonThemed');
}

if (core_v2_page.GetQueryStringValue('state')) {
	options.State = core_v2_page.GetQueryStringValue('state');
}

this.fragments = context.ListFragments(options);

if (this.fragments.HasErrors())
	core_v2_page.SendJsonError(this.fragments.Errors);

return {
	options: options,
	items: this.fragments,
	renderedItems: core_v2_widget.ExecuteFile('render-list.vm')
};