/*

Administration Shell Panel View:

var view = new PanelView(options)
	options:
		parent: element
		customPanelTemplateId: ''
		onLoading: function()
		onLoaded: function()
		onRendering: function()
		onRendered: function()
		onTitle: function(title)
		onSetExplicitState: function(state)
		confirmNavigation: function()
		onParsePanelId: function()

	Methods:
		//   panelId: ''
		//   rawPanelContent: ''
		//   panelName: ''
		//   panelDescription: ''
		//   panelCssClass: ''
		//   backUrl: null
		//   backLabel: null
		//   onRefresh: function()
		//   isExplicit
		render: function(options)

		unrender: function()

		attemptToHandleHashChange: function()

		repositionWithCategory: function(bool)
*/
define('PanelView', ['Utility', 'HandleState'], function(util, HandleState, $, global, undef) {

	var administrationContextManager = $.telligent.evolution.administration.__contextManager,
		messaging = $.telligent.evolution.messaging,
		templating = $.telligent.evolution.template,
		ui = $.telligent.evolution.ui,
		url = $.telligent.evolution.url,
		transitionEasing = 'cubic-bezier(0.645, 0.045, 0.355, 1)',
		transitionDuration = 300;

	var PanelView = function(options){
		var context = options;
		context.customPanelTemplate = templating(context.customPanelTemplateId);
		context.administrationContextManager = new administrationContextManager({
			template: context.customPanelTemplate,
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
			onTitle: function(title) {
				if(context.onTitle) {
					context.onTitle(title);
				}
			},
			onAnimated: function() {
				// workaround for Chrome/Windows issue with styles not being reapplied after animate
				setTimeout(function(){
					$(context.parent).css({overflow: 'hidden'});
					setTimeout(function(){
						$(context.parent).css({overflow: 'auto'});
					}, 10);
				}, 10);
			},
			confirmNavigation: function() {
				if (context.confirmNavigation)
					return context.confirmNavigation();
				else
					return true;
			},
			onParsePanelId: context.onParsePanelId,
			panelContentSelector: '.administration-panel-contents',
			panelHeaderSelector: '.administration-panel-heading',
			panelHeaderTitleSelector: '.administration-panel-heading-meta',
			panelHeaderContentSelector: '.custom-panel-heading-content',
			ignoreOnDispose: function() {
				return context.currentPanelNode;
			},
			onNavigateBackToPreviousContext: function(panelNode, options) {

				if(options.onPreRender) {
					options.onPreRender(panelNode);
				}

				animate(panelNode, 'right', true);

				if(options.onRendered) {
					options.onRendered(panelNode);
				}
			}
		});

		function animate(panel, direction, reveal, container, immediate) {
			if(direction == 'left' && !reveal) {

				panel.evolutionTransform( {
					left: -1 * panel.outerWidth(true)// - 20
				}, {
					duration: immediate ? 0 : transitionDuration,
					easing: transitionEasing,
					complete: function() {
					}
				});

			} else if(direction == 'left' && reveal) {
				panel.css({
						position: 'absolute',
						top: 0,
						width: container.width(),
						height: container.height()
					});

				util.appendHtml(container, panel).then(function(){
					context.administrationContextManager.postInit();
				});

				panel
					.evolutionTransform({ left: 1 * container.width() }, { duration: 0 })
					.evolutionTransform({ left: 0 }, { duration: immediate ? 0 : transitionDuration, easing: transitionEasing,
						complete: function(){
						}
					});

			} else if(direction == 'right' && !reveal) {
				panel
					.evolutionTransform({
						left: 1 * panel.outerWidth(true)// + 20
					}, {
						duration: immediate ? 0 : transitionDuration,
						easing: transitionEasing,
						complete: function() {
						}
					});
			} else if(direction == 'right' && reveal) {
				panel
					.evolutionTransform({
						left: 0
					}, {
						duration: immediate ? 0 : transitionDuration,
						easing: transitionEasing,
						complete: function() {
						}
					});
			}
		}

		return {
			//   panelId: ''
			//   rawPanelContent: ''
			//   panelName: ''
			//   panelDescription: ''
			//   panelCssClass: ''
			//   onRefresh: function()
			// 	 isExplicit
			render: function(renderOptions) {

				// if rendering a new explicit panel, handle the existing context
				var previousPanelRequest = null,
					previousPanelDetails = null;
				if(renderOptions.isExplicit) {
					context.currentPanelNode = context.administrationContextManager.currentPanelNode();
					if(context.currentPanelNode) {
						previousPanelDetails = context.administrationContextManager.currentPanelDetails();
						previousPanelRequest = context.administrationContextManager.currentPanelRequest();
						animate(context.currentPanelNode, 'left', false);
					}
				} else {
					context.administrationContextManager.dispose({
						refreshing: true
					})
				}

				ui.suppress(function(){
					context.currentPanelNode = $(context.customPanelTemplate($.extend({
						namespace: '',
						backUrl: null,
						backLabel: null,

						panelId: '',
						rootPanelId: '',
						content: null,
						name: null,

						description: null,
						cssClass: ''
					}, {
						panelId: renderOptions.panelId,
						rootPanelId: renderOptions.panelId,
						content: renderOptions.rawPanelContent,
						name: renderOptions.panelName,
						backLabel: previousPanelDetails ? previousPanelDetails.name : renderOptions.backLabel,
						backUrl: previousPanelDetails ? previousPanelDetails.url : renderOptions.backUrl,
						description: renderOptions.panelDescription,
						cssClass: renderOptions.panelCssClass
					})));
				});

				context.administrationContextManager.addContext({
					panelRequest: renderOptions,
					container: $(context.parent),
					panelNode: context.currentPanelNode,
					panelName: renderOptions.panelName,
					panelId: renderOptions.panelId,
					onRefresh: function() {
						if(renderOptions.onRefresh) {
							renderOptions.onRefresh();
						}
					},
					onDispose: function() {
						if(previousPanelRequest && context.onSetExplicitState) {
							context.onSetExplicitState(previousPanelRequest);
						}
					},
					onSideBar: function(content) {
						if(context.onSideBar) {
							return context.onSideBar(renderOptions.panelId, content);
						}
					}
				});

				if(renderOptions.isExplicit) {
					if (previousPanelRequest) {
						animate(context.currentPanelNode, 'left', true, $(context.parent));
					} else {
						animate(context.currentPanelNode, 'left', true, $(context.parent), true);
					}
				} else {
					util.appendHtml($(context.parent), context.currentPanelNode).then(function(){
						context.administrationContextManager.postInit();
					});
				}
			},
			unrender: function() {
				if(context.currentPanelNode) {
					context.currentPanelNode.hide();
				}
				if(context.administrationContextManager) {
					context.administrationContextManager.dispose({
						refreshing: false,
						all: true
					});
				}
			},
			// returns handle state
			attemptToHandleHashChange: function(options) {
				if(!context.administrationContextManager) {
					return HandleState.Unhandled;
				}

				var hashData = url.hashData();
				var isPanelRequest = hashData._aptype && hashData._appanelid;
				var isExplicitPanelRequest = isPanelRequest && hashData._appaneltype === 'explicit';

				// if can definitely process it (the current set of contexts includes this request), then process it
				if(context.administrationContextManager && context.administrationContextManager.canProcessHash()) {
					if (context.administrationContextManager.processHash()) {
						return HandleState.Handled;
					} else {
						return HandleState.UserDenied;
					}
				// if it's not known about, but it's an explicit panel request, we'll still handle it by
				// adding a new context to the current context manager
				} else if(isExplicitPanelRequest) {
					options.processAndRenderCurrentHashData()
					return HandleState.Handled;
				} else {
					return HandleState.Unhandled;
				}
			},
			repositionWithCategory: function(withCategory) {
				if(withCategory) {
					$(context.parent).removeClass('without-category');
					$(context.parent).parent().removeClass('without-category');
				} else {
					$(context.parent).addClass('without-category');
					$(context.parent).parent().addClass('without-category');
				}
			},
			refreshingNavigation: function(val) {
				if(context.administrationContextManager) {
					return context.administrationContextManager.refreshingNavigation(val);
				} else {
					return false;
				}
			}
		}
	};

	return PanelView;

}, jQuery, window);
