/*

StudioEditViewWrapperView:

Options:
	container
	template

Methods:
	setSaveState: function(saveState) (same states from editviewcontroller)

	//returns new container, already in dom for rendering a view into
	// can be removed later by the controller
	constructNewViewContainer: function()
	applyBottomMargin: function(margin);
*/
define('StudioEditViewWrapperView', function($, global, undef) {

	var saveStates = {
		Queued: 1,
		Saving: 2,
		Saved: 3
	};

	var defaults = {
		container: null,
		template: 'studioShell-editViewWrapper'
	};

	var StudioEditViewWrapperView = function(options){
		var context = $.extend({}, defaults, options || {});

		context.template = $.telligent.evolution.template(context.template);
		context.container.append(context.template({}));
		context.viewWrapper = context.container.find('.views');
		var savedIndicator = context.container.find('.save-state .saved');
		var notSavedIndicator = context.container.find('.save-state .not-saved');
		var queuedIndicator = context.container.find('.save-state .queued');

		return {
			setSaveState: function(state) {
				switch (state) {
					case saveStates.Queued:
						queuedIndicator.show();
						savedIndicator.hide();
						notSavedIndicator.hide();
						break;
					case saveStates.Saving:
						queuedIndicator.hide();
						savedIndicator.hide();
						notSavedIndicator.show();
						break;
					case saveStates.Saved:
					default:
						queuedIndicator.hide();
						savedIndicator.show();
						notSavedIndicator.hide();
				}
			},
			viewContainer: function() {
				return context.viewWrapper;
			}
		}
	};

	return StudioEditViewWrapperView;

}, jQuery, window);
