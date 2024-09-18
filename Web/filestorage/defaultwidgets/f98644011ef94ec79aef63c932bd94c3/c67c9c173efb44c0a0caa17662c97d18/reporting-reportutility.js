/*

ReportingReportUtility

API:
ReportingReportUtility.defaultStartDate: function()
ReportingReportUtility.defaultEndDate: function()
ReportingReportUtility.setFilterDates: function(context, value)
ReportingReportUtility.getFilterData: function(context)
ReportingReportUtility.getGraphData: function(context)
ReportingReportUtility.downloadCsv: function(response, filename)
ReportingReportUtility.updateSummaryHtml: function(container, url, data, fadeDuration)
ReportingReportUtility.handleGraphUpdateMessages: function(context, tabNameSpace)
ReportingReportUtility.subscribeToSortMessages: function(context, tabNameSpace, loadContentCallback)
ReportingReportUtility.subscribeToChartCsvExport: function(context, tabNameSpace, filename)
ReportingReportUtility.subscribeToChartImageExport: function(context, tabNameSpace, filename)
ReportingReportUtility.subscribeToListCsvExport: function(context, tabNameSpace)
ReportingReportUtility.subscribeToDateRangeFilterChange: function(context, tabNameSpace, refreshCallback)
ReportingReportUtility.subscribeToUserPickerFilterChange: function(context, tabNameSpace, refreshCallback)
ReportingReportUtility.subscribeToGroupPickerFilterChange: function(context, tabNameSpace, refreshCallback)
ReportingReportUtility.subscribeToDatePeriodFilterChange: function(context, tabNameSpace, refreshCallback)
ReportingReportUtility.subscribeToSingleGroupPickerFilterChange: function(context, tabNameSpace, refreshCallback)
ReportingReportUtility.subscribeToSingleApplicationPickerFilterChange: function(context, tabNameSpace, refreshCallback)
ReportingReportUtility.subscribeToSearchFlagsFilterChange: function(context, tabNameSpace, refreshCallback)
ReportingReportUtility.getStandardGraphOptions: function(context, seriesColor, title, yAxisTitle, data, resetFilterCallback, graphClickCallback)
ReportingReportUtility.getTileGraphOptions: function(context, seriesColor, yAxisTitle, queryData, graphData)
ReportingReportUtility.getMultiLineGraphOptions: function(context, title, yAxisTitle, graphClickCallback, resetFilterCallback, showSeriesCallback, hideSeriesCallback)
ReportingReportUtility.getMultiLineTileGraphOptions: function(context, title, yAxisTitle, setEnabledTypesCallback)
ReportingReportUtility.buildMultiLineSeriesData: function(context, options, data, colorFinderCallback)
*/
define('ReportingReportUtility', function($, global, undef) {

	var ReportingReportUtility = {
        defaultStartDate: function() {
            var today = moment().format("YYYY-MM-DD");
            var start = moment.utc(today).subtract(31, 'days');
            return $.telligent.evolution.formatDate(start);
        },
        defaultEndDate: function() {
            var today = moment().format("YYYY-MM-DD");
            var end = moment.utc(today);
            return $.telligent.evolution.formatDate(end);
        },
		setFilterDates: function(context, value) {
			var start, end;

			if  (context.filters.datePeriod == 'week') {
				start = moment.utc(value);
				end = moment.utc(value).add(6, 'days');
			}
			else if  (context.filters.datePeriod == 'month') {
				start = moment.utc(value);
				end = moment.utc(value).add(1, 'month').subtract(1, 'day');
			}
			else if  (context.filters.datePeriod == 'year') {
				start = moment.utc(value + '-01-01', 'YYYY-MM-DD');
				end = moment.utc(value + '-12-31', 'YYYY-MM-DD');
			}
			else {
				start = moment.utc(value);
				end = moment.utc(value);
			}

			var rangeStart = context.filters.startDate ? moment.utc(context.filters.startDate) : start;
			var rangeEnd = context.filters.endDate ? moment.utc(context.filters.endDate) : end;

			if(start < rangeStart) {
				start = rangeStart;
			}
			if(end > rangeEnd) {
				end = rangeEnd;
			}

			context.localFilters.filterStartDate = start.startOf('day').format('YYYY-MM-DD');
			context.localFilters.filterEndDate = end.endOf('day').format('YYYY-MM-DD');

			var text = context.resources.filter;
			if (start.format('MMMM D, YYYY') != end.format('MMMM D, YYYY') ) {
				text += start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY');
			}
			else {
				text += start.format('MMMM D, YYYY');
			}

			return text;
		},

		getFilterData: function(context) {
			var data = {};

			if (context.localFilters.filterStartDate !== undefined) {
				data.fr_startDate = context.localFilters.filterStartDate;
			}
			else {
				data.fr_startDate = context.filters.startDate;
			}

			if (context.localFilters.filterEndDate !== undefined) {
				data.fr_endDate = context.localFilters.filterEndDate;
			}
			else {
				data.fr_endDate = context.filters.endDate;
			}

			if (context.filters.includeUsers !== undefined) {
				data.fr_includeUsers = context.filters.includeUsers;
			}
			if (context.filters.includeRoles !== undefined) {
				data.fr_includeRoles = context.filters.includeRoles;
			}
			if (context.filters.includeGroups !== undefined) {
				data.fr_includeGroups = context.filters.includeGroups;
			}
			if (context.filters.includeSubGroups !== undefined) {
				data.fr_includeSubGroups = context.filters.includeSubGroups;
			}
			if (context.filters.includeApplications !== undefined) {
				data.fr_includeApplications = context.filters.includeApplications;
			}
			if (context.filters.includeApplicationTypes !== undefined) {
				data.fr_includeApplicationTypes = context.filters.includeApplicationTypes;
			}
			if (context.filters.includeAnonymous !== undefined) {
				data.fr_includeAnonymous = context.filters.includeAnonymous;
			}

			if (context.filters.selectedUsers) {
				data.fr_selectedUsers = context.filters.selectedUsers.map(function(item) { return item.id; }).join();
			}
			if (context.filters.selectedRoles) {
				data.fr_selectedRoles = context.filters.selectedRoles.map(function(item) { return item.id; }).join();
			}

			if (context.filters.selectedGroups) {
				data.fr_selectedGroups = context.filters.selectedGroups.map(function(item) { return item.id; }).join();
			}
			if (context.filters.selectedApplications) {
				data.fr_selectedApplications = context.filters.selectedApplications.map(function(item) { return item.id; }).join();
			}
			if (context.filters.selectedApplicationTypes) {
				data.fr_selectedApplicationTypes = context.filters.selectedApplicationTypes.map(function(item) { return item.id; }).join();
			}			

            if (context.filters.selectedContent) {
				data.fr_selectedContent = context.filters.selectedContent.map(function(item) { return item.id; }).join();
			}

			if (context.localFilters.filterContentType !== undefined) {
				data.fr_contentTypes = context.localFilters.filterContentType;
			}
			else if (context.contentTypes !== undefined) {
				data.fr_contentTypes = context.contentTypes.join(',');
			}

			if (context.localFilters.filterActivityType !== undefined) {
				data.fr_activityTypes = context.localFilters.filterActivityType;
			}
			else if (context.activityTypes !== undefined) {
				data.fr_activityTypes = context.activityTypes.join(',');
            }

            if (context.localFilters.filterParticipationType !== undefined) {
				data.fr_participationTypes = context.localFilters.filterParticipationType;
			}
			else if (context.participationTypes !== undefined) {
				data.fr_participationTypes = context.participationTypes.join(',');
			}

			if (context.localFilters.sortBy) {
				data.sortBy = context.localFilters.sortBy;
			}

			if (context.localFilters.sortOrder) {
				data.sortOrder = context.localFilters.sortOrder;
            }

            if (context.filters.selectedSearchFlags) {
                data.fr_selectedSearchFlags = context.filters.selectedSearchFlags;
            }

			return data;
		},

		getGraphData: function(context) {
			var data = {};
			data.fr_startDate = context.filters.startDate;
			data.fr_endDate = context.filters.endDate;
			data.fr_datePeriod = context.filters.datePeriod;

			if (context.filters.includeUsers) {
				data.fr_includeUsers = (context.filters.includeUsers == 'exclude' ? 'exclude' : 'include');
			}
			if (context.filters.selectedUsers) {
				data.fr_selectedUsers = context.filters.selectedUsers.map(function(item) { return item.id; }).join();
			}

			if (context.filters.includeRoles) {
				data.fr_includeRoles = (context.filters.includeRoles == 'exclude' ? 'exclude' : 'include');
			}
			if (context.filters.selectedRoles) {
				data.fr_selectedRoles = context.filters.selectedRoles.map(function(item) { return item.id; }).join();
			}

			if (context.filters.includeAnonymous !== undefined) {
				data.fr_includeAnonymous = context.filters.includeAnonymous;
			}

			if (context.filters.includeGroups) {
				data.fr_includeGroups = context.filters.includeGroups;
			}

			if (context.filters.includeSubGroups !== undefined) {
				data.fr_includeSubGroups = context.filters.includeSubGroups;
			}

			if (data.fr_includeGroups == 'include' || data.fr_includeGroups == 'exclude' && context.filters.selectedGroups) {
				data.fr_selectedGroups = context.filters.selectedGroups.map(function(item) { return item.id; }).join();
			}
			else{
				data.fr_selectedGroups = [];
			}

			if (context.filters.includeApplications) {
				data.fr_includeApplications = context.filters.includeApplications;
			}

			if (data.fr_includeApplications == 'include' || data.fr_includeApplications == 'exclude' && context.filters.selectedApplications) {
				data.fr_selectedApplications = context.filters.selectedApplications.map(function(item) { return item.id; }).join();
			}
			else {
				data.fr_selectedApplications = [];
			}

			if (context.filters.includeApplicationTypes) {
				data.fr_includeApplicationTypes = context.filters.includeApplicationTypes;
			}

			if (data.fr_includeApplicationTypes == 'include' || data.fr_includeApplicationTypes == 'exclude' && context.filters.selectedApplicationTypes) {
				data.fr_selectedApplicationTypes = context.filters.selectedApplicationTypes.map(function(item) { return item.id; }).join();
			}
			else {
				data.fr_selectedApplicationTypes = [];
            }			

            if (context.filters.selectedContent) {
				data.fr_selectedContent = context.filters.selectedContent.map(function(item) { return item.id; }).join();
			}

			return data;
		},

		downloadCsv: function(response, filename) {
			var a = document.createElement('a');
			var mimeType = 'text/csv';
			var fileName = filename;

			if (navigator.msSaveBlob) { // IE10
				return navigator.msSaveBlob(new Blob([response], { type: mimeType }), fileName);
			} else if ('download' in a) { //html5 A[download]
				a.href = 'data:' + mimeType + ',' + encodeURIComponent(response);
				a.setAttribute('download', fileName);
				document.body.appendChild(a);
				setTimeout(function() {
					a.click();
					document.body.removeChild(a);
				}, 66);
				return true;
			} else { //do iframe dataURL download (old ch+FF):
				var f = document.createElement('iframe');
				document.body.appendChild(f);
				f.src = 'data:' + mimeType + ',' + encodeURIComponent(response);
				setTimeout(function() {
					document.body.removeChild(f);
				}, 333);
				return true;
			}
		},

		updateSummaryHtml: function(context, container, url, data, showErrorCallback, hideErrorCallback) {
			var fadeDuration = 400;

			container.fadeTo(fadeDuration, 0.25, function () {
				$.telligent.evolution.post({
					url: url,
					data: data,
					dataType: 'html',
					success: function (response) {
                        var summary = $(response);
                        var error = summary.find('.error');
                        if(error.length > 0) {
                            showErrorCallback(context, error.html());
                        }
                        else {
                            container.html(summary.html());
                            container.fadeTo(fadeDuration, 1);
                            hideErrorCallback(context);
                        }
					}
				});
			});
		},

		handleGraphUpdateMessages: function(context, tabNameSpace) {
			$.telligent.evolution.messaging.subscribe('reporting.graph.update', tabNameSpace, function(data){
				var type = $(data.target).data('type');
				context.localFilters.chartType = type;
                var chart = context.sparkline.highcharts();
                chart.update({
                    chart: {
                        type: type,
                    }
                });

                $(data.target).closest('ul').find('a.selected').removeClass('selected');
                $(data.target).addClass('selected');
			});
		},

		subscribeToSortMessages: function(context, tabNameSpace, loadContentCallback) {
			$.telligent.evolution.messaging.subscribe('reporting.table.sort', tabNameSpace, function(data){
				var sortBy = $(data.target).data('sort');
				var defaultSortOrder = $(data.target).data('defaultsortorder');
				if (sortBy.length > 0) {
					if (sortBy == context.localFilters.sortBy) {
						if (context.localFilters.sortOrder == 'ascending') {
							context.localFilters.sortOrder = 'descending';
						}
						else if (context.localFilters.sortOrder == 'descending') {
							context.localFilters.sortOrder = 'ascending';
						}
						else {
							context.localFilters.sortOrder = defaultSortOrder;
						}
					}
					else {
						context.localFilters.sortBy = sortBy;
						context.localFilters.sortOrder = defaultSortOrder;
					}

					context.localFilters.pageIndex = 1;
					loadContentCallback(context);
				}
			});
		},

		subscribeToChartCsvExport: function(context, tabNameSpace, filename) {
			$.telligent.evolution.messaging.subscribe('reporting.export.chart.csv', tabNameSpace, function(data){
				var filterData = $.telligent.evolution.widgets.reporting.reportutil.getFilterData(context);

				$.telligent.evolution.post({ timeout: 90000,
					url: context.urls.csvComments,
					data: filterData,
				})
				.then(function (response) {
					var csv = response + context.sparkline.highcharts().getCSV();
					$.telligent.evolution.widgets.reporting.reportutil.downloadCsv(csv, filename + '.csv');
				});
			});
		},

		subscribeToChartImageExport: function(context, tabNameSpace, filename) {
			$.telligent.evolution.messaging.subscribe('reporting.export.chart.png', tabNameSpace, function(data){
				context.sparkline.highcharts().exportChartLocal({
					type: 'image/png',
					filename: filename
				});
			});
		},

		subscribeToListCsvExport: function(context, tabNameSpace) {
			$.telligent.evolution.messaging.subscribe('reporting.export.list.csv', tabNameSpace, function(data){
				var filterData = $.telligent.evolution.widgets.reporting.reportutil.getFilterData(context);

				// if instructed to, first store filters in temp storage via POST
				if ($(data.target).data('filters') == 'store') {
					$.telligent.evolution.post({ timeout: 90000,
						url: context.urls.export,
						data: filterData
					})
					.then(function (response) {
						window.location = $.telligent.evolution.url.modify({
							url: context.urls.export,
							query: {
								_temp_filter_key: response.key
							}
						});
					});
				} else {
					window.location = $.telligent.evolution.url.modify({
						url: context.urls.export,
						query: filterData
					});
				}
			});
		},

		subscribeToDateRangeFilterChange: function(context, tabNameSpace, refreshCallback) {
			$.telligent.evolution.messaging.subscribe('reporting.filter.daterange.modified', tabNameSpace, function(data){
				if (data.startDate && data.endDate) {
					if(!context.filters) {
						context.filters = {};
					}

					context.filters.startDate = data.startDate;
					context.filters.endDate = data.endDate;

					if (data.datePeriod) {
						context.filters.datePeriod = data.datePeriod;
					}

                    refreshCallback(context);
				}
			});
		},

		subscribeToUserPickerFilterChange: function(context, tabNameSpace, refreshCallback) {
			$.telligent.evolution.messaging.subscribe('reporting.filter.userrolepicker.modified', tabNameSpace, function(data){
				if(!context.filters) {
					context.filters = {};
				}

				context.filters.includeRoles = data.includeRoles;
				context.filters.includeUsers = data.includeUsers;
				context.filters.selectedRoles = data.selectedRoles;
				context.filters.selectedUsers = data.selectedUsers;
				context.filters.includeAnonymous = data.includeAnonymous;

				refreshCallback(context);
			});
		},

		subscribeToGroupPickerFilterChange: function(context, tabNameSpace, refreshCallback) {
			$.telligent.evolution.messaging.subscribe('reporting.filter.grouppicker.modified', tabNameSpace, function(data){
				if(!context.filters) {
					context.filters = {};
				}

				context.filters.includeGroups = data.includeGroups;
				context.filters.includeApplications = data.includeApplications;
				context.filters.includeApplicationTypes = data.includeApplicationTypes;
				context.filters.includeSubGroups = data.includeSubGroups;
				context.filters.selectedGroups = data.selectedGroups;
				context.filters.selectedApplications = data.selectedApplications;
				context.filters.selectedApplicationTypes = data.selectedApplicationTypes;

				refreshCallback(context);
			});
		},

		subscribeToDatePeriodFilterChange: function(context, tabNameSpace, refreshCallback) {
			$.telligent.evolution.messaging.subscribe('reporting.filter.dateperiod.modified', tabNameSpace, function(data){
				if (data.datePeriod) {
					if(!context.filters) {
						context.filters = {};
					}

					context.filters.datePeriod = data.datePeriod;

					refreshCallback(context);
				}
			});
		},

		subscribeToSingleGroupPickerFilterChange: function(context, tabNameSpace, refreshCallback) {
			$.telligent.evolution.messaging.subscribe('reporting.filter.singlegrouppicker.modified', tabNameSpace, function(data){
				if(!context.filters) {
					context.filters = {};
				}

				context.filters.selectedGroups = data.selectedGroups;
				context.filters.includeGroups = data.includeGroups;

				refreshCallback(context);
			});
		},

		subscribeToSingleApplicationPickerFilterChange: function(context, tabNameSpace, refreshCallback) {
			$.telligent.evolution.messaging.subscribe('reporting.filter.singleapplicationpicker.modified', tabNameSpace, function(data){
				if(!context.filters) {
					context.filters = {};
				}

				context.filters.selectedApplications = data.selectedApplications;
				context.filters.includeApplications = data.includeApplications;

				refreshCallback(context);
			});
        },

		subscribeToSearchFlagsFilterChange: function(context, tabNameSpace, refreshCallback) {
			$.telligent.evolution.messaging.subscribe('reporting.filter.searchflags.modified', tabNameSpace, function(data){
                if (data.selectedSearchFlags != null) {
					if(!context.filters) {
						context.filters = {};
					}

					context.filters.selectedSearchFlags = data.selectedSearchFlags;

					refreshCallback(context);
				}
			});
		},

		getStandardGraphOptions: function(context, seriesColor, title, yAxisTitle, data, resetFilterCallback, graphClickCallback) {
			var options = {
				chart:{
					type: 'area',
					margin: [50, 25, 75, 55],
					height: 500,
					style: {
						overflow: 'visible'
					}
				},
				exporting: {
					enabled: false,
					csv: {
						dateFormat: '%Y-%m-%d'
					},
					fallbackToExportServer: false,
					sourceWidth: 960,
					sourceHeight: 540,
					chartOptions: {
                        chart: {
                            margin: [50, 50, 50, 100]
                        },
						title: {
							text: title
						}
					}
				},
				credits: { enabled: false },
				title: { text: '' },
				subtitle: { text: '' },
				plotOptions: {
					series: {
						color: seriesColor,
						allowPointSelect: true,
                        lineWidth:3,
						fillOpacity: 0.25,
						cursor: 'pointer',
                        point: {
							events: {
								select: function () {
									graphClickCallback(context, this.x);
								},
								unselect: function () {
                                    var p = this.series.chart.getSelectedPoints();
                                    if (p.length == 0) {
                                        resetFilterCallback(context, false);
                                    }
								},
							}
						}
					},
					area: {
						marker: {
							symbol: 'circle',
							radius: 1,
							states: { normal: { enabled: false },
								hover: { enabled: true, radius: 5 },
								select: { enabled: true, radius: 5 }
							}
                        },
                        states: {
                            hover: { lineWidthPlus: 2 },
                        }
					}
				},
				yAxis: {
					min: 0,
					allowDecimals: false,
					title: {
						text: yAxisTitle
					}
				},
				legend: {
					enabled: false
				},
				tooltip: {
					pointFormat: '<b>{point.y:,.0f}</b>'
				},
				data: {
					csv: data,
				}
			};

			var xAxis = {};
			if(context.filters.datePeriod == 'year') {
				xAxis =  {
					allowDecimals: false,
				 };
			}
			else {
				xAxis =  {
					type: 'datetime',
					dateTimeLabelFormats: {
						day: '%b. %e',
						week: '%b. %e',
						month: '%b. %Y',
					}
				};
			}

			options.xAxis = xAxis;

			return options;
		},

		getTileGraphOptions: function(context, seriesColor, yAxisTitle, queryData, graphData) {
			var xAxis = {};
			var yAxis = {};
			var chart = {};

			if(context.target == 'large-tile') {
				chart = {
					type: 'area',
					margin: [40, 10, 10, 45],
					height: 425,
					style: {
						overflow: 'visible'
					}
				};

				yAxis = {
					min: 0,
					allowDecimals: false,
					title: {
						text: yAxisTitle
					}
				};

				if(queryData.datePeriod == 'year') {
					xAxis =  {
						allowDecimals: false,
					};
				}
				else {
					xAxis =  { type: 'datetime',
					dateTimeLabelFormats: {
						day: '%b. %e',
						week: '%b. %e',
						month: '%b. %Y',
						}
					};
				}
			}
			else {
				xAxis = {
					labels: {
						enabled: false
					},
					title: {
						text: null
					},
					startOnTick: false,
					endOnTick: false,
					tickPositions: []
				};

				chart = {
					type: 'area',
					margin: [0, 0, 0, 0],
					height: 120,
					style: {
						overflow: 'visible'
					}
				};

				yAxis = {
					endOnTick: false,
					startOnTick: false,
					labels: {
						enabled: false
					},
					title: {
						text: null
					},
					tickPositions: [0]
				};
			}

			var options = {
				chart: chart,
				exporting: {
					enabled: false
				},
				credits: { enabled: false },
				title: { text: '' },
				subtitle: { text: '' },
				xAxis: xAxis,
				yAxis: yAxis,
				legend: {
					enabled:false
				},
				tooltip: {
					pointFormat: '<b>{point.y:,.0f}</b>'
				},
				plotOptions: {
					series: {
						color: seriesColor,
                        lineWidth:3,
						fillOpacity: 0.25,
                    },
					area: {
						marker: {
							symbol: 'circle',
							radius: 1,
							states: { normal: { enabled: false },
								hover: { enabled: true, radius: 5 },
								select: { enabled: true, radius: 5 }
							}
                        },
                        states: {
                            hover: { lineWidthPlus: 2 },
                        }
					}
				},
				data: {
					csv: stringdata,
				}
			};

			return options;
		},

		getMultiLineGraphOptions: function(context, title, yAxisTitle, graphClickCallback, resetFilterCallback, showSeriesCallback, hideSeriesCallback) {
			var options = this.getBaseMultiLineGraphOptions(context, title, yAxisTitle);

			options.chart.margin = [50, 60, 125, 60];
			options.chart.height = 625;

			options.plotOptions.series = {
				allowPointSelect: true,
				cursor: 'pointer',
				point: {
					events: {
						select: function () {
							graphClickCallback(context, this.category, this.series.userOptions.id, this.series.name);
						},
						unselect: function () {
                            var p = this.series.chart.getSelectedPoints();
                            if (p.length == 0) {
                                resetFilterCallback(context, false);
                            }
						},
					}
				},
				events: {
                    legendItemClick: function() {
                        if (this.visible) {
                            var ctr = 0;
                            $(this.chart.series).each(function(i,series) {
                                if (series.visible) {
                                    ctr++;
                                }
                            });

                            if (ctr <= 1) {
                                return false;
                            }
                        }
                    },
					hide: function() {
						hideSeriesCallback(context);
					},
					show: function() {
						showSeriesCallback(context);
					}
				},
				label: {
					connectorAllowed: false
				}
			};

			return options;
		},

		getMultiLineTileGraphOptions: function(context, title, yAxisTitle, setEnabledTypesCallback){
			var options = this.getBaseMultiLineGraphOptions(context, title, yAxisTitle);

			options.chart.margin = [25, 0, 100, 55];
			options.chart.height = 400;

			options.plotOptions.series = {
				allowPointSelect: false,
				series: {
					events: {
						hide: function() {
							setEnabledTypesCallback(context);
						},
						show: function() {
							setEnabledTypesCallback(context);
						}
					}
				},
				label: {
					connectorAllowed: false
				}
			};

			return options;
		},

		getBaseMultiLineGraphOptions: function(context, title, yAxisTitle) {
			var options = {
				chart: {
					type: context.localFilters.chartType,
					style: {
						overflow: 'visible',
						fontFamily: '\'Helvetica Neueue\', Helvetica, Arial, sans-serif'
					}
				},
				exporting: {
					enabled: false,
					csv: {
						dateFormat: '%Y-%m-%d'
					},
					fallbackToExportServer: false,
					sourceWidth: 960,
					sourceHeight: 540,
					chartOptions: {
						title: {
							text: title
						},
						legend: {
							maxHeight: 500
						}
					}
				},
				credits: { enabled: false },
				title: { text: '' },
				subtitle: { text: '' },
				xAxis: { },
				yAxis: {
					min: 0,
					allowDecimals: false,
					title: {
						text: yAxisTitle
					},
					stackLabels: {
						enabled: true,
						formatter: function(){
							return this.total > 0 ? this.total : '';
						},
					}
				},
				legend: {
					align: 'center',
					verticalAlign: 'bottom',
                    layout: 'horizontal',
					maxHeight: 85,
					floating: false,
					itemStyle: {
						fontWeight: 'normal'
                    },
                    itemHoverStyle: {
                        color: '#3498db'
                    },
					labelFormatter: function() {
						var total = 0;
						for(var i=this.yData.length; i--;) {
							total += this.yData[i];
						}
						return this.name + ' <span class="total">(' + total + ')</span>';
					}
				},
				series: [],
				plotOptions: {
                    series: {
                    },
					column: {
						stacking: 'normal'
					},
					line: {
						marker: {
							symbol: 'circle',
							radius: 1,
							states: {
								normal: { enabled: false },
								hover: { enabled: true, radius: 5 },
								select: { enabled: true, radius: 5 }
							}
                        },
                        states: {
                            hover: { lineWidthPlus: 2 },
                        }
					}
				},
				data: {
					dateFormat: 'YYYY/mm/dd',
				}
			};

			return options;

		},

		buildMultiLineSeriesData: function(context, options, data, colorFinderCallback) {

			var lines = data.split('\n');
			var startDateString = '';

			if (context.filters.datePeriod == 'year')
				options.xAxis.categories = [];

			$.each(lines, function(lineNo, line) {
				if (line.length > 0) {
					var items = line.split(',');

					if (lineNo == 0) {
						$.each(items, function(itemNo, item) {
							if (itemNo == 2) {
								startDateString = item.replace(/"/g,"");
							}
							if (context.filters.datePeriod == 'year' && itemNo > 1) options.xAxis.categories.push(item.replace(/"/g,""));
						});
					}
					else {
						var series = {
							data: []
						};
						var hasNonZeroData = false;
						$.each(items, function(itemNo, item) {
							if (itemNo == 0) {
								series.id = item.replace(/"/g,"");
							} else if (itemNo == 1) {
								series.name = item.replace(/"/g,"");
							} else {
								var value = parseFloat(item);
								if (hasNonZeroData == false && value > 0) {
									hasNonZeroData = true;
								}
								series.data.push(value);
							}
						});

						if (hasNonZeroData) {
							var color = colorFinderCallback(series.id);
							if (color) {
								series.color = color;
							}

							options.series.push(series);
						}
					}
				}
			});

			if(context.filters.datePeriod == 'year') {
				options.xAxis.allowDecimals = false;
			} else {
				options.xAxis.type = 'datetime';
				options.xAxis.dateTimeLabelFormats = {
					day: '%b. %e',
					week: '%b. %e',
					month: '%b. %Y',
				};

				if(context.filters.datePeriod == 'month') {
					options.plotOptions.series.pointStart = moment.utc(startDateString, "YYYY/MM/DD").valueOf();
					options.plotOptions.series.pointIntervalUnit = 'month';
				}
				else if(context.filters.datePeriod == 'week') {
					options.plotOptions.series.pointStart = moment.utc(startDateString, "YYYY/MM/DD").valueOf();
					options.plotOptions.series.pointInterval = 24 * 3600 * 1000 * 7;
				}
				else {
					options.plotOptions.series.pointStart = moment.utc(startDateString, "YYYY/MM/DD").valueOf();
					options.plotOptions.series.pointIntervalUnit = 'day';
				}
			}
		}
	};

	return ReportingReportUtility;

}, jQuery, window);
