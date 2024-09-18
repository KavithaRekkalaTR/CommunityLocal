//
// Export Resources
//
var options = {
	Ids: core_v2_page.GetQueryStringValue('_w_ids'),
	IdsStorageKey: core_v2_page.GetQueryStringValue('_w_idsStorageKey')
};

if (options.IdsStorageKey || options.Ids)
	context.ExportResources(options)
else
	context.ExportAllResources(options)
