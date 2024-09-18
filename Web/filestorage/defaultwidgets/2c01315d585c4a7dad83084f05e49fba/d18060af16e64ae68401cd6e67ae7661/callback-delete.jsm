core_v2_page.SetContentType('application/json');

var result = context.DeleteApiKey(core_v2_utility.ParseInt(core_v2_page.GetFormValue('id')));
if (result && result.HasErrors()) {
    core_v2_page.SendJsonError(result.Errors);
    return;
}

return {
    success: true
};