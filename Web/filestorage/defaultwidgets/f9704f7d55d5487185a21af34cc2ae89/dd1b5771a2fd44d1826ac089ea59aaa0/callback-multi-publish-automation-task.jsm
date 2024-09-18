//
// Publish Multiple Automations Callback Background Task
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// parse requests
var automationRequests = core_v2_widget.GetExecutionParameterValue('AutomationIds').split(',').map(function(f){
	var automationRequestComponents = f.split('|');
	var automationRequest = {};

	if (automationRequestComponents.length > 1) {
		automationRequest.Id = automationRequestComponents[0];
		automationRequest.Model = automationRequestComponents[1];
	}

	return automationRequest;
});

var revertedAutomations = [];
var deletedAutomations = [];
var revertedConfigurations = [];
var deletedConfigurations = [];

// publish requests
for (var i = 0; i < automationRequests.length; i++) {
	if (context_v2_scheduledFile.IsCancellationRequested)
		throw 'Publish Cancelled';

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
			throw prePublishAutomation.Errors[0].Message;

		var publishResult = context.PublishAutomation(automationRequest);
		if (publishResult && publishResult.HasErrors())
			throw publishResult.Errors[0].Message;

		// If the publish was of a reversion, then figure out what the result was to track
		if (prePublishAutomation && prePublishAutomation.IsReverted) {
			var postPublishAutomation = false;
			var postPublishAutomation = context.GetAutomation(automationRequest);
			if (postPublishAutomation && postPublishAutomation.HasErrors())
				throw postPublishAutomation.Errors[0].Message;

			// Items whose publication reverted them to the factory default
			if (postPublishAutomation) {
				revertedAutomations.push(postPublishAutomation);
			// Items whose publication fully deleted them
			} else {
				deletedAutomations.push(automationRequest);
			}
		}
	}

	context_v2_scheduledFile.Report({ PercentComplete: i / automationRequests.length });
}

return {
	complete: true,
	stagedAutomations: util.loadAndProjectStagedItems({ excludeConfiguredAutomations: true }),
	revertedAutomations: util.map(revertedAutomations, function(a) {
		return util.projectAutomation(a, { summarize: true });
	}),
	deletedAutomations: deletedAutomations
};
