if (core_v2_page.IsPost) {
    core_v2_page.SetContentType('application/json');

    var userIds = core_v2_page.GetFormValue('UserIds');
    var roleIds = core_v2_page.GetFormValue('RoleIds');

    var response = context.Update(userIds, roleIds);

    if(response && response.HasErrors()) {
        core_v2_page.SendJsonError(response.Errors);
    }

    return {"success":true}
}
