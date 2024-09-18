//
// Delete/Revert to Default Multiple Emails Callback
//
var util = core_v2_widget.ExecuteFile('util.jsm');

if (!core_v2_page.IsPost)
	return false;

// Reverted staged changes
var revertedEmails = [];

var emailIds = core_v2_page.GetFormValue('_w_emailIds');
var serializedEmailRequests = (core_v2_page.GetFormValue('_w_emailIds') || '').split(',');

// Delete Emails
serializedEmailRequests.forEach(function(emailId) {

	var options = {
		Id: emailId
	};

	var result = context.Delete(options);

	if (result.HasErrors())
		core_v2_page.SendJsonError(result.Errors);

	// get post delete email.
	// a delete coud have staged a revision to default, staged a default
	// or just reverted staged changes
	// track the ones that are just staged changes
	var email = context.Get(options);

	// Item in which this delete does not stage a change, but rather
	// Just undoes _staged_ changes to an item which cannot be
	// undone, like a FD
	if (email && !email.IsStaged) {
		revertedEmails.push(email);
	}

});

core_v2_page.SetContentType('application/json');

return {
	reverted: true,
	deleted: true,
	stagedEmails: util.loadAndProjectStagedItems(),
	revertedEmails: util.map(revertedEmails, function(a) {
		return util.projectEmail(a, { summarize: true });
	})
};