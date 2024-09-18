//
// Create Fragment Variant Callback
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

var variantThemeIdQuery = core_v2_page.GetFormValue('_w_variantThemeId');
if (variantThemeIdQuery)
	options.VariantThemeId = variantThemeIdQuery;


// process
var fragment = context.CreateFragmentVariant(options);


// output
if (fragment && fragment.HasErrors())
	core_v2_page.SendJsonError(fragment.Errors)

core_v2_page.SetContentType('application/json');

return {
	savedFragment: util.projectFragment(fragment),
	stagedFragments: util.loadAndProjectStagedItems()
};