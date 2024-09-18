core_v2_page.SetContentType('application/json')

var applicationId = core_v2_page.GetQueryStringValue('_w_applicationId');
var query = core_v2_page.GetQueryStringValue('_w_query');

var blog = core_v2_blog.Get(core_v2_utility.ParseGuid(applicationId));
if (blog && blog.HasErrors())
	core_v2_page.SendJsonError(blog.Errors);

var queryComponents = (query || '').toLowerCase().split(' ');
var userId = null;
if (queryComponents.length == 1) {
    userId = parseInt(queryComponents[0], 10);
    if (isNaN(userId)) {
        userId = null;
    }
}
var haystack;

var matchingAuthors = (core_v2_utility.AsArray(blog.Authors) || [])
	.filter(function (user) {
		var includesQuery = true;
		
		if (userId) {
		    includesQuery = user.Id == userId;
		} else {
    		haystack = ((user.DisplayName || '') + (user.Username || '')).toLowerCase();
    		for(var i = 0; i < queryComponents.length; i++) {
    			includesQuery = includesQuery && haystack.indexOf(queryComponents[i]) >= 0;
    		}
		}
		
		return includesQuery;
	})
	.slice(0, 10)
	.map(function (user) {
		return {
			id: user.Id,
			name: user.DisplayName + (user.DisplayName !== user.Username ? (' (' + user.Username + ')') : '')
		};
	});

return {
	authors: matchingAuthors
};