(function ($, global) {
    var api = {
        register: function (context) {

            function cb(datePeriod, suppressMessage) {
                updateDisplay(datePeriod);

                var d = {};
                d.datePeriod = datePeriod;
                $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);

                if (!suppressMessage) {
                    $.telligent.evolution.messaging.publish('reporting.filter.dateperiod.modified', {
                        datePeriod: datePeriod,
                    });
                }
            }

            function updateDisplay(datePeriod) {
                var value = context.resources.day;

                if (datePeriod == 'year') {
                    value = context.resources.year;
                }
                else if (datePeriod == 'month') {
                    value = context.resources.month;
                }
                else if (datePeriod == 'week') {
                    value = context.resources.week;
                }

                $(context.fields.datePeriodId).find('span').html(value);
            }

            var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);
            var d = {};

            if (tabData.datePeriod === undefined) {
                d.datePeriod = 'day'
                $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);
            }
            else {
                d.datePeriod = tabData.datePeriod;
            }

            $.telligent.evolution.messaging.subscribe('reporting.filter.daterange.modified', $.telligent.evolution.administration.studioShell.tabNameSpace(), function(data){
                if (data.datePeriod) {
                    updateDisplay(data.datePeriod);

                    $(context.fields.datePeriodId).datePeriodPicker({
                        datePeriod: data.datePeriod
                    }, cb);
                }
            });

            $(context.fields.datePeriodId).datePeriodPicker({
                datePeriod: d.datePeriod
            }, cb);

            cb(d.datePeriod, true);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.datePeriodFilter = api;

})(jQuery, window);
