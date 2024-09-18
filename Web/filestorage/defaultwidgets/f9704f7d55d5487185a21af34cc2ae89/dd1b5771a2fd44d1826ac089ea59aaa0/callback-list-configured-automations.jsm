//
// List Configured Automations Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');


// input
var options = {};

var query = core_v2_page.GetQueryStringValue('_w_query');
if (query)
	options.Query = query;

var enabledQuery = core_v2_page.GetQueryStringValue('_w_enabled');
if (enabledQuery)
	options.Enabled = core_v2_utility.ParseBool(enabledQuery);

var pageSizeQuery = core_v2_page.GetQueryStringValue('_w_pageSize');
if (pageSizeQuery)
	options.PageSize = core_v2_utility.ParseInt(pageSizeQuery);

var pageIndexQuery = core_v2_page.GetQueryStringValue('_w_pageIndex');
if (pageIndexQuery)
	options.PageIndex = core_v2_utility.ParseInt(pageIndexQuery);

var automationIdQuery = core_v2_page.GetQueryStringValue('_w_automationId');
if (automationIdQuery)
	options.AutomationId = core_v2_utility.ParseGuid(automationIdQuery);

var stagedQuery = core_v2_page.GetQueryStringValue('_w_staged');
if (stagedQuery)
	options.Staged = core_v2_utility.ParseBool(stagedQuery);


// process
var configuredAutomations = context.ListConfiguredAutomations(options);


// output
core_v2_page.SetContentType('application/json');

return {
	configuredAutomations: (configuredAutomations || []).map(function(ca) {
		return util.projectConfiguredAutomation(ca);
	})
 };
