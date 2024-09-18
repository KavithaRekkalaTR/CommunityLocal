(function($, global) {

	function startMonitoring(options) {
		options.isMonitoring = true;
		$.telligent.evolution.sockets.cachemonitor.send('start', {});

		if (options.waitNotificationId) {
		    $.telligent.evolution.notifications.hide(options.waitNotificationId);
		    options.waitNotificationId = null;
		}

        options.waitNotificationId = $.telligent.evolution.notifications.show(options.text.collectingData, {
            duration: 20000,
            type: 'information'
        });
	}

	function updateWaitNotification(options) {
	    global.clearTimeout(options.waitNotificationUpdateHandle);
	    if (options.waitNotificationId) {
	        var seconds = Math.round((options.nextTick.getTime() - (new Date()).getTime() + 5000) / 1000);
	        $.telligent.evolution.notifications.show(options.text.collectingDataWithTime.replace(/\{seconds\}/g, seconds), {
    	        id: options.waitNotificationId,
                duration: 20000,
                type: 'information'
            });

            if (seconds > 1) {
        	    global.setTimeout(function() {
	                updateWaitNotification(options);
	            }, 1000);
            }
	    }
	}

	function formatNumber(options, value) {
	    return Highcharts.numberFormat(value, 0);
	}

	function processTickData(options) {
	    global.clearTimeout(options.processTickDataHandle);
	    if (!options.isMonitoring) {
	        return;
	    }

	    var timeStamp = options.nextTick.getTime();

	    var pendingData;
	    var combinedData = {
	        TotalHits: 0,
	        TotalMisses: 0,
	        TotalItems: 0,
	        TotalMemoryMB: 0,
	        MaximumMemoryMB: 0,
	        TopMisses: [],
	        TopHits: [],
	        TotalNodes: 0
	    }
	    var combinedHosts = {}, i, minTimeStamp = timeStamp - 10000;

	    for (i = 0; i < options.pendingData.length; i++) {
	        pendingData = options.pendingData[i];
	        if (pendingData.TimeStamp < minTimeStamp) {
	            // not applicable or stale, remove it
	            options.pendingData.splice(i, 1);
	            i--;
	        } else if (pendingData.TimeStamp < timeStamp) {
	            options.lastDataByHost[pendingData.HostName] = pendingData;
	            if (!options.excludedHosts[pendingData.HostName] && !combinedHosts[pendingData.HostName]) {
    	            combinedData.TotalHits += pendingData.TotalHits;
    	            combinedData.TotalMisses += pendingData.TotalMisses;
    	            combinedData.TotalItems += pendingData.TotalItems;
    	            combinedData.TotalMemoryMB += pendingData.TotalMemoryMB;
    	            combinedData.MaximumMemoryMB += pendingData.MaximumMemoryMB;
    	            combinedData.TopMisses = combinedData.TopMisses.concat(pendingData.TopMisses);
    	            combinedData.TopHits = combinedData.TopHits.concat(pendingData.TopHits);
    	            combinedData.TotalNodes++;

    	            combinedHosts[pendingData.HostName] = true;
    	        }

	            options.pendingData.splice(i, 1);
	            i--;
	        }

	        if (!options.allHosts[pendingData.HostName]) {
	            options.allHosts[pendingData.HostName] = true;
	            options.hosts.push({
	                Name: pendingData.HostName,
	                MemorySeriesIndex: -1
	            });
	        }
	    }

	    $.each(options.hosts, function(i, host) {
	       if (!options.excludedHosts[host.Name] && !combinedHosts[host.Name]) {
                var lastHostData = options.lastDataByHost[host.Name];
                if (lastHostData) {
                    combinedData.TotalItems += lastHostData.TotalItems;
                    combinedData.TotalMemoryMB += lastHostData.TotalMemoryMB;
                    combinedData.MaximumMemoryMB += lastHostData.MaximumMemoryMB;
                    combinedData.TotalNodes++;
                }
	       }
	    });

	    options.nextTick = new Date(timeStamp + 10000);
	    options.hosts.sort(function(a, b) { return a.Name.localeCompare(b.Name); });
	    updateUi(options, timeStamp, combinedData);

		options.processTickDataHandle = global.setTimeout(function() {
		    processTickData(options);
		}, options.nextTick.getTime() - (new Date()).getTime() + 5000);
	}

	function stopMonitoring(options) {
		options.isMonitoring = false;
		$.telligent.evolution.sockets.cachemonitor.send('stop', {});
	}

	function receiveMonitoringData(options) {
		$.telligent.evolution.sockets.cachemonitor.on('cachemonitoring.updated', function(data) {
			if (!options.isMonitoring) {
				return;
			}

			// reset timestamp to received time
			data.TimeStamp = (new Date()).getTime();
            options.pendingData.push(data);
		});
	}

	function updateUi(options, timeStamp, data) {

	    if (options.waitNotificationId) {
	        options.inputs.instructionsWrapper.hide();
	        options.inputs.reportsWrapper.show();
	        $.telligent.evolution.notifications.hide(options.waitNotificationId);
	        options.waitNotificationId = null;
	    }

		options.inputs.hitsMissesChart.series[0].addPoint([timeStamp, data.TotalHits], true, options.inputs.hitsMissesChart.series[0].points.length >= 60);
		options.inputs.hitsMissesChart.series[1].addPoint([timeStamp, data.TotalMisses], true, options.inputs.hitsMissesChart.series[1].points.length >= 60);
		options.inputs.hitsMissesChart.series[2].addPoint([timeStamp, data.TotalItems], true, options.inputs.hitsMissesChart.series[2].points.length >= 60);

		$.each(options.hosts, function(i, host) {
		    var totalMemoryMB = 0;
            var lastData = options.lastDataByHost[host.Name];
            if (lastData)
                totalMemoryMB = lastData.TotalMemoryMB;

            if (host.MemorySeriesIndex < 0) {
                host.MemorySeriesIndex = options.inputs.memoryChart.series.length;
                options.inputs.memoryChart.addSeries({
                    name: options.text.seriesCurrentMB.replace(/\{host\}/g, host.Name),
                    marker: {
                        enabled: false
                    }
                });
            }

            options.inputs.memoryChart.series[host.MemorySeriesIndex].addPoint([timeStamp, totalMemoryMB], true, options.inputs.memoryChart.series[host.MemorySeriesIndex].points.length >= 60);
        });

        options.inputs.memoryChart.series[0].addPoint([timeStamp, data.MaximumMemoryMB / options.hosts.length], true, options.inputs.memoryChart.series[0].points.length >= 60);

        options.inputs.hitsMissesHeader.html(options.templates.hitsMissesHeader({
            TotalHits: formatNumber(options, data.TotalHits),
            TotalMisses: formatNumber(options, data.TotalMisses),
            TotalItems: formatNumber(options, data.TotalItems)
        }));

        options.inputs.memoryHeader.html(options.templates.memoryHeader({
            TotalMemoryMB: formatNumber(options, data.TotalMemoryMB / options.hosts.length),
            MaximumMemoryMB: formatNumber(options, data.MaximumMemoryMB / options.hosts.length)
        }));

        options.inputs.hosts.empty();
        $.each(options.hosts, function(i, host) {
            var data = $.extend({}, {
                HostName: host.Name,
                TotalHits: 0,
    	        TotalMisses: 0,
    	        TotalItems: 0,
    	        TotalMemoryMB: 0,
    	        MaximumMemoryMB: 0,
    	        IncludedInReports: options.excludedHosts[host.Name] ? false : true
            }, options.lastDataByHost[host.Name] || {});

            data.TotalHits = formatNumber(options, data.TotalHits);
            data.TotalMisses = formatNumber(options, data.TotalMisses);
            data.TotalItems = formatNumber(options, data.TotalItems);
            data.TotalMemoryMB = formatNumber(options, data.TotalMemoryMB);
            data.MaximumMemoryMB = formatNumber(options, data.MaximumMemoryMB);

           options.inputs.hosts.append(options.templates.host(data));
        });

        if (data.TopMisses) {
            var missesToRemove = null;
            if (options.topMisses.length > 60) {
                missesToRemove = options.topMisses[0];
                options.topMisses = options.topMisses.slice(1);
            }
            options.topMisses.push(data.TopMisses);
            updateTopSummary(options, options.topMissesSummary, options.inputs.topMisses, options.templates.topMiss, missesToRemove, data.TopMisses);
        }

        if (data.TopHits) {
            var hitsToRemove = null;
            if (options.topHits.length > 60) {
                hitsToRemove = options.topHits[0];
                options.topHits = options.topHits.slice(1);
            }
            options.topHits.push(data.TopHits);
            updateTopSummary(options, options.topHitsSummary, options.inputs.topHits, options.templates.topHit, hitsToRemove, data.TopHits);
        }
	}

	function resetReports(options) {
	    var nowTime = (new Date()).getTime(), timeStamp, i;

	    options.topMisses = [];
		options.topMissesSummary = {};
		options.topHits = [];
		options.topHitsSummary = {};
		options.pendingData = [];

		for (i = 0; i < options.inputs.hitsMissesChart.series.length; i++) {
		    $.each(options.inputs.hitsMissesChart.series[i].points, function(j, point) {
		       point.y = 0;
		    });
		    options.inputs.hitsMissesChart.series[i].addPoint([nowTime, 0], true, true);
		    options.inputs.hitsMissesChart.series[i].drawGraph();
		}
		options.inputs.hitsMissesChart.redraw();

        for (i = options.inputs.memoryChart.series.length - 1; i >= 1; i--) {
            options.inputs.memoryChart.series[i].remove(true);
		}

		$.each(options.hosts, function(i, host) {
		    host.MemorySeriesIndex = -1;
		});

	    $.each(options.inputs.memoryChart.series[0].points, function(j, point) {
	       point.y = 0;
	    });
	    options.inputs.memoryChart.series[0].addPoint([nowTime, 0], true, true);
	    options.inputs.memoryChart.series[0].drawGraph();

		options.inputs.memoryChart.redraw();

		options.inputs.topHits.empty();
		options.inputs.topMisses.empty();
	}

	function updateTopSummary(options, cacheActions, listWrapper, renderTemplate, toRemove, toAdd) {
	    var count;

	    if (toRemove != null) {
	        $.each(toRemove, function(j, cacheAction) {
	            var detail = cacheActions[cacheAction.Key] || { Count: 0, Scope: cacheAction.Scope || [] };
	            detail.Count -= cacheAction.Count;
	            if (detail.Count <= 0) {
	                delete cacheActions[cacheAction.Key];
	            }
	        });
	    }

	    if (toAdd != null) {
	        $.each(toAdd, function(j, cacheAction) {
                var detail = cacheActions[cacheAction.Key];
                if (!detail) {
                    detail = cacheActions[cacheAction.Key] = { Count: 0, Scope: cacheAction.Scope || [] };
                }
                detail.Count += cacheAction.Count;
	        });
	    }

	    var keys = [];
	    $.each(cacheActions, function(key, val) {
	        keys.push(key);
	    });

	    keys.sort(function(k1, k2) {
	       return cacheActions[k2].Count - cacheActions[k1].Count;
	    });

	    listWrapper.empty();

	    if (keys.length > 50) {
	        keys = keys.slice(0, 50);
	    }

	    var max = 0;
	    if (keys.length > 0) {
	        max = cacheActions[keys[0]].Count;
	    }

	    $.each(keys, function(i, key) {
	        percent = 0;
	        if (max > 0) {
	            percent = (cacheActions[key].Count / max) * 100;
	        }
	        listWrapper.append(renderTemplate({
	            Percent: percent,
	            Key: key,
	            Count: formatNumber(options, cacheActions[key].Count),
	            Scope: cacheActions[key].Scope
	        }));
	    });
	}

	var api = {
		register: function(options) {
			$.telligent.evolution.administration.header($.telligent.evolution.template.compile(options.templates.header)());
            var header = $.telligent.evolution.administration.header();

            header.find('.button.connecting').on('click', function() {
        		return false;
        	});

        	header.find('.button.start').on('click', function() {
				startMonitoring(options);
				return false;
			}).hide();

            header.find('.button.stop').on('click', function() {
				stopMonitoring(options);
				return false;
			}).hide();

			options.templates.hitsMissesHeader = $.telligent.evolution.template.compile(options.templates.hitsMissesHeader);
			options.templates.memoryHeader = $.telligent.evolution.template.compile(options.templates.memoryHeader);
			options.templates.topMiss = $.telligent.evolution.template.compile(options.templates.topMiss);
			options.templates.topHit = $.telligent.evolution.template.compile(options.templates.topHit);
			options.templates.host = $.telligent.evolution.template.compile(options.templates.host);
			options.topMisses = [];
			options.topMissesSummary = {};
			options.topHits = [];
			options.topHitsSummary = {};
			options.pendingData = [];
			options.lastDataByHost = {};
			options.excludedHosts = {};
			options.hosts = [];
			options.allHosts = {};

			options.inputs.reportsWrapper.hide();

			options.inputs.hosts.on('change', 'input[type="checkbox"]', function() {
			   var cb = $(this);
			   if (cb.is(':checked')) {
			       delete options.excludedHosts[cb.prop('value')];
			   } else {
			       options.excludedHosts[cb.prop('value')] = true;
			   }
			});

			options.inputs.clear.on('click', function() {
			    resetReports(options);
			    return false;
			});

			$.telligent.evolution.messaging.subscribe('socket.connected', function () {
				$.telligent.evolution.sockets.cachemonitor.on('cachemonitoring.stop', function(data) {
					if (options.isMonitoring) {
						startMonitoring(options);
					} else {
						$('.button.connecting', $.telligent.evolution.administration.header()).hide();
						$('.button.stop', $.telligent.evolution.administration.header()).hide();
						$('.button.start', $.telligent.evolution.administration.header()).show();
						$.telligent.evolution.administration.header();
						global.clearInterval(options.pingInterval);
					}
				});

				$.telligent.evolution.sockets.cachemonitor.on('cachemonitoring.start', function(data) {
					$('.button.connecting', $.telligent.evolution.administration.header()).hide();
					$('.button.stop', $.telligent.evolution.administration.header()).show();
					$('.button.start', $.telligent.evolution.administration.header()).hide();
					$.telligent.evolution.administration.header();
					options.inputs.topMisses.empty();
					options.inputs.topHits.empty();
					options.topMisses = [];
					options.topMissesSummary = {};
					options.topHits = [];
					options.topHitsSummary = {};
					global.clearInterval(options.pingInterval);
					options.pingInterval = global.setInterval(function() {
						$.telligent.evolution.sockets.cachemonitor.send('ping', {});
					}, 10000);

					options.pendingData = [];
					options.nextTick = new Date((new Date()).getTime() + 15 * 1000);
					global.clearTimeout(options.processTickDataHandle);
					options.processTickDataHandle = global.setTimeout(function() {
						processTickData(options);
					}, options.nextTick.getTime() - (new Date()).getTime() + 5000);

					updateWaitNotification(options);
				});

				options.pingInterval = global.setInterval(function() {
					$.telligent.evolution.sockets.cachemonitor.send('ping', {});
				}, 10000);

				stopMonitoring(options);
				receiveMonitoringData(options);
			});

			$.telligent.evolution.administration.on('panel.unloaded', function() {
			    global.clearInterval(options.pingInterval);
				stopMonitoring(options);
				if ($.telligent.evolution.sockets.cachemonitor) {
					$.telligent.evolution.sockets.cachemonitor.off('cachemonitoring.start');
					$.telligent.evolution.sockets.cachemonitor.off('cachemonitoring.stop');
					$.telligent.evolution.sockets.cachemonitor.off('cachemonitoring.updated');
				}
			});

			var initialData = [];
			var nowTime = (new Date()).getTime();
			for (var i = -60; i < 0; i++) {
			    initialData.push([
			        nowTime + (10000 * i),
			        0
			    ]);
			}

			Highcharts.setOptions({
                lang: {
                    decimalPoint: '.',
                    thousandsSep: ','
                }
            });

			options.inputs.hitsMissesChart = Highcharts.chart(options.inputs.hitsMisses, {
			    title: {
			        text: undefined
			    },
                chart: {
                    type: 'spline',
                    animation: Highcharts.svg, // don't animate in old IE
                    marginRight: 10,
                },
                time: {
                    useUTC: false
                },
                xAxis: {
                    type: 'datetime',
                    tickPixelInterval: 150,
                    format: '%I:%M:%S%p'
                },
                yAxis: {
                    title: {
                        enabled: false
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }],
                    floor: 0,
                    min: 0
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br/>',
                    pointFormat: '{point.x:%Y-%m-%d %I:%M:%S%p}<br/>{point.y}'
                },
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                },
                exporting: {
                    enabled: false
                },
                series: [{
                    name: options.text.seriesHits,
                    data: initialData,
                    color: '#00cc00',
                    marker: {
                        enabled: false
                    }
                }, {
                    name: options.text.seriesMisses,
                    data: initialData,
                    color: '#cc0000',
                    marker: {
                        enabled: false
                    }
                }, {
                    name: options.text.seriesTotalItems,
                    data: initialData,
                    color: '#666666',
                    marker: {
                        enabled: false
                    }
                }],
                credits: {
                    enabled: false
                }
            });

            options.inputs.memoryChart = Highcharts.chart(options.inputs.memory, {
                title: {
			        text: undefined
			    },
                chart: {
                    type: 'spline',
                    animation: Highcharts.svg, // don't animate in old IE
                    marginRight: 10,
                },
                time: {
                    useUTC: false
                },
                xAxis: {
                    type: 'datetime',
                    tickPixelInterval: 150,
                    format: '%I:%M:%S%p'
                },
                yAxis: {
                    title: {
                        text: 'Megabytes'
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }],
                    floor: 0,
                    min: 0
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br/>',
                    pointFormat: '{point.x:%Y-%m-%d %I:%M:%S%p}<br/>{point.y}MB'
                },
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                },
                exporting: {
                    enabled: false
                },
                series: [{
                    name: options.text.seriesMaximumMB,
                    color: '#cc0000',
                    data: initialData,
                    marker: {
                        enabled: false
                    }
                }],
                credits: {
                    enabled: false
                }
            });
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.cacheMonitor = api;

})(jQuery, window);