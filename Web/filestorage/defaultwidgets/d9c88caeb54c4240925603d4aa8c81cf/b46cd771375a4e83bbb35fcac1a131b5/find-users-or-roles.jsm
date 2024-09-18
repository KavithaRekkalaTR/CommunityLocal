core_v2_page.SetContentType('application/json');

var searchText = core_v2_page.GetQueryStringValue("w_searchText");
var matchingRoles = core_v2_role.Find(searchText);
var matchingUsers = core_v2_user.Lookup(searchText, { PageSize: 20 });
var totalRoles = 20;
var totalUsers = 20;

if (matchingRoles.Count + matchingUsers.Count > 20) {
	if (totalRoles > 10) {
		if (totalUsers > 10)
			totalUsers = 10;
	} else {
		totalUsers = 20 - totalRoles;
	}

	if (totalRoles > 10) {
		totalRoles = 20 - totalUsers;
	}
}


var index = 0;
var matches = [];

if(matchingUsers != null) {
	for (var i = 0; i < matchingUsers.Count; i++) {
		var title = matchingUsers[i].DisplayName;
		if (matchingUsers.DisplayName != matchingUsers.Username) {
			title = title + " (" + matchingUsers[i].Username +")";
		}
		var previewImage = core_v2_ui.GetResizedImageHtml(matchingUsers[i].AvatarUrl, 16, 16, {OutputIsPersisted: 'False', ResizeMethod: 'ZoomAndCrop', alt: matchingUsers[i].DisplayName});
		var preview = '';

		if (previewImage != null) {
			preview = previewImage + " " + title;	
		}
		else {
			preview = title;
		}
		
		if (index < totalUsers) {
			matches.push({
				userId: matchingUsers[i].Id,
				title: title,
				preview: preview
			});
		}
		
		index++;
	}
}

index = 0;
if (matchingRoles != null) {
	for (var i = 0; i < matchingRoles.Count; i++) {
		if (index < totalRoles) {
			var title = matchingRoles[i].Name;
			var previewImage = core_v2_ui.GetResizedImageHtml(matchingRoles[i].AvatarUrl, 16, 16, {border: '0px', ResizeMethod: 'ZoomAndCrop', alt: matchingRoles[i].Name });
			var preview = '';
			if (previewImage != null) {
				preview = previewImage + " " + title;	
			}
			else {
				preview = title;
			}

			matches.push({
				roleId: matchingRoles[i].Id,
				title: title,
				preview: preview
			});
		}
		index++;
	}
}

return {
    matches: matches
};