(function($, global) {

	var findTags = /^(?:\[([^\]]*)\]\s+)*/;

	function startTrace(options) {
		options.tracing = true;
		$.telligent.evolution.sockets.tracing.send('start', {});
	}

	function stopTrace(options) {
		options.tracing = false;
		$.telligent.evolution.sockets.tracing.send('stop', {});
	}

	function receiveTraceData(options) {
		var requestTemplate = $.telligent.evolution.template.compile(options.requestTemplate);
		$.telligent.evolution.sockets.tracing.on('tracing.step_completed', function(data) {
			if (!options.tracing) {
				return;
			}

			var elm = options.traceList.find('li[data-requestid="' + data.RequestId + '"]');
			if (elm.length == 0) {
				elm = $(requestTemplate({
					Url: data.Url,
					Method: data.Method,
					TotalTime: formatTime(options, data.OffsetMilliseconds + data.Milliseconds),
					TraceItems: '1 item',
					RequestId: data.RequestId
				}));
				options.traceList.append(elm);
			}

			var details = elm.data('trace') || {
				url: data.Url,
				method: data.Method,
				steps: [],
				totalTime: 0,
				requestId: data.RequestId
			};

			var formattedData = {
				Message: data.Message,
				TotalTime: formatTime(options, data.Milliseconds),
				OffsetTime: formatTime(options, data.OffsetMilliseconds),
				Tags: [],
				ParentId: data.ParentId,
				Id: data.Id,
				Milliseconds: data.Milliseconds,
				OffsetMilliseconds: data.OffsetMilliseconds
			};

			var tags = findTags.exec(formattedData.Message);
			if (tags[0]) {
				formattedData.Message = formattedData.Message.substr(tags[0].length);
				for (var i = 1; i < tags.length; i++) {
					formattedData.Tags.push(tags[i]);
				}
			}

			details.steps.push(formattedData);
			details.totalTime = data.OffsetMilliseconds + data.Milliseconds;

			elm.data('trace', details);
			elm.find('.timing').text(formatTime(options, details.totalTime));
			elm.find('.trace-items').text(details.steps.length == 1 ? '1 ' + options.text.action : (details.steps.length + ' ' + options.text.actions));
		});
	}

	function formatTime(options, milliseconds) {
		if (!milliseconds || milliseconds < 0) {
			milliseconds = 0;
		}

		if (milliseconds / (1000 * 60) > 1) {
			return Math.round(milliseconds / (1000 * 60), 2) + options.text.minutes;
		} else if (milliseconds / 1000 > 1) {
			return Math.round(milliseconds / 1000, 2) + options.text.seconds;
		} else {
			return Math.round(milliseconds, 2) + options.text.milliseconds;
		}
	}

	function escapeForCsv(text) {
		return (text + '').replace(/"/g, '""');
	}

	function downloadCsv(options, traceData, orderedSteps) {
	  var a = document.createElement('a');
	  var mimeType = 'text/csv';
		var fileName = 'trace.csv';

		var content = [];
		content.push('"Method","URL","Step","Tags","OffsetMilliseconds","TotalMilliseconds","Id","ParentId"\n')
		for (var i = 0; i < orderedSteps.length; i++) {
			content.push('"' + escapeForCsv(traceData.method) + '",');
			content.push('"' + escapeForCsv(traceData.url) + '",');
			content.push('"' + escapeForCsv(orderedSteps[i].Message) + '",');
			content.push('"' + escapeForCsv(orderedSteps[i].Tags.join(', ')) + '",');
			content.push('"' + escapeForCsv(orderedSteps[i].OffsetMilliseconds) + '",');
			content.push('"' + escapeForCsv(orderedSteps[i].Milliseconds) + '",');
			content.push('"' + escapeForCsv(orderedSteps[i].Id) + '",');
			content.push('"' + escapeForCsv(orderedSteps[i].ParentId) + '"');
			content.push('\n');
		}

	  if (navigator.msSaveBlob) { // IE10
	    return navigator.msSaveBlob(new Blob([content.join('')], { type: mimeType }), fileName);
	  } else if ('download' in a) { //html5 A[download]
	    a.href = 'data:' + mimeType + ',' + encodeURIComponent(content.join(''));
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
	    f.src = 'data:' + mimeType + ',' + encodeURIComponent(content.join(''));
	    setTimeout(function() {
	      document.body.removeChild(f);
	    }, 333);
	    return true;
	  }
	}

	function filterTraceSteps(options, searchText, list) {
		global.clearTimeout(options.searchTimeout);
		options.searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0) {
				$('.content-item', list).show().removeClass('hide-indent');
			} else {
				var searchTerms = searchText.split(' ');
				$('.content-item', list).each(function() {
					var cft = $(this);
					var text = cft.data('text');
					var match = true;
					for (var i = 0; i < searchTerms.length; i++) {
						if (text.indexOf(searchTerms[i]) == -1) {
							match = false;
							break;
						}
					}
					if (match) {
						cft.slideDown('fast', function() {
							cft.addClass('hide-indent');
						});
					} else {
						cft.slideUp('fast');
					}
				})
			}
		}, 125);
	}

	function showTrace(options, requestId, trace) {
		var traceTemplate = $.telligent.evolution.template.compile(options.traceTemplate);
		var traceOverviewTemplate = $.telligent.evolution.template.compile(options.traceOverviewTemplate);

		var orderedList = [];
		var existingParents = {};

		for (var i = 0; i < trace.steps.length; i++) {
		    existingParents[trace.steps[i].Id] = true;
		}

		for (i = 0; i < trace.steps.length; i++) {
		    if (trace.steps[i].ParentId && !existingParents[trace.steps[i].ParentId]) {
		        trace.steps[i].ParentId = '';
		    }
		}

		function findChildren(parentId) {
			var childSteps = [];
			for (var i = 0; i < trace.steps.length; i++) {
				if (trace.steps[i].ParentId == parentId) {
					childSteps.push(trace.steps[i]);
				}
			}
			childSteps = childSteps.sort(function(a, b) {
				return a.OffsetMilliseconds - b.OffsetMilliseconds;
			});

			return childSteps;
		}

		function addStep(step, depth) {
			step.Depth = depth;
			orderedList.push(step);

			var children = findChildren(step.Id);
			for (var i = 0; i < children.length; i++) {
				addStep(children[i], depth + 1);
			}
		}

		var parents = findChildren('');
		for (var i = 0; i < parents.length; i++) {
			addStep(parents[i], 0);
		}

		$.telligent.evolution.administration.open({
			name: 'Request Details',
			content: $.Deferred(function(d) {

					var contents = [];
					var list = $('<ul class="content-list content simple"></ul>');

					contents.push(
						$('<form><fieldset></fieldset></form>')
							.children()
							.append(
								$('<ul class="field-list"></ul>')
									.append(
										$('<li class="field-item"></li>')
											.append(
												$('<span class="field-item-input"></span>')
													.append(
														$('<input type="text" />')
															.attr('placeholder', 'Find...')
															.on('keyup paste click', function() {
																filterTraceSteps(options, $(this).val(), list);
															})
													)
											)
									)
							)
							.parent()
					);

					contents.push(list);

					for (i = 0; i < orderedList.length; i++) {
						list.append(traceTemplate(orderedList[i]));
					}

					d.resolve(contents);
			}).promise(),
			header: $.Deferred(function(d) {
				d.resolve(
					[
						$('<a href="#" class="align-right"></a>')
							.text(options.text.download)
							.on('click', function() {
								downloadCsv(options, trace, orderedList);
								return false;
							}),
						$(traceOverviewTemplate({
							Url: trace.url,
							Method: trace.method,
							TotalTime: formatTime(options, trace.totalTime),
							TraceItems: trace.steps.length,
							RequestId: trace.requestId
						}))
					]
				);
			}).promise(),
			shown: function() {
			},
			cssClass: 'tracing'
		});
	}

	var api = {
		register: function(options) {
			$.telligent.evolution.administration.size('wide');

			$.telligent.evolution.administration.header(
				$('<form><fieldset></fieldset></form>')
					.children()
					.append(
						$('<ul class="field-list"></ul>')
							.append(
								$('<li class="field-item"></li>')
									.append(
										$('<span class="field-item-input"></span>')
											.append(
												$('<a href="#"></a>')
													.addClass('button disabled connecting')
													.text(options.text.connecting)
													.on('click', function() {
														return false;
													})
												)
											.append(
												$('<a href="#"></a>')
													.addClass('button start')
													.text(options.text.start)
													.on('click', function() {
														startTrace(options);
														return false;
													})
													.hide()
												)
											.append(
												$('<a href="#"></a>')
													.addClass('button stop')
													.text(options.text.stop)
													.on('click', function() {
														stopTrace(options);
														return false;
													})
													.hide()
												)
										)
									.append(
										$('<span class="field-item-description"></span>')
											.text(options.text.instructions + ' ')
											.append(
												$('<a href="#"></a>')
													.text(options.text.clear)
													.on('click', function() {
														$('li', options.traceList).remove();
														return false;
													})
												)
										)
									)
								)
								.parent()
							);

			$.telligent.evolution.messaging.subscribe('socket.connected', function () {
				$.telligent.evolution.sockets.tracing.on('tracing.stop', function(data) {
					if (options.tracing) {
						startTrace(options);
					} else {
						$('.button.connecting', $.telligent.evolution.administration.header()).hide();
						$('.button.stop', $.telligent.evolution.administration.header()).hide();
						$('.button.start', $.telligent.evolution.administration.header()).show();
						$.telligent.evolution.administration.header();
						global.clearInterval(options.pingInterval);
					}
				});

				$.telligent.evolution.sockets.tracing.on('tracing.start', function(data) {
					$('.button.connecting', $.telligent.evolution.administration.header()).hide();
					$('.button.stop', $.telligent.evolution.administration.header()).show();
					$('.button.start', $.telligent.evolution.administration.header()).hide();
					$.telligent.evolution.administration.header();
					global.clearInterval(options.pingInterval);
					options.pingInterval = global.setInterval(function() {
						$.telligent.evolution.sockets.tracing.send('ping', {});
					}, 10000);
				});

				options.pingInterval = global.setInterval(function() {
					$.telligent.evolution.sockets.tracing.send('ping', {});
				}, 10000);

				stopTrace(options);
				receiveTraceData(options);

				$.telligent.evolution.messaging.subscribe('tracing.delete', function(data){
					var requestId = $(data.target).data('requestid');
					if (requestId) {
						var elm = options.traceList.find('li[data-requestid="' + requestId + '"]');
						elm.slideUp('fast', function() {
							elm.remove();
						});
					}
				});

				$.telligent.evolution.messaging.subscribe('tracing.view', function(data){
					var requestId = $(data.target).data('requestid');
					if (requestId) {
						var trace = options.traceList.find('li[data-requestid="' + requestId + '"]').data('trace');
						if (trace) {
							showTrace(options, requestId, trace);
						}
					}
				});
			});

			$.telligent.evolution.administration.on('panel.unloaded', function() {
			    global.clearInterval(options.pingInterval);
				stopTrace(options);
				if ($.telligent.evolution.sockets.tracing) {
					$.telligent.evolution.sockets.tracing.off('tracing.start');
					$.telligent.evolution.sockets.tracing.off('tracing.stop');
					$.telligent.evolution.sockets.tracing.off('tracing.step_completed');
				}
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.tracing = api;

})(jQuery, window);