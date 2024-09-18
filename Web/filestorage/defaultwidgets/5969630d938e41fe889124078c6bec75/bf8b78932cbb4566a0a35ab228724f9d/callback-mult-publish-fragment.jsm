//
// Publish Multiple Fragments Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');
var MAX_SYNCHRONOUS_STEPS = 5;

core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

// parse requests
var fragmentIdentifiers = core_v2_page.GetFormValue('_w_fragmentIds').split(',').map(function(f){
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

// if a lot of publishes, perform it in a durable background task with feedback
if (fragmentIdentifiers.length > MAX_SYNCHRONOUS_STEPS) {

	var scheduledFileProgressKey = 'schedule-widgets:' + core_v2_user.Accessing.Id;

	core_v2_widget.ScheduleFile('callback-mult-publish-fragment-task.jsm', {
		ProgressKey: scheduledFileProgressKey,
		Durable: true,
		Parameters: {
			FragmentIds: core_v2_page.GetFormValue('_w_fragmentIds')
		}
	});

	var progressIndicator = core_v2_ui.ScheduledFile(scheduledFileProgressKey, {
		IncludeProgress: true,
		IncludeAllMessages: false,
		IncludeLatestMessage: false
	});

	return {
		complete: false,
		progressKey: scheduledFileProgressKey,
		progressIndicator: progressIndicator
	};

// otherwise, publish synchronously
} else {

	var revertedFragments = [];
	var deletedFragments = [];

	// publish requests
	for (var i = 0; i < fragmentIdentifiers.length; i++) {
		var fragmentIdentifier = fragmentIdentifiers[i];

		var prePublishFragment = false;
		var prePublishFragment = context.GetFragment(fragmentIdentifier);

		if (prePublishFragment && prePublishFragment.HasErrors())
			core_v2_page.SendJsonError(prePublishFragment.Errors);

		var publishResult = context.PublishFragment(fragmentIdentifier);
		if (publishResult && publishResult.HasErrors())
			core_v2_page.SendJsonError(publishResult.Errors);

		// If the publish was of a reversion, then figure out what the result was to track
		if (prePublishFragment && prePublishFragment.IsReverted) {
			var postPublishFragment = false;
			var postPublishFragment = context.GetFragment(fragmentIdentifier);
			if (postPublishFragment && postPublishFragment.HasErrors())
				core_v2_page.SendJsonError(postPublishFragment.Errors);

			// Items whose publication reverted them to the factory default
			if (postPublishFragment) {
				revertedFragments.push(postPublishFragment);
			// Items whose publication fully deleted them
			} else {
				deletedFragments.push(fragmentIdentifier);
			}
		}
	}

	return {
		complete: true,
		stagedFragments: util.loadAndProjectStagedItems(),
		revertedFragments: util.map(revertedFragments, function(a) {
			return util.projectFragment(a, { summarize: true });
		}),
		deletedFragments: deletedFragments
	}

}
