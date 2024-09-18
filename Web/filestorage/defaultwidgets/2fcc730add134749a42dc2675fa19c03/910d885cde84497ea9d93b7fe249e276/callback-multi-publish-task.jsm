function cancel(message) {
	context.Refresh();
	throw message;
}

var fragments = [];
var ids = (core_v2_widget.GetExecutionParameterValue('Ids') || '').split(',');

for (var i = 0; i < ids.length; i++) {
	if (context_v2_scheduledFile.IsCancellationRequested)
		cancel('Publish Cancelled');

	var options = {
		InstanceIdentifier: ids[i].split('|')[0],
		ThemeId: ids[i].split('|')[1],
		SuppressRefresh: true
	};

	var result = context.PublishFragment(options);
	if (result && result.HasErrors())
		cancel(result.Errors[0].Message);

	this.fragment = context.GetFragment(options);
	fragments.push({
		id: options,
		fragment: this.fragment,
		renderedFragment: core_v2_widget.ExecuteFile('render-item.vm')
	});

	context_v2_scheduledFile.Report({ PercentComplete: i / ids.length });
}

var staged = context.ListFragments({ PageSize: 1, PageIndex: 0, IsStaged: true });
if (staged && staged.HasErrors())
	cancel(staged.Errors[0].Message);

context.Refresh();

return {
	success: true,
	fragments: fragments,
	stagedCount: staged ? staged.TotalCount : 0
};