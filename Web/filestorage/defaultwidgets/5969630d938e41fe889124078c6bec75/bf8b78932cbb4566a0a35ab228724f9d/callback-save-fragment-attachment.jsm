//
// Save Fragment Attachment Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	InstanceIdentifier: core_v2_page.GetFormValue('_w_instanceIdentifier'),
	Name: core_v2_page.GetFormValue('_w_name')
};

var themeIdQuery = core_v2_page.GetFormValue('_w_themeId');
if (themeIdQuery)
	options.ThemeId = themeIdQuery;

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
var saveResult = context.SaveFragmentAttachment(options);
var fragment = context.GetFragment(options);


// output
if (saveResult && saveResult.HasErrors())
	core_v2_page.SendJsonError(saveResult.Errors);

if (fragment && fragment.HasErrors())
	core_v2_page.SendJsonError(fragment.Errors);

var attachment = saveResult.Model;

core_v2_page.SetContentType('application/json');

return {
	savedAttachment: util.projectFragmentAttachment(attachment, { fragment: fragment }),
	stagedFragments: util.loadAndProjectStagedItems(),
	fragment: util.projectFragment(fragment),
	isNew: saveResult.IsNew
};
