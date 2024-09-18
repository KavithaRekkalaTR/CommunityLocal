//
// Create Fragment Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var instanceIdentifierQuery = core_v2_page.GetFormValue('_w_instanceIdentifier');
if (instanceIdentifierQuery)
	options.InstanceIdentifier = instanceIdentifierQuery;

var factoryDefaultProviderQuery = core_v2_page.GetFormValue('_w_factoryDefaultProvider');
if (factoryDefaultProviderQuery)
	options.FactoryDefaultProvider = factoryDefaultProviderQuery;

var themeQuery = core_v2_page.GetFormValue('_w_themeId');
if (themeQuery)
	options.ThemeId = themeQuery;

// process
var createdFragment = context.CreateFragment(options);


// output
if (createdFragment && createdFragment.HasErrors())
	core_v2_page.SendJsonError(createdFragment.Errors);

core_v2_page.SetContentType('application/json');

return util.projectFragment(createdFragment);
