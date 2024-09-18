core_v2_page.SetContentType('application/json');

var client = context.UpdateSecret(core_v2_utility.ParseGuid(core_v2_page.GetFormValue('clientId')));
if (client && client.HasErrors()) {
    core_v2_page.SendJsonError(client.Errors);
    return;
}

return {
    clientId: client.Id,
    secret: client.Secret,
    name: client.Name
};