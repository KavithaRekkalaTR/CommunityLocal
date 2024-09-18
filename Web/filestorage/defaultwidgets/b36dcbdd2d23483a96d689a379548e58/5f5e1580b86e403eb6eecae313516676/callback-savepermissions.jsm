core_v2_page.SetContentType('application/json');

var result = context.SetPermissions(core_v2_utility.ParseGuid(core_v2_page.GetFormValue('clientId')), core_v2_utility.ParseInt(core_v2_page.GetFormValue('roleId')), core_v2_page.GetFormValue('grantedPermissionIds'));
if (result && result.HasErrors()) {
    core_v2_page.SendJsonError(result.Errors);
    return;
}

return {
    success: true
};