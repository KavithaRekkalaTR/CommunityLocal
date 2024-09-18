(function($, global, undef) {

	function saveConfiguredAutomation(context, options) {
		return $.telligent.evolution.post({
			url: context.saveCallbackUrl,
			data: options
		});
	}

	var api = {
		register: function(options) {

			var context = $.extend(options, {
				nameInput: $(options.nameInputId),
				automationSelect: $(options.configuredAutomationTypeSelectId),
				enabledInput: $(options.enabledInputId),
				unselectableMessage: $(options.unselectableMessageId)
			});

			var headerTemplate = $.telligent.evolution.template(context.saveTemplateId);
			var header = $(headerTemplate({}));
			var saveButton = header.find('a.button');

			$.telligent.evolution.administration.header(header);

			saveButton.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
					if (isValid) {
						saveButton.removeClass('disabled');
					} else {
						saveButton.addClass('disabled');
					}
				},
				onSuccessfulClick: function(e) {
					e.preventDefault();

					saveButton.addClass('disabled').prop('disabled', true);

					var configurationData = context.getAutomationConfigurationValues();

					saveConfiguredAutomation(context, {
						id: context.configuredAutomationId,
						name: context.nameInput.val(),
						description: context.getDescriptionValue(),
						enabled: context.enabledInput.prop('checked'),
						automationId: context.automationSelect.val().split(':')[0],
						automationConfiguration: (configurationData != null ? $.telligent.evolution.url.serializeQuery(configurationData) : '')
					}).then(function(response){
						if (response.isNew) {
							$.telligent.evolution.messaging.publish('configuredautomation-created', response);
						} else {
							$.telligent.evolution.messaging.publish('configuredautomation-edited', response);
						}
					}, function() {
						saveButton.removeClass('disabled').prop('disabled', false);
					});

					return false;
				}
			});

			saveButton.evolutionValidation('addField', context.nameInput,
				{ required: true },
				'.field-item.name .field-item-validation', null);

			saveButton.evolutionValidation('addField', context.automationSelect,
				{ required: true },
				'.field-item.type .field-item-validation', null);

			context.automationSelect.on('change', function() {
				var selectedAutomationId = context.automationSelect.val().split(':')[0];
				var data = context.getAutomationConfigurationValues();
				var wrapper = context.automationSelect.closest('ul');
				var selectable = context.automationSelect.val().length == 0 || context.automationSelect.val().split(':')[1] == "1";

				if (selectable) {
					context.unselectableMessage.hide();
				} else {
					context.unselectableMessage.show();
				}

				wrapper.children('div.automation-configuration-form').remove();

				if (!selectedAutomationId)
					return;

				$.telligent.evolution.post({
					url: context.configurationCallbackUrl,
					data: {
						automationId: selectedAutomationId
					}
				}).then(function(response) {
					$.telligent.evolution.ui.defer(wrapper, function(){
						var wrappedForm = $('<div class="automation-configuration-form"></div>').append(response.form);
						wrapper.append(wrappedForm);
					});
				});
			});
		}
	}

	$.telligent.evolution.widgets.automationAdministration.addEdit = api;

})(jQuery, window);