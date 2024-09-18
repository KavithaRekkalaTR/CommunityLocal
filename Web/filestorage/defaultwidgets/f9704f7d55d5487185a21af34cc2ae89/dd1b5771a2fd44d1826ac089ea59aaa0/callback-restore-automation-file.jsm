//
// Restore Automation File Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	Id: core_v2_page.GetFormValue('_w_id'),
	Name: core_v2_page.GetFormValue('_w_name')
};


// process
var saveResult = context.RestoreAutomationFile(options);
var automation = context.GetAutomation(options);


// output
if (saveResult && saveResult.HasErrors())
	core_v2_page.SendJsonError(saveResult.Errors);

if (automation && automation.HasErrors())
	core_v2_page.SendJsonError(automation.Errors);

var automationFile = saveResult.Model;

core_v2_page.SetContentType('application/json');

return {
	savedAutomationFile: util.projectAutomationFile(automationFile, { automation: automation }),
	stagedAutomations: util.loadAndProjectStagedItems(),
	automation: util.projectAutomation(automation),
	isNew: true
};
