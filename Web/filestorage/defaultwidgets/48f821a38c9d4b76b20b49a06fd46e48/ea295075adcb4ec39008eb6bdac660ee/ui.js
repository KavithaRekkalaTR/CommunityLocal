(function ($, global) {
	var button;
	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

    var model = {
        searchUsers: function(options, textbox, searchText) {
            window.clearTimeout(options.addMemberUserNameTimeout);
            if (searchText && searchText.length >= 2) {
                textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)]);

                var excludeUserIds = '';
                var count = textbox.glowLookUpTextBox('count');
                for (var i = 0; i < count; i++) {
                    var item = textbox.glowLookUpTextBox('getByIndex', i);
                    if (item) {
                        var v = item.Value.split(/:/);
                        if (v[0] == 'user') {
                            if (excludeUserIds != '')
                                {  excludeUserIds = excludeUserIds + ',' };
                            excludeUserIds = excludeUserIds + v[1];
                        }
                    }
                }

                options.addMemberUserNameTimeout = window.setTimeout(function () {
                    $.telligent.evolution.get({
                        url: options.lookupUsersUrl,
                        data: { w_SearchText: searchText, ExcludeUserIds: excludeUserIds },
                        success: function (response) {
                            if (response && response.matches.length > 1) {
                                var suggestions = [];
                                for (var i = 0; i < response.matches.length; i++) {
                                    var item = response.matches[i];
                                    if (item && item.userId) {
                                        if (item.alreadySelected) {
                                            suggestions.push(textbox.glowLookUpTextBox('createLookUp', 'user:' + item.userId, item.title, '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + options.text.alreadySelected + '</span></div>', false));
                                        }
                                        else {
                                            suggestions.push(textbox.glowLookUpTextBox('createLookUp', 'user:' + item.userId, item.title, item.preview, true));
                                        }
                                    }
                                }

                                textbox.glowLookUpTextBox('updateSuggestions', suggestions);
                            }
                            else
                                textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', options.text.noUsersMatch, options.text.noUsersMatch, false)]);
                        }
                    });
                }, 500);
            }
        }
    };

	var api = {
		register: function (options) {
            var wrapper = $.telligent.evolution.administration.panelWrapper();

            options.defaultUserFriends = $(options.defaultUserFriendsId);
            options.welcomeMessageFrom = $(options.welcomeMessageFromId);
            options.defaultModerationLevel = $(options.defaultModerationLevelId);
            options.welcomeMessageEnabled = $(options.welcomeMessageEnabledId);
            options.welcomeMessageSubject = $(options.welcomeMessageSubjectId);

            options.header = $($.telligent.evolution.template.compile(options.headerTemplate)({}));
            $.telligent.evolution.administration.header(options.header);

            options.defaultUserFriends = $(options.defaultUserFriends)
                .glowLookUpTextBox({
                    delimiter: ',',
                    maxValues: 20,
                    onGetLookUps: function(tb, searchText) {
                        model.searchUsers(options, tb, searchText);
                    },
                    emptyHtml: '',
                    selectedLookUpsHtml: []});

            if (options.values.userFriends.length > 0) {
                options.values.userFriends.forEach(function(user)
                {
                    var initialLookupValue = options.defaultUserFriends.glowLookUpTextBox('createLookUp',
                        'user:' + user.id,
                        user.name,
                        user.name,
                        true);
                    options.defaultUserFriends.glowLookUpTextBox('add', initialLookupValue);
                });
            }

            options.welcomeMessageFrom = $(options.welcomeMessageFrom)
                .glowLookUpTextBox({
                    delimiter: ',',
                    maxValues: 1,
                    onGetLookUps: function(tb, searchText) {
                        model.searchUsers(options, tb, searchText);
                    },
                    emptyHtml: '',
                    selectedLookUpsHtml: []});

            if (options.values.welcomeMessageFromUser.length > 0) {
                options.values.welcomeMessageFromUser.forEach(function(user)
                {
                    var initialLookupValue = options.welcomeMessageFrom.glowLookUpTextBox('createLookUp',
                        'user:' + user.id,
                        user.name,
                        user.name,
                        true);
                    options.welcomeMessageFrom.glowLookUpTextBox('add', initialLookupValue);
                });
            }

			button = $('a.save', $.telligent.evolution.administration.header());

			button.evolutionValidation({
                validateOnLoad: false,
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
                    var defaultModerationLevel = $(options.defaultModerationLevel).val();
                    var welcomeMessageEnabled =  options.welcomeMessageEnabled.is(":checked");
                    var welcomeMessageSubject = $(options.welcomeMessageSubject).val();

                    var defaultFriendUserIds = [];
					var count = $(options.defaultUserFriends).glowLookUpTextBox('count');
					for (var i = 0; i < count; i++) {
						(function () {
							var item = $(options.defaultUserFriends).glowLookUpTextBox('getByIndex', i);
							if (item) {
								var v = item.Value.split(/:/, 2);
								if (v[0] == 'user') {
									var userId = v[1];
									defaultFriendUserIds.push(userId);
								}
							}
						})();
                    }

                    var welcomeMessageFromUser = [];
					var count = $(options.welcomeMessageFrom).glowLookUpTextBox('count');
					for (var i = 0; i < count; i++) {
						(function () {
							var item = $(options.welcomeMessageFrom).glowLookUpTextBox('getByIndex', i);
							if (item) {
								var v = item.Value.split(/:/, 2);
								if (v[0] == 'user') {
									var userId = v[1];
									welcomeMessageFromUser.push(userId);
								}
							}
						})();
                    }

					if (options.editors.welcomeMessageBody) {
						var welcomeMessageBody = options.editors.welcomeMessageBody.getHtml();
					}


					$.telligent.evolution.post({
						url: options.saveUrl,
						data: {
                    		defaultUserFriends: defaultFriendUserIds.join(),
							defaultModerationLevel: defaultModerationLevel,
							welcomeMessageEnabled: welcomeMessageEnabled,
                            welcomeMessageFromUser: welcomeMessageFromUser.join(),
							welcomeMessageSubject: welcomeMessageSubject,
							welcomeMessageBody: welcomeMessageBody
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(options.text.saveSuccess);
					})

					return false;
				}
			});
        }
    };

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.newMemberExperience = api;

})(jQuery, window);
