function formatRole(role) {
    var formattedRole = {
        id: role.Id,
		name: role.Name,
		preview: role.Name
    };
    
    if (role.AvatarUrl) {
        var avatarHtml = core_v2_ui.GetResizedImageHtml(role.AvatarUrl, 16, 16, { 
            border: '0px', 
            ResizeMethod: 'ZoomAndCrop', 
            alt: role.Name 
        });
        
        if (avatarHtml) {
            formattedRole.preview = avatarHtml + formattedRole.preview;
        }
    }
    
    return formattedRole;
}

var searchText = core_v2_page.GetQueryStringValue('w_query');

core_v2_page.SetContentType('application/json')

var roles = [];

if (searchText.length > 0) {
    var roleId = core_v2_utility.ParseInt(searchText);
    if (roleId > 0) {
        var role = core_v2_role.Get(roleId);
        if (role != null && !role.HasErrors()) {
            roles.push(formatRole(role));
        }
    }
    
    var matchingRoles = core_v2_role.Find(searchText);
    for(var i = 0; i < matchingRoles.Count; i++)  {
        if (matchingRoles[i].Id != roleId) {
            roles.push(formatRole(matchingRoles[i]));
        }
    }
} else {
    var allRoles = core_v2_role.List({ PageSize: 20, PageIndex: 0 });
    for(var i = 0; i < allRoles.Count; i++)  {
        roles.push(formatRole(allRoles[i]));
    }
}

return {
    matches: roles
};