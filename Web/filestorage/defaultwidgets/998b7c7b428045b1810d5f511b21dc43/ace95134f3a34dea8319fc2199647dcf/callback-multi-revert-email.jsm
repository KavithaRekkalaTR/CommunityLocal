//
// Revert Multiple Emails Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return { success: false };

var separatedEmailIds = (core_v2_page.GetFormValue('_w_emailIds') || '').split(',');

for (var i = 0; i < separatedEmailIds.length; i++) {
	var emailIdComponents = separatedEmailIds[i].split('|');
	var revertOptions = {
		Id: emailIdComponents[0]
	};

	if (emailIdComponents.length > 1) {
		revertOptions.Model = emailIdComponents[1];
	}

	var result = context.Revert(revertOptions);

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors)
}

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	stagedEmails: util.loadAndProjectStagedItems()
};
