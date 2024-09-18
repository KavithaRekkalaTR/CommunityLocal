//
// Delete Automation Callback
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
var result = context.DeleteAutomation(options);

// get automation. It may be null if it was a delete
// of a custom automation, or may be a factory default if the
// delete was effectively a revert to default
var automation = context.GetAutomation(options);


// output
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

if (automation && automation.HasErrors())
	core_v2_page.SendJsonError(automation.Errors)

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	deleted: true,
	automation: automation ? util.projectAutomation(automation) : null,
	stagedAutomations: util.loadAndProjectStagedItems()
};
