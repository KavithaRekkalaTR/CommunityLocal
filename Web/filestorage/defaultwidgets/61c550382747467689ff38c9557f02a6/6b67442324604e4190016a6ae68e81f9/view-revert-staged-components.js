/*
RevertStagedComponentsView

options:
	template

methods:
	render(options)
		revertibleChildren
		onRevert: function(selections) {
			selections.revertStagedHeaders
			selections.revertStagedFooters
			selections.revertStagedPages
			selections.revertStagedFragments
		}
*/
define('RevertStagedComponentsView', function($, global, undef) {

	var defaults = {
		template: ''
	};

	var RevertStagedComponentsView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(options) {
				var content = $(context.template({ children: options.revertibleChildren }));

				content.on('click', '.button.cancel', function(e){
					e.preventDefault();
					$.glowModal.close();
					return false;
				});

				content.on('click', '.button.continue', function(e){
					e.preventDefault();
					$.glowModal.close();
					if(options.onRevert) {
						var selections = {};

						if(content.find('input[data-type="headers"]').is(':checked'))
							selections.revertStagedHeaders = true;
						if(content.find('input[data-type="footers"]').is(':checked'))
							selections.revertStagedFooters = true;
						if(content.find('input[data-type="pages"]').is(':checked'))
							selections.revertStagedPages = true;
						if(content.find('input[data-type="fragments"]').is(':checked'))
							selections.revertStagedFragments = true;

						options.onRevert(selections);
					}
					return false;
				})

				var modal = $.glowModal({
					title: context.title,
					html: content,
					width: 450,
					height: '100%'
				});
			}
		}
	};

	return RevertStagedComponentsView;

}, jQuery, window);
