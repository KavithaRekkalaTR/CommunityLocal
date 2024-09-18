//
// Save Email File Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	Id: core_v2_page.GetFormValue('_w_id'),
	Name: core_v2_page.GetFormValue('_w_name')
};

var contentQuery = core_v2_page.GetFormValue('_w_content');
if (contentQuery)
	options.Content = contentQuery;

var newNameQuery = core_v2_page.GetFormValue('_w_newName');
if (newNameQuery)
	options.NewName = newNameQuery;

var uploadContextQuery = core_v2_page.GetFormValue('_w_uploadContext');
if (uploadContextQuery)
	options.UploadContext = uploadContextQuery;


// process
var saveResult = context.SaveFile(options);
var email = context.Get(options);


// output
if (saveResult && saveResult.HasErrors())
	core_v2_page.SendJsonError(saveResult.Errors);

if (email && email.HasErrors())
	core_v2_page.SendJsonError(email.Errors);

var emailFile = saveResult.Model;

core_v2_page.SetContentType('application/json');

return {
	savedEmailFile: util.projectEmailFile(emailFile, { email: email }),
	stagedEmails: util.loadAndProjectStagedItems(),
	email: util.projectEmail(email),
	isNew: saveResult.IsNew
};
