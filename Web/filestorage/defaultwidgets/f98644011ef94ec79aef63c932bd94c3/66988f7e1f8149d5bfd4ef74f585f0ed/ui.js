(function ($, global) {
    var api = {
        register: function (context) {
            function cb(start, end, suppressMessage) {
                $(context.fields.dateRangeId).find('span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));

                if (!suppressMessage) {
                    var d = {};

                    d.startDate = moment(start).format('YYYY-MM-DD');
                    d.endDate = moment(end).format('YYYY-MM-DD');

                    var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);
                    var diff = end.diff(start, 'days');

                    if (diff > 30 && diff <= 98) {
                        d.datePeriod = 'week';
                    }
                    else if (diff > 98 && diff <= 730) {
                        d.datePeriod = 'month';
                    }
                    else if (diff > 730) {
                        d.datePeriod = 'year';
                    }
                    else {
                        d.datePeriod = 'day';
                    }

                    $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);

                    $.telligent.evolution.messaging.publish('reporting.filter.daterange.modified', {
                        startDate: d.startDate,
                        endDate: d.endDate,
                        datePeriod: d.datePeriod
                    });
                }
            }

            var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);
            var d = {};

            var start, end;
            var updateTabData = false;

            var today = moment().format("YYYY-MM-DD");

            if (tabData.startDate === undefined) {
                start = moment.utc(today).subtract(31, 'days');
                d.startDate = moment(start).format('YYYY-MM-DD');
                updateTabData = true;
            }
            else {
                start = moment.utc(tabData.startDate);
            }

            if (tabData.endDate === undefined) {
                end = moment.utc(today).subtract(1, 'days');
                d.endDate = moment(end).format('YYYY-MM-DD');
                updateTabData = true;
            }
            else {
                end = moment.utc(tabData.endDate);
            }

            if (updateTabData)
               $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);

            $(context.fields.dateRangeId).daterangepicker({
                startDate: start,
                endDate: end,
                ranges: {
                   'Last 7 Days': [moment.utc(today).subtract(7, 'days'), moment.utc(today).subtract(1, 'days')],
                   'Last 30 Days': [moment.utc(today).subtract(31, 'days'), moment.utc(today).subtract(1, 'days')],
                   'This Month': [moment.utc(today).startOf('month'), moment.utc(today)],
                   'Last Month': [moment.utc(today).subtract(1, 'month').startOf('month'), moment.utc(today).subtract(1, 'month').endOf('month')],
                   'Last 3 Months': [moment.utc(today).subtract(3, 'month').startOf('month'), moment.utc(today).subtract(1, 'month').endOf('month')],
                   'This Year':  [moment.utc(today).startOf('year'), moment.utc(today)],
                   'Last Year':  [moment.utc(today).startOf('year').subtract(1, 'year'), moment.utc(today).endOf('year').subtract(1, 'year')]
                }
            }, cb);

            cb(start, end, true);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.dateRangeFilter = api;

})(jQuery, window);
