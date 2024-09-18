//
// Restore Embeddable File Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	Id: core_v2_page.GetFormValue('_w_id'),
	Name: core_v2_page.GetFormValue('_w_name')
};


// process
var saveResult = context.RestoreEmbeddableFile(options);
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
	isNew: true
};
