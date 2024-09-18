core_v2_page.SetContentType('application/json');

var query = core_v2_utility.Trim(core_v2_page.GetQueryStringValue('w_query'));
var pageIndex = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue('w_pageIndex'));
var placeKey = core_v2_page.GetQueryStringValue('w_placeKey');
var placeValue = core_v2_page.GetQueryStringValue('w_placeValue');
var category = '';
this.applicationId = core_v2_page.GetQueryStringValue('w_application');
this.groupFiltered = false;
this.currentContainerId = null;
this.includeSubGroups = core_v2_utility.ParseBool(core_v2_page.GetQueryStringValue('w_includeSubGroups'));

if (core_v3_permission.CheckPermission(core_v2_sitePermissions.ViewWebSite, core_v2_user.Accessing.Id).IsAllowed) {
    var searchQuery = {
        Query: query,
        PageSize: 10,
        PageIndex: pageIndex,
        Collapse: 'True',
        IsLoggable: 'True',
        SearchFlags: 'Site'
    };
    
    if (placeKey == 'application') {
    	searchQuery["ApplicationId"] = placeValue;
    }
    else if (placeKey == 'group' && !this.includeSubGroups) {
        searchQuery["ContainerId"] = placeValue;
    }
    
    var filterIndex = 0;
    var filters = '';
    var facets = ''
    
    if (placeKey != 'application') {
        facets = 'applicationid,count,12,0,0';
        if (this.applicationId != null && this.applicationId != '') {
    		facets = facets + "!" + filterIndex;
    
            if (filters.length > 0)
    		   filters = filters + "||";
    		filters = filters + filterIndex + ",applicationid," + this.applicationId;
    		filterIndex++;
        }
    }
    
    if (placeKey == 'group') {
        var group = core_v2_group.Get(core_v2_utility.ParseGuid(placeValue));
        if (group != null) {
            this.groupFiltered = true;
            this.currentContainerId = group.ContainerId;

            if (this.includeSubGroups) {
                if (filters.length > 0) {
                    filters = filters + "||";
                }

                var groupPath = "";
                var rootGroup = core_v2_group.Root;

			    if (group.Id != rootGroup.Id) {
                    var ids = [];
                    ids.push(group.Id);

                    var groupId = group.parentGroupId;
                    var parentGroup = null;

                    do {
                        if (groupId > 0) {
                            parentGroup = core_v2_group.Get({ Id: groupId});
                            if (parentGroup != null && parentGroup.Id != rootGroup.Id)
                            {
                                groupId = parentGroup.ParentGroupId;
                                ids.unshift(parentGroup.Id);
                            }
                        }
                    } while (groupId > 0 && parentGroup != null && parentGroup.Id != rootGroup.Id);

                    groupPath = ids.join('/');
                }

                filters = filters + filterIndex + ",groupdescendents," + groupPath;
                filterIndex++;
            }
            else {
                if (filters.length > 0) {
                    filters = filters + "||";
                }
                filters = filters + filterIndex + ",group," + group.Id;
                filterIndex++;
            }
        }
    } else if (placeKey == 'application') {
        if (filters.length > 0)
            filters = filters + "||";
        filters = filters + filterIndex + ",isapplication,false";
        filterIndex++;
    } else if (placeKey == 'users') {
        if (filters.length > 0)
            filters = filters + "||";
        filters = filters + filterIndex + ',category,user';
        filterIndex++;
        category = 'user'
    }
    
    searchQuery['FieldFacets'] = facets;
    searchQuery['FieldFilters'] = filters;
    
    this.searchResults = core_v2_searchResult.List(searchQuery);
    
    this.hasMore = false;
    var currentPagedQuantity = (this.searchResults.PageIndex + 1) * this.searchResults.PageSize;
    if (this.searchResults.TotalCount > currentPagedQuantity) {
    	this.hasMore = true;
    }
    
    var resultFacets = [ ];
    if (this.searchResults.FieldFacets != null) {
        this.searchResults.FieldFacets.forEach(function(facet) {
            if (facet.DocumentCount > 0) {
                var addedAt = resultFacets.push(facet);
            }
        });
    }
    
    this.facets = resultFacets;
} else {
    this.searchResults = [];
    this.facets = [];
    this.hasMore = false;
}

return {
	renderedResults: core_v2_widget.ExecuteFile('search.vm'),
    category: category
};