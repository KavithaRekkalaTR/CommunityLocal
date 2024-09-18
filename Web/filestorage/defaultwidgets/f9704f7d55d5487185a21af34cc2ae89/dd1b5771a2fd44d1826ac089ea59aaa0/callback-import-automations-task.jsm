// stage imports with progress callbacks
var util = core_v2_widget.ExecuteFile('util.jsm');

var importResult = context.ImportAutomations({
		UploadContext: core_v2_widget.GetExecutionParameterValue('UploadContext'),
		FileName: core_v2_widget.GetExecutionParameterValue('FileName'),
		ImportCommands: core_v2_widget.GetExecutionParameterValue('ImportCommands'),
		FactoryDefaultProviderId: core_v2_widget.GetExecutionParameterValue('FactoryDefaultProviderId')
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

// serialize set of staged automations
var stagedAutomations = context.ListAutomations({ Staged: true });
if (stagedAutomations && stagedAutomations.HasErrors())
	core_v2_page.SendJsonError(stagedAutomations.Errors);

return {
	complete: true,
	Imported: importResult.Imported,
	resourceOnly: importResult.ResourceOnly,
	matchingAutomations: importResult.MatchingAutomations.Count,
	invalidAutomations: importResult.InvalidAutomations.Count,
	matchingConfiguredAutomations: importResult.MatchingConfiguredAutomations.Count,
	invalidConfiguredAutomations: importResult.InvalidConfiguredAutomations.Count,
	stagedAutomationsCount: stagedAutomations.Count,
	stagedAutomations: util.loadAndProjectStagedItems(),
	newAutomations: util.map(importResult.NewAutomations, function(a){
		return util.projectAutomation(a, { summarize: true });
	}),
	updatedAutomations: util.map(importResult.UpdatedAutomations, function(a){
		return util.projectAutomation(a, { summarize: true });
	}),
	newConfiguredAutomations: util.map(importResult.NewConfiguredAutomations, function(ca){
		return util.projectConfiguredAutomation(ca);
	}),
	updatedConfiguredAutomations: util.map(importResult.UpdatedConfiguredAutomations, function(ca){
		return util.projectConfiguredAutomation(ca);
	})
};
