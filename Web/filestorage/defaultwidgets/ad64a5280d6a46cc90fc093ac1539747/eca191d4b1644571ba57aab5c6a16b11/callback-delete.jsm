core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	Id: core_v2_page.GetFormValue('_w_id')
};

var result = context.DeleteEmbeddable(options);
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

this.embeddable = false;
this.embeddable = context.GetEmbeddable(options);
if (this.embeddable && this.embeddable.HasErrors())
	core_v2_page.SendJsonError(this.embeddable.Errors);

var staged = context.ListEmbeddables({ PageSize: 1, PageIndex: 0, Staged: true });
if (staged && staged.HasErrors())
	core_v2_page.SendJsonError(staged.Errors);

return {
	success: true,
	embeddable: this.embeddable,
	renderedEmbeddable: core_v2_widget.ExecuteFile('render-item.vm'),
	stagedCount: staged ? staged.TotalCount : 0
};
