core_v2_page.SetContentType('application/json');

var categoryId = core_v2_utility.ParseInt(core_v2_page.GetFormValue('categoryId'));
var articleCollectionId = core_v2_utility.ParseGuid(core_v2_page.GetFormValue('articleCollectionId'));

var category

var matches = [];
for (var i = 0; i < categories.Count; i++) {
    matches.push({
        id: categories[i].Id,
        name: categories[i].Name
    });
}

return {
    matches: matches
};