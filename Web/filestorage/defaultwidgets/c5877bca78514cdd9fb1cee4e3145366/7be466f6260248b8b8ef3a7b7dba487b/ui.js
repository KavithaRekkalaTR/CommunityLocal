(function ($, global) {

	function checkNoResults(context) {
		var list = $('ul.content-list', $.telligent.evolution.administration.panelWrapper());
		if (list.find('li').length == 0) {
			var message;

			if (context.filter == 'roles') {
				if (context.membershiptype || context.query) {
					message = context.text.noRolesWithQuery;
				} else {
					message = context.text.noRoles;
				}
			} else if (context.filter == 'requests') {
				message = context.text.noRequests;
			} else if (context.filter == 'invitations') {
				if (context.invitationstate) {
					message = context.text.noInvitationsWithQuery;
				} else {
					message = context.text.noInvitations;
				}
			} else {
				// members
				if (context.membershiptype || context.query) {
					message = context.text.noMembersWithQuery;
				} else {
					message = context.text.noMembers;
				}
			}

			if (list.find('.norecords').length == 0) {
				list.append('<div class="message norecords">' + message + '</div>');
			}
		} else {
			$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
		}
	}

	function getPagedMembers(options, pageIndex) {
		var query = options.query;
		var membershipType = options.membershiptype;
		return $.Deferred(function (d) {
			$.telligent.evolution.get({
				url: options.urls.pagedMembers,
				data: {
					w_pageindex: pageIndex,
					w_query: options.query,
					w_membershiptype: options.membershiptype
				}
			})
			.then(function (response) {
				if (query != options.query || membershipType != options.membershiptype) {
					d.reject();
					return;
				}
				var r = $(response);
				
				if (pageIndex == 0) {
				    updateResultOverview(options, $('.result-overview', r));
				}
				
				var items = $('li.content-item', r);
				if (items.length > 0) {
					options.list.append(items);
					if (r.data('hasmore') === true) {
						d.resolve();
					} else {
						d.reject();
					}
				} else {
					d.reject();
				}
				checkNoResults(options);
			})
			.catch(function () {
				d.reject();
			});
		});
	}
	
	function updateResultOverview(options, overview) {
	    $('.result-overview', $.telligent.evolution.administration.panelWrapper()).remove();
	    if (overview) {
	        overview.insertBefore(options.list);
	    }
	}

	function getPagedRoles(options, pageIndex) {
		var membershipType = options.membershiptype;
		return $.Deferred(function (d) {
			$.telligent.evolution.get({
				url: options.urls.pagedRoles,
				data: {
					w_pageindex: pageIndex,
					w_membershiptype: options.membershiptype
				}
			})
			.then(function (response) {
				if (membershipType != options.membershiptype) {
					d.reject();
					return;
				}

				var r = $(response);
				
				if (pageIndex == 0) {
				    updateResultOverview(options, $('.result-overview', r));
				}
				
				var items = $('li.content-item', r);
				if (items.length > 0) {
					options.list.append(items);
					if (r.data('hasmore') === true) {
						d.resolve();
					} else {
						d.reject();
					}
				} else {
					d.reject();
				}
				checkNoResults(options);
			})
			.catch(function () {
				d.reject();
			});
		});
	}

	function getPagedRequests(options, pageIndex) {
		return $.Deferred(function (d) {
			$.telligent.evolution.get({
				url: options.urls.pagedRequests,
				data: {
					w_pageindex: pageIndex
				}
			})
			.then(function (response) {
				var r = $(response);
				
				if (pageIndex == 0) {
				    updateResultOverview(options, $('.result-overview', r));
				}
				
				var items = $('li.content-item', r);
				if (items.length > 0) {
					options.list.append(items);
					if (r.data('hasmore') === true) {
						d.resolve();
					} else {
						d.reject();
					}
				} else {
					d.reject();
				}
				checkNoResults(options);
			})
			.catch(function () {
				d.reject();
			});
		});
	}

	function getPagedInvitations(options, pageIndex) {
		var invitationState = options.invitationstate;
		return $.Deferred(function (d) {
			$.telligent.evolution.get({
				url: options.urls.pagedInvitations,
				data: {
					w_pageindex: pageIndex,
					w_state: options.invitationstate
				}
			})
			.then(function (response) {
				if (options.invitationstate != invitationState) {
					d.reject();
					return;
				}
				var r = $(response);
				
				if (pageIndex == 0) {
				    updateResultOverview(options, $('.result-overview', r));
				}
				
				var items = $('li.content-item', r);
				if (items.length > 0) {
					options.list.append(items);
					if (r.data('hasmore') === true) {
						d.resolve();
					} else {
						d.reject();
					}
				} else {
					d.reject();
				}
				checkNoResults(options);
			})
			.catch(function () {
				d.reject();
			});
		});
	}

	function selectFilter(options, filter, forceReload) {
		var elm = $('.filter-option a[data-filter="' + filter + '"]');
		if (options.filter != filter || forceReload === true) {
			options.filter = filter;
			options.list.empty();
			options.scrollableResults.reset();
		}
		$('.field-item', $.telligent.evolution.administration.panelWrapper()).hide();
		$('.field-item[data-showfor~="' + filter + '"]', $.telligent.evolution.administration.panelWrapper()).show();
		$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
		elm.closest('ul').children('li').removeClass('selected');
		elm.parent().addClass('selected');
		$.telligent.evolution.administration.header();
	}

	function showInvite(options) {
		$.telligent.evolution.administration.open({
			name: options.text.inviteMembersTitle,
			content: $.telligent.evolution.get({
			   url: options.urls.inviteMember
			}),
			cssClass: 'contextual-groupmembers'
		});
	}

	function showAdd(options) {
		$.telligent.evolution.administration.open({
			name: options.text.addMembersTitle,
			content: $.telligent.evolution.get({
			   url: options.urls.addMember
			}),
			cssClass: 'contextual-groupmembers'
		});
	}

	var api = {
		register: function (options) {
			options.list = $('.content-list', $.telligent.evolution.administration.panelWrapper());
			options.query = '';
			options.filter = 'members';

			$.telligent.evolution.messaging.subscribe('groupmembers.filter', function(data){
				var filter = $(data.target).data('filter');
				selectFilter(options, filter);
			});

			$.telligent.evolution.messaging.subscribe('groupmembers.showadd', function(data){
				showAdd(options);
			});

			$.telligent.evolution.messaging.subscribe('groupmembers.showinvite', function(data){
				showInvite(options);
			});

			$.telligent.evolution.messaging.subscribe('groupmembers.expireinvites', function(data){
				if (options.filter == 'invitations') {
					selectFilter(options, options.filter, true);
				}
			});
			
			$.telligent.evolution.messaging.subscribe('groupmembers.expiremembers', function(data){
				if (options.filter == 'members' || options.filter == 'roles') {
					selectFilter(options, options.filter, true);
				}
			});

			$.telligent.evolution.messaging.subscribe('groupmembers.resend', function(data){
				var invitationKey = $(data.target).data('invitationkey');
				var parent = $('.content-item[data-invitationkey="' + invitationKey + '"]', options.list);
				$.telligent.evolution.post({
					url: options.urls.resendInvitation,
					data: {
						InvitationKey: invitationKey
					}
				})
					.then(function(result) {
						$.telligent.evolution.notifications.show(options.text.invitationResent, {
							type: 'success'
						});
						if (options.invitationstate && options.invitationstate != 'Pending') {
							parent.slideUp(100, function() {
								parent.remove();
								if (options.list.children().length == 0) {
									selectFilter(options, options.filter, true);
								}
							});
						} else {
							parent.replaceWith(result.html);
						}
					})
			});

			$.telligent.evolution.messaging.subscribe('groupmembers.cancel', function(data){
				if (global.confirm(options.text.confirmInvitationCancellation)) {
					var t = $(data.target);
					var parent = t.closest('.content-item.invitation');
					var invitationKey = t.data('invitationkey');
					$.telligent.evolution.post({
						url: options.urls.deleteInvitation,
						data: {
							InvitationKey: invitationKey
						}
					})
						.then(function() {
							$.telligent.evolution.notifications.show(options.text.invitationCancelled, {
								type: 'success'
							});
							parent.slideUp(100, function() {
								parent.remove();
								if (options.list.children().length == 0) {
									selectFilter(options, options.filter, true);
								}
							});
						});
				}
			});

			$.telligent.evolution.messaging.subscribe('groupmembers.edit', function(data) {
				var t = $(data.target);
				var membershipType = t.data('to');
				var userId = t.data('userid');
				var roleId = t.data('roleid');
				if (userId) {
					var parent = $('.content-item[data-userid="' + userId + '"]', options.list);
					$.telligent.evolution.post({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users.json',
						data: {
							GroupId: options.groupId,
							GroupMembershipType: membershipType,
							UserId: userId
						},
						success: function() {
							if (options.filter == 'pending' || (options.membershiptype && options.membershiptype != membershipType)) {
								parent.slideUp(100, function() {
									parent.remove();
									if (options.list.children().length == 0) {
										selectFilter(options, options.filter, true);
									}
								});
							} else {
								$.telligent.evolution.get({
									url: options.urls.refreshUserMember,
									data: {
										w_userId: userId
									}
								})
									.then(function(html) {
										var newMembershipType = $(html).data('membershiptype');
										if (newMembershipType != membershipType) {
											global.alert(options.text.userMembershipTypeAffectedByRoles);
										}
										parent.replaceWith(html);
									});
							}
						}
					});
				} else if (roleId) {
					var parent = $('.content-item[data-roleid="' + roleId + '"]', options.list);
					$.telligent.evolution.post({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/roles.json',
						data: {
							GroupId: options.groupId,
							GroupMembershipType: membershipType,
							RoleId: roleId
						},
						success: function() {
							if(options.membershiptype && options.membershiptype != membershipType) {
								parent.slideUp(100, function() {
									parent.remove();
									if (options.list.children().length == 0) {
										selectFilter(options, options.filter, true);
									}
								});
							} else {
								$.telligent.evolution.get({
									url: options.urls.refreshRoleMember,
									data: {
										w_roleId: roleId
									}
								})
									.then(function(html) {
									   parent.replaceWith(html);
									});
							}
						}
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('groupmembers.delete', function(data) {
				var t = $(data.target);
				var userId = t.data('userid');
				var roleId = t.data('roleid');
				if (userId) {
					var parent = $('.content-item[data-userid="' + userId + '"]', options.list);
					var isRoleMember = t.data('isrolemember');
					var isDirectMember = t.data('isdirectmember');
					if (isDirectMember) {
						if (options.filter == 'requests' || global.confirm(options.text.confirmDeleteUser)) {
							$.telligent.evolution.del({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users/{UserId}.json',
								data: {
									GroupId: options.groupId,
									UserId: userId
								},
								success: function() {
									if (isRoleMember) {
										$.telligent.evolution.get({
											url: options.urls.refreshUserMember,
											data: {
												w_userId: userId
											}
										})
											.then(function(html) {
											   parent.replaceWith(html);
											});
									} else {
										parent.slideUp(100, function() {
											parent.remove();
											if (options.list.children().length == 0) {
												selectFilter(options, options.filter, true);
											}
										});
									}
								}
							});
						}
					} else if (isRoleMember) {
						global.alert(options.text.roleMembersCannotBeDeletedAsUsers);
					}
				} else if (roleId) {
					if (global.confirm(options.text.confirmDeleteRole)) {
						var parent = $('.content-item[data-roleid="' + roleId + '"]', options.list);
						$.telligent.evolution.del({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/roles/{RoleId}.json',
							data: {
								GroupId: options.groupId,
								RoleId: roleId
							},
							success: function() {
								parent.slideUp(100, function() {
									parent.remove();
									if (options.list.children().length == 0) {
										selectFilter(options, options.filter, true);
									}
								});
							}
						});
					}
				}
			});
			
			$.telligent.evolution.messaging.subscribe('groupmembers.export', function(data) {
			    global.open(options.urls.csvExport);
			});

			options.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: options.list,
				load: function (pageIndex) {
					if (options.filter == 'roles') {
						return getPagedRoles(options, pageIndex);
					} else if (options.filter == 'requests') {
						return getPagedRequests(options, pageIndex);
					} else if (options.filter == 'invitations') {
						return getPagedInvitations(options, pageIndex);
					} else {
						return getPagedMembers(options, pageIndex);
					}
				}
			});

			var header = $.telligent.evolution.administration.header();
			header.append('<fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="#" class="button add two-wide" data-messagename="groupmembers.showadd">' + options.text.addMember + '</a><a href="#" class="button invite two-wide" data-messagename="groupmembers.showinvite">' + options.text.inviteMember + '</a></span></li></ul></fieldset>');

			var filters = $('<ul class="filter"></ul>');
			filters.append($('<li class="filter-option selected"><a href="#" data-messagename="groupmembers.filter" data-filter="members">' + options.text.members + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="groupmembers.filter" data-filter="roles">' + options.text.roles + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="groupmembers.filter" data-filter="requests">' + options.text.requests + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="groupmembers.filter" data-filter="invitations">' + options.text.invitations + '</a></li>'));
			header.append(filters);

			$.telligent.evolution.administration.header();

			$('select', $.telligent.evolution.administration.panelWrapper())
				.on('change', function() {
				   var key = $(this).data('filtername');
				   if (key) {
						options[key] = $(this).val();
						options.list.empty();
						$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
						options.scrollableResults.reset();
						$.telligent.evolution.administration.header();
				   }
				});

			$('input[type="text"]', $.telligent.evolution.administration.panelWrapper())
				.on('input', function() {
					var query = $(this).val();
					global.clearTimeout(options.queryTimeout);
					options.queryTimeout = global.setTimeout(function() {
						if (options.query != query) {
							options.query = query;
							options.list.empty();
							$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
							options.scrollableResults.reset();
							$.telligent.evolution.administration.header();
						}
					}, 125);
				});

			var filter = $.telligent.evolution.url.hashData()['filter'];
			if (filter != 'requests' && filter != 'roles' && filter != 'invitations') {
				filter = 'members';
			}

			var query = $.telligent.evolution.url.hashData()['query'];
			if (query) {
				$('input[type="text"]', $.telligent.evolution.administration.panelWrapper()).val(query);
				options.query = query;
			}

			selectFilter(options, filter, options.query != '');
			checkNoResults(options);

			var action = $.telligent.evolution.url.hashData()['action'];
			if (action == 'invite') {
				showInvite(options);
			} else if (action == 'add') {
				showAdd(options);
			}
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.groupMemberManagement = api;

})(jQuery, window);