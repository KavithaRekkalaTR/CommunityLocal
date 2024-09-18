/*

StudioCodeEditView:

Provides a pre-packaged configurable edit view for rendering diffable code editor view
Can be rendered like any other studio-specific edit view in the shell's StudioTabContentController
Handles things like persisting scrollposition and running queueing editor setting changes when hidden/shown

Options:
	container
	serializeRequest: function()
	selectedTabName: ''
	selectedTab: ''
	description: ''
	modelIdKey: 'InstanceIdentifier'
	Templates:
		template
		headerTemplate
		actionsTemplate
		componentsTemplate
		stateTemplate
	Saving
		mode
		getAutoCompleteSuggestions: // if provided, uses for autocompletion
		onGatherChanges: function(model, newContent) // apply any changes to model before it's delivered
		onGetContent: function(model) // gets appropriate model content for shoing in editor or comparison view
		onChangeRaised: function(model)
		onGetMode: function(model) // gets mode for content when applicable
	Event Callbacks:
		onPreRender: function(options)
			viewModel
			request
			model
		onRender: function()
			request
			model
			container
			editorContainer
			willSave: function()
			raiseChange: function()
		onUpdate: function()
			state
			model
			container
			force
		onShow: function(lineNumber)
		onHide: function()
		onUnrender: function()
		onUpdateEditorSettings: function(settings)
		onApplyBottomMargin: function(margin)
	Comparisons
		onCompareRequested: function(variantType)
		onDifferencesCompared: function
		onDifferencesRemoved: function
			force

Methods:
	Matches the interface required for any view rendered by StudioTabContentController
*/
define('StudioCodeEditView', function($, global, undef) {

	var defaults = {
		container: null,
		serializeRequest: null,
		selectedTabName: '',
		selectedTab: '',
		description: 'test description',
		modelIdKey: 'InstanceIdentifier',

		template: 'studioShell-editorGenericCode',
		headerTemplate: 'studioShell-editorHeader',
		actionsTemplate: 'studioShell-editorActions',
		componentsTemplate: 'studioShell-editorComponents',
		stateTemplate: 'studioShell-editorState',

		// either mode or mode selector required
		// when mode selector provided, uses/sets that val instead and makes visible
		mode: null,
		modeSelector: null, // jquery select selection

		getAutoCompleteSuggestions: null,
		onGatherChanges: null,
		onChangeRaised: null,
		onGetContent: null,
		onPreRender: null,
		onRender: null,
		onUpdate: null,
		onShow: null,
		onHide: null,
		onUnrender: null,
		onUpdateEditorSettings: null,
		onApplyBottomMargin: null,
		onDifferencesCompared: null,
		onDifferencesRemoved: null,
		stateServiceKey: 'diffwith'
	};

	// handle 'jsm' mode as javascript formatted, independent from actual javascript mode
	function filterEditorSettings(editorSettings) {
		if(editorSettings && editorSettings.mode === 'jsm') {
			editorSettings.mode = 'javascript';
		}
		return editorSettings;
	}

	function resizeSelect(select) {
		if(!select)
			return;
		var measure = select.siblings('.measure');
		if(measure) {
			measure.text(select.val());
			select.width(measure.width());
		}
	}

	function initUi(context) {
		// state bag for client to use
		context.clientState = {};

		var viewModel = $.extend({}, context.model, {
			requestKey: context.serializeRequest(context.request),
			description: context.description
		});

		var editorSettings = $.extend({}, context.editorSettings, {
			mode: context.mode,
			line: context.request.line,
			autoComplete: (context.getAutoCompleteSuggestions
				? function(options){
					return context.getAutoCompleteSuggestions(context.mode, options.prefix, context.model[context.modelIdKey])
						.then(function(results){
							return { results: results };
						});
				}
				: null)
		});

		if(context.onPreRender) {
			context.onPreRender({
				viewModel: viewModel,
				request: context.request,
				model: context.model,
				editorSettings: editorSettings,
				getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
				state: context.clientState
			});
		}

		context.template = $.telligent.evolution.template(context.template);
		context.headerTemplate = $.telligent.evolution.template(context.headerTemplate);
		context.actionsTemplate = $.telligent.evolution.template(context.actionsTemplate);
		context.componentsTemplate = $.telligent.evolution.template(context.componentsTemplate);
		context.stateTemplate = $.telligent.evolution.template(context.stateTemplate);

		context.container.append(context.template(viewModel));
		context.headerContainer = context.container.find('.template-editor-header');
		context.headerContainer.append(context.headerTemplate(viewModel))
		context.stateContainer = context.container.find('.template-editor-state');
		context.componentsContainer = context.container.find('.template-editor-components');
		context.actionsContainer = context.container.find('.template-editor-actions');

		context.editorContainer = context.container.find('.editor-content')
		context.codeEditor = context.container.find('textarea.code-editor');
		context.codeEditorLoaded = $.Deferred(function(d){
			context.codeEditor.on('evolutionCodeEditorReady', function(){
				d.resolve();
			});
		}).promise();

		context.comparison = false;

		// selectable mode
		if(context.modeSelector) {
			// show mode selector
			context.modeSelector = context.headerContainer.find(context.modeSelector);
			context.modeSelector.parent().show();

			// preselect based on model's mode
			var mode;
			if(context.onGetMode) {
				mode = context.onGetMode(context.model);
			} else {
				mode = context.modeSelector.val();
			}
			context.modeSelector.val(mode);
			resizeSelect(context.modeSelector);

			$.extend(editorSettings, {
				mode: mode.toLowerCase(),
				autoComplete: (context.getAutoCompleteSuggestions
					? function(options){
						return context.getAutoCompleteSuggestions(mode.toLowerCase(), options.prefix, context.model[context.modelIdKey])
							.then(function(results){
								return { results: results };
							});
					}
					: null)
			});

			context.modeSelector.on('change', function(){
				if(context.willSave) {
					context.willSave();
				}

				// update text mode of editor
				var mode = context.modeSelector.val();
				resizeSelect(context.modeSelector);

				var editorSettings = {
					mode: mode.toLowerCase(),
					autoComplete: (context.getAutoCompleteSuggestions
						? function(options){
							return context.getAutoCompleteSuggestions(mode.toLowerCase(), options.prefix, context.model[context.modelIdKey])
								.then(function(results){
									return { results: results };
								});
						}
						: null)
				};

				context.codeEditor.evolutionCodeEditor(editorSettings);

				raiseChange(context);
			});
		}

		var content = context.onGetContent(context.model);
		context.codeEditor
			.val(content)
			.evolutionCodeEditor(filterEditorSettings(editorSettings))
			.on('change', function(){
				if(context.willSave) {
					context.willSave();
				}
				raiseChange(context);
			});

		// render actions
		var renderedActions = context.actionsTemplate(viewModel);
		context.actionsContainer.empty().append(renderedActions);

		// render state...
		context.stateContainer.empty().append(context.stateTemplate(context.model))

		// render components
		context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, context.model,{
			selected: context.selectedTab,
			selectedTabName: context.selectedTabName
		})));

		context.stateLabels = context.container.find('.state-labels');

		context.stateContainer.on('click', 'a.compare', function(e){
			e.preventDefault();
			var link = $(e.target);
			var variantType = link.data('varianttype');
			if(context.comparison != variantType) {
				context.onCompareRequested(variantType);
			} else {
				context.onCompareRequested(null);
			}
			return false;
		});

		// pre-focus
		context.codeEditorLoaded.then(function(){
			context.codeEditor.evolutionCodeEditor('focus', true);
		});

		context.onEditorLoaded = [];
	}

	function compareWith(context, variantType) {
		// don't support diff mode on deleted files
		if(context.model.deleted)
			return;

		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.comparison = variantType;
		context.loadVariant(variantType).then(function(r){
			// handle changes during load
			if(variantType != context.comparison)
				return;
			if(r) {
				if(context.onDifferencesCompared) {
					context.onDifferencesCompared({
						request: context.request,
						container: context.container,
						currentModel: context.model,
						comparisonModel: r
					});
				}
				context.codeEditor.evolutionCodeEditor({
					sourceComparison: context.onGetContent(r)
				});
			} else {
				context.codeEditor.evolutionCodeEditor({
					sourceComparison: ''
				});
			}
			var activatingLink = context.stateContainer.find('a.compare[data-varianttype="' + variantType + '"]');
			activatingLink.text(activatingLink.data('hidelabel'));
			if(context.editorContainer.filter('.editor-content').is(':visible')) {
				$.telligent.evolution.administration.panelWrapper().addClass('comparing');
				context.stateLabels.show();
				context.stateLabels.find('.from').text(activatingLink.data('fromlabel'));
				context.stateLabels.find('.to').text(activatingLink.data('tolabel'));
			}
		});
	}

	function unCompareWith(context) {
		// don't support diff mode on deleted files
		if(context.model.deleted)
			return;

		$.telligent.evolution.administration.panelWrapper().removeClass('comparing');
		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.comparison = false;
		context.stateLabels.hide();
		context.codeEditor.evolutionCodeEditor({
			sourceComparison: null
		});
		if(context.onDifferencesRemoved) {
			context.onDifferencesRemoved({
				request: context.request,
				model: context.model,
				container: context.container
			})
		}
	}

	function raiseChange(context, options) {
		var currentCodeEditorContent = context.codeEditor.val();
		context.onGatherChanges(context.model, currentCodeEditorContent, context.clientState, options || {}, context.container);
		context.changed(context.model, (options || {}).immediate).then(function(){
		});
		if(context.onChangeRaised) {
			context.onChangeRaised(context.model);
		}
	}

	function normalize(content) {
		if(!content)
			return content;

		return $.trim(content).replace(/\r\n/g,'\n');
	}

	var StudioCodeEditView = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			// options:
			// 		request
			// 		container
			// 		model
			//		changed(model)
			render: function(options) {
				$.extend(context, options);
				initUi(context);

				if(context.onRender) {
					context.onRender({
						request: context.request,
						model: context.model,
						container: context.container,
						editorContainer: context.editorContainer,
						willSave: function() {
							if(context.willSave) {
								context.willSave();
							}
						},
						raiseChange: function(options) {
							raiseChange(context, options);
						},
						updateEditor: function(editorSettings) {
							context.codeEditor.evolutionCodeEditor(filterEditorSettings(editorSettings));
						},
						codeEditor: context.codeEditor,
						state: context.clientState,
						getAutoCompleteSuggestions: context.getAutoCompleteSuggestions
					});
				}

				if(context.model.deleted) {
					context.container.find('select,input,textarea').prop('disabled', true);
					context.stateContainer.hide();
					context.codeEditor.evolutionCodeEditor({
						readOnly: true
					});
					context.container.find('.restore-note').show();
					$.telligent.evolution.administration.panelWrapper().addClass('restorable');
				} else {
					context.container.find('select,input,textarea').prop('disabled', false);
					context.stateContainer.show();
					context.codeEditor.evolutionCodeEditor({
						readOnly: false
					});
					context.container.find('.restore-note').hide();
					$.telligent.evolution.administration.panelWrapper().removeClass('restorable');
				}
			},
			unrender: function() {
				if(context.onUnrender) {
					context.onUnrender({
						state: context.clientState
					});
				}
			},
			hide: function() {
				// save scroll position
				context.previousScrollTop = context.codeEditor.evolutionCodeEditor('scrollTop');

				if(context.onHide) {
					context.onHide({
						state: context.clientState
					});
				}

				$.telligent.evolution.administration.panelWrapper().removeClass('restorable');
			},
			show: function(lineNumber) {
				context.codeEditorLoaded.then(function(){
					context.codeEditor.evolutionCodeEditor('focus', true);
					if(lineNumber && !isNaN(lineNumber)) {
						context.codeEditor.evolutionCodeEditor('line', lineNumber);
					}

					for(var i = 0; i < context.onEditorLoaded.length; i++) {
						context.onEditorLoaded[i]();
					}
					context.onEditorLoaded = [];
				});

				if(context.previousScrollTop) {
					global.setTimeout(function(){
						context.codeEditor.evolutionCodeEditor('scrollTop', context.previousScrollTop);
						context.previousScrollTop = null;
					}, 50);
				}

				if(context.onShow) {
					context.onShow({
						state: context.clientState,
						lineNumber: lineNumber
					});
				}

				if(context.model.deleted) {
					$.telligent.evolution.administration.panelWrapper().addClass('restorable');
				}
			},
			// options
			// 		model
			// 		force: true|false (when true, updates even if focused)
			update: function(options) {
				// only update the editor content if it's different
				var currentEditorValue = context.codeEditor.evolutionCodeEditor('val');
				if(normalize(currentEditorValue) !== normalize(context.onGetContent(options.model))) {
					if(!context.codeEditor.evolutionCodeEditor('focus') || options.force === true) {
						context.codeEditor.evolutionCodeEditor('val', context.onGetContent(options.model));
						context.codeEditor.evolutionCodeEditor({
							sourceComparison: null
						});
						context.stateLabels.hide();
						$.telligent.evolution.administration.panelWrapper().removeClass('comparing');
						context.comparison = false;
						resizeSelect(context.modeSelector);
					}
				}

				// update actions
				context.actionsContainer.empty().append(context.actionsTemplate(
					$.extend({}, context.model, {
						requestKey: context.serializeRequest(context.request)
					})
				));

				// update state
				context.stateContainer.empty().append(context.stateTemplate(context.model))

				// update components
				context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, context.model,{
					selected: context.selectedTab,
					selectedTabName: context.selectedTabName
				})));

				// update mode selector and change editor settings if applicable
				if(context.modeSelector && context.onGetMode) {
					var currentMode = context.modeSelector.val();
					var newMode = context.onGetMode(options.model);
					if(currentMode !== newMode) {
						context.modeSelector.val(newMode);
						resizeSelect(context.modeSelector);
						var editorSettings = {
							mode: newMode.toLowerCase(),
							autoComplete: (context.getAutoCompleteSuggestions
								? function(options){
									return context.getAutoCompleteSuggestions(newMode.toLowerCase(), options.prefix, context.model[context.modelIdKey])
										.then(function(results){
											return { results: results };
										});
								}
								: null)
						};
						context.codeEditor.evolutionCodeEditor(editorSettings);
					}
				};

				if(context.onUpdate) {
					context.onUpdate({
						state: context.clientState,
						model: options.model,
						container: context.container,
						force: options.force
					});
				}

				if(context.onDifferencesRemoved) {
					context.onDifferencesRemoved({
						request: context.request,
						model: context.model,
						container: context.container,
						force: options.force
					})
				}

				if(context.model.deleted) {
					context.stateContainer.hide();
					context.container.find('.restore-note').show();
					$.telligent.evolution.administration.panelWrapper().addClass('restorable');
				}
			},
			updateEditorSettings: function(settings) {
				context.codeEditorLoaded.then(function(){
					context.codeEditor.evolutionCodeEditor(filterEditorSettings(settings));
				});

				if(context.onUpdateEditorSettings) {
					content.onUpdateEditorSettings({
						state: context.clientState,
						settings: settings
					});
				}
			},
			applyBottomMargin: function (margin) {
				context.editorContainer.css({
					bottom: margin
				})
				context.codeEditorLoaded.then(function () {
					context.codeEditor.evolutionCodeEditor('__resize');
				});

				if(context.onApplyBottomMargin) {
					context.onApplyBottomMargin({
						state: context.clientState,
						margin: margin
					});
				}
			},
			applyComparisonMode: function (variantType) {
				if(variantType) {
					compareWith(context, variantType);
				} else {
					unCompareWith(context);
				}
			}
		}
	};

	return StudioCodeEditView;

}, jQuery, window);
