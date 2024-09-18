//
// Replace Widgets Callback
//
core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

var scheduledFileProgressKey = 'replace-widgets:' + core_v2_user.Accessing.Id;

core_v2_widget.ScheduleFile('callback-replace-task.jsm', {
	ProgressKey: scheduledFileProgressKey,
	Durable: false,
	Parameters: {
		FromFragmentId: core_v2_page.GetFormValue('_fromFragmentId'),
		ToFragmentId: core_v2_page.GetFormValue('_toFragmentId'),
		ThemeId: core_v2_page.GetFormValue('_themeId'),
		Configuration: core_v2_page.GetFormValue('_configuration')
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
