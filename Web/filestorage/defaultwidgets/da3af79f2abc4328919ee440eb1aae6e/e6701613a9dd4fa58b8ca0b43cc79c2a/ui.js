(function ($, global) {
	var headerList = null, mainHeaderList = null, revertHeaderList = null;
	var listWrapper = null, searchTimeout = null;

    function attachRoleFilters(options, elem) {
        var tab = $(elem);
        tab.on('keyup paste click', 'input[type="text"][name="searchrole"]', function() {
            var allowed = $('select[name="allowed-filter"]', tab).val();
            filterRoles(options, $(this).val(), allowed);
        });

        tab.on('change', 'select[name="allowed-filter"]', function() {
            var searchText = $('input[type="text"][name="searchrole"]', tab).val();
            filterRoles(options, searchText, $(this).val());
        });
    }

    function loadTab(options, tab, url) {
        $.telligent.evolution.get({
            url: url
        }).then(function(r){
            $(tab).empty().append(r);
            attachRoleFilters(options, tab);
        });
    }

	function loadEditPermissionForm(options, permissionId, title) {
		headerList = $('<ul class="field-list"></ul>')
			.append(
				$('<li class="field-item submit"></li>')
					.append(
						$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#"></a>')
									.addClass('button save-permission')
									.text(options.text.save)
					)
				)
			);

		$.telligent.evolution.administration.open({
			name: title,
			header: $('<fieldset></fieldset>').append(headerList),
			content: $.telligent.evolution.get({
				url: options.urls.editPermission,
				data: {
					w_permissionId: permissionId
				}
			}),
			cssClass: 'contextual-permissions-permission-edit'
        });
    }

	function loadEditRoleForm(options, roleId, title, hasOverrides) {
		headerList = $('<ul class="field-list"></ul>')
			.append(
				$('<li class="field-item submit"></li>')
					.append(
						$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#"></a>')
									.addClass('button save-role')
									.text(options.text.save)
					)
				)
			);

		if (hasOverrides == "True") {
			headerList.append(
				$('<li class="field-item submit"></li>')
					.append(
						$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#" data-roleid="' + roleId  + '" data-title="' + title + '"></a>')
                                    .addClass('inline-button revert-role')
									.text(options.text.revert)
					)
				)
			);
		}

		$.telligent.evolution.administration.open({
			name: title,
			header: $('<fieldset></fieldset>').append(headerList),
			content: $.telligent.evolution.get({
				url: options.urls.edit,
				data: {
					w_roleid: roleId
				}
			}),
			cssClass: 'contextual-permissions-edit'
		});
	}

    function filterPermissions(options, searchText) {
		global.clearTimeout(searchTimeout);
		searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0) {
				$('.field-item.permission', listWrapper).show();
				$('.permission-group-header', listWrapper).show();
			} else {
				var searchTerms = searchText.split(' ');
				$('.field-item.permission', listWrapper).each(function() {
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
						cft.show();
					} else {
						cft.hide();
					}
				});

				$('.permission-group-header', listWrapper).each(function() {
					var visibleItems = $(this).parent().find('.field-item.permission').filter(":visible");
					if (visibleItems.length == 0) {
						$(this).hide();
						$(this).parent().children('div.post-attributes').hide();
					}
					else
					{
						$(this).show();
						$(this).parent().children('div.post-attributes').show();
					}
				});

				if ($('.field-item.permission', listWrapper).filter(":visible").length == 0) {
					$('.message.norecords', listWrapper).show();
				}
				else {
					$('.message.norecords', listWrapper).hide();
				}
			}
		}, 125);
	}

	function revert(options) {
		 var data = {
			 RoleId: options.roleId,
			 ApplicationId: options.applicationId,
		 };

		 $.telligent.evolution.post({
			 url: options.urls.revert,
			 data: data,
			 success: function (response) {
                $.telligent.evolution.notifications.show(options.text.permissionsReverted);

                $.telligent.evolution.administration.close();

                $.telligent.evolution.messaging.publish('contextual-permissions.roleUpdated', {
                    roleId: response.roleId,
                    hasOverrides: response.hasOverrides
                });
            },
			 defaultErrorMessage: options.saveErrorText,
			 error: function (xhr, desc, ex) {
				 if (xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0) {
					 $.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0], { type: 'error' });
				 }
				 else {
					 $.telligent.evolution.notifications.show(desc, { type: 'error' });
				 }
			 }
		 });
     }

     function filterRoles(options, searchText, allowed) {
		global.clearTimeout(options.searchTimeout);
		options.searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0 && allowed == '') {
				$('.navigation-list-item.role-item', options.wrapper).show();
			} else {
				var searchTerms = searchText.split(' ');
				$('.navigation-list-item.role-item', options.wrapper).each(function() {
					var cft = $(this);
                    var text = cft.data('text');
                    var roleHasAllowed = cft.data('allowedpermissions');
                    var match = true;

                    if (allowed == 'allowed' && roleHasAllowed != 'True') {
                        match = false;
                    }

                    if (match) {
                        for (var i = 0; i < searchTerms.length; i++) {
                            if (text.indexOf(searchTerms[i]) == -1) {
                                match = false;
                                break;
                            }
                        }
                    }

					if (match) {
						cft.show();
					} else {
						cft.hide();
					}
				});
			}

            if ($('.navigation-list-item.role-item', options.wrapper).filter(":visible").length == 0) {
                $('.message.norecords', options.wrapper).show();
            }
            else {
                $('.message.norecords', options.wrapper).hide();
            }
        }, 125);
    }

    function filterByPermissions(options, searchText) {
        var byPermissions = $(".tab.by-permissions", $.telligent.evolution.administration.panelWrapper());

		global.clearTimeout(searchTimeout);
		searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0) {
				$('.navigation-item.permission', byPermissions).show();
				$('.permission-group-header', byPermissions).show();
			} else {
				var searchTerms = searchText.split(' ');
				$('.navigation-item.permission', byPermissions).each(function() {
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
						cft.show();
					} else {
                        cft.hide();
					}
				});

				$('.permission-group-header', byPermissions).each(function() {
                    var nodeid = $(this).data("nodeid");
					var visibleItems = $(this).parent().find('.navigation-item.permission[data-nodeid="' + nodeid + '"]').filter(":visible");
					if (visibleItems.length == 0) {
						$(this).hide();
					}
					else {
						$(this).show();
					}
				});

				if ($('.navigation-item.permission', listWrapper).filter(":visible").length == 0) {
					$('.message.norecords', listWrapper).show();
				}
				else {
					$('.message.norecords', listWrapper).hide();
				}
			}
		}, 125);
	}


	var api = {
		register: function (options) {
            options.wrapper = $.telligent.evolution.administration.panelWrapper();

			$.telligent.evolution.messaging.subscribe('contextualroles-edit-role', function (data) {
				var roleId = $(data.target).data('roleid');
				var title = $(data.target).data('title');
				var hasOverrides = $(data.target).data('hasoverrides');
				loadEditRoleForm(options, roleId, title, hasOverrides);
            });

			$.telligent.evolution.messaging.subscribe('contextualroles-edit-permission', function (data) {
                var permissionId = $(data.target).data('id');
				var title = $(data.target).data('title');
                loadEditPermissionForm(options, permissionId, title);
			});

			mainHeaderList = $('<ul class="field-list"></ul>');
			mainHeaderList.append(
				$('<li class="field-item panel-instructions"></li>')
					.append(
						$('<div></div>').text(options.text.panelInstructions)
				)
			);

			var filters = $('<ul class="filter"></ul>');
			filters.append($('<li class="filter-option selected"><a href="#" data-messagename="contextualroles.tabs" data-filter="">' + options.text.byPermissions + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="contextualroles.tabs" data-filter="group">' + options.text.grouproles + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="contextualroles.tabs" data-filter="site">' + options.text.siteroles + '</a></li>'));
			mainHeaderList.append(filters);

			$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(mainHeaderList));

		    $.telligent.evolution.messaging.subscribe('contextualroles.tabs', function(data){
        		var filter = $(data.target).data('filter');
        		var groupRoles = $(".tab.group-roles",  $.telligent.evolution.administration.panelWrapper());
        		var siteRoles = $(".tab.site-roles", $.telligent.evolution.administration.panelWrapper());
        		var byPermissions = $(".tab.by-permissions", $.telligent.evolution.administration.panelWrapper());

        		if (filter == '') {
        			groupRoles.hide();
                    byPermissions.show();
        			siteRoles.hide();
                }
        		else if (filter == 'site') {
                    loadTab(options, siteRoles, options.urls.tabSiteRoles);
                    groupRoles.hide();
                    byPermissions.hide();
                    siteRoles.show();
                }
                else {
                    loadTab(options, groupRoles, options.urls.tabMembershipTypes);
                    groupRoles.show();
                    byPermissions.hide();
        			siteRoles.hide();
                }

        		$(data.target).closest('ul').children('li').removeClass('selected');
        		$(data.target).parent().addClass('selected');
        		$.telligent.evolution.administration.header();
            });

			$.telligent.evolution.messaging.subscribe('contextual-permissions.roleUpdated', function(data){
				var roleId = data.roleId;
                var hasOverrides = data.hasOverrides;

                var groupRoles = $("ul.navigation-list.group-roles",  options.wrapper);
        		var siteRoles = $("ul.navigation-list.site-roles", options.wrapper);

				if (roleId) {
					var elm = groupRoles.find('li a[data-roleid="' + roleId + '"]');
                    if (elm.length > 0) {
                        elm.data("hasoverrides", hasOverrides);
                    }

					var elm = siteRoles.find('li a[data-roleid="' + roleId + '"]');
                    if (elm.length > 0) {
                        elm.data("hasoverrides", hasOverrides);
                    }
                }
            });

            $('input[type="text"][name="searchpermission"]', options.wrapper)
			.on('keyup paste click', function() {
                var allowed = $('select[name="allowed-filter"]', options.wrapper).val();
				filterByPermissions(options, $(this).val(), allowed);
            });
    	}
	};

	$.telligent.evolution.widgets.contextualPermissionsEdit = {
		register: function (options) {
			var saveButton = $('a.save-role', headerList);
			saveButton.on('click', function () {

				var selected = [];
					$("input[type='checkbox'][name='permissions']:checked").each(function() {
						selected.push($(this).attr('value'));
					});

				var data = {
					 Permissions: selected.join(','),
					 RoleId: options.roleId,
					 ApplicationId: options.applicationId,
					 ApplicationTypeId: options.applicationTypeId
				};

				$.telligent.evolution.post({
					 url: options.urls.save,
					 data: data
					})
					.then(function(response) {
						$.telligent.evolution.notifications.show(options.text.permissionsUpdated);

						$.telligent.evolution.administration.close();

                        $.telligent.evolution.messaging.publish('contextual-permissions.roleUpdated', {
                            roleId: response.roleId,
                            hasOverrides: response.hasOverrides
                        });
                    });

				return false;
            });

            var revertButton = $('a.revert-role', headerList);
			revertButton.on('click', function () {
				var roleId = $(this).data('roleid');
				var title = $(this).data('title');

                revertHeaderList = $('<ul class="field-list"></ul>')
                .append(
                    $('<li class="field-item submit"></li>')
                        .append(
                            $('<span class="field-item-input"></span>')
                                .append(
                                    $('<a href="#"></a>')
                                        .addClass('button revert-role')
                                        .text(options.text.revertConfirm)
                        )
                    )
                );

                $.telligent.evolution.administration.open({
                    name: options.text.revert.replace(/\{0\}/g, title),
                    header: $('<fieldset></fieldset>').append(revertHeaderList),
                    content: $.telligent.evolution.get({
                        url: options.urls.revertWarning,
                        data: {
                            v_roleid: roleId
                        }
                    }),
                    cssClass: 'contextual-permissions-revert'
                });

                return false;
			});

			listWrapper = $('.contextual-permissions-edit');
			$('input[type="text"][name="search"]', listWrapper)
			  .on('keyup paste click', function() {
				filterPermissions(options, $(this).val());
			});

			$('a.checkall', listWrapper).on('click', function () {
				var container = $(this).closest('.permission-group');
				container.find('input[type="checkbox"][name="permissions"]').filter(":visible").each(function() {
					this.checked = true;
				});

				return false;
			 });

			$('a.checknone', listWrapper).on('click', function () {
				var container = $(this).closest('.permission-group');
				container.find('input[type="checkbox"][name="permissions"]').filter(":visible").each(function() {
					this.checked = false;
				});

				return false;
			 });

		}
    };

    $.telligent.evolution.widgets.contextualPermissionsRevert = {
		register: function (options) {

			var revertButton = $('a.revert-role', revertHeaderList);
			revertButton.on('click', function () {
                revert(options);
                $.telligent.evolution.administration.close();
				return false;
			});
		}
    };

	$.telligent.evolution.widgets.contextualRolesEditPermission = {
		register: function (options) {
            options.wrapper = $.telligent.evolution.administration.panelWrapper();

			var saveButton = $('a.save-permission', headerList);
			saveButton.on('click', function () {
                var allowedRoleIds = [];
                var deniedRoleIds = [];
                var allowedRoleNames = [];
                var deniedRoleNames = [];
                    $("input[type='checkbox'][name='role']").each(function() {
                        if (this.checked != $(this).data('value')) {
                            if(this.checked) {
                                allowedRoleIds.push($(this).data('roleid'));
                                allowedRoleNames.push($(this).data('rolename'));
                            }
                            else {
                                deniedRoleIds.push($(this).data('roleid'));
                                deniedRoleNames.push($(this).data('rolename'));
                            }
                        }
                });

                if (allowedRoleIds.length > 0 || deniedRoleIds.length > 0) {
                    var data = {
                        PermissionId: options.permissionId,
                        AllowedRoleIds: allowedRoleIds.join(),
                        DeniedRoleIds: deniedRoleIds.join(),
                        ApplicationId: options.applicationId,
                        ApplicationTypeId: options.applicationTypeId
                    };

                    $.telligent.evolution.post({
                        url: options.urls.updateRoles,
                        data: data
                       })
                       .then(function(response) {
                        $.telligent.evolution.administration.close();
                        $.telligent.evolution.notifications.show(options.text.roleRemovalMessage
                            .replace(/\{0\}/g, options.permissionName));
                    });

                   return false;
                }

                return false;
            });

            $('input[type="checkbox"][name="role"]', options.wrapper).on('change', function () {
                var parent =  $(this).parent();
                var value = $(this).data('value');
                parent.find('.pill.negative').remove();

                if (value != this.checked) {
                    parent.append('<span class="pill negative">' + options.text.unsavedCustomization + '</span>');
                }
            });
        }
    };

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.contextualPermissions = api;

})(jQuery, window);
