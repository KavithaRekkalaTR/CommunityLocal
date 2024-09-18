//
// Export Themes, Resources
//
var options = {
	Ids: core_v2_page.GetQueryStringValue('_w_ids'),
	IdsStorageKey: core_v2_page.GetQueryStringValue('_w_idsStorageKey')
};

var mode = core_v2_page.GetQueryStringValue('_w_mode');

if (options.IdsStorageKey || options.Ids) {
	if (mode == 'Resource') {
		context.ExportResources(options);
	} else if (mode == 'Theme') {
		context.ExportThemes(options);
	}
} else {
	if (mode == 'Resource') {
		context.ExportAllResources(options);
	} else if (mode == 'Theme') {
		context.ExportAllThemes(options);
	}
}