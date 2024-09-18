core_v2_page.SetContentType('application/json');

var apiKey = context.RegenerateApiKeySecret(core_v2_utility.ParseInt(core_v2_page.GetFormValue('id')));
if (apiKey && apiKey.HasErrors()) {
    core_v2_page.SendJsonError(apiKey.Errors);
    return;
}

return {
    id: apiKey.Id,
    secret: apiKey.Secret,
    name: apiKey.Name
};