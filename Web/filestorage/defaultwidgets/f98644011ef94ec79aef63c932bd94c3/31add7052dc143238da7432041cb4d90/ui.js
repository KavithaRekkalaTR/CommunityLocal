(function ($, global) {

        var api = {
            register: function (context) {
                function cb(selectedGroup, suppressMessage) {
                    var results = context.resources.selectAGroup;

                    if (selectedGroup && selectedGroup.length > 0) {
                        results = 'For ' + selectedGroup[0].name;
                        var span = $(context.fields.groupPickerId).find("span");
                        span.html(results);
                        span.removeClass('warning');
                        }
                    else {
                        var span = $(context.fields.groupPickerId).find("span");
                        span.html(results);
                        span.addClass('warning');
                    }

                    if (!suppressMessage) {
                        var d = {};

                        d["selectedGroups"] = selectedGroup;
                        if (selectedGroup && selectedGroup.length > 0) {
                            d["includeGroups"] = 'include';
                        }

                        $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);

                        $.telligent.evolution.messaging.publish('reporting.filter.singlegrouppicker.modified', {
                            selectedGroups: selectedGroup,
                            includeGroups: 'include'
                        });
                    }
                }

                var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);

                var selectedGroup = null;
                if (tabData.selectedGroups) {
                    selectedGroup = tabData.selectedGroups;
                }

                $(context.fields.groupPickerId).singlegrouppicker({
                    selectedGroup: tabData.selectedGroups && tabData.selectedGroups.length > 0 ? selectedGroup[0] : undefined,
                    groupLookupUrl: context.urls.lookupGroups,
                }, cb);

                cb(selectedGroup, true);
            }
        };

    $.telligent = $.telligent || {};
    $.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.singleGroupFilter = api;

    })(jQuery, window);
