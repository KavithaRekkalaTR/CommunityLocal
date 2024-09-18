core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	InstanceIdentifier: core_v2_page.GetFormValue('_w_id'),
	ThemeId: core_v2_page.GetFormValue('_w_themeId')
};

var result = context.DeleteFragment(options);
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

this.fragment = false;
this.fragment = context.GetFragment(options);
if (this.fragment && this.fragment.HasErrors())
	core_v2_page.SendJsonError(this.fragment.Errors);

var staged = context.ListFragments({ PageSize: 1, PageIndex: 0, IsStaged: true });
if (staged && staged.HasErrors())
	core_v2_page.SendJsonError(staged.Errors);

return {
	success: true,
	fragment: this.fragment,
	renderedFragment: core_v2_widget.ExecuteFile('render-item.vm'),
	stagedCount: staged ? staged.TotalCount : 0
};
