if (!core_v2_page.IsPost)
    return;
    
core_v2_page.SetContentType('application/json');
    
var progressKey = core_v2_page.GetFormValue('_w_progressKey');

var status = core_v2_widget.GetScheduledFileStatus(progressKey, {
    RunAsServiceUser: true
});
if (!status || (status.State != 'Scheduled' && status.State != 'Running')) {
    core_v2_widget.ScheduleFile('task-migrateall.jsm', {
        ProgressKey: progressKey,
        Durable: true,
        RunAsServiceUser: true
    });
}

var progressIndicator = core_v2_ui.ScheduledFile(progressKey, {
    IncludeProgress: true,
    IncludeAllMessages: false,
    IncludeLatestMessage: true,
    RunAsServiceUser: true
});


return {
    complete: false,
    progressIndicator: progressIndicator
};