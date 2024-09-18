/*
StudioDockViewController:

	Renders and manages docked views with support for
		resizing,
		auto-hiding,
		pinning,
		asynchronous loading of panels,
		panel event model,
		and storing panel UI state in local storage.

	var controller = new StudioDockViewController(options);

	options
		container
		viewWrapperTemplate: '',
		viewTabTemplate: ''
		sized: function() {} // callback when sized in a way that should affect host

	Methods:
		register(options)
			options:
				name: '',
				id: '',
				render: function(options) {} // returns promise when done
					options:
						container // should append content to container
						editorTabState // the currently selected editor tab state, if available. Typically a 'request' object
				cleanup: function() {},
				setEditorTabState: function(state) {}
				hidden: function() {},
				shown: function(showOptions) {}, // explicit state (any state) passed to panel from .show(options)
				resized: function() {}
		cleanup()
		setEditorTabState(state) // for passing data to already-registered docked view about the newly-selected editor tab
		show(tabId, showOptions)
			// opens (and pins) to panel id
			id: id of tab
			showOptions: optional state to pass to panel's 'shown' handler
*/
define('StudioDockViewController', [ 'StudioStorageProxy' ], function(StudioStorageProxy, $, global, undef) {

	var state = {
		closed: 'closed',
		overlaid: 'overlaid',
		docked: 'docked'
	};

	var defaults = {
		container: '',
		viewWrapperTemplate: 'studioShell-dockWrapper',
		viewTabTemplate: 'studioShell-dockTab',
		sized: function(height) { }
	};

	function initUi(context) {
		context.viewWrapperTemplate = $.telligent.evolution.template(context.viewWrapperTemplate);
		context.viewTabTemplate = $.telligent.evolution.template(context.viewTabTemplate);

		context.viewWrapper = $(context.viewWrapperTemplate({})).appendTo(context.container).addClass(context.currentState);
		context.tabWrapper = context.viewWrapper.find('.dock-view-tabs').first();
		context.dockViews = context.viewWrapper.find('.dock-views').first();
		context.dragHandle = context.viewWrapper.find('.dock-drag-handle').first();
		context.dockPinWrapper = context.viewWrapper.find('.dock-pin-wrapper').first();
		context.dockPin = context.viewWrapper.find('.dock-pin').first();
		context.window = $(global);

		// set up drag resizing
		context.dragHandle.draggable({
			axis: 'y',
			refreshPositions: true,
			start: function( event, ui ) {
				context.preDragHeight = context.height;
				context.dragging = true;
				context.dragHandle.addClass('dragging');
				$.fn.evolutionTip.hide();
			},
			stop: function( event, ui ) {
				context.dragHandle.removeClass('dragging');
				$.fn.evolutionTip.hide();
				context.dragging = false;
				context.height = context.preDragHeight - ui.position.top;
				context.viewWrapper.css({
					height: context.height
				});
				context.dragHandle.css({
					top: 0
				});
				sendHeightToHost(context);
				saveDockStateInStorage(context, {
					height: context.height
				});
			}
		});
	}

	// Returns dock state
	//   state
	//   height
	//   tabId
	function getDockStateFromStorage(context) {
		if(!context.storageProxy) {
			context.storageProxy = new StudioStorageProxy($.telligent.evolution.user.accessing);
		}
		var savedState = context.storageProxy.get('_dock_view_state');
		// height not to exceed current max height, in case window used to be larger
		// and not to be too small to see either
		if ((savedState && savedState.height >= $.telligent.evolution.administration.panelWrapper().outerHeight() * .8) ||
			(savedState && (!savedState.height || savedState.height < 20)))
		{
			savedState.height = ($.telligent.evolution.administration.panelWrapper().outerHeight() * .8);
		}
		return (savedState || {
			state: state.closed,
			height: ($.telligent.evolution.administration.panelWrapper().outerHeight() / 2),
			tabId: ''
		});
	}

	// Sets dock state
	//   state
	//   height
	//   tabId
	function saveDockStateInStorage(context, newState) {
		if(!context.storageProxy) {
			context.storageProxy = new StudioStorageProxy($.telligent.evolution.user.accessing);
		}
		context.storageProxy.set('_dock_view_state',
			$.extend(getDockStateFromStorage(context), newState));
	}

	function handleEvents(context) {
		context.tabWrapper.on('click', 'a', function(e){
			e.preventDefault();

			var tabId = $(e.target).data('tabid');

			if(context.currentState === state.closed) {
				setState(context, state.overlaid, tabId);
			} else if(context.currentState === state.overlaid || context.currentState === state.docked) {
				if(context.currentTabId === tabId) {
					setState(context, state.closed);
					sendHeightToHost(context, context.closedHeight);
				} else {
					setState(context, context.currentState, tabId);
				}
			}

			$.fn.evolutionTip.hide();

			return false;
		});

		context.dockPin.on('click', function(e) {
			e.preventDefault();

			var newState = null;
			var currentState = context.currentState
			if(context.currentState === state.overlaid) {
				newState = state.docked;
			} else if(context.currentState === state.docked) {
				newState = state.overlaid;
			} else if(context.currentState === state.closed) {
				// not possible
				return false;
			}

			if(newState) {
				setState(context, newState);

				// callback to host - entering docked state
				if(newState === state.docked) {
					sendHeightToHost(context);
				// callback to host - exiting docked state
				} else if(newState !== state.docked && currentState === state.docked) {
					sendHeightToHost(context, context.closedHeight);
				}
			}

			$.fn.evolutionTip.hide();

			return false;
		});

		context.viewWrapper.on('glowDelayedMouseEnter', 200, function(e){
			// re-open on mouse over if a previous tab was already loaded via click
			if(context.currentState === state.closed && context.currentTabId) {
				var tabId = context.currentTabId;
				setState(context, state.overlaid, tabId);
			}
		});

		context.viewWrapper.on('glowDelayedMouseLeave', 200, function(e){
			// ignore mousing while dragging
			if(context.dragging)
				return;

			// only handle delayed mouse leave if
			// not exiting the entire browser window
			var y = e.clientY || e.pageY;
			if(y < context.window.height()) {
				if(context.currentState === state.overlaid) {
					hideRenderedDockViews(context);
					setState(context, state.closed);
				}
			}
		});
	}

	function loadAndRenderTab(context, tabId, newState) {
		return $.Deferred(function(d){
			var tabContext = context.tabs[tabId];
			if(!tabContext) {
				d.resolve();
				return;
			}

			saveDockStateInStorage(context, {
				tabId: tabId
			});

			if(!tabContext.rendered) {
				tabContext.rendered = $('<div></div>').appendTo(context.dockViews);
				tabContext.render({
					container: tabContext.rendered,
					editorTabState: context.currentEditorTabState
				}).then(function(){
					// hide existing tabs
					hideRenderedDockViews(context);

					if (newState != state.closed) {
						context.currentTabId = tabId;
						tabContext.rendered.show();
						if(tabContext.shown) {
							context.animationCompleted.then(function () {
								tabContext.shown();
							});
						}
					}
					d.resolve();
				});
			} else {
				// hide existing tabs
				hideRenderedDockViews(context);

				if (newState != state.closed) {
					context.currentTabId = tabId;
					tabContext.rendered.show();
					if (tabContext.shown) {
						context.animationCompleted.then(function () {
							tabContext.shown();
						});
					}
				}
				d.resolve();
			}
		}).promise();
	}

	/*
		Sets state of the shell
		Can be assuemed that if transitioning to a visible state (tab loaded)
		that a tab is already loaded and exists in context.currentTabId

		returns promise that resolves once dock's state is set (and potentially any panel is loaded)
	 */
	function setState(context, newState, tabId) {
		return $.Deferred(function(d){

			var originalState = context.currentState;

			context.loadingTab = null;

			// available state:
			//   context.tabs
			//   context.currentState
			//   context.currentTabId
			//   context.tabs[context.currentTabId].rendered

			// apply class to wrapper
			context.viewWrapper
				.removeClass('overlaid closed docked')
				.addClass(newState);

			var animationDeferred;
			context.animationCompleted = $.Deferred(function (d) {
				animationDeferred = d;
			}).promise();

			// update wrapper UI for new state
			if(originalState != newState) {
				if(newState === state.closed) {
					context.dockPin.attr('data-tip', context.dockPin.attr('data-tip-closed'));
					hideRenderedDockViews(context);
					context.viewWrapper.animate({
						height: context.tabWrapper.outerHeight()
					}, {
						duration: 150,
						complete: function() {
							sendHeightToHost(context, context.closedHeight);
							animationDeferred.resolve();
						}
					})
				} else if(newState === state.overlaid) {
					context.dockPin.attr('data-tip', context.dockPin.attr('data-tip-overlaid'));
					if(originalState == state.closed) {
						context.viewWrapper.animate({
							height: context.height
						}, {
							duration: 150,
							complete: function() {
								sendHeightToHost(context);
								animationDeferred.resolve();
							}
						})
					}
				} else if(newState === state.docked) {
					context.dockPin.attr('data-tip', context.dockPin.attr('data-tip-docked'));
					if(originalState == state.closed) {
						context.viewWrapper.animate({
							height: context.height
						}, {
							duration: 150,
							complete: function() {
								sendHeightToHost(context);
								animationDeferred.resolve();
							}
						})
					}
				}
			} else {
				animationDeferred.resolve();
			}

			// hide tips
			$.fn.evolutionTip.hide();

			// save current state
			saveDockStateInStorage(context, {
				state: newState,
				tabId: tabId
			});

			// if requested to show a tab, first load it
			if(tabId) {
				context.loadingTab = tabId;
				context.tabWrapper.find('.dock-view-tab-name').removeClass('selected').each(function(){
					$(this).attr('data-tip', $(this).attr('data-tip-not-opened'));
				})

				var selectedTab = context.tabWrapper.find('.dock-view-tab-name[data-tabid="' + tabId + '"]');
				selectedTab.addClass('selected');
				selectedTab.attr('data-tip', selectedTab.attr('data-tip-opened'));

				loadAndRenderTab(context, tabId, newState).then(function(){
					// if request hasn't changed, render
					if(context.loadingTab === tabId) {
						context.currentState = newState;
					}
					context.loadingTab = null;
					d.resolve();
				});
			// otherwise just set state
			} else {
				context.currentState = newState;
				d.resolve();
			}

		}).promise();
	}

	function hideRenderedDockViews(context) {
		$.each(context.tabs, function(id, tabContext) {
			if(tabContext.rendered && tabContext.rendered.is(':visible')) {
				tabContext.rendered.hide();
				if(tabContext.hidden)
					tabContext.hidden();
			}
		});
	}

	function sendHeightToHost(context, explicitHeight) {
		if(context.sized) {
			context.sized(explicitHeight || context.viewWrapper.outerHeight());
		}
	}

	function schedulePostRegister(context) {
		global.clearTimeout(context.initTimeout)
		context.initTimeout = global.setTimeout(function(){
			var savedState = getDockStateFromStorage(context);
			context.height = savedState.height;
			setState(context, savedState.state, savedState.tabId).then(function(){
				if (context.currentState == state.closed) {
					hideRenderedDockViews(context);
				}
			});
			if (context.currentState != state.closed) {
				sendHeightToHost(context);
			}
		}, 10);
	}

	function StudioDockViewController(options) {
		var context = $.extend({}, defaults, options || {});
		context.tabs = {};
		context.height = $.telligent.evolution.administration.panelWrapper().outerHeight() / 2;
		context.currentTabId = null;
		context.currentState = state.closed;
		context.closedHeight = null;

		initUi(context);
		handleEvents(context);

		return {
			register: function(options) {
				if(!options)
					return;

				var tab = $(context.viewTabTemplate({
					tabId: options.id,
					tabName: options.name
				}));

				var tabLink = tab.find('.dock-view-tab-name');
				tabLink.attr('data-tip', tabLink.attr('data-tip-not-opened'));

				context.tabWrapper.append(tab);

				context.tabs[options.id] = options;

				context.closedHeight = context.viewWrapper.outerHeight();

				schedulePostRegister(context);
			},
			cleanup: function() {
				$.each(context.tabs, function(id, tab) {
					if(tab.cleanup) {
						tab.cleanup();
					}
				});
			},
			setEditorTabState: function(state) {
				//tabContext.rendered
				context.currentEditorTabState = state;
				$.each(context.tabs, function(id, tab) {
					if(tab.setEditorTabState) {
						tab.setEditorTabState(state);
					}
				});
			},
			// explicitly open a tab panel, passing optional state to its 'shown' handler
			show: function(tabId, options){
				// use existing open state, if available
				// otherwise, use overlay
				if(options) {
					var showState = context.currentState;
					if(showState === state.closed) {
						showState = showState = state.overlaid;
					}

					setState(context, showState, tabId).then(function(){
						var tabContext = context.tabs[tabId];
						if(tabContext && tabContext.shown) {
							tabContext.shown(options);
						}
					});
				}
			}
		}
	}

	return StudioDockViewController;

}, jQuery, window);
