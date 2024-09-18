// stage fragment changes, passing callbacks to integrate with scheduled file progress/cancellation
var result = context.StageUpgradedScriptedContentFragments(
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

var response = {
	complete: true
};

if (result.HasErrors()) {
	throw result.Errors[0].Message;
}

if (result.Warnings) {
	response.warnings = [];
	for (var i = 0; i < result.Warnings.Count; i++) {
		response.warnings.push(result.Warnings[i].Message);
	}
}

return response;
