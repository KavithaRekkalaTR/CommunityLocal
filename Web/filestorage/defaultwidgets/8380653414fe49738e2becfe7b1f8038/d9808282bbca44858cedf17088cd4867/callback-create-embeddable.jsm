//
// Create Embeddable Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;


// input
var options = {};

var id = core_v2_page.GetFormValue('_w_id');
if (id)
	options.Id = id;

var factoryDefaultProviderId = core_v2_page.GetFormValue('_w_factoryDefaultProviderId');
if (factoryDefaultProviderId)
	options.FactoryDefaultProviderId = factoryDefaultProviderId;


// process
var createdEmbeddable = context.CreateEmbeddable(options);


// output
if (createdEmbeddable && createdEmbeddable.HasErrors())
	core_v2_page.SendJsonError(createdEmbeddable.Errors);

var embeddable = createdEmbeddable.Model;

core_v2_page.SetContentType('application/json');

return util.projectEmbeddable(embeddable);
