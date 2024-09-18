core_v2_page.SetContentType('application/json');

var data = {};

if (core_v2_page.GetFormValue('enabled')) 
    data.Enabled = core_v2_page.GetFormValue('enabled');
    
if (core_v2_page.GetFormValue('name'))
    data.Name = core_v2_page.GetFormValue('name');
    
if (core_v2_page.GetFormValue('allowedScopes') != null)
    data.ScopeIds = core_v2_page.GetFormValue('allowedScopes');

var apiKey;
var id = core_v2_page.GetFormValue('id');
if (id) {
    apiKey = context.UpdateApiKey(core_v2_utility.ParseInt(id), data);
} else {
    apiKey = context.CreateApiKey(data.Name);
}

if (apiKey && apiKey.HasErrors()) {
    core_v2_page.SendJsonError(apiKey.Errors);
    return;
}

return {
    id: apiKey.Id,
    secret: apiKey.Secret,
    name: apiKey.Name
};