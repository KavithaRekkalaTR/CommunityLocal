core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var result = context.PreviewTheme({
	Id: core_v2_page.GetFormValue('_w_id'),
	TypeId: core_v2_page.GetFormValue('_w_typeId'),
	ApplicationId: core_v2_page.GetFormValue('_w_applicationId')
});

if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

return {
	success: true,
	url: result.Url
};