//
// List Rest Scopes Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

var options = {
	Filter: core_v2_page.GetQueryStringValue('_w_filter')
};

var restScopes = context.ListRestScopes(options);
if (restScopes && restScopes.HasErrors())
	core_v2_page.SendJsonError(restScopes.Errors);

core_v2_page.SetContentType('application/json');

return {
	scopes: util.map(restScopes, function(restScope){
		return {
			Id: restScope.Id || '',
			Name: restScope.Name() || ''
		};
	})
};
