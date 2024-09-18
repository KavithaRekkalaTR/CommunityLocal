/*

Administration Shell Plugin View:

var view = new PluginView(options)
	options:
		parent: element
		panelTemplateId: ''
		onLoading: function()
		onLoaded: function()
		onRendering: function()
		onRendered: function()
		onTitle: function(title)
		confirmNavigation: function()
		onParsePanelId: function()

	Methods:
		//   panelId: ''
		//   rawPanelContent: ''
		//   pluginName: ''
		//   pluginDescription: ''
		//   onRefresh: function()
		render: function(options)

		unrender: function()

		attemptToHandleHashChange: function()

		repositionWithCategory: function(bool)

		updatePluginState: function(pluginTypeName, state)

		hideChildren()

		showChildren()

*/
define('PluginView', [	'Utility', 'HandleState' ], function(Utility, HandleState, $, global, undef) {

	var administrationModule = $.telligent.evolution.administration,
		messaging = $.telligent.evolution.messaging,
		templating = $.telligent.evolution.template,
		ui = $.telligent.evolution.ui;

	var PluginView = function(options){
		var context = options;
		context.pluginTemplate = templating(context.panelTemplateId);

		return {
			//   panelId: ''
			//   rawPanelContent: ''
			//   pluginName: ''
			//   pluginDescription: ''
			//   onRefresh: function()
			render: function(renderOptions) {
				ui.suppress(function(){
					context.currentPlugin = renderOptions.panelId;
					context.currentPluginPanelNode = $(context.pluginTemplate($.extend({
						namespace: '',
						backUrl: null,
						backLabel: null,
						cssClass: 'plugin-type',

						panelId: '',
						rootPanelId: '',
						name: null,

						description: null
					}, {
						panelId: renderOptions.panelId,
						rootPanelId: renderOptions.panelId,
						content: renderOptions.rawPanelContent,
						name: renderOptions.pluginName,
						description: renderOptions.pluginDescription,
						cssClass: 'plugin-type ' + (renderOptions.pluginState || '').toLowerCase()
					})));
				});

				context.adminApiContext = administrationModule.__init({
					container: $(context.parent),
					panelNode: context.currentPluginPanelNode,
					panelName: renderOptions.pluginName,
					panelId: renderOptions.panelId,
					template: context.pluginTemplate,
					onOpening: function(options){
						if(context.onLoading) {
							context.onLoading(options);
						}
					},
					onOpened: function() {
						if(context.onLoaded) {
							context.onLoaded();
						}
					},
					onRendering: function(node) {
						if(context.onRendering) {
							context.onRendering();
						}
					},
					onRendered: function(node) {
						if(context.onRendered) {
							context.onRendered();
						}
					},
					onRefresh: function() {
						if(renderOptions.onRefresh) {
							renderOptions.onRefresh();
						}
					},
					onTitle: function(title) {
						if(context.onTitle) {
							context.onTitle(title);
						}
					},
					panelContentSelector: '.administration-panel-contents',
					panelHeaderSelector: '.administration-panel-heading',
					panelHeaderContentSelector: '.custom-panel-heading-content',
					ignoreOnDispose: function() {
						return context.currentPluginPanelNode;
					},
					confirmNavigation: function() {
						if (context.confirmNavigation)
							return context.confirmNavigation();
						else
							return true;
					},
					onParsePanelId: context.onParsePanelId
				});


				Utility.setHtml($(context.parent), context.currentPluginPanelNode)
					.then(function() {
						context.adminApiContext.postInit();
					});
			},
			unrender: function() {
				context.currentPlugin = null;
				if(context.currentPluginPanelNode) {
					context.currentPluginPanelNode.hide();
				}
				if(context.adminApiContext) {
					context.adminApiContext.dispose({
						refreshing: false
					});
					context.adminApiContext = null;
				}
			},
			attemptToHandleHashChange: function() {
				if(!context.adminApiContext) {
					return HandleState.Unhandled;
				}

				if(context.adminApiContext && context.adminApiContext.canProcessHashChange()) {
					if (context.adminApiContext.processHashChange()) {
						return HandleState.Handled;
					} else {
						return HandleState.UserDenied;
					}
				} else {
					return HandleState.Unhandled;
				}
			},
			repositionWithCategory: function(withCategory) {
				if(withCategory) {
					$(context.parent).removeClass('without-category');
				} else {
					$(context.parent).addClass('without-category');
				}
			},
			updatePluginState: function(pluginTypeName, state) {
				var pluginEnablementCheckboxes = $(context.parent)
					.find('.administration-panel.plugin-type input[type="checkbox"].plugin-enablement')
					.removeClass('enabled disabled misconfigured');

				if(state === 'Disabled') {
					pluginEnablementCheckboxes.prop('checked', false);
				} else {
					pluginEnablementCheckboxes.prop('checked', true);
				}

				if(context.currentPlugin == pluginTypeName) {
					$(context.parent)
						.find('.administration-panel.plugin-type')
						.removeClass('enabled disabled misconfigured')
						.addClass(state.toLowerCase());
				}
			},
			hideChildren: function() {
			},
			showChildren: function() {
			},
			refreshingNavigation: function(val) {
				if(context.adminApiContext) {
					return context.adminApiContext.refreshingNavigation(val);
				} else {
					return false;
				}
			}
		}
	};

	return PluginView;

}, jQuery, window);
