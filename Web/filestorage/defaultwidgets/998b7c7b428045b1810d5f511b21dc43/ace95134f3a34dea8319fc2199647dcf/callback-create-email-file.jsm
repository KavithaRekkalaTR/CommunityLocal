//
// Create Email File Callback
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
var emailFile = context.CreateFile(options);
var email = context.Get(options);


// output
if (emailFile && emailFile.HasErrors())
	core_v2_page.SendJsonError(emailFile.Errors)

if (email && email.HasErrors())
	core_v2_page.SendJsonError(email.Errors)

core_v2_page.SetContentType('application/json');

return util.projectEmailFile(emailFile, {
	email: email
});
