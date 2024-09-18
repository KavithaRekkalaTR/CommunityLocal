//
// Revert Multiple Embeddables Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return { success: false };

var separatedEmbeddableIds = (core_v2_page.GetFormValue('_w_embeddableIds') || '').split(',');

for (var i = 0; i < separatedEmbeddableIds.length; i++) {
	var embeddableIdComponents = separatedEmbeddableIds[i].split('|');
	var revertOptions = {
		Id: embeddableIdComponents[0]
	};

	if (embeddableIdComponents.length > 1) {
		revertOptions.Model = embeddableIdComponents[1];
	}

	var result = context.RevertEmbeddable(revertOptions);

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors)
}

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	stagedEmbeddables: util.loadAndProjectStagedItems()
};
