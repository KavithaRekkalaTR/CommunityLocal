if (!core_v2_page.IsPost)
	return { success: false };

var id = core_v2_utility.ParseInt(core_v2_page.GetFormValue('id'));
var result = core_v2_systemNotification.Update(id, { IsResolved: true });

if (result.HasErrors()) {
	core_v2_page.SendJsonError(result.Errors);
} else {
	core_v2_page.SetContentType('application/json');
	return { success: true };
}
