// stage imports with progress callbacks
var importResult = context.ImportThemes({
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

// serialize set of staged themes
this.themes = context.ListThemes({ Staged: true });
if (this.themes && this.themes.HasErrors())
	core_v2_page.SendJsonError(this.themes.Errors);
var serializedStagedThemes = core_v2_widget.ExecuteFile('callback-sub-serialize-theme-summaries.vm');

var response = {
	complete: true,
	Imported: importResult.Imported,
	resourceOnly: importResult.ResourceOnly,
	matchingThemes: importResult.MatchingThemes.Count,
	invalidThemes: importResult.InvalidThemes.Count,
	stagedThemesCount: this.themes.Count,
	stagedThemes: JSON.parse(serializedStagedThemes)
};

var self = this;
response.newThemes = (importResult.NewThemes || []).map(function(t) {
	self.theme = this.theme = t;
	return JSON.parse(core_v2_widget.ExecuteFile('callback-sub-serialize-theme-summary.vm'));
});

response.updatedThemes = (importResult.UpdatedThemes || []).map(function(t) {
	self.theme = this.theme = t;
	return JSON.parse(core_v2_widget.ExecuteFile('callback-sub-serialize-theme-summary.vm'));
});

return response;
