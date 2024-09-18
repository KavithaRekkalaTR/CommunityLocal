core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

this.fragmentId = core_v2_page.GetFormValue('fragmentId');
this.themeId = core_v2_page.GetFormValue('themeId');

return {
	form: core_v2_widget.ExecuteFile('render-configuration.vm')
};
