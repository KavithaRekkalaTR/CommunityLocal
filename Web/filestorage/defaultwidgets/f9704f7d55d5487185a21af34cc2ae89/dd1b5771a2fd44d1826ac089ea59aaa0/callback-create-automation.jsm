//
// Create Automation Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var id = core_v2_page.GetFormValue('_w_id');
if (id)
	options.Id = id;

var hostId = core_v2_page.GetFormValue('_w_hostId');
if (hostId)
	options.HostId = hostId;

var factoryDefaultProviderId = core_v2_page.GetFormValue('_w_factoryDefaultProviderId');
if (factoryDefaultProviderId)
	options.FactoryDefaultProviderId = factoryDefaultProviderId;


// process
var createdAutomation = context.CreateAutomation(options);


// output
if (createdAutomation && createdAutomation.HasErrors())
	core_v2_page.SendJsonError(createdAutomation.Errors);

var automation = createdAutomation.Model;

core_v2_page.SetContentType('application/json');

return util.projectAutomation(automation);
