var id = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue('id'));
var systemNotification = core_v2_systemNotification.Get(id);

if (systemNotification.HasErrors()) {
	core_v2_page.SendJsonError(systemNotification.Errors);
} else {
	core_v2_page.SetContentType('application/json');
	return systemNotification;
}
