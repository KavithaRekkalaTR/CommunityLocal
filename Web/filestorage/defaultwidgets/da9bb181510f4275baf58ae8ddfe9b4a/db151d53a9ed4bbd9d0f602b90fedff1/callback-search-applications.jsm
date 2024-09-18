core_v2_page.SetContentType('application/json');

var applications = context.FindApplications({
	Query: core_v2_page.GetQueryStringValue('_w_query'),
	TypeId: core_v2_page.GetQueryStringValue('_w_typeId')
});

if (applications && applications.HasErrors())
	core_v2_page.SendJsonError(applications.Errors);

return {
	matches: applications.map(function(app) {
		return {
			label: app.HtmlName('Web') + (app.Container && app.Container.ContainerId !== app.ApplicationId ? (' (' + app.Container.HtmlName('Web') + ')') : ''),
			id: app.ApplicationId
		};
	})
};