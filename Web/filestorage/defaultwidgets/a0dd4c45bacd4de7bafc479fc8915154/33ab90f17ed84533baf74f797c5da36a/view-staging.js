/*

StudioStagingView

	Raises Messages
		studio.view.staging.publish.all
		studio.view.staging.revert.all
		studio.view.staging.publish
		studio.view.staging.revert
	Options
		container
		template
	Methods
		render
			list of staged items
		list
			returns lists of staged item requests of all currently listed items

*/
define('StudioStagingView', function($, global, undef) {

	var defaults = {
		container: null,
		template: 'studioShell-staging'
	};

	function handleChanges(context) {
	}

	function initUi(context, stagedItems) {
		var viewModel = $.extend({}, {
			stagedItems: stagedItems
		});

		context.container.empty().append(context.template(viewModel));

		context.container.on('click','a.noneditable', function(e){
			e.preventDefault();

			alert($(e.target).data('uneditablemessage'));

			return false;
		})
	}

	var StudioStagingView = function(options){
		var context = $.extend({}, defaults, options || {});
		context.stagedCount = 0;

		context.template = $.telligent.evolution.template(context.template);

		return {
			render: function (items) {
				// refresh badge counts if effectively different
				if (items && (items.length !== context.stagedCount)) {
					$.telligent.evolution.administration.refreshBadges();
					context.stagedCount = items.length;
				}
				initUi(context, items);
				handleChanges(context);
			},
			list: function() {
				return context.container.find('.staged-item');
			}
		}
	};

	return StudioStagingView;

}, jQuery, window);
