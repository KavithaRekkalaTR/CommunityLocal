//
// Export Fragments
//
var options = {
	Ids: core_v2_page.GetQueryStringValue('_w_ids'),
	IdsStorageKey: core_v2_page.GetQueryStringValue('_w_idsStorageKey')
};

if (options.IdsStorageKey || options.Ids)
	context.ExportFragments(options)
else
	context.ExportAllFragments(options)
