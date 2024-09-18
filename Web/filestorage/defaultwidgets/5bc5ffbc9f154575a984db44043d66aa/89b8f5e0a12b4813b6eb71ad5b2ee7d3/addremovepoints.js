(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    var spinner = '<span class="ui-loading" width="48" height="48"></span>';
	function searchUsers(context, textbox, searchText) {
		if(searchText && searchText.length >= 2) {

			textbox.glowLookUpTextBox('updateSuggestions', [
				textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
			]);

			var selected = {};
			var count = textbox.glowLookUpTextBox('count');
			for (var i = 0; i < count; i++) {
				var item = textbox.glowLookUpTextBox('getByIndex', i);
				if (item) {
					selected[item.Value] = true;
				}
			}

			$.telligent.evolution.get({
				url: context.urls.findUsersUrl,
				data: {
					w_query: searchText
				},
				success: function(response) {
					if (response && response.matches.length > 1) {
						var suggestions = [];
						for (var i = 0; i < response.matches.length; i++) {
							var item = response.matches[i];
							if (item && item.userId) {
								var selectable = !item.alreadySelected && !selected[item.userId];
								suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.text.alreadySelected + '</span></div>', selectable));
							}
						}

						textbox.glowLookUpTextBox('updateSuggestions', suggestions);
					} else {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', context.text.noUsersMatchText, context.text.noUsersMatchText, false)
						]);
					}
				},
			});
		}
	}

    $.telligent.evolution.widgets.pointAdministrationAddRemovePoints = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.saveButton = context.headerWrapper.find('.addremovepoints');
			context.saveButton.evolutionValidation({
                onValidated: function(isValid, buttonClicked, c) {
                    if (isValid) {
                        context.saveButton.removeClass('disabled');
                    } else {
                        context.saveButton.addClass('disabled');
                    }
                },
                onSuccessfulClick: function(e) {
                    context.saveButton.addClass('disabled');

                    for (var i = 0; i < context.userToAdd.glowLookUpTextBox('count'); i++) {
                        $.telligent.evolution.get({
                            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json',
                            data: {
                                UserId: context.userToAdd.glowLookUpTextBox('getByIndex', i).Value
                            }
                        })
                        .done(function(response) {
                            $.telligent.evolution.post({
                                url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/pointtransactions.json',
                                data: {
                                    UserId: response.User.Id,
                                    Value: parseInt(context.fields.pointsToAdd.val(), 10),
                                    ContentId: response.User.ContentId,
                                    ContentTypeId: response.User.ContentTypeId,
                                    Description: context.fields.pointsReason.val()                            }
                            })
                            .then(function() {
                                $.telligent.evolution.notifications.show(context.text.addRemotePointsSuccessful, {
                                    type: 'success'
                                });
                                $.telligent.evolution.messaging.publish('entity.updated', {
                                    entity: 'User',
                                    properties: ['Points']
                                });
                                $.telligent.evolution.administration.close();
                            })
                            .always(function() {
                                context.saveButton.removeClass('disabled');
                            });
                        });
                    }

                    return false;
                }
            });

            context.saveButton.evolutionValidation('addField',
                '#' + context.fields.pointsReason.attr('id'),
                {
                    required: true
                },
                context.fields.pointsReason.closest('.field-item').find('.field-item-validation'), null);

            var validatePoints = context.saveButton.evolutionValidation(
                'addCustomValidation',
                'points',
                function() {
                    var points = context.fields.pointsToAdd.val();
                    if (points.length == 0) {
                        return false;
                    }
                    if (isNaN(parseInt(points, 10))) {
                        return false;
                    }
                    return true;
                },
                context.text.pointsRequired,
                context.fields.pointsToAdd.closest('.field-item').find('.field-item-validation'),
                null
                );

            context.fields.pointsToAdd.on('input', function() {
                validatePoints();
            });

            context.userToAdd = $(context.fields.user)
                .glowLookUpTextBox({
                    delimiter: ',',
                    allowDuplicates: false,
                    maxValues: 1,
                    onGetLookUps: function(tb, searchText) {
                        searchUsers(context, tb, searchText);
                    },
                    emptyHtml: context.text.userLookupPlaceholder,
                    selectedLookUpsHtml: [],
                    deleteImageUrl: ''});
		}
	};

}(jQuery, window));