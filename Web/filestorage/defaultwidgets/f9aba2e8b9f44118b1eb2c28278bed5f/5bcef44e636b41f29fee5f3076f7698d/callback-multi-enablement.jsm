core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var ids = (core_v2_page.GetFormValue('ids') || '').split(',');
var enable = (core_v2_page.GetFormValue('enable') || '').toLowerCase() == 'true';
var savedAutomations = [];

for (var i = 0; i < ids.length; i++) {

	var result = context.SaveConfiguredAutomation({
		Id: ids[i],
		Enabled: enable
	});

	if (result.HasErrors()) {
		core_v2_page.SendJsonError(result.Errors);
		break;
	}

	this.configuredAutomation = result.Model;
	savedAutomations.push({
		id: ids[i],
		isNew: false,
		configuredAutomation: this.configuredAutomation,
		renderedConfiguredAutomation: core_v2_widget.ExecuteFile('render-item.vm')
	});
}

return {
	success: true,
	savedAutomations: savedAutomations
};
