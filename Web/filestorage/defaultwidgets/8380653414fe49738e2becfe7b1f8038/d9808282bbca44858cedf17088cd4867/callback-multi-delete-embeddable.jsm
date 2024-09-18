//
// Delete/Revert to Default Multiple Embeddables Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;

// Reverted staged changes
var revertedEmbeddables = [];
var deletedEmbeddables = [];

var embeddableIds = core_v2_page.GetFormValue('_w_embeddableIds');
var serializedEmbeddableRequests = core_v2_utility.split(',', embeddableIds);

// Delete Embeddables
serializedEmbeddableRequests.forEach(function(embeddableId) {

	var options = {
		Id: embeddableId
	};

	var result = context.DeleteEmbeddable(options);

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors);

	// get post delete embeddable.
	// a delete coud have staged a revision to default, staged a default
	// or just reverted staged changes
	// track the ones that are just staged changes
	var embeddable = context.GetEmbeddable(options);

	// Item in which this delete does not stage a change, but rather
	// Just undoes _staged_ changes to an item which cannot be
	// undone, like a FD
	if (embeddable && !embeddable.IsStaged) {
		revertedEmbeddables.push(embeddable);
	// Fully deleted (staged custom with no saved version, so not staging any reversion, just gone)
	// Items which are being fully deleted without staging
	} else if (!embeddable) {
		deletedEmbeddables.push(options);
	}

});

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	deleted: true,
	stagedEmbeddables: util.loadAndProjectStagedItems(),
	revertedEmbeddables: util.map(revertedEmbeddables, function(a) {
		return util.projectEmbeddable(a, { summarize: true });
	}),
	deletedEmbeddables: util.map(deletedEmbeddables, function(deletedEmbeddable) {
		return { Id: deletedEmbeddable.Id };
	})
};