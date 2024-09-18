//
// Publish Multiple Themes Callback Background Task
//

// parse requests
var themeRequests = core_v2_widget.GetExecutionParameterValue('ThemeIds').split(',').map(function(f){
	var themeRequestComponents = f.split(':');
	var themeRequest = {};

	if (themeRequestComponents.length > 0) {
		themeRequest.Id = themeRequestComponents[0];
		if (themeRequestComponents.length > 1) {
			themeRequest.TypeId = themeRequestComponents[1];
		}
	}

	return themeRequest;
});

var revertedThemes = [];
var deletedThemes = [];

// publish requests
for (var i = 0; i < themeRequests.length; i++) {
	if (context_v2_scheduledFile.IsCancellationRequested)
		throw 'Publish Cancelled';

	var themeRequest = themeRequests[i];

	var prePublishTheme = false;
	var prePublishTheme = context.GetTheme(themeRequest);

	if (prePublishTheme && prePublishTheme.HasErrors())
		throw prePublishTheme.Errors[0].Message;

	var publishResult = context.PublishTheme(themeRequest);
	if (publishResult && publishResult.HasErrors())
		throw publishResult.Errors[0].Message;

	// If the publish was of a reversion, then figure out what the result was to track
	if (prePublishTheme && prePublishTheme.IsReverted) {
		var postPublishTheme = false;
		var postPublishTheme = context.GetTheme(themeRequest);
		if (postPublishTheme && postPublishTheme.HasErrors())
			throw postPublishTheme.Errors[0].Message;

		// Items whose publication reverted them to the factory default
		if (postPublishTheme) {
			revertedThemes.push(postPublishTheme);
		// Items whose publication fully deleted them
		} else {
			deletedThemes.push(themeRequest);
		}
	}

	context_v2_scheduledFile.Report({ PercentComplete: i / themeRequests.length });
}

// serialize set of staged themes
this.themes = context.ListThemes({ Staged: true });
if (this.themes && this.themes.HasErrors())
	core_v2_page.SendJsonError(this.themes.Errors);
var serializedStagedThemes = core_v2_widget.ExecuteFile('callback-sub-serialize-theme-summaries.vm');

// serialize set of reverted themes
this.themes = revertedThemes;
var serializedrevertedThemes = core_v2_widget.ExecuteFile('callback-sub-serialize-theme-summaries.vm');

return {
	complete: true,
	stagedThemes: JSON.parse(serializedStagedThemes),
	revertedThemes: JSON.parse(serializedrevertedThemes),
	deletedThemes: deletedThemes
};
