//
// Delete Fragment Attachment Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	InstanceIdentifier: core_v2_page.GetFormValue('_w_instanceIdentifier'),
	Name: core_v2_page.GetFormValue('_w_name')
};

var themeIdQuery = core_v2_page.GetFormValue('_w_themeId');
if (themeIdQuery)
	options.ThemeId = themeIdQuery;

// process
var result = context.DeleteFragmentAttachment(options);
var fragment = context.GetFragment(options);


// output
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

if (fragment && fragment.HasErrors())
	core_v2_page.SendJsonError(fragment.Errors)

core_v2_page.SetContentType('application/json');

return {
	fragment: util.projectFragment(fragment),
	stagedFragments: util.loadAndProjectStagedItems()
};
