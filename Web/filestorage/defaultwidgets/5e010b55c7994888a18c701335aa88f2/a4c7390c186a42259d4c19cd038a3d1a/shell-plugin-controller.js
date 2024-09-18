/*

Plugin Controller

Instantiated for each rendering of a plugin panel view
Exists in the context of a running $.telligent.evolution.administration API instance,
with full access to the .administration API

Consolidates interactions with navigating, enabling, and confiuring a tree of plugins

PluginController.registerRoot(options)

PluginController.register(options)

options:

	model:  // model instance
	pluginHeaderTemplateId: // (string)
	childPluginSearchResultTemplateId: // (string)

	name: // (string)
	description: // (string)
	pluginTypeName: // (string)
	pluginTypesPanelTypeName: // (string)
	state: // (string)
	disableable: // bool
	hasParents: // bool
	hasChildren: // bool

*/
define('PluginController', [
		'QuickSearch',
		'Utility' ],
	 function(
		QuickSearch,
		Utility,
		$, global, undef)
{
	var messaging = $.telligent.evolution.messaging,
		templating = $.telligent.evolution.template,
		ui = $.telligent.evolution.ui,
		administration = $.telligent.evolution.administration,
		headerTemplate,
		tabLoaderMap = {
			'options': 'getPluginConfigTab',
			'scripted-content-fragments': 'getScriptedContentFragmentsTab',
			'translations': 'getPluginTranslationsTab',
			'sub-plugins': 'getPluginChildrenTab',
			'exceptions': 'getPluginExceptionsTab'
		};

	var PluginController = {
		register: function(options) {
			var context = options;
			var tabs = [];
			var actions = [];
			var selectedTabId = -1;
			var saveFunctions = [];
			var actionWrapper;
			var suppress = false;
			var panelId = administration.panelId();
			var isSaving = false;

			function getTab(id) {
				return $.grep(tabs, function(t) { return t.id == id })[0];
			}

			function updateActionVisibility() {
				actionWrapper.uilinks('remove', '.action-link')

				$.each(actions, function(i, action) {
				   if (action.show == 'always' || action.tabId == selectedTabId) {
					   var a = $('<a href="#"></a>').attr({
						   id: action.id,
						   'data-messagename': 'plugin-action',
						   'class': 'action-link'
					   }).html(action.label);

					   actionWrapper.uilinks('add', a, {
						   className: 'navigation-list-item'
					   });
				   }
				});
			}

			function selectTab(id) {
				if (id == selectedTabId) {
					return;
				}

				try {
					getTab(selectedTabId).unselected();
				} catch(e) {}

				// highlight tab
				administration.header().find('ul.filter').children('li.filter-option').removeClass('selected');
				administration.header().find('li.filter-option[data-tabid="' + id + '"]').addClass('selected');

				selectedTabId = id;
				try {
					getTab(selectedTabId).selected();
				} catch(e) {}

				updateActionVisibility();
			}

			function validate(navigateToError) {
				var isValid = true;
				var invalidTabId = null;
				for (var i = 0; i < tabs.length && isValid; i++) {
					try {
						if (tabs[i].validate() === false) {
							invalidTabId = tabs[i].id;
							isValid = false;
						}
					} catch (e) { }
				}

				if (invalidTabId !== null && navigateToError === true) {
					selectTab(invalidTabId);
				}

				if (!isValid || isSaving) {
					administration.header().find('.button[data-messagename="save-plugin"]').addClass('disabled');
				} else {
					administration.header().find('.button[data-messagename="save-plugin"]').removeClass('disabled');
				}

				return isValid;
			}

			// unsuppression after navigating back to this plugin view from a sub-plugin
			var shownId = messaging.subscribe('administration.panel.shown', function(data) {
			   if (data.panelId && data.panelId == panelId)  {
				   suppress = false;
				   messaging.unsuppress(panelId);
			   } else if (suppress) {
				   messaging.suppress(panelId);
			   }
			}, { excludeAutoNameSpaces: true });

			var unloadedId = messaging.subscribe('administration.panel.unloaded', function(data) {
				if (data.panelId && data.panelId == panelId)  {
					messaging.unsubscribe(shownId);
					messaging.unsubscribe(unloadedId);
				}
			}, { excludeAutoNameSpaces: true });

			// navigation to sub-plugins
			messaging.subscribe('dependent-plugin', function(data) {
				suppress = true;
				messaging.suppress(panelId);

				var link = $(data.target),
					pluginTypeName = link.data('plugintypename'),
					name = link.data('name'),
					state = link.data('state'),
					url = link.data('url');

				administration.open({
					name: name,
					cssClass: 'plugin-type ' + (state || '').toLowerCase(),
					content: context.model
						.getPluginPanel(context.pluginTypesPanelTypeName, pluginTypeName, false)
						.then(function(r){
							return r.pluginHtml;
						})
				});
			});

			// tabs
			messaging.subscribe('plugin-tab', function(data){
				selectTab($(data.target).data('tabid'));
				$.fn.uilinks.forceRender();
			});

			messaging.subscribe('plugin-action', function(data){
				var actionId = $(data.target).attr('id');
				$.each(actions, function(i, action) {
				   if (action.id == actionId) {
					   messaging.publish(action.messageName, action.messageData || {});
				   }
				});
			});

			// saving
			messaging.subscribe('save-plugin', function(data){

				var link = $(data.target);
				var enabledCb = link.closest('fieldset').find('.field-item.enabled input[type="checkbox"]');
				var misconfiguredLabel = link.closest('fieldset').find('.misconfigured');
				var pluginTypeName = link.data('plugintypename'),
					pluginName = link.data('pluginname'),
					enabled = enabledCb.is(':checked'),
					wasEnabled = enabledCb.data('wasenabled') === true,
					disableable = link.data('disableable'),
					hasParents = link.data('hasparents');

				if (!validate(true)) {
					return;
				}

				if(hasParents && enabled !== wasEnabled) {
					if (!isSaving) {
						isSaving = true;
						administration.header().find('.button[data-messagename="save-plugin"]').addClass('disabled');

						context.model.getRootParentPlugins(pluginTypeName, enabled).then(function(parentPanelContent){
							var parentPanelContentNode = $(parentPanelContent);

							parentPanelContentNode.on('click', 'a.save', function(e){
								e.preventDefault();

								var saves = [];

								var hasAtLeastOneEnabledParent = false;

								// save the enablement state of the plugin's parents
								parentPanelContentNode.find('input[type="checkbox"]').each(function(){
									var cb = $(this),
										enabled = cb.is(':checked'),
										typeName = cb.data('plugintypename');

									hasAtLeastOneEnabledParent = hasAtLeastOneEnabledParent || enabled;
									saves.push(context.model.savePlugin({
										pluginTypeName: typeName,
										enabled: enabled
									}));
								});

								$.each(saveFunctions, function() {
									var f = this;
									saves.push($.Deferred(function(d) {
										try {
											f({
												success: function() {
													d.resolve();
												},
												error: function() {
													d.reject();
												}
											});
										} catch(e) {
											d.reject();
										}
									}).promise());
								});

								$.when.apply($, saves).then(function(){
									$.glowModal.close();
									$.telligent.evolution.messaging.publish('plugin-saved', {
										success: true,
										pluginTypeName: pluginTypeName,
										state: hasAtLeastOneEnabledParent ? 'Enabled' : 'Disabled',
										synthetic: true
									});
								})
								.then(function(){
									$.telligent.evolution.notifications.show(context.savedText);
								})
								.always(function() {
									isSaving = false;
									administration.header().find('.button[data-messagename="save-plugin"]').removeClass('disabled');
								})

								return false;
							});

							parentPanelContentNode.on('click', 'a.cancel', function(e){
								e.preventDefault();
								$.glowModal.close();
								return false;
							});

							var modal = $.glowModal({
								title: 'Dependent Plugins',
								html: parentPanelContentNode,
								width: 450,
								height: '100%',
								onClose: function() {
									isSaving = false;
									administration.header().find('.button[data-messagename="save-plugin"]').removeClass('disabled');
								}
							});
						});
					}
				} else {
					if (!isSaving) {
						isSaving = true;
						administration.header().find('.button[data-messagename="save-plugin"]').addClass('disabled');
						var saves = [];

						// stub empty promise to ensure runs
						saves.push($.Deferred(function(d){
							d.resolve();
						}).promise())

						$.each(saveFunctions, function() {
							var f = this;
							saves.push($.Deferred(function(d) {
								try {
									f({
										success: function() {
											d.resolve();
										},
										error: function() {
											d.reject();
										}
									});
								} catch(e) {
									d.reject();
								}
							}).promise());
						});

						if (saves.length > 0) {
							$.when.apply($, saves).then(function(){
								// Perform final enable/disablement of plugin after
								// all other plugin save functions complete to get
								// an accurate plugin state
								var notifcationId = 'plugin:' + pluginTypeName;
								var notificationClass = 'success';
								if (!hasParents && disableable) {
									context.model.savePlugin({
										pluginTypeName: pluginTypeName,
										enabled: enabled,
									}).then(function(r){

										var notificationTemplate;
										var isEnabled = !disableable || r.state != 'Disabled';
										if(disableable && r.state == 'Misconfigured') {
											notificationTemplate = context.misconfiguredText;
											notificationClass = 'warning';
											wasEnabled = false;
											misconfiguredLabel.addClass('visible');
										} else {
											misconfiguredLabel.removeClass('visible');
											if(isEnabled && !wasEnabled) {
												notificationTemplate = context.enabledText;
											} else if(!isEnabled && wasEnabled) {
												notificationTemplate = context.disabledText;
											} else {
												notificationTemplate = context.updatedText;
											}
											wasEnabled = isEnabled;
										}

										enabledCb.data('wasenabled', wasEnabled);

										var notificationMessage = $.telligent.evolution.template.compile(notificationTemplate)({
											plugin: pluginName
										});

										$.telligent.evolution.notifications.show(notificationMessage, {
											id: notifcationId,
											type: notificationClass,
											duration: 4000
										});

									}).always(function() {
										isSaving = false;
										administration.header().find('.button[data-messagename="save-plugin"]').removeClass('disabled');
									});
								} else {
									var notificationMessage = $.telligent.evolution.template.compile(context.updatedText)({
										plugin: pluginName
									});

									$.telligent.evolution.notifications.show(notificationMessage, {
										id: notifcationId,
										type: notificationClass,
										duration: 4000
									});

									isSaving = false;
									administration.header().find('.button[data-messagename="save-plugin"]').removeClass('disabled');
								}
							})
							.fail(function() {
							    isSaving = false;
								administration.header().find('.button[data-messagename="save-plugin"]').removeClass('disabled');
							})
						} else {
							isSaving = false;
							$.telligent.evolution.notifications.show(context.savedText);
							administration.header().find('.button[data-messagename="save-plugin"]').removeClass('disabled');
						}
					}
				}
			});

			$.telligent.evolution.messaging.subscribe('prs', function(saveFunction) {
				saveFunctions.push(saveFunction);
			});

			$.telligent.evolution.messaging.subscribe('prc', function(contentDetails) {
				var c = $.extend({
					name: null,
					orderNumber: 999999,
					selected: function() { },
					unselected: function() { },
					validate: function() { return true; },
					actions: []
				}, contentDetails, {
					id: tabs.length
				});
				
				if (c.name) {
    				tabs.push(c);
				}

				$.each(c.actions, function(i, action) {
				    var a = $.extend({
						label: null,
						messageName: 'action',
						messageData: '',
						show: 'contextually'
					}, action, {
						id: 'pc_tab_action_' + actions.length,
						orderNumber: actions.length,
						tabOrderNumber: c.orderNumber,
						tabId: c.id
					});
				    
				    if (a.label && (a.show == 'always' || c.name)) {
					    actions.push(a);
				    }
				});
			});

			$.telligent.evolution.messaging.subscribe('pv', function(data) {
				data.isValid = validate();
			});

			Utility.appendHtml(administration.panelWrapper(), options.editorHtml).then(function() {
				tabs.sort(function(a, b) {
					if (a.orderNumber == b.orderNumber) {
						return a.orderNumber - b.orderNumber;
					} else {
						return a.orderNumber - b.orderNumber;
					}
				});

				actions.sort(function(a, b) {
					if (a.show == b.show ||(a.show != 'always' && b.show != 'always')) {
						if (a.tabOrderNumber == b.tabOrderNumber) {
							return a.index - b.index;
						} else {
							return a.tabOrderNumber - b.tabOrderNumber;
						}
					} else if (a.show == 'always') {
						return 1;
					} else {
						return -1;
					}
				});

				if (tabs.length > 0) {
					selectedTabId = tabs[0].id;
				}

				// add plugin header
				var headerTemplate = (headerTemplate || templating(options.pluginHeaderTemplateId));
				var pluginHeader;
				$.telligent.evolution.ui.suppress(function(){
					pluginHeader = $(headerTemplate({
						name: options.name,
						description: options.description,
						pluginTypeName: options.pluginTypeName,
						enabled: options.state !== 'Disabled',
						configured: options.state !== 'Misconfigured',
						disableable: options.disableable,
						canSave: saveFunctions.length > 0,
						hasParents: options.hasParents,
						tabs: tabs,
						actions: actions,
						selectedTabId: selectedTabId
					}));
				});
				administration.header(pluginHeader);

				for (var i = 0; i < tabs.length; i++) {
					if (tabs[i].id == selectedTabId) {
						try {
							tabs[i].selected();
						} catch (e) {}
					} else {
						try {
							tabs[i].unselected();
						} catch (e) {}
					}
				}

				actionWrapper = pluginHeader.find('.field-item.actions .navigation-list');
				updateActionVisibility();
			});
		}
	};

	return PluginController;

}, jQuery, window);