(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

    function findUsers(context, textbox, searchText) {
		window.clearTimeout(context.lookupUserTimeout);
		if (searchText && searchText.length >= 2) {
			textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)]);
			context.lookupUserTimeout = window.setTimeout(function () {

				$.telligent.evolution.get({
					url: context.urls.lookupUsersUrl,
					data: { w_query: searchText },
					success: function (response) {
						if (response && response.matches.length > 1) {
							var suggestions = [];
							for (var i = 0; i < response.matches.length; i++) {
								var item = response.matches[i];
								if (item && item.userId) {
									suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userId, item.title, item.preview, true));
								}
							}

							textbox.glowLookUpTextBox('updateSuggestions', suggestions);
						}
						else
							textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', context.text.noUsersMatch, context.text.noUsersMatch, false)]);
					}
				});
			}, 500);
		}
	}

	function validate(context) {
	    if (context.fields.mergeToUser.glowLookUpTextBox('count') > 0) {
			context.mergeButton.removeClass('disabled');
		} else {
			context.mergeButton.addClass('disabled');
		}
	}

	$.telligent.evolution.widgets.membersMerge = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.mergeButton = context.headerWrapper.find('.merge');
			context.mergeButton.on('click', function() {
			    if (!context.mergeButton.hasClass('disabled')) {
			        if (global.confirm(context.text.verifyMerge)) {
    			        context.mergeButton.addClass('disabled');

                        var data ={
							UserId: context.userId,
							ReassignedUserId: context.fields.mergeToUser.glowLookUpTextBox('getByIndex', 0).Value,
							MergeToReassignedUser: true
						};

						$.telligent.evolution.del({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json',
							data: data
						})

							.then(function() {								
								$.telligent.evolution.notifications.show(context.text.mergeSuccessful, {
									type: 'success'
								});
								$.telligent.evolution.messaging.publish('membersearch.refresh', {});
								$.telligent.evolution.administration.close();
							})
							.always(function() {
								context.mergeButton.removeClass('disabled');
							});
			        }
			    }

			    return false;
			});

			context.fields.mergeToUser.glowLookUpTextBox({
			    maxValues: 1,
			    onGetLookUps: function(tb, query) {
			        findUsers(context, tb, query);
			    },
			    emptyHtml: context.text.userLookupPlaceholder
			})
			    .on('glowLookUpTextBoxChange', function() {
			        validate(context);
			    });
		}
	};

}(jQuery, window));
