// stage imports with progress callbacks
var util = core_v2_widget.ExecuteFile('util.jsm');

var importResult = context.Import({
		UploadContext: core_v2_widget.GetExecutionParameterValue('UploadContext'),
		FileName: core_v2_widget.GetExecutionParameterValue('FileName'),
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

// serialize set of staged emails
var stagedEmails = context.List({ Staged: true });
if (stagedEmails && stagedEmails.HasErrors())
	core_v2_page.SendJsonError(stagedEmails.Errors);

return {
	complete: true,
	Imported: importResult.Imported,
	resourceOnly: importResult.ResourceOnly,
	matchingEmails: importResult.MatchingEmails.Count,
	invalidEmails: importResult.InvalidEmails.Count,
	matchingEmailConfigurations: importResult.MatchingEmailConfigurations.Count,
	invalidEmailConfigurations: importResult.InvalidEmailConfigurations.Count,
	stagedEmailsCount: stagedEmails.Count,
	stagedEmails: util.loadAndProjectStagedItems(),
	updatedEmails: util.map(importResult.UpdatedEmails, function(a){
		return util.projectEmail(a, { summarize: true });
	}),
	updatedEmailConfigurations: util.map(importResult.UpdatedEmailConfigurations, function(ce){
		return util.projectEmail(ce.ScriptedEmail, { summarize: true });
	}),
	emailTemplate: util.projectEmail(importResult.EmailTemplate, { summarize: true }),
	emailTemplateState: importResult.EmailTemplateState
};
