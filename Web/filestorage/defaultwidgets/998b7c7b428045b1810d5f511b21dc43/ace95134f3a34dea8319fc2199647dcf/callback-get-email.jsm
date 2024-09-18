//
// Get Email Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
	Id: core_v2_page.GetQueryStringValue('_w_id'),
};

var stagedQuery = core_v2_page.GetQueryStringValue('_w_staged');
if (stagedQuery)
	options.Staged = core_v2_utility.ParseBool(stagedQuery);

var factoryDefaultQuery = core_v2_page.GetQueryStringValue('_w_factoryDefault');
if (factoryDefaultQuery)
	options.FactoryDefault = core_v2_utility.ParseBool(factoryDefaultQuery);

var includeFileDigests = false;
var includeFileDigestsQuery = core_v2_page.GetQueryStringValue('_w_includeFileDigests');
if (includeFileDigestsQuery)
	includeFileDigests = core_v2_utility.ParseBool(includeFileDigestsQuery);


// process
var email = context.Get(options);


// output
if (email && email.HasErrors())
	core_v2_page.SendJsonError(email.Errors)

core_v2_page.SetContentType('application/json');

if (!email)
	return null;

return util.projectEmail(email, {
	summarize: false,
	includeFileDigests: includeFileDigests
});
