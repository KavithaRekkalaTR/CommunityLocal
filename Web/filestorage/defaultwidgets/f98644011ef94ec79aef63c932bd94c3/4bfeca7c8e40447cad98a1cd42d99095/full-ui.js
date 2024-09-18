(function ($) {
    function dateFilterChanged(context) {
        populateVariableData(context);
    };

    function applicationFilterChanged(context) {
        setVisibility(context);
        populateVariableData(context);
        populateFixedData(context);
    };

    function subscribeToFilterMessages(context) {
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDateRangeFilterChange(context, context.tabNameSpace, dateFilterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDatePeriodFilterChange(context, context.tabNameSpace, dateFilterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToSingleApplicationPickerFilterChange(context, context.tabNameSpace, applicationFilterChanged);
    };

    function subscribeToExportMessages(context) {
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToListCsvExport(context, context.tabNameSpace);
    };

    function setVisibility(context) {
        if (context.filters.selectedApplications != undefined && context.filters.selectedApplications.length > 0) {
            hideError(context);
        }
        else {
            showError(context, context.resources.noForumError);
        }
    };

    function showError(context, error) {
        context.fields.errorContainer.empty();
        context.fields.errorContainer.append('<div class="message error">' + error + '</div>');
        context.fields.errorContainer.show();
        context.fields.dataContainer.hide();
        context.fields.actionsContainer.hide();
    }

    function hideError(context) {
        context.fields.errorContainer.empty();
        context.fields.errorContainer.hide();
        context.fields.dataContainer.show();
        context.fields.actionsContainer.show();
    }

    function populateVariableData(context) {
        var cardContainer = $('.cards', context.fields.reportContainer);

        if (context.filters.selectedApplications != undefined && context.filters.selectedApplications.length >= 1) {
            var data = $.telligent.evolution.widgets.reporting.reportutil.getFilterData(context);

            $.telligent.evolution.get({
                url: context.urls.variableData,
                data: data,
                success: function (response) {
                    var r = $(response);

                    if (r.find('.error').length > 0) {
                        showError(context, r.find('.error').html());
                    }
                    else {
                        var cardData = $('.cards', r);
                        if (cardData.length > 0 && cardContainer.length > 0) {
                            cardContainer.replaceWith(cardData);
                        }

                        hideError(context);
                    }
                }
            });
        }
        else {
            showError(context, context.resources.noForumError);
        }
    };

    function populateFixedData(context) {
        if (context.filters.selectedApplications != undefined && context.filters.selectedApplications.length >= 1) {
            $.telligent.evolution.get({
                url: context.urls.fixedData,
                data: {
                    fr_id: context.filters.selectedApplications[0].id
                },
                success: function (response) {
                    var r = $(response);

                    if (r.find('.error').length > 0) {
                        showError(context, r.find('.error').html());
                    }
                    else {
                        var reportDetailsContainer = $('.report-details', context.fields.reportContainer);
                        var reportDetailsData = $('.report-details', r);
                        if (reportDetailsData.length > 0 && reportDetailsContainer.length > 0) {
                            reportDetailsContainer.replaceWith(reportDetailsData);
                        }

                        var forumDataContainer = $('.forum-data', context.fields.reportContainer);
                        var forumData = $('.forum-data', r);
                        if (forumData.length > 0 && forumDataContainer.length > 0) {
                            forumDataContainer.replaceWith(forumData);
                        }

                        hideError(context);
                    }
                }
            });
        }
        else {
            showError(context, context.resources.noForumError);
        }
    };

    var api = {
        register: function (context) {
            context.tabNameSpace = $.telligent.evolution.administration.studioShell.tabNameSpace();
            context.fields.reportContainer = $(context.fields.reportContainerId);
            context.fields.errorContainer = $('.errors', context.fields.reportContainer);
            context.fields.dataContainer = $('.application-data', context.fields.reportContainer);
            context.fields.actionsContainer = $('.actions-container', context.fields.reportContainer);

            context.localFilters = {};

            var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);

            context.filters = {};
            context.filters.startDate = tabData.startDate || $.telligent.evolution.widgets.reporting.reportutil.defaultStartDate();
            context.filters.endDate = tabData.endDate || $.telligent.evolution.widgets.reporting.reportutil.defaultEndDate();
            context.filters.datePeriod = tabData.datePeriod;
            if (tabData.selectedApplications)
                context.filters.selectedApplications = tabData.selectedApplications;

            subscribeToFilterMessages(context);
            subscribeToExportMessages(context);
            populateFixedData(context);
            populateVariableData(context);
            setVisibility(context);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.forumSummaryReport = api;
})(jQuery);