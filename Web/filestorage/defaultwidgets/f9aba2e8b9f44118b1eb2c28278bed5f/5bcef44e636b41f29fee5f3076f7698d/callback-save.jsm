core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	Id: core_v2_page.GetFormValue('id'),
	Name: core_v2_page.GetFormValue('name'),
	Description: core_v2_page.GetFormValue('description'),
	Enabled: core_v2_page.GetFormValue('enabled'),
	AutomationId: core_v2_page.GetFormValue('automationId'),
	AutomationConfiguration: core_v2_page.GetFormValue('automationConfiguration')
};

this.configuredAutomationResult = context.SaveConfiguredAutomation(options);

if (this.configuredAutomationResult.HasErrors())
	core_v2_page.SendJsonError(this.configuredAutomationResult.Errors);

this.configuredAutomation = this.configuredAutomationResult.Model;

return {
	success: true,
	isNew: !options.Id,
	configuredAutomation: this.configuredAutomation,
	renderedConfiguredAutomation: core_v2_widget.ExecuteFile('render-item.vm')
};
