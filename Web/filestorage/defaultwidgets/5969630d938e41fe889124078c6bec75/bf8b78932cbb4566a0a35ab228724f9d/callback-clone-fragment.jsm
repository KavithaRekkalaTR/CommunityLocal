//
// Clone Fragment Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	InstanceIdentifier: core_v2_page.GetFormValue('_w_instanceIdentifier')
};

var themeIdQuery = core_v2_page.GetFormValue('_w_themeId');
if (themeIdQuery)
	options.ThemeId = themeIdQuery;

var newInstanceIdentifierQuery = core_v2_page.GetFormValue('_w_newInstanceIdentifier');
if (newInstanceIdentifierQuery)
	options.NewInstanceIdentifier = newInstanceIdentifierQuery;

var newFactoryDefaultProviderQuery = core_v2_page.GetFormValue('_w_newFactoryDefaultProvider');
if (newFactoryDefaultProviderQuery)
	options.NewFactoryDefaultProviderIdentifier = newFactoryDefaultProviderQuery;


// process
var fragment = context.CloneFragment(options);


// output
if (fragment && fragment.HasErrors())
	core_v2_page.SendJsonError(fragment.Errors)

core_v2_page.SetContentType('application/json');

return {
	clonedFragment: util.projectFragment(fragment),
	stagedFragments: util.loadAndProjectStagedItems()
};