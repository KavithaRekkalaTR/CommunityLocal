/*
RevertOptionsView

options:
	template

methods:
	render
*/
define('RevertOptionsView', function($, global, undef) {

	var defaults = {
		template: '',
		revertConfirmation: 'Are you sure?'
	};

	function init(context) {
		var content = $(context.template({}));

		// capture UI elements
		context.cancelButton = content.find('a.button.cancel');
		context.previewButton = content.find('a.button.preview');
		context.publishButton = content.find('a.button.publish');
		context.checkboxes = content.find('input[type="checkbox"]');

		context.enableRevertPages = content.find('input.pages');
		context.revertPages = content.find('select.pages-revert');
		context.revertPagesTo = content.find('select.pages-revertto');

		context.enableRevertHeaders = content.find('input.headers');
		context.revertHeadersTo = content.find('select.headers-revertto');

		context.enableRevertFooters = content.find('input.footers');
		context.revertFootersTo = content.find('select.footers-revertto');

        context.enableRevertThemeConfigurations = content.find('input.themeconfiguration');
		context.enableRevertScopedProperties = content.find('input.scopedproperties');

		// disable selects by default
		content.find('select').prop('disabled', true);

		// disable submits by default
		enableSubmit(context, false);

		context.modal = $.glowModal({
			title: context.title,
			html: content,
			width: 640,
			height: '100%'
		});
	}

	function enableSubmit(context, enable) {
		if(enable) {
			context.previewButton.removeClass('disabled');
			context.publishButton.removeClass('disabled');
		} else {
			context.previewButton.addClass('disabled');
			context.publishButton.addClass('disabled');
		}
	}

	function gatherSelections(context, shouldStage) {
		var selections = {
			stage: shouldStage
		}

		if (context.enableRevertPages.is(':checked')) {
			selections.revertPagesTo = context.revertPagesTo.val();
			selections.revertCustomPages = context.revertPages.val() == 'platform-custom';
		}

		if (context.enableRevertHeaders.is(':checked')) {
			selections.revertHeadersTo = context.revertHeadersTo.val();
		}

		if (context.enableRevertFooters.is(':checked')) {
			selections.revertFootersTo = context.revertFootersTo.val();
		}
		
		if (context.enableRevertThemeConfigurations.is(':checked')) {
		    selections.revertThemeConfigurations = true;
		}

		if (context.enableRevertScopedProperties.is(':checked')) {
			selections.revertScopedProperties = true;
		}

		return selections;
	}

	function handleEvents(context) {
		// handle checkbox enablement
		context.checkboxes.on('change', function(e){
			var descendents = $(this).closest('li').find('select');
			if($(this).is(':checked')) {
				descendents.prop('disabled', false);
			} else {
				descendents.prop('disabled', true);
			}

			if(context.checkboxes.filter(function() { return $(this).is(':checked'); }).length > 0) {
				enableSubmit(context, true);
			} else {
				enableSubmit(context, false);
			}
		});

		context.cancelButton.on('click', function(e){
			e.preventDefault();
			$.glowModal.close();
			return false;
		});

		context.previewButton.on('click', function(e){
			e.preventDefault();
			if($(this).hasClass('disabled')) {
				return false;
			}

			var selections = gatherSelections(context, true);

			$.glowModal.close();

			if(context.onProcess) {
				context.onProcess(selections);
			}

			return false;
		});

		context.publishButton.on('click', function(e){
			e.preventDefault();
			if($(this).hasClass('disabled')) {
				return false;
			}

			if(!confirm(context.revertConfirmation))
				return false;

			var selections = gatherSelections(context, false);

			$.glowModal.close();

			if(context.onProcess) {
				context.onProcess(selections);
			}

			return false;
		});
	}

	var RevertOptionsView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(options) {
				if(options && options.onProcess) {
					context.onProcess = options.onProcess;
				}
				init(context);
				handleEvents(context);
			}
		}
	};

	return RevertOptionsView;

}, jQuery, window);