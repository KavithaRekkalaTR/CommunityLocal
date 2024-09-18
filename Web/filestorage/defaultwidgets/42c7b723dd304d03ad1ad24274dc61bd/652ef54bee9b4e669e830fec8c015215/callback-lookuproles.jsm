core_v2_page.SetContentType('application/json');

var query = core_v2_page.GetFormValue('query');
var roles = core_v2_role.Find(query);

var matches = [];
for (var i = 0; i < roles.Count; i++) {
    matches.push({
        id: roles[i].Id,
        name: roles[i].Name
    });
}

return {
    matches: matches
};