var wikiIds = core_v2_widget.GetExecutionParameterValue('WikiIds');

var result = context.MigrateWikis(
        wikiIds,
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
	complete: true
};