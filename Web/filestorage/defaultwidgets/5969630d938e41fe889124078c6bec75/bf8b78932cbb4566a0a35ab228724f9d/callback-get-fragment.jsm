//
// Get Fragment Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
	ThemeId: core_v2_page.GetQueryStringValue('_w_themeId'),
	InstanceIdentifier: core_v2_page.GetQueryStringValue('_w_instanceIdentifier')
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
var fragment = context.GetFragment(options);


// output
if (fragment && fragment.HasErrors())
	core_v2_page.SendJsonError(fragment.Errors)

core_v2_page.SetContentType('application/json');

if (!fragment)
	return null;

return util.projectFragment(fragment, {
	summarize: false,
	includeFileDigests: includeFileDigests
});
