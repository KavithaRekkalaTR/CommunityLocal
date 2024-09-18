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
        resetContent(context);
    };

    function resetContent(context) {
        $('tbody', context.fields.listWrapper).empty();
        context.localFilters.pageIndex = 1;
        loadContent(context);
    };

    function refreshGraph(context, fade) {
        var fadeDuration = 0;
        if (fade === true) {
            fadeDuration = 400;
        };
        var data = $.telligent.evolution.widgets.reporting.reportutil.getGraphData(context);

        context.fields.graphContainer.fadeTo(fadeDuration, 0.25, function () {
            $.telligent.evolution.post({ timeout: 90000,
                url: context.urls.reportData,
                data: data,
                dataType: 'html',
                success: function (response) {
                    context.fields.graphContainer.html(response);
                    context.fields.graphContainer.fadeTo(fadeDuration, 1);

                    context.sparkline = $("div.sparkline", context.fields.graphContainer);
                    stringdata = context.sparkline.data('sparkline');

                    var options = $.telligent.evolution.widgets.reporting.reportutil.getStandardGraphOptions(context, '#6B5B95', 'Active Groups','Number of active groups', stringdata, resetFilter, graphClick);
                    context.sparkline.highcharts(options);
                }
            });
        });

        $.telligent.evolution.widgets.reporting.reportutil.updateSummaryHtml(context, context.fields.summaryContainer, context.urls.summary, data, showError, hideError);
    };

    function loadContent(context) {
        var data = $.telligent.evolution.widgets.reporting.reportutil.getFilterData(context);

        var fadeDuration = 400;
        data.w_pageindex = context.localFilters.pageIndex - 1;

        if (context.localFilters !== undefined && context.localFilters.hasOwnProperty('filterStartDate'))
            data.localStartDate = context.localFilters.filterStartDate;
        if (context.localFilters !== undefined && context.localFilters.hasOwnProperty('filterEndDate'))
            data.localEndDate = context.localFilters.filterEndDate;

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

        if (context.localFilters !== undefined && context.localFilters.hasOwnProperty('filterStartDate'))
                data.localStartDate = context.localFilters.filterStartDate;
        if (context.localFilters !== undefined && context.localFilters.hasOwnProperty('filterEndDate'))
                data.localEndDate = context.localFilters.filterEndDate;

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

    function filterChanged(context) {
        resetFilter(context, true);
        refreshGraph(context, true);
    }

    function subscribeToFilterMessages(context) {
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDateRangeFilterChange(context, context.tabNameSpace, filterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDatePeriodFilterChange(context, context.tabNameSpace, filterChanged);
    };

    function subscribeToExportMessages(context) {
        var filename = 'ActiveGroups';
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToChartCsvExport(context, context.tabNameSpace, filename);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToChartImageExport(context, context.tabNameSpace, filename);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToListCsvExport(context, context.tabNameSpace);
    };

    function cleanData(context, tabData) {
        var update = false;

        if (tabData.localStartDate || tabData.localEndDate) {
            tabData.localStartDate = undefined;
            tabData.localEndDate = undefined;
            update = true;
        }

        if (update)
            $.telligent.evolution.widgets.reporting.util.updateTabData(context.tabKey, tabData);
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
            context.localFilters.sortBy = 'ActivityDate';
            context.localFilters.sortOrder = 'descending';
            context.localFilters.pageIndex = 1;

            var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);
            cleanData(context, tabData);

            context.filters = {};
            context.filters.startDate = tabData.startDate || $.telligent.evolution.widgets.reporting.reportutil.defaultStartDate();
            context.filters.endDate = tabData.endDate || $.telligent.evolution.widgets.reporting.reportutil.defaultEndDate();
            context.filters.datePeriod = tabData.datePeriod;

            subscribeToFilterMessages(context);
            refreshGraph(context, false);
            loadContent(context);
            subscribeToExportMessages(context);
            $.telligent.evolution.widgets.reporting.reportutil.subscribeToSortMessages(context, context.tabNameSpace, loadContent);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.activeGroupsReport = api;
})(jQuery);