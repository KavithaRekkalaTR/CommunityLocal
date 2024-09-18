var publishGroupId = core_v2_utility.ParseInt(core_v2_widget.GetExecutionParameterValue('PublishGroupId'));
var publish = core_v2_utility.ParseBool(core_v2_widget.GetExecutionParameterValue('Publish'));

var result;
if (publish) {
    result = context.PublishPublishGroup(
        publishGroupId,
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
} else {
    result = context.UnpublishPublishGroup(
        publishGroupId,
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
}

if (result.HasErrors()) {
	throw result.Errors[0].Message;
}

return {
	complete: true
};