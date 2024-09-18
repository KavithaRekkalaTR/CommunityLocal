//
// Publish Multiple Embeddables Callback Background Task
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// parse requests
var embeddableRequests = core_v2_widget.GetExecutionParameterValue('EmbeddableIds').split(',').map(function(f){
	var embeddableRequestComponents = f.split('|');
	var embeddableRequest = {};

	if (embeddableRequestComponents.length > 0) {
		embeddableRequest.Id = embeddableRequestComponents[0];
	}

	return embeddableRequest;
});

var revertedEmbeddables = [];
var deletedEmbeddables = [];

// publish requests
for (var i = 0; i < embeddableRequests.length; i++) {
	if (context_v2_scheduledFile.IsCancellationRequested)
		throw 'Publish Cancelled';

	var embeddableRequest = embeddableRequests[i];

	var prePublishEmbeddable = false;
	var prePublishEmbeddable = context.GetEmbeddable(embeddableRequest);

	if (prePublishEmbeddable && prePublishEmbeddable.HasErrors())
		throw prePublishEmbeddable.Errors[0].Message;

	var publishResult = context.PublishEmbeddable(embeddableRequest);
	if (publishResult && publishResult.HasErrors())
		throw publishResult.Errors[0].Message;

	// If the publish was of a reversion, then figure out what the result was to track
	if (prePublishEmbeddable && prePublishEmbeddable.IsReverted) {
		var postPublishEmbeddable = false;
		var postPublishEmbeddable = context.GetEmbeddable(embeddableRequest);
		if (postPublishEmbeddable && postPublishEmbeddable.HasErrors())
			throw postPublishEmbeddable.Errors[0].Message;

		// Items whose publication reverted them to the factory default
		if (postPublishEmbeddable) {
			revertedEmbeddables.push(postPublishEmbeddable);
		// Items whose publication fully deleted them
		} else {
			deletedEmbeddables.push(embeddableRequest);
		}
	}

	context_v2_scheduledFile.Report({ PercentComplete: i / embeddableRequests.length });
}

return {
	complete: true,
	stagedEmbeddables: util.loadAndProjectStagedItems(),
	revertedEmbeddables: util.map(revertedEmbeddables, function(a) {
		return util.projectEmbeddable(a, { summarize: true });
	}),
	deletedEmbeddables: deletedEmbeddables
};
