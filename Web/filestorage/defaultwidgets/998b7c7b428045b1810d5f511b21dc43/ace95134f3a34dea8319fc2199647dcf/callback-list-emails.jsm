//
// List Emails Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
	State: core_v2_page.GetQueryStringValue('_w_state')
};

var stagedQuery = core_v2_page.GetQueryStringValue('_w_staged');
if (stagedQuery)
	options.Staged = core_v2_utility.ParseBool(stagedQuery);

var includeTemplateQuery = core_v2_page.GetQueryStringValue('_w_includeTemplate');
if (includeTemplateQuery)
	options.IncludeTemplate = core_v2_utility.ParseBool(includeTemplateQuery);

var includeEmailsQuery = core_v2_page.GetQueryStringValue('_w_includeEmails');
if (includeEmailsQuery)
	options.IncludeEmails = core_v2_utility.ParseBool(includeEmailsQuery);

var includeFileDigests = false;
var includeFileDigestsQuery = core_v2_page.GetQueryStringValue('_w_includeFileDigests');
if (includeFileDigestsQuery)
	includeFileDigests = core_v2_utility.ParseBool(includeFileDigestsQuery);

// process
var emails = context.List(options);


// output
core_v2_page.SetContentType('application/json');

return {
	emails: (emails || []).map(function(email) {
		return util.projectEmail(email, {
			summarize: true,
			includeFileDigests: includeFileDigests
		});
	})
 };
