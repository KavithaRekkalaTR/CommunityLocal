(function($, global)
{
    if (typeof $.telligent === 'undefined')
            $.telligent = {};

    if (typeof $.telligent.evolution === 'undefined')
        $.telligent.evolution = {};

    if (typeof $.telligent.evolution.widgets === 'undefined')
        $.telligent.evolution.widgets = {};

    var _attachHandlers = function(context) {
        $('#' + context.wrapperId + ' .export-data').on('click', function() {
           $.telligent.evolution.post({
               url: context.requestDataExportUrl
           })
            .then(function() {
               $.telligent.evolution.notifications.show(context.dataExportRequested, {type:'success'});
            });

            return false;
        });

        $('#' + context.wrapperId + ' .delete-account').on('click', function() {
            $.glowModal(context.deleteConfirmationUrl, { width: 460, height: 300 });
           return false;
        });

        $(context.languageSelector).change(function()
        {
            var selectedIndex = $(context.dateFormatSelector).get(0).selectedIndex;

            $.telligent.evolution.get({
                url: context.getDateFormatsUrl,
                data:
                {
                    w_language: $(this).val()
                },
                success: function(response)
                {
                    $(context.dateFormatSelector).html(response);
                    $(context.dateFormatSelector).get(0).selectedIndex = selectedIndex;
                }
            });
        });

        if (!context.hasPassword)
        {
            $(context.resetPasswordSelector).on('click', function()
            {
                $.telligent.evolution.post({
                    url: context.resetPasswordUrl,
                    data: { },
                    dataType: 'json',
                    success: function(response)
                    {
                        if (response.message)
                        {
                        	$.telligent.evolution.notifications.show(response.message, {type:'success'});
                        }
                    },
                    defaultErrorMessage: context.resetPasswordError
                });

                return false;
            });
        }

        $('input.notificationType').on('change', function(){
            var row = $(this).closest('tr');
            if($(this).is(':checked')) {
                row.removeClass('disabled');
                row.find('.distributionType').prop('disabled', false);
            } else {
                row.addClass('disabled');
                row.find('.distributionType').prop('disabled', true);
            }
        });

        // activity story visibility
        $('#' + context.activityVisibilityId + ' .all, #' + context.activityVisibilityId + ' .none').each(function(){
            var multiSelector = $(this),
                selectables = $('#' + context.activityVisibilityId + ' input[data-disabled="false"]');

            if(multiSelector.hasClass('all')) {
                // selects all
                var alternate = $('#' + context.activityVisibilityId + ' .none');
                multiSelector.on('click', function(){
                    selectables.prop('checked', true).change();
                    alternate.show();
                    multiSelector.hide();
                    return false;
                });
                if(selectables.length < 2 || selectables.filter(':checked').length === selectables.length) {
					multiSelector.hide();
                }
            } else {
                // selects none
                var alternate = $('#' + context.activityVisibilityId + ' .all');
                multiSelector.on('click', function(){
                    selectables.prop('checked', false).change();
                    alternate.show();
                    multiSelector.hide();
                    return false;
                });
                if (selectables.length < 2 || selectables.filter(':not(:checked)').length === selectables.length) {
                	multiSelector.hide();
                }
            }
        });
        
        $(context.resendVerificationSelector).on('click', function(e)
        {
            e.preventDefault();
			_resendVerification(context);
        });
    },
    _addValidation = function(context) {
        var w = $('#' + context.wrapperId);
        var saveButton = $('a.update-user', w);
        var tabbedPanes = $('#' + context.tabId);

        saveButton.evolutionValidation({
            onValidated: function(isValid, buttonClicked, c) {
                if (isValid)
                    saveButton.removeClass('disabled');
                else {
                    saveButton.addClass('disabled');

                    if (c)
                    {
                        var tabbedPane = tabbedPanes.glowTabbedPanes('getByIndex', c.tab);
                        if (tabbedPane)
                            tabbedPanes.glowTabbedPanes('selected', tabbedPane);
                    }
                }
            },
            onSuccessfulClick: function(e) {
                $('.processing', saveButton.parent()).css("visibility", "visible");
                saveButton.addClass('disabled');
                _save(context);
            }
        });

        saveButton.evolutionValidation('addField',
            context.privateEmailSelector,
            {
                required: true,
                email: true,
                emailexists: true
            },
            $(context.privateEmailSelector).closest('.field-item').find('.field-item-validation'), {tab: 0 });

        if (context.signatureMaxLength > 0)
        {
            context.attachSignatureChangeScript(saveButton.evolutionValidation('addCustomValidation', 'signature', function()
                {
                    return context.getSignature().length < context.signatureMaxLength;
                },
                context.signatureMaxLengthText, $(context.signatureValidationSelector), { tab: 0 }
            ));
        }
    },
    _save = function(context) {
    	_saveActivityVisibility(context).then(function() {
	        _saveNotificationPreferences(context).then(function(){
	            _saveUser(context)
	                .then(function(response){
	                    $.telligent.evolution.notifications.show(context.saveSucessText, {type:'success'});
	                    $('#' + context.wrapperId + ' .processing').css("visibility", "hidden");
	                    $('#' + context.wrapperId + ' a.update-user').removeClass('disabled');
	                    _updateActivityVisibilityOriginalValues(context);
	                })
	                .catch(function(xhr, desc, ex){
	                    $('#' + context.wrapperId + ' .processing').css("visibility", "hidden");
	                    $('#' + context.wrapperId + ' a.update-user').removeClass('disabled');
	                });
	        });
	    });
    },
    _saveNotificationPreference = function(preference, elem) {
        return $.telligent.evolution.put({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/notificationpreference.json',
            data: preference,
            dataType: 'json',
			success: function(response) {
				elem.data('enabled', preference.IsEnabled);
			}
        });
    },
    _collectNotificationPreferences = function(context) {
        var wrapper = $('#' + context.wrapperId),
            preferences = [];
        wrapper.find('input.notificationType').each(function(){
            var notificationTypeCheckbox = $(this),
                notificationTypeId = notificationTypeCheckbox.data('notificationtype'),
				enabled = notificationTypeCheckbox.is(':checked');

			// if not a change from previous, don't update
			if (enabled != notificationTypeCheckbox.data('enabled')) {
				preferences.push(function(){
					return _saveNotificationPreference({
						NotificationTypeId: notificationTypeId,
						IsEnabled: enabled
					}, notificationTypeCheckbox);
				});
			}

            // find distribution types for enabled notification type
            wrapper.find('input.distributionType[data-notificationtype="' + notificationTypeId + '"]').each(function(){
                var distributionTypeCheckbox = $(this),
                    distributionTypeId = distributionTypeCheckbox.data('distributiontype'),
                    enabled = distributionTypeCheckbox.is(':checked');

                // if not a change from previous, don't update
                if(enabled == distributionTypeCheckbox.data('enabled')) {
                    return;
                }

                // distribution type enabled or disabled
                preferences.push(function(){
                    return _saveNotificationPreference({
                        NotificationTypeId: notificationTypeId,
                        DistributionTypeId: distributionTypeId,
                        IsEnabled: enabled
                    }, distributionTypeCheckbox);
                });
            });
        });

        return preferences;
    },
    _saveNotificationPreferences = function(context) {
        var preferenceUpdates = $.map(_collectNotificationPreferences(context), function(instruction) { return instruction(); });
        // return a promise which completes when all preferences are done
        return $.when.apply($, preferenceUpdates);
    },
    _updateActivityVisibilityOriginalValues = function(context) {
    	$('#' + context.activityVisibilityId + ' input[data-disabled="false"]').each(function(){
            var cb = $(this);
            cb.attr('data-originalvalue', cb.is(':checked') ? 'true' : 'false');
        });
    },
    _saveActivityVisibilityChange = function(change) {
        return $.telligent.evolution.put({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/activitystoryuserpreference/{ActivityStoryTypeId}.json',
            data: change,
            dataType: 'json'
        });
    },
    _collectActivityVisibilityChanges = function(context) {
    	var changes = [];

    	$('#' + context.activityVisibilityId + ' input[data-disabled="false"]').each(function(){
            var cb = $(this);
			if (cb.is(':checked') != (cb.attr('data-originalvalue') == 'true')) {
				changes.push(function() {
					return _saveActivityVisibilityChange({
						ActivityStoryTypeId: cb.data('activitystorytypeid'),
						IsLoggingEnabled: cb.is(':checked') ? 'true' : 'false'
					});
				});
			}
        });

        return changes;
    },
    _saveActivityVisibility = function(context) {
    	var visibilityUpdates = $.map(_collectActivityVisibilityChanges(context), function(instruction) { return instruction(); });
    	return $.when.apply($, visibilityUpdates);
    },
    _saveUser = function(context) {
        var data = {
            Language: $(context.languageSelector).val(),
            PrivateEmail: $(context.privateEmailSelector).val(),
            EnableFavoriteSharing: $(context.sharedFavoritesSelector).is(':checked'),
            AllowSiteToContact: $(context.allowSiteContactSelector).is(':checked'),
            AllowSitePartnersToContact: $(context.allowSitePartnersContactSelector).is(':checked'),
            EnableDisplayInMemberList: $(context.enableDisplayInMembersSelector).is(':checked'),
            TimeZoneId: $(context.timezoneSelector).val(),
            DateFormat: $(context.dateFormatSelector).val(),
            UserId : context.userId
        };

        if ($(context.editorListSelector).length > 0)
            data.EditorType = $(context.editorListSelector).val();

        if ($(context.receiveEmailsSelector).length > 0)
            data.ReceiveEmails = $(context.receiveEmailsSelector).is(':checked');
        if ($(context.enableHtmlEmailSelector).length > 0)
            data.EnableHtmlEmail = $(context.enableHtmlEmailSelector).is(':checked');

        if (context.getSignature)
        {
            data.Signature = context.getSignature();
        }

        if ($(context.enableUserSignaturesSelector).length > 0)
        {
            data.EnableUserSignatures = $(context.enableUserSignaturesSelector).is(':checked');
        }

        if ($(context.conversationContactType).length > 0)
        {
            data.ConversationContactType = $('input:checked', $(context.conversationContactType)).val();
        }

        if ($(context.enablePresenceTracking).length > 0) {
            data.EnablePresenceTracking = $(context.enablePresenceTracking).is(':checked');
        }

        return $.telligent.evolution.put({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json?IncludeFields=User.Id',
            data: data,
            dataType: 'json',
            defaultErrorMessage: context.saveErrorText
        });
    },
    _attachMultiSelectors = function(context) {
        var wrapper = $('#' + context.wrapperId);
        wrapper.find('.multiselect').each(function(){
            var multiSelector = $(this),
                selectables = wrapper.find('input.multiSelectable[type="checkbox"][data-category="' + multiSelector.data('category') + '"]'),
                allSelected = selectables.filter(':checked').length === selectables.length;
            if(multiSelector.hasClass('all')) {
                // selects all
                var alternate = wrapper.find('.multiselect.none[data-category="' + multiSelector.data('category') + '"]');
                multiSelector.on('click', function(){
                    selectables.prop('checked', true).change();
                    alternate.show();
                    multiSelector.hide();
                    return false;
                });
                if(!allSelected) {
                    multiSelector.show();
                    alternate.hide();
                } else {
                	multiSelector.hide();
                	alternate.show();
                }
            } else {
                // selects none
                var alternate = wrapper.find('.multiselect.all[data-category="' + multiSelector.data('category') + '"]');
                multiSelector.on('click', function(){
                    selectables.prop('checked', false).change();
                    alternate.show();
                    multiSelector.hide();
                    return false;
                });
            }
        });
    },
    _resendVerification = function(context) {
		var data = {
			emailAddress: $(context.resendVerificationSelector).data('email'),
			userId: $(context.resendVerificationSelector).data('user')
		};
		$.telligent.evolution.post({
			url: context.resendVerificationUrl,
			data: data,
			success: function(response) {
				$.telligent.evolution.notifications.show(context.resendVerificationMessage, {});
			}
		});
	};

    $.telligent.evolution.widgets.editUser = {
        register: function(context) {
			var w = $('#' + context.wrapperId);
			var tabs = [];
			tabs.push([context.basicTabId, context.basicTabText, null]);
			if (context.emailTabEnabled)
				tabs.push([context.emailTabId, context.emailTabText, null]);
			tabs.push([context.subscriptionsTabId, context.subscriptionsTabText, null]);
			tabs.push([context.notificationTabId, context.notificationTabText, null]);

            var tabbedPanes = $('#' + context.tabId, w).glowTabbedPanes({
                cssClass:'',
                tabSetCssClass:'tab-set with-panes',
                tabCssClasses:['tab'],
                tabSelectedCssClasses:['tab selected'],
                tabHoverCssClasses:['tab hover'],
                enableResizing:false,
                tabs: tabs
            });

            if (context.selectedTabId != '')
            var tabbedPane = tabbedPanes.glowTabbedPanes('getById', context.selectedTabId);
            if (tabbedPane)
                tabbedPanes.glowTabbedPanes('selected', tabbedPane);


            _addValidation(context);
            _attachHandlers(context);
            _attachMultiSelectors(context);
        }
    };
})(jQuery, window);