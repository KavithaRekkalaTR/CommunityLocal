core_v2_page.SetContentType('application/json');

var query = core_v2_page.GetFormValue('query');
var collections = articles_v1_articleCollections.Lookup(query);

var getLocation = function(c) {
    if (c && c.Group && !c.Group.HasErrors())
        return ' (' + c.Group.Name + ')';
    else
        return '';
}

var hasPermission;
var matches = [];
for (var i = 0; i < collections.Count; i++) {
    hasPermission = core_v3_permission.CheckPermission(articles_v1_permissions.CreateArticles, core_v2_user.Accessing.Id, {
        ApplicationId: collections[i].Id, 
        ApplicationTypeId: articles_v1_articleCollections.ApplicationTypeId
        }).IsAllowed;
    matches.push({
        id: collections[i].Id,
        name: hasPermission ? (collections[i].Name + getLocation(collections[i])) : ('<div class="glowlookuptextbox-alreadyselected">' + collections[i].Name + getLocation(collections[i]) + '<span class="glowlookuptextbox-identifier">' + core_v2_language.GetResource('InvalidArticleCollection') + '</span></div>'),
        selectable: hasPermission
    });
}

return {
    matches: matches
};