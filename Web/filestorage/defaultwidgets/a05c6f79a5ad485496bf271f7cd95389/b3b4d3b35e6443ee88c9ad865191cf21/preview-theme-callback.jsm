var MAX_SYNCHRONOUS_STEPS = 5;

core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

// schedule a background task with progress to preview (and potentially upgrade) theme
if (context.PreviewSocialThemeItemCount > MAX_SYNCHRONOUS_STEPS) {

	var scheduledFileProgressKey = 'upgrade-ui:' + core_v2_user.Accessing.Id;

	core_v2_widget.ScheduleFile('preview-theme-task.jsm', {
		ProgressKey: scheduledFileProgressKey,
		Durable: false
	});

	var progressIndicator = core_v2_ui.ScheduledFile(scheduledFileProgressKey, {
		IncludeProgress: true,
		IncludeAllMessages: false,
		IncludeLatestMessage: true
	});

	return {
		complete: false,
		progressKey: scheduledFileProgressKey,
		progressIndicator: progressIndicator
	};

// process brief upgrades synchronously
} else {

	var result = context.PreviewSocialTheme();

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors);

	var response = {
		complete: true
	};

	if (result.Warnings) {
		response.warnings = [];
		for (var i = 0; i < result.Warnings.Count; i++) {
			response.warnings.push(result.Warnings[i].Message);
		}
	}

	return response;
}
