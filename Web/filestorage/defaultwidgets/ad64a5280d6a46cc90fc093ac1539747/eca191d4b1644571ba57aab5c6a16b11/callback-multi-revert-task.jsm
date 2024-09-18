var embeddables = [];
var ids = (core_v2_widget.GetExecutionParameterValue('Ids') || '').split(',');

for (var i = 0; i < ids.length; i++) {
	if (context_v2_scheduledFile.IsCancellationRequested)
		throw 'Publish Cancelled';

	var options = {
		Id: ids[i].split('|')[0]
	};

	var result = context.RevertEmbeddable(options);
	if (result && result.HasErrors())
		throw result.Errors[0].Message;

	this.embeddable = context.GetEmbeddable(options);
	embeddables.push({
		id: options,
		embeddable: this.embeddable,
		renderedEmbeddable: core_v2_widget.ExecuteFile('render-item.vm')
	});

	context_v2_scheduledFile.Report({ PercentComplete: i / ids.length });
}

var staged = context.ListEmbeddables({ PageSize: 1, PageIndex: 0, Staged: true });
if (staged && staged.HasErrors())
	throw staged.Errors[0].Message;

return {
	success: true,
	embeddables: embeddables,
	stagedCount: staged ? staged.TotalCount : 0
};
