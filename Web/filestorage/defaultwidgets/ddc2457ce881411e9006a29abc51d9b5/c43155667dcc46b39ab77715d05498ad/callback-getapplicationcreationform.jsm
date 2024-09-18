core_v2_page.SetContentType('application/json');

var applicationTypeId = core_v2_utility.ParseGuid(core_v2_page.GetQueryStringValue('w_applicationTypeId'));
var formId = core_v2_widget.UniqueId('form');

return {
    html: context.RenderConfigureApplicationForm(formId, applicationTypeId),
    formId: formId
};