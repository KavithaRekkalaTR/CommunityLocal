//
// List Embeddables Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
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
var embeddables = context.ListEmbeddables(options);


// output
core_v2_page.SetContentType('application/json');

return {
	embeddables: (embeddables || []).map(function(embeddable) {
		return util.projectEmbeddable(embeddable, {
			summarize: true,
			includeFileDigests: includeFileDigests
		});
	})
 };
