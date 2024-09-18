//
// Revert Multiple Fragments Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return { success: false };

var separatedFragmentIds = (core_v2_page.GetFormValue('_w_fragmentIds') || '').split(',');

for (var i = 0; i < separatedFragmentIds.length; i++) {

	var fragmentRequestComponents = separatedFragmentIds[i].split(':');
	var revertOptions = {
		InstanceIdentifier: fragmentRequestComponents[0]
	};

	if (fragmentRequestComponents.length > 1 && fragmentRequestComponents[1].length > 0)
		revertOptions.ThemeId = fragmentRequestComponents[1];

	var result = context.RevertFragment(revertOptions);

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors)
}

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	stagedFragments: util.loadAndProjectStagedItems()
};
