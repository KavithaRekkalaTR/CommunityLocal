//
// List Configured Emails Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');


// input
var options = {};

var query = core_v2_page.GetQueryStringValue('_w_query');
if (query)
	options.Query = query;

var pageSizeQuery = core_v2_page.GetQueryStringValue('_w_pageSize');
if (pageSizeQuery)
	options.PageSize = core_v2_utility.ParseInt(pageSizeQuery);

var pageIndexQuery = core_v2_page.GetQueryStringValue('_w_pageIndex');
if (pageIndexQuery)
	options.PageIndex = core_v2_utility.ParseInt(pageIndexQuery);

var stagedQuery = core_v2_page.GetQueryStringValue('_w_staged');
if (stagedQuery)
	options.Staged = core_v2_utility.ParseBool(stagedQuery);

// process
var configuredEmails = context.ListConfigurations(options);

// output
core_v2_page.SetContentType('application/json');

return {
	configuredEmails: (configuredEmails || []).map(function(ce) {
		return util.projectEmail(ce.ScriptedEmail, { summarize: true, type: 'EmailConfiguration' });
	})
 };
