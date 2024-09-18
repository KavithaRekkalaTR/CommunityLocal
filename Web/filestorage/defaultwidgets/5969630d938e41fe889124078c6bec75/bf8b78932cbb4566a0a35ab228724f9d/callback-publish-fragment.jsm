//
// Publish Fragment Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

core_v2_page.SetContentType('application/json')

if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	InstanceIdentifier: core_v2_page.GetFormValue("_w_instanceIdentifier")
};

var themeIdQuery = core_v2_page.GetFormValue('_w_themeId');
if (themeIdQuery)
	options.ThemeId = themeIdQuery;

var response = context.PublishFragment(options);

if (response.HasErrors())
	core_v2_page.SendJsonError(response.Errors);

// published fragment
var fragment = context.GetFragment(options);

return {
	publishedFragment: fragment ? util.projectFragment(fragment) : null,
	stagedFragments: util.loadAndProjectStagedItems()
};

