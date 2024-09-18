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

					var moderate = $(options.inputs.moderateId).prop("checked");
					var enableFileNotifications = $(options.inputs.enableFileNotificationsId).prop("checked");
					var enableRatings = $(options.inputs.enableRatingsId).prop("checked");
					var enableComments = $(options.inputs.enableCommentsId).prop("checked");
					var moderateComments = $(options.inputs.moderateCommentsId).prop("checked");
					var enableCommentNotifications = $(options.inputs.enableCommentNotificationsId).prop("checked");
					var enableExternalLinks = $(options.inputs.enableExternalLinksId).prop("checked");
					var enableDisclaimer = $(options.inputs.enableDisclaimerId).prop("checked");
					var allowedFileExtensions = $(options.inputs.allowedFileExtensionsId).val();
					var restrictedFileExtensions = $(options.inputs.restrictedFileExtensionsId).val();

					$.telligent.evolution.post({
						url: options.urls.save,
						data: {
							ApplicationId: applicationId,
							Moderate: moderate,
							EnableFileNotifications: enableFileNotifications,
							EnableRatings: enableRatings,
							EnableComments: enableComments,
							ModerateComments: moderateComments,
							EnableCommentNotifications: enableCommentNotifications,
							EnableExternalLinks: enableExternalLinks,
							EnableDisclaimer: enableDisclaimer,
							AllowedFileExtensions: allowedFileExtensions,
							RestrictedFileExtensions: restrictedFileExtensions
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(options.resources.galleryUpdated);

						$.telligent.evolution.administration.refresh();
					})

					return false;
				}
			});

		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.galleryFileOptionsPanel = api;

})(jQuery, window);
