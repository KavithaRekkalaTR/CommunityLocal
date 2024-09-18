core_v2_page.SetContentType('application/json');

var query = core_v2_page.GetFormValue('query');
var articleCollectionId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('articleCollectionId'));

var publishGroups = articles_v1_publishGroups.Lookup(query, articleCollectionId);

var matches = [];
for (var i = 0; i < publishGroups.Count; i++) {
    matches.push({
        id: publishGroups[i].Id,
        name: publishGroups[i].Name
    });
}

return {
    matches: matches
};