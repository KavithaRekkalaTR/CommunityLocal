//
// Delete Fragment Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var themeIdQuery = core_v2_page.GetFormValue('_w_themeId');
if (themeIdQuery)
	options.ThemeId = themeIdQuery;

var instanceIdentifierQuery = core_v2_page.GetFormValue('_w_instanceIdentifier');
if (instanceIdentifierQuery)
	options.InstanceIdentifier = instanceIdentifierQuery;


// process
var result = context.DeleteFragment(options);

// get fragment. It may be null if it was a delete
// of a custom fragment, or may be a factory default if the
// delete was effectively a revert to default
var fragment = context.GetFragment(options);


// output
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

if (fragment && fragment.HasErrors())
	core_v2_page.SendJsonError(fragment.Errors)

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	deleted: true,
	fragment: fragment ? util.projectFragment(fragment) : null,
	stagedFragments: util.loadAndProjectStagedItems()
};
