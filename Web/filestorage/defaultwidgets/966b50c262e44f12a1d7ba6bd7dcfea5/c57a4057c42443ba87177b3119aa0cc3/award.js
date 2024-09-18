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
				url: context.urls.findUsers,
				data: {
					w_searchText: searchText
				},
				success: function(response) {
					if (response && response.matches.length > 1) {
						var suggestions = [];
						for (var i = 0; i < response.matches.length; i++) {
							var item = response.matches[i];
							if (item && item.userId) {
								var selectable = !item.hasAchievement && !selected[item.userId];
								suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.text.alreadyAwarded + '</span></div>', selectable));
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

	$.telligent.evolution.widgets.administrationAchievementsAward = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.fields.awardTo.glowLookUpTextBox({
				delimiter: ',',
				allowDuplicates: false,
				maxValues: 20,
				onGetLookUps: function(tb, searchText) {
					searchUsers(context, tb, searchText);
				},
				emptyHtml: context.text.userLookupPlaceholder,
				selectedLookUpsHtml: [],
				deleteImageUrl: ''});

            $.telligent.evolution.messaging.subscribe('achievement.awardto', function (data) {
                if (context.fields.awardTo.glowLookUpTextBox('count') == 0) {
                    $.telligent.evolution.notifications.show(context.text.noMembersSelected, {
                        type: 'error',
                        duration: 3000
                    });
                    return
                }

                if (!$(data.target).hasClass('disabled')) {
                    $(data.target).addClass('disabled');
					var successOccurred = false;

            		$.telligent.evolution.batch(function() {
    					for (var i = 0; i < context.fields.awardTo.glowLookUpTextBox('count'); i++) {
    						$.telligent.evolution.post({
    							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/achievement/{AchievementId}/user/{UserId}.json',
    							data: {
    								UserId: context.fields.awardTo.glowLookUpTextBox('getByIndex', i).Value,
    								AchievementId: context.achievementId
    							},
								success: function (data, status, request) { successOccurred = true; }
    						});
    					}
    				}, {
    					sequential: false
    				})
    				.then(function() {
						if(successOccurred == true)
							$.telligent.evolution.notifications.show(context.text.awardSuccessful, {
								type: 'success'
							});
    					$.telligent.evolution.administration.close();
    				})
    				.always(function() {
    					$(data.target).removeClass('disabled');
    				});
                }
        	});
		}
	};

}(jQuery, window));