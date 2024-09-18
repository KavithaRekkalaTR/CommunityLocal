(function ($, global) {

        var api = {
            register: function (context) {
                function cb(includeGroups, selectedGroups, includeSubGroups, includeApplications, selectedApplications, includeApplicationTypes, selectedApplicationTypes, suppressMessage) {
                    var results = '';

                    //add application types
                    if (includeApplicationTypes == "include" || includeApplicationTypes == 'exclude') {
                        var numberOfApplicationTypes = selectedApplicationTypes.length;

                        if(numberOfApplicationTypes && numberOfApplicationTypes >= 1) {
                            results = (includeApplicationTypes == 'exclude'  ? 'Not in ' : 'In ');
                            results += selectedApplicationTypes[0].name

                            if (numberOfApplicationTypes > 1) {
                                results += ' and ' + (numberOfApplicationTypes - 1) + (numberOfApplicationTypes > 2 ? ' other application types' : ' other application type');
                            }
                            else {
                                results += ' applications';
                            }
                        }
                    }

                    if (includeGroups == "include" || includeGroups == 'exclude') {
                        var numberOfGroups = selectedGroups.length;

                        if(numberOfGroups && numberOfGroups >= 1) {
                            if (results != '') {
                                results += ";  ";
                            }
                            results += (includeGroups == 'exclude'  ? 'Not in ' : 'In ');
                            results += selectedGroups[0].name;

                            if (numberOfGroups > 1) {
                                results += includeSubGroups == true ? ', ' : ' and ';
                                results += (numberOfGroups - 1) + (numberOfGroups > 2 ? ' other groups' : ' other group');
                            }

                            if (includeSubGroups == true) {
                                results += (numberOfGroups > 1) ? ' and their subgroups': ' and its subgroups';
                            }
                        }
                    }

                    if (includeApplications == "include" || includeApplications == 'exclude') {
                        var numberOfApplications = selectedApplications.length;

                        if(numberOfApplications && numberOfApplications >= 1) {
                            if (results != '') {
                                results += ";  ";
                            }
                            results += (includeApplications == 'exclude'  ? 'Not in ' : 'In ');
                            results += selectedApplications[0].name;

                            if (numberOfApplications > 1) {
                                results += ' and ' + (numberOfApplications - 1) + (numberOfApplications > 2 ? ' other applications.' : ' other application.');
                            }
                        }
                    }

                    if (results == '') {
                        results = context.resources.filterByGroups;
                    }

                    var span = $(context.fields.groupPickerId).find("span");
                    if (results == context.resources.filterByGroups && context.isSiteReporter != 'True') {
                        results = context.resources.selectAGroupOrApplication;
                        span.addClass('warning');
                    }
                    else {
                        span.removeClass('warning');
                    }

                    span.html(results);

                    if (!suppressMessage) {
                        var d = {};
                        d["includeGroups"] = includeGroups;
                        d["includeApplications"] = includeApplications;
                        d["includeSubGroups"] = includeSubGroups;
                        d["selectedGroups"] = selectedGroups;
                        d["selectedApplications"] = selectedApplications;
                        d["includeApplicationTypes"] = includeApplicationTypes;
                        d["selectedApplicationTypes"] = selectedApplicationTypes;

                        $.telligent.evolution.widgets.reporting.util.updateCurrentTabData(d);

                        $.telligent.evolution.messaging.publish('reporting.filter.grouppicker.modified', {
                            includeGroups: includeGroups,
                            includeApplications: includeApplications,
                            includeSubGroups: includeSubGroups,
                            selectedGroups: selectedGroups,
                            selectedApplications: selectedApplications,
                            selectedApplicationTypes: selectedApplicationTypes,
                            includeApplicationTypes: includeApplicationTypes
                        });
                    }
                }

                var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);

                var includeGroups = "";
                if (tabData.includeGroups) {
                    includeGroups = tabData.includeGroups;
                }

                var selectedGroups = [];
                if (tabData.selectedGroups) {
                    selectedGroups = tabData.selectedGroups;
                }

                var includeSubGroups = "";
                if (tabData.includeSubGroups) {
                    includeSubGroups = tabData.includeSubGroups;
                }

                var includeApplications = "";
                if (tabData.includeApplications) {
                    includeApplications = tabData.includeApplications;
                }

                var selectedApplications = [];
                if (tabData.selectedApplications) {
                    selectedApplications = tabData.selectedApplications;
                }

                var includeApplicationTypes = "";
                if (tabData.includeApplicationTypes) {
                    includeApplicationTypes = tabData.includeApplicationTypes;
                }

                var selectedApplicationTypes = [];
                if (tabData.selectedApplicationTypes && tabData.selectedApplicationTypes.length > 0) {
                    selectedApplicationTypes = tabData.selectedApplicationTypes;
                }
                else if (context.defaultApplicationTypes && context.defaultApplicationTypes.length > 0) {
                    selectedApplicationTypes = context.defaultApplicationTypes;
                }

                $(context.fields.groupPickerId).grouppicker({
                    showApplicationTypes: context.showApplicationTypes == 'True', 
                    includeGroups: includeGroups,
                    selectedGroups: selectedGroups,
                    includeSubGroups: includeSubGroups,
                    includeApplications: includeApplications,
                    selectedApplications: selectedApplications,
                    groupLookupUrl: context.urls.lookupGroups,
                    applicationLookupUrl: context.urls.lookupApplications,
                    showIncludeSubGroups: context.isSiteReporter == 'True',
                    includeApplicationTypes: includeApplicationTypes,
                    selectedApplicationTypes: selectedApplicationTypes,
                    applicationTypes: applicationTypes
                }, cb);

                cb(includeGroups, selectedGroups, includeSubGroups, includeApplications, selectedApplications, includeApplicationTypes, selectedApplicationTypes, true);
            }
        };

    $.telligent = $.telligent || {};
    $.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.groupFilter = api;

    })(jQuery, window);
