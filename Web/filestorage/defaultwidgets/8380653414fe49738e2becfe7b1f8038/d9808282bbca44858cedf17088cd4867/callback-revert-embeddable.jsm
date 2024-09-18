//
// Revert Embeddable Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

core_v2_page.SetContentType('application/json')

if (!core_v2_page.IsPost)
	return { success: false };

var options = {
	Id: core_v2_page.GetFormValue("_w_id")
};

var response = context.RevertEmbeddable(options);

if (response.HasErrors())
	core_v2_page.SendJsonError(response.Errors);

// published embeddable
var embeddable = context.GetEmbeddable(options);

return {
	reverted: true,
	revertedEmbeddable: embeddable ? util.projectEmbeddable(embeddable) : null,
	stagedEmbeddables: util.loadAndProjectStagedItems()
};

