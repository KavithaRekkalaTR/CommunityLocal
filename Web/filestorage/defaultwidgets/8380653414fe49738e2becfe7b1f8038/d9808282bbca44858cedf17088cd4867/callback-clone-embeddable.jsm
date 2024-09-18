//
// Clone Embeddable Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {
	Id: core_v2_page.GetFormValue('_w_id')
};

var newId = core_v2_page.GetFormValue('_w_newId');
if (newId)
	options.NewId = newId;

var factoryDefaultProviderId = core_v2_page.GetQueryStringValue('_w_factoryDefaultProviderId');
if (factoryDefaultProviderId)
	options.FactoryDefaultProviderId = core_v2_utility.ParseBool(factoryDefaultProviderId);


// process
var embeddable = context.CloneEmbeddable(options);


// output
if (embeddable && embeddable.HasErrors())
	core_v2_page.SendJsonError(embeddable.Errors)

core_v2_page.SetContentType('application/json');

return {
	clonedEmbeddable: util.projectEmbeddable(embeddable),
	stagedEmbeddables: util.loadAndProjectStagedItems()
};