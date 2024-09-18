var fromFragmentId = core_v2_utility.ParseGuid(core_v2_widget.GetExecutionParameterValue('FromFragmentId'));
var toFragmentId = core_v2_utility.ParseGuid(core_v2_widget.GetExecutionParameterValue('ToFragmentId'));
var themeId = core_v2_utility.ParseGuid(core_v2_widget.GetExecutionParameterValue('ThemeId'));
var configuration = core_v2_widget.GetExecutionParameterValue('Configuration');

var result = context.Replace(fromFragmentId, toFragmentId, themeId, configuration,
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

return {
	result: result
};