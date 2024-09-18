//
// Delete Email File Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	Id: core_v2_page.GetFormValue('_w_id'),
	Name: core_v2_page.GetFormValue('_w_name')
};


// process
var result = context.DeleteFile(options);
var email = context.Get(options);


// output
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

if (email && email.HasErrors())
	core_v2_page.SendJsonError(email.Errors)

core_v2_page.SetContentType('application/json');

return {
	email: util.projectEmail(email),
	stagedEmails: util.loadAndProjectStagedItems()
};
