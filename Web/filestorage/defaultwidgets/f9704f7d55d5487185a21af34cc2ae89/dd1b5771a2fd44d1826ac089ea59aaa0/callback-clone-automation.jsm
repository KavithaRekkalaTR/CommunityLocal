//
// Clone Automation Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	Id: core_v2_page.GetFormValue('_w_id')
};

var newId = core_v2_page.GetFormValue('_w_newId');
if (newId)
	options.NewId = newId;

var hostId = core_v2_page.GetFormValue('_w_hostId');
if (hostId)
	options.HostId = hostId;

var factoryDefaultProviderId = core_v2_page.GetQueryStringValue('_w_factoryDefaultProviderId');
if (factoryDefaultProviderId)
	options.FactoryDefaultProviderId = core_v2_utility.ParseBool(factoryDefaultProviderId);


// process
var automation = context.CloneAutomation(options);


// output
if (automation && automation.HasErrors())
	core_v2_page.SendJsonError(automation.Errors)

core_v2_page.SetContentType('application/json');

return {
	clonedAutomation: util.projectAutomation(automation),
	stagedAutomations: util.loadAndProjectStagedItems()
};