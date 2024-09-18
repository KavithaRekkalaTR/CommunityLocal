if (core_v2_page.IsPost) {
	core_v2_page.SetContentType('application/json')

    var result = context.Save(core_v2_utility.ParseGuid(core_v2_page.GetFormValue('id')), core_v2_page.GetFormValue('url'));
    if (result.Errors.length > 0)
        core_v2_page.SendJsonError(result.Errors)
    else
        return {"success" : true};
}