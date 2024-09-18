core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

var scheduledFileProgressKey = 'schedule-widgets:' + core_v2_user.Accessing.Id;

core_v2_widget.ScheduleFile('callback-import-fragments-task.jsm', {
	ProgressKey: scheduledFileProgressKey,
	Durable: false,
	Parameters: {
		UploadContext: core_v2_page.GetFormValue('_w_uploadContext'),
		FileName: core_v2_page.GetFormValue('_w_fileName'),
		ImportCommands: core_v2_page.GetFormValue('_w_importCommands'),
		Provider: core_v2_page.GetFormValue('_w_provider')
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
