core_v2_page.SetContentType('application/json');

var result = context.Delete(core_v2_utility.ParseGuid(core_v2_page.GetFormValue('clientId')));
if (result && result.HasErrors()) {
    core_v2_page.SendJsonError(result.Errors);
    return;
}

return {
    success: true
};