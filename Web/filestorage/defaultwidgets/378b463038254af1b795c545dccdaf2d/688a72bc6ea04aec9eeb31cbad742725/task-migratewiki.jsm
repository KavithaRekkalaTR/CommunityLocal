var wikiId = core_v2_utility.ParseInt(core_v2_widget.GetExecutionParameterValue('WikiId'));

var result = context.MigrateWiki(
        wikiId,
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
	result.ThrowErrors();
}

return {
	complete: true,
	url: result.Url
};