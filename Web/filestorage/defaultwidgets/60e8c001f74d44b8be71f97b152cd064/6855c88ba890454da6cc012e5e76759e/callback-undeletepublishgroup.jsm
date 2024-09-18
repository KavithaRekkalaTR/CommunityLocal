if (!core_v2_page.IsPost) 
    return;
    
core_v2_page.SetContentType('application/json');

var publishGroupId = core_v2_utility.ParseInt(core_v2_page.GetFormValue('id'));
var result = context.RestorePublishGroup(publishGroupId);
if (result.HasErrors())
    core_v2_page.SendJsonError(result.Errors);
else
    return { success: true };