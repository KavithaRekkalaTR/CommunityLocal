//
// Publish Multiple Themes Callback
//
var MAX_SYNCHRONOUS_STEPS = 5;

core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

// parse requests
var themeRequests = core_v2_page.GetFormValue('_w_themeIds').split(',').map(function(f){
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

// if a lot of publishes, perform it in a durable background task with feedback
if (themeRequests.length > MAX_SYNCHRONOUS_STEPS) {

	var scheduledFileProgressKey = 'schedule-themes:' + core_v2_user.Accessing.Id;

	core_v2_widget.ScheduleFile('callback-data-multi-publish-theme-task.jsm', {
		ProgressKey: scheduledFileProgressKey,
		Durable: true,
		Parameters: {
			ThemeIds: core_v2_page.GetFormValue('_w_themeIds')
		}
	});

	var progressIndicator = core_v2_ui.ScheduledFile(scheduledFileProgressKey, {
		IncludeProgress: true,
		IncludeAllMessages: false,
		IncludeLatestMessage: false
	});

	return {
		complete: false,
		progressKey: scheduledFileProgressKey,
		progressIndicator: progressIndicator
	};

// otherwise, publish synchronously
} else {

	var revertedThemes = [];
	var deletedThemes = [];

	// publish requests
	for (var i = 0; i < themeRequests.length; i++) {
		var themeRequest = themeRequests[i];

		var prePublishTheme = false;
		var prePublishTheme = context.GetTheme(themeRequest);

		if (prePublishTheme && prePublishTheme.HasErrors())
			core_v2_page.SendJsonError(prePublishTheme.Errors);

		var publishResult = context.PublishTheme(themeRequest);
		if (publishResult && publishResult.HasErrors())
			core_v2_page.SendJsonError(publishResult.Errors);

		// If the publish was of a reversion, then figure out what the result was to track
		if (prePublishTheme && prePublishTheme.IsReverted) {
			var postPublishTheme = false;
			var postPublishTheme = context.GetTheme(themeRequest);
			if (postPublishTheme && postPublishTheme.HasErrors())
				core_v2_page.SendJsonError(postPublishTheme.Errors);

			// Items whose publication reverted them to the factory default
			if (postPublishTheme) {
				revertedThemes.push(postPublishTheme);
			// Items whose publication fully deleted them
			} else {
				deletedThemes.push(themeRequest);
			}
		}
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
	}

}
