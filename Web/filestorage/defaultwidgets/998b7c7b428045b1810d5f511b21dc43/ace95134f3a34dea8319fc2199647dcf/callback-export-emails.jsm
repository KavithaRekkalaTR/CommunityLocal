//
// Export Emails, Resources, Configurations
//
var options = {
	Ids: core_v2_page.GetQueryStringValue('_w_ids'),
	IdsStorageKey: core_v2_page.GetQueryStringValue('_w_idsStorageKey'),
	Mode: core_v2_page.GetQueryStringValue('_w_mode')
};

if (options.IdsStorageKey || options.Ids)
	context.Export(options)
else
	context.ExportAll(options)
