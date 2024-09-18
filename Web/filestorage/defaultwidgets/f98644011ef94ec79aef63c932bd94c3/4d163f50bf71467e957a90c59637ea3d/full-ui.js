(function ($) {
    function graphClick(context, value) {
        var text = $.telligent.evolution.widgets.reporting.reportutil.setFilterDates(context, value);

        var filter = $('.table-filter', context.fields.reportContainer);
        filter.empty();

        var filterLink = $('<a class="inline-button clear-filter" href="#">' + context.resources.clearFilter + '</a>');

        var filterValue = $('<span class="filter-value">' + text + '</span>');
        filterLink.on('click', function() {
            resetFilter(context, true);
            return false;
        });

        filter.append(filterValue);
        filter.append(filterLink);
        filter.show();

        resetContent(context);
    };

    function resetContent(context) {
        $('tbody', context.fields.listWrapper).empty();
        context.localFilters.pageIndex = 1;
        loadContent(context);
    };

    function resetFilter(context, deselect) {
        if (deselect == true && context.sparkline) {
            var selectedPoints = context.sparkline.highcharts().getSelectedPoints();
            for (i = 0; i < selectedPoints.length; i++) {
                selectedPoints[i].select(false,false);
            }
        }

        var filter = $('.table-filter', context.fields.reportContainer);
        filter.empty();
        filter.hide();
        context.localFilters.filterStartDate = undefined;
        context.localFilters.filterEndDate = undefined;
        context.localFilters.filterContentType = undefined;
        context.localFilters.filterContentTypeName = undefined;
        resetContent(context);
    };

    function loadContent(context) {
        if (canView(context) !== true) {
            return;
        }

        var data = $.telligent.evolution.widgets.reporting.reportutil.getFilterData(context);

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

    function filterChanged(context) {
        setVisibility(context);
        resetFilter(context, true);
    };

    function setVisibility(context) {
        if (canView(context) === true) {
            hideError(context);
        }
        else {
            showError(context, context.resources.noGroupError);
        }
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
    function subscribeToFilterMessages(context) {
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDateRangeFilterChange(context, context.tabNameSpace, filterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDatePeriodFilterChange(context, context.tabNameSpace, filterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToUserPickerFilterChange(context, context.tabNameSpace, filterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToGroupPickerFilterChange(context, context.tabNameSpace, filterChanged);
    };

    function subscribeToExportMessages(context) {
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToListCsvExport(context, context.tabNameSpace);
    };

    function canView(context) {
        if (context.isSiteReporter == 'True') {
            return true;
        }
        else if ((context.filters.selectedGroups && context.filters.selectedGroups.length > 0) || (context.filters.selectedApplications && context.filters.selectedApplications.length > 0)) {
            return true;
        }

        return false;
    };

    var api = {
        register: function (context) {
            context.tabNameSpace = $.telligent.evolution.administration.studioShell.tabNameSpace();
            context.fields.reportContainer = $(context.fields.reportContainerId);
            context.fields.graphContainer = $('.graph-content', context.fields.reportContainer);
            context.fields.listWrapper = $('table', context.fields.reportContainer);
            context.fields.pager = $('.pager-control', context.fields.reportContainer);
            context.fields.pagedContent = $('.paged-content', context.fields.reportContainer);

            context.fields.errorContainer = $('.errors', context.fields.reportContainer);
            context.fields.dataContainer = $('.view-body', context.fields.reportContainer);
            context.fields.actionsContainer = $('.actions-container', context.fields.reportContainer);
            context.fields.summaryContainer = $('.report-summary', context.fields.reportContainer);

            context.localFilters = {};
            context.localFilters.sortBy = 'LastPublishedDate';
            context.localFilters.sortOrder = 'descending';
            context.localFilters.pageIndex = 1;
            context.localFilters.chartType = 'line';

            var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);

            context.filters = {};
            context.filters.startDate = tabData.startDate || $.telligent.evolution.widgets.reporting.reportutil.defaultStartDate();
            context.filters.endDate = tabData.endDate || $.telligent.evolution.widgets.reporting.reportutil.defaultEndDate();
            context.filters.datePeriod = tabData.datePeriod;
            context.filters.includeUsers = tabData.includeUsers;
            context.filters.includeRoles = tabData.includeRoles;
            context.filters.includeAnonymous = tabData.includeAnonymous;
            context.filters.includeGroups = tabData.includeGroups;
            context.filters.includeSubGroups = tabData.includeSubGroups;
            context.filters.includeApplications = tabData.includeApplications;
            context.filters.selectedUsers = tabData.selectedUsers !== undefined ? tabData.selectedUsers : [];
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

            subscribeToFilterMessages(context);
            setVisibility(context);
            loadContent(context);
            subscribeToExportMessages(context);
            $.telligent.evolution.widgets.reporting.reportutil.subscribeToSortMessages(context, context.tabNameSpace, loadContent);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.articlesReport = api;
})(jQuery);