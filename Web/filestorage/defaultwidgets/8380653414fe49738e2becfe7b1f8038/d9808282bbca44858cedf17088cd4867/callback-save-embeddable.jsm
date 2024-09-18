//
// Save Embeddable Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var idQuery = core_v2_page.GetFormValue("_w_id");
if (idQuery)
	options.Id = idQuery;

var factoryDefaultProviderIdQuery = core_v2_page.GetFormValue("_w_factoryDefaultProviderId");
if (factoryDefaultProviderIdQuery)
	options.FactoryDefaultProviderId = factoryDefaultProviderIdQuery;

var nameQuery = core_v2_page.GetFormValue("_w_name");
if (nameQuery != null)
	options.Name = nameQuery;

var descriptionQuery = core_v2_page.GetFormValue("_w_description");
if (descriptionQuery != null)
	options.Description = descriptionQuery;

var categoryQuery = core_v2_page.GetFormValue("_w_category");
if (categoryQuery != null)
	options.Category = categoryQuery;

var contentScriptQuery = core_v2_page.GetFormValue("_w_contentScript");
if (contentScriptQuery != null)
	options.ContentScript = contentScriptQuery;

var contentScriptLanguageQuery = core_v2_page.GetFormValue("_w_contentScriptLanguage");
if (contentScriptLanguageQuery != null)
	options.ContentScriptLanguage = contentScriptLanguageQuery;

var configurationXmlQuery = core_v2_page.GetFormValue("_w_configurationXml");
if (configurationXmlQuery != null)
	options.ConfigurationXml = configurationXmlQuery;

var isCacheableQuery = core_v2_page.GetFormValue("_w_isCacheable");
if (isCacheableQuery)
	options.IsCacheable = core_v2_utility.ParseBool(isCacheableQuery);

var varyCacheByUserQuery = core_v2_page.GetFormValue("_w_varyCacheByUser");
if (varyCacheByUserQuery)
	options.VaryCacheByUser = core_v2_utility.ParseBool(varyCacheByUserQuery);

var resourcesToSaveQuery = core_v2_page.GetFormValue("_w_resourcesToSave");
if (resourcesToSaveQuery != null)
	options.ResourcesToSave = resourcesToSaveQuery;

var contentScriptQuery = core_v2_page.GetFormValue("_w_contentScript");
if (contentScriptQuery != null)
	options.ContentScript = contentScriptQuery;

var newPreviewImageFileNameQuery = core_v2_page.GetFormValue("_w_newPreviewImageFileName");
if (newPreviewImageFileNameQuery !== null)
	options.NewPreviewImageFileName = newPreviewImageFileNameQuery;

var newIconImageFileNameQuery = core_v2_page.GetFormValue("_w_newIconImageFileName");
if (newIconImageFileNameQuery !== null)
	options.NewIconImageFileName = newIconImageFileNameQuery;

var uploadContextQuery = core_v2_page.GetFormValue("_w_uploadContext");
if (uploadContextQuery != null)
	options.UploadContext = uploadContextQuery;

var supportedContentTypesScopeToSaveQuery = core_v2_page.GetFormValue("_w_supportedContentTypesScopeToSave");
if (supportedContentTypesScopeToSaveQuery != null)
	options.SupportedContentTypesScopeToSave = supportedContentTypesScopeToSaveQuery;

var supportedContentTypesToSave = core_v2_page.GetFormValue("_w_supportedContentTypesToSave");
if (supportedContentTypesToSave !== null)
	options.SupportedContentTypesToSave = supportedContentTypesToSave;

var restScopeIdsQuery = core_v2_page.GetFormValue("_w_restScopeIds");
if (restScopeIdsQuery != null)
	options.RestScopeIds = restScopeIdsQuery;

// process
var saveResult = context.SaveEmbeddable(options);


// output
if (saveResult && saveResult.HasErrors())
	core_v2_page.SendJsonError(saveResult.Errors);

var embeddable = saveResult.Model;

core_v2_page.SetContentType('application/json');

return {
	savedEmbeddable: util.projectEmbeddable(embeddable),
	stagedEmbeddables: util.loadAndProjectStagedItems(),
	isNew: saveResult.IsNew
};