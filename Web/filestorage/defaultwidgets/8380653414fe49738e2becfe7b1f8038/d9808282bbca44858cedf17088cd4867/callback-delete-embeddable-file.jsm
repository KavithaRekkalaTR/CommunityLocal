//
// Delete Embeddable File Callback
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
var result = context.DeleteEmbeddableFile(options);
var embeddable = context.GetEmbeddable(options);


// output
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

if (embeddable && embeddable.HasErrors())
	core_v2_page.SendJsonError(embeddable.Errors)

core_v2_page.SetContentType('application/json');

return {
	embeddable: util.projectEmbeddable(embeddable),
	stagedEmbeddables: util.loadAndProjectStagedItems()
};
