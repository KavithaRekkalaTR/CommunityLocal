(function($, global, undef) {

	var model = {
		update: function(context, options) {
			return $.telligent.evolution.post({
				url: context.updateUrl,
				dataType: 'json',
				data: options
			});
		}
	};

	var api = {
		register: function(context) {
			var header = $($.telligent.evolution.template.compile(context.saveTemplateId)({}));
			var saveButton = header.find('a.save');
			var enableAboutPage = $(context.inputs.enableAboutPage);
			enableAboutPage.on('change', function(){
				if(enableAboutPage.is(':checked')) {
					$.telligent.evolution.administration.panelWrapper().find('.field-item.title').show();
					$.telligent.evolution.administration.panelWrapper().find('.field-item.body').show();
				} else {
					$.telligent.evolution.administration.panelWrapper().find('.field-item.title').hide();
					$.telligent.evolution.administration.panelWrapper().find('.field-item.body').hide();
				}
			});

			$.telligent.evolution.administration.header(header);
			$.telligent.evolution.administration.size('wide');

			saveButton.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var updateOptions = {
						enableAboutPage: enableAboutPage.is(':checked'),
						aboutPageTitle: $(context.inputs.aboutPageTitle).val(),
						aboutPageBody: context.inputs.aboutPageBody()
					};

					model.update(context, updateOptions).then(function(){
						$.telligent.evolution.notifications.show(context.text.updateSuccess, { type: 'success' });
					});
				}
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.blogAboutApplicationPanel = api;

})(jQuery, window);
