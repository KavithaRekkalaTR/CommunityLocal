//
// List Fragments Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
	ThemeId: core_v2_page.GetQueryStringValue('_w_themeId'),
	FactoryDefaultProvider: core_v2_page.GetQueryStringValue('_w_factoryDefaultProvider'),
	State: core_v2_page.GetQueryStringValue('_w_state'),
	Query: core_v2_page.GetQueryStringValue('_w_query')
};

var stagedQuery = core_v2_page.GetQueryStringValue('_w_isStaged');
if (stagedQuery)
	options.IsStaged = core_v2_utility.ParseBool(stagedQuery);

var scriptableQuery = core_v2_page.GetQueryStringValue('_w_scriptable');
if (scriptableQuery)
	options.Scriptable = core_v2_utility.ParseBool(scriptableQuery);

var includeFileDigests = false;
var includeFileDigestsQuery = core_v2_page.GetQueryStringValue('_w_includeFileDigests');
if (includeFileDigestsQuery)
	includeFileDigests = core_v2_utility.ParseBool(includeFileDigestsQuery);

// process
var fragments = context.ListFragments(options);
if (fragments && fragments.HasErrors())
	core_v2_page.SendJsonError(fragments.Errors);

// output
core_v2_page.SetContentType('application/json');

return {
	fragments: (fragments || []).map(function(fragment) {
		return util.projectFragment(fragment, {
			summarize: true,
			includeFileDigests: includeFileDigests
		});
	})
 };
