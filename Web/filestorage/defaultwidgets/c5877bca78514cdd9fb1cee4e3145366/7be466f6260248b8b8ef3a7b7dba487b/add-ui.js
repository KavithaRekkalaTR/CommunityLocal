(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }


    $.telligent.evolution.widgets.groupMemberManagermentAdd = {
        register: function (context) {
            var header = $.telligent.evolution.administration.header();
		    header.append('<fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="#" class="button add">' + context.addMemberSaveText + '</a></span></li></ul></fieldset>');
		    context.addMemberSave = $('.button.add', header);
			$.telligent.evolution.administration.header();

			context.addMemberSave.evolutionValidation({
	            onValidated: function (isValid, buttonClicked, c) {
	                if (isValid) {
	                    context.addMemberSave.removeClass('disabled');
	                }
	                else {
	                    context.addMemberSave.addClass('disabled');
	                }
	            },
	            onSuccessfulClick: function (e) {
	                context.addMemberSave.addClass('disabled');

	                var tasks = [];

	                var count = context.addMemberUserName.glowLookUpTextBox('count');
	                for (var i = 0; i < count; i++) {
	                    (function () {
	                        var item = context.addMemberUserName.glowLookUpTextBox('getByIndex', i);
	                        if (item) {
	                            var v = item.Value.split(/:/, 2);
	                            if (v[0] == 'user') {
	                                var userId = v[1];
	                                tasks.push($.telligent.evolution.post({
	                                        url: context.addMemberUrl,
	                                        data: { Type: 'user', GroupId: context.groupId, UserId: userId, GroupMembershipType: context.addMemberMembershipType.val() },
	                                        dataType: 'json'
	                                    })
	                                )
	                            }
	                            else if (v[0] == 'role') {
	                                var roleId = v[1];
	                                tasks.push($.telligent.evolution.post({
	                                        url: context.addMemberUrl,
	                                        data: { Type: 'role', GroupId: context.groupId, RoleId: roleId, GroupMembershipType: context.addMemberMembershipType.val() },
	                                        dataType: 'json'
	                                    })
	                                );
	                            }
	                            else if (v[0] == 'ldapUser') {
	                                var userName = v[1];
	                                tasks.push($.telligent.evolution.post({
	                                        url: context.addMemberUrl,
	                                        data: { Type: 'ldapUser', GroupId: context.groupId, LdapName: userName, GroupMembershipType: context.addMemberMembershipType.val() },
	                                        dataType: 'json'
	                                    })
	                                );
	                            }
	                            else if (v[0] == 'ldapRole') {
	                                var roleName = v[1];
	                                tasks.push($.telligent.evolution.post({
	                                        url: context.addMemberUrl,
	                                        data: { Type: 'ldapRole', GroupId: context.groupId, LdapName: roleName, GroupMembershipType: context.addMemberMembershipType.val() },
	                                        dataType: 'json'
	                                    })
	                                );
	                            }
	                        }
	                    })();
	                }

	                $.when.apply($, tasks)
						.then(function() {
							$.telligent.evolution.notifications.show(context.usersAddedText, {
							    type: 'success'
							});
							$.telligent.evolution.messaging.publish('groupmembers.expiremembers');
							$.telligent.evolution.administration.close();
						}, function() {
							context.addMemberSave.removeClass('disabled');
						});

	                return false;
	            }
	        });

	        context.addMemberUserName.on('glowLookUpTextBoxChange', context.addMemberSave.evolutionValidation('addCustomValidation', 'requiredusername', function () {
		            return context.addMemberUserName.glowLookUpTextBox('count') > 0;
		        },
				context.addMemberUserNameMissingText,
				'.field-item.username .field-item-validation',
				null));


            context.addMemberUserName.glowLookUpTextBox({
			    emptyHtml: '',
			    maxValues: 20,
			    onGetLookUps: function (tb, searchText) {
			        window.clearTimeout(context.addMemberUserNameTimeout);
			        if (searchText && searchText.length >= 2) {
			            tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
			            context.addMemberUserNameTimeout = window.setTimeout(function () {
			                $.telligent.evolution.get({
			                    url: context.findUsersOrRolesUrl,
			                    data: { w_SearchText: searchText, w_IncludeRoles: 'True' },
			                    success: function (response) {
			                        if (response && response.matches.length > 1) {

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
			                                    suggestions.push(tb.glowLookUpTextBox('createLookUp', 'user:' + item.userId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.alreadyAMemberText + '</span></div>', selectable));
			                                }
			                                else if (item && item.roleId) {
			                                    selectable = !item.alreadySelected && !selected['role:' + item.roleId];
			                                    suggestions.push(tb.glowLookUpTextBox('createLookUp', 'role:' + item.roleId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.alreadyAMemberText + '</span></div>', selectable));
			                                }
			                                else if (item && item.ldapRoleId) {
			                                    selectable = !item.alreadySelected && !selected['ldapRole:' + item.ldapRoleId + ':' + item.ldapRoleDn];
			                                    suggestions.push(tb.glowLookUpTextBox('createLookUp', 'ldapRole:' + item.ldapRoleId + ':' + item.ldapRoleDn, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.alreadyAMemberText + '</span></div>', selectable));
			                                }
			                                else if (item && item.ldapUserId) {
			                                    selectable = !item.alreadySelected && !selected['ldapUser:' + item.ldapUserId];
			                                    suggestions.push(tb.glowLookUpTextBox('createLookUp', 'ldapUser:' + item.ldapUserId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.alreadyAMemberText + '</span></div>', selectable));
			                                }
			                            }

			                            tb.glowLookUpTextBox('updateSuggestions', suggestions);
			                        }
			                        else
			                            tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.noUserOrRoleMatchesText, context.noUserOrRoleMatchesText, false)]);
			                    }
			                });
			            }, 749);
			        }
			    },
			    selectedLookUpsHtml: []
			});
        }
    };
})(jQuery, window);
