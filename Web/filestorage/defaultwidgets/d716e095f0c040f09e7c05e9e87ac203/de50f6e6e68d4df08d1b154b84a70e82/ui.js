(function ($, global) {
	var headerList, button;

	var api = {
		register: function (options) {

			headerList = $('<ul class="field-list"></ul>')
				.append(
					$('<li class="field-item"></li>')
						.append(
							$('<span class="field-item-input"></span>')
								.append(
									$('<a href="#"></a>')
										.addClass('button save')
										.text(options.resources.save)
						)
					)
				);

			$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(headerList));

			button = $('a.save', $.telligent.evolution.administration.header());

			button.evolutionValidation({
				validateOnLoad: $(options.inputs.nameId).val() != '',
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var applicationId = options.applicationId;
					var enableRssSyndication = $(options.inputs.enableRssSyndicationId).prop("checked");

					$.telligent.evolution.post({
						url: options.urls.save,
						data: {
							ApplicationId: applicationId,
							EnableRssSyndication: enableRssSyndication
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(options.resources.galleryUpdated);
					});

					return false;
				}
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.gallerySyndicationPanel = api;

})(jQuery, window);
