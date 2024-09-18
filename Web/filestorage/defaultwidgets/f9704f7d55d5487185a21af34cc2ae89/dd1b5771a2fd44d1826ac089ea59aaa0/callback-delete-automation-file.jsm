//
// Delete Automation File Callback
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
var result = context.DeleteAutomationFile(options);
var automation = context.GetAutomation(options);


// output
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

if (automation && automation.HasErrors())
	core_v2_page.SendJsonError(automation.Errors)

core_v2_page.SetContentType('application/json');

return {
	automation: util.projectAutomation(automation),
	stagedAutomations: util.loadAndProjectStagedItems()
};
