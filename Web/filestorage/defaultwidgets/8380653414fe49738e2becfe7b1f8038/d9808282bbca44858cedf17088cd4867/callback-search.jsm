//
// Search Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');
core_v2_page.SetContentType('application/json')


// input
var options = {};

var queryQuery = core_v2_page.GetQueryStringValue('_w_query');
if (queryQuery)
	options.Query = queryQuery;

var caseSensitiveQuery = core_v2_page.GetQueryStringValue('_w_caseSensitive');
if (caseSensitiveQuery)
	options.CaseSensitive = core_v2_utility.ParseBool(caseSensitiveQuery);

var regExQuery = core_v2_page.GetQueryStringValue('_w_regEx');
if (regExQuery)
	options.RegEx = core_v2_utility.ParseBool(regExQuery);

var componentScopesQuery = core_v2_page.GetQueryStringValue('_w_componentScopes');
if (componentScopesQuery)
	options.ComponentScopes = componentScopesQuery;

var factoryDefaultProviderQuery = core_v2_page.GetQueryStringValue('_w_factoryDefaultProvider');
if (factoryDefaultProviderQuery)
	options.FactoryDefaultProviderId = core_v2_utility.ParseGuid(factoryDefaultProviderQuery);

var stateQuery = core_v2_page.GetQueryStringValue('_w_state');
if (stateQuery)
	options.State = stateQuery;

var isStagedQuery = core_v2_page.GetQueryStringValue('_w_isStaged');
if (isStagedQuery)
	options.IsStaged = core_v2_utility.ParseBool(isStagedQuery);

var idQuery = core_v2_page.GetQueryStringValue('_w_id');
if (idQuery)
	options.Id = idQuery;

var pageSizeQuery = core_v2_page.GetQueryStringValue('_w_pageSize');
if (pageSizeQuery)
	options.PageSize = core_v2_utility.ParseInt(pageSizeQuery);

var pageIndexQuery = core_v2_page.GetQueryStringValue('_w_pageIndex');
if (pageIndexQuery)
	options.PageIndex = core_v2_utility.ParseInt(pageIndexQuery);


// process
var searchResults = context.SearchEmbeddables(options);


// output
if (searchResults.HasErrors())
	core_v2_page.SendJsonError(searchResults.Errors);

return {
	PageSize: searchResults.PageSize,
	PageIndex: searchResults.PageIndex,
	TotalCount: searchResults.TotalCount,
	results: util.map(searchResults, function(sr) {
		return util.projectSearchResult(sr);
	})
};
