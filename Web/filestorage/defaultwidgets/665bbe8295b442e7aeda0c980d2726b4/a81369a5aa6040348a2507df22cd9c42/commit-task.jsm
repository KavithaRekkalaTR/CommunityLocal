// publish staged changes, passing callbacks to integrate with scheduled file progress/cancellation
var result = context.Commit(
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

if (result.HasErrors()) {
	throw result.Errors[0].Message;
}

return {
	complete: true
};
