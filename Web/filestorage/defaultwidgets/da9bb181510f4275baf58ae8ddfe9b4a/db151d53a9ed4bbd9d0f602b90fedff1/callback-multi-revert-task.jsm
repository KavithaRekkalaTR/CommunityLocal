var themes = [];
var options = (core_v2_widget.GetExecutionParameterValue('Ids') || '').split(',').map(function(id) {
	return {
		Id: id.split('|')[0],
		TypeId: id.split('|')[1]
	}
});

var hasStagingDirectives = false;
if (core_v2_widget.GetExecutionParameterValue('RevertStagedPages'))
	hasStagingDirectives = true;
if (core_v2_widget.GetExecutionParameterValue('RevertStagedHeaders'))
	hasStagingDirectives = true;
if (core_v2_widget.GetExecutionParameterValue('RevertStagedFooters'))
	hasStagingDirectives = true;
if (core_v2_widget.GetExecutionParameterValue('RevertStagedFragments'))
	hasStagingDirectives = true;

// collect revertible children details, if any
var hasRevertibleChildren = false;
var stagedPages = 0;
var stagedHeaders = 0;
var stagedFooters = 0;
var stagedFragments = 0;
for (var i = 0; i < options.length; i++) {
	if (context_v2_scheduledFile.IsCancellationRequested)
		throw 'Revert Cancelled';

	var revertibleChildren = context.GetRevertibleChildState(options[i]);
	if (revertibleChildren && revertibleChildren.HasErrors())
		throw revertibleChildren.Errors[0].Message;

	if (revertibleChildren && revertibleChildren.HasStagedChildren) {
		hasRevertibleChildren = true;
		stagedPages += revertibleChildren.StagedPages;
		stagedHeaders += revertibleChildren.StagedHeaders;
		stagedFooters += revertibleChildren.StagedFooters;
		stagedFragments += revertibleChildren.StagedFragments;
	}
}

if (!hasRevertibleChildren || hasRevertibleChildren) {
	for (var i = 0; i < options.length; i++) {
		if (context_v2_scheduledFile.IsCancellationRequested)
			throw 'Revert Cancelled';

		options[i].RevertStagedPages = core_v2_widget.GetExecutionParameterValue('RevertStagedPages');
		options[i].RevertStagedHeaders = core_v2_widget.GetExecutionParameterValue('RevertStagedHeaders');
		options[i].RevertStagedFooters = core_v2_widget.GetExecutionParameterValue('RevertStagedFooters');
		options[i].RevertStagedFragments = core_v2_widget.GetExecutionParameterValue('RevertStagedFragments');
		var result = context.RevertTheme(options[i]);

		if (result && result.HasErrors())
			throw result.Errors[0].Message;

		this.theme = context.GetTheme(options[i]);
		themes.push({
			id: options[i],
			theme: this.theme,
			renderedTheme: core_v2_widget.ExecuteFile('render-item.vm')
		});

		context_v2_scheduledFile.Report({ PercentComplete: i / options.length });
	}
}

var staged = context.ListThemes({ PageSize: 1, PageIndex: 0, Staged: true });
if (staged && staged.HasErrors())
	throw staged.Errors[0].Message;

var result = {
	themes: themes,
	stagedCount: staged ? staged.TotalCount : 0
}

if (hasRevertibleChildren && !hasStagingDirectives) {
	result.revertibleChildren = {
		StagedPages: stagedPages,
		StagedHeaders: stagedHeaders,
		StagedFooters: stagedFooters,
		StagedFragments: stagedFragments
	};
	result.success = false;
} else {
	result.success = true;
}

return result;
