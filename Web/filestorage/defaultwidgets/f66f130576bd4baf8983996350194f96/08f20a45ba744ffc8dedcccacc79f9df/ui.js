(function ($, global) {
	var headerList, button;

	var api = {
		register: function (options) {
            var wrapper = $.telligent.evolution.administration.panelWrapper();

            options.signatureMaxLength =  $(options.signatureMaxLengthId);
            options.statusMessageMaxLength = $(options.statusMessageMaxLengthId);
            options.allowSignatures = $(options.allowSignaturesId);
            options.displaySignatures =  $(options.displaySignaturesId);
            options.enableDisplayNames = $(options.enableDisplayNamesId);
            options.enableConversations = $(options.enableConversationsId);
            options.enablePresenceTracking =  $(options.enablePresenceTrackingId);
            options.allowMemberPresenceToggle = $(options.allowMemberPresenceToggleId);
            options.presenceTrackingDefault = $(options.presenceTrackingDefaultId);
            options.requireEmailVerification = $(options.requireEmailVerificationId);

            options.header = $($.telligent.evolution.template.compile(options.headerTemplate)({}));
            $.telligent.evolution.administration.header(options.header);                

			button = $('a.save', $.telligent.evolution.administration.header());

			button.evolutionValidation({
                validateOnLoad: false,
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
                    var allowSignatures = options.allowSignatures.is(":checked");
                    var displaySignatures = options.displaySignatures.is(":checked");
                    var enableDisplayNames = options.enableDisplayNames.is(":checked");
                    var enableConversations = options.enableConversations.is(":checked");
                    var enablePresenceTracking = options.enablePresenceTracking.is(":checked");
                    var allowMemberPresenceToggle = options.allowMemberPresenceToggle.is(":checked");
                    var presenceTrackingDefault = options.presenceTrackingDefault.is(":checked");
                    var requireEmailVerification = options.requireEmailVerification.is(":checked");
					var signatureMaxLength = $(options.signatureMaxLength).val();
					var statusMessageMaxLength = $(options.statusMessageMaxLength).val();

					$.telligent.evolution.post({
						url: options.saveUrl,
						data: {
							allowSignatures: allowSignatures,
							displaySignatures: displaySignatures,
							enableDisplayNames: enableDisplayNames,
							enableConversations: enableConversations,
							enablePresenceTracking: enablePresenceTracking,
							allowMemberPresenceToggle: allowMemberPresenceToggle,
							presenceTrackingDefault: presenceTrackingDefault,
							requireEmailVerification: requireEmailVerification,
							signatureMaxLength: signatureMaxLength,
							statusMessageMaxLength: statusMessageMaxLength
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(options.text.saveSuccess);
					})

					return false;
				}
			})
            .evolutionValidation('addField', options.signatureMaxLengthId, { required: true, digits: true }, wrapper.find('.signature-max-length input').closest('.field-item').find('.field-item-validation'), null)
            .evolutionValidation('addField', options.statusMessageMaxLengthId, { required: true, digits: true }, wrapper.find('.status-message-length input').closest('.field-item').find('.field-item-validation'), null);

		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.membershipOptions = api;

})(jQuery, window);
