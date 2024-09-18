(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    $.telligent.evolution.widgets.groupMembershipListInvite = {
        register: function (context) {

            var header = $.telligent.evolution.administration.header();
		    header.append('<fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="#" class="button invite">' + context.inviteText + '</a></span></li></ul></fieldset>');
		    context.invite = $('.button.invite', header);
			$.telligent.evolution.administration.header();

	        context.invite.evolutionValidation({
	            onValidated: function (isValid, buttonClicked, c) {
	                if (isValid) {
	                    context.invite.removeClass('disabled');
	                }
	                else {
	                    context.invite.addClass('disabled');
	                }
	            },
	            onSuccessfulClick: function (e) {
	                context.invite.addClass('disabled');

	                var tasks = [];

	                var count = context.userNamesOrEmails.glowLookUpTextBox('count');
	                for (var i = 0; i < count; i++) {
	                    (function () {

	                        var item = context.userNamesOrEmails.glowLookUpTextBox('getByIndex', i);
	                        if (item) {
	                            var v = item.Value.split(/:/);
	                            if (v[0] == 'user') {
	                                var userId = v[1];
	                                tasks.push($.telligent.evolution.post({
	                                        url: context.sendInvitationUrl,
	                                        data: { GroupId: context.groupId, UserId: userId, MembershipType: context.membershipType.val(), Message: context.message.val() },
	                                        dataType: 'json'
	                                    })
	                                );
	                            } else if (v[0] == 'ldapUser') {
	                                var userName = v[1];
	                                tasks.push($.telligent.evolution.post({
	                                        url: context.sendInvitationUrl,
	                                        data: { GroupId: context.groupId, LdapName: userName, MembershipType: context.membershipType.val(), Message: context.message.val() },
	                                        dataType: 'json'
	                                    })
	                                );
	                            } else if (v[0] == 'email') {
	                            	var email = item.Value.substr(6);
	                            	tasks.push($.telligent.evolution.post({
	                            		 	url: context.sendInvitationUrl,
	                                        data: { GroupId: context.groupId, Email: email, MembershipType: context.membershipType.val(), Message: context.message.val() },
	                                        dataType: 'json'
	                            		})
	                            	);
	                            }
	                        }
	                    })();
	                }

	                $.when.apply($, tasks)
						.then(function() {
							$.telligent.evolution.notifications.show(context.inviteSentText, {
							    type: 'success'
							});
							$.telligent.evolution.messaging.publish('groupmembers.expireinvites');
							$.telligent.evolution.administration.close();
						}, function() {
							context.invite.removeClass('disabled');
						});

	                return false;
	            }
	        });

	        context.userNamesOrEmails.on('glowLookUpTextBoxChange', context.invite.evolutionValidation('addCustomValidation', 'requiredusername', function () {
	            return context.userNamesOrEmails.glowLookUpTextBox('count') > 0;
	        },
				context.userNameOrEmailMissingText,
				'.field-item.user-name .field-item-validation',
				null));


            context.userNamesOrEmails.glowLookUpTextBox({
			    emptyHtml: '',
			    maxValues: 20,
			    onGetLookUps: function (tb, searchText) {
			        window.clearTimeout(context.lookupTimeout);
			        if (searchText && searchText.length >= 2) {
			            tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
			            context.lookupTimeout = window.setTimeout(function () {
			                $.telligent.evolution.get({
			                    url: context.findUsersOrRolesUrl,
			                    data: { w_SearchText: searchText, w_IncludeRoles: 'False', w_IncludeEmail: 'True' },
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

			                            var suggestions = [], selectable, message;
			                            for (var i = 0; i < response.matches.length; i++) {
			                                var item = response.matches[i];
			                                if (item && item.userId) {
			                                    selectable = true;
			                                    if (item.alreadySelected) {
			                                        selectable = false;
			                                        message = context.alreadyAMemberText;
			                                    }
			                                    if (selected['user:' + item.userId]) {
			                                        selectable = false;
			                                        message = context.alreadySelectedText;
			                                    }
			                                    suggestions.push(tb.glowLookUpTextBox('createLookUp', 'user:' + item.userId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + message + '</span></div>', selectable));
			                                }
			                                else if (item && item.ldapUserId) {
			                                    selectable = true;
			                                    if (item.alreadySelected) {
			                                        selectable = false;
			                                        message = context.alreadyAMemberText;
			                                    }
			                                    if (selected['ldapUser:' + item.ldapUserId]) {
			                                        selectable = false;
			                                        message = context.alreadySelectedText;
			                                    }
			                                    suggestions.push(tb.glowLookUpTextBox('createLookUp', 'ldapUser:' + item.ldapUserId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + message + '</span></div>', selectable));
			                                }
			                                else if (item && item.email) {
			                                    selectable = true;
			                                    if (item.alreadySelected) {
			                                        selectable = false;
			                                        message = context.alreadyAMemberText;
			                                    }
			                                    if (selected['email:' + item.email]) {
			                                        selectable = false;
			                                        message = context.alreadySelectedText;
			                                    }
			                                	suggestions.push(tb.glowLookUpTextBox('createLookUp', 'email:' + item.email, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + message + '</span></div>', selectable));
			                                }
			                            }

			                            tb.glowLookUpTextBox('updateSuggestions', suggestions);
			                        }
			                        else
			                            tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.noUserOrEmailMatchesText, context.noUserOrEmailMatchesText, false)]);
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
