//
// Revert Themes Callback
//
core_v2_page.SetContentType('application/json');

if (!core_v2_page.IsPost)
	return { complete: false };

var scheduledFileProgressKey = 'schedule-themes:' + core_v2_user.Accessing.Id;

core_v2_widget.ScheduleFile('callback-multi-revert-task.jsm', {
	ProgressKey: scheduledFileProgressKey,
	Durable: true,
	Parameters: {
		Ids: core_v2_page.GetFormValue('_w_ids'),
		RevertStagedPages: core_v2_page.GetFormValue('_w_revertStagedPages'),
		RevertStagedHeaders: core_v2_page.GetFormValue('_w_revertStagedHeaders'),
		RevertStagedFooters: core_v2_page.GetFormValue('_w_revertStagedFooters'),
		RevertStagedFragments: core_v2_page.GetFormValue('_w_revertStagedFragments')
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
