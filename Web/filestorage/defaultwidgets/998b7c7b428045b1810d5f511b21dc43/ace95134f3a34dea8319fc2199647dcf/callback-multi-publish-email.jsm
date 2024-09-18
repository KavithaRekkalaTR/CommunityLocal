//
// Publish Multiple Emails Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');
var MAX_SYNCHRONOUS_STEPS = 5;

core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

// parse requests
var emailRequests = core_v2_page.GetFormValue('_w_emailIds').split(',').map(function(f){
	var emailRequestComponents = f.split('|');
	var emailRequest = {};

	if (emailRequestComponents.length > 1) {
		emailRequest.Id = emailRequestComponents[0];
		emailRequest.Model = emailRequestComponents[1];
	}

	return emailRequest;
});

// if a lot of publishes, perform it in a durable background task with feedback
if (emailRequests.length > MAX_SYNCHRONOUS_STEPS) {

	var scheduledFileProgressKey = 'schedule-emails:' + core_v2_user.Accessing.Id;

	core_v2_widget.ScheduleFile('callback-multi-publish-email-task.jsm', {
		ProgressKey: scheduledFileProgressKey,
		Durable: true,
		Parameters: {
			EmailIds: core_v2_page.GetFormValue('_w_emailIds')
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

	var revertedEmails = [];
	var revertedConfigurations = [];

	// publish requests
	for (var i = 0; i < emailRequests.length; i++) {
		var emailRequest = emailRequests[i];

		if (emailRequest.Model == 'configuration') {
			var prePublishConfiguration = false;
			var prePublishConfiguration = context.GetConfiguration(core_v2_utility.ParseGuid(emailRequest.Id));

			if (prePublishConfiguration && prePublishConfiguration.HasErrors())
				core_v2_page.SendJsonError(prePublishConfiguration.Errors);

			var publishResult = context.Publish(emailRequest);
			if (publishResult && publishResult.HasErrors())
				core_v2_page.SendJsonError(publishResult.Errors);

			// If the publish was of a reversion, then figure out what the result was to track
			if (prePublishConfiguration.IsReverted) {
				var postPublishConfiguration = false;
				var postPublishConfiguration = context.GetConfiguration(core_v2_utility.ParseGuid(emailRequest.Id));
				if (postPublishConfiguration && postPublishConfiguration.HasErrors())
					core_v2_page.SendJsonError(postPublishConfiguration.Errors);

				// Items whose publication reverted them to the factory default
				if (postPublishConfiguration) {
					revertedConfigurations.push(postPublishConfiguration);
				// Items whose publication fully deleted them
				} else {
					deletedConfigurations.push(emailRequest);
				}
			}
		} else {
			var prePublishEmail = false;
			var prePublishEmail = context.Get(emailRequest);

			if (prePublishEmail && prePublishEmail.HasErrors())
				core_v2_page.SendJsonError(prePublishEmail.Errors);

			var publishResult = context.Publish(emailRequest);
			if (publishResult && publishResult.HasErrors())
				core_v2_page.SendJsonError(publishResult.Errors);

			// If the publish was of a reversion, then figure out what the result was to track
			if (prePublishEmail && prePublishEmail.IsReverted) {
				var postPublishEmail = false;
				var postPublishEmail = context.Get(emailRequest);
				if (postPublishEmail && postPublishEmail.HasErrors())
					core_v2_page.SendJsonError(postPublishEmail.Errors);

				// Items whose publication reverted them to the factory default
				if (postPublishEmail) {
					revertedEmails.push(postPublishEmail);
				}
			}
		}
	}

	return {
		complete: true,
		stagedEmails: util.loadAndProjectStagedItems({ excludeEmailConfigurations: true }),
		revertedEmails: util.map(revertedEmails, function(a) {
			return util.projectEmail(a, { summarize: true });
		})
	}

}