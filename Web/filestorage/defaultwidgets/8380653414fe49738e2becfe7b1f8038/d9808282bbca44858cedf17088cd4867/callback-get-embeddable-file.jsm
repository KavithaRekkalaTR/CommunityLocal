//
// Get Embeddable File Callback
//

var util = core_v2_widget.ExecuteFile('util.jsm');

// input
var options = {
	Id: core_v2_page.GetQueryStringValue('_w_id'),
	Name: core_v2_page.GetQueryStringValue('_w_name')
};

var stagedQuery = core_v2_page.GetQueryStringValue('_w_staged');
if (stagedQuery)
	options.Staged = core_v2_utility.ParseBool(stagedQuery);

var factoryDefaultQuery = core_v2_page.GetQueryStringValue('_w_factoryDefault');
if (factoryDefaultQuery)
	options.FactoryDefault = core_v2_utility.ParseBool(factoryDefaultQuery);


// process
var embeddableFile = context.GetEmbeddableFile(options);
var embeddable = context.GetEmbeddable(options);


// output
if (embeddableFile && embeddableFile.HasErrors())
	core_v2_page.SendJsonError(embeddableFile.Errors);

if (embeddable && embeddable.HasErrors())
	core_v2_page.SendJsonError(embeddable.Errors);

core_v2_page.SetContentType('application/json');

return util.projectEmbeddableFile(embeddableFile, {
	embeddable: embeddable
});
