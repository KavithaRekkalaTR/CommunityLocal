var themes = [];
var ids = (core_v2_widget.GetExecutionParameterValue('Ids') || '').split(',');

for (var i = 0; i < ids.length; i++) {
	if (context_v2_scheduledFile.IsCancellationRequested)
		throw 'Publish Cancelled';

	var options = {
		Id: ids[i].split('|')[0],
		TypeId: ids[i].split('|')[1]
	};

	var result = context.PublishTheme(options);
	if (result && result.HasErrors())
		throw result.Errors[0].Message;

	this.theme = context.GetTheme(options);
	themes.push({
		id: options,
		theme: this.theme,
		renderedTheme: core_v2_widget.ExecuteFile('render-item.vm')
	});

	context_v2_scheduledFile.Report({ PercentComplete: i / ids.length });
}

var staged = context.ListThemes({ PageSize: 1, PageIndex: 0, Staged: true });
if (staged && staged.HasErrors())
	throw staged.Errors[0].Message;

return {
	success: true,
	themes: themes,
	stagedCount: staged ? staged.TotalCount : 0
};