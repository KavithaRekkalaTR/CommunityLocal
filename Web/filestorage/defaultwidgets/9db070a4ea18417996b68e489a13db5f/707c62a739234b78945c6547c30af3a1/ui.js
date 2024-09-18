(function($, global, undef) {

	var model = {
		update: function(context, options) {
			return $.telligent.evolution.post({
				url: context.updateUrl,
				dataType: 'json',
				data: options
			});
		},
		del: function(blogId) {
			return $.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{blogId}.json',
				data: {
					blogId: blogId
				}
			});
		},
		searchGroups: function(context, textbox, searchText) {
			if(searchText && searchText.length >= 2) {

				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
				]);

				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups.json',
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
								textbox.glowLookUpTextBox('createLookUp', '', context.text.noGroupsMatch, context.text.noGroupsMatch, false)
							]);
						}
					}
				});
			}
		},
		searchUsers: function(context, textbox, searchText) {
			window.clearTimeout(context.addMemberUserNameTimeout);
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

				context.addMemberUserNameTimeout = window.setTimeout(function () {
					$.telligent.evolution.get({
						url: context.lookupUsersUrl,
						data: { w_SearchText: searchText, ExcludeUserIds: excludeUserIds },
						success: function (response) {
							if (response && response.matches.length > 1) {
								var suggestions = [];
								for (var i = 0; i < response.matches.length; i++) {
									var item = response.matches[i];
									if (item && item.userId) {
										if (item.alreadySelected) {
											suggestions.push(textbox.glowLookUpTextBox('createLookUp', 'user:' + item.userId, item.title, '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.text.alreadySelected + '</span></div>', false));
										}
										else {
											suggestions.push(textbox.glowLookUpTextBox('createLookUp', 'user:' + item.userId, item.title, item.preview, true));
										}
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
	};

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	var api = {
		register: function(context) {
			$.telligent.evolution.administration.size('wide');

			var header = $($.telligent.evolution.template.compile(context.saveTemplateId)({}));
			$.telligent.evolution.administration.header(header);

			var viewidentifiers = $('a.viewidentifiers', $.telligent.evolution.administration.panelWrapper());
			viewidentifiers.on('click', function () {
				$('li.identifiers', $.telligent.evolution.administration.panelWrapper()).each( function() {
					$(this).toggle();
				});

				return false;
			});

			var enableContactInput = $(context.inputs.enableContact);
			enableContactInput.on('change', function () {
				$('li.contact-address', $.telligent.evolution.administration.panelWrapper()).toggle();
			});

			var saveButton = header.find('a.save');

			saveButton.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var groupId = parseInt($(context.inputs.group).val());
					var continueSave = true;
					if (groupId != context.groupId && context.hasPermissionOverrides) {
						continueSave = confirm(context.text.moveWarning);
					}

					var enabled = $(context.inputs.enable).is(':checked');
					var appKey =  $(context.inputs.address).val();

					var userIds = [];
					var count = $(context.inputs.authors).glowLookUpTextBox('count');
					for (var i = 0; i < count; i++) {
						(function () {
							var item = $(context.inputs.authors).glowLookUpTextBox('getByIndex', i);
							if (item) {
								var v = item.Value.split(/:/, 2);
								if (v[0] == 'user') {
									var userId = v[1];
									userIds.push(userId);
								}
							}
						})();
					}

					var enableContact = $(context.inputs.enableContact).is(':checked');
					var contactEmailAddress = $(context.inputs.contactEmailAddress).val();

					var updateOptions = {
						id: context.blogId,
						name: $(context.inputs.name).val(),
						description: context.getDescription(),
						address: appKey,
						enable: enabled,
						authors: userIds.join(),
						enableAggBugs: $(context.inputs.enableAggBugs).is(':checked'),
						includeInSiteMap: $(context.inputs.includeInSiteMap).is(':checked'),
						includeInAggregate: $(context.inputs.includeInAggregate).is(':checked'),
						groupId: groupId,
						enableContact: enableContact
					};

					if(context.mailGatewayEnabled) {
						updateOptions.mailingListEnabled = $(context.inputs.mailingListEnabled).is(':checked');
					}

					if(enableContact)
						updateOptions.contactEmailAddress = contactEmailAddress;

					if(continueSave) {
						model.update(context, updateOptions).then(function(response){
							$.telligent.evolution.notifications.show(context.text.updateSuccess, { type: 'success' });

							if ((context.groupId != -1 && groupId > 0 && context.groupId != groupId) || appKey != context.applicationKey) {
								window.location.href = response.redirectUrl;
							}
							else if (!enabled && context.redirect) {
								window.location.href = context.groupRedirect;
							} else if (!context.mailingListEnabled && updateOptions.mailingListEnabled) {
								// if the mailing list was just enabled, refresh panel to load and show email address
								$.telligent.evolution.administration.refresh();
							}
						});
					}
				}
			})
			.evolutionValidation('addField', $(context.inputs.name), { required: true, maxlength: 256 }, $(context.inputs.name).closest('.field-item').find('.field-item-validation'), null)
			.evolutionValidation('addField', context.inputs.contactEmailAddress, { email: true }, '.field-item.contact-address .field-item-validation')

			.evolutionValidation('addField', $(context.inputs.address), { required: true, maxlength: 256 }, $(context.inputs.address).closest('.field-item').find('.field-item-validation'), null)
			.evolutionValidation('addField', $(context.inputs.address), {
				required: true,
				pattern: /^[A-Za-z0-9_-]+$/,
				messages: {
					pattern: context.text.addressPatternMessage
				}
			}, $(context.inputs.address).closest('.field-item').find('.field-item-validation'), null);

			context.inputs.group = $(context.inputs.group)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						model.searchGroups(context, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});

			if (context.groupName && context.groupId > 0) {
				var initialLookupValue = context.inputs.group.glowLookUpTextBox('createLookUp',
					context.groupId,
					context.groupName,
					context.groupName,
					true);
				context.inputs.group.glowLookUpTextBox('add', initialLookupValue);
			};

			context.inputs.group.on('glowLookUpTextBoxChange',
					saveButton.evolutionValidation('addCustomValidation', 'requiredGroup', function () {
						return context.inputs.group.glowLookUpTextBox('count') > 0;
					},
					context.text.requiredText,
					'.field-item.group .field-item-validation',
					null));

			context.inputs.authors = $(context.inputs.authors)
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 20,
					onGetLookUps: function(tb, searchText) {
						model.searchUsers(context, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: []});

			if (context.authors.length > 0) {
				context.authors.forEach(function(user)
				{
					var initialLookupValue = context.inputs.authors.glowLookUpTextBox('createLookUp',
						'user:' + user.id,
						user.name,
						user.name,
						true);
					context.inputs.authors.glowLookUpTextBox('add', initialLookupValue);
				});
			}

			$.telligent.evolution.messaging.subscribe('contextual-delete', function(){
				if(confirm(context.text.deleteConfirm)) {
					model.del(context.blogId).then(function(){
						window.location.href = context.groupRedirect;
					});
				}
			});

		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.blogOptionsApplicationPanel = api;

})(jQuery, window);
