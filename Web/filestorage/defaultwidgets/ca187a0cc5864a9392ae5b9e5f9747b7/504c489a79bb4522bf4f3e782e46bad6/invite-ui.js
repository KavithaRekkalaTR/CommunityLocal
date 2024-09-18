(function ($) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }


    var taskSequence = {
        create: function (options) {
            var settings = $.extend({}, taskSequence.create.defaults, options || {}),
				tasks = [], hasError = false, runCount = -1,
				proceed = function () {
					runCount++;
					if (tasks.length > 0 && runCount < tasks.length) {
					    if (!hasError) {
					        tasks[runCount]();
					    }
					} else {
					    settings.onComplete();
					}
				},
                api = {
                    add: function (task) {
                        tasks.push(task);
                    },
                    success: function () {
                        proceed();
                    },
                    error: function () {
                        hasError = true;
                    },
                    run: function () {
                        proceed();
                    }
                };

            return api;
        }
    },
	attachHandlers = function (context) {
	    if (context.inviteMemberByNameUserName && context.inviteMemberByNameUserName.length > 0) {
	        context.inviteMemberByNameInvite.evolutionValidation({
	            onValidated: function (isValid) {
	                if (isValid) {
	                    context.inviteMemberByNameInvite.removeClass('disabled');
	                }
	                else {
	                    context.inviteMemberByNameInvite.addClass('disabled');
	                }
	            },
	            onSuccessfulClick: function (e) {
	                context.message.hide();
	                context.inviteMemberByNameInvite.addClass('disabled');

	                var tasks = taskSequence.create({
	                    onComplete: function () {
	                        context.inviteMemberByNameInvite.removeClass('disabled');
	                        while (context.inviteMemberByNameUserName.glowLookUpTextBox('count') > 0) {
	                            context.inviteMemberByNameUserName.glowLookUpTextBox('removeByIndex', 0);
	                        }

	                        $.glowModal.close('close');
	                    }
	                });

	                var count = context.inviteMemberByNameUserName.glowLookUpTextBox('count');
	                for (var i = 0; i < count; i++) {
	                    (function () {

	                        var item = context.inviteMemberByNameUserName.glowLookUpTextBox('getByIndex', i);
	                        if (item) {
	                            var v = item.Value.split(/:/);
	                            if (v[0] == 'user') {
	                                var userId = v[1];
	                                tasks.add(function () {
	                                    $.telligent.evolution.post({
	                                        url: context.inviteUserUrl,
	                                        data: { EventId: context.eventId, UserId: userId, Status: context.status.val(), AllowAnonymous: context.allowAnonymous },
	                                        dataType: 'json',
	                                        success: function (response) {
	                                            tasks.success();
	                                        },
	                                        defaultErrorMessage: context.ajaxErrorText,
	                                        error: function (xhr, desc, ex) {
	                                            tasks.error();
	                                            $.telligent.evolution.notifications.show(desc, { type: 'error' });
	                                            context.inviteMemberByNameInvite.removeClass('disabled');
	                                        }
	                                    });
	                                });
	                            }
	                        }
	                    })();
	                }

	                tasks.run();
	                return false;
	            }
	        });

	        context.inviteMemberByNameUserName.on('glowLookUpTextBoxChange', context.inviteMemberByNameInvite.evolutionValidation('addCustomValidation', 'requiredusername', function () {
	            return context.inviteMemberByNameUserName.glowLookUpTextBox('count') > 0;
	        },
				context.inviteMemberByNameUserNameMissingText,
				'#' + context.wrapperId + ' .field-item.user-name .field-item-validation',
				null));
	    }
	};

    $.telligent.evolution.widgets.eventRegistrationInvitation = {
        register: function (context) {

            taskSequence.create.defaults = {
                onComplete: function () { }
            };

            if (context.inviteMemberByNameUserName && context.inviteMemberByNameUserName.length > 0) {
                context.inviteMemberByNameUserName.glowLookUpTextBox(
				{
				    emptyHtml: '',
				    maxValues: 20,
				    onGetLookUps: function (tb, searchText) {
				        window.clearTimeout(context.inviteMemberByNameUserNameTimeout);
				        if (searchText && searchText.length >= 2) {
				            tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);

                            var selected = {};
                            var count = context.inviteMemberByNameUserName.glowLookUpTextBox('count');
                            for (var i = 0; i < count; i++) {
                                var item = context.inviteMemberByNameUserName.glowLookUpTextBox('getByIndex', i);
                                if (item) {
                                    var v = item.Value.split(/:/);
                                    if (v[0] == 'user') {
                                        selected[v[1]] = true;
                                    }
                                }
                            }

				            context.inviteMemberByNameUserNameTimeout = window.setTimeout(function () {
				                $.telligent.evolution.get({
				                    url: context.findUsersUrl,
				                    data: { w_SearchText: searchText, w_IncludeRoles: 'False', CalendarEventId: context.eventId },
				                    success: function (response) {
				                        if (response && response.matches.length > 1) {
				                            var suggestions = [];
				                            for (var i = 0; i < response.matches.length; i++) {
				                                var item = response.matches[i];
				                                if (item && item.userId) {
				                                    var selectable = !item.alreadySelected && !selected[item.userId];
				                                    suggestions[suggestions.length] = tb.glowLookUpTextBox('createLookUp', 'user:' + item.userId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.alreadySelected + '</span></div>', selectable);
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

            if (context.showMessage)
                context.message.show();

            attachHandlers(context);
        }
    };
})(jQuery);
