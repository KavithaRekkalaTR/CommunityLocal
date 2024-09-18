//
// Delete Email Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var id = core_v2_page.GetFormValue('_w_id');
if (id)
	options.Id = id;


// process
var result = context.Delete(options);

// get email. It may be null if it was a delete
// of a custom email, or may be a factory default if the
// delete was effectively a revert to default
var email = context.Get(options);


// output
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

if (email && email.HasErrors())
	core_v2_page.SendJsonError(email.Errors)

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	deleted: true,
	email: email ? util.projectEmail(email) : null,
	stagedEmails: util.loadAndProjectStagedItems()
};
