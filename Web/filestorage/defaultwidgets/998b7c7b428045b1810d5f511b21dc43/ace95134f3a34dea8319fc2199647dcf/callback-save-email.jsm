//
// Save Email Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var idQuery = core_v2_page.GetFormValue("_w_id");
if (idQuery)
	options.Id = idQuery;

var nameQuery = core_v2_page.GetFormValue("_w_name");
if (nameQuery != null)
	options.Name = nameQuery;

var descriptionQuery = core_v2_page.GetFormValue("_w_description");
if (descriptionQuery != null)
	options.Description = descriptionQuery;


var templateScriptQuery = core_v2_page.GetFormValue("_w_templateScript");
if (templateScriptQuery != null)
	options.TemplateScript = templateScriptQuery;

var templateScriptLanguageQuery = core_v2_page.GetFormValue("_w_templateScriptLanguage");
if (templateScriptLanguageQuery != null)
	options.TemplateScriptLanguage = templateScriptLanguageQuery;


var headerScriptQuery = core_v2_page.GetFormValue("_w_headerScript");
if (headerScriptQuery != null)
	options.HeaderScript = headerScriptQuery;

var headerScriptLanguageQuery = core_v2_page.GetFormValue("_w_headerScriptLanguage");
if (headerScriptLanguageQuery != null)
	options.HeaderScriptLanguage = headerScriptLanguageQuery;

var footerScriptQuery = core_v2_page.GetFormValue("_w_footerScript");
if (footerScriptQuery != null)
	options.FooterScript = footerScriptQuery;

var footerScriptLanguageQuery = core_v2_page.GetFormValue("_w_footerScriptLanguage");
if (footerScriptLanguageQuery != null)
	options.FooterScriptLanguage = footerScriptLanguageQuery;

var bodyScriptQuery = core_v2_page.GetFormValue("_w_bodyScript");
if (bodyScriptQuery != null)
	options.BodyScript = bodyScriptQuery;

var bodyScriptLanguageQuery = core_v2_page.GetFormValue("_w_bodyScriptLanguage");
if (bodyScriptLanguageQuery != null)
	options.BodyScriptLanguage = bodyScriptLanguageQuery;

var subjectScriptQuery = core_v2_page.GetFormValue("_w_subjectScript");
if (subjectScriptQuery != null)
	options.SubjectScript = subjectScriptQuery;

var subjectScriptLanguageQuery = core_v2_page.GetFormValue("_w_subjectScriptLanguage");
if (subjectScriptLanguageQuery != null)
	options.SubjectScriptLanguage = subjectScriptLanguageQuery;


var configurationXmlQuery = core_v2_page.GetFormValue("_w_configurationXml");
if (configurationXmlQuery != null)
	options.ConfigurationXml = configurationXmlQuery;

var resourcesToSaveQuery = core_v2_page.GetFormValue("_w_resourcesToSave");
if (resourcesToSaveQuery != null)
	options.ResourcesToSave = resourcesToSaveQuery;


// process
var saveResult = context.Save(options);


// output
if (saveResult && saveResult.HasErrors())
	core_v2_page.SendJsonError(saveResult.Errors);

var email = saveResult.Model;

core_v2_page.SetContentType('application/json');

return {
	savedEmail: util.projectEmail(email),
	stagedEmails: util.loadAndProjectStagedItems(),
	isNew: saveResult.IsNew
};