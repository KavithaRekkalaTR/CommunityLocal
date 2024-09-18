core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	Id: core_v2_page.GetFormValue('_w_id'),
	TypeId: core_v2_page.GetFormValue('_w_typeId')
};

var result = context.PublishTheme(options);
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

this.theme = context.GetTheme(options);
if (this.theme && this.theme.HasErrors())
	core_v2_page.SendJsonError(this.theme.Errors);

var staged = context.ListThemes({ PageSize: 1, PageIndex: 0, Staged: true });
if (staged && staged.HasErrors())
	core_v2_page.SendJsonError(staged.Errors);

return {
	success: true,
	theme: this.theme,
	renderedTheme: core_v2_widget.ExecuteFile('render-item.vm'),
	stagedCount: staged ? staged.TotalCount : 0
};
