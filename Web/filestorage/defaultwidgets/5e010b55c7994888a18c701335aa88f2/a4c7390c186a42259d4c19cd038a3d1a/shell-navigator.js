/*

Administration Shell Navigator Module

var navigator = new Navigator(options)
	options:
		// inverted loading
		onLoadCategories: function()
		onLoadCategory: function(categoryId)
		onLoadAdministrativePanel: function(panelId, extraParameters)
		onLoadPluginPanel: function(pluginTypesPanelTypeName, pluginTypeName)

		// rendering
		onRenderCategories: function(content)
		onRenderCategory: function({ categoryId, content, badgeCount })
		onRenderAdministrativePanel: function(content)
		onRenderPluginPanel: function(content)

		// emptying (unrendering)
		onEmptyCategory: function()
		onEmptyContent: function()
		onHideCategory: function()
		onShowCategory: function()

		// adjusting existing renders
		onSelectCategory: function(categoryId, shouldScroll)
		onSelectPanel: function(panelId, shouldScroll)
		onSelectPluginPanel: function(pluginTypeName, pluginTypesPanelName, shouldScroll)

		// loading indicators
		onLoading: function()
		onLoaded: function()

	Methods:
		request:
			_aptype: root|category|panel|plugin
			_apcategoryid: guid
			_appanelid: guid
			_applugintypescategory: string
			_applugintype: string
		processNavigationRequest: function(request)
		canProcessNavigationRequest: function(request)
		setExplicitState: function(state)

*/
define('Navigator', function($, global, undef) {
	var platformParameters = [
		'_aptype',
		'_appanelid',
		'_apcategoryid',
		'_applugintypescategory',
		'_applugintype',
		'_appaneltype'
	];

	var defaults = {
		// options
		onLoadCategories: function() { },
		onLoadCategory: function(categoryId) { },
		onLoadAdministrativePanel: function(panelId, extraParameters) { },
		onLoadPluginPanel: function(pluginTypesPanelTypeName, pluginTypeName) { },

		onRenderCategories: function(content) { },
		onRenderCategory: function(options) { },
		onRenderAdministrativePanel: function(content) { },
		onRenderPluginPanel: function(content) { },

		onEmptyCategory: function() { },
		onEmptyContent: function() { },
		onHideCategory: function() { },
		onShowCategory: function() { },

		onSelectCategory: function(categoryId, shouldScroll) { },
		onSelectPanel: function(panelId, shouldScroll) { },
		onSelectPluginPanel: function(pluginTypeName, pluginTypesPanelName, shouldScroll) { },

		onLoading: function() { },
		onLoaded: function() { },

		// state
		loadingDepth: 0,
		current: {
			rooted: false,
			categoryId: null,
			panelId: null,
			pluginId: null,
			pluginType: null,
			pluginTypesCategory: null
		}
	};

	/*
	request:
		_aptype: root|category|panel|plugin
		_apcategoryid: guid
		_appanelid: guid
		_applugintypescategory: string
		_applugintype: string
	returns:
		type: root|category|panel|plugin
		categoryId: guid
		panelId: guid
		pluginTypesCategory: string
		pluginType: string
	 */
	function parseRequest(request) {
		var req = {
			type: request['_aptype'],
			categoryId: request['_apcategoryid'],
			panelId: request['_appanelid'],
			pluginTypesCategory: request['_applugintypescategory'],
			pluginType: request['_applugintype'],
			panelType: request['_appaneltype'],
			extraParameters: null
		};
		if(req.type === undef) {
			req.type = "root";
		}
		var extraParameters = null;
		$.each(request, function(k,v) {
			if($.inArray(k, platformParameters) < 0) {
				extraParameters = extraParameters || {};
				extraParameters[k] = v;
			}
		});
		if(extraParameters) {
			req.extraParameters = $.telligent.evolution.url.serializeQuery(extraParameters);
		}
		return req;
	}

	function emptyContent(context) {
		context.current.panelId = null;
		context.current.pluginType = null;
		if(context.onEmptyContent) {
			context.onEmptyContent();
		}
	}

	function emptyCategory(context) {
		context.current.categoryId = null;
		context.current.pluginTypesCategory = null;
		if(context.onEmptyCategory) {
			context.onEmptyCategory();
		}
	}

	function hideCategory(context) {
		if(context.onHideCategory) {
			context.onHideCategory();
		}
	}

	function showCategory(context) {
		if(context.onShowCategory) {
			context.onShowCategory();
		}
	}

	function buildStubPromise(data) {
		return $.Deferred(function(d){
			d.resolve(data);
		}).promise();
	}

	function loadRootState(context, force) {
		if (context.current.rooted && !force) {
			return buildStubPromise({});
		} else {
			return $.Deferred(function(d){
				incrementLoading(context, force);
				context.onLoadCategories()
					.then(function(r){
						decrementLoading(context);
						var result = $.trim(r.categoriesHtml);
						if(result.length > 0)
							context.onRenderCategories(result);
						context.current.rooted = true;
						d.resolve({
							firstCategoryUrl: r.firstCategoryUrl
						});
					})
					.catch(function(){
						decrementLoading(context);
						context.current.rooted = false;
						d.reject();
					});
			}).promise();
		}
	}

	function loadCategoryState(context, categoryId, force) {
		if (context.current.categoryId == categoryId && !force) {
			return buildStubPromise({
				categoryId: context.current.categoryId
			});
		} else {
			return $.Deferred(function(d){
				incrementLoading(context, force);
				context.onLoadCategory(categoryId)
					.then(function(r){
						decrementLoading(context);
						var result = $.trim(r.categoryHtml);
						if(result.length > 0) {
							context.onRenderCategory({ categoryId: categoryId, content: result, badgeCount: r.categoryBadgeCount });
							context.current.categoryId = r.categoryId;
							var shouldHideCategory = $(result).data('category-hidden') == true;
							if(shouldHideCategory) {
								hideCategory(context);
							} else {
								showCategory(context);
							}
						} else {
							emptyCategory(context);
						}
						d.resolve({
							categoryId: r.categoryId,
							firstPanelUrl: r.firstPanelUrl
						});
					})
					.catch(function(){
						decrementLoading(context);
						context.current.categoryId = null;
						d.reject();
					});
			}).promise();
		}
	}

	function loadPanelState(context, panelId, panelType, extraParameters, shouldRender, force) {
		if (context.current.panelId == panelId && !context.refreshing && !force) {
			return buildStubPromise({
				panelId: context.current.panelId,
				categoryId: context.current.categoryId
			});
		} else {
			return $.Deferred(function(d){
				incrementLoading(context, force);
				context.onLoadAdministrativePanel(panelId, extraParameters)
					.then(function(r){
						var isExplicit = panelType == 'explicit';
						decrementLoading(context);
						if(!isExplicit)
							emptyContent(context);
						var result = $.trim(r.panelHtml);
						if(result.length > 0) {
							context.onRenderAdministrativePanel({
								panelId: panelId,
								isExplicit: isExplicit,
								rawPanelContent: result,
								panelName: $.trim(r.panelName),
								panelDescription: $.trim(r.panelDescription),
								panelCssClass: $.trim(r.panelCssClass),
								backUrl: r.backUrl,
								backLabel: r.backLabel,
								onRefresh: function() {
									context.refreshing = true;
									loadPanelState(context, panelId, panelType, extraParameters, shouldRender, true);
									context.refreshing = false;
								}
							});
							context.current.panelId = r.panelId;
						} else {
							emptyContent(context);
						}
						d.resolve({
							categoryId: r.categoryId,
							panelId: r.panelId
						});
					})
					.catch(function(xhr){
						if (xhr && xhr.responseText) {
							var response = $.isPlainObject(xhr.responseText) ?  xhr.responseText : JSON.parse(xhr.responseText);
							if (response && response.error && !response.loggedIn) {
									global.location.reload(true);
							}
						}

						decrementLoading(context);
						context.current.panelId = null;
						d.reject();
					});
			}).promise();
		}
	}

	function loadPluginPanelState(context, pluginTypesPanelTypeName, pluginTypeName, shouldRender, force) {
		if (context.current.pluginType == pluginTypeName && !force) {
			return buildStubPromise({
				categoryId: context.current.categoryId,
				pluginTypesCategory: context.current.pluginTypesCategory,
				pluginType: context.current.pluginType
			});
		} else {
			return $.Deferred(function(d){
				incrementLoading(context, force);
				context.onLoadPluginPanel(pluginTypesPanelTypeName, pluginTypeName)
					.then(function(r){
						decrementLoading(context);
						if(shouldRender) {
							emptyContent(context);
							var result = $.trim(r.pluginHtml);
							if(result.length > 0) {
								context.onRenderPluginPanel({
									panelId: $.trim(r.pluginPanelTypeName),
									pluginName: $.trim(r.pluginName),
									rawPanelContent: result,
									pluginDescription: $.trim(r.pluginDescription),
									pluginState: $.trim(r.pluginState),
									onRefresh: function() {
										context.refreshing = true;
										loadPluginPanelState(context, pluginTypesPanelTypeName, pluginTypeName, shouldRender, true);
										context.refreshing = false;
									}
								});
								context.current.pluginType = r.pluginPanelTypeName;
							} else {
								emptyContent(context);
							}
						}
						d.resolve({
							pluginType: r.pluginPanelTypeName,
							pluginTypesCategory: r.pluginCategoryTypeName,
							categoryId: r.categoryId
						});
					})
					.catch(function(xhr){
						if (xhr && xhr.responseText) {
							var response = $.isPlainObject(xhr.responseText) ?  xhr.responseText : JSON.parse(xhr.responseText);
							if (response && response.error && !response.loggedIn) {
									global.location.reload(true);
							}
						}
						decrementLoading(context);
						context.current.pluginType = null;
						d.reject();
					});
			}).promise();
		}
	}

	/*
		options
			navigation: false|true  // should load and render navigation
			content: false|true     // should load and render content
			force: false|true // force reload if not already loaded (applies only to navigation)
	*/
	function processNavigationRequest(context, request, options) {
		return $.Deferred(function(d){
			switch(request.type) {
				case 'root':
					emptyCategory(context);
					emptyContent(context);
					loadRootState(context).then(function(r){
						// will be undefined if loaded due to explicit navigation
						if(r.firstCategoryUrl) {
							context.redirected = true;
							// redirect to first category
							global.location.href = $.telligent.evolution.url.modify({
								hash: r.firstCategoryUrl
							});
						}
						d.resolve();
					});
					break;
				case 'category':
					emptyContent(context);
					$.when(
						loadCategoryState(context, request.categoryId).then(function(r){
							// will be undefined if loaded due to explicit navigation
							if(r.firstPanelUrl) {
								context.redirected = true;
								// redirect to first panel in category
								global.location.href = $.telligent.evolution.url.modify({
									hash: r.firstPanelUrl
								});
							}
						}),
						loadRootState(context).then(function(r){
							if(context.onSelectCategory) {
								context.onSelectCategory(request.categoryId, true);
							}
						})
					).then(function(){
						d.resolve();
					})
					break;
				case 'panel':
					loadPanelState(context, request.panelId, request.panelType, request.extraParameters, options.content, options.content && options.force).then(function(r){
						if(options.navigation) {
							if (r.categoryId !== null) {
								$.when(
									loadCategoryState(context, r.categoryId, options.navigation && options.force).then(function(){
										if(context.onSelectPanel) {
											context.onSelectPanel(request.panelId, !options.force);
										}
									}),
									loadRootState(context, options.navigation && options.force).then(function(){
										if(context.onSelectCategory) {
											context.onSelectCategory(r.categoryId, !options.force);
										}
									})
								).then(function(){
									d.resolve();
								})
							} else if (context.current.categoryId === null) {
								emptyCategory(context);
								loadRootState(context, options.navigation && options.force).then(function(){
									if(context.onSelectCategory) {
										context.onSelectCategory(null, !options.force);
									}
									d.resolve();
								});
							} else {
								d.resolve();
							}
						} else {
							d.resolve();
						}
					});
					break;
				case 'plugin':
					loadPluginPanelState(context, request.pluginTypesCategory, request.pluginType, options.content, options.content && options.force).then(function(r){
						if(options.navigation) {
							$.when(
								loadCategoryState(context, r.categoryId, options.navigation && options.force).then(function(){
									if(context.onSelectPluginPanel) {
										context.onSelectPluginPanel(request.pluginType, request.pluginTypesCategory, !options.force);
									}
								}),
								loadRootState(context, options.navigation && options.force).then(function(){
									if(context.onSelectCategory) {
										context.onSelectCategory(r.categoryId, !options.force);
									}
								})
							).then(function(){
								d.resolve();
							})
						} else {
							d.resolve();
						}
					});
					break;
			}
		}).promise();
	}

	function setExplicitState(context, state) {
		context.current.panelId = state.panelId;
	}

	function incrementLoading(context, preventOnLoading) {
		if(context.loadingDepth === 0 && context.onLoading && !preventOnLoading)
			context.onLoading();
		context.loadingDepth++;
	}

	function decrementLoading(context) {
		context.loadingDepth--;
		if(context.loadingDepth <= 0 && context.onLoaded)
			context.onLoaded();
	}

	var Navigator = function(options){

		var context = $.extend({}, defaults, options);

		return {
			/*
			request:
				_aptype: root|category|panel|plugin
				_apcategoryid: guid
				_appanelid: guid
				_applugintypescategory: string
				_applugintype: string
			 */
			processNavigationRequest: function(request) {
				var parsedRequest = parseRequest(request);
				context.lastRequest = parsedRequest;
				return processNavigationRequest(context, parsedRequest, {
					navigation: true,
					content: true,
					force: false
				});
			},
			/*
			Returns whether it knows how to process the request and processing it would result in an actual navigation
			request:
				_aptype: root|category|panel|plugin
				_apcategoryid: guid
				_appanelid: guid
				_applugintypescategory: string
				_applugintype: string
			 */
			canProcessNavigationRequest: function(request) {
				var parsedRequest = parseRequest(request);

				// navigation within same entity, so no
				if ((parsedRequest.panelId && context.current.panelId == parsedRequest.panelId) ||
					(parsedRequest.pluginTypesCategory && context.current.pluginTypesCategory == parsedRequest.pluginTypesCategory) ||
					(parsedRequest.pluginType && context.current.pluginType == parsedRequest.pluginType) ||
					(parsedRequest.pluginId && context.current.pluginId == parsedRequest.pluginId))
					return false;

				// something else
				return true;
			},
			/*
			options:
				navigation: true
				content: false
			*/
			refresh: function(options) {
				if (context.lastRequest) {
					return processNavigationRequest(context, context.lastRequest, {
						navigation: options.navigation,
						content: options.content,
						force: true
					});
				} else {
					return $.Deferred(function(d){
						d.resolve();
					}).promise();
				}
			},
			setExplicitState: function(state) {
				setExplicitState(context, state);
			},
			justRedirected: function() {
				var redirected = context.redirected;
				context.redirected = false;
				return redirected;
			}
		}
	};
	Navigator.parseRequest = function(url) {
		return parseRequest($.telligent.evolution.url.hashData(url));
	};

	return Navigator;

}, jQuery, window);
