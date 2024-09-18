(function ($, global) {
	var headerList, button, deleteButton;

	var spinner = '<span class="ui-loading" width="48" height="48"></span>',
	searchGroups = function(context, textbox, searchText) {
		if(searchText && searchText.length >= 2) {

			textbox.glowLookUpTextBox('updateSuggestions', [
				textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
			]);

			$.telligent.evolution.get({
				url: context.urls.lookupGroups,
				data: {
					GroupNameFilter: searchText,
					Permission: 'Group_ReadGroup'
				},
				success: function(response) {
					if (response && response.Groups && response.Groups.length >= 1) {
						textbox.glowLookUpTextBox('updateSuggestions',
							$.map(response.Groups, function(group, i) {
								return textbox.glowLookUpTextBox('createLookUp', group.Id, group.Name, group.Name, true);
							}));
					} else {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', context.resources.noGroupsMatch, context.resources.noGroupsMatch, false)
						]);
					}
				}
			});
		}
	};

	function searchUsers(context, textbox, searchText) {
		window.clearTimeout(context.addMemberUserNameTimeout);
		if (searchText && searchText.length >= 2) {
            textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)]);

            var excludeUserIds = '';
            var count = textbox.glowLookUpTextBox('count');
            for (var i = 0; i < count; i++) {
                var item = textbox.glowLookUpTextBox('getByIndex', i);
                if (item) {
                    if (excludeUserIds != '')
                        {  excludeUserIds = excludeUserIds + ',' };
                        excludeUserIds = excludeUserIds + item.Value;
                }
            }

            context.addMemberUserNameTimeout = window.setTimeout(function () {
                $.telligent.evolution.get({
                    url: context.urls.lookupUsers,
                    data: { w_SearchText: searchText, ExcludeUserIds: excludeUserIds },
                    success: function (response) {
                        if (response && response.matches.length > 1) {
                            var suggestions = [];
                            for (var i = 0; i < response.matches.length; i++) {
                                var item = response.matches[i];
                                if (item && item.userId) {
                                    if (item.alreadySelected) {
                                        suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userId, item.title, '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.resources.alreadySelected + '</span></div>', false));
                                    }
                                    else {
                                        suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userId, item.title, item.preview, true));
                                    }
                                }
                            }

                            textbox.glowLookUpTextBox('updateSuggestions', suggestions);
                        }
                        else
                            textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', context.resources.noUsersMatch, context.resources.noUsersMatch, false)]);
                    }
                });
            }, 749);
        }
	}

	var api = {
		register: function (options) {
			$.telligent.evolution.administration.size('wide');

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

					var name = $(options.inputs.nameId).val();
					var appKey = $(options.inputs.webAddressId).val();

					var userIds = [];
					var count = options.inputs.owners.glowLookUpTextBox('count');
	                for (var i = 0; i < count; i++) {
	                    (function () {
	                        var item = options.inputs.owners.glowLookUpTextBox('getByIndex', i);
	                        if (item) {
                                userIds.push(item.Value);
	                        }
	                    })();
	                }

	                var owners = userIds.join();
					var description = options.getDescription();
					var groupId = parseInt($(options.inputs.groupId).val());
					var enabled = $(options.inputs.enabledId).prop("checked");
					var sitemap = $(options.inputs.sitemapId).prop("checked");
					var viewType = $(options.inputs.viewTypeId).val();

					var continueSave = true;
					if (groupId != options.groupId && options.hasPermissionOverrides == 'True')
					{
						continueSave = confirm(options.resources.moveWarning);
					}

					if(continueSave)
					{
						$.telligent.evolution.post({
							url: options.urls.save,
							data: {
								ApplicationId: applicationId,
								Name: name,
								Owners: owners,
								Description: description,
								AppKey: appKey,
								GroupId: groupId,
								Enabled: enabled,
								Sitemap: sitemap,
								ViewType: viewType
							}
						})
						.then(function(response) {
							$.telligent.evolution.notifications.show(options.resources.galleryUpdated);

							if ((options.groupId != -1 && groupId > 0 && options.groupId != groupId) || appKey != options.applicationKey) {
								window.location.href = response.redirectUrl;
							}
							else if (enabled == false && options.redirect == 'True') {
								window.location.href = options.urls.groupRedirect;
							}
						});
					}

					return false;
				}
			});

			button.evolutionValidation('addField', options.inputs.nameId, { required: true, maxlength: 256 }, '.field-item.name .field-item-validation');

			button.evolutionValidation('addField', options.inputs.webAddressId, { required: true, maxlength: 256 }, '.field-item.web-address .field-item-validation');
			button.evolutionValidation('addField', options.inputs.webAddressId, {
				required: true,
				pattern: /^[A-Za-z0-9_-]+$/,
				messages: {
					pattern: options.resources.addressPatternMessage
				}
			}, '.field-item.web-address .field-item-validation');

			if (options.canDelete == 'True') {
				deleteButton = $('a.delete', $.telligent.evolution.administration.panelWrapper());

				deleteButton.on('click', function () {
					if (window.confirm(options.resources.deleteConfirmation)) {
						$.telligent.evolution.del({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/galleries/' + options.galleryId + '.json',
							success: function (response) {
								window.location.href = options.urls.groupRedirect;
							}
						});
					}
					return false;
				});
			}

			var viewidentifiers = $('a.viewidentifiers', $.telligent.evolution.administration.panelWrapper());
			viewidentifiers.on('click', function () {
				$('li.identifiers', $.telligent.evolution.administration.panelWrapper()).each( function() {
					$(this).toggle();
				});

				return false;
			});

			options.inputs.group = $(options.inputs.groupId)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchGroups(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});

	        options.inputs.group.on('glowLookUpTextBoxChange', button.evolutionValidation('addCustomValidation', 'requiredGroup', function () {
		            return options.inputs.group.glowLookUpTextBox('count') > 0;
		        },
				options.resources.requiredText,
				'.field-item.group .field-item-validation',
				null));

			if (options.groupName && options.groupId > 0) {
				var initialLookupValue = options.inputs.group.glowLookUpTextBox('createLookUp',
					options.groupId,
					options.groupName,
					options.groupName,
					true);
				options.inputs.group.glowLookUpTextBox('add', initialLookupValue);
			};

			options.inputs.owners = $(options.inputs.ownersId)
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 20,
					onGetLookUps: function(tb, searchText) {
						searchUsers(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: []});

			if (options.owners.length > 0) {
				options.owners.forEach(function(user)
				{
					var initialLookupValue = options.inputs.owners.glowLookUpTextBox('createLookUp',
						user.id,
						user.name,
						user.name,
						true);
					options.inputs.owners.glowLookUpTextBox('add', initialLookupValue);
				});
			}
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.galleryOptionsManagement = api;

})(jQuery, window);