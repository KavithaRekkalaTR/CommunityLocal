//
// List Automations Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
	SpecifyHost: core_v2_page.GetQueryStringValue('_w_specifyHost'),
	HostId: core_v2_page.GetQueryStringValue('_w_hostId'),
	FactoryDefaultProviderId: core_v2_page.GetQueryStringValue('_w_factoryDefaultProviderId'),
	State: core_v2_page.GetQueryStringValue('_w_state')
};

var stagedQuery = core_v2_page.GetQueryStringValue('_w_staged');
if (stagedQuery)
	options.Staged = core_v2_utility.ParseBool(stagedQuery);

var includeFileDigests = false;
var includeFileDigestsQuery = core_v2_page.GetQueryStringValue('_w_includeFileDigests');
if (includeFileDigestsQuery)
	includeFileDigests = core_v2_utility.ParseBool(includeFileDigestsQuery);


// process
var automations = context.ListAutomations(options);


// output
core_v2_page.SetContentType('application/json');

return {
	automations: (automations || []).map(function(automation) {
		return util.projectAutomation(automation, {
			summarize: true,
			includeFileDigests: includeFileDigests
		});
	})
 };
