//
// Get Email File Callback
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
var emailFile = context.GetFile(options);
var email = context.Get(options);


// output
if (emailFile && emailFile.HasErrors())
	core_v2_page.SendJsonError(emailFile.Errors);

if (email && email.HasErrors())
	core_v2_page.SendJsonError(email.Errors);

core_v2_page.SetContentType('application/json');

return util.projectEmailFile(emailFile, {
	email: email
});
