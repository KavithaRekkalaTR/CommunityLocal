(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
    if (typeof $.telligent.evolution.Ideation === 'undefined') { $.telligent.evolution.Ideation = {}; }
    if (typeof $.telligent.evolution.Ideation.widgets === 'undefined') { $.telligent.evolution.Ideation.widgets = {}; }

    var _isDuplicateName = function (context) {
        if ($('#' + context.nameId).val() == '')
            return false;

        var isDuplicate = true;
        $.telligent.evolution.get({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/challenges.json',
            async: false,
            data: {
                GroupId: context.groupId,
                Name: $('#' + context.nameId).val()
            },
            success: function (response) {
                if (response.Challenges.length == 0)
                    isDuplicate = false;
                else if (response.Challenges[0].Id == context.appId)
                    isDuplicate = false;
                else
                    isDuplicate = true;
            }
        });

        return isDuplicate;
    },
    _save = function (context) {
        var data = {
            AppId: context.appId
                    , Name: $('#' + context.nameId).val()
                    , Description: $('#' + context.bodyId).val()
                    , GroupId: context.groupId
        };

        $.telligent.evolution.post({
            url: context.saveUrl,
            data: data,
            success: function (response) {
                if (response.Errors && response.Errors.length > 0) {
                    alert(response.Errors[0]);
                } else {
                    window.location = response.redirectUrl;
                }
            },
            error: function (xhr, desc, ex) {
                $.telligent.evolution.notifications.show(desc, { type: 'error' });
                context.save.removeClass('disabled');
            }
        });
    };


    $.telligent.evolution.Ideation.widgets.addEditChallenge = {
        register: function (context) {

            context.save.evolutionValidation({
                validateOnLoad: context.appId == '00000000-0000-0000-0000-000000000000' ? false : null,
                onValidated: function (isValid, buttonClicked, c) {
                    if (isValid) {
                        context.save.removeClass('disabled');
                    } else {
                        context.save.addClass('disabled');
                    }
                },
                onSuccessfulClick: function (e) {
                    e.preventDefault();
                    $('.processing', context.save.parent()).css("visibility", "visible");
                    context.save.addClass('disabled');
                    _save(context);
                }
            })
            .evolutionValidation('addField'
                , '#' + context.nameId
                , { required: true, messages: { required: context.nameRequiredMessage } }
                , '#' + context.wrapperId + ' .field-item.challenge-name .field-item-validation', null)
            .evolutionValidation('addCustomValidation'
                , '#' + context.nameId, function () {
                    return !_isDuplicateName(context);
                }
                , context.duplicateNameMessage
                , '#' + context.wrapperId + ' .field-item.challenge-name .field-item-validation', null);
        }
    };
})(jQuery, window);
