define('StudioScriptConsoleDockView', [
	'StudioScriptConsole',
	'StudioApiDataModelProvider' ],
function(StudioScriptConsole,
	StudioApiDataModelProvider,
	$, global, undef) {

	var defaults = {
		consoleTemplate: 'studioShell-scriptConsole',
		consoleLogEntryTemplate: 'studioShell-scriptConsoleLogEntry',
		name: 'Script Console',
		onGetSettings: function() {},
		getAutoCompleteSuggestions: function(mode, prefix, settings) {
			return StudioApiDataModelProvider.model().listSuggestions({
				prefix: prefix,
				mode: mode,
				completeFullMemberSignature: ((!settings || settings.completeFullMemberSignature === undef) ? true : settings.completeFullMemberSignature)
			});
		},
		onEvaluate: function(input, mode) {
			return StudioApiDataModelProvider.model().evaluate({
				input: input,
				mode: mode
			});
		},
		onNavigateRight: function(editor) {
		}
	};

	function StudioScriptConsoleDockView(options) {

		var context = $.extend({}, defaults, options || {});

		return {
			id: 'script_console',
			name: context.name,
			render: function (options) {
				context.renderOptions = options;
				return $.Deferred(function(d){
					d.resolve();
				}).promise();
			},
			cleanup: function() {},
			setEditorTabState: function(requestState) {},
			hidden: function () {},
			shown: function () {
				if (!context.scriptConsole) {
					context.scriptConsole = new StudioScriptConsole({
						container: context.renderOptions.container,
						consoleTemplate: $.telligent.evolution.template(context.consoleTemplate),
						consoleLogEntryTemplate: $.telligent.evolution.template(context.consoleLogEntryTemplate),
						onEvaluate: context.onEvaluate,
						onGetSettings: context.onGetSettings,
						getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
						onNavigateRight: context.onNavigateRight
					});
					if(context.afterRender) {
						context.afterRender();
					}
				}
			},
			resized: function () {
				if (context.scriptConsole) {
					context.scriptConsole.resize();
				}
			},
			updateEditorSettings: function(settings) {
				if(context.scriptConsole) {
					context.scriptConsole.updateEditorSettings(settings);
				} else {
					context.afterRender = function() {
						setTimeout(function(){
							context.scriptConsole.updateEditorSettings(settings);
						}, 150);
					}
				}
			}
		}
	}

	return StudioScriptConsoleDockView;

}, jQuery, window);
