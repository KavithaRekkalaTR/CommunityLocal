core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var themeId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('_w_id'));
var themeTypeId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('_w_typeId'));

var result = context.SetDefaultTheme(themeTypeId, themeId);
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

return {
	themeType: result
};
