(function ($, global) {

    var api = {
        register: function (context) {
            function formatRolesText(selectedRoles) {
                var numberOfRoles = selectedRoles.length;
                var text = '';

                if(numberOfRoles == 0) {
                    return text;
                }
                else if (numberOfRoles < 3) {
                    for (var j = 0; j < selectedRoles.length; j++){
                        if (text != '') text += ' and ';
                        text += selectedRoles[j].name;
                    }
                }
                else {
                    text += selectedRoles[0].name;
                    text += ' and ' + (numberOfRoles - 1) + (numberOfRoles > 2 ? ' other roles' : ' other role');
                }

                return text;
            }

            function formatUsersText(selectedUsers) {
                var numberOfUsers = selectedUsers.length;
                var text = '';

                if(numberOfUsers == 0) {
                    return text;
                }
                else if (numberOfUsers < 3) {
                    for (var j = 0; j < selectedUsers.length; j++){
                        if (text != '') text += ' and ';
                        text += selectedUsers[j].name;
                    }
                }
                else {
                    text += selectedUsers[0].name;
                    text += ' and ' + (numberOfUsers - 1) + (numberOfUsers > 2 ? ' other users' : ' other user');
                }

                return text;
            }

            function cb(includeRoles, includeUsers, selectedRoles, selectedUsers, includeAnonymous, suppressMessage) {

                var results ='';
                var numberOfRoles = selectedRoles.length;
                var numberOfUsers = selectedUsers.length;
                var totalRolesAndUsers = numberOfRoles + numberOfUsers;

                if (totalRolesAndUsers == 0) {
                    if (includeAnonymous) {
                        results = context.resources.filterByUsers;
                    }
                    else {
                        results = context.resources.filterByMembers;
                    }
                }
                else if (numberOfRoles > 0 && numberOfUsers == 0) {
                    var text = formatRolesText(selectedRoles);

                    results = (includeRoles == 'exclude'  ? 'All users excluding ' : '');
                    results += text;
                }
                else if (numberOfUsers > 0 && numberOfRoles == 0) {
                    var text = formatUsersText(selectedUsers);

                    results = (includeUsers == 'exclude'  ? 'All users excluding ' : '');
                    results += text;
                }
                else if (includeRoles == includeUsers) {
                    var text = formatRolesText(selectedRoles);
                    text = text.replace(' and ', ', ');
                    text += ' and ';

                    if(numberOfUsers == 1) {
                        for(var key in selectedUsers) {
                            text += selectedUsers[0].name;
                            break;
                        }
                    }
                    else {
                        text += (numberOfUsers) + (numberOfUsers > 1 ? ' users' : ' user');
                    }

                    results = (includeUsers == 'exclude'  ? 'All users excluding ' : '');
                    results += text;
                }
                else {
                    var rolesText = formatRolesText(selectedRoles);
                    var usersText = formatUsersText(selectedUsers);

                    if (includeRoles == 'include') {
                        results = rolesText + '; excluding ' + usersText;
                    }
                    else {
                        results = usersText + '; excluding ' + rolesText;
                    }
                }

                $(context.fields.userRolePickerId).find("span").html(results);

                if (!suppressMessage) {
                    var d = {};
                    d["includeUsers"] = includeUsers;
                    d["includeRoles"] = includeRoles;
                    d["selectedUsers"] = selectedUsers;
                    d["selectedRoles"] = selectedRoles;
                    d["includeAnonymous"] = includeAnonymous;

                    $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);

                    $.telligent.evolution.messaging.publish('reporting.filter.userrolepicker.modified', {
                        includeRoles: includeRoles,
                        includeUsers: includeUsers,
                        selectedRoles: selectedRoles,
                        selectedUsers: selectedUsers,
                        includeAnonymous: includeAnonymous
                    });
                }
            }

            var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);

            var includeRoles = "include";
            if (tabData.includeRoles !== undefined) {
                includeRoles = tabData.includeRoles;
            }

            var includeUsers = "include";
            if (tabData.includeUsers !== undefined) {
                includeUsers = tabData.includeUsers;
            }

            var includeAnonymous = true;
            if (tabData.includeAnonymous !== undefined) {
                includeAnonymous = tabData.includeAnonymous;
            }

            var selectedUsers = [];
            if (tabData.selectedUsers !== undefined) {
                selectedUsers = tabData.selectedUsers;
            }

            var selectedRoles = [];
            if (tabData.selectedRoles !== undefined) {
                selectedRoles = tabData.selectedRoles;
            }

            $(context.fields.userRolePickerId).userrolepicker({
                includeRoles: includeRoles,
                selectedRoles: selectedRoles,
                includeUsers: includeUsers,
                selectedUsers: selectedUsers,
                includeAnonymous: includeAnonymous,
                roleLookupUrl: context.urls.lookupRoles,
                userLookupUrl: context.urls.lookupUsers
            }, cb);

            cb(includeRoles, includeUsers, selectedRoles, selectedUsers, includeAnonymous, true);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.usersAndRolesFilter = api;

})(jQuery, window);
