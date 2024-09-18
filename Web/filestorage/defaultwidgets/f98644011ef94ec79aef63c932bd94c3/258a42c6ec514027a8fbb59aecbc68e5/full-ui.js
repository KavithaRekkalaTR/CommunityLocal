(function ($) {
    function dateFilterChanged(context) {
        //only the tile reports are effected by the date filters, so no changes updates here
    };

    function groupFilterChanged(context) {
        setVisibility(context);
        populateFixedData(context);
    };

    function subscribeToFilterMessages(context) {
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDateRangeFilterChange(context, context.tabNameSpace, dateFilterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToDatePeriodFilterChange(context, context.tabNameSpace, dateFilterChanged);
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToSingleGroupPickerFilterChange(context, context.tabNameSpace, groupFilterChanged);
    };

    function subscribeToExportMessages(context) {
        $.telligent.evolution.widgets.reporting.reportutil.subscribeToListCsvExport(context, context.tabNameSpace);
    };

    function setVisibility(context) {
        if (context.filters.selectedGroups != undefined && context.filters.selectedGroups.length > 0) {
            hideError(context);
        }
        else {
            showError(context, context.resources.noGroupError);
        }
    };

    function showError(context, error) {
        context.fields.errorContainer.empty();
        context.fields.errorContainer.append('<div class="message error">' + error + '</div>');
        context.fields.errorContainer.show();
        context.fields.dataContainer.hide();
        context.fields.actionsContainer.hide();
    };

    function hideError(context) {
        context.fields.errorContainer.empty();
        context.fields.errorContainer.hide();
        context.fields.dataContainer.show();
        context.fields.actionsContainer.show();
    };

    function populateFixedData(context) {
        if (context.filters.selectedGroups != undefined && context.filters.selectedGroups.length >= 1) {
            $.telligent.evolution.get({
                url: context.urls.fixedData,
                data: {
                    fr_id: context.filters.selectedGroups[0].id
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

                        var cardContainer = $('.cards', context.fields.reportContainer);
                        var cardData = $('.cards', r);
                        if (cardData.length > 0 && cardContainer.length > 0) {
                            cardContainer.replaceWith(cardData);
                        }

                        var contentDataContainer = $('.content-data', context.fields.reportContainer);
                        var contentData = $('.content-data', r);
                        if (contentData.length > 0 && contentDataContainer.length > 0) {
                            contentDataContainer.replaceWith(contentData);
                        }

                        hideError(context);
                    }
                }
            });
        }
        else {
            showError(context, context.resources.noGroupError);
        }
    }

    var api = {
        register: function (context) {
            context.tabNameSpace = $.telligent.evolution.administration.studioShell.tabNameSpace();
            context.fields.reportContainer = $(context.fields.reportContainerId);
            context.fields.errorContainer = $('.errors', context.fields.reportContainer);
            context.fields.dataContainer = $('.group-data', context.fields.reportContainer);
            context.fields.actionsContainer = $('.actions-container', context.fields.reportContainer);

            context.localFilters = {};

            var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(context.tabKey);

            context.filters = {};
            context.filters.startDate = tabData.startDate || $.telligent.evolution.widgets.reporting.reportutil.defaultStartDate();
            context.filters.endDate = tabData.endDate || $.telligent.evolution.widgets.reporting.reportutil.defaultEndDate();
            context.filters.datePeriod = tabData.datePeriod;

            if (tabData.selectedGroups)
                context.filters.selectedGroups = tabData.selectedGroups;

            subscribeToFilterMessages(context);
            subscribeToExportMessages(context);
            populateFixedData(context);
            setVisibility(context);
        }
    };

    $.telligent = $.telligent || {};
	$.telligent.reporting = $.telligent.reporting || {};
    $.telligent.reporting.widgets = $.telligent.reporting.widgets || {};
    $.telligent.reporting.widgets.groupSummaryReport = api;
})(jQuery);