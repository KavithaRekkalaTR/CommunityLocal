//
// Get Automation File Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
	Id: core_v2_page.GetQueryStringValue('_w_id'),
	Name: core_v2_page.GetQueryStringValue('_w_name')
};

var stagedQuery = core_v2_page.GetQueryStringValue('_w_staged');
if (stagedQuery)
	options.Staged = core_v2_utility.ParseBool(stagedQuery);

var factoryDefaultQuery = core_v2_page.GetQueryStringValue('_w_factoryDefault');
if (factoryDefaultQuery)
	options.FactoryDefault = core_v2_utility.ParseBool(factoryDefaultQuery);


// process
var automationFile = context.GetAutomationFile(options);
var automation = context.GetAutomation(options);


// output
if (automationFile && automationFile.HasErrors())
	core_v2_page.SendJsonError(automationFile.Errors);

if (automation && automation.HasErrors())
	core_v2_page.SendJsonError(automation.Errors);

core_v2_page.SetContentType('application/json');

return util.projectAutomationFile(automationFile, {
	automation: automation
});
