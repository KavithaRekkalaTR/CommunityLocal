if (!core_v2_page.IsPost) 
    return;
    
core_v2_page.SetContentType('application/json');

var errors = core_v2_widget.ExecuteFile('internal-performaction.jsm', {
    Parameters: {
        action: core_v2_page.GetFormValue('action'),
        articleId: core_v2_page.GetFormValue('articleId'),
        version: core_v2_page.GetFormValue('version'),
        isVersion: core_v2_page.GetFormValue('isVersion')
    }
});

if (errors) {
    core_v2_page.SendJsonError(errors);
} else {
    return {
        success: true
    };
}