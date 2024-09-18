//
// Revert Theme Options Callback
//
core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var result = context.RevertThemeOptions({
	Id: core_v2_page.GetFormValue('_w_id'),
	TypeId: core_v2_page.GetFormValue('_w_typeId'),
	Stage: core_v2_page.GetFormValue('_w_stage'),
	RevertPagesTo: core_v2_page.GetFormValue('_w_revertPagesTo'),
	RevertCustomPages: core_v2_page.GetFormValue('_w_revertCustomPages'),
	RevertHeadersTo: core_v2_page.GetFormValue('_w_revertHeadersTo'),
	RevertFootersTo: core_v2_page.GetFormValue('_w_revertFootersTo'),
	RevertThemeConfigurations: core_v2_page.GetFormValue('_w_revertThemeConfigurations'),
	RevertScopedProperties: core_v2_page.GetFormValue('_w_revertScopedProperties')
});

if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

return 	{
	success: true,
	warnings: result.Warnings.map(function(warning) {
		return warning.Message;
	})
};