//
// List Contexts Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

var options = {
	Filter: core_v2_page.GetQueryStringValue('_w_filter')
};

var contextItems = context.ListContextItems(options);
if (contextItems && contextItems.HasErrors())
	core_v2_page.SendJsonError(contextItems.Errors);

core_v2_page.SetContentType('application/json');

return {
	contexts: util.map(contextItems, function(contextItem){
		return {
			Id: contextItem.Id || '',
			Name: contextItem.Name || ''
		};
	})
};
