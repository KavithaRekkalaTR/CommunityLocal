/*
*/
define('StudioScriptConsole', ['StudioSaveQueue', 'StudioStorageProxy'], function(StudioSaveQueue, StudioStorageProxy, $, global, undef) {

	var entryLogStorageProxyKey = '_script_console_log';
	var bufferStorageProxyKey = '_script_console_buffer';

	var defaults = {
		consoleTemplate: '',
		consoleLogEntryTemplate: '',
		container: null,
		maxLogLength: 5,
		onGetSettings: function() {
		},
		getAutoCompleteSuggestions: function(prefix, fragmentId) {
		},
		onEvaluate: function(input, mode) {
		},
		onNavigateRight: function(editor) {

		}
	};

	var model = {
		clearLog: function(context) {
			context.storageProxy.set(entryLogStorageProxyKey, {
				entries: []
			});
		},
		getCurrentLog: function(context) {
			var log = context.storageProxy.get(entryLogStorageProxyKey);
			return (log || { entries: [] });
		},
		evaluate: function(context, input, mode) {
			// schedule input to be processed sequentially in order it was received
			// and written to output in order of request
			return context.processQueue.add(input + mode, function(){
				return $.Deferred(function(d){
					context.onEvaluate(input, mode)
						.then(function(response){
							// append response to log or create log if not already there
							var currentLog = model.getCurrentLog(context);
							if(currentLog && currentLog.entries) {
								if (currentLog.entries.length >= context.maxLogLength) {
									currentLog.entries.shift();
								}
								currentLog.entries.push(response);
								context.storageProxy.set(entryLogStorageProxyKey, currentLog);
							} else {
								context.storageProxy.set(entryLogStorageProxyKey, {
									entries: [ response ]
								});
							}
							// resolve with the response
							d.resolve(response);
						});
				}).promise()
			});
		},
		saveBuffer: function(context, buffer, mode) {
			context.storageProxy.set(bufferStorageProxyKey, {
				buffer: (buffer || ''),
				mode: (mode || 'velocity')
			});
		},
		getSavedBuffer: function(context) {
			var savedBuffer = context.storageProxy.get(bufferStorageProxyKey);
			if(savedBuffer && savedBuffer.buffer) {
				return savedBuffer;
			} else {
				return {
					buffer: '',
					mode: 'velocity'
				};
			}
		}
	};

	function setupEditor(context) {
		var mode = context.modeSelector.val();
		return $.Deferred(function (d) {
			context.input.evolutionCodeEditor({
				mode: mode,
				theme: 'dark',
				autoComplete: function (options) {
					return context.getAutoCompleteSuggestions(mode, options.prefix, context.onGetSettings(), context.state ? context.state.fragmentId : null)
						.then(function (results) {
							return { results: results };
						});
				},
				right: function (editor) {
					return context.onNavigateRight(editor);
				}
			}).on('evolutionCodeEditorReady', function () {
				d.resolve();
			});
		}).promise();
	}

	function initUi(context) {
		context.wrapper = $(context.consoleTemplate({}));
		context.container.append(context.wrapper);

		context.input = context.wrapper.find('.script-console-content').first();
		context.modeSelector = context.wrapper.find('.script-console-language').first();
		context.runLink = context.wrapper.find('.script-console-submit');
		context.outputList = context.wrapper.find('.script-console-log-entries');
		context.output = context.wrapper.find('.script-console-output');
		context.clearLink = context.wrapper.find('.script-console-clear');

		context.editorReady = setupEditor(context);
	}

	function handleEvents(context) {
		// handle explicit runs of buffer from "Run" button
		context.runLink.on('click', function(e){
			e.preventDefault();
			evaluateCurrentValue(context);
			return false;
		});

		// save entire buffer on any change
		context.input.on('evolutionCodeEditorChange', function(){
			model.saveBuffer(context, context.input.evolutionCodeEditor('val') || '', context.modeSelector.val());
		});

		context.modeSelector.on('change', function(){
			setupEditor(context);
			model.saveBuffer(context, context.input.evolutionCodeEditor('val') || '', context.modeSelector.val());
		});

		// handle rendered/raw view toggling
		context.outputList.on('click', 'a.script-console-view', function(e){
			e.preventDefault();

			// select the proper button state
			$(e.target).closest('.script-console-log-entry-details').find('.script-console-view').removeClass('selected');
			var selectedViewTypeLink = $(e.target);
			selectedViewTypeLink.addClass('selected');

			// hide and show the proper render type
			$(e.target).closest('li.script-console-log-entry').find('.script-console-log-entry-output').hide();
			$(e.target).closest('li.script-console-log-entry').find('.script-console-log-entry-output.' + selectedViewTypeLink.data('type')).show();

			return false;
		});

		// handle copying previous buffers back to current buffer
		context.outputList.on('click', 'a.script-console-log-entry-input-copy', function(e){
			e.preventDefault();

			var previousEntry = $(e.target).closest('.script-console-log-entry').find('.script-console-log-entry-input').text();
			var previousMode = $(e.target).closest('.script-console-log-entry').find('.script-console-log-entry-mode').text();
			if(previousEntry) {
				context.input.evolutionCodeEditor('val', previousEntry);
				context.modeSelector.val(previousMode).trigger('change');
				context.input.trigger('evolutionCodeEditorChange');
			}

			return false;
		});

		// handle console clearing
		context.clearLink.on('click', function(e){
			e.preventDefault();

			model.clearLog(context);
			context.outputList.empty();

			return false;
		});

		context.input.closest('.script-console-wrapper').on('keypress', function(e){
			if(e.which == 13 && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				evaluateCurrentValue(context);
				return false;
			}
		});
	}

	function getCurrentBufferValue(context) {
		var currentValue = $.trim(context.input.evolutionCodeEditor('val') || '');
		return currentValue;
	}

	function loadInitialState(context) {
		// restore previous buffer
		var buffer = model.getSavedBuffer(context);
		context.input.val(buffer.buffer);
		if (buffer && buffer.mode) {
			context.modeSelector.val(buffer.mode);
			context.editorReady.then(function () {
				setupEditor(context);
			});
		}

		// reload and render log of previous requests
		var log = model.getCurrentLog(context);
		if(log && log.entries) {
			for(var i = 0;i < log.entries.length; i++) {
				render(context, log.entries[i]);
			}
		}
	}

	function evaluateCurrentValue(context) {
		// first try to use the current highlight, if there is one, instead of the full buffer
		var currentValue = $.trim(context.input.evolutionCodeEditor('selectedText') || '');
		if(!currentValue) {
			currentValue = getCurrentBufferValue(context);
		}

		var currentMode = context.modeSelector.val();

		if(currentValue) {
			model.evaluate(context, currentValue, currentMode).then(function(requestResponse){
				render(context, requestResponse);
			});
		}
	}

	function render(context, requestResponse) {
		// don't let the visual rendering of the log exceed max length
		if(context.outputList.children('li').length >= context.maxLogLength) {
			context.outputList.children('li').first().remove();
		}
		// render new item
		requestResponse.mode = requestResponse.mode || 'velocity';
		context.outputList.append(context.consoleLogEntryTemplate(requestResponse));
		context.output.get(0).scrollTop = context.output.get(0).scrollHeight;
	}

	var StudioScriptConsole = function(options) {
		var context = $.extend({}, defaults, options || {});

		// set up instances
		context.processQueue = new StudioSaveQueue({
			interval: 25
		});

		context.storageProxy = new StudioStorageProxy($.telligent.evolution.user.accessing);

		initUi(context);
		handleEvents(context);
		loadInitialState(context);

		return {
			updateEditorSettings: function(settings) {
				context.input.evolutionCodeEditor(settings);
			},
			resize: function () {
				context.input.evolutionCodeEditor('__resize');
			}
		};
	};

	$.telligent.evolution.ui.components.consoletree = {
		setup: function() {

		},
		add: function(elm, options) {
			elm.on('click', 'span', function(e){
				$(e.target).next('ul').toggle(100);
			})
		}
	}

	return StudioScriptConsole;

}, jQuery, window);
