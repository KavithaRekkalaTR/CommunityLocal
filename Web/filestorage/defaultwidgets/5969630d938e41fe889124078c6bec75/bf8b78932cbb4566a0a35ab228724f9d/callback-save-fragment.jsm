//
// Save Fragment Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var themeIdQuery = core_v2_page.GetFormValue("_w_themeId");
if (themeIdQuery)
	options.ThemeId = themeIdQuery;

var instanceIdentifierQuery = core_v2_page.GetFormValue("_w_instanceIdentifier");
if (instanceIdentifierQuery)
	options.InstanceIdentifier = instanceIdentifierQuery;

var nameQuery = core_v2_page.GetFormValue("_w_name");
if (nameQuery != null)
	options.Name = nameQuery;

var contentScriptQuery = core_v2_page.GetFormValue("_w_contentScript");
if (contentScriptQuery != null)
	options.ContentScript = contentScriptQuery;

var contentScriptLanguageQuery = core_v2_page.GetFormValue("_w_contentScriptLanguage");
if (contentScriptLanguageQuery != null)
	options.ContentScriptLanguage = contentScriptLanguageQuery;

var descriptionQuery = core_v2_page.GetFormValue("_w_description");
if (descriptionQuery != null)
	options.Description = descriptionQuery;

var cssClassQuery = core_v2_page.GetFormValue("_w_cssClass");
if (cssClassQuery != null)
	options.CssClass = cssClassQuery;

var additionalCssScriptQuery = core_v2_page.GetFormValue("_w_additionalCssScript");
if (additionalCssScriptQuery != null)
	options.AdditionalCssScript = additionalCssScriptQuery;

var additionalCssScriptLanguageQuery = core_v2_page.GetFormValue("_w_additionalCssScriptLanguage");
if (additionalCssScriptLanguageQuery != null)
	options.AdditionalCssScriptLanguage = additionalCssScriptLanguageQuery;

var headerScriptQuery = core_v2_page.GetFormValue("_w_headerScript");
if (headerScriptQuery != null)
	options.HeaderScript = headerScriptQuery;

var headerScriptLanguageQuery = core_v2_page.GetFormValue("_w_headerScriptLanguage");
if (headerScriptLanguageQuery != null)
	options.HeaderScriptLanguage = headerScriptLanguageQuery;

var resourcesToSaveQuery = core_v2_page.GetFormValue("_w_resourcesToSave");
if (resourcesToSaveQuery != null)
	options.ResourcesToSave = resourcesToSaveQuery;

var configurationXmlQuery = core_v2_page.GetFormValue("_w_configurationXml");
if (configurationXmlQuery != null)
	options.ConfigurationXml = configurationXmlQuery;

var isCacheableQuery = core_v2_page.GetFormValue("_w_isCacheable");
if (isCacheableQuery)
	options.IsCacheable = core_v2_utility.ParseBool(isCacheableQuery);

var varyCacheByUserQuery = core_v2_page.GetFormValue("_w_varyCacheByUser");
if (varyCacheByUserQuery)
	options.VaryCacheByUser = core_v2_utility.ParseBool(varyCacheByUserQuery);

var showHeaderByDefaultQuery = core_v2_page.GetFormValue("_w_showHeaderByDefault");
if (showHeaderByDefaultQuery)
	options.ShowHeaderByDefault = core_v2_utility.ParseBool(showHeaderByDefaultQuery);

var contextItemIdsQuery = core_v2_page.GetFormValue("_w_contextItemIds");
if (contextItemIdsQuery != null)
	options.ContextItemIds = contextItemIdsQuery;

var restScopeIdsQuery = core_v2_page.GetFormValue("_w_restScopeIds");
if (restScopeIdsQuery != null)
	options.RestScopeIds = restScopeIdsQuery;

var factoryDefaultProviderQuery = core_v2_page.GetFormValue("_w_factoryDefaultProvider");
if (factoryDefaultProviderQuery)
	options.FactoryDefaultProvider = core_v2_utility.ParseGuid(factoryDefaultProviderQuery);


// process
var saveResult = context.SaveFragment(options);


// output
if (saveResult && saveResult.HasErrors())
	core_v2_page.SendJsonError(saveResult.Errors);

var fragment = saveResult.Model;

core_v2_page.SetContentType('application/json');

return {
	savedFragment: util.projectFragment(fragment),
	stagedFragments: util.loadAndProjectStagedItems(),
	isNew: saveResult.IsNew
};