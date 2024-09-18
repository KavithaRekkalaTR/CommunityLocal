(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
    if (typeof $.telligent.evolution.Ideation === 'undefined') { $.telligent.evolution.Ideation = {}; }
    if (typeof $.telligent.evolution.Ideation.widgets === 'undefined') { $.telligent.evolution.Ideation.widgets = {}; }

    var _save = function (context) {

        var tagString = '';
        if (context.tagBox.length > 0) {
            var inTags = context.tagBox.val().split(/[,;]/g);
            var tags = [];
            for (var i = 0; i < inTags.length; i++) {
                var tag = $.trim(inTags[i]);
                if (tag) {
                    tags[tags.length] = tag;
                }
            }

            tagString = tags.join(',');
        }

        var data = {
            IdeaId: context.ideaId
            , GroupId: context.groupId
            , AppId: context.appId
            , Body: context.getBodyContent()
            , CategoryId: $('#' + context.categoryId).val()
            , Tags: tagString
        };

        if (context.nameInput.length > 0) {
            data.Name = $(context.nameInput).evolutionComposer('val');
        }

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
                if(xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0)
					$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0],{type:'error'});
				else
					$.telligent.evolution.notifications.show(desc,{type:'error'});
                $('.processing', context.save.parent()).css("visibility", "hidden");
                context.save.removeClass('disabled');
            }
        });
    };

    $.telligent.evolution.Ideation.widgets.addEditIdea = {
        register: function (context) {

            context.tagBox.evolutionTagTextBox({ applicationId: context.applicationId });

            $(context.nameInput).evolutionComposer({
                plugins: ['hashtags'],
                contentTypeId: context.ideaContentTypeId
            }).evolutionComposer('onkeydown', function (e) {
                if (e.which === 13) {
                    return false;
                } else {
                    return true;
                }
            });

            context.save.on('click', function () {
                $(this).evolutionValidation('validate');
                if (!$(this).evolutionValidation('isValid')) {
                    context.save.addClass('disabled');
                    return;
                }
                _save(context);
            });

			$(context.cancelLink).on('click', function () {
				if (confirm(context.cancelConfirmationText)) {
				    $.telligent.evolution.navigationConfirmation.ignoreClick();
                    window.history.back();
				}
				return false;
			});

            $.telligent.evolution.navigationConfirmation.enable();
            $.telligent.evolution.navigationConfirmation.register(context.save);

            context.save.evolutionValidation({
                validateOnLoad: context.ideaId == '00000000-0000-0000-0000-000000000000' ? false : null,
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
                }
            });

            context.save.evolutionValidation('addField', context.nameInput,
                {
                    required: true,
                    messages: { required: context.nameRequiredMessage }
                },
                '#' + context.wrapperId + ' .field-item.idea-name .field-item-validation', null);

                $('#' + context.categoryId).on('change', context.save.evolutionValidation('addCustomValidation', 'requiredGroup', function () {
                    return context.requiresCategory != 'True' || $('#' + context.categoryId).val() != '';
		        },
				context.categoryRequiredMessage,
                '#' + context.wrapperId + ' .field-item.post-category .field-item-validation', null));

        }
    };

})(jQuery, window);