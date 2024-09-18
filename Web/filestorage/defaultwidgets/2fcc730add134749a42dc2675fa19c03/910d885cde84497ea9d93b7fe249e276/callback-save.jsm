if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	InstanceIdentifier: core_v2_page.GetFormValue('instanceIdentifier'),
	AvailableThemeTypesToSave: core_v2_page.GetFormValue('availableThemeTypesToSave')
};

this.fragment = context.SaveFragmentAvailability(options);

if (this.fragment.HasErrors()) {
	core_v2_page.SendJsonError(this.fragment.Errors);
} else {
	core_v2_page.SetContentType('application/json');
	return {
		success: true,
		isNew: false,
		fragment: this.fragment,
		renderedFragment: core_v2_widget.ExecuteFile('render-item.vm')
	};
}
