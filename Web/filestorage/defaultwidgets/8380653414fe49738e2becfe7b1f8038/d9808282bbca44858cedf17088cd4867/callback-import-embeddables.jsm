core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

var scheduledFileProgressKey = 'schedule-embeddables:' + core_v2_user.Accessing.Id;

core_v2_widget.ScheduleFile('callback-import-embeddables-task.jsm', {
	ProgressKey: scheduledFileProgressKey,
	Durable: true,
	Parameters: {
		UploadContext: core_v2_page.GetFormValue('_w_uploadContext'),
		FileName: core_v2_page.GetFormValue('_w_fileName'),
		ImportCommands: core_v2_page.GetFormValue('_w_importCommands'),
		FactoryDefaultProviderId: core_v2_page.GetFormValue('_w_factoryDefaultProviderId')
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
