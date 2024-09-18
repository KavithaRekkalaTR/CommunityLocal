core_v2_page.SetContentType('application/json');

var response = context.UpdateAllowedRestScopes(core_v2_page.GetFormValue('allowedScopes'))

if (response && response.HasErrors()) {
    core_v2_page.SendJsonError(response.Errors);
    return;
}

return {
    success: true
};