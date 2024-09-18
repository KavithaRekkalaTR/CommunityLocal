(function($) {
    var _submitAbuseAppeal = function(context) {
		$.telligent.evolution.put({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/abuseappeals/{AppealId}.json',
			data: {
				AppealId: context.appealId,
				AuthorResponse: $(context.bodyInput).val(),
				AppealState: 'AuthorResponded'
			},
			success: function(response) {
                alert(context.successMessage);
                window.location.href = context.successUrl;
			}
		});
    },
    abuseAppeal = {
        register: function(context) {
            context.submitLink = $(context.submitLink);
			context.bodyInput = $(context.bodyInput);

            context.submitLink
                .evolutionValidation({
                    onValidated: function(isValid, buttonClicked, c) {
                        if (isValid)
                            context.submitLink.removeClass('disabled');
                        else
                            context.submitLink.addClass('disabled');
                    },
                    onSuccessfulClick: function(e) {
                        e.preventDefault();
                        $('.processing', context.submitLink.parent()).css("visibility", "visible");
                        context.submitLink.addClass('disabled');
                        _submitAbuseAppeal(context);
                    }
                })
                .evolutionValidation('addField', context.bodyInput, {
                    required: true,
                    messages: {
                        required: context.bodyRequiredText
                    }
                }, context.wrapper + ' .field-item.body .field-item-validation', null);

        }
    };

    $.telligent = $.telligent || {};
    $.telligent.evolution = $.telligent.evolution || {};
    $.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
    $.telligent.evolution.widgets.abuseAppeal = $.telligent.evolution.widgets.abuseAppeal || abuseAppeal;
})(jQuery);
