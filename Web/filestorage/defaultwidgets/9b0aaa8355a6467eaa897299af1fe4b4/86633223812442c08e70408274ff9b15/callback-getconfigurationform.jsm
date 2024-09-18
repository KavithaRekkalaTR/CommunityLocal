core_v2_page.SetContentType('application/json');

var id = core_v2_page.GetFormValue('id');
if (id && id != '') {
    id = core_v2_utility.ParseGuid(id);
} else {
    id = core_v2_utility.NewGuid();
}

var formId = 'configuration_' + id.ToString('N');

return {
    id: id,
    formId: formId,
    html: context.RenderConfigurationForm(formId, core_v2_page.GetFormValue('navigationPluginId'), core_v2_page.GetFormValue('configuration'))
}