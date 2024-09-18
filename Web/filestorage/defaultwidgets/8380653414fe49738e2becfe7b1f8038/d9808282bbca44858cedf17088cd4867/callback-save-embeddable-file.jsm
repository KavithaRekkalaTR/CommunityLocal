//
// Save Embeddable File Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	Id: core_v2_page.GetFormValue('_w_id'),
	Name: core_v2_page.GetFormValue('_w_name')
};

var contentQuery = core_v2_page.GetFormValue('_w_content');
if (contentQuery)
	options.Content = contentQuery;

var newNameQuery = core_v2_page.GetFormValue('_w_newName');
if (newNameQuery)
	options.NewName = newNameQuery;

var uploadContextQuery = core_v2_page.GetFormValue('_w_uploadContext');
if (uploadContextQuery)
	options.UploadContext = uploadContextQuery;


// process
var saveResult = context.SaveEmbeddableFile(options);
var embeddable = context.GetEmbeddable(options);


// output
if (saveResult && saveResult.HasErrors())
	core_v2_page.SendJsonError(saveResult.Errors);

if (embeddable && embeddable.HasErrors())
	core_v2_page.SendJsonError(embeddable.Errors);

var embeddableFile = saveResult.Model;

core_v2_page.SetContentType('application/json');

return {
	savedEmbeddableFile: util.projectEmbeddableFile(embeddableFile, { embeddable: embeddable }),
	stagedEmbeddables: util.loadAndProjectStagedItems(),
	embeddable: util.projectEmbeddable(embeddable),
	isNew: saveResult.IsNew
};
