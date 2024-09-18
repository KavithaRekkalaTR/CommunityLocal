//
// Revert Automation Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

core_v2_page.SetContentType('application/json')

if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	Id: core_v2_page.GetFormValue("_w_id"),
	Model: core_v2_page.GetFormValue("_w_model")
};

var response = context.RevertAutomation(options);

if (response.HasErrors())
	core_v2_page.SendJsonError(response.Errors);

// published automation
var automation = context.GetAutomation(options);

return {
	reverted: true,
	revertedAutomation: automation ? util.projectAutomation(automation) : null,
	stagedAutomations: util.loadAndProjectStagedItems()
};

