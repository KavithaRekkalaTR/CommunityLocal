//
// Save Automation Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var idQuery = core_v2_page.GetFormValue("_w_id");
if (idQuery)
	options.Id = idQuery;

var hostIdQuery = core_v2_page.GetFormValue("_w_hostId");
if (hostIdQuery)
	options.HostId = hostIdQuery;

var factoryDefaultProviderIdQuery = core_v2_page.GetFormValue("_w_factoryDefaultProviderId");
if (factoryDefaultProviderIdQuery)
	options.FactoryDefaultProviderId = factoryDefaultProviderIdQuery;

var nameQuery = core_v2_page.GetFormValue("_w_name");
if (nameQuery != null)
	options.Name = nameQuery;

var descriptionQuery = core_v2_page.GetFormValue("_w_description");
if (descriptionQuery != null)
	options.Description = descriptionQuery;

var executionScriptQuery = core_v2_page.GetFormValue("_w_executionScript");
if (executionScriptQuery != null)
	options.ExecutionScript = executionScriptQuery;

var executionScriptLanguageQuery = core_v2_page.GetFormValue("_w_executionScriptLanguage");
if (executionScriptLanguageQuery != null)
	options.ExecutionScriptLanguage = executionScriptLanguageQuery;

var configurationXmlQuery = core_v2_page.GetFormValue("_w_configurationXml");
if (configurationXmlQuery != null)
	options.ConfigurationXml = configurationXmlQuery;

var resourcesToSaveQuery = core_v2_page.GetFormValue("_w_resourcesToSave");
if (resourcesToSaveQuery != null)
	options.ResourcesToSave = resourcesToSaveQuery;

var eventsQuery = core_v2_page.GetFormValue("_w_events");
if (eventsQuery != null)
	options.Events = eventsQuery;

var triggerTypeQuerys = core_v2_page.GetFormValue("_w_triggerTypes");
if (triggerTypeQuerys != null)
	options.TriggerTypes = triggerTypeQuerys;

var httpAuthenticationQuery = core_v2_page.GetFormValue("_w_httpAuthentication");
if (httpAuthenticationQuery)
	options.HttpAuthentication = httpAuthenticationQuery;

var scheduleTypeQuery = core_v2_page.GetFormValue("_w_scheduleType");
if (scheduleTypeQuery != null)
	options.ScheduleType = scheduleTypeQuery;

var scheduleSecondsQuery = core_v2_page.GetFormValue("_w_scheduleSeconds");
if (scheduleSecondsQuery)
	options.ScheduleSeconds = scheduleSecondsQuery;

var scheduleMinutesQuery = core_v2_page.GetFormValue("_w_scheduleMinutes");
if (scheduleMinutesQuery)
	options.ScheduleMinutes = scheduleMinutesQuery;

var scheduleHoursQuery = core_v2_page.GetFormValue("_w_scheduleHours");
if (scheduleHoursQuery)
	options.ScheduleHours = scheduleHoursQuery;

var scheduleDailyTimeQuery = core_v2_page.GetFormValue("_w_scheduleDailyTime");
if (scheduleDailyTimeQuery)
	options.ScheduleDailyTime = scheduleDailyTimeQuery;

var scheduleDailySundayQuery = core_v2_page.GetFormValue("_w_scheduleDailySunday");
if (scheduleDailySundayQuery)
	options.ScheduleDailySunday = scheduleDailySundayQuery;

var scheduleDailyMondayQuery = core_v2_page.GetFormValue("_w_scheduleDailyMonday");
if (scheduleDailyMondayQuery)
	options.ScheduleDailyMonday = scheduleDailyMondayQuery;

var scheduleDailyTuesdayQuery = core_v2_page.GetFormValue("_w_scheduleDailyTuesday");
if (scheduleDailyTuesdayQuery)
	options.ScheduleDailyTuesday = scheduleDailyTuesdayQuery;

var scheduleDailyWednesdayQuery = core_v2_page.GetFormValue("_w_scheduleDailyWednesday");
if (scheduleDailyWednesdayQuery)
	options.ScheduleDailyWednesday = scheduleDailyWednesdayQuery;

var scheduleDailyThursdayQuery = core_v2_page.GetFormValue("_w_scheduleDailyThursday");
if (scheduleDailyThursdayQuery)
	options.ScheduleDailyThursday = scheduleDailyThursdayQuery;

var scheduleDailyFridayQuery = core_v2_page.GetFormValue("_w_scheduleDailyFriday");
if (scheduleDailyFridayQuery)
	options.ScheduleDailyFriday = scheduleDailyFridayQuery;

var scheduleDailySaturdayQuery = core_v2_page.GetFormValue("_w_scheduleDailySaturday");
if (scheduleDailySaturdayQuery)
	options.ScheduleDailySaturday = scheduleDailySaturdayQuery;

var executeAsServiceUserQuery = core_v2_page.GetFormValue("_w_executeAsServiceUser");
if (executeAsServiceUserQuery)
	options.ExecuteAsServiceUser = executeAsServiceUserQuery;

var isSingletonQuery = core_v2_page.GetFormValue("_w_isSingleton");
if (isSingletonQuery)
	options.IsSingleton = isSingletonQuery;


// process
var saveResult = context.SaveAutomation(options);


// output
if (saveResult && saveResult.HasErrors())
	core_v2_page.SendJsonError(saveResult.Errors);

var automation = saveResult.Model;

core_v2_page.SetContentType('application/json');

return {
	savedAutomation: util.projectAutomation(automation),
	stagedAutomations: util.loadAndProjectStagedItems(),
	isNew: saveResult.IsNew
};