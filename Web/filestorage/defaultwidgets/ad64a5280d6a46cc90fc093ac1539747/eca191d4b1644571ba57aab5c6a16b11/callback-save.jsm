if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	Id: core_v2_page.GetFormValue('id'),
	EnabledContentTypesToSave: core_v2_page.GetFormValue('enabledContentTypesToSave'),
	EnabledRolesToSave: core_v2_page.GetFormValue('enabledRolesToSave')
};

this.embeddable = context.SaveEmbeddableEnablement(options);

if (this.embeddable.HasErrors()) {
	core_v2_page.SendJsonError(this.embeddable.Errors);
} else {
	core_v2_page.SetContentType('application/json');
	return {
		success: true,
		isNew: false,
		embeddable: this.embeddable,
		renderedEmbeddable: core_v2_widget.ExecuteFile('render-item.vm')
	};
}
