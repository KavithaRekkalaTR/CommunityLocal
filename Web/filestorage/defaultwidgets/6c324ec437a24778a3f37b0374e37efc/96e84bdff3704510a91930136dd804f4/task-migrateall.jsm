var result = context.MigrateAllWikis(
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