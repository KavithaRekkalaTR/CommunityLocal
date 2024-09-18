//
// Create Embeddable File Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var id = core_v2_page.GetFormValue('_w_id');
if (id)
	options.Id = id;


// process
var embeddableFile = context.CreateEmbeddableFile(options);
var embeddable = context.GetEmbeddable(options);


// output
if (embeddableFile && embeddableFile.HasErrors())
	core_v2_page.SendJsonError(embeddableFile.Errors)

if (embeddable && embeddable.HasErrors())
	core_v2_page.SendJsonError(embeddable.Errors)

core_v2_page.SetContentType('application/json');

return util.projectEmbeddableFile(embeddableFile, {
	embeddable: embeddable
});
