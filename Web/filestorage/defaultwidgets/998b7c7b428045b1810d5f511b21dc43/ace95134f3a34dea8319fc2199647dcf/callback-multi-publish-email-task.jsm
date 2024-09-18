//
// Publish Multiple Emails Callback Background Task
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// parse requests
var emailRequests = core_v2_widget.GetExecutionParameterValue('EmailIds').split(',').map(function(f){
	var emailRequestComponents = f.split('|');
	var emailRequest = {};

	if (emailRequestComponents.length > 1) {
		emailRequest.Id = emailRequestComponents[0];
		emailRequest.Model = emailRequestComponents[1];
	}

	return emailRequest;
});

var revertedEmails = [];
var revertedConfigurations = [];
var deletedConfigurations = [];

// publish requests
for (var i = 0; i < emailRequests.length; i++) {
	if (context_v2_scheduledFile.IsCancellationRequested)
		throw 'Publish Cancelled';

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
			throw prePublishEmail.Errors[0].Message;

		var publishResult = context.Publish(emailRequest);
		if (publishResult && publishResult.HasErrors())
			throw publishResult.Errors[0].Message;

		// If the publish was of a reversion, then figure out what the result was to track
		if (prePublishEmail && prePublishEmail.IsReverted) {
			var postPublishEmail = false;
			var postPublishEmail = context.Get(emailRequest);
			if (postPublishEmail && postPublishEmail.HasErrors())
				throw postPublishEmail.Errors[0].Message;

			// Items whose publication reverted them to the factory default
			if (postPublishEmail) {
				revertedEmails.push(postPublishEmail);
			}
		}
	}

	context_v2_scheduledFile.Report({ PercentComplete: i / emailRequests.length });
}

return {
	complete: true,
	stagedEmails: util.loadAndProjectStagedItems({ excludeEmailConfigurations: true }),
	revertedEmails: util.map(revertedEmails, function(a) {
		return util.projectEmail(a, { summarize: true });
	})
};
