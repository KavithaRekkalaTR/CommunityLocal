//
// Revert Multiple Automations Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return { success: false };

var separatedAutomationIds = (core_v2_page.GetFormValue('_w_automationIds') || '').split(',');

for (var i = 0; i < separatedAutomationIds.length; i++) {
	var automationIdComponents = separatedAutomationIds[i].split('|');
	var revertOptions = {
		Id: automationIdComponents[0]
	};

	if (automationIdComponents.length > 1) {
		revertOptions.Model = automationIdComponents[1];
	}

	var result = context.RevertAutomation(revertOptions);

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors)
}

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	stagedAutomations: util.loadAndProjectStagedItems()
};
