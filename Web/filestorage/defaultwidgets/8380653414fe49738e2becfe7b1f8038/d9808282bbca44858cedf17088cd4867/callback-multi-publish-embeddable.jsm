//
// Publish Multiple Embeddables Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');
var MAX_SYNCHRONOUS_STEPS = 5;

core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

// parse requests
var embeddableRequests = core_v2_page.GetFormValue('_w_embeddableIds').split(',').map(function(f){
	var embeddableRequestComponents = f.split('|');
	var embeddableRequest = {};

	if (embeddableRequestComponents.length > 0) {
		embeddableRequest.Id = embeddableRequestComponents[0];
	}

	return embeddableRequest;
});

// if a lot of publishes, perform it in a durable background task with feedback
if (embeddableRequests.length > MAX_SYNCHRONOUS_STEPS) {

	var scheduledFileProgressKey = 'schedule-embeddables:' + core_v2_user.Accessing.Id;

	core_v2_widget.ScheduleFile('callback-multi-publish-embeddable-task.jsm', {
		ProgressKey: scheduledFileProgressKey,
		Durable: true,
		Parameters: {
			EmbeddableIds: core_v2_page.GetFormValue('_w_embeddableIds')
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

	var revertedEmbeddables = [];
	var deletedEmbeddables = [];

	// publish requests
	for (var i = 0; i < embeddableRequests.length; i++) {
		var embeddableRequest = embeddableRequests[i];

		var prePublishEmbeddable = false;
		var prePublishEmbeddable = context.GetEmbeddable(embeddableRequest);

		if (prePublishEmbeddable && prePublishEmbeddable.HasErrors())
			core_v2_page.SendJsonError(prePublishEmbeddable.Errors);

		var publishResult = context.PublishEmbeddable(embeddableRequest);
		if (publishResult && publishResult.HasErrors())
			core_v2_page.SendJsonError(publishResult.Errors);

		// If the publish was of a reversion, then figure out what the result was to track
		if (prePublishEmbeddable && prePublishEmbeddable.IsReverted) {
			var postPublishEmbeddable = false;
			var postPublishEmbeddable = context.GetEmbeddable(embeddableRequest);
			if (postPublishEmbeddable && postPublishEmbeddable.HasErrors())
				core_v2_page.SendJsonError(postPublishEmbeddable.Errors);

			// Items whose publication reverted them to the factory default
			if (postPublishEmbeddable) {
				revertedEmbeddables.push(postPublishEmbeddable);
			// Items whose publication fully deleted them
			} else {
				deletedEmbeddables.push(embeddableRequest);
			}
		}
	}

	return {
		complete: true,
		stagedEmbeddables: util.loadAndProjectStagedItems(),
		revertedEmbeddables: util.map(revertedEmbeddables, function(a) {
			return util.projectEmbeddable(a, { summarize: true });
		}),
		deletedEmbeddables: deletedEmbeddables
	}

}