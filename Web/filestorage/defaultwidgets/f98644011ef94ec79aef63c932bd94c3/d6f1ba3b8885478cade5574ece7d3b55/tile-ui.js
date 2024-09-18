(function ($) {
    function refreshGraph(context, fade) {
        var fadeDuration = 0;
        if (fade === true) {
            fadeDuration = 400;
        }

        var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);
        var data = {};
        data.startDate = tabData.startDate;
        data.endDate = tabData.endDate;
        data.datePeriod = tabData.datePeriod;

        context.fields.graphContainer.fadeTo(fadeDuration, 0.25, function () {
            $.telligent.evolution.get({ timeout: 90000,
                url: context.urls.reportData,
                data: data,
                dataType: 'html',
                success: function (response) {
                    context.fields.graphContainer.html(response);
                    context.fields.graphContainer.fadeTo(fadeDuration, 1);

                    var sparkline = $("div.sparkline", context.fields.graphContainer);
                    stringdata = sparkline.data('sparkline');
                    var options = $.telligent.evolution.widgets.reporting.reportutil.getTileGraphOptions(context, '#6B5B95', 'Number of new groups', data, stringdata);
                    sparkline.highcharts(options);
                }
            });
        });
    };

    function filterChanged(context) {
        refreshGraph(context, true);
    };

    var api = {
        register: function (context) {
            context.tabNameSpace = $.telligent.evolution.administration.studioShell.tabNameSpace();
            context.fields.reportContainer = $(context.fields.reportContainerId);
            context.fields.graphContainer = $('.graph-content', context.fields.reportContainer);

            context.localFilters = {};
            context.filters = {};

            setTimeout(function() {
                $.telligent.evolution.widgets.reporting.reportutil.subscribeToDateRangeFilterChange(context, context.tabNameSpace, filterChanged);
                $.telligent.evolution.widgets.reporting.reportutil.subscribeToDatePeriodFilterChange(context, context.tabNameSpace, filterChanged);

                refreshGraph(context, false);
            }, 50);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.newGroupsTileReport = api;
})(jQuery);