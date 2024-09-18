core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

// schedule a background task with progress to migrate theme
var scheduledFileProgressKey = 'upgrade-ui:' + core_v2_user.Accessing.Id;

core_v2_widget.ScheduleFile('migrate-theme-task.jsm', {
	ProgressKey: scheduledFileProgressKey,
	Durable: true,
	Parameters: {
		PlatformPages: core_v2_page.GetFormValue('PlatformPages'),
		ContentPages: core_v2_page.GetFormValue('ContentPages'),
		Headers: core_v2_page.GetFormValue('Headers'),
		Footers: core_v2_page.GetFormValue('Footers'),
		Navigation: core_v2_page.GetFormValue('Navigation')
	}
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
