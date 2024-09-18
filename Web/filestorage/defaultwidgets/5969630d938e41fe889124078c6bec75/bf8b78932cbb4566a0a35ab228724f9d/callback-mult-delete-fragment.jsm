//
// Delete/Revert to Default Multiple Fragments Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;

// Reverted staged changes
var revertedFragments = [];
var deletedFragments = [];

var fragmentIds = core_v2_page.GetFormValue('_w_fragmentIds');
var serializedFragmentRequests = core_v2_utility.split(',', fragmentIds);

// Delete Fragments
serializedFragmentRequests.forEach(function(serializedFragmentRequest) {

	var fragmentRequestComponents = serializedFragmentRequest.split(':');
	var options = {
		InstanceIdentifier: fragmentRequestComponents[0]
	};

	if (fragmentRequestComponents.length > 1 && fragmentRequestComponents[1].length > 0)
		options.ThemeId = fragmentRequestComponents[1];

	var result = context.DeleteFragment(options);

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors);

	// get post delete fragment.
	// a delete coud have staged a revision to default, staged a default
	// or just reverted staged changes
	// track the ones that are just staged changes
	var fragment = context.GetFragment(options);

	// Item in which this delete does not stage a change, but rather
	// Just undoes _staged_ changes to an item which cannot be
	// undone, like a FD
	if (fragment && !fragment.IsStaged) {
		revertedFragments.push(fragment);
	// Fully deleted (staged custom with no saved version, so not staging any reversion, just gone)
	// Items which are being fully deleted without staging
	} else if (!fragment) {
		deletedFragments.push(options);
	}

});

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	deleted: true,
	stagedFragments: util.loadAndProjectStagedItems(),
	revertedFragments: util.map(revertedFragments, function(a) {
		return util.projectFragment(a, { summarize: true });
	}),
	deletedFragments: util.map(deletedFragments, function(deletedFragment) {
		return {
			InstanceIdentifier: deletedFragment.InstanceIdentifier,
			ThemeId: deletedFragment.ThemeId || ''
		};
	})
};