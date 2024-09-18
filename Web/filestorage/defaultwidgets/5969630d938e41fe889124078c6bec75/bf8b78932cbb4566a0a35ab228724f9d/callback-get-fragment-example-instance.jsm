//
// Get Fragment Example Instance Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
	ThemeId: core_v2_page.GetQueryStringValue('_w_themeId'),
	InstanceIdentifier: core_v2_page.GetQueryStringValue('_w_instanceIdentifier')
};

var sampleUrl = context.GetSampleUrl(options);

core_v2_page.SetContentType('application/json');

return {
	ThemeId: options.ThemeId || null,
	InstanceIdentifier: options.InstanceIdentifier || null,
	ExampleUrl: sampleUrl || null,
	PreviewUrl: context.PreviewUrl
};
