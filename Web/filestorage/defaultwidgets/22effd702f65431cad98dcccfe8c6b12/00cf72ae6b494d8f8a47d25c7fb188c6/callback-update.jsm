if (!core_v2_page.IsPost)
    return;

core_v2_page.SetContentType('application/json')

var options = {
    Prefix: core_v2_page.GetFormValue('Prefix'),
    DefaultTypeId: core_v2_page.GetFormValue('DefaultTypeId'),
    RemoveDefaultTypeId: core_v2_page.GetFormValue('RemoveDefaultTypeId'),
    EnableHelpfulness: core_v2_page.GetFormValue('EnableHelpfulness')
};

if (core_v2_page.GetFormValue('reviewWorkflowId') && core_v2_page.GetFormValue('reviewWorkflowId').length > 0) {
    options.reviewWorkflowId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('reviewWorkflowId'));
    options.reviewWorkflowConfigurationData = core_v2_page.ParseQueryString(core_v2_page.GetFormValue('reviewWorkflowConfiguration'));
} 
    
var response = context.Update(options);

if(response.HasErrors()) {
	core_v2_page.SendJsonError(response.Errors)
}

return {
    success:true
};