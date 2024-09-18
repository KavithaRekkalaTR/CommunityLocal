(function($, global, undef) {

	var administration = $.telligent.evolution.administration;

	function revertThemeOptions(context, options) {
		administration.loading(true);
		return $.telligent.evolution.post({
			url: context.revertOptionsCallbackUrl,
			data: {
				_w_id: context.themeId,
				_w_typeId: context.themeTypeId,
				_w_stage: options.stage,
				_w_revertPagesTo: options.revertPagesTo,
				_w_revertCustomPages: options.revertCustomPages,
				_w_revertHeadersTo: options.revertHeadersTo,
				_w_revertFootersTo: options.revertFootersTo,
				_w_revertThemeConfigurations: options.revertThemeConfigurations,
				_w_revertScopedProperties: options.revertScopedProperties
			}
		}).always(function(){ administration.loading(false) });
	}

	function init(context) {
		var content = administration.panelWrapper();
		var header = administration.header();

		// capture UI elements
		context.cancelButton = header.find('a.cancel');
		context.previewButton = header.find('a.preview');
		context.publishButton = header.find('a.publish');
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
			administration.close();
			return false;
		});

		context.previewButton.on('click', function(e){
			e.preventDefault();
			if($(this).hasClass('disabled')) {
				return false;
			}

			var selections = gatherSelections(context, true);

			revertThemeOptions(context, selections).then(function(r){
				$.telligent.evolution.messaging.publish('theme-preview', {
					typeId: context.themeTypeId,
					id: context.themeId
				});
			});

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

			revertThemeOptions(context, selections).then(function(r){
				administration.close();
			});

			return false;
		});
	}

	var api = {
		register: function(options) {
			var context = $.extend(options, {});

			var headerTemplate = $.telligent.evolution.template(context.revertOptionsHeaderTemplateId);
			var header = $(headerTemplate({}));

			$.telligent.evolution.administration.header(header);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			init(context);
			handleEvents(context);
		}
	}

	$.telligent.evolution.themes.themeAdministration.revertOptions = api;

})(jQuery, window);