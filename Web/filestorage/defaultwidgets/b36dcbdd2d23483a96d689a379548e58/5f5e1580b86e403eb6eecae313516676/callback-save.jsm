core_v2_page.SetContentType('application/json');

var data = {
  AllowedGrantTypes: core_v2_page.GetFormValue('grantTypes'),
  CallbackUrl: core_v2_page.GetFormValue('callbackUrl'),
  ClientType: core_v2_page.GetFormValue('clientType'),
  Description: core_v2_page.GetFormValue('description'),
  IsModerated: core_v2_page.GetFormValue('moderated'),
  IsTrusted: core_v2_page.GetFormValue('trusted'),
  MainUrl: core_v2_page.GetFormValue('mainUrl'),
  Name: core_v2_page.GetFormValue('name'),
  ScopeIds: core_v2_page.GetFormValue('allowedScopes')
};

var client;
var id = core_v2_page.GetFormValue('clientId');
if (id) {
    client = context.Update(core_v2_utility.ParseGuid(id), data);
} else {
    client = context.Create(data);
}

if (client && client.HasErrors()) {
    core_v2_page.SendJsonError(client.Errors);
    return;
}

return {
    clientId: client.Id,
    secret: client.Secret,
    name: client.Name
};