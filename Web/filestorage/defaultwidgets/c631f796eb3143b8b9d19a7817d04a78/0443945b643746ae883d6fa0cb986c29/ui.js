(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	function updateVisibleTab(context) {

		var e = context.headerWrapper.find('.filter-option.selected a[data-tab]');
		var tab = context.wrapper.find('.tab.' + e.data('tab'));
		tab.siblings('.tab').css({
			visibility: 'hidden',
			height: '100px',
			width: '800px',
			left: '-1000px',
			position: 'absolute',
			overflow: 'hidden',
			top: '-1000px'
		});
		tab.css({
		   visibility: 'visible',
			height: 'auto',
			width: 'auto',
			left: '0',
			position: 'static',
			overflow: 'visible',
			top: '0'
		});
		$.fn.uilinks.forceRender();

		if (e.data('tab') == 'roles') {
			context.headerWrapper.find('.user-options').hide();
			context.headerWrapper.find('.role-options').show().find('.navigation-list').uilinks('resize');
		} else {
			context.headerWrapper.find('.user-options').show().find('.navigation-list').uilinks('resize');
			context.headerWrapper.find('.role-options').hide();
		}
		$.telligent.evolution.administration.header();
	}

	function update(context) {
		$.telligent.evolution.get({
			url: context.urls.update
		})
			.then(function(response) {
				context.wrapper.find('.tab.roles').html(response.rolesHtml);
				context.wrapper.find('.user-points').html(response.pointsHtml);

				if (response.avatarHtml) {
					var parent = $.telligent.evolution.administration
						.header()
						.siblings('.administration-panel-heading-meta');

					var avatar = parent.find('.avatar');
					if (avatar.length > 0) {
						avatar.replaceWith('<span class="avatar">' + response.avatarHtml + '</span>');
					} else {
						parent.find('.name').before('<span class="avatar">' + response.avatarHtml + '</span>');
					}
				} else {
					$.telligent.evolution.administration
						.header()
						.siblings('.administration-panel-heading-meta .avatar')
						.remove();
				}
			});
	}

	function initializeFields(context) {

		context.fields = {};
		context.fields.accountStatus = $('#' + context.fieldIds.accountStatus);
		context.fields.bannedReason = $('#' + context.fieldIds.bannedReason);
		context.fields.bannedUntil = $('#' + context.fieldIds.bannedUntil).glowDateTimeSelector(
			$.extend({},
				$.fn.glowDateTimeSelector.dateDefaults,
			{
			showPopup: true,
			allowBlankvalue: true
			}
		));
		context.fields.moderationLevel = $('#' + context.fieldIds.moderationLevel);
		context.fields.isIgnored = $('#' + context.fieldIds.isIgnored)
		context.fields.displayName = $('#' + context.fieldIds.displayName);
		context.fields.privateEmail = $('#' + context.fieldIds.privateEmail);
		context.fields.enableEmail = $('#' + context.fieldIds.enableEmail);
		context.fields.enableHtmlEmail = $('#' + context.fieldIds.enableHtmlEmail);
		context.fields.allowSiteToContact = $('#' + context.fieldIds.allowSiteToContact);
		context.fields.allowSitePartnersToContact = $('#' + context.fieldIds.allowSitePartnersToContact);
		context.fields.editor = $('#' + context.fieldIds.editor);
		context.fields.timezone = $('#' + context.fieldIds.timezone);
		context.fields.dateFormat = $('#' + context.fieldIds.dateFormat);
		context.fields.allowConversationsFrom = $('#' + context.fieldIds.allowConversationsFrom);
		context.fields.enablePresenceTracking = $('#' + context.fieldIds.enablePresenceTracking);
		context.fields.shareFavorites = $('#' + context.fieldIds.shareFavorites);
		context.fields.enableDisplayInMemberList = $('#' + context.fieldIds.enableDisplayInMemberList);
		context.fields.enableUserSignatures = $('#' + context.fieldIds.enableUserSignatures);
		context.fields.verifyBypass = $('#' + context.fieldIds.verifyBypass);
		context.fields.verifyBypassCallout = $('#' + context.fieldIds.verifyBypassCallout);

		context.fields.accountStatus.on('change', function() {
			if ($(this).val() == 'Banned') {
				context.wrapper.find('.field-item.banning').slideDown('fast');
			} else {
				context.wrapper.find('.field-item.banning').slideUp('fast');
			}
		});

		$('#' + context.fieldIds.activityVisibility + ' .all, #' + context.fieldIds.activityVisibility + ' .none').each(function(){
			var multiSelector = $(this),
				selectables = $('#' + context.fieldIds.activityVisibility + ' input[data-disabled="false"]'),
				alternate;

			if(multiSelector.hasClass('all')) {
				// selects all
				alternate = $('#' + context.fieldIds.activityVisibility + ' .none');
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
				alternate = $('#' + context.fieldIds.activityVisibility + ' .all');
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
	}

	function saveActivityVisibility(context) {
		var updateOriginalValues = function() {
			$('#' + context.fieldIds.activityVisibility + ' input[data-disabled="false"]').each(function(){
				var cb = $(this);
				cb.attr('data-originalvalue', cb.is(':checked') ? 'true' : 'false');
			});
		},
		saveChange = function(change) {
			return $.telligent.evolution.put({
				url: context.urls.saveStoryLoggingPreference,
				data: change,
				dataType: 'json'
			});
		},
		collectChanges = function() {
			var changes = [];
			$('#' + context.fieldIds.activityVisibility + ' input[data-disabled="false"]').each(function(){
				var cb = $(this);
				if (cb.is(':checked') != (cb.attr('data-originalvalue') == 'true')) {
					changes.push(function() {
						return saveChange({
							ActivityStoryTypeId: cb.data('activitystorytypeid'),
							IsLoggingEnabled: cb.is(':checked') ? 'true' : 'false'
						});
					});
				}
			});

			return changes;
		};

		var visibilityUpdates = $.map(collectChanges(), function(instruction) { return instruction(); });
		return $.when.apply($, visibilityUpdates)
			.then(function() {
				updateOriginalValues();
			});
	}

	function save(context) {
		return $.Deferred(function(d) {
			saveActivityVisibility(context)
				.catch(function() {
					d.reject();
				})
				.then(function() {
					var data = {
						UserId: context.userId
					};
					data.AccountStatus = context.fields.accountStatus.val();
					data.BanReason = context.fields.bannedReason.val();
					var bannedUntil = context.fields.bannedUntil.glowDateTimeSelector('val');
					if (bannedUntil) {
						data.BannedUntil = $.telligent.evolution.formatDate(bannedUntil);
					}
					data.ModerationLevel = context.fields.moderationLevel.val();
					data.IsIgnored = context.fields.isIgnored.is(':checked');
					data.DisplayName = context.fields.displayName.val();
					if (data.DisplayName != context.userName) {
						data.EnableDisplayName = true;
					}
					data.PrivateEmail = context.fields.privateEmail.val();
					if (context.fields.enableEmail.length > 0) {
						data.ReceiveEmails =  context.fields.enableEmail.is(':checked');
					}
					if (context.fields.enableHtmlEmail.length > 0) {
						data.EnableHtmlEmail = context.fields.enableHtmlEmail.is(':checked');
					}
					if (context.fields.allowSiteToContact.length > 0) {
						data.AllowSiteToContact = context.fields.allowSiteToContact.is(':checked');
					}
					if (context.fields.allowSitePartnersToContact.length > 0) {
						data.AllowSitePartnersToContact = context.fields.allowSitePartnersToContact.is(':checked');
					}
					if (context.fields.editor.length > 0) {
						data.EditorType = context.fields.editor.val();
					}
					data.TimeZoneId = context.fields.timezone.val();
					data.DateFormat = context.fields.dateFormat.val();
					if (context.fields.allowConversationsFrom.length > 0) {
						data.ConversationContactType = $('input:checked', context.fields.allowConversationsFrom).val();
					}
					if (context.fields.enablePresenceTracking.length > 0) {
						data.EnablePresenceTracking = context.fields.enablePresenceTracking.is(':checked');
					}
					data.EnableFavoriteSharing = context.fields.shareFavorites.is(':checked');
					data.EnableDisplayInMemberList = context.fields.enableDisplayInMemberList.is(':checked');
					if (context.fields.enableUserSignatures.length > 0) {
						data.EnableUserSignatures = context.fields.enableUserSignatures.is(':checked');
					}
					if (context.editors.signature) {
						data.Signature = context.editors.signature.getHtml();
					}
					if (context.editors.biography) {
						data.Bio = context.editors.biography.getHtml();
					}

					for (var i = 0; i < context.fieldIds.profileForms.length; i++) {
						var formData = $('#' + context.fieldIds.profileForms[i]).dynamicForm('getValues');
						for (var n in formData) {
							var v;
							if (formData[n] != null) {
								if (formData[n].toGMTString) {
									v = $.telligent.evolution.formatDate(formData[n]);
								} else {
									v = formData[n] + '';
								}
							} else {
								v = '';
							}
							data['_ProfileFields_' + n] = v;
						}
					}

					jQuery.telligent.evolution.put({
						url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json?IncludeFields=Id',
						data: data
					})
						.then(function() {
							d.resolve();
						})
						.catch(function() {
							d.reject();
						});
				});
		}).promise();
	}

	function initializeValidation(context) {

		context.saveButton.evolutionValidation({
			onValidated: function(isValid, buttonClicked, c) {
				if (isValid)
					context.saveButton.removeClass('disabled');
				else {
					context.saveButton.addClass('disabled');

					if (c && c.tab) {
						var e = context.headerWrapper.find('a[data-tab="' + c.tab + '"]');
						e.parent().siblings('.filter-option').removeClass('selected');
						e.parent().addClass('selected');

						updateVisibleTab(context);
					}
				}
			},
			onSuccessfulClick: function(e) {
				context.saveButton.addClass('disabled');

				save(context)
					.then(function() {
						$.telligent.evolution.notifications.show(context.text.saveSuccessful, {
							type: 'success'
						});
						$.telligent.evolution.messaging.publish('entity.updated', {
							entity: 'User',
							id: context.userId
						});
					})
					.always(function() {
						context.saveButton.removeClass('disabled');
					});

				return false;
			}
		});

		context.saveButton.evolutionValidation('addField',
			'#' + context.fieldIds.privateEmail,
			{
				required: true,
				email: true
			},
			context.fields.privateEmail.closest('.field-item').find('.field-item-validation'), { tab: 'settings' });

		if (context.signatureMaxLength > 0 && context.editors.signature) {
			context.editors.signature.attachChangeScript(context.saveButton.evolutionValidation(
				'addCustomValidation',
				'signature',
				function() {
					return context.editors.signature.getHtml().length < context.signatureMaxLength;
				},
				context.text.signatureTooLong,
				$('#' + context.editors.signature.validationId),
				{ tab: 'settings' }
			));
		}

		var validateBanning = context.saveButton.evolutionValidation(
			'addCustomValidation',
			'banning',
			function() {
				if (context.fields.accountStatus.val() == 'Banned') {
					var d = context.fields.bannedUntil.glowDateTimeSelector('val');
					return (d != null && d > (new Date()));
				} else {
					return true;
				}
			},
			context.text.bannedDateRequired,
			context.fields.bannedUntil.closest('.field-item').find('.field-item-validation'),
			{ tab: 'administration' }
		);
		context.fields.accountStatus.on('change', function() {
			validateBanning();
		});
		context.fields.bannedUntil.on('glowDateTimeSelectorChange', function() {
			validateBanning();
		});

		$(context.fields.verifyBypass).on('click', function(e)
		{
			e.preventDefault();
			if(confirm(context.text.verifyBypassConfirmation))
			{
				var data = {
					emailAddress: $(this).data('email'),
					userId: $(this).data('user')
				};
				$.telligent.evolution.post({
					url: context.urls.verifyBypass,
					data: data
				}).then(function() {
					$.telligent.evolution.notifications.show(context.text.verifyBypassSuccess, {
						type: 'success'
					});
					$(context.fields.verifyBypassCallout).hide();
				});
			}
		});
	}

	function refreshGroupList(context, delay) {
		global.clearTimeout(context.refreshTimeout);

		if (delay === true) {
			context.refreshTimeout = global.setTimeout(function() {
				refreshGroupList(context, false);
			}, 250);
		} else {
			context.groupsList.empty();
			context.fieldIds.noGroupResults.hide();
			context.groupsListScrollableResults.reset();
		}
	}

	$.telligent.evolution.widgets.userAdministration = {
		register: function(context) {
			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			if (context.avatarHtml) {
				$.telligent.evolution.administration
					.header()
					.siblings('.administration-panel-heading-meta')
					.find('.name')
					.before('<span class="avatar">' + context.avatarHtml + '</span>');
			}

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.headerWrapper.on('click', '.filter-option a', function() {
				var e = $(this);
				e.parent().siblings('.filter-option').removeClass('selected');
				e.parent().addClass('selected');

				updateVisibleTab(context);

				return false;
			});

			context.saveButton = context.headerWrapper.find('.save');

			$('.field-item.view-id a', context.wrapper).on('click', function() {
			   var item = $(this).closest('li');
			   item.siblings('.id').show();
			   item.hide();
			   return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.delete', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.del,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.del
					})
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.merge', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.merge,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.merge
					})
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.unlock', function (data) {
				$.telligent.evolution.post({
					url: context.urls.unlock
				})
					.then(function() {
						$.telligent.evolution.notifications.show(context.text.unlockSuccessful, {
							type: 'success'
						});
						$.telligent.evolution.administration.refresh();
					});

				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.impersonate', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.impersonate,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.impersonate
					})
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.changeavatar', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.changeavatar,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.changeavatar
					})
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.changecoverphoto', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.changecoverphoto,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.changecoverphoto
					})
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.changeusername', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.changeusername,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.changeusername
					})
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.changepassword', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.changepassword,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.changepassword
					})
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.addremovepoints', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.addremovepoints,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.addremovepoints
					})
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.addtorole', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.addtorole,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.addtorole
					})
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.removefromrole', function (data) {
				var roleId = $(data.target).data('roleid');
				var roleName = $(data.target).data('title');
				if (global.confirm(context.text.removeMemberFromRoleConfirmation.replace(/\{0\}/g, roleName))) {
					$.telligent.evolution.del({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/roles/{RoleId}/user/{UserId}.json',
						data: {
							UserId: context.userId,
							RoleId: roleId
						}
					})
						.then(function() {
							$.telligent.evolution.notifications.show(context.text.removedFromRoleSuccessful.replace(/\{0\}/g, roleName), {
								type: 'success'
							});
							$('.content-item[data-roleid="' + roleId + '"]').slideUp('fast', function() { $(this).remove(); });
						});
				}

				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.exportuserdata', function (data) {
				$.telligent.evolution.post({
					url: context.urls.exportData
				})
					.then(function() {
						$.telligent.evolution.notifications.show(context.text.exportRequested, {
							type: 'success'
						});
					});

				return false;
			});

			$.telligent.evolution.messaging.subscribe('administeruser.forcelogin', function (data) {
				$.telligent.evolution.post({
					url: context.urls.forceLogin
				})
					.then(function() {
						$.telligent.evolution.notifications.show(context.text.forceLoginRequested, {
							type: 'success'
						});
					});

				return false;
			});

			$(context.wrapper)
				.on('input', '.filter-selector.roles input[type="text"]', function() {
					var searchText = $(this).val();
					global.clearTimeout(context.roleSearchTimeout);
					context.roleSearchTimeout = global.setTimeout(function() {
						searchText = $.trim(searchText || '').toLowerCase();
						if (searchText.length == 0) {
							$('.content-item.role', context.wrapper).show();
						} else {
							var searchTerms = searchText.split(' ');
							$('.content-item.role', context.wrapper).each(function() {
								var cft = $(this);
								var text = cft.data('text');
								var match = true;
								for (var i = 0; i < searchTerms.length; i++) {
									if (text.indexOf(searchTerms[i]) == -1) {
										match = false;
										break;
									}
								}
								if (match) {
									cft.slideDown('fast');
								} else {
									cft.slideUp('fast');
								}
							})
						}
					}, 125);
				});

			$.telligent.evolution.messaging.subscribe('entity.updated', function(data) {
				if (data && data.entity == 'User') {
					if (!data.properties) {
						// nothing to do.
					}
					else if ($.grep(data.properties, function(x) {
						return x != 'AvatarUrl' && x != 'Points' && x != 'Roles';
					}).length == 0) {
						update(context);
					} else {
						$.telligent.evolution.administration.refresh();
					}
				}
			});

			context.list = $('.content-list.groups', $.telligent.evolution.administration.panelWrapper());

			$.telligent.evolution.messaging.subscribe('administeruser.editGroupUser', function(data) {
				var t = $(data.target);
				var membershipType = t.data('to');
				var groupId = t.data('groupid');
				if (groupId) {
					var parent = $('.content-item[data-groupid="' + groupId + '"]', context.list);
					$.telligent.evolution.post({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users.json',
						data: {
							GroupId: groupId,
							GroupMembershipType: membershipType,
							UserId: context.userId
						},
						success: function() {
							$.telligent.evolution.get({
								url: context.urls.refreshGroupMember,
								data: {
									w_groupId: groupId
								}
							})
								.then(function(html) {
									var newMembershipType = $(html).data('membershiptype');
									if (newMembershipType != membershipType) {
										global.alert(context.text.userMembershipTypeAffectedByRoles);
									}
									parent.replaceWith(html);
								});
						}
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('administeruser.deleteGroupUser', function(data) {
				var t = $(data.target);
				var groupId = t.data('groupid');

				if (groupId) {
					var parent = $('.content-item[data-groupid="' + groupId + '"]', context.list);
					var isRoleMember = t.data('isrolemember');
					var isDirectMember = t.data('isdirectmember');
					if (isDirectMember) {
						if (global.confirm(context.text.confirmDeleteGroup)) {
							$.telligent.evolution.del({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users/{UserId}.json',
								data: {
									GroupId: groupId,
									UserId: context.userId
								},
								success: function() {
									if (isRoleMember) {
										$.telligent.evolution.get({
											url: context.urls.refreshGroupMember,
											data: {
												w_groupId: groupId
											}
										})
											.then(function(html) {
											   parent.replaceWith(html);
											});
									} else {
										parent.slideUp(100, function() {
											parent.remove();
											if (context.list.children().length == 0) {
												context.fieldIds.noGroupResults.show();
											}
										});
									}
								}
							});
						}
					} else if (isRoleMember) {
						global.alert(context.text.roleMembersCannotBeDeletedAsUsers);
					}
				}
			});

			context.groupsList = $('ul.content-list.groups', context.wrapper);
			context.groupsListScrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.groupsList,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						var searchText = $('.filter-selector.groups input[type="text"]', context.wrapper).val()
						searchText = $.trim(searchText || '').toLowerCase();

						var membershipType = $('.filter-selector.groups select.membershiptype', context.wrapper).val()
						var memberType = $('.filter-selector.groups select.membertype', context.wrapper).val()

						var url = context.urls.listGroups
						if (membershipType == 'pending') {
							url = context.urls.listGroupsPending
						}

						$.telligent.evolution.get({
							url: url,
							data: {
								w_pageindex: pageIndex,
								w_groupName: searchText,
								w_membershipType: memberType
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (items.length > 0) {
								context.groupsList.append(items);
								if (r.data('hasmore') === true) {
									d.resolve();
								} else {
									d.reject();
								}
							} else {
								d.reject();
								if(pageIndex === 0) {
									context.fieldIds.noGroupResults.show();
								}
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});

			$(context.wrapper)
				.on('input', '.filter-selector.groups input[type="text"]', function() {
					refreshGroupList(context, true);
				});

			$(context.wrapper)
				.on('change', '.filter-selector.groups select.membershiptype', function() {
					if ($(this).val() == 'pending') {
						$('.filter-selector.groups select.membertype').hide();
					}
					else {
						$('.filter-selector.groups select.membertype').show();
					}
					refreshGroupList(context, true);
				});

			$(context.wrapper)
				.on('change', '.filter-selector.groups select.membertype', function() {
					refreshGroupList(context, true);
				});

			initializeFields(context);
			initializeValidation(context);
			updateVisibleTab(context);
		}
	};

}(jQuery, window));