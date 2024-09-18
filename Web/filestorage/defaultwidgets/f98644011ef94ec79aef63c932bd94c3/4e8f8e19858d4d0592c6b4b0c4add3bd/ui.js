(function ($, global) {
    var api = {
        register: function (context) {

            function cb(selectedSearchFlags, suppressMessage) {
                updateDisplay(selectedSearchFlags);

                var d = {};
                d.selectedSearchFlags = selectedSearchFlags;
                $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);

                if (!suppressMessage) {
                    $.telligent.evolution.messaging.publish('reporting.filter.searchflags.modified', {
                        selectedSearchFlags: selectedSearchFlags,
                    });
                }
            }

            function updateDisplay(selectedSearchFlags) {
                if (selectedSearchFlags != null && selectedSearchFlags != '') {
                    var text = context.resources.searchTypeIs.replace("{0}", selectedSearchFlags);
                    $(context.fields.searchFlagsId).find('span').html(text);
                }
                else
                    $(context.fields.searchFlagsId).find('span').html(context.resources.allFlags);
            }

            var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);
            var d = {};

            if (tabData.selectedSearchFlags === undefined) {
                d.selectedSearchFlags = ''
                $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);
            }
            else {
                d.selectedSearchFlags = tabData.selectedSearchFlags;
            }

            $(context.fields.searchFlagsId).searchFlagsPicker({
                selectedSearchFlags: d.selectedSearchFlags,
                searchFlagsOptions: context.searchFlagOptions
            }, cb);

            cb(d.selectedSearchFlags, true);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.searchFlagsFilter = api;

})(jQuery, window);
