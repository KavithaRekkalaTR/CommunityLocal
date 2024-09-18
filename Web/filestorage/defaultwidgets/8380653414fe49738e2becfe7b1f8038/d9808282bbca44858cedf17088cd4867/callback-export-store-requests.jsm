//
// Store Export Lists in a temporary location via AJAX/POST so they can be retrieved from a subsequent GET handler
//
if (!core_v2_page.IsPost)
	return { success: false };

var storageKey = context.StoreTemporaryExportList({
	Ids: core_v2_page.GetFormValue('_w_ids')
});

core_v2_page.SetContentType('application/json');

return {
	success: true,
	key: storageKey
};
