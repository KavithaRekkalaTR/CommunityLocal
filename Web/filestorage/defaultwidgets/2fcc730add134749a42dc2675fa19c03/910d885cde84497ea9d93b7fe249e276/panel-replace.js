(function($, global, undef) {

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function listFragments(context, options) {
		return $.telligent.evolution.post({
			url: context.listFragmentsCallbackUrl,
			data: options
		});
	}

	var api = {
		register: function(options) {
			var context = $.extend(options, {
				fragmentSelect: $(options.fragmentSelect),
				themeSelect: $(options.themeSelect)
			});

			var headerTemplate = $.telligent.evolution.template(context.headerTemplateId)
			var header = $(headerTemplate({}));
			context.saveButton = header.find('a.button');

			$.telligent.evolution.administration.header(header);

			context.fragmentSelect.on('change', function() {
				var selectedFragmentId = context.fragmentSelect.val();
				var selectedThemeId = context.themeSelect.val();
				var wrapper = context.fragmentSelect.closest('ul');

				wrapper.children('div.fragment-configuration-form').remove();

				if (!selectedFragmentId) {
					context.saveButton.addClass('disabled');
					return;
				}

				context.saveButton.removeClass('disabled');

				$.telligent.evolution.post({
					url: context.configurationCallbackUrl,
					data: {
						fragmentId: selectedFragmentId,
						themeId: selectedThemeId
					}
				}).then(function(response) {
					$.telligent.evolution.ui.defer(wrapper, function(){
						var wrappedForm = $('<div class="fragment-configuration-form"></div>').append(response.form);
						wrapper.append(wrappedForm);
					});
				});
			});

			context.saveButton.on('click', function() {
				if ($(this).hasClass('disabled'))
					return false;

				var fragmentConiguration = context.getConfigurationValues();
				var serializedFragmentConfiguration = (fragmentConiguration != null ? $.telligent.evolution.url.serializeQuery(fragmentConiguration) : '');

				$.telligent.evolution.widgets.fragmentAdministration.loadWithProgress($.telligent.evolution.post({
					url: context.replaceCallbackUrl,
					data: {
						_fromFragmentId: context.fragmentId,
						_toFragmentId: context.fragmentSelect.val(),
						_themeId: context.themeSelect.val(),
						_configuration: serializedFragmentConfiguration
					}
				})).then(function(response){
					$.telligent.evolution.administration.close();
					$.telligent.evolution.notifications.show(context.replacedMessage);
					global.open(response.result.Model, '_blank');
				});

				return false;
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.fragmentAdministration.replacement = api;

})(jQuery, window);