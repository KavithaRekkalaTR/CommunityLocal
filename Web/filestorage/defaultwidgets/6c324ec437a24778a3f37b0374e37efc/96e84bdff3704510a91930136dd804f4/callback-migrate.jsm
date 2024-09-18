if (!core_v2_page.IsPost)
    return;
    
core_v2_page.SetContentType('application/json');
    
var wikiIds = core_v2_page.GetFormValue('_w_wikiIds');
var progressKey = core_v2_page.GetFormValue('_w_progressKey');

wikiIds.split(',').forEach(function(w) {
    var scheduledProgressKey = "wiki-migratewiki:" + w;
    var scheduledProgressStatus = core_v2_widget.GetScheduledFileStatus(scheduledProgressKey, {
        RunAsServiceUser: true
    });
    
    if (scheduledProgressStatus && (scheduledProgressStatus.State == 'Scheduled' || scheduledProgressStatus.State == 'Running')) {
        throw core_v2_encoding.JavascriptEncode(core_v2_language.GetResource('MigrationAlreadyRunning'));
    }
});

var status = core_v2_widget.GetScheduledFileStatus(progressKey, {
    RunAsServiceUser: true
});
if (!status || (status.State != 'Scheduled' && status.State != 'Running')) {
    core_v2_widget.ScheduleFile('task-migrate.jsm', {
        ProgressKey: progressKey,
        Durable: true,
        RunAsServiceUser: true,
        Parameters: {
            WikiIds: wikiIds
        }
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