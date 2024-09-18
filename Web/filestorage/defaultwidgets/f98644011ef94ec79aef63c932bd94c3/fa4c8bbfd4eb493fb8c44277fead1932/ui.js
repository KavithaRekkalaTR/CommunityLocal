(function ($, global) {
    function loadContent(context) {
        var data = $.telligent.evolution.widgets.reporting.reportutil.getFilterData(context);
        overrideFilterData(context, data);

        var fadeDuration = 400;
        data.w_pageindex = context.localFilters.pageIndex - 1;

        context.fields.pagedContent.fadeTo(fadeDuration, 0.25, function () {
            context.fields.pager.fadeTo(fadeDuration, 0.25, function () {
                $.telligent.evolution.post({
                    url: context.urls.pagedData,
                    data: data,
                    success: function (response) {
                        context.fields.pagedContent.html(response);
                        context.fields.pagedContent.fadeTo(fadeDuration, 1);
                        context.fields.pager.fadeTo(fadeDuration, 1);
                        setupPager(context);
                    }
                });
            });
        });
    };

    function overrideFilterData(context, data) {
        if (context.localFilters && context.localFilters.filter) {
            if (context.localFilters.filter.type == "user") {
                data.fr_selectedUsers = context.localFilters.filter.id;
                data.fr_includeUsers = 'include';
                data.fr_selectedRoles = [];
            }
            else if (context.localFilters.filter.type == "content") {
                data.fr_selectedContent =  context.localFilters.filter.id;
                data.fr_selectedContentTypeId = context.localFilters.filter.typeid;
            }
            else if (context.localFilters.filter.type == "container") {
                data.fr_selectedGroups = context.localFilters.filter.id;
                data.fr_includeGroups = 'include';
            }
        }

        return data;
    };

    function setupPager(context) {
        var pagerData = $('.pager-data', context.fields.pagedContent);
        context.fields.pager.empty();
        if (pagerData.length > 0) {
            var pageSize = parseInt(pagerData.data('pagesize'), 10);
            var totalCount = parseInt(pagerData.data('totalitems'), 10);

            var p = $('<div class="pager"></div>');
            context.fields.pager.append(p);
            p.messagePager({
                currentPage: 0,
                showNext: true,
                showPrevious: true,
                pageSize: pageSize,
                totalItems: totalCount,
                pageKey: context.tabKey,
                onPage: function(pageIndex, complete, hash) {
                    page(context, pageIndex, complete);
                },
                pagedContentContainer: context.fields.pagedContent,
                tabNameSpace: context.tabNameSpace
            });
        }
    };

    function page(context, pageIndex, success) {
        var fadeDuration = 400;
        var data = $.telligent.evolution.widgets.reporting.reportutil.getFilterData(context);
        overrideFilterData(context, data);

        data.w_pageindex = pageIndex - 1;

        context.fields.pagedContent.fadeTo(fadeDuration, 0.25, function () {
            context.fields.pager.fadeTo(fadeDuration, 0.25, function () {
                $.telligent.evolution.post({
                    url: context.urls.pagedData,
                    data: data,
                    success: function (response) {
                        context.fields.pagedContent.fadeTo(fadeDuration, 1);
                        context.fields.pager.fadeTo(fadeDuration, 1);
                        success(response);
                    }
                });
            });
        });
    };

    function subscribeToExportMessages(context) {
        $.telligent.evolution.messaging.subscribe('reporting.export.list.csv', context.tabNameSpace, function(data){
            var filterData = $.telligent.evolution.widgets.reporting.reportutil.getFilterData(context);
            overrideFilterData(context, filterData);

            $.telligent.evolution.post({ timeout: 90000,
                url: context.urls.export,
                data: filterData
            })
            .then(function (response) {
                window.location = $.telligent.evolution.url.modify({
                    url: context.urls.export,
                    query: {
                        _temp_filter_key: response.key
                    }
                });
            });

        });
    };

    function showError(context, error) {
        context.fields.errorContainer.empty();
        context.fields.errorContainer.append('<div class="message error">' + error + '</div>');
        context.fields.errorContainer.show();
        context.fields.dataContainer.hide();
        context.fields.actionsContainer.hide();
    };

    function hideError(context) {
        context.fields.errorContainer.empty();
        context.fields.errorContainer.hide();
        context.fields.dataContainer.show();
        context.fields.actionsContainer.show();
    };

    function getData(context) {
        var data = {};
        data.fr_startDate = context.filters.startDate;
        data.fr_endDate = context.filters.endDate;

        if (context.filters.selectedUsers) {
            data.fr_selectedUsers = context.filters.selectedUsers.map(function(item) { return item.id; }).join();
        }

        if (context.filters.selectedGroups) {
            data.fr_selectedGroups = context.filters.selectedGroups.map(function(item) { return item.id; }).join();
        }

        if (context.filters.selectedContent) {
            data.fr_selectedContent = context.filters.selectedContent.map(function(item) { return item.id; }).join();
            data.fr_selectedContentTypeId = context.filters.selectedContent.map(function(item) { return item.typeid; }).join();
        }

        if (context.localFilters.filter) {
            if (context.localFilters.filter.type == "user") {
                data.fr_selectedUsers = context.localFilters.filter.id;
                data.fr_includeUsers = 'include';
            }
            else if (context.localFilters.filter.type == "content") {
                data.fr_selectedContent =  context.localFilters.filter.id;
                data.fr_selectedContentTypeId = context.localFilters.filter.typeid;
            }
            else if (context.localFilters.filter.type == "container") {
                data.fr_selectedGroups = context.localFilters.filter.id;
                data.fr_includeGroups = 'include';
            }
        }

        return data;
    };

    function filterChanged(context) {
        $('tbody', context.fields.listWrapper).empty();
        context.localFilters.pageIndex = 1;
        loadContent(context);
    };

    var api = {
        register: function (context) {
            context.tabNameSpace = $.telligent.evolution.administration.studioShell.tabNameSpace();
            context.fields.reportContainer = $(context.fields.reportContainerId);
            context.fields.listWrapper = $('table', context.fields.reportContainer);
            context.fields.pager = $('.pager-control', context.fields.reportContainer);
            context.fields.pagedContent = $('.paged-content', context.fields.reportContainer);

            context.fields.actionsContainer = $('.actions-container', context.fields.reportContainer);
            context.fields.errorContainer = $('.errors', context.fields.reportContainer);
            context.fields.dataContainer = $('.view-body', context.fields.reportContainer);
            context.fields.summaryContainer = $('.report-summary', context.fields.reportContainer);

            context.localFilters = {};
            context.localFilters.sortBy = 'ActivityDate';
            context.localFilters.sortOrder = 'descending';
            context.localFilters.pageIndex = 1;

            var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);
            context.localFilters.filter = tabData.localfilter !== undefined ? tabData.localfilter : [];

            context.filters = {};
            context.filters.startDate = tabData.localStartDate || tabData.startDate || $.telligent.evolution.widgets.reporting.reportutil.defaultStartDate();
            context.filters.endDate = tabData.localEndDate ||  tabData.endDate || $.telligent.evolution.widgets.reporting.reportutil.defaultEndDate();
            context.filters.selectedUsers = tabData.selectedUsers !== undefined ? tabData.selectedUsers : [];
            context.filters.selectedContent = tabData.selectedContent !== undefined ? tabData.selectedContent : [];
            context.filters.includeUsers = tabData.includeUsers;
            context.filters.includeRoles = tabData.includeRoles;
            context.filters.includeAnonymous = tabData.includeAnonymous;
            context.filters.includeGroups = tabData.includeGroups;
            context.filters.includeSubGroups = tabData.includeSubGroups;
            context.filters.includeApplications = tabData.includeApplications;
            context.filters.selectedRoles = tabData.selectedRoles !== undefined ? tabData.selectedRoles : [];
            if (tabData.selectedGroups) {
                context.filters.selectedGroups = tabData.selectedGroups;
            }
            if (tabData.selectedApplications) {
                context.filters.selectedApplications = tabData.selectedApplications;
            }
            context.filters.includeApplicationTypes = tabData.includeApplicationTypes;
            if (tabData.selectedApplicationTypes) {
                context.filters.selectedApplicationTypes = tabData.selectedApplicationTypes;
            }

            var data = getData(context);
            $.telligent.evolution.widgets.reporting.reportutil.updateSummaryHtml(context, context.fields.summaryContainer, context.urls.summary, data, showError, hideError);

            loadContent(context);
            subscribeToExportMessages(context);
            $.telligent.evolution.widgets.reporting.reportutil.subscribeToSortMessages(context, context.tabNameSpace, loadContent);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.activitiesReport = api;

})(jQuery, window);