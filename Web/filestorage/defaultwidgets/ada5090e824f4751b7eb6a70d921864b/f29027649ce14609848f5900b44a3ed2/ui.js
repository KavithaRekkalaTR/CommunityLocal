(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function showDeleteForm(context, userIds) {
		if (userIds.length == 0) {
			$.telligent.evolution.notifications.show(context.text.noUsersToDelete, {
				type: 'error'
			});
			return;
		}

		$.telligent.evolution.administration.open({
			name: userIds.length > 1 ? context.text.dels.replace(/\{0\}/g, userIds.length) : context.text.del.replace(/\{0\}/g, userIds.length),
			cssClass: 'administer-users',
			content: $.telligent.evolution.post({
				url: context.urls.del,
				data: {
					userIds: userIds.join(',')
				}
			})
		});
	}

	function showMergeForm(context, userId, displayName) {
		$.telligent.evolution.administration.open({
			name: context.text.merge.replace(/\{0\}/g, displayName),
			cssClass: 'administer-users',
			content: $.telligent.evolution.post({
				url: context.urls.merge,
				data: {
					userId: userId,
					displayName: displayName
				}
			})
		});
	}

	function showBanForm(context, userIds) {
		if (userIds.length == 0) {
			$.telligent.evolution.notifications.show(context.text.noUsersToBan, {
				type: 'error'
			});
			return;
		}

		$.telligent.evolution.administration.open({
			name: userIds.length > 1 ? context.text.bans.replace(/\{0\}/g, userIds.length) : context.text.ban.replace(/\{0\}/g, userIds.length),
			cssClass: 'administer-users',
			content: $.telligent.evolution.post({
				url: context.urls.ban,
				data: {
					userIds: userIds.join(',')
				}
			})
		});
	}

	function showCreateUserForm(context) {
		$.telligent.evolution.administration.open({
			name: context.text.createUser,
			cssClass: 'administer-users',
			content: $.telligent.evolution.get({
				url: context.urls.createUser
			})
		});
	}

	function findRoles(context, textbox, searchText) {
		window.clearTimeout(context.lookupRoleTimeout);
		textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)]);
		context.lookupRoleTimeout = window.setTimeout(function () {
			$.telligent.evolution.get({
				url: context.urls.lookupRolesUrl,
				data: { w_query: searchText },
				success: function (response) {
					if (response && response.matches.length > 1) {
						var suggestions = [];
						for (var i = 0; i < response.matches.length; i++) {
							var item = response.matches[i];
							if (item && item.roleId) {
								suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.roleId, context.text.roleSelected.replace(/\{0\}/g, item.title), item.preview, true));
							}
						}

						textbox.glowLookUpTextBox('updateSuggestions', suggestions);
					}
					else
						textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', context.text.noRolesMatch, context.text.noRolesMatch, false)]);
				}
			});
		}, 500);
	}

	function updateDateRangeOptions(context) {
		var currentValue = context.fields.joinedVisitedDate.val();
		if (currentValue.length == 0) {
			context.fields.joinedVisitedDateStartWrapper.hide();
			context.fields.joinedVisitedDateEndWrapper.hide();
		} else if (currentValue.indexOf('Between') > -1) {
			context.fields.joinedVisitedDateStartWrapper.show();
			context.fields.joinedVisitedDateEndWrapper.show();
		} else {
			context.fields.joinedVisitedDateStartWrapper.show();
			context.fields.joinedVisitedDateEndWrapper.hide();
		}
	}

	function refreshList(context) {
		context.lastRenderedQuery = null;
		context.userList.empty();
		context.fields.noResults.hide();
		updateSelectionState(context);
		context.userListScrollableResults.reset();
	}

	function queryIsValid(context) {
		var currentValue = context.fields.joinedVisitedDate.val();
		if (currentValue.length > 0) {
			if (!context.query.date1) {
				return false;
			}
			if (currentValue.indexOf('Between') > -1 && !context.query.date2) {
				return false;
			}
		}
		return true;
	}

	function refreshIfValid(context, delay) {
		global.clearTimeout(context.refreshTimeout);

		if (!queryIsValid(context)) {
			return;
		}

		if (delay === true) {
			context.refreshTimeout = global.setTimeout(function() {
				refreshList(context);
			}, 250);
		} else {
			refreshList(context);
		}
	}

	function updateSelectionState(context) {
		var selected = context.wrapper.find('input[type="checkbox"]:checked').length;
		if (selected == 0) {
			context.fields.selectionActions.hide();
			context.fields.clearSelection.hide();
			context.fields.export.html(context.text.exportAll);
		} else {
			if (selected == 1) {
				context.fields.selectionActions.find('[data-more]').html(context.text.modifyMember.replace(/\{0\}/g, 1));
				context.fields.export.html(context.text.exportMember.replace(/\{0\}/g, 1));
			} else {
				context.fields.selectionActions.find('[data-more]').html(context.text.modifyMembers.replace(/\{0\}/g, selected));
				context.fields.export.html(context.text.exportMembers.replace(/\{0\}/g, selected));
			}
			context.fields.selectionActions.show();
			context.fields.clearSelection.show();
		}
	}

	$.telligent.evolution.widgets.memberSearch = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.query = {
			  query: '',
			  roleId: '',
			  accountStatus: context.fields.accountStatus.val(),
			  dateComparison: '',
			  date1: '',
			  date2: '',
			  sortBy: context.fields.sortBy.val(),
			  sortOrder: context.fields.sortOrder.val()
			};

			context.fields.export = $('#' + context.fieldIds.exportActionId);
			context.fields.clearSelection = $('#' + context.fieldIds.clearSelection);
			context.fields.selectionActions = $('#' + context.fieldIds.selectionActions);
			context.fields.memberCount = $('#' + context.fieldIds.memberCountId);

			context.fields.userQuery.on('input', function() {
			   context.query.query = context.fields.userQuery.val();
			   refreshIfValid(context, true);
			});

			context.fields.roleQuery.glowLookUpTextBox({
				maxValues: 1,
				onGetLookUps: function(tb, query) {
					findRoles(context, tb, query);
				},
				emptyHtml: context.text.roleLookupPlaceholder,
				minimumLookUpLength: 0
			})
				.on('glowLookUpTextBoxChange', function() {
					context.query.roleId = '';
					if (context.fields.roleQuery.glowLookUpTextBox('count') > 0) {
						context.query.roleId = context.fields.roleQuery.glowLookUpTextBox('getByIndex', 0).Value;
					}
					refreshIfValid(context);
				});

			context.fields.joinedVisitedDate.on('change', function() {
			   context.query.dateComparison = context.fields.joinedVisitedDate.val();
			   updateDateRangeOptions(context);
			   refreshIfValid(context);
			});

			context.fields.joinedVisitedDateStartDate
				.glowDateTimeSelector($.extend({}, $.fn.glowDateTimeSelector.dateDefaults))
				.on('glowDateTimeSelectorChange', function() {
					var date = context.fields.joinedVisitedDateStartDate.glowDateTimeSelector('val');
					if (date == null) {
						context.query.date1 = '';
					} else {
						context.query.date1 = $.telligent.evolution.formatDate(date);
					}
					refreshIfValid(context);
				});

			context.fields.joinedVisitedDateEndDate
				.glowDateTimeSelector($.extend({}, $.fn.glowDateTimeSelector.dateDefaults))
				.on('glowDateTimeSelectorChange', function() {
					var date = context.fields.joinedVisitedDateEndDate.glowDateTimeSelector('val');
					if (date == null) {
						context.query.date2 = '';
					} else {
						context.query.date2 = $.telligent.evolution.formatDate(date);
					}
					refreshIfValid(context);
				});

			context.fields.accountStatus.on('change', function() {
				context.query.accountStatus = context.fields.accountStatus.val();
				refreshIfValid(context);
			});

			context.fields.sortBy.on('change', function() {
				context.query.sortBy = context.fields.sortBy.val();
				refreshIfValid(context);
			});

			context.fields.sortOrder.on('change', function() {
				context.query.sortOrder = context.fields.sortOrder.val();
				refreshIfValid(context);
			});

			$.telligent.evolution.messaging.subscribe('membersearch.add', function (data) {
				showCreateUserForm(context);
			});

			$.telligent.evolution.messaging.subscribe('membersearch.export', function (data) {
				if (!queryIsValid(context)) {
					$.telligent.evolution.notifications.show(context.text.cannotExportInvalidQuery, {
						type: 'error'
					});
					return;
				}

				var userIds = [];
				context.wrapper.find('input[type="checkbox"]:checked').each(function() {
					userIds.push($(this).val());
				});

				$.telligent.evolution.administration.open({
					name: context.text.export,
					cssClass: 'administration-users',
					content: $.telligent.evolution.get({
						url: context.urls.csvExport,
						data: {
							w_query: $.telligent.evolution.url.serializeQuery({
								w_userIds: userIds.length > 0 ? userIds.join(',') : '',
								w_pageindex: 0,
								w_query: context.query.query,
								w_roleId: context.query.roleId,
								w_accountStatus: context.query.accountStatus,
								w_dateComparison: context.query.dateComparison,
								w_date1: context.query.date1,
								w_date2: context.query.date2,
								w_sortBy: context.query.sortBy,
								w_sortOrder: context.query.sortOrder
							})
						}
					})
				});
			});

			$.telligent.evolution.messaging.subscribe('membersearch.changestatuses', function (data) {
				var toStatus = $(data.target).data('status');

				var userIds = [];
				context.wrapper.find('input[type="checkbox"]:checked').each(function() {
					userIds.push($(this).val());
				});

				if (toStatus == 'Banned') {
					showBanForm(context, userIds);
					return;
				}

				if (!global.confirm(context.text.changeStatusConfirm)) {
					return;
				}

				var tasks = [];
				var count = 0;
				var batchId = null;

				var baseData = {
					AccountStatus: toStatus
				};

				$.each(userIds, function(index, userId) {
					if (batchId === null || count >= 100) {
						if (count >= 100) {
							tasks.push($.telligent.evolution.batch.process(batchId, {
								sequential: false
							}));
						}
						batchId = $.telligent.evolution.batch.create();
						count = 0;
					}

					var data = $.extend({}, baseData, {
						UserId: userId
					});

					$.telligent.evolution.put({
						url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json?IncludeFields=Id',
						data: data,
						batch: batchId
					});

					count++;
				});

				if (count > 0) {
					tasks.push($.telligent.evolution.batch.process(batchId, {
						sequential: false
					}));
				}

				$.when.apply($, tasks)
					.then(function() {
					   $.telligent.evolution.notifications.show(context.text.changeStatusSuccessful, {
						   type: 'success'
					   });
					   refreshIfValid(context);
					});
			});

			$.telligent.evolution.messaging.subscribe('membersearch.deleteall', function (data) {
				var userIds = [];
				context.wrapper.find('input[type="checkbox"]:checked').each(function() {
					userIds.push($(this).val());
				});

				showDeleteForm(context, userIds);
			});

			$.telligent.evolution.messaging.subscribe('membersearch.delete', function (data) {
				var userId = $(data.target).data('userid');
				var userIds = [];
				if (userId) {
					userIds.push(userId);
				}

				showDeleteForm(context, userIds);
			});

			$.telligent.evolution.messaging.subscribe('membersearch.merge', function (data) {
				var userId = $(data.target).data('userid');
				var displayName = $(data.target).data('displayname');

				showMergeForm(context, userId, displayName);
			});

			$.telligent.evolution.messaging.subscribe('membersearch.clearselection', function (data) {
				context.wrapper.find('input[type="checkbox"]:checked').prop('checked', false);
				updateSelectionState(context);
			});

			context.wrapper.on('change', 'input[type="checkbox"]', function() {
				updateSelectionState(context);
			});

			context.wrapper.on('click', '.avatar', function() {
				var e = $(this);
				var cb = e.closest('.content-item').find('input[type="checkbox"]')
				cb.prop("checked", !cb.prop("checked"));
				updateSelectionState(context);
			});

			$.telligent.evolution.messaging.subscribe('membersearch.refresh', function (data) {
				refreshIfValid(context);
			});

			$.telligent.evolution.messaging.subscribe('membersearch.usercreated', function (data) {
				if (data.userId) {
					$.telligent.evolution.get({
						url: context.urls.getEditUserUrl,
						data: {
							w_userId: data.userId
						}
					})
						.then(function(response) {
						   if (response && response.url) {
							   global.location = response.url;
						   }
						});
				}
			});

			context.shouldRefresh = false;
			context.entityUpdatedSubscription = $.telligent.evolution.messaging.subscribe('entity.updated', function(d) {
				if (d && d.entity == 'User') {
					context.shouldRefresh = true;
				}
			}, { excludeAutoNameSpaces: true });
			context.entityDeletedSubscription = $.telligent.evolution.messaging.subscribe('entity.deleted', function(d) {
				if (d && d.entity == 'User') {
					context.shouldRefresh = true;
				}
			}, { excludeAutoNameSpaces: true });
			context.entityMergedSubscription = $.telligent.evolution.messaging.subscribe('entity.merged', function(d) {
				if (d && d.entity == 'User') {
					context.shouldRefresh = true;
				}
			}, { excludeAutoNameSpaces: true });
			$.telligent.evolution.administration.on('panel.unloaded', function(){
				$.telligent.evolution.messaging.unsubscribe(context.entityUpdatedSubscription);
				$.telligent.evolution.messaging.unsubscribe(context.entityDeletedSubscription);
				$.telligent.evolution.messaging.unsubscribe(context.entityMergedSubscription);
			});
			$.telligent.evolution.administration.on('panel.shown', function(){
				if (context.shouldRefresh) {
					context.shouldRefresh = false;
					refreshIfValid(context);
				}
			});

			updateDateRangeOptions(context);
			updateSelectionState(context);

			function queryMatches(queryA, queryB, considerPaging) {
				return (queryA && queryB &&
					queryA.query == queryB.query &&
					queryA.roleId == queryB.roleId &&
					queryA.accountStatus == queryB.accountStatus &&
					queryA.dateComparison == queryB.dateComparison &&
					queryA.date1 == queryB.date1 &&
					queryA.date2 == queryB.date2 &&
					queryA.sortBy == queryB.sortBy &&
					queryA.sortOrder == queryB.sortOrder &&
					(!considerPaging ||
						((queryA.pageIndex || 0) === (queryB.pageIndex || 0))
					)
				);
			}

			function prefix(obj) {
				var prefixed = {};
				for (var property in obj) {
					if (obj.hasOwnProperty(property)) {
						prefixed['w_' + property] = obj[property]
					}
				}
				return prefixed;
			}

			context.userList = $('ul', context.wrapper);
			context.userListScrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.userList,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						var query = {
							pageIndex: pageIndex,
							query: context.query.query,
							roleId: context.query.roleId,
							accountStatus: context.query.accountStatus,
							dateComparison: context.query.dateComparison,
							date1: context.query.date1,
							date2: context.query.date2,
							sortBy: context.query.sortBy,
							sortOrder: context.query.sortOrder
						};
						$.telligent.evolution.get({
							url: context.urls.listUsers,
							data: prefix(query)
						})
						.then(function (response) {
							// new query since requesting result for last query
							if (!queryMatches(query, context.query)) {
								d.reject();
								return;
							}

							// avoding re-render/duplication of rapid re-request of currently-rendered query
							if (context.lastRenderedQuery && queryMatches(context.lastRenderedQuery, query, true)) {
								d.reject();
								return;
							}

							var r = $(response.list)[0];
							var items = $('li.content-item', r);
							context.fields.memberCount.empty().append(response.count);

							if (items.length > 0) {
								context.userList.append(items);
								context.lastRenderedQuery = query;
								if ($(r).data('hasmore') === true) {
									d.resolve();
								} else {
									d.reject();
								}
							} else {
								d.reject();
								if(pageIndex === 0) {
									context.fields.noResults.show();
								}
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});
		}
	};

}(jQuery, window));