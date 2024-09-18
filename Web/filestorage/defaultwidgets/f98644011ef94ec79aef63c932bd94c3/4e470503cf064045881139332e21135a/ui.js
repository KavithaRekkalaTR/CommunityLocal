(function ($, global) {
    function loadContent(context) {
        var data = $.telligent.evolution.widgets.reporting.reportutil.getFilterData(context);

        var fadeDuration = 400;
        data.w_pageindex = context.localFilters.pageIndex - 1;

        context.fields.pagedContent.fadeTo(fadeDuration, 0.25, function () {
            context.fields.pager.fadeTo(fadeDuration, 0.25, function () {
                $.telligent.evolution.get({
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
                $.telligent.evolution.get({
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
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToListCsvExport(context, context.tabNameSpace);
    };

    var api = {
        register: function (context) {
            context.tabNameSpace = $.telligent.evolution.administration.studioShell.tabNameSpace();
            context.fields.reportContainer = $(context.fields.reportContainerId);
            context.fields.listWrapper = $('table', context.fields.reportContainer);
            context.fields.pager = $('.pager-control', context.fields.reportContainer);
            context.fields.pagedContent = $('.paged-content', context.fields.reportContainer);

            context.localFilters = {};
            context.localFilters.sortBy = 'ActiveUserCountLast30Days';
            context.localFilters.sortOrder = 'descending';
            context.localFilters.pageIndex = 1;

            context.filters = {};

            loadContent(context);
            subscribeToExportMessages(context);
            $.telligent.evolution.widgets.reporting.reportutil.subscribeToSortMessages(context, context.tabNameSpace, loadContent);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.groupsSummaryDashboard = api;

})(jQuery, window);