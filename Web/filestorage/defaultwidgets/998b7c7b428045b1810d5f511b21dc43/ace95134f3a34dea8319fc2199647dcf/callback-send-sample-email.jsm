//
// Send Sample Email Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;

var emailId = core_v2_page.GetFormValue("_w_id");
var language = core_v2_page.GetFormValue("_w_language");

// process
var sendResult = context.SendSample({
	Id: emailId,
	Language: language
});

// output
if (sendResult && sendResult.HasErrors())
	core_v2_page.SendJsonError(sendResult.Errors);

core_v2_page.SetContentType('application/json');

return {
	success: true
};