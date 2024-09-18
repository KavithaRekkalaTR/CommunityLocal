/*

StudioFileViewerEditView:

Options:
	container
	serializeRequest: function()
	selectedTabName: ''
	selectedTab: ''
	description: ''
	Templates:
		template
		headerTemplate
		actionsTemplate
		componentsTemplate
		stateTemplate
	Event Callbacks:
		onRender: function()
			request
			model
			container
			editorContainer
			willSave: function()
			raiseChange: function()
		onUpdate: function()
			model
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
define('StudioFileViewerEditView', function($, global, undef) {

	var defaults = {
		container: null,
		serializeRequest: null,
		selectedTabName: 'x',
		selectedTab: 'x',
		description: 'test description',

		template: 'studioShell-editorGenericFileViewer',
		headerTemplate: 'studioShell-editorHeader',
		actionsTemplate: 'studioShell-editorActions',
		componentsTemplate: 'studioShell-editorComponents',
		stateTemplate: 'studioShell-editorState',
		exampleTemplate: null,

		onRender: null,
		onUpdate: null,
		onShow: null,
		onHide: null,
		onUnrender: null,
		onUpdateEditorSettings: null,
		onApplyBottomMargin: null,
		stateServiceKey: 'diffwith'
	};

	function initUi(context) {
		context.clientState = {};

		var nameParts = context.model.Name.split('.');
		var viewModel = $.extend({}, context.model, {
			requestKey: context.serializeRequest(context.request),
			extension: (nameParts[nameParts.length - 1]).toLowerCase()
		});

		context.container.empty().append(context.template(viewModel));
		context.headerContainer = context.container.find('.template-editor-header');
		context.headerContainer.append(context.headerTemplate(viewModel))
		context.stateContainer = context.container.find('.template-editor-state');
		context.componentsContainer = context.container.find('.template-editor-components');
		context.actionsContainer = context.container.find('.template-editor-actions');

		// render actions
		var renderedActions = context.actionsTemplate(viewModel);
		context.actionsContainer.empty().append(renderedActions);

		// render state...
		context.stateContainer.empty().append(context.stateTemplate(context.model))

		// render components
		context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, context.model,{
			selected: context.model.Name,
			selectedTabName: context.model.Name
		})));

		context.exampleContainer = context.container.find('.template-editor-example');
		if(context.exampleTemplate) {
			context.exampleContainer.empty().append($.telligent.evolution.template(context.exampleTemplate)(viewModel));
		}

		context.stateLabels = context.container.find('.editor-state');
		context.editorContainer = context.container.find('.editor-content');

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
	}

	function compareWith(context, variantType) {
		// don't support diff mode on deleted files
		if(context.model.deleted)
			return;

		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.comparison = variantType;

		var activatingLink = context.stateContainer.find('a.compare[data-varianttype="' + variantType + '"]');
		activatingLink.text(activatingLink.data('hidelabel'));
		if(context.editorContainer.filter('.editor-content').is(':visible')) {
			context.stateLabels.show();
			context.stateLabels.find('.from').text(activatingLink.data('fromlabel'));
			context.stateLabels.find('.to').text(activatingLink.data('tolabel'));
		}
	}

	function unCompareWith(context) {
		// don't support diff mode on deleted files
		if(context.model.deleted)
			return;

		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.comparison = false;
	}

	var StudioFileViewerEditView = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			render: function(options) {
				$.extend(context, options);

				context.template = $.telligent.evolution.template(context.template);
				context.headerTemplate = $.telligent.evolution.template(context.headerTemplate);
				context.actionsTemplate = $.telligent.evolution.template(context.actionsTemplate);
				context.componentsTemplate = $.telligent.evolution.template(context.componentsTemplate);
				context.stateTemplate = $.telligent.evolution.template(context.stateTemplate);

				initUi(context);

				if(context.onRender) {
					context.onRender({
						request: context.request,
						model: context.model,
						container: context.container,
						editorContainer: context.editorContainer,
						willSave: function() {},
						raiseChange: function() {},
						state: context.clientState
					});
				}

				if(context.model.deleted) {
					context.container.find('select,input,textarea').prop('disabled', true);
					context.stateContainer.hide();
					context.container.find('.restore-note').show();
					$.telligent.evolution.administration.panelWrapper().addClass('restorable');
				} else {
					context.container.find('select,input,textarea').prop('disabled', false);
					context.stateContainer.show();
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
				if(context.onHide) {
					context.onHide({
						state: context.clientState
					});
				}
				// restore comparison mode class if comparing at time of hide
				if(context.comparison) {
					$.telligent.evolution.administration.panelWrapper().addClass('comparing');
				}

				$.telligent.evolution.administration.panelWrapper().removeClass('restorable');
			},
			show: function() {
				if(context.onShow) {
					context.onShow({
						state: context.clientState,
						lineNumber: lineNumber
					});
				}
				// hide comparison mode class since has no purpose in this view
				$.telligent.evolution.administration.panelWrapper().removeClass('comparing');

				if(context.model.deleted) {
					$.telligent.evolution.administration.panelWrapper().addClass('restorable');
				}
			},
			// options
			// 		model
			update: function(options) {
				context.model = options.model;
				initUi(context);

				// update state
				context.stateContainer.empty().append(context.stateTemplate(context.model));

				// update components
				context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, context.model,{
					selected: context.model.Name,
					selectedTabName: context.model.Name
				})));

				// update actions
				context.actionsContainer.empty().append(context.actionsTemplate(
					$.extend({}, context.model, {
						requestKey: context.serializeRequest(context.request)
					})
				));

				if(context.onUpdate) {
					context.onUpdate({
						state: context.clientState,
						model: options.model,
						container: context.container
					});
				}

				if(context.model.deleted) {
					context.stateContainer.hide();
					context.container.find('.restore-note').show();
					$.telligent.evolution.administration.panelWrapper().addClass('restorable');
				}
			},
			updateEditorSettings: function(settings) {
				if(context.onUpdateEditorSettings) {
					content.onUpdateEditorSettings({
						state: context.clientState,
						settings: settings
					});
				}
			},
			applyBottomMargin: function (margin) {
				context.container.find('.editor-content').css({
					bottom: margin
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

	return StudioFileViewerEditView;

}, jQuery, window);
