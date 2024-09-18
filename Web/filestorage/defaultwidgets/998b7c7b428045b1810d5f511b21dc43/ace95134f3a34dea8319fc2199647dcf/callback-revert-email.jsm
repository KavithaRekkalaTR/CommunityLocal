//
// Revert Email Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

core_v2_page.SetContentType('application/json')

if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	Id: core_v2_page.GetFormValue("_w_id"),
	Model: core_v2_page.GetFormValue("_w_model")
};

var response = context.Revert(options);

if (response.HasErrors())
	core_v2_page.SendJsonError(response.Errors);

// published email
var email = context.Get(options);

return {
	reverted: true,
	revertedEmail: email ? util.projectEmail(email) : null,
	stagedEmails: util.loadAndProjectStagedItems()
};
