(function ($, global) {

        var api = {
            register: function (context) {
                function cb(selectedApplication, suppressMessage) {
                    var results = context.resources.select;
                    results += (context.applicationTypeName) ? context.applicationTypeName : context.resources.application;

                    if (selectedApplication && selectedApplication.length > 0) {
                        results = 'For ' + selectedApplication[0].name;
                        var span = $(context.fields.appPickerId).find("span");
                        span.html(results);
                        span.removeClass('warning');
                        }
                    else {
                        var span = $(context.fields.appPickerId).find("span");
                        span.html(results);
                        span.addClass('warning');
                    }

                    if (!suppressMessage) {
                        var d = {};

                        d["selectedApplications"] = selectedApplication;
                        if (selectedApplication && selectedApplication.length > 0) {
                            d["includeApplications"] = 'include';
                        }

                        $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);

                        $.telligent.evolution.messaging.publish('reporting.filter.singleapplicationpicker.modified', {
                            selectedApplications: selectedApplication,
                            includeApplications: 'include'
                        });
                    }
                }

                var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);

                var selectedApplication = null;
                if (tabData.selectedApplications) {
                    selectedApplication = tabData.selectedApplications;
                }

                $(context.fields.appPickerId).singleapplicationpicker({
                    selectedApplication: tabData.selectedApplications && tabData.selectedApplications.length > 0 ? selectedApplication[0] : undefined,
                    applicationLookupUrl: context.urls.lookupApplications,
                    applicationTypeId: context.applicationTypeId,
                    applicationTypeName: context.applicationTypeName,
                }, cb);

                cb(selectedApplication, true);
            }
        };

    $.telligent = $.telligent || {};
    $.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.singleApplicationFilter = api;

    })(jQuery, window);
