// input
var options = {};

var query = core_v2_page.GetQueryStringValue('_w_query');
if (query)
	options.Query = query;

var pageSize = core_v2_page.GetQueryStringValue('_w_pageSize');
if (pageSize)
	options.PageSize = pageSize;


// process and output
core_v2_page.SetContentType('application/json');

return { events: context.ListEvents(options) };
