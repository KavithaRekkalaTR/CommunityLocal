if (!core_v2_page.IsPost) 
    return;
    
core_v2_page.SetContentType('application/json');

var result = core_v2_widget.ExecuteFile('internal-performaction.jsm', {
    Parameters: {
        action: core_v2_page.GetFormValue('action'),
        articleId: core_v2_page.GetFormValue('articleId'),
        version: core_v2_page.GetFormValue('version'),
        isVersion: core_v2_page.GetFormValue('isVersion')
    }
});

if (result) {
    if (result.errors) {
        core_v2_page.SendJsonError(result.errors);
    } else if (result.warnings) {
        return {
            success: true,
            warning: Array.isArray(result.warnings) ? result.warnings[0].Message : result.warnings.Message
        }
    } else {
        return {
            success: true
        };
    }
} else {
    return {
        success: true
    };
}