//
// Create Automation File Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var id = core_v2_page.GetFormValue('_w_id');
if (id)
	options.Id = id;


// process
var automationFile = context.CreateAutomationFile(options);
var automation = context.GetAutomation(options);


// output
if (automationFile && automationFile.HasErrors())
	core_v2_page.SendJsonError(automationFile.Errors)

if (automation && automation.HasErrors())
	core_v2_page.SendJsonError(automation.Errors)

core_v2_page.SetContentType('application/json');

return util.projectAutomationFile(automationFile, {
	automation: automation
});
