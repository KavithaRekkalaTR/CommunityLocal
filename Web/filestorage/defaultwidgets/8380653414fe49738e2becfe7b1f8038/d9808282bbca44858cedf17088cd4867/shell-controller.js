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
		'NewEmbeddableView'
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
		NewEmbeddableView,
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
			exportEmbeddablesUrl: context.urls.exportEmbeddablesUrl,
			storeTemporaryExportListUrl: context.urls.storeTemporaryExportListUrl
		});

		return dataModel;
	}

	function buildEditViewController(context) {
		function processSave(context, request, model, immediately) {
			if (Utility.isFileRequest(request)) {
				return context.model.saveEmbeddableFile({
					id: model.Id,
					name: model.Name,
					content: model.Content,
					newName: model.NewName,
					queueSalt: model.queueSalt,
					immediate: immediately
				}).then(function(r){
					context.stagingView.render(r.stagedEmbeddables);
				});
			} else {
				return context.model.saveEmbeddable({
					id: model.Id,
					factoryDefaultProviderId: model.FactoryDefaultProviderId,
					name: model.Name,
					description: model.Description,
					category: model.Category,
					isCacheable: model.IsCacheable,
					varyCacheByUser: model.VaryCacheByUser,
					contentScript: model.ContentScript,
					contentScriptLanguage: model.ContentScriptLanguage,
					configurationXml: model.ConfigurationXml,
					resourcesToSave: model.ResourcesToSave,
					supportedContentTypesScopeToSave: model.SupportedContentTypesScopeToSave,
					supportedContentTypesToSave: model.SupportedContentTypesToSave,
					restScopeIds: (model.RestScopes || []).map(function (s) { return s.Id }).join(','),
					immediate: immediately
				}).then(function (r) {
					context.stagingView.render(r.stagedEmbeddables);
				});
			}
		}


		function processLoadDefaultVariant(context, request, includeAllAttachments) {
			if (Utility.isFileRequest(request)) {
				return context.model.getEmbeddableFile({
					id: request.id,
					name: request.name,
					staged: false,
					factoryDefault: true
				});
			} else {
				return context.model.getEmbeddable({
					id: request.id,
					staged: false,
					factoryDefault: true,
					includeFileDigests: includeAllAttachments
				})
			}
		}

		function processLoadStaged(context, request, includeAllAttachments) {
			if (Utility.isFileRequest(request)) {
				return context.model.getEmbeddableFile({
					id: request.id,
					name: request.name,
					staged: true
				});
			} else {
				return context.model.getEmbeddable({
					id: request.id,
					staged: true,
					includeFileDigests: includeAllAttachments
				});
			}
		}

		function processLoadNonStaged(context, request, includeAllAttachments) {
			if (Utility.isFileRequest(request)) {
				return context.model.getEmbeddableFile({
					id: request.id,
					name: request.name,
					staged: false
				});
			} else {
				return context.model.getEmbeddable({
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
						EmbeddableProcessedName: updateModel.ProcessedName,
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
						// updating a file tab with new embeddable model data
						} else {
							// name and staged state is the only reasonable change here
							controller.applyModelChanges({
								EmbeddableProcessedName: updateModel.ProcessedName,
								IsStaged: updateModel.IsStaged,
								IsTranslated: updateModel.IsTranslated,
								IsReverted: updateModel.IsReverted,
								IsDeleted: updateModel.IsDeleted
							});
						}
					// if the tab is for an embeddable component and the request isn't related to a file...
					} else if(!updateRequest.name) {
						// otherwise, it's a regular embeddable tab
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

			context.newEmbeddableView = new NewEmbeddableView({
				template: $.telligent.evolution.template(context.templates.newEmbeddableViewTemplate),
				title: context.resources.newEmbeddableTitle,
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

				// Browse Controller
				var browseContainer = $('<div></div>').appendTo(sideBar);
				var browseHeaderContent = $($.telligent.evolution.template(context.templates.browseHeaderTemplate)({}));
				context.browseController = new StudioBrowseController({
					resources: context.resources,
					browseHeaderContent: browseHeaderContent,
					browseViewItemTemplate: context.templates.browseViewItemTemplate,
					actionsTemplate: $.telligent.evolution.template(context.templates.embeddableActionsTemplate),
					container: browseContainer,
					wrapperCssClass: 'management-studio manage-embeddables',
					searchPlaceholder: context.resources.nameorDescription,
					linkNew: true,
					linkUpload: true,
					multiSelectActions: [
						{ message: 'me.view.embeddables.export', label: context.resources.exportSelectedEmbeddables },
						{ message: 'me.view.resources.export', label: context.resources.exportSelectedResources },
						{ message: 'me.view.embeddables.delete', label: context.resources.deleteSelectedEmbeddables }
					],
					modelDepth: 0,
					onGetInitialNodes: function() {
						return $.Deferred(function(d){
							d.resolve([]);
						}).promise();
					},
					onList: function(explicitQuery) {
						if(!context.browseSearchInput) {
							context.browseSearchInput = browseContainer.find('input.query');
							context.browseStateSelect = browseContainer.find('select.state-select');

							context.browseStateSelect.on('change', function(){
								context.browseController.load();
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

						if(explicitQuery && explicitQuery.length > 0) {
							query.query = explicitQuery;
						}

						return context.model.listEmbeddables(query).then(function(r){
							// no results
							if (!r || !r.embeddables || !r.embeddables.length) {
								return [{ isEmptyResult: true }];
							}
							// if searched...
							if(query.query) {
								// build a flattened list of possible search results
								var flattenedEmbeddableComponents = [];
								for(var i = 0; i < r.embeddables.length; i++) {
									var embeddable = r.embeddables[i];

									// overview
									flattenedEmbeddableComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: embeddable.Id,
											type: 'overview'
										}),
										label: context.resources.overview,
										model: embeddable,
										cssClass: 'managed-item overview',
										haystack: (embeddable.ProcessedName + ' ' + embeddable.ProcessedDescription + ' ' + context.resources.overview).toLowerCase()
									});

									// body script
									flattenedEmbeddableComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: embeddable.Id,
											type: 'contentscript'
										}),
										label: context.resources.implementation,
										model: embeddable,
										cssClass: 'managed-item bodyscript',
										haystack: (embeddable.ProcessedName + ' ' + embeddable.ProcessedDescription + ' ' + context.resources.implementation).toLowerCase()
									});

									// configuration
									flattenedEmbeddableComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: embeddable.Id,
											type: 'configuration'
										}),
										label: context.resources.configuration,
										model: embeddable,
										cssClass: 'managed-item configuration',
										haystack: (embeddable.ProcessedName + ' ' + embeddable.ProcessedDescription + ' ' + context.resources.configuration).toLowerCase()
									});

									// resources
									flattenedEmbeddableComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: embeddable.Id,
											type: 'resources'
										}),
										label: context.resources.resources,
										model: embeddable,
										cssClass: 'managed-item resources',
										haystack: (embeddable.ProcessedName + ' ' + context.resources.resources).toLowerCase()
									});

									// files
									if (embeddable.Files && embeddable.Files.length > 0) {
										for(var f = 0; f < embeddable.Files.length; f++) {
											var file = embeddable.Files[f];
											flattenedEmbeddableComponents.push({
												isFilterResult: true,
												key: context.navigator.serialize({
													id: embeddable.Id,
													type: 'file',
													name: file.Name
												}),
												label: file.Name,
												model: embeddable,
												cssClass: 'managed-item file',
												haystack: (embeddable.ProcessedName + ' ' + embeddable.ProcessedDescription + ' ' + file.Name).toLowerCase()
											});
										}
									}
								}

								// filter flattened embeddable components to items that contain all words in the query, regardless of order
								var queryComponents = query.query.toLowerCase().split(' ');
								return flattenedEmbeddableComponents.filter(function(t){
									var includesQuery = true;
									for(var i = 0; i < queryComponents.length; i++) {
										includesQuery = includesQuery && t.haystack.indexOf(queryComponents[i]) >= 0
									}
									return includesQuery;
								});

							} else {
								return r.embeddables;
							}
						});
					},
					onGetAndSelect: function(request) {
						return context.model.getEmbeddable({
							id: request.id
						}).then(function(embeddable){
							if (embeddable) {
								context.browseSearchInput.val('');
								context.browseStateSelect.val('all');
							}
							return embeddable;
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
								label: context.resources.noMatchingEmbeddables,
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
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.Id,
									type: 'contentscript'
								}),
								label: context.resources.implementation,
								cssClass: 'managed-item contentscript'
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
					{ message: 'me.view.embeddables.export', label: context.resources.exportAllEmbeddables },
					{ message: 'me.view.resources.export', label: context.resources.exportAllResources }
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
		//		_eid (embeddable id)
		//		_et (type)
		//			overview
		//			configuration
		//			contentscript
		//			resources
		//			file (file type)
		//		_en (file name, if file)
		//		_el (line number, if there's a line number)

		function prefix(options) {
			if(!options)
				return {};

			return {
				_eid: options.id || '',
				_et: options.type || '',
				_en: options.name || '',
				_el: options.line || 0
			};
		}

		function dePrefix(options) {
			return {
				id: options._eid || '',
				type: options._et || '',
				name: options._en || '',
				line: (options._el ? parseInt(options._el, 10) : 0),
				model: options._am || 'embeddable' // embeddable | configuration
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
					return context.model.getEmbeddableFile({
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
					return context.model.getEmbeddable({
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

				pairs.push('_eid' + "=" + encodeURIComponent(request.id || ''));
				pairs.push('_et' + "=" + encodeURIComponent(request.type || ''));

				// ignore file names for non-file requests
				// the field is overloaded for navigating to deeper parts of a component
				// such as resource names, but is not useful in identifying overall tabs
				if(Utility.isFileRequest(request) || (options && options.includeAttachment)) {
					pairs.push('_en' + "=" + encodeURIComponent(request.name || ''));
				}

				if(options && options.includeLineNumber) {
					pairs.push('_el' + "=" + encodeURIComponent(request.line || 0));
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

			'me.model.embeddable.staging.changed': function(data) {

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


					// get list of all currently open embeddables, and map them to a hash for
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

								// if published embeddable wasn't open in any tabs, don't reload
								if(!tabsIndex[serializedOriginalRequest])
									return;

								// otherwise, load the embeddable
								context.model.getEmbeddable({
									id: request.id
								}).then(function(updatedEmbeddable){
									// if the embeddable doesn't exist,
									// then this was a revert of something that was never savedEmbeddable
									// and we want to just close its UI completely
									if(!updatedEmbeddable) {
										context.tabListController.close(request, true);
										context.tabContentController.close(request, true);
										return;
									}

									// otherwise, this was a publish, and we want to treat its UI
									// the same way as when a "revert" happens, in that
									// we let the app take care of investigating what
									// needs to be updated in each album or not
									$.telligent.evolution.messaging.publish('me.model.embeddable.updated', {
										model: updatedEmbeddable,
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
			'me.model.embeddables.changed': function(data) {
				// when a mass embeddables change has been completed
				context.browseController.loadInitial().then(function(){
					var currentRequest = context.tabListController.getCurrent();
					if(currentRequest) {
						context.browseController.select(currentRequest);
					}
				});
			},
			'me.model.embeddable.created': function(data) {
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
			'me.model.embeddable.updated': function(data) {
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
								context.model.getEmbeddableFile({
									id: request.id,
									name: request.name
								}).then(function(revertedEmbeddableFile){
									context.tabContentController.update({
										id: request.id,
										name: request.name,
										type: 'file'
									}, revertedEmbeddableFile, data.reverted);
								})
							}
						}
					});
				}
			},
			'me.model.embeddables.updated': function(data) {
				// get a unique list of all currently open requests
				var tabs = context.tabListController.listAll();
				var tabsIndex = {};
				for(var i = 0; i < tabs.length; i++) {
					tabsIndex[buildKey(tabs[i].request.id)] = tabs[i].request;
				}

				// filter the list of updated embeddables to only those with open tabs
				data.embeddables.forEach(function(embeddable) {
					if (tabsIndex[buildKey(embeddable.id)]) {

						// for each embeddable that has open tab(s), load it and synthesize
						// a full update event of it in order to trigger updating of all of its
						// tabs the same as if it had received a full update event or been reverted
						context.model.getEmbeddable(embeddable).then(function(updatedEmbeddable){
							if(!updatedEmbeddable) {
								return;
							}
							$.telligent.evolution.messaging.publish('me.model.embeddable.updated', {
								model: updatedEmbeddable,
								reverted: true, // forces a re-analysis of all request/attachments
								id: embeddable
							})
						});
					}
				});
			},
			'me.model.embeddable.deleted': function(data) {
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
			'me.model.file.created': function(data) {
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
			'me.model.file.updated': function(data) {
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
			'me.model.file.deleted': function(data) {
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
			'me.model.embeddable.management.imported': function(data) {
				// import published with unknown changes, just refresh everything
				administration.refresh();
			}
		};

		$.each(modelEvents, function(eventName, handler){
			$.telligent.evolution.messaging.subscribe(eventName, function(data){
				if($.telligent.evolution.widgets.manageEmbeddables.LOGGING_ENABLED) {
					console.log('MODEL EVENT: ' + eventName);
					console.log(data);
				}

				handler(data);
			});
		});
	}

	function importFile(context, uploadContext, fileName) {
		context.model.importEmbeddables({
			uploadContext: uploadContext,
			fileName: fileName
		}).then(function(importResult){
			context.importSelectorView.prompt(importResult, function(response){
				administration.loading(true);
				context.model.importEmbeddables({
					uploadContext: uploadContext,
					fileName: fileName,
					importCommands: response.importCommands,
					factoryDefaultProviderId: response.factoryDefaultProviderId
				}).then(function(r){
					context.stagingView.render(r.stagedEmbeddables);
				}).always(function(){ administration.loading(false) });
			});
		});
	}

	function handleViewEvents(context) {
		context.navigator.registerHandlers();

		function parseEmbeddableRequestData(data) {
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
				context.model.listEmbeddables({
					staged: true
				}).then(function(a){
					var allStagedRequests = (a.embeddables || []).map(function(ax) {
						return {
							id: ax.Id
						}
					});
					d.resolve(allStagedRequests);
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
				var initiateNewEmbeddable = function(context, embeddableId, factoryDefaultProviderId) {
					administration.loading(true);
					context.model.createEmbeddable({
						id: embeddableId,
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

				var enableIdSelection = context.developerModeEnabled;
				if (enableIdSelection) {
					context.newEmbeddableView.prompt({
						onValidate: function(embeddableId) {
							return $.Deferred(function(d){
								// empty embeddable ID is valid - just generates a new ID
								if (!embeddableId || embeddableId == '') {
									d.resolve(true);
									return;
								}

								// ensure is valid GUID
								var guidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
								if (!embeddableId.match(guidPattern)) {
									d.resolve(false);
									return;
								}

								// ensure no embeddable already exists with type/id
								return context.model.getEmbeddable({
									id: embeddableId
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
							initiateNewEmbeddable(context, data.embeddableId, data.factoryDefaultProviderId);
						}
					});
				} else {
					initiateNewEmbeddable(context);
				}
			},
			'studio.view.multiselect': function(context, data) {
				context.browseController.toggleSelectMode();
			},
			'studio.view.staging.publish': function(context, data) {
				if(confirm(context.resources.confirmPublish)) {
					var request = parseEmbeddableRequestData(data);
					administration.loading(true);
					context.model.publishEmbeddable({
						id: request.id,
						model: request.model
					}).then(function(r){
						context.stagingView.render(r.stagedEmbeddables);
						if (request.model == 'configuration') {

						} else {
							context.tabContentController.applyComparisonMode(request, null);
						}
					}).always(function(){ administration.loading(false) })
				}
			},
			'studio.view.staging.revert': function(context, data) {
				if(confirm(context.resources.confirmRevert)) {
					var request = parseEmbeddableRequestData(data);
					administration.loading(true);
					context.model.revertEmbeddable({
						id: request.id,
						model: request.model
					}).then(function(r){
						if (request.model == 'configuration') {
							context.stagingView.render(r.stagedEmbeddables);
						} else {
							if(r.reverted) {
								context.stagingView.render(r.stagedEmbeddables);
								context.tabContentController.applyComparisonMode(request, null);
							} else {
								// if not reverted, it was b/c there are choices to be made,
								// for related components to revert. So, show those options
								context.revertStagedComponentsView.prompt({
									request: request,
									revertibleChildren: r.revertibleChildren,
									onRevert: function(selections) {
										// re-attempt revert after selections made
										context.model.revertEmbeddable($.extend({}, {
											id: request.id
										}, selections)).then(function(r){
											if(r.reverted) {
												context.stagingView.render(r.stagedEmbeddables);
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
				var request = parseEmbeddableRequestData(data);
				context.tabListController.close(request);
				context.tabContentController.close(request);
				delete context.temporaryNewItemCache[context.navigator.serialize(request)];
			},
			'studio.view.select': function(context, data) {
				var request = data ? parseEmbeddableRequestData(data) : null;
				context.navigator.request(request);
				if(context.settings.get().syncTree) {
					context.browseController.select(request);
				}
			},
			'studio.view.render': function(context, data) {
				var request = parseEmbeddableRequestData(data);
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
					var listAndPublishEmbeddables = function() {
						administration.loading(true);
						listAllStagedRequests(context).then(function(stagedRequests){
							context.model.publishEmbeddables({
								embeddables: stagedRequests
							})
							.then(function(){
								context.tabContentController.applyComparisonMode(null, null);
								// if there were multiple attempts, force a simulated staging.changed
								if(attempts > 0) {
									if($.telligent.evolution.widgets.manageEmbeddables.LOGGING_ENABLED) {
										console.log('PUBLISH RETRY SUCCEEDED AFTER ATTEMPTS: ' + attempts);
									}
								}
								messaging.publish('me.model.embeddable.staging.changed');
							})
							.always(function(){ administration.loading(false) })
						});
					};
					listAndPublishEmbeddables();
				}
			},
			'studio.view.staging.revert.all': function(context, data) {
				if(confirm(context.resources.confirmRevertAll)) {
					administration.loading(true);
					listAllStagedRequests(context).then(function(stagedRequests){
						context.model.revertEmbeddables({
							embeddables: stagedRequests
						}).then(function(revertResponse){
							if(revertResponse.reverted) {
								messaging.publish('me.model.embeddable.staging.changed');
								context.tabContentController.applyComparisonMode(null, null);
							} else {
								// if not reverted, it was b/c there are choices to be made,
								// for related components to revert. So, show those options
								context.revertStagedComponentsView.prompt({
									revertibleChildren: revertResponse.revertibleChildren,
									onRevert: function(selections) {
										// re-attempt revert after selections made
										context.model.revertEmbeddables($.extend({}, selections, {
											embeddables: stagedRequests
										})).then(function(revertResponseB){
											if(revertResponseB.reverted) {
												context.tabContentController.applyComparisonMode(null, null);
												messaging.publish('me.model.embeddable.staging.changed');
											}
										});
									}
								});
							}

						}).always(function(){ administration.loading(false) })
					});
				}
			},
			'me.view.embeddable.delete': function(context, data) {
				administration.loading(true);
				var request = parseEmbeddableRequestData(data);
				var performDelete = function() {
					administration.loading(true);
					context.model.deleteEmbeddable({
						id: request.id
					}).then(function(r){
						if(r.deleted) {
							context.stagingView.render(r.stagedEmbeddables);
							context.tabContentController.applyComparisonMode(request, null);
						} else {
							// if not reverted, it was b/c there are choices to be made,
							// for related components to revert. So, show those options
							context.revertStagedComponentsView.prompt({
								request: request,
								revertibleChildren: r.revertibleChildren,
								onRevert: function(selections) {
									// re-attempt delete after selections made
									context.model.deleteEmbeddable($.extend({}, {
										id: request.id
									}, selections)).then(function(r){
										if(r.reverted) {
											context.stagingView.render(r.stagedEmbeddables);
											context.tabContentController.applyComparisonMode(request, null);
										}
									});
								}
							});
						}
					}).always(function(){ administration.loading(false) })
				};

				context.model.getEmbeddable({
					id: request.id
				}).then(function(targetEmbeddable){
					if(targetEmbeddable && targetEmbeddable.IsStaged) {
						if(confirm(context.resources.confirmStageDelete)) {
							performDelete();
						}
					} else {
						performDelete();
					}
				}).always(function(){ administration.loading(false) });
			},
			'me.view.embeddable.clone': function(context, data) {
				var request = parseEmbeddableRequestData(data);

				var performClone = function(newEmbeddableId) {
					var cloneQuery = {
						id: request.id
					};
					if(newEmbeddableId && newEmbeddableId.length > 0)
						cloneQuery.newId = newEmbeddableId;

					administration.loading(true);
					context.model.cloneEmbeddable(cloneQuery).then(function(r){
						context.stagingView.render(r.stagedEmbeddables);
					}).always(function(){ administration.loading(false); })
				};

				context.model.getEmbeddable({
					id: request.id
				}).then(function(targetEmbeddableModel){

					var enableIdSelection = context.developerModeEnabled;
					if (enableIdSelection) {
						context.newEmbeddableView.prompt({
							currentEmbeddableId: targetEmbeddableModel.HostId, // TODO
							onValidate: function(embeddableId) {
								return $.Deferred(function(d){
									// empty embeddable ID is valid - just generates a new ID
									if (!embeddableId || embeddableId == '') {
										d.resolve(true);
										return;
									}

									// ensure is valid GUID
									var guidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
									if (!embeddableId.match(guidPattern)) {
										d.resolve(false);
										return;
									}

									// ensure no embeddable already exists with type/id
									return context.model.getEmbeddable({
										id: embeddableId
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
								performClone(data.embeddableId);
							}
						});
					} else {
						performClone();
					}

				});
			},
			'me.view.embeddable.export': function(context, data) {
				var request = parseEmbeddableRequestData(data);
				context.exporter.exportEmbeddables([ request ]);
			},
			'me.view.resource.export': function(context, data) {
				var request = parseEmbeddableRequestData(data);
				context.exporter.exportResources([ request ]);
			},
			'me.view.embeddable.initiate-new-file': function(context, data) {
				var request = parseEmbeddableRequestData(data);

				administration.loading(true);
				context.model.createEmbeddableFile({
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
			'me.view.embeddable.initiate-upload': function(context, data) {
				context.uploader.upload({ withProgress: true }).then(function(file){
					var request = parseEmbeddableRequestData(data);
					context.model.saveEmbeddableFile({
						id: request.id,
						name: file.name,
						uploadContext: file.context
					}).then(function(r){
						context.stagingView.render(r.stagedEmbeddables);
						context.navigator.request({
							id: r.savedEmbeddableFile.Id,
							type: 'file',
							name: r.savedEmbeddableFile.Name
						});
					});
				});
			},
			'me.view.embeddables.export': function(context, data) {
				if(data.requests) {
					context.exporter.exportEmbeddables(data.requests);
				} else {
					context.exporter.exportAllEmbeddables();
				}
			},
			'me.view.embeddables.delete': function(context, data) {
				if(data.requests && confirm(context.resources.confirmDeleteEmbeddables)) {
					context.model.deleteEmbeddables({
						embeddables: data.requests.map(function(t){
							return {
								id: t.id
							};
						})
					}).then(function(deleteResponse){
						if(deleteResponse.deleted) {
							messaging.publish('me.model.embeddable.staging.changed');
							context.tabContentController.applyComparisonMode(null, null);
						} else {
							// if not deleted, it was b/c there are choices to be made,
							// for related components to revert. So, show those options
							context.revertStagedComponentsView.prompt({
								revertibleChildren: deleteResponse.revertibleChildren,
								onRevert: function(selections) {
									// re-attempt revert after selections made
									context.model.deleteEmbeddables($.extend({}, selections, {
										embeddables: data.requests.map(function(t){
											return {
												id: t.id
											};
										})
									})).then(function(deleteResponseB){
										if(deleteResponseB.deleted) {
											context.tabContentController.applyComparisonMode(null, null);
											messaging.publish('me.model.embeddable.staging.changed');
										}
									});
								}
							});
						}
					});
				}
			},
			'me.view.resources.export': function(context, data) {
				if(data.requests) {
					context.exporter.exportResources(data.requests);
				} else {
					context.exporter.exportAllResources();
				}
			},
			'me.view.file.delete': function(context, data) {
				var request = parseEmbeddableRequestData(data);
				context.model.deleteEmbeddableFile({
					id: request.id,
					name: request.name
				}).then(function(r){
					context.stagingView.render(r.stagedEmbeddables);
				});
			},
			'me.view.file.restore': function(context, data) {
				var request = parseEmbeddableRequestData(data);
				context.model.restoreEmbeddableFile({
					id: request.id,
					name: request.name
				}).then(function(r){
					// close existing
					context.tabListController.close(request);
					context.tabContentController.close(request);
					// re-navigate
					context.navigator.request(request);
					// render staging
					context.stagingView.render(r.stagedEmbeddables);
				});
			},
			'me.view.manual-save': function(context, data) {
				context.model.flushPendingTasks();
			},
			'me.view.embeddables.search': function(context, data) {
				context.browseController.focusOnSearch({
					focusedElement: document.activeElement
				});
			},
			'me.view.embeddable.publish': function(context, data) {
				var currentRequest = context.tabListController.getCurrent();
				messaging.publish('studio.view.staging.publish', currentRequest);
			},
			'me.view.embeddable.revert': function(context, data) {
				var currentRequest = context.tabListController.getCurrent();
				messaging.publish('studio.view.staging.revert', currentRequest);
			},
			'me.view.documentation.show': function(context, data) {
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
			'me.view.embeddable.remove-preview': function(context, data) {
				var request = parseEmbeddableRequestData(data);
				context.model.saveEmbeddable({
					id: request.id,
					newPreviewImageFileName: '',
					immediate: true
				}).then(function(r){
					context.stagingView.render(r.stagedEmbeddables);
				});
			},
			'me.view.embeddable.upload-preview': function(context, data) {
				var request = parseEmbeddableRequestData(data);
				context.uploader.upload({ withProgress: true }).then(function(file){
					context.model.saveEmbeddable({
						id: request.id,
						uploadContext: file.context,
						newPreviewImageFileName: file.name,
						immediate: true
					}).then(function(r){
						context.stagingView.render(r.stagedEmbeddables);
					});
				});
			},
			'me.view.embeddable.remove-icon': function(context, data) {
				var request = parseEmbeddableRequestData(data);
				context.model.saveEmbeddable({
					id: request.id,
					newIconImageFileName: '',
					immediate: true
				}).then(function(r){
					context.stagingView.render(r.stagedEmbeddables);
				});
			},
			'me.view.embeddable.upload-icon': function(context, data) {
				var request = parseEmbeddableRequestData(data);
				context.uploader.upload({ withProgress: true }).then(function(file){
					context.model.saveEmbeddable({
						id: request.id,
						uploadContext: file.context,
						newIconImageFileName: file.name,
						immediate: true
					}).then(function(r){
						context.stagingView.render(r.stagedEmbeddables);
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
			'me.view.staging.configured': function(context, data) {
				alert(context.resources.configuredImport);
			}
		};

		$.each(viewEvents, function(eventName, handler){
			$.telligent.evolution.messaging.subscribe(eventName, function(data) {
				if(data && data.target) {
					$.extend(data, parseDataOptions(data.target));
				}

				if($.telligent.evolution.widgets.manageEmbeddables.LOGGING_ENABLED) {
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
					'ctrl + comma': { message: 'me.view.embeddables.search', description: context.resources.shortcutSearch },
					'meta + p': { message: 'me.view.embeddable.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'meta + alt + p': { message: 'me.view.embeddable.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + alt + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'ctrl + shift + n': { message: 'studio.view.new', description: context.resources.shortcutNewEmbeddable },
					'ctrl + s': { message: 'me.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else {
				combos = {
					'ctrl + comma': { message: 'me.view.embeddables.search', description: context.resources.shortcutSearch },
					'meta + p': { message: 'me.view.embeddable.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'meta + shift + p': { message: 'me.view.embeddable.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'ctrl + shift + n': { message: 'studio.view.new', description: context.resources.shortcutNewEmbeddable },
					'ctrl + s': { message: 'me.view.manual-save', description: context.resources.shortcutForceSave }
				}
			}
		} else {
			if(StudioEnvironment.browser.firefox) {
				combos = {
					'alt + comma': { message: 'me.view.embeddables.search', description: context.resources.shortcutSearch },
					'alt + p': { message: 'me.view.embeddable.publish', description: context.resources.shortcutPublish },
					'alt + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'alt + shift + p': { message: 'me.view.embeddable.revert', description: context.resources.shortcutRevert },
					'alt + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + n': { message: 'studio.view.new', description: context.resources.shortcutNewEmbeddable },
					'ctrl + s': { message: 'me.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else if(StudioEnvironment.browser.edge) {
				combos = {
					'alt + comma': { message: 'me.view.embeddables.search', description: context.resources.shortcutSearch },
					'alt + p': { message: 'me.view.embeddable.publish', description: context.resources.shortcutPublish },
					'alt + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'alt + shift + p': { message: 'me.view.embeddable.revert', description: context.resources.shortcutRevert },
					'alt + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + n': { message: 'studio.view.new', description: context.resources.shortcutNewEmbeddable },
					'ctrl + s': { message: 'me.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else {
				combos = {
					'alt + comma': { message: 'me.view.embeddables.search', description: context.resources.shortcutSearch },
					'ctrl + p': { message: 'me.view.embeddable.publish', description: context.resources.shortcutPublish },
					'alt + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'ctrl + shift + p': { message: 'me.view.embeddable.revert', description: context.resources.shortcutRevert },
					'alt + ctrl + shift + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + n': { message: 'studio.view.new', description: context.resources.shortcutNewEmbeddable },
					'ctrl + s': { message: 'me.view.manual-save', description: context.resources.shortcutForceSave }
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
			includeEmbeddableEvents: true
		}));
	}

	function buildTabPersistence(context) {
		context.tabListStore = new StudioTabListStore({
			tabListView: context.tabListController.view(),
			storageNameSpace: 'embeddables',
			onLoad: function(key) {
				var request = context.navigator.parse(key);

				if(Utility.isFileRequest(request)) {
					return context.model.getEmbeddableFile({
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
				// if any other part of the embeddable, load the full embeddable
				} else {
					return context.model.getEmbeddable({
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

		// load currently-staged embeddables
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
		if(context.previewingFromEmbeddableStudio) {
			$.telligent.evolution.embeddablePreview.enabled(false);
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

		pairs.push('_eid' + "=" + encodeURIComponent(request.id || ''));

		if(modelType == 'component' && Utility.isFileRequest(request)) {
			pairs.push('_et' + "=" + encodeURIComponent(request.type || ''));
			pairs.push('_en' + "=" + encodeURIComponent(request.name || ''));
		}

		return pairs.join('&');
	}

	function loadAndRenderStagingView(context) {
		return $.Deferred(function(d){
			context.model.listEmbeddables({
				staged: true
			}).then(function(a){
				context.stagingView.render(a.embeddables || []);
				d.resolve(a);
			});
		}).promise();
	}

	var Controller = function(options){
		var context = $.extend({}, defaults, options || {});

		// cache of new embeddables and files that haven't ever yet been saved
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