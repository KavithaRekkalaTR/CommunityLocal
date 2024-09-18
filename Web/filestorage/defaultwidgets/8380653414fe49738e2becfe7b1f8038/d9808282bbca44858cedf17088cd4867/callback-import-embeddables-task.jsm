// stage imports with progress callbacks
var util = core_v2_widget.ExecuteFile('util.jsm');

var importResult = context.ImportEmbeddables({
		UploadContext: core_v2_widget.GetExecutionParameterValue('UploadContext'),
		FileName: core_v2_widget.GetExecutionParameterValue('FileName'),
		ImportCommands: core_v2_widget.GetExecutionParameterValue('ImportCommands'),
		FactoryDefaultProviderId: core_v2_widget.GetExecutionParameterValue('FactoryDefaultProviderId')
	},
	// onReport
	function (percentComplete, message) {
		context_v2_scheduledFile.Report({ PercentComplete: percentComplete, Message: message });
	},
	// onError
	function (message) {
		context_v2_scheduledFile.End(message);
	},
	// isCancellationRequested
	function () {
		return context_v2_scheduledFile.IsCancellationRequested;
	});

if (importResult.HasErrors()) {
	throw importResult.Errors[0].Message;
}

// serialize set of staged embeddables
var stagedEmbeddables = context.ListEmbeddables({ Staged: true });
if (stagedEmbeddables && stagedEmbeddables.HasErrors())
	core_v2_page.SendJsonError(stagedEmbeddables.Errors);

return {
	complete: true,
	Imported: importResult.Imported,
	resourceOnly: importResult.ResourceOnly,
	matchingEmbeddables: importResult.MatchingEmbeddables.Count,
	invalidEmbeddables: importResult.InvalidEmbeddables.Count,
	stagedEmbeddablesCount: stagedEmbeddables.Count,
	stagedEmbeddables: util.map(stagedEmbeddables, function(a) {
		return util.projectEmbeddable(a, { summarize: true });
	}),
	newEmbeddables: util.map(importResult.NewEmbeddables, function(a){
		return util.projectEmbeddable(a, { summarize: true });
	}),
	updatedEmbeddables: util.map(importResult.UpdatedEmbeddables, function(a){
		return util.projectEmbeddable(a, { summarize: true });
	})
};
