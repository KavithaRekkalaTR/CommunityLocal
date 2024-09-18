core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { success: false };

this.configuredAutomationId = core_v2_page.GetFormValue('configuredAutomationId');
this.automationId = core_v2_page.GetFormValue('automationId');
this.automationConfigurationData = core_v2_page.GetFormValue('automationConfiguration');

return {
	form: core_v2_widget.ExecuteFile('render-configuration.vm')
};
