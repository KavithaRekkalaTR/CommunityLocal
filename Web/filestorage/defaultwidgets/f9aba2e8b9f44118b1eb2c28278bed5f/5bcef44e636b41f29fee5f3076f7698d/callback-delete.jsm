core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var id = core_v2_page.GetFormValue('id');
var ids = core_v2_page.GetFormValue('ids');

if (id) {
	var response = context.DeleteConfiguredAutomation(core_v2_utility.ParseGuid(id));
} else if (ids) {
	var response = context.DeleteConfiguredAutomations(ids);
}

if (response.HasErrors()) {
	core_v2_page.SendJsonError(response.Errors);
} else {
	return { success: true };
}