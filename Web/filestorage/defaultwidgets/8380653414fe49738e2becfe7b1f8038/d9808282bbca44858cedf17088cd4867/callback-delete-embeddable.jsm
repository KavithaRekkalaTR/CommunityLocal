//
// Delete Embeddable Callback
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
var result = context.DeleteEmbeddable(options);

// get embeddable. It may be null if it was a delete
// of a custom embeddable, or may be a factory default if the
// delete was effectively a revert to default
var embeddable = context.GetEmbeddable(options);


// output
if (result && result.HasErrors())
	core_v2_page.SendJsonError(result.Errors);

if (embeddable && embeddable.HasErrors())
	core_v2_page.SendJsonError(embeddable.Errors)

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	deleted: true,
	embeddable: embeddable ? util.projectEmbeddable(embeddable) : null,
	stagedEmbeddables: util.loadAndProjectStagedItems()
};
