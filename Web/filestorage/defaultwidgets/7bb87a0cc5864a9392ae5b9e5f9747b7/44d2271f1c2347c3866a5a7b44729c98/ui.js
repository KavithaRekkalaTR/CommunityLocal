(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
    if (typeof $.telligent.evolution.Ideation === 'undefined') { $.telligent.evolution.Ideation = {}; }
    if (typeof $.telligent.evolution.Ideation.widgets === 'undefined') { $.telligent.evolution.Ideation.widgets = {}; }

    var _save = function (context) {

        var notes = context.getNotesContent();

        var data = {
            Status: $('#' + context.statusId).val(),
            Note: notes,
            IdeaId: context.ideaId
        };

        if (context.ideaStatusId <= 0) {
            return $.telligent.evolution.post({
    			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/status.json',
    			data: data
    		});
        } else {
            data.IdeaStatusId = context.ideaStatusId;
            return $.telligent.evolution.put({
    			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/status.json',
    			data: data
    		});
        }
    };

    $.telligent.evolution.Ideation.widgets.addEditIdeaStatus = {
        register: function (context) {
            $.telligent.evolution.navigationConfirmation.enable();
            $.telligent.evolution.navigationConfirmation.register(context.save);

            $('#' + context.showLessId).find('a').on('click', function() {
                $(this).closest('#' + context.showLessId).hide();
                $(this).closest('.content').find('#' + context.showMoreId).show();
            });

            $('#' + context.showMoreId).find('a').on('click', function() {
                $(this).closest('#' + context.showMoreId).hide();
                $(this).closest('.content').find(('#' + context.showLessId)).show();
            });

            context.save.evolutionValidation({
                validateOnLoad: context.ideaStatusId <= 0 ? false : null,
                onValidated: function (isValid, buttonClicked, c) {
                    if (isValid) {
                        context.save.removeClass('disabled');
                    } else {
                        context.save.addClass('disabled');
                    }
                },
                onSuccessfulClick: function (e) {
                    $('.processing', context.save.parent()).css("visibility", "visible");
                    context.save.addClass('disabled');

                _save(context)
                    .then(function() {
                        window.location = context.successUrl;
                    })
                    .catch(function() {
                        $('.processing', context.save.parent()).css('visibility', 'hidden');
                        context.save.removeClass('disabled');
                    });
                }
            });
        }
    };

})(jQuery, window);
