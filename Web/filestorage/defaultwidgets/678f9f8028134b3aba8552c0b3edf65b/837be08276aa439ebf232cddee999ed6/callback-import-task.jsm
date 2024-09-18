var responseType = core_v2_widget.GetExecutionParameterValue('ResponseType');
var uploadContext = core_v2_widget.GetExecutionParameterValue('UploadContext');
var fileName = core_v2_widget.GetExecutionParameterValue('FileName');

// stage imports with progress callbacks
var importResult = context.Import({
		UploadContext: uploadContext,
		FileName: fileName,
		ImportCommands: core_v2_widget.GetExecutionParameterValue('ImportCommands'),
		PublishImmediately: true
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
		updatedEmails: (importResult.UpdatedEmails ? importResult.UpdatedEmails.Count : 0),
		matchingEmails: (importResult.MatchingEmails ? importResult.MatchingEmails.Count : 0),
		invalidEmails: (importResult.InvalidEmails ? importResult.InvalidEmails.Count : 0),

		updatedConfiguredEmails: (importResult.UpdatedConfiguredEmails ? importResult.UpdatedConfiguredEmails.Count : 0),
		matchingConfiguredEmails: (importResult.MatchingConfiguredEmails ? importResult.MatchingConfiguredEmails.Count : 0),
		invalidConfiguredEmails: (importResult.InvalidConfiguredEmails ? importResult.InvalidConfiguredEmails.Count : 0),

        emailTemplate: importResult.EmailTemplate,
		emailTemplateState: importResult.EmailTemplateState,

		imported: importResult.Imported,
		resourceOnly: importResult.ResourceOnly
	};

} else {
	throw "Undefined import response type";
}