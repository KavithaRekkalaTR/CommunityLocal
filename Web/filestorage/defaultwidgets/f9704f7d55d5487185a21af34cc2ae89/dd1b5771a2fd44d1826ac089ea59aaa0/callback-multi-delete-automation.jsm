//
// Delete/Revert to Default Multiple Automations Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;

// Reverted staged changes
var revertedAutomations = [];
var deletedAutomations = [];

var automationIds = core_v2_page.GetFormValue('_w_automationIds');
var serializedAutomationRequests = core_v2_utility.split(',', automationIds);

// Delete Automations
serializedAutomationRequests.forEach(function(automationId) {

	var options = {
		Id: automationId
	};

	var result = context.DeleteAutomation(options);

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors);

	// get post delete automation.
	// a delete coud have staged a revision to default, staged a default
	// or just reverted staged changes
	// track the ones that are just staged changes
	var automation = context.GetAutomation(options);

	// Item in which this delete does not stage a change, but rather
	// Just undoes _staged_ changes to an item which cannot be
	// undone, like a FD
	if (automation && !automation.IsStaged) {
		revertedAutomations.push(automation);
	// Fully deleted (staged custom with no saved version, so not staging any reversion, just gone)
	// Items which are being fully deleted without staging
	} else if (!automation) {
		deletedAutomations.push(options);
	}

});

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	deleted: true,
	stagedAutomations: util.loadAndProjectStagedItems(),
	revertedAutomations: util.map(revertedAutomations, function(a) {
		return util.projectAutomation(a, { summarize: true });
	}),
	deletedAutomations: util.map(deletedAutomations, function(deletedAutomation) {
		return { Id: deletedAutomation.Id };
	})
};