//
// Ajax Callback which Performs a Site Search
//

// get all the parameters for searching

var query = core_v2_utility.Trim(core_v2_page.GetQueryStringValue('q'));
var groupFilter = core_v2_page.GetQueryStringValue('group');
var applicationFilter = core_v2_page.GetQueryStringValue('application');
var categoryFilter = core_v2_page.GetQueryStringValue('category');
var tagFilter = core_v2_encoding.HtmlDecode(core_v2_page.GetQueryStringValue('tag'));
var userFilter = core_v2_page.GetQueryStringValue('author');
var dateRangeFilter = core_v2_page.GetQueryStringValue('date');
this.sort = core_v2_page.GetQueryStringValue('sort');
var date = core_v2_page.GetQueryStringValue('date');
var collapse = core_v2_page.GetQueryStringValue('collapse');
var pageSize = core_v2_widget.GetIntValue('pageSize', 10);
var pageIndex = core_v2_ui.GetCurrentPageIndex({ QueryStringProperty: 'serp' });
var rssQuery = "q=" + core_v2_encoding.UrlEncode(query);
var includeSubGroups = false;
var includeSubGroups = core_v2_page.GetQueryStringValue('includeSubGroups');

var askQuery = {};
if (core_v2_page.GetQueryStringValue('q')) { askQuery.q = core_v2_page.GetQueryStringValue('q'); }
if (core_v2_page.GetQueryStringValue('group')) { askQuery.group = core_v2_page.GetQueryStringValue('group'); }
if (core_v2_page.GetQueryStringValue('category')) { askQuery.category = core_v2_page.GetQueryStringValue('category'); }
if (core_v2_page.GetQueryStringValue('application')) { askQuery.application = core_v2_page.GetQueryStringValue('application'); }
if (core_v2_page.GetQueryStringValue('tag')) { askQuery.tag = core_v2_page.GetQueryStringValue('tag'); }
if (core_v2_page.GetQueryStringValue('author')) { askQuery.author = core_v2_page.GetQueryStringValue('author'); }
if (core_v2_page.GetQueryStringValue('date')) { askQuery.date = core_v2_page.GetQueryStringValue('date'); }
if (core_v2_page.GetQueryStringValue('sort')) { askQuery.sort = core_v2_page.GetQueryStringValue('sort'); }
if (core_v2_page.GetQueryStringValue('collapse')) { askQuery.collapse = core_v2_page.GetQueryStringValue('collapse'); }
if (core_v2_page.GetQueryStringValue('includeSubGroups')) { askQuery.includeSubGroups = core_v2_page.GetQueryStringValue('includeSubGroups'); }

var defaultAskForumId = false;
var defaultAskForum = core_v2_page.ParseQueryString(core_v2_widget.GetStringValue('defaultAskForum', ''));
if (defaultAskForum.Value('Forum')) {
	defaultAskForumId = core_v2_utility.ParseInt(defaultAskForum.Value('Forum'));
}

if (defaultAskForumId && defaultAskForumId > 0) {
	defaultAskForum = false;
	defaultAskForum = core_v2_forum.Get(defaultAskForumId);
	if (!defaultAskForum || defaultAskForum.HasErrors() || !core_v3_permission.CheckPermission(core_v2_forumPermissions.CreatePost, core_v2_user.Accessing.Id, { ApplicationId: defaultAskForum.ApplicationId, ApplicationTypeId: core_v2_forum.ApplicationTypeId }).IsAllowed) {
		defaultAskForumId = 0;
	}
}

// these parameters control how many of each of the left filter categories to have pre-revealed (previously had clicked 'View More')
var defaultVisibleFilters = 3;
var groupVisible = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue('groupVisible'));
var tagVisible = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue('tagVisible'));
var userVisible = core_v2_utility.ParseInt(core_v2_page.GetQueryStringValue('authorVisible'));
if (groupVisible == 0) {
	groupVisible = defaultVisibleFilters;
}
if (tagVisible == 0) {
	tagVisible = defaultVisibleFilters;
}
if (userVisible == 0) {
	userVisible = defaultVisibleFilters;
}

// 
// build the facets and filters concurrently
// 
var facets = "";
var filters = "";
var dateFacets = "";
var dateFilters = "";
var filterIndex = 0;
var dq = '"';

var dateRangeName = "";
var dateKeys = [];

// separate filter without categories for use in querying related forums in the ask form
var categorylessFilters = "";
// category
facets += "category,count,12,0,0";
if (categoryFilter) {
    var category = false;
    category = core_v2_searchCategory.Get(categoryFilter);
	if (category) {
		facets += filterIndex;
		filters += filterIndex + ',category,' + categoryFilter;
		filterIndex += 1;
		rssQuery += "&category=" + core_v2_encoding.UrlEncode(categoryFilter);
	}
}

// only show user, group, application, tag, and date facets if "People" or "Groups" category filter was not selected
if (categoryFilter != 'user' && categoryFilter != 'group') {
	// user
	facets += "||user,count,12,0,1";
	if (userFilter && userFilter != '') {
		facets += "!" + filterIndex;
		if (filters.length > 0) {
			filters += "||";
		}
		filters += filterIndex + ",user," + userFilter;
		if (categorylessFilters.length > 0) {
			categorylessFilters += "||";
		}
		categorylessFilters += filterIndex + ",user," + userFilter;
		filterIndex += 1;
		rssQuery += "&users=" + core_v2_encoding.UrlEncode(userFilter);
	}
	// group

	var groupFacetAdded = false;
	var rootGroup = core_v2_group.Root;

	if (groupFilter && groupFilter != '') {
		if (filters.length > 0) {
			filters += "||";
		}
		rssQuery += "&groups=" + core_v2_encoding.UrlEncode(groupFilter);
	}

	if (includeSubGroups == 'true') {
		var groupPath = "";
		var parentGroupPaths = "";

		if (groupFilter && groupFilter != '' && groupFilter != rootGroup.Id) {					
			var ids = [];

			var groupId = core_v2_utility.ParseInt(groupFilter);
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

			var path = "";

			if (ids.length > 0) {
				for (var i = 0; i < ids.length - 1; i++) {

					var newPath = "";
					if (path == "") {
						newPath = ids[i];
					}
					else {
						newPath = "/" + ids[i];
					}

					path += newPath;

					if (parentGroupPaths == "") {
						parentGroupPaths = path;
					}
					else {
						parentGroupPaths = parentGroupPaths + ",," + path;
					}
				}

				facets += '||{!!terms="' + parentGroupPaths + '" ex=groupdescendents0Tag}groupdescendents,alpha,10,0,1,';
				facets += "||groupdescendents,count,10,0,1," + groupPath + ",";
				groupFacetAdded = true;

				filters += filterIndex + ",groupdescendents," + groupPath;

				if (categorylessFilters.length > 0) {
					categorylessFilters += "||";
				}
				categorylessFilters += filterIndex + ",groupdescendents," + groupPath;
			}
		}
		else {
			facets += "||groupdescendents,count,12,0,1,";
			facets += "!" + filterIndex;
			groupFacetAdded = true;
		}
	} else {
		if (groupFilter && groupFilter != '') {
			filters += filterIndex + ",group," + groupFilter;

			if (categorylessFilters.length > 0) {
				categorylessFilters += "||";
			}
			categorylessFilters += filterIndex + ",group," + groupFilter;
		}
	}

	if (groupFacetAdded == false) {
		facets += "||group,count,12,0,1";
		facets += "!" + filterIndex;
	}
	filterIndex += 1;

	// application
	facets += "||applicationid,count,12,0,1";
	if (applicationFilter && applicationFilter != '') {
		facets += "!" + filterIndex;
		if (filters.length > 0) {
			filters += "||";
		}
	    filters += filterIndex + ",applicationid," + applicationFilter;
		if (categorylessFilters.length > 0) {
			categorylessFilters += "||";
		}
		categorylessFilters += filterIndex + ",applicationid," + applicationFilter;
		filterIndex += 1;
		rssQuery += "&applications=" + core_v2_encoding.UrlEncode(applicationFilter);
	}
	// tag
	facets += "||tag,count,12,0,1";
	if (tagFilter && tagFilter != '') {
		var quote = '"';
		var quotedTagFilter = quote + tagFilter + quote;
		facets += "!" + filterIndex;
		if (filters.length > 0) {
			filters += "||";
		}
		filters += filterIndex + ",tag," + quotedTagFilter;
		if (categorylessFilters.length > 0) {
			categorylessFilters += "||";
		}
		categorylessFilters += filterIndex + ",tag," + quotedTagFilter;
		rssQuery += "&tags=" + core_v2_encoding.UrlEncode(tagFilter);
		filterIndex += 1;
	}

	// date ranges
	var minDate = core_v2_utility.ParseDate('0001-01-01');
	var currentDate = core_v2_utility.GetTimestamp(core_v2_utility.CurrentDate);
	var minimumDate = core_v2_utility.GetTimestamp(minDate);

	var weekAgoDate1 = core_v2_utility.CurrentDate - 7;
	var weekAgoDate2 = new Date(weekAgoDate1);
	var weekAgoDate = core_v2_utility.GetTimestamp(weekAgoDate2);

	var monthAgoDate = core_v2_utility.CurrentDate;
	monthAgoDate.setMonth(monthAgoDate.getMonth() - 1);
	monthAgoDate = core_v2_utility.GetTimestamp(monthAgoDate);

	var yearAgoDate = core_v2_utility.CurrentDate;
	yearAgoDate.setFullYear(yearAgoDate.getFullYear() - 1);
	yearAgoDate = core_v2_utility.GetTimestamp(yearAgoDate);

	// keys/constants for referring to date ranges
	var pastWeekKey = "past_week";
	var pastMonthKey = "past_month";
	var pastYearKey = "past_year";
	// possible date filters/ranges
	var pastWeekRange = "date," + weekAgoDate + "," + currentDate + ",true";
	var pastMonthRange = "date," + monthAgoDate + "," + currentDate + ",true";
	var pastYearRange = "date," + yearAgoDate + "," + currentDate + ",true";
	// date filters
	if (dateRangeFilter && dateRangeFilter != '') {
		if (dateRangeFilter == pastWeekKey) {
			dateFilters = pastWeekRange;
			rssQuery += "&sdate=" + core_v2_encoding.UrlEncode(weekAgoDate);
			rssQuery += "&edate=" + core_v2_encoding.UrlEncode(currentDate);
		} else if (dateRangeFilter == pastMonthKey) {
			dateFilters = pastMonthRange;
			rssQuery += "&sdate=" + core_v2_encoding.UrlEncode(monthAgoDate);
			rssQuery += "&edate=" + core_v2_encoding.UrlEncode(currentDate);
		} else if (dateRangeFilter == pastYearKey) {
			dateFilters = pastYearRange;
			rssQuery += "&sdate=" + core_v2_encoding.UrlEncode(yearAgoDate);
			rssQuery += "&edate=" + core_v2_encoding.UrlEncode(currentDate);
		}
		dateFilters = filterIndex + "," + dateFilters;
		pastWeekRange = pastWeekRange + filterIndex;
		pastMonthRange = pastMonthRange + filterIndex;
		pastYearRange = pastYearRange + filterIndex;
		dateRangeName = core_v2_language.GetResource("Core_SearchResults_" + dateRangeFilter);
	}
	// date facets
	dateFacets += pastWeekRange + "||" + pastMonthRange + "||" + pastYearRange;
	dateKeys = [pastWeekKey, pastMonthKey, pastYearKey];
}

//
// construct and perform search query
//
var searchQuery = {};
searchQuery.Query = query;
searchQuery.PageSize = pageSize;
searchQuery.PageIndex = pageIndex;
searchQuery.FieldFacets = facets;
searchQuery.FieldFilters = filters;
searchQuery.SearchFlags = core_v2_searchResult.SearchFlags.Site;
searchQuery.IsLoggable = 'True';
if (dateFacets) {
	searchQuery.DateRangeFacets = dateFacets;
}
if (dateFilters) {
	searchQuery.DateRangeFilters = dateFilters;
}
if (this.sort) {
	searchQuery.Sort = this.sort;
	rssQuery += "&sort=" + core_v2_encoding.UrlEncode(this.sort);
}
if (!collapse || collapse.length == 0) {
	collapse = true;
}
searchQuery.Collapse = collapse;
this.searchResults = false;
this.searchResultCount = 0;

if (query.length > 0 || facets.length > 0) {
	this.searchResults = core_v2_searchResult.List(searchQuery);
	this.searchResultCount = this.searchResults.TotalCount;
}

//
// post-process the filter results into separate lists of data since all
// filter facets are returned from the API in a merged list
//
var categoryFacets = [];
var userFacets = [];
var groupFacets = [];
var applicationFacets = [];
var tagFacets = [];
var addedAt = 0;

this.searchResults.FieldFacets.forEach(function(facet) {
	if (facet.FieldName == 'category') {
		addedAt = categoryFacets.push(facet);
	} else if (facet.FieldName == 'user') {
		addedAt = userFacets.push(facet);
	} else if (facet.FieldName == 'group') {
		addedAt = groupFacets.push(facet);
	} else if (facet.FieldName == 'groupdescendents') {
		facet.FieldValue = facet.FieldValue.substring(facet.FieldValue.lastIndexOf('/') + 1); 
		addedAt = groupFacets.push(facet);
	} else if (facet.FieldName == 'applicationid') {
	    addedAt = applicationFacets.push(facet);
	} else if (facet.FieldName == 'tag') {
		addedAt = tagFacets.push(facet);
	}
});

this.groupFilter = groupFilter;
this.applicationFilter = applicationFilter;
this.dateRangeFilter = dateRangeFilter;
this.userFilter = userFilter;
this.tagFilter = tagFilter;
this.categoryFilter = categoryFilter;
this.categoryFacets = categoryFacets;
this.userFacets = userFacets;
this.groupFacets = groupFacets;
this.applicationFacets = applicationFacets;
this.tagFacets = tagFacets;
this.addedAt = addedAt;
this.includeSubGroups = includeSubGroups;
this.rssQuery = rssQuery;

return "";