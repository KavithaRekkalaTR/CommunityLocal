/*

Administration Shell Controller Module:

Constructor:

var controller = new Controller(options)
	options:
		categoryContainerId: null,
		categoryContainerId: null,
		contentContainerId: null,
		customPanelTemplateId: null,
		loadingIndicatorId: null,
		userLinksContainerId: null
		categoriesUrl: null,
		categoryUrl: null,
		panelUrl: null,
		pluginUrl: null
		logoutWarningView: null

	Methods:
		controller.start()

*/
define('Controller', [
		'Model',
		'Navigator',
		'CategoriesView',
		'CategoryView',
		'PanelView',
		'PluginView',
		'GlobalSearchView',
		'Utility',
		'HandleState' ],
	function(
		Model,
		Navigator,
		CategoriesView,
		CategoryView,
		PanelView,
		PluginView,
		GlobalSearchView,
		Utility,
		HandleState,
		$, global, undef)
{
	var transitionDuration = 300;

	var defaults = {
		// options:
		categoryContainerId: null,
		categoryContainerId: null,
		contentContainerId: null,
		customPanelTemplateId: null,
		categoriesUrl: null,
		categoryUrl: null,
		panelUrl: null,
		pluginUrl: null,
		logoutWarningView: null,

		// state
		model: null,
		nav: null,
		categoriesView: null,
		categoryView: null,
		panelView: null,
		pluginView: null
	};

	function initNav(context) {
		context.nav = new Navigator({
			// loading
			onLoadCategories: function() {
				return context.model.getCategories();
			},
			onLoadCategory: function(categoryId) {
				return context.model.getCategory(categoryId);
			},
			onLoadAdministrativePanel: function(panelId, extraParameters) {
				return context.model.getAdministrativePanel(panelId, extraParameters);
			},
			onLoadPluginPanel: function(pluginTypesPanelTypeName, pluginTypeName) {
				return context.model.getPluginPanel(pluginTypesPanelTypeName, pluginTypeName, true);
			},

			// rendering
			onRenderCategories: function(content) {
				context.categoriesView.render(content);
			},
			onRenderCategory: function (options) {
				context.categoriesView.setBadgeCount(options.categoryId, options.badgeCount);
				context.categoryView.render(options.content);
				context.panelView.repositionWithCategory(true);
				context.pluginView.repositionWithCategory(true);
			},
			// options
			//   panelId: ''
			//   rawPanelContent: ''
			//   panelName: ''
			//   panelDescription: ''
			//   panelCssClass: ''
			//   onRefresh: function()
			//   isExplicit
			onRenderAdministrativePanel: function(options) {
				context.panelView.render(options);
			},
			//   panelid: ''
			//   rawPanelContent: ''
			//   pluginName: ''
			//   pluginDescription: ''
			//   pluginState
			//   onRefresh: function()
			onRenderPluginPanel: function(options) {
				context.pluginView.render(options);
			},

			// emptying
			onEmptyCategory: function() {
				context.categoryView.unrender();
				context.panelView.repositionWithCategory(false);
				context.pluginView.repositionWithCategory(false);
			},
			onEmptyContent: function() {
				context.panelView.unrender();
				context.pluginView.unrender();
			},

			// category showing/hiding
			onHideCategory: function() {
				context.categoryView.hide();
				context.panelView.repositionWithCategory(false);
				context.pluginView.repositionWithCategory(false);
			},
			onShowCategory: function() {
				context.categoryView.show();
				context.panelView.repositionWithCategory(true);
				context.pluginView.repositionWithCategory(true);
			},

			// adjusting existing renders
			onSelectCategory: function(categoryId, shouldScroll) {
				if(categoryId) {
					context.categoriesView.toggleResponsiveOpen(true);
					context.categoriesView.selectCategory(categoryId, shouldScroll);
				}
			},
			onSelectPanel: function(panelId, shouldScroll) {
				if(panelId)
					context.categoryView.selectAdministrativePanel(panelId, shouldScroll);
			},
			onSelectPluginPanel: function(selectPluginPanel, pluginTypesPanelName, shouldScroll) {
				if(selectPluginPanel)
					context.categoryView.selectPluginPanel(selectPluginPanel, shouldScroll);
			},

			// loading indicators
			onLoading: function() {
				showLoadingIndicator(context);
			},
			onLoaded: function() {
				hideLoadingIndicator(context);
			}
		});
	}

	function applyTitle(context, title) {
		title = $.trim($.telligent.evolution.html.decode(title || ''));
		if(title && title.length > 0) {
			document.title = title + ' - ' + context.titleText;
		} else {
			document.title = context.titleText;
		}
	}

	function handleResponsiveAdjustments(context) {
		$.telligent.evolution.messaging.subscribe('toggle-categories', function(){
			context.categoriesView.toggleResponsiveOpen();
		}, { excludeAutoNameSpaces: true });
	}

	function confirmNavigation(context) {
		// ignore double-confirming when router redirects
		if (context.nav.justRedirected()) {
			return true;
		// if confirmation enabled, confirm
		} else if ($.telligent.evolution.administration.navigationConfirmation.isEnabled()) {
			return confirm(context.navigationConfirmationText);
		}
		return true;
	}

	function parseEffectivePrimaryPanelId(url) {
		var parsedRequest = Navigator.parseRequest(url);
		if (parsedRequest == null)
			return null;
		switch (parsedRequest.type) {
			case 'panel':
				return parsedRequest.panelId;
			case 'plugin':
				return parsedRequest.pluginType;
			default:
				return null;
		}
	}

	function updateBadgeCounts(context, data) {
		if (data.adminCategories && context.categoriesView) {
			data.adminCategories.forEach(function (category) {
				context.categoriesView.setBadgeCount(category.categoryId, category.count);
			});
		}

		if (data.adminPanels && context.categoryView) {
			data.adminPanels.forEach(function (panel) {
				context.categoryView.setBadgeCount(panel.panelId, panel.count);
			});
		}
	}

	function initUi(context) {
		context.categoriesView = new CategoriesView({
			parent: $(context.categoriesContainerId)
		});
		context.categoryView = new CategoryView({
			parent: $(context.categoryContainerId),
			enabledText: context.enabledText,
			disabledText: context.disabledText,
			misconfiguredText: context.misconfiguredText,
			pluginTypesPanelSearchResultTemplateId: context.pluginTypesPanelSearchResultTemplateId,
			model: context.model,
			noResultsMessage: context.noResultsMessage
		});
		context.panelView = new PanelView({
			parent: $(context.contentContainerId),
			customPanelTemplateId: context.customPanelTemplateId,
			loadingIndicatorTemplateId: context.loadingIndicatorTemplateId,
			enabledText: context.enabledText,
			disabledText: context.disabledText,
			misconfiguredText: context.misconfiguredText,
			onLoading: function(options) {
				showLoadingIndicator(context, options);
			},
			onLoaded: function() {
				hideLoadingIndicator(context);
			},
			onRendering: function() {
			},
			onRendered: function() {
			},
			onSideBar: function(panelId, content) {
				if(content !== null) {
					return $.Deferred(function(d){
						context.categoryView.addCustomSidebarContent(panelId, content).then(function(){
							if($.trim(content).length > 0) {
								context.panelView.repositionWithCategory(true);
								context.pluginView.repositionWithCategory(true);
							}
							d.resolve(context.categoryView.getCustomSidebarContent(panelId));
						});
					}).promise();
				} else {
					return context.categoryView.getCustomSidebarContent(panelId);
				}
			},
			onTitle: function(title) {
				applyTitle(context, title);
			},
			onSetExplicitState: function(state) {
				context.nav.setExplicitState(state);
			},
			confirmNavigation: function() {
				return confirmNavigation(context);
			},
			onParsePanelId: parseEffectivePrimaryPanelId
		});
		context.pluginView = new PluginView({
			parent: $(context.contentContainerId),
			panelTemplateId: context.customPanelTemplateId,
			loadingIndicatorTemplateId: context.loadingIndicatorTemplateId,
			onLoading: function(options) {
				showLoadingIndicator(context, options);
			},
			onLoaded: function() {
				hideLoadingIndicator(context);
			},
			onRendering: function() {
			},
			onRendered: function() {
			},
			onTitle: function(title) {
				applyTitle(context, title);
			},
			confirmNavigation: function () {
				return confirmNavigation(context);
			},
			onParsePanelId: parseEffectivePrimaryPanelId
		});
		context.globalSearchView = new GlobalSearchView({
			template: context.globalSearchTemplateId,
			resultTemplate: context.globalSearchResultTemplateId,
			model: context.model,
			headingText: context.searchText,
			noResultsMessage: context.noResultsMessage
		});

		handleResponsiveAdjustments(context);
	}

	function showLoadingIndicator(context, options) {
		if(!context.loadingIndicator && context.loadingIndicatorId) {
			context.loadingIndicator = $(context.loadingIndicatorId);
		}
		if(!context.loadingMessage && context.loadingMessageId) {
			context.loadingMessage = $(context.loadingMessageId);
		}

		// show loading indicator
		if(context.loadingIndicator && context.loadingIndicatorVisible !== true) {
			context.loadingIndicator
				.css({ opacity: 0 })
				.show()
				.evolutionTransform({ opacity: .6 }, { duration: transitionDuration / 2 });
		}

		context.loadingIndicatorVisible = true;

		// show explicit loading message, if provided
		if (options && options.message) {
			var messageCss = {
				display: 'flex',
				width: 250,
				height: 150,
				opacity: context.loadingMessageVisible === true ? 1 : 0
			};

			if (options.width)
				messageCss.width = options.width;
			if (options.height)
				messageCss.height = options.height;

			context.loadingIndicator.find('.spinner').hide();

			context.loadingMessage
				.empty()
				.append(options.message)
				.css(messageCss)
				.evolutionTransform({ opacity: 1}, { duration: transitionDuration / 2 });

			context.loadingMessageVisible = true;
		} else {
			hideLoadingMessage(context);
		}
	}

	function hideLoadingIndicator(context) {
		if (context.loadingIndicator && context.loadingIndicator.is(':visible')) {
			context.loadingIndicator
				.evolutionTransform({ opacity: 0 }, { duration: transitionDuration / 2, complete: function(){
				    if (context.loadingIndicatorVisible !== true) {
					    context.loadingIndicator.hide();
				    }
				}});
		}

		context.loadingIndicatorVisible = false;
		hideLoadingMessage(context);
	}

	function hideLoadingMessage(context) {
		if (context.loadingMessage && context.loadingMessage.is(':visible')) {
			context.loadingMessage
				.evolutionTransform({ opacity: 0 }, { duration: transitionDuration / 2, complete: function(){
				    if (context.loadingMessageVisible !== true) {
    					context.loadingIndicator.find('.spinner').show();
    					context.loadingMessage.css({
    						display: 'none'
    					});
				    }
				}});
		}

		context.loadingMessageVisible = false;
	}

	function handleAutoReloading(context) {
		var pluginRefreshedNotificationId = 'plugins-refreshed-notification';

		// handle receipt of 'refresh' message on the 'plugins' socket channel
		$.telligent.evolution.messaging.subscribe('plugins.initialized', function() {
			// if accessing user didn't recently save a plugin directly
			if(!context.recentlySavedPlugin) {

				// refresh root and category navigation immediately
				context.panelView.refreshingNavigation(true);
				context.pluginView.refreshingNavigation(true);
				context.nav.refresh({
					navigation: true,
					content: false
				}).then(function(){
					context.panelView.refreshingNavigation(false);
					context.pluginView.refreshingNavigation(false);
				});

				// then show actionable notification to refresh panel/plugin
				var cancelRefresh = function() {
					$.telligent.evolution.notifications.hide(pluginRefreshedNotificationId);
				};

				var refresh = function() {
					$.telligent.evolution.administration.refresh();
				}

				$.telligent.evolution.notifications.show(context.pluginsRefreshedNotificationText, {
					id: pluginRefreshedNotificationId,
					type: 'plugins-refreshed-notification',
					onClick: cancelRefresh,
					onClose: cancelRefresh
				});

				// handle immediate user actions in notification to refresh or ignore
				$.telligent.evolution.messaging.unsubscribe(pluginRefreshedNotificationId);
				$.telligent.evolution.messaging.subscribe('plugins-refresh-immediate', pluginRefreshedNotificationId, refresh);
			}
		}, { excludeAutoNameSpaces: true });
	}

	function handleEvents(context) {
		$(global).on('hashchange', function(e){
			var handleState = HandleState.Unhandled;

			// try panel nav
			if(context.panelView) {
				handleState = context.panelView.attemptToHandleHashChange({
					processAndRenderCurrentHashData: function() {
						var hashData = $.telligent.evolution.url.hashData();
						context.nav.processNavigationRequest(hashData);
					}
				});
			}

			// try plugin nav
			if(handleState == HandleState.Unhandled && context.pluginView) {
				handleState = context.pluginView.attemptToHandleHashChange();
			}

			// some other nav
			if(handleState == HandleState.Unhandled) {
				var hashData = $.telligent.evolution.url.hashData();
				// see if this is processable by the shell
				if (context.nav.canProcessNavigationRequest(hashData)) {
					// if so, confirm if necessary
					if (!confirmNavigation(context)) {
						handleState = HandleState.UserDenied;
					} else {
						context.nav.processNavigationRequest(hashData);
					}
				}
			}

			context.logoutWarningView.updateReturnUrl();

			// if the user denied the hash-based navigation attempt, replace the previous hash
			if (handleState == HandleState.UserDenied) {
				var oldHash = e.originalEvent.oldURL.split('#')[1];
				history.replaceState(null, null, document.location.pathname + '#' + oldHash);
			}
		});

		$.telligent.evolution.messaging.subscribe('plugin-saved', function(data){
			// track that a plugin was recently saved by the accessing user
			context.recentlySavedPlugin = true;
			clearTimeout(context.recentlySavedPluginTimeout)
			context.recentlySavedPluginTimeout = setTimeout(function(){
				context.recentlySavedPlugin = false;
			}, 10 * 1000);

			if(context.categoryView) {
				context.categoryView.updatePluginState(data.pluginTypeName, data.state);
			}
			if(context.pluginView) {
				context.pluginView.updatePluginState(data.pluginTypeName, data.state);
			}
		}, { excludeAutoNameSpaces: true });

		$.telligent.evolution.shortcuts.register(['SLASH', 'ALT + SLASH'], function(e) {
			if (!e.isInput || e.combination === 'ALT + SLASH') {
				context.globalSearchView.render();
				return false;
			}
		}, { description: context.searchAdministrationText });

		$.telligent.evolution.messaging.subscribe('search-panels', function(data){
			context.globalSearchView.render();
		}, { excludeAutoNameSpaces: true });

		$.telligent.evolution.messaging.subscribe('plugintypespanel-expand', function(data){
			context.categoryView.expandPluginTypesPanel($(data.target).data('typename'));
		}, { excludeAutoNameSpaces: true });

		$.telligent.evolution.messaging.subscribe('plugintypespanel-collapse', function(data){
			context.categoryView.collapsePluginTypesPanel($(data.target).data('typename'));
		}, { excludeAutoNameSpaces: true });

		$.telligent.evolution.messaging.subscribe('_badgedPanels.countsChanged', function (data) {
			updateBadgeCounts(context, data);
		}, { excludeAutoNameSpaces: true });

		handleAutoReloading(context);
	}

	var Controller = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			start: function() {
				initNav(context);
				initUi(context);

				handleEvents(context);

				context.nav.processNavigationRequest($.telligent.evolution.url.hashData());
				context.logoutWarningView.updateReturnUrl();
			}
		}
	};

	return Controller;

}, jQuery, window);