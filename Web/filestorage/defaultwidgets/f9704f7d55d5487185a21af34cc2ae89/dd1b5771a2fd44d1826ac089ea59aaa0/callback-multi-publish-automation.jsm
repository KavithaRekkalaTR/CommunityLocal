//
// Publish Multiple Automations Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');
var MAX_SYNCHRONOUS_STEPS = 5;

core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

// parse requests
var automationRequests = core_v2_page.GetFormValue('_w_automationIds').split(',').map(function(f){
	var automationRequestComponents = f.split('|');
	var automationRequest = {};

	if (automationRequestComponents.length > 1) {
		automationRequest.Id = automationRequestComponents[0];
		automationRequest.Model = automationRequestComponents[1];
	}

	return automationRequest;
});

// if a lot of publishes, perform it in a durable background task with feedback
if (automationRequests.length > MAX_SYNCHRONOUS_STEPS) {

	var scheduledFileProgressKey = 'schedule-automations:' + core_v2_user.Accessing.Id;

	core_v2_widget.ScheduleFile('callback-multi-publish-automation-task.jsm', {
		ProgressKey: scheduledFileProgressKey,
		Durable: true,
		Parameters: {
			AutomationIds: core_v2_page.GetFormValue('_w_automationIds')
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

	var revertedAutomations = [];
	var deletedAutomations = [];
	var revertedConfigurations = [];
	var deletedConfigurations = [];

	// publish requests
	for (var i = 0; i < automationRequests.length; i++) {
		var automationRequest = automationRequests[i];

		if (automationRequest.Model == 'configuration') {
			var prePublishConfiguration = false;
			var prePublishConfiguration = context.GetConfiguration(core_v2_utility.ParseGuid(automationRequest.Id));

			if (prePublishConfiguration && prePublishConfiguration.HasErrors())
				core_v2_page.SendJsonError(prePublishConfiguration.Errors);

			var publishResult = context.PublishAutomation(automationRequest);
			if (publishResult && publishResult.HasErrors())
				core_v2_page.SendJsonError(publishResult.Errors);

			// If the publish was of a reversion, then figure out what the result was to track
			if (prePublishConfiguration.IsReverted) {
				var postPublishConfiguration = false;
				var postPublishConfiguration = context.GetConfiguration(core_v2_utility.ParseGuid(automationRequest.Id));
				if (postPublishConfiguration && postPublishConfiguration.HasErrors())
					core_v2_page.SendJsonError(postPublishConfiguration.Errors);

				// Items whose publication reverted them to the factory default
				if (postPublishConfiguration) {
					revertedConfigurations.push(postPublishConfiguration);
				// Items whose publication fully deleted them
				} else {
					deletedConfigurations.push(automationRequest);
				}
			}
		} else {
			var prePublishAutomation = false;
			var prePublishAutomation = context.GetAutomation(automationRequest);

			if (prePublishAutomation && prePublishAutomation.HasErrors())
				core_v2_page.SendJsonError(prePublishAutomation.Errors);

			var publishResult = context.PublishAutomation(automationRequest);
			if (publishResult && publishResult.HasErrors())
				core_v2_page.SendJsonError(publishResult.Errors);

			// If the publish was of a reversion, then figure out what the result was to track
			if (prePublishAutomation && prePublishAutomation.IsReverted) {
				var postPublishAutomation = false;
				var postPublishAutomation = context.GetAutomation(automationRequest);
				if (postPublishAutomation && postPublishAutomation.HasErrors())
					core_v2_page.SendJsonError(postPublishAutomation.Errors);

				// Items whose publication reverted them to the factory default
				if (postPublishAutomation) {
					revertedAutomations.push(postPublishAutomation);
				// Items whose publication fully deleted them
				} else {
					deletedAutomations.push(automationRequest);
				}
			}
		}
	}

	return {
		complete: true,
		stagedAutomations: util.loadAndProjectStagedItems({ excludeConfiguredAutomations: true }),
		revertedAutomations: util.map(revertedAutomations, function(a) {
			return util.projectAutomation(a, { summarize: true });
		}),
		deletedAutomations: deletedAutomations
	}

}