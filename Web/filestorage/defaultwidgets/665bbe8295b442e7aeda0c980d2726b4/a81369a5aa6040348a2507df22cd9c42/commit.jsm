var MAX_SYNCHRONOUS_STEPS = 5;

core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

// schedule a background task with progress to commit staged items
if (context.StagedItemsCount > MAX_SYNCHRONOUS_STEPS) {

	var scheduledFileProgressKey = 'publish-ui:' + core_v2_user.Accessing.Id;

	core_v2_widget.ScheduleFile('commit-task.jsm', {
		ProgressKey: scheduledFileProgressKey,
		Durable: true
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

	var result = context.Commit();

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors);

	return {
		complete: true
	};

}
