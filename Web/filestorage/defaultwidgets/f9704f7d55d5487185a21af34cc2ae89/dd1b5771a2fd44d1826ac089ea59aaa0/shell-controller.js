/*
Controller:

	options:
		dataProvider

	Methods:

*/
define('Controller', [
		'StudioEnvironment',
		'StudioSaveQueue',
		'StudioBrowseController',
		'StudioTabListController',
		'StudioStagingView',
		'StudioSettingsView',
		'StudioSettings',
		'StudioEditViewWrapperView',
		'StudioTabContentController',
		'StudioNavigator',
		'StudioUploader',
		'StudioDockViewController',
		'StudioShortcutsController',
		'StudioTabListStore',
		'StudioScriptConsoleDockView',
		'StudioApiDocumentationDockView',
		'StudioApiDataModelProvider',
		'DataModel',
		'Utility',
		'EditViewFactory',
		'Exporter',
		'GlobalSearchDockView',
		'ImportSelectorView',
		'NewAutomationView'
		],
	 function(
		StudioEnvironment,
		StudioSaveQueue,
		StudioBrowseController,
		StudioTabListController,
		StudioStagingView,
		StudioSettingsView,
		StudioSettings,
		StudioEditViewWrapperView,
		StudioTabContentController,
		StudioNavigator,
		StudioUploader,
		StudioDockViewController,
		StudioShortcutsController,
		StudioTabListStore,
		StudioScriptConsoleDockView,
		StudioApiDocumentationDockView,
		StudioApiDataModelProvider,
		DataModel,
		Utility,
		EditViewFactory,
		Exporter,
		GlobalSearchDockView,
		ImportSelectorView,
		NewAutomationView,
		$, global, undef)
{

	var messaging = $.telligent.evolution.messaging;
	var administration = $.telligent.evolution.administration;

	var defaults = {
		dataProvider: null,
		templates: null,
		editableExtensions: []
	};

	function buildModel(context) {
		// build model
		var saveQueue = new StudioSaveQueue({
			interval: 1000,
			onTaskAdd: function(id) {
				context.tabContentController.setGlobalSaveState(context.tabContentController.states.Queued);
				// as long as tasks exist, warn on exit
				global.onbeforeunload = function(e) {
					return context.resources.confirmUnsavedExit
				};
			},
			onTaskBegin: function(id) {
				context.tabContentController.setGlobalSaveState(context.tabContentController.states.Saving);
			},
			onTaskDone: function(id) {
			},
			onTaskFail: function(id) {
			},
			onEmpty: function() {
				context.tabContentController.setGlobalSaveState(context.tabContentController.states.Saved);
				// when no tasks remain, don't warn on exit
				global.onbeforeunload = null;
			},
			coalesce: true
		});

		var dataModel = new DataModel({
			queue: saveQueue,
			provider: context.dataProvider
		});

		context.exporter = new Exporter({
			exportAutomationsUrl: context.urls.exportAutomationsUrl,
			storeTemporaryExportListUrl: context.urls.storeTemporaryExportListUrl
		});

		return dataModel;
	}

	function buildEditViewController(context) {
		function processSave(context, request, model, immediately) {
			if (Utility.isFileRequest(request)) {
				return context.model.saveAutomationFile({
					id: model.Id,
					name: model.Name,
					content: model.Content,
					newName: model.NewName,
					queueSalt: model.queueSalt,
					immediate: immediately
				}).then(function(r){
					context.stagingView.render(r.stagedAutomations);
				});
			} else {
				return context.model.saveAutomation({
					id: model.Id,
					hostId: model.HostId,
					factoryDefaultProviderId: model.FactoryDefaultProviderId,
					name: model.Name,
					description: model.Description,
					executionScript: model.ExecutionScript,
					executionScriptLanguage: model.ExecutionScriptLanguage,
					configurationXml: model.ConfigurationXml,
					resourcesToSave: model.ResourcesToSave,
					events: model.EventKeys,
					triggerTypes: model.TriggerTypes,
					scheduleType: model.ScheduleType,
					scheduleSeconds: model.ScheduleSeconds,
					scheduleMinutes: model.ScheduleMinutes,
					scheduleHours: model.ScheduleHours,
					scheduleDailyTime: model.ScheduleDailyTime,
					scheduleDailySunday: model.ScheduleDailySunday,
					scheduleDailyMonday: model.ScheduleDailyMonday,
					scheduleDailyTuesday: model.ScheduleDailyTuesday,
					scheduleDailyWednesday: model.ScheduleDailyWednesday,
					scheduleDailyThursday: model.ScheduleDailyThursday,
					scheduleDailyFriday: model.ScheduleDailyFriday,
					scheduleDailySaturday: model.ScheduleDailySaturday,
					executeAsServiceUser: model.ExecuteAsServiceUser,
					isSingleton: model.IsSingleton,
					httpAuthentication: model.HttpAuthentication,
					immediate: immediately
				}).then(function(r){
					context.stagingView.render(r.stagedAutomations);
				});
			}
		}


		function processLoadDefaultVariant(context, request, includeAllAttachments) {
			if (Utility.isFileRequest(request)) {
				return context.model.getAutomationFile({
					id: request.id,
					name: request.name,
					staged: false,
					factoryDefault: true
				});
			} else {
				return context.model.getAutomation({
					id: request.id,
					staged: false,
					factoryDefault: true,
					includeFileDigests: includeAllAttachments
				})
			}
		}

		function processLoadStaged(context, request, includeAllAttachments) {
			if (Utility.isFileRequest(request)) {
				return context.model.getAutomationFile({
					id: request.id,
					name: request.name,
					staged: true
				});
			} else {
				return context.model.getAutomation({
					id: request.id,
					staged: true,
					includeFileDigests: includeAllAttachments
				});
			}
		}

		function processLoadNonStaged(context, request, includeAllAttachments) {
			if (Utility.isFileRequest(request)) {
				return context.model.getAutomationFile({
					id: request.id,
					name: request.name,
					staged: false
				});
			} else {
				return context.model.getAutomation({
					id: request.id,
					staged: false,
					includeFileDigests: includeAllAttachments
				});
			}
		}

		// view type provider
		context.editViewFactory = new EditViewFactory({
			templates: context.templates,
			editableExtensions: context.editableExtensions,
			resources: context.resources,
			model: context.model,
			getAutoCompleteSuggestions: function(mode, prefix, automationHostId) {
				var savedEditorSettings = context.settings.get();
				return context.apiModel.listSuggestions({
					mode: mode,
					prefix: prefix,
					fragmentId: automationHostId,
					completeFullMemberSignature: (savedEditorSettings.completeFullMemberSignature === undef ? true : savedEditorSettings.completeFullMemberSignature)
				});
			},
			serializeRequest: function(request, options) {
				return context.navigator.serialize(request, options);
			},
			onCompareRequested: function(request, variantType) {
				context.tabContentController.applyComparisonMode(request, variantType);
			},
			onSearchEvents: function(query) {
				return context.model.listEvents({
					query: query
				});
			}
		});

		// view wrapper view
		context.editViewWrapperView = new StudioEditViewWrapperView({
			container: context.panelWrapper.find('.edit').first()
		});

		// view controller
		context.tabContentController = new StudioTabContentController({
			editViewWrapperView: context.editViewWrapperView,
			onConstructView: function(request, options) {
				return context.editViewFactory.getInstance(request, options);
			},
			onWillSave: function() {
				context.tabContentController.setGlobalSaveState(context.tabContentController.states.Queued);
			},
			onSave: function(request, model, immediately) {
				return processSave(context, request, model, immediately);
			},
			onLoadVariant: function(type, request, includeAllAttachments) {
				var loader;

				if(type == 'nonstaged')
					loader = processLoadNonStaged(context, request, includeAllAttachments);
				else if(type == 'default')
					loader = processLoadDefaultVariant(context, request, includeAllAttachments);
				else if(type == 'staged')
					loader = processLoadStaged(context, request, includeAllAttachments);

				return loader.then(function(r){
					if(!r) {
						$.telligent.evolution.notifications.show(context.resources.noComparison, {
							duration: 3 * 1000
						});
					}
					return r;
				});
			},
			editorSettings: function() {
				// return the localstorage-saved editor settings
				return $.extend(context.settings.get(), {
					// override the 'right' handler to attempt to navigate to
					// a documentation item for an autocompletion suggestion, if one is open
					right: handleRightNavigationInEditor
				});
			},
			onParseRequest: function(request) {
				return context.navigator.parse(request);
			},
			onSerializeRequest: function(request, options) {
				return context.navigator.serialize(request, options);
			},
			onSerializeModelIdentifier: onSerializeModelIdentifier,
			onGetRequestedLineNumber: function(request) {
				return (request.line && request.line > 1 ? request.line : request.name);
			},
			onUpdateEditor: function(editorRequest, updateRequest, updateModel, controller) {
				if(!updateModel)
					return;

				// this is an update of a file tab tab based on updates to the overall updateModel itself
				if(
					Utility.isFileRequest(editorRequest) &&
					!Utility.isFileRequest(updateRequest)
				)
				{
					// update the only parts of the file updateModel that would have changed
					controller.applyModelChanges({
						HostName: updateModel.HostName,
						AutomationProcessedName: updateModel.ProcessedName,
						State: updateModel.State,
						IsStaged: updateModel.IsStaged
					});

				// if this is an update of a file tab
				} else if (
					Utility.isFileRequest(editorRequest) &&
					Utility.isFileRequest(updateRequest) &&
					editorRequest.name == updateRequest.name
				)
				{
					// a file update could represent a rename, which would affect the updateRequest
					editorRequest.name = updateModel.Name;

					controller.applyModelChanges(updateModel);

				// non-file update
				} else if (
					!Utility.isFileRequest(updateRequest) &&
					!Utility.isFileRequest(editorRequest) &&
					updateModel.Files
				)
				{
					controller.applyModelChanges(updateModel);
				}
			}
		});
	}

	function buildViews(context) {

		return $.Deferred(function(d){

			var headerContainer = $('<div></div>');
			administration.header(headerContainer, {
				inherit: false
			});

			// Tab List
			context.tabListController = new StudioTabListController({
				container: headerContainer,
				tabViewItemTemplate: context.templates.tabViewItemTemplate,
				onGetSettings: function(){
					return context.settings.get();
				},
				onChange: function(currentRequests) {
					context.tabListStore.persist();

					// if no tabs opened, tell the dock view controller about this by passing null to setEditorTabState
					if(!currentRequests || currentRequests.length == 0) {
						context.dockViewController.setEditorTabState(null);
					}
				},
				onSerializeRequest: function(request, options) {
					return context.navigator.serialize(request, options);
				},
				onParseRequest: function(request) {
					return context.navigator.parse(request);
				},
				onSerializeModelIdentifier: onSerializeModelIdentifier,
				onUpdateTab: function(tabRequest, updateRequest, updateModel, controller) {
					// if the tab is for a file, update it accordingly
					if(Utility.isFileRequest(tabRequest)) {
						// updating a file tab with a file model
						if(updateRequest.name && updateRequest.name == tabRequest.name) {
							tabRequest.name = updateModel.Name;
							controller.applyModelChanges(updateModel);
						// updating a file tab with new automation model data
						} else {
							// name and staged state is the only reasonable change here
							controller.applyModelChanges({
								AutomationProcessedName: updateModel.ProcessedName,
								IsStaged: updateModel.IsStaged,
								IsTranslated: updateModel.IsTranslated,
								IsReverted: updateModel.IsReverted,
								IsDeleted: updateModel.IsDeleted
							});
						}
					// if the tab is for an automation component and the request isn't related to a file...
					} else if(!updateRequest.name) {
						// otherwise, it's a regular automation tab
						controller.applyModelChanges(updateModel);
					}
				}
			});

			// settings view
			context.settingsView = new StudioSettingsView({
				onChange: function(settings) {
					context.settings.set(settings);
					context.tabContentController.updateEditorSettings(settings);
					context.scriptConsoleDockView.updateEditorSettings(settings);
					context.apiModel.clearSuggestionCache();
				},
				onGetSettings: function(){
					return context.settings.get();
				},
				resources: context.resources
			});

			// Import Selector View
			context.importSelectorView = new ImportSelectorView({
				template: $.telligent.evolution.template(context.templates.importSelectorTemplate),
				resources: context.resources,
				parseRequest: function(request) {
					return context.navigator.parse(request);
				}
			});

			context.newAutomationView = new NewAutomationView({
				template: $.telligent.evolution.template(context.templates.newAutomationViewTemplate),
				title: context.resources.newAutomationTitle,
				enableIdSelection: context.developerModeEnabled,
				enableProviderSelection: context.developerModeEnabled
			});

			// Sidebar Views
			var sideBar = $('<div></div>').get(0);
			administration.sidebar({
				content: sideBar
			}).then(function(){

				// Staging View
				var stagingContainer = $('<div></div>').appendTo(sideBar);
				context.stagingView = new StudioStagingView({
					container: stagingContainer,
					resources: context.resources
				});

				// automation host nodes
				var customAutomationHostKey = 'h:custom';

				// Browse Controller
				var browseContainer = $('<div></div>').appendTo(sideBar);
				var browseHeaderContent = $($.telligent.evolution.template(context.templates.browseHeaderTemplate)({}));
				var includeHostNodes = false;
				context.browseController = new StudioBrowseController({
					resources: context.resources,
					browseHeaderContent: browseHeaderContent,
					browseViewItemTemplate: context.templates.browseViewItemTemplate,
					actionsTemplate: $.telligent.evolution.template(context.templates.automationActionsTemplate),
					container: browseContainer,
					wrapperCssClass: 'management-studio manage-automations',
					searchPlaceholder: context.resources.nameorDescription,
					linkNew: true,
					linkUpload: true,
					multiSelectActions: [
						{ message: 'ma.view.automations.export', label: context.resources.exportSelectedAutomations },
						{ message: 'ma.view.resources.export', label: context.resources.exportSelectedResources },
						{ message: 'ma.view.automations.delete', label: context.resources.deleteSelectedAutomations }
					],
					modelDepth: 0,
					onGetInitialNodes: function() {
						return $.Deferred(function(d){
							if (!includeHostNodes)
								d.resolve([]);

							var automationHostNodes = context.hosts.map(function(h){
								return {
									key: 'h:' + h.HostId,
									label: h.HostName,
									description: h.HostDescription,
									isHost: true,
									isDefaulHost: false,
									cssClass: 'container',
									expanded: true
								};
							});
							automationHostNodes.push({
								key: customAutomationHostKey,
								label: context.resources.customHost,
								description: context.resources.customHostDesc,
								isHost: true,
								isDefaulHost: true,
								cssClass: 'container',
								expanded: true
							});
							automationHostNodes.sort(function(a, b){
								var labelA = a.label.toUpperCase();
								var labelB = b.label.toUpperCase();
								if (labelA < labelB)
									return -1;
								if (labelA > labelB)
									return 1;
								return 0;
							});
							d.resolve(automationHostNodes);
						}).promise();
					},
					onList: function(explicitQuery) {
						if(!context.browseSearchInput) {
							context.browseSearchInput = browseContainer.find('input.query');
							context.browseStateSelect = browseContainer.find('select.state-select');
							context.browseHostSelect = browseContainer.find('select.host-select');

							context.browseStateSelect.on('change', function(){
								// adjust model depth to 1 if all (nested) automations, otherwise 0.
								var host = context.browseHostSelect.val();
								var newModelDepth = host && host.length > 0 ? 0 : 1;
								context.browseController.load({
									modelDepth: newModelDepth
								});
							});

							context.browseHostSelect.on('change', function(){
								// adjust model depth to 1 if all (nested) automations, otherwise 0.
								var host = context.browseHostSelect.val();
								var newModelDepth = host && host.length > 0 ? 0 : 1;
								context.browseController.load({
									modelDepth: newModelDepth
								});
							});
						}

						var query = {};
						if($.trim(context.browseSearchInput.val()).length > 0) {
							query.query = $.trim(context.browseSearchInput.val());
						}

						var source = context.browseStateSelect.val();
						if(source !== 'all') {
							if (source.indexOf('factoryDefaultProviderId:') == 0) {
								query.factoryDefaultProviderId = source.split('factoryDefaultProviderId:')[1];
							} else {
								query.state = source;
							}
						}

						var host = context.browseHostSelect.val();
						if (host && host.length > 0) {
							includeHostNodes = false;
							query.specifyHost = true;
							if (host == 'generic') {
								query.hostId = '';
							} else {
								query.hostId = host;
							}
						} else {
							includeHostNodes = true;
						}

						if(explicitQuery && explicitQuery.length > 0) {
							query.query = explicitQuery;
						}

						return context.model.listAutomations(query).then(function(r){
							// no results
							if (!r || !r.automations || !r.automations.length) {
								return [{ isEmptyResult: true }];
							}
							// if searched...
							if (query.query) {
								// searching is always flat
								context.browseController.modelDepth(0);
								// build a flattened list of possible search results
								var flattenedAutomationComponents = [];
								for(var i = 0; i < r.automations.length; i++) {
									var automation = r.automations[i];

									// overview
									flattenedAutomationComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: automation.Id,
											type: 'overview'
										}),
										label: context.resources.overview,
										model: automation,
										cssClass: 'managed-item overview',
										haystack: (automation.ProcessedName + ' ' + automation.ProcessedDescription + ' ' + (automation.HostName || context.resources.customHost) + ' ' + context.resources.overview).toLowerCase()
									});

									// body script
									flattenedAutomationComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: automation.Id,
											type: 'executionscript'
										}),
										label: context.resources.implementation,
										model: automation,
										cssClass: 'managed-item bodyscript',
										haystack: (automation.ProcessedName + ' ' + automation.ProcessedDescription + ' ' + (automation.HostName || context.resources.customHost) + ' ' + context.resources.implementation).toLowerCase()
									});

									// configuration
									flattenedAutomationComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: automation.Id,
											type: 'configuration'
										}),
										label: context.resources.configuration,
										model: automation,
										cssClass: 'managed-item configuration',
										haystack: (automation.ProcessedName + ' ' + automation.ProcessedDescription + ' ' + (automation.HostName || context.resources.customHost) + ' ' + context.resources.configuration).toLowerCase()
									});

									// resources
									flattenedAutomationComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: automation.Id,
											type: 'resources'
										}),
										label: context.resources.resources,
										model: automation,
										cssClass: 'managed-item resources',
										haystack: (automation.ProcessedName + ' ' + (automation.HostName || context.resources.customHost) + ' ' + context.resources.resources).toLowerCase()
									});

									// files
									if (automation.Files && automation.Files.length > 0) {
										for(var f = 0; f < automation.Files.length; f++) {
											var file = automation.Files[f];
											flattenedAutomationComponents.push({
												isFilterResult: true,
												key: context.navigator.serialize({
													id: automation.Id,
													type: 'file',
													name: file.Name
												}),
												label: file.Name,
												model: automation,
												cssClass: 'managed-item file',
												haystack: (automation.ProcessedName + ' ' + automation.ProcessedDescription + ' ' + (automation.HostName || context.resources.customHost) + ' ' + file.Name).toLowerCase()
											});
										}
									}
								}

								// filter flattened automation components to items that contain all words in the query, regardless of order
								var queryComponents = query.query.toLowerCase().split(' ');
								return flattenedAutomationComponents.filter(function(t){
									var includesQuery = true;
									for(var i = 0; i < queryComponents.length; i++) {
										includesQuery = includesQuery && t.haystack.indexOf(queryComponents[i]) >= 0
									}
									return includesQuery;
								});

							} else {
								// reset the model depth
								// adjust model depth to 1 if all (nested) automations, otherwise 0.
								var host = context.browseHostSelect.val();
								var newModelDepth = host && host.length > 0 ? 0 : 1;
								context.browseController.modelDepth(newModelDepth);
								return r.automations;
							}
						});
					},
					onGetAndSelect: function(request) {
						return context.model.getAutomation({
							id: request.id
						}).then(function(automation){
							if (automation) {
								context.browseSearchInput.val('');
								context.browseStateSelect.val('all');
								context.browseHostSelect.val('');
							}
							return automation;
						});
					},
					onSerializeRequest: function(request, options) {
						return context.navigator.serialize(request, options);
					},
					onParseRequest: function(request) {
						return context.navigator.parse(request);
					},
					onSelected: function(request) {
						var parsedRequest = context.navigator.parse(request);
						// don't navigate to categories
						if(!parsedRequest
							|| parsedRequest.type == 'files'
							|| parsedRequest.type == 'fileothers'
							|| parsedRequest.type == 'fileimages'
							|| parsedRequest.type == 'filefonts'
							|| parsedRequest.type == 'filestyles'
							|| parsedRequest.type == 'filescripts')
						{
							return;
						}
						context.navigator.request(parsedRequest);
						context.browseController.clearSearch();
					},
					onConvertModelToNode: function(model) {
						if (model.isEmptyResult) {
							return {
								key: '',
								label: context.resources.noMatchingAutomations,
								cssClass: 'managed-item overview',
								model: {}
							};
						} else if(model.isFilterResult) {
							return model;
						} else {
							var overviewNode = {
								key: context.navigator.serialize({
									id: model.Id,
									type: 'overview'
								}),
								label: model.ProcessedName,
								cssClass: 'managed-item overview',
								model: model,
								children: []
							};
							// categorize in host container node
							if (model.HostId) {
								overviewNode.parentKey = 'h:' + model.HostId;
							} else {
								overviewNode.parentKey = customAutomationHostKey
							}
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									type: 'executionscript'
								}),
								label: context.resources.implementation,
								cssClass: 'managed-item executionscript'
							});
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									type: 'configuration'
								}),
								label: context.resources.configuration,
								cssClass: 'managed-item configuration'
							});
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									type: 'resources'
								}),
								label: context.resources.resources,
								cssClass: 'managed-item resources'
							});

							// files
							if (model.Files && model.Files.length > 0) {

								// infer sub-categories based on file types
								var categories = [
									{ name: context.resources.images, type: 'fileimages', extensions: [ 'ico','jpg','jpeg','gif','png','svg','bmp','tiff' ], files: [] },
									{ name: context.resources.fonts, type: 'filefonts', extensions: [ 'ttf','eot','otf','woff','woff2' ], files: [] },
									{ name: context.resources.styleSheetIncludes, type: 'filestyles', extensions: [ 'less','css' ], files: [] },
									{ name: context.resources.scripts, type: 'filescripts', extensions: [ 'js', 'jsm', 'vm', 'txt' ], files: [] }
								];
								var catchAllCategory = { name: context.resources.other, type: 'fileothers', extensions: [], files: [] };
								categories.push(catchAllCategory);

								for(var fi = 0; fi < model.Files.length; fi++) {
									var categorized = false;
									var fileNameParts = model.Files[fi].Name.toLowerCase().split('.');
									var fileExtension = fileNameParts.length >= 2
										? fileNameParts[fileNameParts.length - 1]
										: '';
									for(var ci = 0; ci < categories.length; ci++) {
										if(categories[ci].extensions.indexOf(fileExtension) >= 0) {
											categorized = true;
											categories[ci].files.push(model.Files[fi].Name);
											break;
										}
									}
									if(!categorized) {
										catchAllCategory.files.push(model.Files[fi].Name)
									}
								};

								// add each category of files

								for(var ci = 0; ci < categories.length; ci++) {
									if(categories[ci].files && categories[ci].files.length > 0) {
										var categoryNode = {
											key: context.navigator.serialize({
												id: model.Id,
												type: categories[ci].type
											}),
											label: categories[ci].name,
											cssClass: 'managed-item file',
											children: []
										};

										for(var fi = 0; fi < categories[ci].files.length; fi++) {
											categoryNode.children.push({
												key: context.navigator.serialize({
													id: model.Id,
													type: 'file',
													name: categories[ci].files[fi]
												}),
												label: categories[ci].files[fi],
												cssClass: 'managed-item file',
												type: 'file'
											});
										}

										overviewNode.children.push(categoryNode);
									}
								}
							}

							return overviewNode;

						}
					}
				});

				var extraLinkTemplate = $.telligent.evolution.template.compile('<a href="#" data-messagename="<%: message %>"><%= label %></a>');
				[
					{ message: 'ma.view.automations.export', label: context.resources.exportAllAutomations },
					{ message: 'ma.view.resources.export', label: context.resources.exportAllResources }
				].forEach(function(extraLink) {
					context.browseController.addHeaderLink({
						element: extraLinkTemplate(extraLink),
						visible: false
					});
				});

				d.resolve();
			});


		}).promise();
	}

	function buildStudioNavigator(context) {
		//	Query:
		//		_aid (automation id)
		//		_at (type)
		//			overview
		//			configuration
		//			executionscript
		//			resources
		//			file (file type)
		//		_an (file name, if file)
		//		_al (line number, if there's a line number)

		function prefix(options) {
			if(!options)
				return {};

			return {
				_aid: options.id || '',
				_at: options.type || '',
				_an: options.name || '',
				_al: options.line || 0
			};
		}

		function dePrefix(options) {
			return {
				id: options._aid || '',
				type: options._at || '',
				name: options._an || '',
				line: (options._al ? parseInt(options._al, 10) : 0),
				model: options._am || 'automation' // automation | configuration
			};
		}

		// navigator
		context.navigator = new StudioNavigator({
			rootUrl: context.urls.panelUrl,
			onLoad: function(request) {
				var requestKey = context.navigator.serialize(request);

				// first look for an existing view/model
				var existingModel = context.tabContentController.getRenderedModel(request);
				if(existingModel) {
					return $.Deferred(function(d){
						d.resolve(existingModel);
					}).promise();

				// next, look for existing temporary new model that hasn't yet been saved
				} else if(context.temporaryNewItemCache[requestKey]) {
					return $.Deferred(function(d){
						d.resolve(context.temporaryNewItemCache[requestKey]);
					}).promise();
				// otherwise, load a new model - attachment if it's attachment
				} else if (Utility.isFileRequest(request)) {
					return context.model.getAutomationFile({
						id: request.id,
						name: request.name,
						fallback: true
					}).then(function(r){
						if(!r) {
							global.history.back();
						}
						return r;
					});
				// if any other part of the widget, load the full widget
				} else {
					return context.model.getAutomation({
						id: request.id
					});
				}
			},
			onSerialize: function(request, options) {
				if(!request)
					return '';

				//	options:
				//		includeLineNumber: default false
				// 		includeAttachment: default false

				var pairs = [];

				pairs.push('_aid' + "=" + encodeURIComponent(request.id || ''));
				pairs.push('_at' + "=" + encodeURIComponent(request.type || ''));

				// ignore file names for non-file requests
				// the field is overloaded for navigating to deeper parts of a component
				// such as resource names, but is not useful in identifying overall tabs
				if(Utility.isFileRequest(request) || (options && options.includeAttachment)) {
					pairs.push('_an' + "=" + encodeURIComponent(request.name || ''));
				}

				if(options && options.includeLineNumber) {
					pairs.push('_al' + "=" + encodeURIComponent(request.line || 0));
				}

				return pairs.join('&');
			},
			onDeserialize: function(request) {
				var deserialized = dePrefix($.telligent.evolution.url.parseQuery(request || ''));
				if (!deserialized || !deserialized.id)
					return null;
				return deserialized;
			},
			onPrefix: prefix,
			onDePrefix: dePrefix
		});
	}

	function handleModelEvents(context) {
		function buildKey(id) {
			return "k:" + id;
		}

		var modelEvents = {

			'ma.model.automation.staging.changed': function(data) {

				// determine a list of originally staged items by looking at the pre-updated stagingView
				var originalStagedRequests = $.map(context.stagingView.list(), function(m) { return { id: $(m).data('id') }; } )
				loadAndRenderStagingView(context).then(function(){
					// get list of newly staged items
					var newStagedRequests = $.map(context.stagingView.list(), function(m) { return { id: $(m).data('id') }; } )

					// map them to a hash for quick checking
					var newStagedRequestsIndex = {};
					for(var i = 0; i < newStagedRequests.length; i++) {
						newStagedRequestsIndex[buildKey(newStagedRequests[i].id)] = newStagedRequests[i];
					}


					// get list of all currently open automations, and map them to a hash for
					// quickly determining if they should be reloaded
					// get list of currently open tabs
					var tabs = context.tabListController.listAll();
					var tabsIndex = {};
					for(var i = 0; i < tabs.length; i++) {
						tabsIndex[buildKey(tabs[i].request.id)] = tabs[i].request;
					}

					// identify which original requests are no longer represented
					// by looping over the original and comparing with check index
					for(var i = 0; i < originalStagedRequests.length; i++) {
						(function(i){
							var key = buildKey(originalStagedRequests[i].id);
							if(newStagedRequestsIndex[key]) {
								return;
							} else {
								// if an item was staged that no longer is...
								var request = originalStagedRequests[i];
								var serializedOriginalRequest = buildKey(request.id);

								// if published automation wasn't open in any tabs, don't reload
								if(!tabsIndex[serializedOriginalRequest])
									return;

								// otherwise, load the automation
								context.model.getAutomation({
									id: request.id
								}).then(function(updatedAutomation){
									// if the automation doesn't exist,
									// then this was a revert of something that was never savedAutomation
									// and we want to just close its UI completely
									if(!updatedAutomation) {
										context.tabListController.close(request, true);
										context.tabContentController.close(request, true);
										return;
									}

									// otherwise, this was a publish, and we want to treat its UI
									// the same way as when a "revert" happens, in that
									// we let the app take care of investigating what
									// needs to be updated in each album or not
									$.telligent.evolution.messaging.publish('ma.model.automation.updated', {
										model: updatedAutomation,
										reverted: true,
										id: {
											id: request.id
										}
									})
								});
							}

						})(i);
					}
				});
			},
			'ma.model.automations.changed': function(data) {
				// when a mass automations change has been completed
				context.browseController.loadInitial().then(function(){
					var currentRequest = context.tabListController.getCurrent();
					if(currentRequest) {
						context.browseController.select(currentRequest);
					}
				});
			},
			'ma.model.automation.created': function(data) {
				// if cloned, open new clone in a tab
				if(data.cloned) {

					context.navigator.request({
						id: data.model.Id,
						type: 'overview'
					});

					// update browse view
					context.browseController.add({
						id: data.id.id
					}, data.model);

				} else {
					// update tabs
					context.tabListController.update({
						id: data.id.id
					}, data.model);

					// update open edit views
					context.tabContentController.update({
						id: data.id.id
					}, data.model);

					// update browse view
					context.browseController.add({
						id: data.id.id
					}, data.model);
				}
			},
			'ma.model.automation.updated': function(data) {
				// update tabs
				context.tabListController.update({
					id: data.id.id
				}, data.model);

				// update open edit views
				context.tabContentController.update({
					id: data.id.id
				}, data.model, data.reverted);

				// update browse view
				context.browseController.update({
					id: data.id.id
				}, data.model);

				// if this update was from a revert,
				// then also close (new) and/or update any open edited file tabs
				if(data.reverted) {
					// build a quick index of files for each reference
					var currentFileIndex = {};
					if(data.model.Files) {
						for(var i = 0; i < data.model.Files.length; i++) {
							currentFileIndex['file:' + data.model.Files[i].Name] = data.model.Files[i];
						}
					}

					// get a list of currently-rendered requests for the model
					var renderedRequests = context.tabContentController.listRelatedRenderedRequestsForRequest({
						id: data.id.id
					});

					$.each(renderedRequests, function(i, request){
						if(Utility.isFileRequest(request)) {
							// if the staged file request is no longer
							// a part of the reverted set of files (either it was new or renamed)
							// then just close it altogether.
							if(!currentFileIndex['file:' + request.name]) {
								context.tabListController.close(request, false);
								context.tabContentController.close(request);
							} else {
								// otherwise, fully load the old file content and re-render it
								context.model.getAutomationFile({
									id: request.id,
									name: request.name
								}).then(function(revertedAutomationFile){
									context.tabContentController.update({
										id: request.id,
										name: request.name,
										type: 'file'
									}, revertedAutomationFile, data.reverted);
								})
							}
						}
					});
				}
			},
			'ma.model.automations.updated': function(data) {
				// get a unique list of all currently open requests
				var tabs = context.tabListController.listAll();
				var tabsIndex = {};
				for(var i = 0; i < tabs.length; i++) {
					tabsIndex[buildKey(tabs[i].request.id)] = tabs[i].request;
				}

				// filter the list of updated automations to only those with open tabs
				data.automations.forEach(function(automation) {
					if (tabsIndex[buildKey(automation.id)]) {

						// for each automation that has open tab(s), load it and synthesize
						// a full update event of it in order to trigger updating of all of its
						// tabs the same as if it had received a full update event or been reverted
						context.model.getAutomation(automation).then(function(updatedAutomation){
							if(!updatedAutomation) {
								return;
							}
							$.telligent.evolution.messaging.publish('ma.model.automation.updated', {
								model: updatedAutomation,
								reverted: true, // forces a re-analysis of all request/attachments
								id: automation
							})
						});
					}
				});
			},
			'ma.model.automation.deleted': function(data) {
				// close any tab items for the data
				context.tabListController.close({
					id: data.id.id
				}, true);

				// close editor instances
				context.tabContentController.close({
					id: data.id.id
				}, true);

				// update browse view
				context.browseController.remove({
					id: data.id.id
				});
			},
			'ma.model.file.created': function(data) {
				// if rename, ensure temp item cache doesn't contain old
				if (data.id && data.model && data.id.name != data.model.Name) {
					delete context.temporaryNewItemCache[context.navigator.serialize({ id: data.id.id, type: 'file', name: data.id.name })];
				}

				// change the current URL (without navigating)
				// if represents a change to the name of the file
				// and that file is currently focused/rendered
				if(context.currentRenderedRequest
					&& context.currentRenderedRequest.name == data.id.name
					&& context.currentRenderedRequest.type == data.id.type
					&& data.id.name != data.model.Name )
				{
					context.currentRenderedRequest.name = data.model.Name;
					context.navigator.adjustCurrentWithoutProcess({
						id: data.model.Id,
						type: 'file',
						name: data.model.Name
					});
				}

				// update tab view
				context.tabListController.update({
					id: data.id.id,
					type: 'file',
					name: data.id.name
				}, data.model);

				// update open edit views
				context.tabContentController.update({
					id: data.id.id,
					type: 'file',
					name: data.id.name
				}, data.model);

				// select in tree
				context.browseController.select({
					id: data.model.Id,
					type: 'file',
					name: data.model.Name
				});
			},
			'ma.model.file.updated': function(data) {
				// if rename, ensure temp item cache doesn't contain old
				if (data.id && data.model && data.id.name != data.model.Name) {
					delete context.temporaryNewItemCache[context.navigator.serialize({ id: data.id.id, type: 'file', name: data.id.name })];
				}

				// change the current URL (without navigating)
				// if represents a change to the name of the file
				// and that file is currently focused/rendered
				if(context.currentRenderedRequest
					&& context.currentRenderedRequest.name == data.id.name
					&& context.currentRenderedRequest.type == data.id.type
					&& data.id.name != data.model.Name)
				{
					context.currentRenderedRequest.name = data.model.Name;
					context.navigator.adjustCurrentWithoutProcess({
						id: data.model.Id,
						type: 'file',
						name: data.model.Name
					});
				}

				// update tab view
				context.tabListController.update({
					id: data.id.id,
					type: 'file',
					name: data.id.name
				}, data.model);

				// update open edit views
				context.tabContentController.update({
					id: data.id.id,
					type: 'file',
					name: data.id.name
				}, data.model, data.reverted);

				// select in tree
				context.browseController.select({
					id: data.id.id,
					type: 'file',
					name: data.model.Name
				});
			},
			'ma.model.file.deleted': function(data) {
				// close any tab items for the data
				context.tabListController.close({
					id: data.id.id,
					name: data.id.name,
					type: 'file'
				});

				context.tabContentController.close({
					id: data.id.id,
					name: data.id.name,
					type: 'file'
				});
			},
			'ma.model.automation.management.imported': function(data) {
				// import published with unknown changes, just refresh everything
				administration.refresh();
			}
		};

		$.each(modelEvents, function(eventName, handler){
			$.telligent.evolution.messaging.subscribe(eventName, function(data){
				if($.telligent.evolution.widgets.manageAutomations.LOGGING_ENABLED) {
					console.log('MODEL EVENT: ' + eventName);
					console.log(data);
				}

				handler(data);
			});
		});
	}

	function importFile(context, uploadContext, fileName) {
		context.model.importAutomations({
			uploadContext: uploadContext,
			fileName: fileName
		}).then(function(importResult){
			context.importSelectorView.prompt(importResult, function(response){
				administration.loading(true);
				context.model.importAutomations({
					uploadContext: uploadContext,
					fileName: fileName,
					importCommands: response.importCommands,
					factoryDefaultProviderId: response.factoryDefaultProviderId
				}).then(function(r){
					context.stagingView.render(r.stagedAutomations);
				}).always(function(){ administration.loading(false) });
			});
		});
	}

	function handleViewEvents(context) {
		context.navigator.registerHandlers();

		function parseAutomationRequestData(data) {
			if (!data) {
				return null
			}
			if (data.reqkey) {
				return context.navigator.parse(data.reqkey);
			} else if (data.id !== undef) {
				return data;
			}
			return null;
		}

		function parseDataOptions(elm) {
			var data = {};
			for(var i = 0; i < elm.attributes.length; i++) {
				var attr = elm.attributes[i];
				if(attr.name.indexOf('data-') === 0) {
					var name = attr.name.substring(5);
					if(name !== 'messagename') {
						data[name] = attr.value;
					}
				}
			}
			return data;
		}

		function listAllStagedRequests(context) {
			return $.Deferred(function(d){
				context.model.listAutomations({
					staged: true
				}).then(function(a){
					context.model.listConfiguredAutomations({
						staged: true,
						pageSize: 100
					}).then(function(ca) {
						var allStagedRequests = (a.automations || []).map(function(ax) {
							return {
								id: ax.Id,
								model: 'automation'
							}
						}).concat((ca.configuredAutomations || []).map(function(cax){
							return {
								id: cax.Id,
								model: 'configuration'
							}
						}));
						d.resolve(allStagedRequests);
					});
				});
			}).promise();

		}

		var viewEvents = {
			'studio.view.import': function(context, data) {
				context.uploader.upload({ withProgress: true }).then(function(file){
					importFile(context, file.context, file.name);
				});
			},
			'studio.view.settings': function(context, data) {
				context.settingsView.show({
					shortcuts: context.shortcuts.list()
				});
			},
			'studio.view.new': function(context, data) {
				var initiateNewAutomation = function(context, automationId, hostId, factoryDefaultProviderId) {
					administration.loading(true);
					context.model.createAutomation({
						id: automationId,
						hostId: hostId,
						factoryDefaultProviderId: factoryDefaultProviderId
					}).then(function(r){
						var request = {
							id: r.Id,
							type: 'overview'
						};
						context.temporaryNewItemCache[context.navigator.serialize(request)] =  r;
						context.navigator.request(request);
					}).always(function(){ administration.loading(false) });
				}

				var hosts = context.hosts;
				var enableIdSelection = context.developerModeEnabled;
				if (enableIdSelection || hosts.length > 0) {
					context.newAutomationView.prompt({
						hosts: hosts,
						onValidate: function(automationId) {
							return $.Deferred(function(d){
								// empty automation ID is valid - just generates a new ID
								if (!automationId || automationId == '') {
									d.resolve(true);
									return;
								}

								// ensure is valid GUID
								var guidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
								if (!automationId.match(guidPattern)) {
									d.resolve(false);
									return;
								}

								// ensure no automation already exists with type/id
								return context.model.getAutomation({
									id: automationId
								}).then(function(model){
									if(model) {
										d.resolve(false);
									} else {
										d.resolve(true);
									}
								});

								d.resolve(true);
							}).promise();
						},
						onSelect: function(data) {
							initiateNewAutomation(context, data.automationId, data.hostId, data.factoryDefaultProviderId);
						}
					});
				} else {
					initiateNewAutomation(context);
				}
			},
			'studio.view.multiselect': function(context, data) {
				context.browseController.toggleSelectMode();
			},
			'studio.view.staging.publish': function(context, data) {
				if(confirm(context.resources.confirmPublish)) {
					var request = parseAutomationRequestData(data);
					administration.loading(true);
					context.model.publishAutomation({
						id: request.id,
						model: request.model
					}).then(function(r){
						context.stagingView.render(r.stagedAutomations);
						if (request.model == 'configuration') {

						} else {
							context.tabContentController.applyComparisonMode(request, null);
						}
					}).always(function(){ administration.loading(false) })
				}
			},
			'studio.view.staging.revert': function(context, data) {
				if(confirm(context.resources.confirmRevert)) {
					var request = parseAutomationRequestData(data);
					administration.loading(true);
					context.model.revertAutomation({
						id: request.id,
						model: request.model
					}).then(function(r){
						if (request.model == 'configuration') {
							context.stagingView.render(r.stagedAutomations);
						} else {
							if(r.reverted) {
								context.stagingView.render(r.stagedAutomations);
								context.tabContentController.applyComparisonMode(request, null);
							} else {
								// if not reverted, it was b/c there are choices to be made,
								// for related components to revert. So, show those options
								context.revertStagedComponentsView.prompt({
									request: request,
									revertibleChildren: r.revertibleChildren,
									onRevert: function(selections) {
										// re-attempt revert after selections made
										context.model.revertAutomation($.extend({}, {
											id: request.id
										}, selections)).then(function(r){
											if(r.reverted) {
												context.stagingView.render(r.stagedAutomations);
												context.tabContentController.applyComparisonMode(request, null);
											}
										});
									}
								});
							}
						}
					}).always(function(){ administration.loading(false) })
				}
			},
			'studio.view.close': function(context, data) {
				var request = parseAutomationRequestData(data);
				context.tabListController.close(request);
				context.tabContentController.close(request);
				delete context.temporaryNewItemCache[context.navigator.serialize(request)];
			},
			'studio.view.select': function(context, data) {
				var request = data ? parseAutomationRequestData(data) : null;
				context.navigator.request(request);
				if(context.settings.get().syncTree) {
					context.browseController.select(request);
				}
			},
			'studio.view.render': function(context, data) {
				var request = parseAutomationRequestData(data);
				context.tabContentController.render(request, data.model);
				context.tabListController.addOrSelect(request, data.model);
				context.currentRenderedRequest = request;
				var req = $.extend({}, request);
				//req.id = null;
				context.dockViewController.setEditorTabState(req);
			},
			'studio.view.staging.publish.all': function(context, data) {
				if(confirm(context.resources.confirmPublishAll)) {
					var attempts = 0,
						maxAttempts = 10;
					var listAndPublishAutomations = function() {
						administration.loading(true);
						listAllStagedRequests(context).then(function(stagedRequests){
							context.model.publishAutomations({
								automations: stagedRequests
							})
							.then(function(){
								context.tabContentController.applyComparisonMode(null, null);
								// if there were multiple attempts, force a simulated staging.changed
								if(attempts > 0) {
									if($.telligent.evolution.widgets.manageAutomations.LOGGING_ENABLED) {
										console.log('PUBLISH RETRY SUCCEEDED AFTER ATTEMPTS: ' + attempts);
									}
								}
								messaging.publish('ma.model.automation.staging.changed');
							})
							.always(function(){ administration.loading(false) })
						});
					};
					listAndPublishAutomations();
				}
			},
			'studio.view.staging.revert.all': function(context, data) {
				if(confirm(context.resources.confirmRevertAll)) {
					administration.loading(true);
					listAllStagedRequests(context).then(function(stagedRequests){
						context.model.revertAutomations({
							automations: stagedRequests
						}).then(function(revertResponse){
							if(revertResponse.reverted) {
								messaging.publish('ma.model.automation.staging.changed');
								context.tabContentController.applyComparisonMode(null, null);
							} else {
								// if not reverted, it was b/c there are choices to be made,
								// for related components to revert. So, show those options
								context.revertStagedComponentsView.prompt({
									revertibleChildren: revertResponse.revertibleChildren,
									onRevert: function(selections) {
										// re-attempt revert after selections made
										context.model.revertAutomations($.extend({}, selections, {
											automations: stagedRequests
										})).then(function(revertResponseB){
											if(revertResponseB.reverted) {
												context.tabContentController.applyComparisonMode(null, null);
												messaging.publish('ma.model.automation.staging.changed');
											}
										});
									}
								});
							}

						}).always(function(){ administration.loading(false) })
					});
				}
			},
			'ma.view.automation.delete': function(context, data) {
				administration.loading(true);
				var request = parseAutomationRequestData(data);
				var performDelete = function() {
					administration.loading(true);
					context.model.deleteAutomation({
						id: request.id
					}).then(function(r){
						if(r.deleted) {
							context.stagingView.render(r.stagedAutomations);
							context.tabContentController.applyComparisonMode(request, null);
						} else {
							// if not reverted, it was b/c there are choices to be made,
							// for related components to revert. So, show those options
							context.revertStagedComponentsView.prompt({
								request: request,
								revertibleChildren: r.revertibleChildren,
								onRevert: function(selections) {
									// re-attempt delete after selections made
									context.model.deleteAutomation($.extend({}, {
										id: request.id
									}, selections)).then(function(r){
										if(r.reverted) {
											context.stagingView.render(r.stagedAutomations);
											context.tabContentController.applyComparisonMode(request, null);
										}
									});
								}
							});
						}
					}).always(function(){ administration.loading(false) })
				};

				context.model.getAutomation({
					id: request.id
				}).then(function(targetAutomation){
					if(targetAutomation && targetAutomation.IsStaged) {
						if(confirm(context.resources.confirmStageDelete)) {
							performDelete();
						}
					} else {
						performDelete();
					}
				}).always(function(){ administration.loading(false) });
			},
			'ma.view.automation.clone': function(context, data) {
				var request = parseAutomationRequestData(data);

				var performClone = function(hostId, newAutomationId) {
					var cloneQuery = {
						id: request.id,
						hostId: hostId
					};
					if(newAutomationId && newAutomationId.length > 0)
						cloneQuery.newId = newAutomationId;

					administration.loading(true);
					context.model.cloneAutomation(cloneQuery).then(function(r){
						context.stagingView.render(r.stagedAutomations);
					}).always(function(){ administration.loading(false); })
				};

				context.model.getAutomation({
					id: request.id
				}).then(function(targetAutomationModel){

					var hosts = context.hosts;
					var enableIdSelection = context.developerModeEnabled;
					if (enableIdSelection || hosts.length > 0) {
						context.newAutomationView.prompt({
							hosts: hosts,
							currentAutomationId: targetAutomationModel.HostId,
							onValidate: function(automationId) {
								return $.Deferred(function(d){
									// empty automation ID is valid - just generates a new ID
									if (!automationId || automationId == '') {
										d.resolve(true);
										return;
									}

									// ensure is valid GUID
									var guidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
									if (!automationId.match(guidPattern)) {
										d.resolve(false);
										return;
									}

									// ensure no automation already exists with type/id
									return context.model.getAutomation({
										id: automationId
									}).then(function(model){
										if(model) {
											d.resolve(false);
										} else {
											d.resolve(true);
										}
									});

									d.resolve(true);
								}).promise();
							},
							onSelect: function(data) {
								performClone(data.hostId, data.automationId);
							}
						});
					} else {
						performClone();
					}

				});
			},
			'ma.view.automation.export': function(context, data) {
				var request = parseAutomationRequestData(data);
				context.exporter.exportAutomations([ request ]);
			},
			'ma.view.resource.export': function(context, data) {
				var request = parseAutomationRequestData(data);
				context.exporter.exportResources([ request ]);
			},
			'ma.view.automation.initiate-new-file': function(context, data) {
				var request = parseAutomationRequestData(data);

				administration.loading(true);
				context.model.createAutomationFile({
					id: request.id
				}).then(function(r){
					var request = {
						id: r.Id,
						name: r.Name,
						type: 'file'
					};
					context.temporaryNewItemCache[context.navigator.serialize(request)] =  r;
					context.navigator.request(request);
				}).always(function(){ administration.loading(false); })
			},
			'ma.view.automation.initiate-upload': function(context, data) {
				context.uploader.upload({ withProgress: true }).then(function(file){
					var request = parseAutomationRequestData(data);
					context.model.saveAutomationFile({
						id: request.id,
						name: file.name,
						uploadContext: file.context
					}).then(function(r){
						context.stagingView.render(r.stagedAutomations);
						context.navigator.request({
							id: r.savedAutomationFile.Id,
							type: 'file',
							name: r.savedAutomationFile.Name
						});
					});
				});
			},
			'ma.view.automations.export': function(context, data) {
				if(data.requests) {
					context.exporter.exportAutomations(data.requests);
				} else {
					context.exporter.exportAllAutomations();
				}
			},
			'ma.view.automations.delete': function(context, data) {
				if(data.requests && confirm(context.resources.confirmDeleteAutomations)) {
					context.model.deleteAutomations({
						automations: data.requests.map(function(t){
							return {
								id: t.id
							};
						})
					}).then(function(deleteResponse){
						if(deleteResponse.deleted) {
							messaging.publish('ma.model.automation.staging.changed');
							context.tabContentController.applyComparisonMode(null, null);
						} else {
							// if not deleted, it was b/c there are choices to be made,
							// for related components to revert. So, show those options
							context.revertStagedComponentsView.prompt({
								revertibleChildren: deleteResponse.revertibleChildren,
								onRevert: function(selections) {
									// re-attempt revert after selections made
									context.model.deleteAutomations($.extend({}, selections, {
										automations: data.requests.map(function(t){
											return {
												id: t.id
											};
										})
									})).then(function(deleteResponseB){
										if(deleteResponseB.deleted) {
											context.tabContentController.applyComparisonMode(null, null);
											messaging.publish('ma.model.automation.staging.changed');
										}
									});
								}
							});
						}
					});
				}
			},
			'ma.view.resources.export': function(context, data) {
				if(data.requests) {
					context.exporter.exportResources(data.requests);
				} else {
					context.exporter.exportAllResources();
				}
			},
			'ma.view.file.delete': function(context, data) {
				var request = parseAutomationRequestData(data);
				context.model.deleteAutomationFile({
					id: request.id,
					name: request.name
				}).then(function(r){
					context.stagingView.render(r.stagedAutomations);
				});
			},
			'ma.view.file.restore': function(context, data) {
				var request = parseAutomationRequestData(data);
				context.model.restoreAutomationFile({
					id: request.id,
					name: request.name
				}).then(function(r){
					// close existing
					context.tabListController.close(request);
					context.tabContentController.close(request);
					// re-navigate
					context.navigator.request(request);
					// render staging
					context.stagingView.render(r.stagedAutomations);
				});
			},
			'ma.view.manual-save': function(context, data) {
				context.model.flushPendingTasks();
			},
			'ma.view.automations.search': function(context, data) {
				context.browseController.focusOnSearch({
					focusedElement: document.activeElement
				});
			},
			'ma.view.automation.publish': function(context, data) {
				var currentRequest = context.tabListController.getCurrent();
				messaging.publish('studio.view.staging.publish', currentRequest);
			},
			'ma.view.automation.revert': function(context, data) {
				var currentRequest = context.tabListController.getCurrent();
				messaging.publish('studio.view.staging.revert', currentRequest);
			},
			'ma.view.documentation.show': function(context, data) {
				if(data && data.type && data.name) {
					// hack to force focusing on something else
					// (in this case a temp form input) to force
					// closing of editor suggestions
					var temporaryInput = $('<input type="text"></input>');
					temporaryInput.appendTo('body').trigger('focus');
					temporaryInput.remove();

					// attempt to get current tab request state
					var currentRequest = context.tabListController.getCurrent();

					context.dockViewController.show('documentation_dock_view', {
						type: data.type,
						name: data.name,
						target: data.target,
						displayName: data.displayname
					});
				}
			},
			'ma.view.automation.remove-preview': function(context, data) {
				var request = parseAutomationRequestData(data);
				context.model.saveAutomation({
					id: request.id,
					newPreviewFileName: '',
					immediate: true
				}).then(function(r){
					context.stagingView.render(r.stagedAutomations);
				});
			},
			'ma.view.automation.upload-preview': function(context, data) {
				var request = parseAutomationRequestData(data);
				context.uploader.upload({ withProgress: true }).then(function(file){
					context.model.saveAutomation({
						id: request.id,
						uploadContext: file.context,
						newPreviewFileName: file.name,
						immediate: true
					}).then(function(r){
						context.stagingView.render(r.stagedAutomations);
					});
				});
			},
			'studio.view.documentation.show': function(context, data) {
				if(data && data.type && data.name) {
					// hack to force focusing on something else
					// (in this case a temp form input) to force
					// closing of editor suggestions
					var temporaryInput = $('<input type="text"></input>');
					temporaryInput.appendTo('body').trigger('focus');
					temporaryInput.remove();

					// attempt to get current tab request state
					var currentRequest = context.tabListController.getCurrent();

					context.dockViewController.show('documentation_dock_view', {
						// pass the current context, if exists for access to-specific private apis
						fragmentId: (currentRequest ? currentRequest.id : null),
						type: data.type,
						name: data.name,
						target: data.target,
						mode: data.mode,
						displayName: data.displayname
					});
				}
			},
			'ma.view.staging.configured': function(context, data) {
				alert(context.resources.configuredImport);
			}
		};

		$.each(viewEvents, function(eventName, handler){
			$.telligent.evolution.messaging.subscribe(eventName, function(data) {
				if(data && data.target) {
					$.extend(data, parseDataOptions(data.target));
				}

				if($.telligent.evolution.widgets.manageAutomations.LOGGING_ENABLED) {
					console.log('VIEW EVENT: ' + eventName);
					console.log(data);
				}

				handler(context, data);
			});
		});
	}


	function handleKeyboardShortcuts(context) {
		var combos = {};

		// define os-specific shortcuts -> message mappings with descriptions
		if(StudioEnvironment.os.ios || StudioEnvironment.os.mac) {
			if(StudioEnvironment.browser.firefox) {
				combos = {
					'ctrl + comma': { message: 'ma.view.automations.search', description: context.resources.shortcutSearch },
					'meta + p': { message: 'ma.view.automation.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'meta + alt + p': { message: 'ma.view.automation.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + alt + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'ctrl + shift + n': { message: 'studio.view.new', description: context.resources.shortcutNewAutomation },
					'ctrl + s': { message: 'ma.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else {
				combos = {
					'ctrl + comma': { message: 'ma.view.automations.search', description: context.resources.shortcutSearch },
					'meta + p': { message: 'ma.view.automation.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'meta + shift + p': { message: 'ma.view.automation.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'ctrl + shift + n': { message: 'studio.view.new', description: context.resources.shortcutNewAutomation },
					'ctrl + s': { message: 'ma.view.manual-save', description: context.resources.shortcutForceSave }
				}
			}
		} else {
			if(StudioEnvironment.browser.firefox) {
				combos = {
					'alt + comma': { message: 'ma.view.automations.search', description: context.resources.shortcutSearch },
					'alt + p': { message: 'ma.view.automation.publish', description: context.resources.shortcutPublish },
					'alt + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'alt + shift + p': { message: 'ma.view.automation.revert', description: context.resources.shortcutRevert },
					'alt + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + n': { message: 'studio.view.new', description: context.resources.shortcutNewAutomation },
					'ctrl + s': { message: 'ma.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else if(StudioEnvironment.browser.edge) {
				combos = {
					'alt + comma': { message: 'ma.view.automations.search', description: context.resources.shortcutSearch },
					'alt + p': { message: 'ma.view.automation.publish', description: context.resources.shortcutPublish },
					'alt + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'alt + shift + p': { message: 'ma.view.automation.revert', description: context.resources.shortcutRevert },
					'alt + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + n': { message: 'studio.view.new', description: context.resources.shortcutNewAutomation },
					'ctrl + s': { message: 'ma.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else {
				combos = {
					'alt + comma': { message: 'ma.view.automations.search', description: context.resources.shortcutSearch },
					'ctrl + p': { message: 'ma.view.automation.publish', description: context.resources.shortcutPublish },
					'alt + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'ctrl + shift + p': { message: 'ma.view.automation.revert', description: context.resources.shortcutRevert },
					'alt + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + n': { message: 'studio.view.new', description: context.resources.shortcutNewAutomation },
					'ctrl + s': { message: 'ma.view.manual-save', description: context.resources.shortcutForceSave }
				}
			}
		}

		// register mappings
		var shortcuts = $.telligent.evolution.shortcuts;
		var evolutionCodeEditorCommandOverrides = {};
		$.each(combos, function(k, v) {

			// register it with the shortcut registrar
			shortcuts.register(k, function(){
				messaging.publish(v.message);
				return (v.bubble ? true : false);
			}, {
				direction: (v.direction || 'down'),
				description: v.description,
				namespace: $.telligent.evolution.administration.panelNameSpace()
			});

			// register it as an evolutionCodeEditor override
			evolutionCodeEditorCommandOverrides[k] = function(){
				messaging.publish(v.message);
				return (v.bubble ? true : false);
			};
		});
		context.shortcuts = shortcuts;

		// apply evolutionCodeEditor command overrides
		$.extend($.fn.evolutionCodeEditor.defaults.commandOverrides,
			evolutionCodeEditorCommandOverrides);

		// register default studio shortcuts
		context.studioShortcutsController = new StudioShortcutsController({
			tabListView: context.tabListController.view(),
			browseView: context.browseController.view()
		});
		context.studioShortcutsController.registerDefaultShortcuts();
	}

	// build dock view controller
	function buildStudioDockViewController(context) {
		context.dockViewController = new StudioDockViewController({
			container: context.panelWrapper.find('.dock').first(),
			sized: function(height) {
				context.tabContentController.applyBottomMargin(height);
				context.scriptConsoleDockView.resized();
			}
		});

		// immediate console dock view
		context.scriptConsoleDockView = new StudioScriptConsoleDockView({
			name: context.resources.scriptSandbox,
			onGetSettings: function() {
				return context.settings.get();
			},
			onNavigateRight: function(editor) {
				return handleRightNavigationInEditor(editor);
			}
		});

		context.dockViewController.register(context.scriptConsoleDockView);
		var savedEditorSettings = context.settings.get();
		if(savedEditorSettings) {
			context.scriptConsoleDockView.updateEditorSettings(savedEditorSettings);
		}

		// global search dock view
		context.dockViewController.register(new GlobalSearchDockView({
			globalSearchTemplate: $.telligent.evolution.template(context.templates.globalSearchTemplate),
			globalSearchResultTemplate: $.telligent.evolution.template(context.templates.globalSearchResultTemplate),
			globalSearchResultOverviewTemplate: $.telligent.evolution.template(context.templates.globalSearchResultOverviewTemplate),
			globalSearchResultLoadingTemplate: $.telligent.evolution.template(context.templates.globalSearchResultLoadingTemplate),
			onNavigate: function(request) {
				context.navigator.request(context.navigator.parse(request));
			},
			onSearch: function(options) {
				return context.model.search(options);
			}
		}));

		// documentation dock view
		context.dockViewController.register(new StudioApiDocumentationDockView({
			name: context.resources.apiDocumentation,
			includeAutomationEvents: true
		}));
	}

	function buildTabPersistence(context) {
		context.tabListStore = new StudioTabListStore({
			tabListView: context.tabListController.view(),
			storageNameSpace: 'automations',
			onLoad: function(key) {
				var request = context.navigator.parse(key);

				if(Utility.isFileRequest(request)) {
					return context.model.getAutomationFile({
						id: request.id,
						name: request.name,
						fallback: true
					}).then(function(model){
						if(model) {
							context.tabContentController.render(request, model);
							context.currentRenderedRequest = request;
							var req = $.extend({}, request);
							//req.id = null;
							context.dockViewController.setEditorTabState(req);
						}
						return {
							request: request,
							model: model
						};
					});
				// if any other part of the automation, load the full automation
				} else {
					return context.model.getAutomation({
						id: request.id
					}).then(function(model){
						if(model) {
							context.tabContentController.render(request, model);
							context.currentRenderedRequest = request;
							var req = $.extend({}, request);
							//req.id = null;
							context.dockViewController.setEditorTabState(req);
						}
						return {
							request: request,
							model: model
						};
					});
				}
			},
			onAddTab: function(tab) {
				if(tab && tab.request && tab.model) {
					context.tabListController.addOrSelect(tab.request, tab.model, false);
				}
			}
		});
	}

	function processInitialState(context) {
		var initialRequest;

		// load currently-staged automations
		loadAndRenderStagingView(context);

		// load initial browse list
		context.browseController.loadInitial().then(function(){
			if(initialRequest && initialRequest.id) {
				context.browseController.select(initialRequest);
			}
		});

		context.tabListStore.restore().then(function(previouslySelectedTabKey){
			initialRequest = context.navigator.processCurrent();

			if((!initialRequest || !initialRequest.id) && previouslySelectedTabKey) {
				var previouslySelectedRequest = context.navigator.parse(previouslySelectedTabKey)
				// try to select if still possible (not deleted/unstaged)
				if (!context.tabListController.select(previouslySelectedRequest)) {
					// if no longer exists, select first available tab
					var allTabs = context.tabListController.listAll();
					if (allTabs.length > 0) {
						initialRequest = allTabs[allTabs.length - 1].request;
						context.tabListController.select(initialRequest)
					}
				}
			}

			// pre-set any diff state
			if (initialRequest) {
				var hashedData = $.telligent.evolution.url.hashData();
				if(hashedData['diffwith']) {
					context.tabContentController.applyComparisonMode(initialRequest, hashedData['diffwith']);
					delete hashedData['diffwith'];
					$.telligent.evolution.url.hashData(hashedData, {
						overrideCurrent: true
					});
				}
			}

			// pre-set any import transfer state
			var hashedData = $.telligent.evolution.url.hashData();
			if(hashedData['importUploadContext'] && hashedData['importFileName']) {
				var importUploadContext = hashedData['importUploadContext'];
				var importFileName = hashedData['importFileName'];
				delete hashedData['importUploadContext'];
				delete hashedData['importFileName'];
				$.telligent.evolution.url.hashData(hashedData, {
					overrideCurrent: true
				});
				importFile(context, importUploadContext, importFileName);
			}
		});
	}

	function unhandleModelEvents(context) {
		if(context.previewingFromAutomationStudio) {
			$.telligent.evolution.automationPreview.enabled(false);
		}
	}

	function unHandleViewEvents(context) {
		[
			context.navigator.unregisterHandlers,
			context.tabContentController.closeAll,
			context.tabListController.closeAll,
			context.browseController.cleanup,
			context.tabListController.cleanup,
			context.dockViewController.cleanup
		].forEach(function(cleanup) {
			try {
				cleanup();
			} catch(e) {}
		})
		$('body').removeClass('collapsed-categories');
		$(global).trigger('resize');
	}

	// Potentially triggers navigation to documentation if suggestion open
	function handleRightNavigationInEditor(editor) {
		// if there's an open suggestion documentation link, navigate to it instead
		var suggestedCompletionDocumentationLink = $('.mfw.suggestion.view_docs:visible');
		if(suggestedCompletionDocumentationLink.length > 0) {
			suggestedCompletionDocumentationLink.trigger('click');
			// immediately re-focus on the editor after showing the documentation
			setTimeout(function(){
				$(editor).evolutionCodeEditor('focus', true);
			}, 50);
			return false;
		} else {
			return true;
		}
	}

	function onSerializeModelIdentifier(request, modelType) {
		var pairs = [];

		pairs.push('_aid' + "=" + encodeURIComponent(request.id || ''));

		if(modelType == 'component' && Utility.isFileRequest(request)) {
			pairs.push('_at' + "=" + encodeURIComponent(request.type || ''));
			pairs.push('_an' + "=" + encodeURIComponent(request.name || ''));
		}

		return pairs.join('&');
	}

	function loadAndRenderStagingView(context) {
		return $.Deferred(function(d){
			context.model.listAutomations({
				staged: true
			}).then(function(a){
				context.model.listConfiguredAutomations({
					staged: true,
					pageSize: 100
				}).then(function(ca){
					context.stagingView.render((a.automations || []).concat(ca.configuredAutomations || []));
					d.resolve(a);
				});
			});
		}).promise();
	}

	var Controller = function(options){
		var context = $.extend({}, defaults, options || {});

		// cache of new automations and files that haven't ever yet been saved
		// created when requested by the UI, then held here
		// for purposes of pulling from when a navigation-based request is made for them
		// removed from this cache whenever they're first saved or their tabs are subsequently closed
		context.temporaryNewItemCache = {};

		return {
			run: function() {
				// models
				context.settings = new StudioSettings({});
				context.model = buildModel(context);
				context.apiModel = StudioApiDataModelProvider.model();

				context.uploader = new StudioUploader({
					uploadContextId: context.urls.uploadContextId,
					uploadUrl: context.urls.uploadFileUrl,
					container: administration.panelWrapper()
				});

				// set up main content wrapper
				context.panelWrapper = $($.telligent.evolution.template(context.templates.panelWrapperTemplate)({}))
					.appendTo(administration.panelWrapper());

				// edit view controller
				buildEditViewController(context);

				// views
				buildViews(context).then(function(){
					// navigator
					buildStudioNavigator(context);

					// initiate handlers
					handleModelEvents(context);
					handleViewEvents(context);
					handleKeyboardShortcuts(context);

					// dock view controller
					buildStudioDockViewController(context)

					// tab persistence
					buildTabPersistence(context);

					// process initial state
					processInitialState(context);
				});

				// clean up handlers on unload
				administration.on('panel.unloaded', function(){
					context.model.flushPendingTasks();
					context.model.dispose();
					unhandleModelEvents(context);
					unHandleViewEvents(context);
				});
			}
		}
	};

	return Controller;

}, jQuery, window);