/*
ReportingModel

API:

navigateTo();
processCurrent();
reset();
cleanup();

*/
define('ReportingRouter', function($, global, undef) {

	var ReportingRouter = function(options){

		var url = $.telligent.evolution.url;
		var lastTabKey = null;
		var lastDrillReportId;

		return {
			navigateTo: function(tabKey, data) {
                data = typeof data !== 'undefined' ? data : {};

                if (tabKey == null) {
                    window.location.hash = '_aptype=panel&_appanelid=c67c9c17-3efb-44c0-a0ca-a17662c97d18';
                    return;
                }

                var currentHash = url.hashData();
				var newData = {};
				newData._aptype = currentHash._aptype;
				newData._appanelid = currentHash._appanelid;

				var keyValues = $.telligent.evolution.url.parseQuery(tabKey || '');
				if (keyValues.tab == null) {
					keyValues.tab = $.telligent.evolution.widgets.reporting.util.guid();
					newData._tab_key = $.telligent.evolution.url.serializeQuery(keyValues);
				}
				else {
					newData._tab_key = tabKey;
				}

				var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(newData._tab_key);

                if(tabData._drillReportId) {
					newData._drillReportId = tabData._drillReportId;
				}
				else {
					newData._drillReportId = null;
				}

                $.extend(newData, data);
                if (newData._drillReportId == null) {
                    delete newData._drillReportId;
                }

				url.hashData(newData, { overrideCurrent : true });
			},

			processCurrent: function() {
                var tabKey = url.hashData()._tab_key;
                if (tabKey == null)
                    return;

                var drillReportIds = url.hashData()._drillReportId !== undefined ? url.hashData()._drillReportId.split(',') : [];
				var drillReportId = drillReportIds.length > 0 ? drillReportIds[drillReportIds.length - 1] : '';

				var tabKeyChanged = tabKey && lastTabKey != tabKey;
                var drillReportChanged = (lastDrillReportId || drillReportId) && lastDrillReportId != drillReportId;

                var tabData = $.telligent.evolution.widgets.reporting.util.getTabData(tabKey);
                if (!tabData.defaultFilters && url.hashData()._filters) {
                    tabData.defaultFilters = url.hashData()._filters;
                    var filterValues = $.telligent.evolution.url.parseQuery(tabData.defaultFilters || '');
                    if (filterValues.selectedApplications != null) {
                        filterValues.selectedApplications = JSON.parse(filterValues.selectedApplications);
                    }
                    if (filterValues.selectedGroups != null) {
                        filterValues.selectedGroups = JSON.parse(filterValues.selectedGroups);
                    }
                    if (filterValues.selectedUsers != null) {
                        filterValues.selectedUsers = JSON.parse(filterValues.selectedUsers);
                    }
                    if (filterValues.selectedRoles != null) {
                        filterValues.selectedRoles =JSON.parse(filterValues.selectedRoles);
                    }

                    $.extend(tabData, filterValues);
                    $.telligent.evolution.widgets.reporting.util.updateTabData(tabKey, tabData);

                    var hashdata = url.hashData();
                    hashdata._filters = null;
                    delete hashdata._filters;
                    url.hashData(hashdata, { overrideCurrent : true });
                }

                if (tabKeyChanged && !drillReportChanged) {
                    lastTabKey = tabKey;
					options.onNavigate(tabKey, false);
				}
				else if (drillReportChanged) {
					lastTabKey = tabKey;
					lastDrillReportId = drillReportId;
                    options.onNavigate(tabKey, true);
				}

				return tabKey;
            },

            reset: function() {
                var tabKey = url.hashData()._tab_key;
                options.onNavigate(tabKey, true);
            },

			cleanup: function() {
				$(global).off('.ReportingRouter');
			}
		};
	};

	return ReportingRouter;

}, jQuery, window);