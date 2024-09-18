core_v2_page.SetContentType('application/json');

var applicationTypeId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('applicationTypeId'));
var configuration = core_v2_page.GetFormValue('configuration');

var result = context.CreateApplication(applicationTypeId, configuration);
if (result.HasErrors()) {
    core_v2_page.SendJsonError(result.Errors);
} else {
    return {
        applicationId: result.ApplicationId,
        name: result.HtmlName('Web')
    };
}