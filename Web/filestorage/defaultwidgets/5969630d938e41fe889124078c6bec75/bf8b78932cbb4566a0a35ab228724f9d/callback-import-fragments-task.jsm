// stage imports with progress callbacks
var util = core_v2_widget.ExecuteFile('util.jsm');

var importResult = context.ImportFragments({
		UploadContext: core_v2_widget.GetExecutionParameterValue('UploadContext'),
		FileName: core_v2_widget.GetExecutionParameterValue('FileName'),
		ImportCommands: core_v2_widget.GetExecutionParameterValue('ImportCommands'),
		Provider: core_v2_widget.GetExecutionParameterValue('Provider')
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

// serialize set of staged fragments
var stagedFragments = context.ListFragments({ IsStaged: true });
if (stagedFragments && stagedFragments.HasErrors())
	core_v2_page.SendJsonError(stagedFragments.Errors);

return {
	complete: true,
	Imported: importResult.Imported,
	resourceOnly: importResult.ResourceOnly,
	matchingFragments: importResult.MatchingFragments.Count,
	invalidFragments: importResult.InvalidFragments.Count,
	stagedFragmentsCount: stagedFragments.Count,
	stagedFragments: util.map(stagedFragments, function(a) {
		return util.projectFragment(a, { summarize: true });
	}),
	newFragments: util.map(importResult.NewFragments, function(a){
		return util.projectFragment(a, { summarize: true });
	}),
	updatedFragments: util.map(importResult.UpdatedFragments, function(a){
		return util.projectFragment(a, { summarize: true });
	})
};
