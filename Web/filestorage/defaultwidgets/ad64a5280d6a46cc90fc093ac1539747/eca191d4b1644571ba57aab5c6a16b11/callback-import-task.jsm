var responseType = core_v2_widget.GetExecutionParameterValue('ResponseType');
var uploadContext = core_v2_widget.GetExecutionParameterValue('UploadContext');
var fileName = core_v2_widget.GetExecutionParameterValue('FileName');

// stage imports with progress callbacks
var importResult = context.ImportEmbeddables({
		UploadContext: uploadContext,
		FileName: fileName,
		ImportCommands: core_v2_widget.GetExecutionParameterValue('ImportCommands')
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

// requesting import selection form
if (responseType == 'form') {

	this.importResult = importResult;
	this.uploadContext = uploadContext;
	this.fileName = fileName;
	return {
		panelContent: core_v2_widget.ExecuteFile('panel-import.vm')
	}

// requesting the result of import
} else if (responseType == 'result') {

	return {
		newEmbeddables: importResult.NewEmbeddables.Count,
		updatedEmbeddables: importResult.UpdatedEmbeddables.Count,
		matchingEmbeddables: importResult.MatchingEmbeddables.Count,
		invalidEmbeddables: importResult.InvalidEmbeddables.Count,

		imported: importResult.Imported,
		resourceOnly: importResult.ResourceOnly
	};

} else {
	throw "Undefined import response type";
}
