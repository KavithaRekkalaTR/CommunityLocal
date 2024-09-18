//
// Export Email, Resources, Configuration
//
var options = {
	Mode: core_v2_page.GetQueryStringValue('_w_mode')
};

context.Export(options);
