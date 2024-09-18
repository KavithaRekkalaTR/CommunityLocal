//
// Export Automations, Resources, Configurations
//
var options = {
	Ids: core_v2_page.GetQueryStringValue('_w_ids'),
	IdsStorageKey: core_v2_page.GetQueryStringValue('_w_idsStorageKey'),
	Mode: core_v2_page.GetQueryStringValue('_w_mode'),
	SpecifyHost: true,
	HostId: null
};

if (options.IdsStorageKey || options.Ids)
	context.ExportAutomations(options)
else
	context.ExportAllAutomations(options)
