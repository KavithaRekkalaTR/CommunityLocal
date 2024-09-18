var categoryId = core_v2_utility.ParseInt(core_v2_page.GetFormValue('categoryId'));

var response = context.RestoreCategory(categoryId);

core_v2_page.SetContentType('text/json');

if (response && response.HasErrors()) {
    core_v2_page.SendJsonError(response.Errors);
} else {
    return {
        success: true
    }
}