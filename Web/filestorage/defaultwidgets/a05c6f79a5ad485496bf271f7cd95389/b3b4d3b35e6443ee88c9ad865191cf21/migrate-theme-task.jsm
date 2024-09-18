// stage theme migration, passing callbacks to integrate with scheduled file progress/cancellation
var result = context.InitiateMigrationToSocialTheme({
		PlatformPages: core_v2_widget.GetExecutionParameterValue('PlatformPages'),
		ContentPages: core_v2_widget.GetExecutionParameterValue('ContentPages'),
		Headers: core_v2_widget.GetExecutionParameterValue('Headers'),
		Footers: core_v2_widget.GetExecutionParameterValue('Footers'),
		Navigation: core_v2_widget.GetExecutionParameterValue('Navigation')
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

var response = {
	complete: true,
	successUrl: context.SystemNotificationsUrl
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
