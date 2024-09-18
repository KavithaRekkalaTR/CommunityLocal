core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	Id: core_v2_page.GetFormValue('_w_id'),
	TypeId: core_v2_page.GetFormValue('_w_typeId'),
	RevertStagedPages: core_v2_page.GetFormValue('_w_revertStagedPages'),
	RevertStagedHeaders: core_v2_page.GetFormValue('_w_revertStagedHeaders'),
	RevertStagedFooters: core_v2_page.GetFormValue('_w_revertStagedFooters'),
	RevertStagedFragments: core_v2_page.GetFormValue('_w_revertStagedFragments')
};

var revertibleChildren = context.DeleteTheme(options);
if (revertibleChildren && revertibleChildren.HasErrors())
	core_v2_page.SendJsonError(revertibleChildren.Errors);

this.theme = false;
this.theme = context.GetTheme(options);
if (this.theme && this.theme.HasErrors())
	core_v2_page.SendJsonError(this.theme.Errors);

var staged = context.ListThemes({ PageSize: 1, PageIndex: 0, Staged: true });
if (staged && staged.HasErrors())
	core_v2_page.SendJsonError(staged.Errors);

var result = {
	theme: this.theme,
	renderedTheme: core_v2_widget.ExecuteFile('render-item.vm'),
	stagedCount: staged ? staged.TotalCount : 0
};

if (revertibleChildren) {
	result.success = false;
	result.revertibleChildren = revertibleChildren;
} else {
	result.success = true;
}

return result;
