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
		'SelectFileTypeView',
		'GlobalSearchDockView',
		'ImportSelectorView',
		'RevertStagedComponentsView',
		'RevertOptionsView',
		'SelectThemeView',
		'PreviewThemeView'
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
		SelectFileTypeView,
		GlobalSearchDockView,
		ImportSelectorView,
		RevertStagedComponentsView,
		RevertOptionsView,
		SelectThemeView,
		PreviewThemeView,
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
			exportResourcesUrl: context.urls.exportResourcesUrl,
			exportThemesUrl: context.urls.exportThemesUrl,
			storeTemporaryExportListUrl: context.urls.storeTemporaryExportListUrl
		});

		return dataModel;
	}

	function buildEditViewController(context) {
		function processSave(context, request, model, immediately) {
			if (Utility.isFileRequest(request)) {
				return context.model.saveThemeFile({
					id: model.Id,
					typeId: model.TypeId,
					type: model.Type.toLowerCase(),
					name: model.Name,
					content: model.Content,
					newName: model.NewName,
					queueSalt: model.queueSalt,
					applyToModals: model.ApplyToModals,
					applyToNonModals: model.ApplyToNonModals,
					applyToAuthorizationRequests: model.ApplyToAuthorizationRequests,
					internetExplorerMaxVersion: model.InternetExplorerMaxVersion,
					mediaQuery: model.MediaQuery,
					isRightToLeft: model.IsRightToLeft,
					immediate: immediately
				}).then(function(r){
					context.stagingView.render(r.stagedThemes);
				});
			} else {
				return context.model.saveTheme({
					id: model.Id,
					typeId: model.TypeId,
					name: model.Name,
					description: model.Description,
					mediaMaxWidthPixels: model.MediaMaxWidthPixels,
					mediaMaxHeightPixels: model.MediaMaxHeightPixels,
					headScript: model.HeadScript,
					headScriptLanguage: model.HeadScriptLanguage,
					bodyScript: model.BodyScript,
					bodyScriptLanguage: model.BodyScriptLanguage,
					resourcesToSave: model.ResourcesToSave,
					configurationXml: model.ConfigurationXml,
					configurationScript: model.ConfigurationScript,
					paletteTypesXml: model.PaletteTypesXml,
					newScriptFiles: model.NewScriptFiles,
					newStyleFiles: model.NewStyleFiles,
					restScopeIds: (model.RestScopes || []).map(function (s) { return s.Id }).join(','),
					immediate: immediately
				}).then(function (r) {
					context.stagingView.render(r.stagedThemes);
				});
			}
		}

		function processLoadDefaultVariant(context, request, includeAllAttachments) {
			if (Utility.isFileRequest(request)) {
				return context.model.getThemeFile({
					id: request.id,
					typeId: request.typeId,
					type: request.type,
					name: request.name,
					staged: false,
					factoryDefault: true
				});
			} else {
				return context.model.getTheme({
					id: request.id,
					typeId: request.typeId,
					staged: false,
					factoryDefault: true,
					includeFileDigests: includeAllAttachments
				})
			}
		}

		function processLoadStaged(context, request, includeAllAttachments) {
			if (Utility.isFileRequest(request)) {
				return context.model.getThemeFile({
					id: request.id,
					typeId: request.typeId,
					type: request.type,
					name: request.name,
					staged: true
				});
			} else {
				return context.model.getTheme({
					id: request.id,
					typeId: request.typeId,
					staged: true,
					includeFileDigests: includeAllAttachments
				});
			}
		}

		function processLoadNonStaged(context, request, includeAllAttachments) {
			if (Utility.isFileRequest(request)) {
				return context.model.getThemeFile({
					id: request.id,
					typeId: request.typeId,
					type: request.type,
					name: request.name,
					staged: false
				});
			} else {
				return context.model.getTheme({
					id: request.id,
					typeId: request.typeId,
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
			getAutoCompleteSuggestions: function(mode, prefix) {
				var savedEditorSettings = context.settings.get();
				return context.apiModel.listSuggestions({
					mode: mode,
					prefix: prefix,
					completeFullMemberSignature: (savedEditorSettings.completeFullMemberSignature === undef ? true : savedEditorSettings.completeFullMemberSignature)
				});
			},
			serializeRequest: function(request, options) {
				return context.navigator.serialize(request, options);
			},
			onCompareRequested: function(request, variantType) {
				context.tabContentController.applyComparisonMode(request, variantType);
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
						TypeName: updateModel.TypeName,
						ThemeName: updateModel.Name,
						State: updateModel.State,
						IsStaged: updateModel.IsStaged
						/*
						ThemeName: updateModel.ThemeName, 	// when it's a file
						Name: updateModel.Name, 			// when file: file name. when typeId: theme name
						*/
					});

				// if this is an update of a file tab
				} else if (
					Utility.isFileRequest(editorRequest) &&
					Utility.isFileRequest(updateRequest) &&
					editorRequest.type == updateRequest.type &&
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
						// updating a file tab with new theme model data
						} else {
							// name and staged state is the only reasonable change here
							controller.applyModelChanges({
								ThemeName: updateModel.Name,
								IsStaged: updateModel.IsStaged,
								IsTranslated: updateModel.IsTranslated,
								IsReverted: updateModel.IsReverted,
								IsDeleted: updateModel.IsDeleted
							});
						}
					// if the tab is for a theme component and the request isn't related to a file...
					} else if(!updateRequest.name) {
						// otherwise, it's a regular theme tab
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

			context.selectFileTypeView = new SelectFileTypeView({
				template: $.telligent.evolution.template(context.templates.selectFileTypeTemplate)
			});

			context.revertStagedComponentsView = new RevertStagedComponentsView({
				template: $.telligent.evolution.template(context.templates.revertStagedComponentsTemplate),
				title: context.resources.revertStagedChanges
			});

			context.revertOptionsView = new RevertOptionsView({
				template: $.telligent.evolution.template(context.templates.revertOptionsTemplate),
				title: context.resources.revertLayoutAndOptions,
				revertConfirmation: context.resources.revertConfirmation
			});

			context.selectThemeView = new SelectThemeView({
				template: $.telligent.evolution.template(context.templates.selectThemeTemplate),
				title: context.resources.selectThemeTitle
			});

			context.previewThemeView = new PreviewThemeView({
				template: $.telligent.evolution.template(context.templates.previewThemeTemplate),
				title: context.resources.previewChangesTitle,
				onFindApplications: function(options) {
					return context.model.findApplications(options);
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

				// Browse Controller
				var browseContainer = $('<div></div>').appendTo(sideBar);
				var browseHeaderContent = $($.telligent.evolution.template(context.templates.browseHeaderTemplate)({}));
				context.browseController = new StudioBrowseController({
					resources: context.resources,
					browseHeaderContent: browseHeaderContent,
					browseViewItemTemplate: context.templates.browseViewItemTemplate,
					actionsTemplate: $.telligent.evolution.template(context.templates.themeActionsTemplate),
					container: browseContainer,
					wrapperCssClass: 'management-studio manage-themes',
					searchPlaceholder: context.resources.nameorDescription,
					linkNew: false,
					linkUpload: true,
					multiSelectActions: [
						{ message: 'mt.view.themes.export', label: context.resources.exportSelectedThemes },
						{ message: 'mt.view.resources.export', label: context.resources.exportSelectedResources },
						{ message: 'mt.view.themes.delete', label: context.resources.deleteSelectedThemes }
					],
					onList: function(explicitQuery) {
						if(!context.browseSearchInput) {
							context.browseSearchInput = browseContainer.find('input.query');
							context.browseStateSelect = browseContainer.find('select.state-select');
							context.browseTypeSelect = browseContainer.find('select.type-select');

							context.browseStateSelect.on('change', function(){
								context.browseController.load();
							});
							context.browseTypeSelect.on('change', function(){
								context.browseController.load();
							});
						}

						var query = {};
						if($.trim(context.browseSearchInput.val()).length > 0) {
							query.query = $.trim(context.browseSearchInput.val());
						}

						if(context.browseStateSelect.val() !== 'all') {
							query.state = context.browseStateSelect.val();
						}

						if(context.browseTypeSelect.val() !== 'all') {
							query.typeId = context.browseTypeSelect.val();
						}

						if(explicitQuery && explicitQuery.length > 0) {
							query.query = explicitQuery;
						}

						return context.model.listThemes(query).then(function(r){
							// if searched...
							if(query.query) {
								// build a flattened list of possible search results
								var flattenedThemeComponents = [];
								for(var i = 0; i < r.themes.length; i++) {
									var theme = r.themes[i];

									// overview
									flattenedThemeComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: theme.Id,
											typeId: theme.TypeId,
											type: 'overview'
										}),
										label: context.resources.overview,
										model: theme,
										cssClass: 'managed-item overview',
										haystack: (theme.Name + ' ' + theme.TypeName + ' ' + context.resources.overview).toLowerCase()
									});

									// head script
									flattenedThemeComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: theme.Id,
											typeId: theme.TypeId,
											type: 'headscript'
										}),
										label: context.resources.headScript,
										model: theme,
										cssClass: 'managed-item headscript',
										haystack: (theme.Name + ' ' + theme.TypeName + ' ' + context.resources.headScript).toLowerCase()
									});

									// body script
									flattenedThemeComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: theme.Id,
											typeId: theme.TypeId,
											type: 'bodyscript'
										}),
										label: context.resources.bodyScript,
										model: theme,
										cssClass: 'managed-item bodyscript',
										haystack: (theme.Name + ' ' + theme.TypeName + ' ' + context.resources.bodyScript).toLowerCase()
									});

									// configuration
									flattenedThemeComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: theme.Id,
											typeId: theme.TypeId,
											type: 'configuration'
										}),
										label: context.resources.configuration,
										model: theme,
										cssClass: 'managed-item configuration',
										haystack: (theme.Name + ' ' + theme.TypeName + ' ' + context.resources.configuration).toLowerCase()
									});

									// resources
									flattenedThemeComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: theme.Id,
											typeId: theme.TypeId,
											type: 'resources'
										}),
										label: context.resources.resources,
										model: theme,
										cssClass: 'managed-item resources',
										haystack: (theme.Name + ' ' + theme.TypeName + ' ' + context.resources.resources).toLowerCase()
									});

									// palette
									flattenedThemeComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: theme.Id,
											typeId: theme.TypeId,
											type: 'palettes'
										}),
										label: context.resources.palettes,
										model: theme,
										cssClass: 'managed-item palettes',
										haystack: (theme.Name + ' ' + theme.TypeName + ' ' + context.resources.palettes).toLowerCase()
									});

									// layouts
									flattenedThemeComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: theme.Id,
											typeId: theme.TypeId,
											type: 'layouts'
										}),
										label: context.resources.layouts,
										model: theme,
										cssClass: 'managed-item layouts',
										haystack: (theme.Name + ' ' + theme.TypeName + ' ' + context.resources.layouts).toLowerCase()
									});

									// fragments
									flattenedThemeComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: theme.Id,
											typeId: theme.TypeId,
											type: 'fragments'
										}),
										label: context.resources.fragments,
										model: theme,
										cssClass: 'managed-item fragments',
										haystack: (theme.Name + ' ' + theme.TypeName + ' ' + context.resources.fragments).toLowerCase()
									});

									// style files
									if (theme.StyleFiles && theme.StyleFiles.length > 0) {
										for(var f = 0; f < theme.StyleFiles.length; f++) {
											var file = theme.StyleFiles[f];
											flattenedThemeComponents.push({
												isFilterResult: true,
												key: context.navigator.serialize({
													id: theme.Id,
													typeId: (theme.TypeId || ''),
													type: 'style',
													name: file.Name
												}),
												label: file.Name,
												model: theme,
												cssClass: 'managed-item style',
												haystack: (theme.Name + ' ' + theme.TypeName + ' ' + file.Name).toLowerCase()
											});
										}
									}

									// script files
									if (theme.ScriptFiles && theme.ScriptFiles.length > 0) {
										for(var f = 0; f < theme.ScriptFiles.length; f++) {
											var file = theme.ScriptFiles[f];
											flattenedThemeComponents.push({
												isFilterResult: true,
												key: context.navigator.serialize({
													id: theme.Id,
													typeId: (theme.TypeId || ''),
													type: 'script',
													name: file.Name
												}),
												label: file.Name,
												model: theme,
												cssClass: 'managed-item script',
												haystack: (theme.Name + ' ' + theme.TypeName + ' ' + file.Name).toLowerCase()
											});
										}
									}

									// files
									if (theme.Files && theme.Files.length > 0) {
										for(var f = 0; f < theme.Files.length; f++) {
											var file = theme.Files[f];
											flattenedThemeComponents.push({
												isFilterResult: true,
												key: context.navigator.serialize({
													id: theme.Id,
													typeId: (theme.TypeId || ''),
													type: 'file',
													name: file.Name
												}),
												label: file.Name,
												model: theme,
												cssClass: 'managed-item file',
												haystack: (theme.Name + ' ' + theme.TypeName + ' ' + file.Name).toLowerCase()
											});
										}
									}
								}

								// filter flattened theme components to items that contain all words in the query, regardless of order
								var queryComponents = query.query.toLowerCase().split(' ');
								return flattenedThemeComponents.filter(function(t){
									var includesQuery = true;
									for(var i = 0; i < queryComponents.length; i++) {
										includesQuery = includesQuery && t.haystack.indexOf(queryComponents[i]) >= 0
									}
									return includesQuery;
								});

							} else {
								return r.themes;
							}
						});
					},
					onGetAndSelect: function(request) {
						return context.model.getTheme({
							id: request.id,
							typeId: request.typeId
						}).then(function(theme){
							context.browseSearchInput.val('');
							context.browseStateSelect.val('all');
							context.browseTypeSelect.val('all');
							return theme;
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
						if(parsedRequest.type == 'stylefiles'
							|| parsedRequest.type == 'scriptfiles'
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
					onSort: function(parentRequest, childRequests) {
						// re-order style files
						if(parentRequest.type == 'stylefiles') {
							context.model.saveTheme({
								id: parentRequest.id,
								typeId: parentRequest.typeId,
								newStyleFiles: childRequests.map(function(r){ return r.name }),
								immediate: true
							}).then(function(r){
								context.stagingView.render(r.stagedThemes);
							});
						} else if(parentRequest.type == 'scriptfiles') {
							// re-order script files
							context.model.saveTheme({
								id: parentRequest.id,
								typeId: parentRequest.typeId,
								newScriptFiles: childRequests.map(function(r){ return r.name }),
								immediate: true
							}).then(function(r){
								context.stagingView.render(r.stagedThemes);
							});
						}
					},
					onConvertModelToNode: function(model) {
						if(model.isFilterResult) {
							return model;
						} else {
							var overviewNode = {
								key: context.navigator.serialize({
									id: model.Id,
									typeId: model.TypeId,
									type: 'overview'
								}),
								label: model.Name,
								cssClass: 'managed-item overview',
								model: model,
								children: []
							};
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									typeId: model.TypeId,
									type: 'headscript'
								}),
								label: context.resources.headScript,
								cssClass: 'managed-item headscript'
							});
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									typeId: model.TypeId,
									type: 'bodyscript'
								}),
								label: context.resources.bodyScript,
								cssClass: 'managed-item bodyscript'
							});
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									typeId: model.TypeId,
									type: 'configuration'
								}),
								label: context.resources.configuration,
								cssClass: 'managed-item configuration'
							});
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									typeId: model.TypeId,
									type: 'resources'
								}),
								label: context.resources.resources,
								cssClass: 'managed-item resources'
							});
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									typeId: model.TypeId,
									type: 'palettes'
								}),
								label: context.resources.palettes,
								cssClass: 'managed-item palettes'
							});
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									typeId: model.TypeId,
									type: 'layouts'
								}),
								label: context.resources.layouts,
								cssClass: 'managed-item layouts'
							});
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									typeId: model.TypeId,
									type: 'fragments'
								}),
								label: context.resources.fragments,
								cssClass: 'managed-item fragments'
							});

							if (model.StyleFiles && model.StyleFiles.length > 0) {
								var filesNode = {
									key: context.navigator.serialize({
										id: model.Id,
										typeId: model.TypeId,
										type: 'stylefiles'
									}),
									label: context.resources.styleSheets,
									cssClass: 'managed-item stylefiles',
									sortable: true,
									children: []
								};
								for(var i = 0; i < model.StyleFiles.length; i++) {
									filesNode.children.push({
										key: context.navigator.serialize({
											id: model.Id,
											typeId: (model.TypeId || ''),
											type: 'style',
											name: model.StyleFiles[i].Name
										}),
										type: 'style',
										label: model.StyleFiles[i].Name,
										cssClass: 'managed-item style'
									});
								}
								overviewNode.children.push(filesNode);
							}

							if (model.ScriptFiles && model.ScriptFiles.length > 0) {
								var filesNode = {
									key: context.navigator.serialize({
										id: model.Id,
										typeId: model.TypeId,
										type: 'scriptfiles'
									}),
									label: context.resources.scripts,
									cssClass: 'managed-item scriptfiles',
									sortable: true,
									children: []
								};
								for(var i = 0; i < model.ScriptFiles.length; i++) {
									filesNode.children.push({
										key: context.navigator.serialize({
											id: model.Id,
											typeId: (model.TypeId || ''),
											type: 'script',
											name: model.ScriptFiles[i].Name
										}),
										type: 'script',
										label: model.ScriptFiles[i].Name,
										cssClass: 'managed-item script'
									});
								}
								overviewNode.children.push(filesNode);
							}

							// files
							if (model.Files && model.Files.length > 0) {
								var filesNode = {
									key: context.navigator.serialize({
										id: model.Id,
										typeId: model.TypeId,
										type: 'files'
									}),
									label: context.resources.files,
									cssClass: 'managed-item files',
									children: []
								};

								// infer sub-categories based on file types
								var categories = [
									{ name: context.resources.images, type: 'fileimages', extensions: [ 'ico','jpg','jpeg','gif','png','svg','bmp','tiff' ], files: [] },
									{ name: context.resources.fonts, type: 'filefonts', extensions: [ 'ttf','eot','otf','woff','woff2' ], files: [] },
									{ name: context.resources.styleSheetIncludes, type: 'filestyles', extensions: [ 'less','css' ], files: [] },
									{ name: context.resources.scripts, type: 'filescripts', extensions: [ 'js' ], files: [] }
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
												typeId: model.TypeId,
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
													typeId: (model.TypeId || ''),
													type: 'file',
													name: categories[ci].files[fi]
												}),
												label: categories[ci].files[fi],
												cssClass: 'managed-item file',
												type: 'file'
											});
										}

										filesNode.children.push(categoryNode);
									}
								}

								overviewNode.children.push(filesNode);
							}

							return overviewNode;

						}
					}
				});

				var extraLinkTemplate = $.telligent.evolution.template.compile('<a href="#" data-messagename="<%: message %>"><%= label %></a>');
				[
					{ message: 'mt.view.themes.export', label: context.resources.exportAllThemes },
					{ message: 'mt.view.resources.export', label: context.resources.exportAllResources }
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
		//		_tid (theme id)
		//		_ttid (theme type id)
		//		_tt (type)
		//			overview
		//			configuration
		//			headscript
		//			bodyscript
		//			resources
		//			palettes
		//			style (file type)
		//			script (file type)
		//			file (file type)
		//		_tn (file name, if file)
		//		_tl (line number, if there's a line number)

		function prefix(options) {
			if(!options)
				return {};

			return {
				_tid: options.id || '',
				_ttid: options.typeId || '',
				_tt: options.type || '',
				_tn: options.name || '',
				_tl: options.line || 0
			};
		}

		function dePrefix(options) {
			return {
				id: options._tid || '',
				typeId: options._ttid || '',
				type: options._tt || '',
				name: options._tn || '',
				line: (options._tl ? parseInt(options._tl, 10) : 0)
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
					return context.model.getThemeFile({
						id: request.id,
						typeId: request.typeId,
						type: request.type,
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
					return context.model.getTheme({
						id: request.id,
						typeId: request.typeId
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

				pairs.push('_tid' + "=" + encodeURIComponent(request.id || ''));
				pairs.push('_ttid' + "=" + encodeURIComponent(request.typeId || ''));

				pairs.push('_tt' + "=" + encodeURIComponent(request.type || ''));

				// ignore file names for non-file requests
				// the field is overloaded for navigating to deeper parts of a component
				// such as resource names, but is not useful in identifying overall tabs
				if(Utility.isFileRequest(request) || (options && options.includeAttachment)) {
					pairs.push('_tn' + "=" + encodeURIComponent(request.name || ''));
				}

				if(options && options.includeLineNumber) {
					pairs.push('_tl' + "=" + encodeURIComponent(request.line || 0));
				}

				return pairs.join('&');
			},
			onDeserialize: function(request) {
				return dePrefix($.telligent.evolution.url.parseQuery(request || ''));
			},
			onPrefix: prefix,
			onDePrefix: dePrefix
		});
	}

	function handleModelEvents(context) {
		function buildKey(typeId, id) {
			return "k:" + typeId  + ":" + id;
		}

		var modelEvents = {

			'mt.model.theme.staging.changed': function(data) {
				// determine a list of originally staged items by looking at the pre-updated stagingView
				var originalStagedRequests = $.map(context.stagingView.list(), function(m) { return { id: $(m).data('id'), typeId: $(m).data('typeid') }; } )
				loadAndRenderStagingView(context).then(function(){
					// get list of newly staged items
					var newStagedRequests = $.map(context.stagingView.list(), function(m) { return { id: $(m).data('id'), typeId: $(m).data('typeid') }; } )

					// map them to a hash for quick checking
					var newStagedRequestsIndex = {};
					for(var i = 0; i < newStagedRequests.length; i++) {
						newStagedRequestsIndex[buildKey(newStagedRequests[i].typeId, newStagedRequests[i].id)] = newStagedRequests[i];
					}


					// get list of all currently open themes, and map them to a hash for
					// quickly determining if they should be reloaded
					// get list of currently open tabs
					var tabs = context.tabListController.listAll();
					var tabsIndex = {};
					for(var i = 0; i < tabs.length; i++) {
						tabsIndex[buildKey(tabs[i].request.typeId, tabs[i].request.id)] = tabs[i].request;
					}

					// identify which original requests are no longer represented
					// by looping over the original and comparing with check index
					for(var i = 0; i < originalStagedRequests.length; i++) {
						(function(i){

							var key = buildKey(originalStagedRequests[i].typeId, originalStagedRequests[i].id);
							if(newStagedRequestsIndex[key]) {
								return;
							} else {
								// if an item was staged that no longer is...
								var request = originalStagedRequests[i];
								var serializedOriginalRequest = buildKey(request.typeId, request.id);

								// if published theme wasn't open in any tabs, don't reload
								if(!tabsIndex[serializedOriginalRequest])
									return;

								// otherwise, load the theme
								context.model.getTheme({
									id: request.id,
									typeId: request.typeId
								}).then(function(updatedTheme){
									// if the theme doesn't exist,
									// then this was a revert of something that was never savedTheme
									// and we want to just close its UI completely
									if(!updatedTheme) {
										context.tabListController.close(request, true);
										context.tabContentController.close(request, true);
										return;
									}

									// otherwise, this was a publish, and we want to treat its UI
									// the same way as when a "revert" happens, in that
									// we let the app take care of investigating what
									// needs to be updated in each album or not
									$.telligent.evolution.messaging.publish('mt.model.theme.updated', {
										model: updatedTheme,
										reverted: true,
										id: {
											id: request.id,
											typeId: request.typeId
										}
									})
								});
							}

						})(i);
					}
				});
			},
			'mt.model.themes.changed': function(data) {
				// when a mass themes change has been completed
				context.browseController.loadInitial().then(function(){
					var currentRequest = context.tabListController.getCurrent();
					if(currentRequest) {
						context.browseController.select(currentRequest);
					}
				});
			},
			'mt.model.theme.created': function(data) {
				// if cloned, open new clone in a tab
				if(data.cloned) {

					context.navigator.request({
						id: data.model.Id,
						typeId: data.model.TypeId,
						type: 'overview'
					});

					// update browse view
					context.browseController.add({
						id: data.id.id,
						typeId: data.id.typeId
					}, data.model);

				} else {
					// update tabs
					context.tabListController.update({
						id: data.id.id,
						typeId: data.id.typeId
					}, data.model);

					// update open edit views
					context.tabContentController.update({
						id: data.id.id,
						typeId: data.id.typeId
					}, data.model);

					// update browse view
					context.browseController.add({
						id: data.id.id,
						typeId: data.id.typeId
					}, data.model);
				}
			},
			'mt.model.theme.updated': function(data) {
				// update tabs
				context.tabListController.update({
					id: data.id.id,
					typeId: data.id.typeId
				}, data.model);

				// update open edit views
				context.tabContentController.update({
					id: data.id.id,
					typeId: data.id.typeId
				}, data.model, data.reverted);

				// update browse view
				context.browseController.update({
					id: data.id.id,
					typeId: data.id.typeId
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
					if(data.model.ScriptFiles) {
						for(var i = 0; i < data.model.ScriptFiles.length; i++) {
							currentFileIndex['script:' + data.model.ScriptFiles[i].Name] = data.model.ScriptFiles[i];
						}
					}
					if(data.model.StyleFiles) {
						for(var i = 0; i < data.model.StyleFiles.length; i++) {
							currentFileIndex['style:' + data.model.StyleFiles[i].Name] = data.model.StyleFiles[i];
						}
					}

					// get a list of currently-rendered requests for the model
					var renderedRequests = context.tabContentController.listRelatedRenderedRequestsForRequest({
						id: data.id.id,
						typeId: data.id.typeId
					});

					$.each(renderedRequests, function(i, request){
						if(Utility.isFileRequest(request)) {
							// if the staged file request is no longer
							// a part of the reverted set of files (either it was new or renamed)
							// then just close it altogether.
							if(!currentFileIndex[request.type + ':' + request.name]) {
								context.tabListController.close(request, false);
								context.tabContentController.close(request);
							} else {
								// otherwise, fully load the old file content and re-render it
								context.model.getThemeFile({
									id: request.id,
									typeId: request.typeId,
									name: request.name,
									type: request.type
								}).then(function(revertedThemeFile){
									context.tabContentController.update({
										id: request.id,
										typeId: request.typeId,
										name: request.name,
										type: request.type
									}, revertedThemeFile, data.reverted);
								})
							}
						}
					});
				}
			},
			'mt.model.themes.updated': function(data) {
				// get a unique list of all currently open requests
				var tabs = context.tabListController.listAll();
				var tabsIndex = {};
				for(var i = 0; i < tabs.length; i++) {
					tabsIndex[buildKey(tabs[i].request.typeId, tabs[i].request.id)] = tabs[i].request;
				}

				// filter the list of updated themes to only those with open tabs
				data.themes.forEach(function(theme) {
					if (tabsIndex[buildKey(theme.typeId, theme.id)]) {

						// for each theme that has open tab(s), load it and synthesize
						// a full update event of it in order to trigger updating of all of its
						// tabs the same as if it had received a full update event or been reverted
						context.model.getTheme(theme).then(function(updatedTheme){
							if(!updatedTheme) {
								return;
							}
							$.telligent.evolution.messaging.publish('mt.model.theme.updated', {
								model: updatedTheme,
								reverted: true, // forces a re-analysis of all request/attachments
								id: theme
							})
						});
					}
				});
			},
			'mt.model.theme.deleted': function(data) {
				// close any tab items for the data
				context.tabListController.close({
					id: data.id.id,
					typeId: data.id.typeId
				}, true);

				// close editor instances
				context.tabContentController.close({
					id: data.id.id,
					typeId: data.id.typeId
				}, true);

				// update browse view
				context.browseController.remove({
					id: data.id.id,
					typeId: data.id.typeId
				});
			},
			'mt.model.file.created': function(data) {
				// if rename, ensure temp item cache doesn't contain old
				if (data.id && data.model && data.id.name != data.model.Name) {
					delete context.temporaryNewItemCache[context.navigator.serialize(data.id)];
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
						typeId: data.model.TypeId,
						type: data.model.Type.toLowerCase(),
						name: data.model.Name
					});
				}

				// update tab view
				context.tabListController.update({
					id: data.id.id,
					typeId: data.id.typeId,
					type: data.id.type,
					name: data.id.name
				}, data.model);

				// update open edit views
				context.tabContentController.update({
					id: data.id.id,
					typeId: data.id.typeId,
					type: data.id.type,
					name: data.id.name
				}, data.model);

				// select in tree
				context.browseController.select({
					id: data.model.Id,
					typeId: data.model.TypeId,
					type: data.model.Type.toLowerCase(),
					name: data.model.Name
				});
			},
			'mt.model.file.updated': function(data) {
				// if rename, ensure temp item cache doesn't contain old
				if (data.id && data.model && data.id.name != data.model.Name) {
					delete context.temporaryNewItemCache[context.navigator.serialize(data.id)];
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
						typeId: data.model.TypeId,
						type: data.model.Type.toLowerCase(),
						name: data.model.Name
					});
				}

				// update tab view
				context.tabListController.update({
					id: data.id.id,
					typeId: data.id.typeId,
					type: data.id.type,
					name: data.id.name
				}, data.model);

				// update open edit views
				context.tabContentController.update({
					id: data.id.id,
					typeId: data.id.typeId,
					type: data.id.type,
					name: data.id.name
				}, data.model, data.reverted);

				// select in tree
				context.browseController.select({
					id: data.id.id,
					typeId: data.id.typeId,
					type: data.id.type,
					name: data.model.Name
				});
			},
			'mt.model.file.deleted': function(data) {
				// close any tab items for the data
				context.tabListController.close({
					id: data.id.id,
					typeId: data.id.typeId,
					name: data.id.name,
					type: data.id.type
				});

				context.tabContentController.close({
					id: data.id.id,
					typeId: data.id.typeId,
					name: data.id.name,
					type: data.id.type
				});
			}
		};

		$.each(modelEvents, function(eventName, handler){
			$.telligent.evolution.messaging.subscribe(eventName, function(data){
				if($.telligent.evolution.widgets.manageThemes.LOGGING_ENABLED) {
					console.log('MODEL EVENT: ' + eventName);
					console.log(data);
				}

				handler(data);
			});
		});
	}

	function importFile(context, uploadContext, fileName) {
		context.model.importThemes({
			uploadContext: uploadContext,
			fileName: fileName
		}).then(function(importResult){
			context.importSelectorView.prompt(importResult, function(response){
				administration.loading(true);
				context.model.importThemes({
					uploadContext: uploadContext,
					fileName: fileName,
					importCommands: response.importCommands
				}).then(function(r){
					context.stagingView.render(r.stagedThemes);
				}).always(function(){ administration.loading(false) });
			});
		});
	}

	function handleViewEvents(context) {
		context.navigator.registerHandlers();

		function parseThemeRequestData(data) {
			if (!data) {
				return null
			}
			if (data.reqkey) {
				return context.navigator.parse(data.reqkey);
			} else if (data.id !== undef && ((data.typeId !== undef) || (data.typeid !== undef))) {
				if (data.typeid) {
					data.typeId = data.typeid;
				}
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
			},
			'studio.view.multiselect': function(context, data) {
				context.browseController.toggleSelectMode();
			},
			'studio.view.staging.publish': function(context, data) {
				if(confirm(context.resources.confirmPublish)) {
					var request = parseThemeRequestData(data);
					administration.loading(true);
					context.model.publishTheme({
						id: request.id,
						typeId: request.typeId
					}).then(function(r){
						context.stagingView.render(r.stagedThemes);
						context.tabContentController.applyComparisonMode(request, null);
					}).always(function(){ administration.loading(false) })
				}
			},
			'studio.view.staging.revert': function(context, data) {
				if(confirm(context.resources.confirmRevert)) {
					var request = parseThemeRequestData(data);
					administration.loading(true);
					context.model.revertTheme({
						id: request.id,
						typeId: request.typeId
					}).then(function(r){
						if(r.reverted) {
							context.stagingView.render(r.stagedThemes);
							context.tabContentController.applyComparisonMode(request, null);
						} else {
							// if not reverted, it was b/c there are choices to be made,
							// for related components to revert. So, show those options
							context.revertStagedComponentsView.prompt({
								request: request,
								revertibleChildren: r.revertibleChildren,
								onRevert: function(selections) {
									// re-attempt revert after selections made
									context.model.revertTheme($.extend({}, {
										id: request.id,
										typeId: request.typeId
									}, selections)).then(function(r){
										if(r.reverted) {
											context.stagingView.render(r.stagedThemes);
											context.tabContentController.applyComparisonMode(request, null);
										}
									});
								}
							});
						}
					}).always(function(){ administration.loading(false) })
				}
			},
			'studio.view.close': function(context, data) {
				var request = parseThemeRequestData(data);
				context.tabListController.close(request);
				context.tabContentController.close(request);
				delete context.temporaryNewItemCache[context.navigator.serialize(request)];
			},
			'studio.view.select': function(context, data) {
				var request = data ? parseThemeRequestData(data) : null;
				context.navigator.request(request);
				if(context.settings.get().syncTree) {
					context.browseController.select(request);
				}
			},
			'studio.view.render': function(context, data) {
				var request = parseThemeRequestData(data);
				context.tabContentController.render(request, data.model);
				context.tabListController.addOrSelect(request, data.model);
				context.currentRenderedRequest = request;
				var req = $.extend({}, request);
				req.id = null;
				context.dockViewController.setEditorTabState(req);
			},
			'studio.view.staging.publish.all': function(context, data) {
				if(confirm(context.resources.confirmPublishAll)) {
					var attempts = 0,
						maxAttempts = 10;
					var listAndPublishThemes = function() {
						administration.loading(true);
						context.model.listThemes({
							staged: true
						}).then(function(r){
							context.model.publishThemes({
								themes: r.themes.map(function(t){
									return {
										id: t.Id,
										typeId: t.TypeId
									};
								})
							}).catch(function(err, b, c){
								// retry publishes until max attempts are hit to work around publish timeouts
								if(err.status != 500)
									return;
								if(attempts > maxAttempts)
									return;
								attempts++;
								if($.telligent.evolution.widgets.manageThemes.LOGGING_ENABLED) {
									console.log('PUBLISH ALL FAILED, RETRY ATTEMPT: ' + attempts);
								}
								listAndPublishThemes();
							}).then(function(){
								context.tabContentController.applyComparisonMode(null, null);
								// if there were multiple attempts, force a simulated staging.changed
								if(attempts > 0) {
									if($.telligent.evolution.widgets.manageThemes.LOGGING_ENABLED) {
										console.log('PUBLISH RETRY SUCCEEDED AFTER ATTEMPTS: ' + attempts);
									}
									messaging.publish('mt.model.theme.staging.changed');
								}
							}).always(function(){ administration.loading(false) })
						}).catch(function(){ administration.loading(false) })
					};
					listAndPublishThemes();
				}
			},
			'studio.view.staging.revert.all': function(context, data) {
				if(confirm(context.resources.confirmRevertAll)) {
					administration.loading(true);
					context.model.listThemes({
						staged: true
					}).then(function(listResponse){
						context.model.revertThemes({
							themes: listResponse.themes.map(function(t){
								return {
									id: t.Id,
									typeId: t.TypeId
								};
							})
						}).then(function(revertResponse){
							if(revertResponse.reverted) {
								messaging.publish('mt.model.theme.staging.changed');
								context.tabContentController.applyComparisonMode(null, null);
							} else {
								// if not reverted, it was b/c there are choices to be made,
								// for related components to revert. So, show those options
								context.revertStagedComponentsView.prompt({
									revertibleChildren: revertResponse.revertibleChildren,
									onRevert: function(selections) {
										// re-attempt revert after selections made
										context.model.revertThemes($.extend({}, selections, {
											themes: listResponse.themes.map(function(t){
												return {
													id: t.Id,
													typeId: t.TypeId
												};
											})
										})).then(function(revertResponseB){
											if(revertResponseB.reverted) {
												context.tabContentController.applyComparisonMode(null, null);
												messaging.publish('mt.model.theme.staging.changed');
											}
										});
									}
								});
							}

						}).always(function(){ administration.loading(false) })
					});
				}
			},
			'mt.view.theme.delete': function(context, data) {
				administration.loading(true);
				var request = parseThemeRequestData(data);
				var performDelete = function() {
					administration.loading(true);
					context.model.deleteTheme({
						id: request.id,
						typeId: request.typeId
					}).then(function(r){
						if(r.deleted) {
							context.stagingView.render(r.stagedThemes);
							context.tabContentController.applyComparisonMode(request, null);
						} else {
							// if not reverted, it was b/c there are choices to be made,
							// for related components to revert. So, show those options
							context.revertStagedComponentsView.prompt({
								request: request,
								revertibleChildren: r.revertibleChildren,
								onRevert: function(selections) {
									// re-attempt delete after selections made
									context.model.deleteTheme($.extend({}, {
										id: request.id,
										typeId: request.typeId
									}, selections)).then(function(r){
										if(r.reverted) {
											context.stagingView.render(r.stagedThemes);
											context.tabContentController.applyComparisonMode(request, null);
										}
									});
								}
							});
						}
					}).always(function(){ administration.loading(false) })
				};

				context.model.getTheme({
					id: request.id,
					typeId: request.typeId
				}).then(function(targetTheme){
					if(targetTheme && targetTheme.IsStaged) {
						if(confirm(context.resources.confirmStageDelete)) {
							performDelete();
						}
					} else {
						performDelete();
					}
				}).always(function(){ administration.loading(false) });
			},
			'mt.view.theme.revert-options': function(context, data) {
				var request = parseThemeRequestData(data);
				var query = {
					id: request.id,
					typeId: request.typeId
				};
				context.revertOptionsView.prompt({
					onProcess: function(selections) {
						$.extend(query, selections);
						context.model.revertThemeOptions(query).then(function(revertResponse){
							if (revertResponse.warnings && revertResponse.warnings.length > 0) {
								$.telligent.evolution.notifications.show(revertResponse.warnings[0], { type: 'warning' });
							} else if (query.stage) {
								$.telligent.evolution.notifications.show(context.resources.revertSuccessPreview, { type: 'success' });
								messaging.publish('mt.view.theme.preview', request);
							} else {
								$.telligent.evolution.notifications.show(context.resources.revertSuccessNoPreview, { type: 'success' });
							}
						});
					}
				});
			},
			'mt.view.theme.preview': function(context, data) {
				// preview the selected item or current (if none selected, such as from keyboard shortcut)
				var request = parseThemeRequestData(data);
				if(!request)
					request = context.tabListController.getCurrent();
				if(!request)
					return;

				return context.model.getTheme({
					id: request.id,
					typeId: request.typeId
				}).then(function(model){
					if(!model)
						return;

					context.previewThemeView.prompt({
						theme: model,
						onStart: function(options) {
							context.model.previewTheme({
								id: request.id,
								typeId: request.typeId,
								applicationId: options.applicationId
							}).then(function(previewResponse){
								if(previewResponse && previewResponse.success && previewResponse.url) {
									global.open(previewResponse.url, 'theme-preview');
								}
							});
						}
					});
				});
			},
			'mt.view.theme.clone': function(context, data) {
				var request = parseThemeRequestData(data);
				return context.model.getTheme({
					id: request.id,
					typeId: request.typeId
				}).then(function(targetThemeModel){
					// first get a list of selectable current theme IDs for copy
					context.model.listThemes().then(function(r){
						// all themes of other types
						var selectableThemes = r.themes.filter(function(t){
							return (t.TypeId != request.typeId
								&& t.Id != request.id
								&& r.themes.filter(function(t2) {
									return (t2.Id == t.Id
										&& t2.TypeId == request.typeId);
								}).length == 0);
						});

						context.selectThemeView.prompt({
							themes: selectableThemes,
							themeTypeName: targetThemeModel.TypeName,
							onValidate: function(themeId) {
								return $.Deferred(function(d){
									// empty theme ID is valid - just generates a new ID
									if (!themeId || themeId == '') {
										d.resolve(true);
										return;
									}

									// ensure is valid GUID
									var guidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
									if (!themeId.match(guidPattern)) {
										d.resolve(false);
										return;
									}

									// ensure no theme already exists with type/id
									return context.model.getTheme({
										id: themeId,
										typeId: request.typeId
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
							onSelect: function(selection){
								var cloneQuery = {
									id: request.id,
									typeId: request.typeId
								};
								if(selection.themeId && selection.themeId.length > 0) {
									cloneQuery.newId = selection.themeId
								}

								administration.loading(true);
								context.model.cloneTheme(cloneQuery).then(function(r){
									context.stagingView.render(r.stagedThemes);
								}).always(function(){ administration.loading(false); })
							}
						});
					});
				});
			},
			'mt.view.theme.export': function(context, data) {
				var request = parseThemeRequestData(data);
				context.exporter.exportThemes([ request ]);
			},
			'mt.view.resource.export': function(context, data) {
				var request = parseThemeRequestData(data);
				context.exporter.exportResources([ request ]);
			},
			'mt.view.theme.initiate-new-file': function(context, data) {
				var request = parseThemeRequestData(data);
				context.selectFileTypeView.prompt(function(result){
					context.model.createThemeFile({
						id: request.id,
						typeId: request.typeId,
						type: result.type
					}).then(function(r){
						var request = {
							id: r.Id,
							typeId: r.TypeId,
							type: r.Type.toLowerCase(),
							name: r.Name
						};
						context.temporaryNewItemCache[context.navigator.serialize(request)] =  r;
						context.navigator.request(request);
					});
				});
			},
			'mt.view.theme.initiate-upload': function(context, data) {
				context.uploader.upload({ withProgress: true }).then(function(file){
					var fileExtension = null;
					var request = parseThemeRequestData(data);
					var newFileType = 'File';

					var nameParts = file.name.toLowerCase().split('.');
					if(nameParts.length > 1) {
						fileExtension = nameParts[nameParts.length - 1];
					}

					if (fileExtension == 'js') {
						newFileType = 'Script';
					} else if(fileExtension == 'css' || fileExtension == 'less') {
						newFileType = 'Style';
					} else {
						newFileType = 'File';
					}

					context.model.saveThemeFile({
						id: request.id,
						typeId: request.typeId,
						name: file.name,
						type: newFileType,
						uploadContext: file.context
					}).then(function(r){
						context.stagingView.render(r.stagedThemes);
						context.navigator.request({
							id: r.savedThemeFile.Id,
							typeId: r.savedThemeFile.TypeId,
							type: r.savedThemeFile.Type.toLowerCase(),
							name: r.savedThemeFile.Name
						});
					});
				});
			},
			'mt.view.themes.export': function(context, data) {
				if(data.requests) {
					context.exporter.exportThemes(data.requests);
				} else {
					context.exporter.exportAllThemes();
				}
			},
			'mt.view.themes.delete': function(context, data) {
				if(data.requests && confirm(context.resources.confirmDeleteThemes)) {
					context.model.deleteThemes({
						themes: data.requests.map(function(t){
							return {
								id: t.id,
								typeId: t.typeId
							};
						})
					}).then(function(deleteResponse){
						if(deleteResponse.deleted) {
							messaging.publish('mt.model.theme.staging.changed');
							context.tabContentController.applyComparisonMode(null, null);
						} else {
							// if not deleted, it was b/c there are choices to be made,
							// for related components to revert. So, show those options
							context.revertStagedComponentsView.prompt({
								revertibleChildren: deleteResponse.revertibleChildren,
								onRevert: function(selections) {
									// re-attempt revert after selections made
									context.model.deleteThemes($.extend({}, selections, {
										themes: data.requests.map(function(t){
											return {
												id: t.id,
												typeId: t.typeId
											};
										})
									})).then(function(deleteResponseB){
										if(deleteResponseB.deleted) {
											context.tabContentController.applyComparisonMode(null, null);
											messaging.publish('mt.model.theme.staging.changed');
										}
									});
								}
							});
						}
					});
				}
			},
			'mt.view.resources.export': function(context, data) {
				if(data.requests) {
					context.exporter.exportResources(data.requests);
				} else {
					context.exporter.exportAllResources();
				}
			},
			'mt.view.file.convert-to-style': function(context, data) {
				var request = parseThemeRequestData(data);
				administration.loading(true);
				context.model.getThemeFile(request).then(function(original){
					context.model.saveThemeFile({
						id: request.id,
						typeId: request.typeId,
						type: 'Style',
						name: request.name,
						content: original.Content,
						applyToNonModals: true // default this
					}).then(function(newComplete){
						context.tabListController.close(request);
						context.tabContentController.close(request);
						context.navigator.request({
							id: request.id,
							typeId: request.typeId,
							type: 'style',
							name: request.name
						});
						context.model.deleteThemeFile({
							id: request.id,
							typeId: request.typeId,
							name: request.name,
							type: request.type
						}).then(function(r){
							context.stagingView.render(r.stagedThemes);
						}).always(function(){ administration.loading(false) });
					}).catch(function(){ administration.loading(false) });
				}).catch(function(){ administration.loading(false) });
			},
			'mt.view.file.convert-to-script': function(context, data) {
				var request = parseThemeRequestData(data);
				administration.loading(true);
				context.model.getThemeFile(request).then(function(original){
					context.model.saveThemeFile({
						id: request.id,
						typeId: request.typeId,
						type: 'Script',
						name: request.name,
						content: original.Content
					}).then(function(newComplete){
						context.tabListController.close(request);
						context.tabContentController.close(request);
						context.navigator.request({
							id: request.id,
							typeId: request.typeId,
							type: 'script',
							name: request.name
						});
						context.model.deleteThemeFile({
							id: request.id,
							typeId: request.typeId,
							name: request.name,
							type: request.type
						}).then(function(r){
							context.stagingView.render(r.stagedThemes);
						}).always(function(){ administration.loading(false) });
					}).catch(function(){ administration.loading(false) });
				}).catch(function(){ administration.loading(false) });
			},
			'mt.view.file.convert-to-supplemental': function(context, data) {
				var request = parseThemeRequestData(data);
				administration.loading(true);
				context.model.getThemeFile(request).then(function(original){
					context.model.saveThemeFile({
						id: request.id,
						typeId: request.typeId,
						type: 'File',
						name: request.name,
						content: original.Content
					}).then(function(newComplete){
						context.tabListController.close(request);
						context.tabContentController.close(request);
						context.navigator.request({
							id: request.id,
							typeId: request.typeId,
							type: 'file',
							name: request.name
						});
						context.model.deleteThemeFile({
							id: request.id,
							typeId: request.typeId,
							name: request.name,
							type: request.type
						}).then(function(r){
							context.stagingView.render(r.stagedThemes);
						}).always(function(){ administration.loading(false) });
					}).catch(function(){ administration.loading(false) });
				}).catch(function(){ administration.loading(false) });
			},
			'mt.view.file.delete': function(context, data) {
				var request = parseThemeRequestData(data);
				context.model.deleteThemeFile({
					id: request.id,
					typeId: request.typeId,
					name: request.name,
					type: request.type
				}).then(function(r){
					context.stagingView.render(r.stagedThemes);
				});
			},
			'mt.view.file.restore': function(context, data) {
				var request = parseThemeRequestData(data);
				context.model.restoreThemeFile({
					id: request.id,
					typeId: request.typeId,
					name: request.name,
					type: request.type
				}).then(function(r){
					// close existing
					context.tabListController.close(request);
					context.tabContentController.close(request);
					// re-navigate
					context.navigator.request(request);
					// render staging
					context.stagingView.render(r.stagedThemes);
				});
			},
			'mt.view.manual-save': function(context, data) {
				context.model.flushPendingTasks();
			},
			'mt.view.themes.search': function(context, data) {
				context.browseController.focusOnSearch({
					focusedElement: document.activeElement
				});
			},
			'mt.view.theme.publish': function(context, data) {
				var currentRequest = context.tabListController.getCurrent();
				messaging.publish('studio.view.staging.publish', currentRequest);
			},
			'mt.view.theme.revert': function(context, data) {
				var currentRequest = context.tabListController.getCurrent();
				messaging.publish('studio.view.staging.revert', currentRequest);
			},
			'mt.view.documentation.show': function(context, data) {
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
			'mt.view.theme.remove-preview': function(context, data) {
				var request = parseThemeRequestData(data);
				context.model.saveTheme({
					id: request.id,
					typeId: request.typeId,
					newPreviewFileName: '',
					immediate: true
				}).then(function(r){
					context.stagingView.render(r.stagedThemes);
				});
			},
			'mt.view.theme.upload-preview': function(context, data) {
				var request = parseThemeRequestData(data);
				context.uploader.upload({ withProgress: true }).then(function(file){
					context.model.saveTheme({
						id: request.id,
						typeId: request.typeId,
						uploadContext: file.context,
						newPreviewFileName: file.name,
						immediate: true
					}).then(function(r){
						context.stagingView.render(r.stagedThemes);
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
						// pass the current widget context, if exists for access to widget-specific private apis
						type: data.type,
						name: data.name,
						target: data.target,
						mode: data.mode,
						displayName: data.displayname
					});
				}
			}
		};

		$.each(viewEvents, function(eventName, handler){
			$.telligent.evolution.messaging.subscribe(eventName, function(data) {
				if(data && data.target) {
					$.extend(data, parseDataOptions(data.target));
				}

				if($.telligent.evolution.widgets.manageThemes.LOGGING_ENABLED) {
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
					'ctrl + comma': { message: 'mt.view.themes.search', description: context.resources.shortcutSearch },
					'meta + p': { message: 'mt.view.theme.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'meta + alt + p': { message: 'mt.view.theme.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + alt + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'ctrl + o': { message: 'mt.view.theme.preview', description: context.resources.previewChangesShortcutDesc },
					'ctrl + s': { message: 'mt.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else {
				combos = {
					'ctrl + comma': { message: 'mt.view.themes.search', description: context.resources.shortcutSearch },
					'meta + p': { message: 'mt.view.theme.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'meta + shift + p': { message: 'mt.view.theme.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'ctrl + o': { message: 'mt.view.theme.preview', description: context.resources.previewChangesShortcutDesc },
					'ctrl + s': { message: 'mt.view.manual-save', description: context.resources.shortcutForceSave }
				}
			}
		} else {
			if(StudioEnvironment.browser.firefox) {
				combos = {
					'alt + comma': { message: 'mt.view.themes.search', description: context.resources.shortcutSearch },
					'alt + p': { message: 'mt.view.theme.publish', description: context.resources.shortcutPublish },
					'alt + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'alt + shift + p': { message: 'mt.view.theme.revert', description: context.resources.shortcutRevert },
					'alt + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + o': { message: 'mt.view.theme.preview', description: context.resources.previewChangesShortcutDesc },
					'ctrl + s': { message: 'mt.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else if(StudioEnvironment.browser.edge) {
				combos = {
					'alt + comma': { message: 'mt.view.themes.search', description: context.resources.shortcutSearch },
					'alt + p': { message: 'mt.view.theme.publish', description: context.resources.shortcutPublish },
					'alt + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'alt + shift + p': { message: 'mt.view.theme.revert', description: context.resources.shortcutRevert },
					'alt + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + o': { message: 'mt.view.theme.preview', description: context.resources.previewChangesShortcutDesc },
					'ctrl + s': { message: 'mt.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else {
				combos = {
					'alt + comma': { message: 'mt.view.themes.search', description: context.resources.shortcutSearch },
					'ctrl + p': { message: 'mt.view.theme.publish', description: context.resources.shortcutPublish },
					'alt + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'ctrl + shift + p': { message: 'mt.view.theme.revert', description: context.resources.shortcutRevert },
					'alt + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + o': { message: 'mt.view.theme.preview', description: context.resources.previewChangesShortcutDesc },
					'ctrl + s': { message: 'mt.view.manual-save', description: context.resources.shortcutForceSave }
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
			includeAutomationEvents: false
		}));
	}

	function buildTabPersistence(context) {
		context.tabListStore = new StudioTabListStore({
			tabListView: context.tabListController.view(),
			storageNameSpace: 'themes',
			onLoad: function(key) {
				var request = context.navigator.parse(key);

				if(Utility.isFileRequest(request)) {
					return context.model.getThemeFile({
						id: request.id,
						typeId: request.typeId,
						name: request.name,
						type: request.type,
						fallback: true
					}).then(function(model){
						if(model) {
							context.tabContentController.render(request, model);
							context.currentRenderedRequest = request;
							var req = $.extend({}, request);
							req.id = null;
							context.dockViewController.setEditorTabState(req);
						}
						return {
							request: request,
							model: model
						};
					});
				// if any other part of the theme, load the full theme
				} else {
					return context.model.getTheme({
						id: request.id,
						typeId: request.typeId
					}).then(function(model){
						if(model) {
							context.tabContentController.render(request, model);
							context.currentRenderedRequest = request;
							var req = $.extend({}, request);
							req.id = null;
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

		// load currently-staged themes
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
		if(context.previewingFromThemeStudio) {
			$.telligent.evolution.themePreview.enabled(false);
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

		pairs.push('_tid' + "=" + encodeURIComponent(request.id || ''));
		pairs.push('_ttid' + "=" + encodeURIComponent(request.typeId || ''));

		if(modelType == 'component' && Utility.isFileRequest(request)) {
			pairs.push('_tt' + "=" + encodeURIComponent(request.type || ''));
			pairs.push('_tn' + "=" + encodeURIComponent(request.name || ''));
		}

		return pairs.join('&');
	}

	function loadAndRenderStagingView(context) {
		return context.model.listThemes({
			staged: true
		}).then(function(r){
			context.stagingView.render(r.themes);
			return r;
		});
	}

	var Controller = function(options){
		var context = $.extend({}, defaults, options || {});

		// cache of new themes and files that haven't ever yet been saved
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