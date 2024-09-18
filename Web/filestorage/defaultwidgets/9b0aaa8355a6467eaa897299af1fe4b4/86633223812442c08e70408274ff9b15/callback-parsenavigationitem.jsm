core_v2_page.SetContentType('application/json');
var util = core_v2_widget.ExecuteFile('utilities.jsm');

var items = context.ParseNavigationItems(core_v2_page.GetFormValue('serializedNavigationItem'));
if (!items || items.length != 1) {
    return null;
}

return {
    navigationItem: items[0],
    previewHtml: util.formatPreviewHtml(items[0])
}