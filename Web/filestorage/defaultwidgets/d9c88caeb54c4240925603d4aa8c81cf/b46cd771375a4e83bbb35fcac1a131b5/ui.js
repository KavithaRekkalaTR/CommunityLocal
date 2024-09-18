(function ($, global) {

	function findUsers(context, tb, searchText) {
		window.clearTimeout(context.addMemberUserNameTimeout);
		if (searchText && searchText.length >= 2) {
			tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
			context.addMemberUserNameTimeout = window.setTimeout(function () {
				$.telligent.evolution.get({
					url: context.urls.findUsersOrRolesUrl,
					data: { w_SearchText: searchText },
					success: function (response) {
						if (response && response.matches.length > 0) {
							var selected = {};
							var count = tb.glowLookUpTextBox('count');
							for (var i = 0; i < count; i++) {
								var item = tb.glowLookUpTextBox('getByIndex', i);
								if (item) {
									selected[item.Value] = true;
								}
							}

							var suggestions = [], selectable;
							for (var i = 0; i < response.matches.length; i++) {
								var item = response.matches[i];
								if (item && item.userId) {
									selectable = !item.alreadySelected && !selected['user:' + item.userId];
									suggestions.push(tb.glowLookUpTextBox('createLookUp', 'user:' + item.userId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.text.alreadySelected + '</span></div>', selectable));
								}
								else if (item && item.roleId) {
									selectable = !item.alreadySelected && !selected['role:' + item.roleId];
									suggestions.push(tb.glowLookUpTextBox('createLookUp', 'role:' + item.roleId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.text.alreadySelected + '</span></div>', selectable));
								}
							}

							tb.glowLookUpTextBox('updateSuggestions', suggestions);
						}
						else
							tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.noUsersMatch, context.noUsersMatch, false)]);
					}
				});
			}, 749);
		}
	}

	var api = {
		register: function (context) {
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			context.headerWrapper = $('<fieldset></fieldset>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			context.headerWrapper.append(
				$.telligent.evolution.template.compile(context.headerTemplateId)({})
			);

			$.telligent.evolution.administration.header();
	
			context.fields.userLookup.glowLookUpTextBox({
				maxValues: 20,
				onGetLookUps: function(tb, query) {
					findUsers(context, tb, query);
				},
				emptyHtml: context.text.userLookupPlaceholder,
				minimumLookUpLength: 2
			});

			if (context.selectedUsers && context.selectedUsers.length > 0) {
				context.selectedUsers.forEach(function(user)
				{
					var initialLookupValue = context.fields.userLookup.glowLookUpTextBox('createLookUp',
						"user:" + user.id,
						user.name,
						user.name,
						true);
					context.fields.userLookup.glowLookUpTextBox('add', initialLookupValue);
				});
			}

			if (context.selectedRoles && context.selectedRoles.length > 0) {
				context.selectedRoles.forEach(function(role)
				{
					var initialLookupValue = context.fields.userLookup.glowLookUpTextBox('createLookUp',
						"role:" + role.id,
						role.name,
						role.name,
						true);
					context.fields.userLookup.glowLookUpTextBox('add', initialLookupValue);
				});
			}

			button = $('a.save', $.telligent.evolution.administration.header());
			button.on('click', function(e){
				e.preventDefault();
				
				var userIds = [];
				var roleIds = [];

				var count = context.fields.userLookup.glowLookUpTextBox('count');
				for (var i = 0; i < count; i++) {
					(function () {
						var item = context.fields.userLookup.glowLookUpTextBox('getByIndex', i);
						if (item) {
							var v = item.Value.split(/:/, 2);
							if (v[0] == 'user') {
								userIds.push(v[1]);
							}
							else if (v[0] == 'role') {
								roleIds.push(v[1]);
							}
						}
					})();
				}

				$.telligent.evolution.post({
					url: context.urls.save,
					data: {
						UserIds: userIds.join(),
						RoleIds: roleIds.join(),
					}
				})
				.then(function(response) {
					$.telligent.evolution.notifications.show(context.text.saveSuccessful, { type: 'success' });

				});
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articleHelpfulnessNotifications = api;

})(jQuery, window);