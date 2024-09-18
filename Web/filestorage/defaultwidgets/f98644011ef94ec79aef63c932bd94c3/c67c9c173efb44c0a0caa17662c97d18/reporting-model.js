/*
ReportingModel

API:

listReports()
getReport(id)
loadReport(key, id, parentId, drillReportIds);

*/
define('ReportingModel', function($, global, undef) {

	var ReportingModel = function(context){

		return {
			listReports: function() {
				return $.telligent.evolution.post({
					url: context.urls.listReports,
					dataType: 'json'
				});
			},

			getReport: function(id) {
				return $.telligent.evolution.get({
					url: context.urls.getReport,
					data: {
						w_reportid : id
					}
				}).promise();
			},

			loadReport: function(key, id, parentId, drillReportIds) {
                var tabNameSpace = $.telligent.evolution.administration.studioShell.tabNameSpace(key);
                $.telligent.evolution.messaging.unsubscribe(tabNameSpace[tabNameSpace.length - 1]);

                parentId = typeof parentId !== 'undefined' ? parentId : null;
				return $.telligent.evolution.get({
					url: context.urls.loadReport,
					data: {
						w_tabkey: key,
						w_reportid: id,
                        w_parentid: parentId,
                        w_drillReportIds: drillReportIds.join()
					},
					async: false
				});
			}
		};
	};

	return ReportingModel;

}, jQuery, window);