//
// Publish Multiple Fragments Callback Background Task
//
var util = core_v2_widget.ExecuteFile('util.jsm');

function cancel(message) {
	context.Refresh();
	throw message;
}

// parse requests
var fragmentIdentifiers = core_v2_widget.GetExecutionParameterValue('FragmentIds').split(',').map(function(f){
	var fragmentRequestComponents = f.split(':');
	var fragmentIdentifier = {};

	if (fragmentRequestComponents.length > 0) {
		fragmentIdentifier.InstanceIdentifier = fragmentRequestComponents[0];
		if (fragmentRequestComponents.length > 1) {
			fragmentIdentifier.ThemeId = fragmentRequestComponents[1];
		}
	}

	return fragmentIdentifier;
});

var revertedFragments = [];
var deletedFragments = [];

// publish requests
for (var i = 0; i < fragmentIdentifiers.length; i++) {
	if (context_v2_scheduledFile.IsCancellationRequested)
		cancel('Publish Cancelled');

	var fragmentIdentifier = fragmentIdentifiers[i];
	fragmentIdentifier.SuppressRefresh = true;

	var prePublishFragment = false;
	var prePublishFragment = context.GetFragment(fragmentIdentifier);

	if (prePublishFragment && prePublishFragment.HasErrors())
		cancel(prePublishFragment.Errors[0].Message);

	var publishResult = context.PublishFragment(fragmentIdentifier);
	if (publishResult && publishResult.HasErrors())
		cancel(publishResult.Errors[0].Message);

	// If the publish was of a reversion, then figure out what the result was to track
	if (prePublishFragment && prePublishFragment.IsReverted) {
		var postPublishFragment = false;
		var postPublishFragment = context.GetFragment(fragmentIdentifier);
		if (postPublishFragment && postPublishFragment.HasErrors())
			cancel(postPublishFragment.Errors[0].Message);

		// Items whose publication reverted them to the factory default
		if (postPublishFragment) {
			revertedFragments.push(postPublishFragment);
		// Items whose publication fully deleted them
		} else {
			deletedFragments.push(fragmentIdentifier);
		}
	}

	context_v2_scheduledFile.Report({ PercentComplete: i / fragmentIdentifiers.length });
}

context.Refresh();

return {
	complete: true,
	stagedFragments: util.loadAndProjectStagedItems(),
	revertedFragments: util.map(revertedFragments, function(a) {
		return util.projectFragment(a, { summarize: true });
	}),
	deletedFragments: deletedFragments
};
