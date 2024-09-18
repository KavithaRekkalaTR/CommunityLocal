core_v2_page.SetContentType('application/json')


var options = {};

var queryQuery = core_v2_page.GetQueryStringValue('_w_query');
if (queryQuery)
	options.Query = queryQuery;


var roles = context.SearchRoles(options);


// output
if (roles.HasErrors())
	core_v2_page.SendJsonError(roles.Errors);

return {
	results: roles
};
