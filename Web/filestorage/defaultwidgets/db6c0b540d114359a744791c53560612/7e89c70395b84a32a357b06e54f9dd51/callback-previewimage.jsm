core_v2_page.SetContentType('application/json');

var url = core_v2_page.GetFormValue('url');
if (!url) {
	var fileName = core_v2_page.GetFormValue('name');
	var uploadContextId = core_v2_page.GetFormValue('uploadContextId');
	if (fileName && uploadContextId) {
		var file = core_v2_uploadedFile.Get(uploadContextId, fileName)
		if (file) {
		   url = file.Url;
		}
	}
}

if (url) {
    return {
        previewHtml: core_v2_ui.GetPreviewHtml(url, { Width: 100, Height: 100, OutputIsPersisted: false }),
        url: url,
        success: true
    }
} else {
    return {
        success: false
    }
}