//
// Create Fragment Attachment Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	InstanceIdentifier: core_v2_page.GetFormValue('_w_instanceIdentifier')
};

var themeIdQuery = core_v2_page.GetFormValue('_w_themeId');
if (themeIdQuery)
	options.ThemeId = themeIdQuery;


// process
var attachment = context.CreateFragmentAttachment(options);
var fragment = context.GetFragment(options);


// output
if (attachment && attachment.HasErrors())
	core_v2_page.SendJsonError(attachment.Errors)

if (fragment && fragment.HasErrors())
	core_v2_page.SendJsonError(fragment.Errors)

core_v2_page.SetContentType('application/json');

return util.projectFragmentAttachment(attachment, {
	fragment: fragment
});
