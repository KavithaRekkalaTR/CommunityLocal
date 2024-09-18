core_v2_page.SetContentType('application/json')

var blogId = core_v2_page.GetQueryStringValue('_w_blogId');
var query = core_v2_page.GetQueryStringValue('_w_query');

var blog = core_v2_blog.Get({ Id: blogId });
if (blog && blog.HasErrors())
	core_v2_page.SendJsonError(blog.Errors);

var queryComponents = (query || '').toLowerCase().split(' ');
var haystack;

var matchingAuthors = (core_v2_utility.AsArray(blog.Authors) || [])
	.filter(function (user) {
		var includesQuery = true;
		haystack = ((user.DisplayName || '') + (user.Username || '')).toLowerCase();
		for(var i = 0; i < queryComponents.length; i++) {
			includesQuery = includesQuery && haystack.indexOf(queryComponents[i]) >= 0;
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