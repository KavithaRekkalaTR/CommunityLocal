(function ($, global) {

    function updateVisibleTab(options) {
        var e = options.rolesHeaderWrapper.find('.filter-option.selected a[data-tab]');
        var tab = options.wrapper.find('.tab.' + e.data('tab'));
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

        $.telligent.evolution.administration.header();
        $.fn.uilinks.forceRender();
    }

    function showRolesList(options, grouptype, title) {
        $.telligent.evolution.administration.open({
            name: title,
			cssClass: 'administer-groupdefaultpermissions-roles',
			content: $.telligent.evolution.get({
				url: options.urls.roleslist,
				data: {
				    w_groupType: grouptype
				}
			})
        });
    }

    function showOverwriteForm(options) {
        $.telligent.evolution.administration.open({
            name: options.text.overwritePermission,
			cssClass: 'administer-groupdefaultpermissions-overwrite',
			content: $.telligent.evolution.get({
				url: options.urls.overwriteform,
				data: {
				}
			})
        });
    }

	function filterRoles(options, searchText, allowed) {
		global.clearTimeout(options.searchTimeout);
		options.searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0 && allowed == '') {
                $('.content-item.site-role', options.wrapper).show();
                $('.message.norecords', options.wrapper).hide();
			} else {
				var searchTerms = searchText.split(' ');
				$('.content-item.site-role', options.wrapper).each(function() {
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

                if ($('.content-item.site-role', options.wrapper).filter(":visible").length == 0) {
					$('.message.norecords', options.wrapper).show();
				}
				else {
					$('.message.norecords', options.wrapper).hide();
				}
			}
		}, 125);
	}

    function showPermissionsList(options, roleId, title) {
		$.telligent.evolution.administration.open({
            name: title,
			cssClass: 'administer-groupdefaultpermissions-permissions',
			content: $.telligent.evolution.get({
				url: options.urls.permissionslist,
				data: {
					_roleid: roleId,
					_grouptype: options.groupType
				}
			})
        });
    }

	function filterPermissions(options, searchText, enabled) {
		global.clearTimeout(options.searchTimeout);
		options.searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();

            if (searchText.length == 0 && enabled == '') {
				$('.field-item.permission', options.wrapper).show();
				$('.permission-group-header', options.wrapper).show();
			} else {
				var searchTerms = searchText.split(' ');
				$('.field-item.permission', options.wrapper).each(function() {
                    var cft = $(this);
                    var checked = $('input[type="checkbox"][name="permissions"]:checked', cft).length === 1;
					var text = cft.data('text');
                    var match = true;

                    if (enabled == 'disabled' && checked == true)
                        match = false;
                    else if (enabled == 'enabled' && checked == false)
                        match = false;

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

				$('.permission-group-header', options.wrapper).each(function() {
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

				if ($('.field-item.permission', options.wrapper).filter(":visible").length == 0) {
					$('.message.norecords', options.wrapper).show();
				}
				else {
					$('.message.norecords', options.wrapper).hide();
				}
			}
		}, 125);
	}

	var api = {
		register: function (options) {
            options.headerWrapper = $('<div></div>');

            $.telligent.evolution.administration.header(options.headerWrapper);

			options.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(options.headerTemplateId);
			options.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

            options.headerWrapper.on('click', 'a.overwrite-permission', function() {
                showOverwriteForm(options);
				return false;
			});

            $(".content-item.grouptype").on("click", function() {
        	    var grouptype = $(this).data('grouptype');
        	    var title = $(this).data('title');
        		showRolesList(options, grouptype, title);
        	});
		}
    };

    var rolesListApi = {
		register: function (options) {
            options.wrapper = $.telligent.evolution.administration.panelWrapper();

            setTimeout(function() {
                $('input[type="text"][name="searchrole"]', options.wrapper)
                .on('keyup paste click', function() {
                    var allowed = $('select[name="allowed-filter"]', options.wrapper).val();
                    filterRoles(options, $(this).val(), allowed);
                });

                $('select[name="allowed-filter"]', options.wrapper)
                .on('change', function() {
                    var searchText = $('input[type="text"][name="searchrole"]', options.wrapper).val();
                    filterRoles(options, searchText, $(this).val());
                });

                $(".content-item.role").on("click", function() {
                    var roleId = $(this).data('roleid');
                    var title = $(this).data('title');
                    showPermissionsList(options, roleId, title);
                });
            }, 500);
        }
    };

	var permissionsListApi = {
		register: function (options) {
            var headingTemplate = $($.telligent.evolution.template(options.permissionHeaderTemplateId)({
                readonly: options.readonly
            }));

			options.wrapper = $.telligent.evolution.administration.panelWrapper();
		    $.telligent.evolution.administration.header(headingTemplate);

            $('a.revert-to-default', options.wrapper).on('click', function () {
                $("input[type='checkbox'][name='permissions']").each(function(i) {
                    $(this).prop('checked', $(this).data('defaultvalue')).change();
                });

				return false;
            });

			$('a.checkall', options.wrapper).on('click', function () {
				var container = $(this).closest('.permission-group');
				container.find('input[type="checkbox"][name="permissions"]').filter(":visible").each(function() {
                    this.checked = true;
                    $(this).change();
				});

				return false;
			});

			$('a.checknone', options.wrapper).on('click', function () {
				var container = $(this).closest('.permission-group');
				container.find('input[type="checkbox"][name="permissions"]').filter(":visible").each(function() {
                    this.checked = false;
                    $(this).change();
				});

				return false;
            });

            $('input[type="checkbox"][name="permissions"]', options.wrapper).on('change', function () {
                var value = $(this).data('value');
                $(this).parent().find('.pill.negative').remove();

                if (value != this.checked) {
                    $(this).parent().append('<span class="pill negative">' + options.text.unsavedCustomization + '</span>');
                }
            });

			$('input[type="text"][name="search"]', options.wrapper)
			.on('keyup paste click', function() {
                var enabled = $('select[name="enabled-filter"]', options.wrapper).val();
				filterPermissions(options, $(this).val(), enabled);
            });

            $('select[name="enabled-filter"]', options.wrapper)
			.on('change', function() {
                var searchText = $('input[type="text"][name="search"]', options.wrapper).val();
				filterPermissions(options, searchText, $(this).val());
			});

			$(headingTemplate).on('click', 'a.save-permissions', function() {
                if (confirm(options.text.saveConfirmation.replace(/\{0\}/g, options.groupType).replace(/\{1\}/g, options.roleName))) {
                    var selected = [];
                    $("input[type='checkbox'][name='permissions']:checked").each(function() {
                        selected.push($(this).attr('value'));
                    });

                    var data = {
                        w_permissions: selected.join(','),
                        w_roleId: options.roleId,
                        w_groupType: options.groupType,
                        w_overwrite: false
                    };

                    $.telligent.evolution.post({
                        url: options.urls.save,
                        data: data
                        })
                        .then(function(response) {
                            $.telligent.evolution.notifications.show(options.text.permissionsUpdated.replace(/\{0\}/g, options.groupType).replace(/\{1\}/g, options.roleName));
                            $.telligent.evolution.administration.close();
                    });
                }
				return false;
            });

			$(headingTemplate).on('click', 'a.save-overwrite-permissions', function() {
                if (confirm(options.text.overwriteConfirmation.replace(/\{0\}/g, options.groupType).replace(/\{1\}/g, options.roleName))) {
                    var selected = [];
                        $("input[type='checkbox'][name='permissions']:checked").each(function() {
                            selected.push($(this).attr('value'));
                        });

                    var data = {
                        w_permissions: selected.join(','),
                        w_roleId: options.roleId,
                        w_groupType: options.groupType,
                        w_overwrite: true
                    };

                    $.telligent.evolution.post({
                        url: options.urls.save,
                        data: data
                        })
                        .then(function(response) {
                            $.telligent.evolution.notifications.show(options.text.permissionsOverwritten.replace(/\{0\}/g, options.groupType).replace(/\{1\}/g, options.roleName));
                            $.telligent.evolution.administration.close();
                    });
                }
				return false;
            });
        }
    };

    var overwritePermissionApi = {
		register: function (options) {
			options.overwriteHeaderWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.overwriteHeaderWrapper);

			options.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(options.overwriteHeaderTemplateId);
			options.overwriteHeaderWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

            $(options.ids.groupTypes).on('change', function() {
                var groupType = $(this).val();

                if (groupType === '') {
                    resetRoles(options);
                    resetPermissionSelect(options);
                    resetAllowDeny(options);
                }
                else {
                    populateRoleSelect(options, groupType);
                    resetPermissionSelect(options);
                    resetAllowDeny(options);
                }
            });

            $(options.ids.roles).on('change', function() {
                var groupType = $(options.ids.groupTypes).val();
                var roleId = $(this).val();

                if (roleId === '') {
                    resetPermissionSelect(options);
                    resetAllowDeny(options);
                    resetOverwrite(options);
                }
                else {
                    populatePermissionSelect(options, groupType, roleId);
                    resetAllowDeny(options);
                    resetOverwrite(options);
                }
            });

            $(options.ids.permissions).on('change', function() {
                var permissionId = $(this).val();

                if (permissionId === '') {
                    resetAllowDeny(options);
                    resetOverwrite(options);
                }
                else {
                    enableAllowDeny(options);
                    resetOverwrite(options);
                }
            });

            $(options.ids.allowDeny).on('change', function() {
                var allow = $(this).val();

                if (allow === '') {
                    resetOverwrite(options);
                }
                else {
                    enableOverwrite(options);
                }
            });
        }
    };

    function populateRoleSelect(options, groupType) {
        $.telligent.evolution.get({
            url: options.urls.callbackRoles,
            data: { w_grouptype : groupType },
            success: function(response) {
                var select = $(options.ids.roles);

                if(select.prop) {
                    var rolesOptions = select.prop('options');
                }
                else {
                    var rolesOptions = select.attr('options');
                }
                $('option', select).remove();

                rolesOptions[rolesOptions.length] = new Option(options.text.selectRole, '', true, true);
                $.each(response.roles, function(i, val) {
                    if (val !== null) {
                        rolesOptions[rolesOptions.length] = new Option(val.name, val.id, false, false);
                    }
                });

                select.prop("disabled", false);
                select.focus();
            }
        });
    }

    function populatePermissionSelect(options, groupType, roleId) {
        $.telligent.evolution.get({
            url: options.urls.callbackPermissions,
            data: { w_grouptype : groupType, w_roleId : roleId },
            success: function(response) {
                var select = $(options.ids.permissions);

                if(select.prop) {
                    var selectOptions = select.prop('options');
                }
                else {
                    var selectOptions = select.attr('options');
                }
                $('option', select).remove();

                selectOptions[selectOptions.length] = new Option(options.text.selectPermission, '', true, true);
                $.each(response.permissions, function(i, val) {
                    if (val !== null) {
                        selectOptions[selectOptions.length] = new Option(val.name, val.id, false, false);
                    }
                });

                select.prop("disabled", false);
                select.focus();
            }
        });
    }

    function enableAllowDeny(options) {
        var select = $(options.ids.allowDeny);
        select.val('');
        select.prop("disabled", false);
        select.focus();
    }

    function enableOverwrite(options) {
        var button = $('a.overwrite-permission', options.overwriteHeaderWrapper);
        button.removeClass("disabled");

        button.off('click');
        button.on('click', function() {

        var groupType = $(options.ids.groupTypes).val();
        var roleId = $(options.ids.roles).val();
        var permissionId = $(options.ids.permissions).val();
        var allow = $(options.ids.allowDeny).val();
        var updateTemplate = $(options.ids.updateTemplate).val();

        var roleName = $(options.ids.roles).find('option:selected').text();
        var permissionName = $(options.ids.permissions).find('option:selected').text();

        var confirmMessage = '';
        if (updateTemplate == 'true') {
            confirmMessage = options.text.overwriteConfirmationUpdateTemplate;
        }
        else {
            confirmMessage = options.text.overwriteConfirmation;
        }

        confirmMessage = confirmMessage.replace(/\{0\}/g, permissionName);
        if (allow == 'true') {
            confirmMessage = confirmMessage.replace(/\{1\}/g, options.text.permissionAllowed);
        }
        else {
            confirmMessage = confirmMessage.replace(/\{1\}/g, options.text.permissionDenied);
        }
        confirmMessage = confirmMessage.replace(/\{2\}/g, groupType).replace(/\{3\}/g, roleName);

        if (confirm(confirmMessage)) {
            $.telligent.evolution.post({
                url: options.urls.save,
                data: {
                        groupType: groupType,
                        roleId: roleId,
                        permissionid: permissionId,
                        allow: allow,
                        updateTemplate: updateTemplate
                    }
                })
                .then(function(response) {
                    var message = '';
                    if (response.updateTemplate == "True") {
                        message = options.text.permissionOverwritten;
                    }
                    else {
                        message = options.text.permissionOverwrittenTemplateUpdated;
                    }
                    message = message.replace(/\{0\}/g, permissionName);
                    if (response.allow == "True") {
                        message = message.replace(/\{1\}/g, options.text.permissionAllowed);
                    }
                    else {
                        message = message.replace(/\{1\}/g, options.text.permissionDenied);
                    }
                    message = message.replace(/\{2\}/g, response.groupType).replace(/\{3\}/g, roleName);

                    $.telligent.evolution.notifications.show(message);
                });
            }

            return false;
        });
    }

    function resetRoles(options) {
        var select = $(options.ids.roles);
        $('option', select).remove();

        if(select.prop) {
            var selectOptions = select.prop('options');
        }
        else {
            var selectOptions = select.attr('options');
        }

        selectOptions[selectOptions.length] = new Option(options.text.selectRole, '', true, true);
        select.prop("disabled", true);
    }

    function resetPermissionSelect(options) {
        var select = $(options.ids.permissions);
        $('option', select).remove();

        if(select.prop) {
            var selectOptions = select.prop('options');
        }
        else {
            var selectOptions = select.attr('options');
        }

        selectOptions[selectOptions.length] = new Option(options.text.selectPermission, '', true, true);
        select.prop("disabled", true);
    }

    function resetAllowDeny(options) {
        var select = $(options.ids.allowDeny);
        select.val('');
        select.prop("disabled", true);
    }

    function resetOverwrite(options) {
        var button = $('a.overwrite-permission', options.overwriteHeaderWrapper);
        button.addClass("disabled");
        button.off('click');
    }

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.globalPermissions = api;
	$.telligent.evolution.widgets.globalPermissionsRolesList = rolesListApi;
	$.telligent.evolution.widgets.globalPermissionsPermissionsList = permissionsListApi;
	$.telligent.evolution.widgets.globalPermissionsOverwritePermission = overwritePermissionApi;

})(jQuery, window);
