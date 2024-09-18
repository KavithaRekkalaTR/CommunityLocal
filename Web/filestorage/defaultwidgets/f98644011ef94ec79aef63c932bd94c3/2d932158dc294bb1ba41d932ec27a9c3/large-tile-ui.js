(function ($) {
    function refreshGraph(context, fade) {
        var fadeDuration = 0;
        if (fade === true) {
            fadeDuration = 400;
        }

        var data = $.telligent.evolution.widgets.reporting.reportutil.getGraphData(context);

        if (context.contentTypes) {
            data.fr_contentTypes = context.contentTypes.join(',');
        }

        context.fields.graphContainer.fadeTo(fadeDuration, 0.25, function () {
            $.telligent.evolution.post({ timeout: 90000,
                url: context.urls.reportData,
                data: data,
                success: function (response) {
                    context.fields.graphContainer.html(response);
                    context.fields.graphContainer.fadeTo(fadeDuration, 1);

                    var graphdata = $("pre.graphData", context.fields.reportContainer).html();
                    var options = $.telligent.evolution.widgets.reporting.reportutil.getMultiLineTileGraphOptions(context, 'Content by Type', 'Number of content', setEnabledContentTypes);
                    $.telligent.evolution.widgets.reporting.reportutil.buildMultiLineSeriesData(context, options, graphdata, $.telligent.evolution.widgets.reporting.util.getContentTypeSeriesColor);

                    context.sparkline = $("div.sparkline", context.fields.reportContainer);
                    context.sparkline.highcharts(options);
                }
            });
        });
    };

    function setEnabledContentTypes(context) {
        context.contentTypes = [];
        if(context.sparkline != null) {
            $(context.sparkline.highcharts().series).each(function(){
                if (this.visible) {
                    context.contentTypes.push(this.userOptions.id);
                }
            });
        }
    };

    function filterChanged(context) {
        refreshGraph(context, true);
    };

    function subscribeToFilterMessages(context) {
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDateRangeFilterChange(context, context.tabNameSpace, filterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDatePeriodFilterChange(context, context.tabNameSpace, filterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToSingleApplicationPickerFilterChange(context, context.tabNameSpace, filterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToSingleGroupPickerFilterChange(context, context.tabNameSpace, filterChanged);
    };

    var api = {
        register: function (context) {
            context.tabNameSpace = $.telligent.evolution.administration.studioShell.tabNameSpace();
            context.fields.reportContainer = $(context.fields.reportContainerId);
            context.fields.graphContainer = $('.graph-content', context.fields.reportContainer);

            context.localFilters = {};
            setTimeout(function() {
                var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);

                context.filters = {};
                context.filters.startDate = tabData.startDate || $.telligent.evolution.widgets.reporting.reportutil.defaultStartDate();
                context.filters.endDate = tabData.endDate || $.telligent.evolution.widgets.reporting.reportutil.defaultEndDate();
                context.filters.datePeriod = tabData.datePeriod;

                if (tabData.selectedApplications) {
                    context.filters.selectedApplications = tabData.selectedApplications;
                    context.filters.includeApplications = tabData.includeApplications || 'include';
                }
                else if (tabData.selectedGroups) {
                    context.filters.selectedGroups = tabData.selectedGroups;
                    context.filters.includeGroups = tabData.includeGroups || 'include';
                }

                subscribeToFilterMessages(context);
                refreshGraph(context, false);
            }, 500);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.contentContributionsLargeTileReport = api;
})(jQuery);