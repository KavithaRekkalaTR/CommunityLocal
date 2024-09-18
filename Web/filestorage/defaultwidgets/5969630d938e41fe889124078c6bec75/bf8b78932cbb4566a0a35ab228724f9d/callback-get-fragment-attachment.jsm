//
// Get Fragment Attachment Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
	InstanceIdentifier: core_v2_page.GetQueryStringValue('_w_instanceIdentifier'),
	Name: core_v2_page.GetQueryStringValue('_w_name')
};

var themeIdQuery = core_v2_page.GetQueryStringValue('_w_themeId');
if (themeIdQuery)
	options.ThemeId = themeIdQuery;

var stagedQuery = core_v2_page.GetQueryStringValue('_w_staged');
if (stagedQuery)
	options.Staged = core_v2_utility.ParseBool(stagedQuery);

var factoryDefaultQuery = core_v2_page.GetQueryStringValue('_w_factoryDefault');
if (factoryDefaultQuery)
	options.FactoryDefault = core_v2_utility.ParseBool(factoryDefaultQuery);


// process
var fragmentAttachment = context.GetFragmentAttachment(options);
var fragment = context.GetFragment(options);


// output
if (fragmentAttachment && fragmentAttachment.HasErrors())
	core_v2_page.SendJsonError(fragmentAttachment.Errors);

if (fragment && fragment.HasErrors())
	core_v2_page.SendJsonError(fragment.Errors);

core_v2_page.SetContentType('application/json');

return util.projectFragmentAttachment(fragmentAttachment, {
	fragment: fragment
});
