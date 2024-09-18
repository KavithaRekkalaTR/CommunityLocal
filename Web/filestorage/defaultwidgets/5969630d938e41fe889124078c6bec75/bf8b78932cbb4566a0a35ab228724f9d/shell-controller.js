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
		'SelectProviderView',
		'StudioSettingsView',
		'StudioSettings',
		'StudioEditViewWrapperView',
		'StudioTabContentController',
		'StudioNavigator',
		'StudioUploader',
		'SelectThemeView',
		'StudioDockViewController',
		'StudioShortcutsController',
		'StudioTabListStore',
		'StudioScriptConsoleDockView',
		'StudioApiDocumentationDockView',
		'StudioApiDataModelProvider',
		'DataModel',
		'EditViewFactory',
		'ImportSelectorView',
		'Exporter',
		'GlobalSearchDockView'
		],
	 function(
		StudioEnvironment,
		StudioSaveQueue,
		StudioBrowseController,
		StudioTabListController,
		StudioStagingView,
		SelectProviderView,
		StudioSettingsView,
		StudioSettings,
		StudioEditViewWrapperView,
		StudioTabContentController,
		StudioNavigator,
		StudioUploader,
		SelectThemeView,
		StudioDockViewController,
		StudioShortcutsController,
		StudioTabListStore,
		StudioScriptConsoleDockView,
		StudioApiDocumentationDockView,
		StudioApiDataModelProvider,
		DataModel,
		EditViewFactory,
		ImportSelectorView,
		Exporter,
		GlobalSearchDockView,
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
			exportFragmentsUrl: context.urls.exportFragmentsUrl,
			storeTemporaryExportListUrl: context.urls.storeTemporaryExportListUrl
		});

		return dataModel;
	}

	function buildEditViewController(context) {

		function processSave(context, request, model, immediately) {
			if(request.type === 'attachment') {
				return context.model.saveFragmentAttachment({
					instanceIdentifier: model.InstanceIdentifier,
					themeId: model.ThemeId || '',
					name: model.Name,
					content: model.Content,
					newName: model.NewName,
					queueSalt: model.queueSalt,
					immediate: immediately
				}).then(function(r){
					context.stagingView.render(r.stagedFragments);
				});
			} else {
				return context.model.saveFragment({
					instanceIdentifier: model.InstanceIdentifier,
					name: model.Name,
					description: model.Description,
					cssClass: model.CssClass,
					isCacheable: model.IsCacheable,
					varyCacheByUser: model.VaryCacheByUser,
					contentScript: model.ContentScript,
					contentScriptLanguage: model.ContentScriptLanguage,
					additionalCssScript: model.AdditionalCssScript,
					additionalCssScriptLanguage: model.AdditionalCssScriptLanguage,
					headerScript: model.HeaderScript,
					headerScriptLanguage: model.HeaderScriptLanguage,
					showHeaderByDefault: model.ShowHeaderByDefault,
					themeId: model.ThemeId || '',
					resourcesToSave: model.ResourcesToSave,
					configurationXml: model.ConfigurationXml,
					factoryDefaultProvider: model.FactoryDefaultProvider,
					contextItemIds: model.ContextItemIds.join(','),
					restScopeIds: (model.RestScopes || []).map(function (s) { return s.Id }).join(','),
					immediate: immediately
				}).then(function (r) {
					context.stagingView.render(r.stagedFragments);
				});
			}
		}

		function processLoadDefaultVariant(context, request, includeAllAttachments) {
			if(request.type === 'attachment') {
				return context.model.getFragmentAttachment({
					instanceIdentifier: request.id,
					themeId: request.theme,
					name: request.attachment,
					staged: false,
					factoryDefault: true
				});
			} else {
				return context.model.getFragment({
					instanceIdentifier: request.id,
					themeId: request.theme,
					staged: false,
					factoryDefault: true,
					includeFileDigests: includeAllAttachments
				});
			}
		}

		function processLoadStaged(context, request, includeAllAttachments) {
			if(request.type === 'attachment') {
				return context.model.getFragmentAttachment({
					instanceIdentifier: request.id,
					themeId: request.theme,
					name: request.attachment,
					staged: true
				});
			} else {
				return context.model.getFragment({
					instanceIdentifier: request.id,
					themeId: request.theme,
					staged: true,
					includeFileDigests: includeAllAttachments
				});
			}
		}

		function processLoadNonStaged(context, request, includeAllAttachments) {
			if(request.type === 'attachment') {
				return context.model.getFragmentAttachment({
					instanceIdentifier: request.id,
					themeId: request.theme,
					name: request.attachment,
					staged: false
				});
			} else {
				return context.model.getFragment({
					instanceIdentifier: request.id,
					themeId: request.theme,
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
			getAutoCompleteSuggestions: function(mode, prefix, fragmentId) {
				var savedEditorSettings = context.settings.get();
				return context.apiModel.listSuggestions({
					mode: mode,
					prefix: prefix,
					fragmentId: fragmentId,
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
				return (request.line && request.line > 1 ? request.line : request.attachment);
			},
			onUpdateEditor: function(editorRequest, updateRequest, updateModel, controller) {
				if(!updateModel)
					return;

				// this is an update of an attachment tab based on updates to the overall updateModel itself
				if(editorRequest.type == 'attachment' && updateRequest.type != 'attachment') {
					// update the only parts of the attachment updateModel that would have changed
					controller.applyModelChanges({
						ThemeTitle: updateModel.ThemeTitle,
						ProcessedFragmentName: updateModel.ProcessedName,
						State: updateModel.State,
						IsStaged: updateModel.IsStaged
					});

				// if this is an update of an attachment tab
				} else if (editorRequest.type == 'attachment' &&
					updateRequest.type == 'attachment' &&
					editorRequest.attachment == updateRequest.attachment)
				{
					// an attachment update could represent a rename, which would affect the updateRequest
					editorRequest.attachment = updateModel.Name;

					controller.applyModelChanges(updateModel);

				// non-attachment update
				} else if (updateRequest.type != 'attachment' &&
					editorRequest.type != 'attachment' &&
					updateModel.Attachments)
				{
					controller.applyModelChanges(updateModel);
				}
			}
		});
	}

	function buildViews(context) {

		return $.Deferred(function(d){

			var headerContainer = $('<div></div>');
			$.telligent.evolution.administration.header(headerContainer, {
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
					// if the tab is for an attachment, update it accordingly
					if(tabRequest.type === 'attachment') {
						// updating an attachment tab with an attachment model
						if(updateRequest.attachment && updateRequest.attachment == tabRequest.attachment) {
							tabRequest.attachment = updateModel.Name;
							controller.applyModelChanges(updateModel);
						// updating an attachment tab with new fragment model data
						} else {
							// processed name is the only reasonable change here
							controller.applyModelChanges({
								FragmentProcessedName: updateModel.ProcessedName,
								IsStaged: updateModel.IsStaged,
								IsTranslated: updateModel.IsTranslated,
								IsReverted: updateModel.IsReverted,
								IsDeleted: updateModel.IsDeleted
							});
						}
					// if the tab is for a fragment component and the request isn't related to an attachment...
					} else if(!updateRequest.attachment) {
						// otherwise, it's a regular fragment tab
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

			// select provider view
			context.selectProviderView = new SelectProviderView({
				template: $.telligent.evolution.template(context.templates.selectProviderTemplate),
				resources: context.resources
			});

			// select theme view
			context.selectThemeView = new SelectThemeView({
				template: $.telligent.evolution.template(context.templates.selectThemeTemplate),
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
			$.telligent.evolution.administration.sidebar({
				content: sideBar
			}).then(function(){

				// Staging View
				var stagingContainer = $('<div></div>').appendTo(sideBar);
				context.stagingView = new StudioStagingView({
					container: stagingContainer,
					resources: context.resources
				});

				// Browse Controller
				var rootFilters = [
					'Custom',
					'all-global',
					'FactoryDefault',
					'CustomizedDefault'
				];
				var browseContainer = $('<div></div>').appendTo(sideBar);
				var browseHeaderContent = $($.telligent.evolution.template(context.templates.browseHeaderTemplate)({}));
				var includeProviderCategories = false;
				context.browseController = new StudioBrowseController({
					resources: context.resources,
					browseHeaderContent: browseHeaderContent,
					browseViewItemTemplate: context.templates.browseViewItemTemplate,
					actionsTemplate: $.telligent.evolution.template(context.templates.fragmentActionsTemplate),
					container: browseContainer,
					wrapperCssClass: 'management-studio manage-widgets',
					searchPlaceholder: context.resources.nameorDescription,
					multiSelectActions: [
						{ message: 'mfw.view.fragments.export', label: context.resources.exportSelectedWidgets },
						{ message: 'mfw.view.resources.export', label: context.resources.exportSelectedResources },
						{ message: 'mfw.view.fragments.delete', label: context.resources.deleteSelectedWidgets }
					],
					modelDepth: 1,
					onGetInitialNodes: function() {
						return $.Deferred(function (d) {
							if (!includeProviderCategories)
								d.resolve([]);

							var providerCategories = context.providerCategories.map(function(p){
								return {
									key: 'pc:' + p.Id,
									label: p.Name,
									description: p.Name,
									cssClass: 'container',
									isCategory: true,
									expanded: true
								};
							});
							d.resolve(providerCategories);
						}).promise();
					},
					onList: function (explicitQuery) {
						if (!context.browseSearchInput) {
							context.browseSearchInput = browseContainer.find('input.query');
							context.browseThemeSelect = browseContainer.find('select.theme-select');
							context.browseProviderSelect = browseContainer.find('select.provider-select');

							context.browseThemeSelect.on('change', function () {
								context.browseController.load({
									modelDepth: rootFilters.includes(context.browseProviderSelect.val()) ? 1 : 0
								});
							});
							context.browseProviderSelect.on('change', function () {
								context.browseController.load({
									modelDepth: rootFilters.includes(context.browseProviderSelect.val()) ? 1 : 0
								});
							});
						}

						var query = {};
						var searchQuery = null;
						if($.trim(context.browseSearchInput.val()).length > 0) {
							searchQuery = $.trim(context.browseSearchInput.val());
						}

						if(context.browseThemeSelect.val() !== 'all') {
							query.themeId = context.browseThemeSelect.val();
						}

						// state or provider selection
						var providerSelectVal = context.browseProviderSelect.val();
						includeProviderCategories = false;
						if (providerSelectVal == 'all-themepage') {
							query.scriptable = false;
						} else if (providerSelectVal == 'all-global') {
							includeProviderCategories = true;
						} else {
							if(providerSelectVal.indexOf(':') > 0) {
								var selectType = "Provider";
								query.factoryDefaultProvider = providerSelectVal.split(':')[1];
							} else {
								includeProviderCategories = true;
								query.state = providerSelectVal;
							}
						}

						if (explicitQuery && explicitQuery.length > 0) {
							searchQuery = explicitQuery;
						}

						return context.model.listFragments(query).then(function(r){
							// no results
							if (!r || !r.fragments || !r.fragments.length) {
								return [{ isEmptyResult: true }];
							}
							// if searched...
							if (searchQuery) {
								// searching is always flat
								context.browseController.modelDepth(0);
								// build a flattened list of possible search results
								var flattenedFragmentComponents = [];
								for(var i = 0; i < r.fragments.length; i++) {
									var fragment = r.fragments[i];
									var category = null;

									if (fragment.FactoryDefaultProvider && context.categoriesByProvider[fragment.FactoryDefaultProvider]) {
										category = context.providerCategories[context.categoriesByProvider[fragment.FactoryDefaultProvider]].Name;
									}

									// overview
									flattenedFragmentComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: fragment.InstanceIdentifier,
											theme: (fragment.ThemeId || ''),
											type: 'overview'
										}),
										label: context.resources.overview,
										model: fragment,
										category: category,
										cssClass: 'managed-item overview',
										haystack: (category + ' ' + fragment.ProcessedName + ' ' + fragment.ProcessedDescription + ' ' + context.resources.overview).toLowerCase()
									});

									// content script
									flattenedFragmentComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: fragment.InstanceIdentifier,
											theme: (fragment.ThemeId || ''),
											type: 'content'
										}),
										label: context.resources.content,
										model: fragment,
										category: category,
										cssClass: 'managed-item contentscript',
										haystack: (category + ' ' + fragment.ProcessedName + ' ' + fragment.ProcessedDescription + ' ' + context.resources.content).toLowerCase()
									});

									// content script
									flattenedFragmentComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: fragment.InstanceIdentifier,
											theme: (fragment.ThemeId || ''),
											type: 'configuration'
										}),
										label: context.resources.configuration,
										model: fragment,
										category: category,
										cssClass: 'managed-item configuration',
										haystack: (category + ' ' + fragment.ProcessedName + ' ' + fragment.ProcessedDescription + ' ' + context.resources.configuration).toLowerCase()
									});

									// header script
									flattenedFragmentComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: fragment.InstanceIdentifier,
											theme: (fragment.ThemeId || ''),
											type: 'header'
										}),
										label: context.resources.header,
										model: fragment,
										category: category,
										cssClass: 'managed-item header',
										haystack: (category + ' ' + fragment.ProcessedName + ' ' + fragment.ProcessedDescription + ' ' + context.resources.header).toLowerCase()
									});

									// css script
									flattenedFragmentComponents.push({
										isFilterResult: true,
										key: context.navigator.serialize({
											id: fragment.InstanceIdentifier,
											theme: (fragment.ThemeId || ''),
											type: 'css'
										}),
										label: context.resources.cssScript,
										model: fragment,
										category: category,
										cssClass: 'managed-item cssScript',
										haystack: (category + ' ' + fragment.ProcessedName + ' ' + fragment.ProcessedDescription + ' ' + context.resources.cssScript).toLowerCase()
									});

									// attachments
									if (fragment.Attachments && fragment.Attachments.length > 0) {
										for(var f = 0; f < fragment.Attachments.length; f++) {
											var file = fragment.Attachments[f];

											flattenedFragmentComponents.push({
												isFilterResult: true,
												key: context.navigator.serialize({
													id: fragment.InstanceIdentifier,
													theme: (fragment.ThemeId || ''),
													type: 'attachment',
													attachment: file.Name
												}),
												label: file.Name,
												model: fragment,
												category: category,
												cssClass: 'managed-item attachment',
												haystack: (category + ' ' + fragment.ProcessedName + ' ' + fragment.ProcessedDescription + ' ' + context.resources.cssScript + ' ' + file.Name).toLowerCase()
											});
										}
									}
								}

								// filter flattened fragment components to items that contain all words in the query, regardless of order
								var queryComponents = searchQuery.toLowerCase().split(' ');
								return flattenedFragmentComponents.filter(function(t){
									var includesQuery = true;
									for(var i = 0; i < queryComponents.length; i++) {
										includesQuery = includesQuery && t.haystack.indexOf(queryComponents[i]) >= 0
									}
									return includesQuery;
								});
							} else {
								// reset the model depth
								context.browseController.modelDepth(rootFilters.includes(context.browseProviderSelect.val()) ? 1 : 0);
								return r.fragments;
							}
						});
					},
					onGetAndSelect: function (request) {
						return context.model.getFragment({
							instanceIdentifier: request.id,
							themeId: request.theme
						}).then(function (fragment) {
							context.browseSearchInput.val('');
							context.browseThemeSelect.val('all');
							context.browseProviderSelect.val('all-global');
							return fragment;
						});
					},
					onSerializeRequest: function(request, options) {
						return context.navigator.serialize(request, options);
					},
					onParseRequest: function(request) {
						return context.navigator.parse(request);
					},
					onSelected: function(request) {
						context.navigator.request(context.navigator.parse(request));
						context.browseController.clearSearch();
					},
					onConvertModelToNode: function (model) {
						if (model.isEmptyResult) {
							return {
								key: '',
								label: 'No Matches',
								cssClass: 'managed-item overview',
								model: {}
							};
						} else if(model.isFilterResult) {
							return model;
						}

						var overviewNode = {
							key: context.navigator.serialize({
								id: model.InstanceIdentifier,
								theme: (model.ThemeId || ''),
								type: 'overview'
							}),
							label: model.ProcessedName,
							cssClass: 'managed-item overview',
							model: model,
							children: []
						};

						// categories in provider category node
						if (model.FactoryDefaultProvider && context.categoriesByProvider[model.FactoryDefaultProvider]) {
							overviewNode.parentKey = 'pc:' + context.categoriesByProvider[model.FactoryDefaultProvider];
						} else {
							// default to first (theme page) category
							overviewNode.parentKey = 'pc:' + context.providerCategories[0].Id;
						}

						overviewNode.children.push({
							key: context.navigator.serialize({
								id: model.InstanceIdentifier,
								theme: (model.ThemeId || ''),
								type: 'content'
							}),
							label: 'Content',
							cssClass: 'managed-item content',
						});
						if(typeof model.HasPluginConfiguration !== 'undefined' || !model.HasPluginConfiguration) {
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.InstanceIdentifier,
									theme: (model.ThemeId || ''),
									type: 'configuration'
								}),
								label: 'Configuration',
								cssClass: 'managed-item configuration',
							});
						}
						if(model.HasHeader) {
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.InstanceIdentifier,
									theme: (model.ThemeId || ''),
									type: 'header'
								}),
								label: 'Header',
								cssClass: 'managed-item header',
							});
						}
						if(model.HasWrapperCss) {
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.InstanceIdentifier,
									theme: (model.ThemeId || ''),
									type: 'css'
								}),
								label: 'CSS Script',
								cssClass: 'managed-item css',
							});
						}
						overviewNode.children.push({
							key: context.navigator.serialize({
								id: model.InstanceIdentifier,
								theme: (model.ThemeId || ''),
								type: 'language'
							}),
							label: 'Resources',
							cssClass: 'managed-item resources',
						});
						for(var i = 0; i < model.Attachments.length; i++) {
							overviewNode.children.push({
								key: context.navigator.serialize({
									id: model.InstanceIdentifier,
									theme: (model.ThemeId || ''),
									type: 'attachment',
									attachment: model.Attachments[i].Name
								}),
								type: 'attachment',
								label: model.Attachments[i].Name,
								cssClass: 'managed-item non-editable-attachment',
							});
						}

						return overviewNode;
					}
				});

				var extraLinkTemplate = $.telligent.evolution.template.compile('<a href="#" data-messagename="<%: message %>"><%= label %></a>');
				[
					{ message: 'mfw.view.fragments.export', label: 'Export All Widgets' },
					{ message: 'mfw.view.resources.export', label: 'Export All Resources' }
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
		/*
			Query:
				_fid (fragment id)
				_ftid (fragment theme name)
				_ft (fragment type)
					overview
					configuration
					content
					header
					css
					language
					attachment
				_fan (attachment name)
				_fl (line)
		*/

		function prefix(options) {
			if(!options)
				return {};

			return {
				_fid: options.id || '',
				_ftid: options.theme || '',
				_ft: options.type || '',
				_fan: options.attachment || '',
				_fl: options.line || 0
			};
		}

		function dePrefix(options) {
			return {
				id: options._fid || '',
				theme: options._ftid || '',
				type: options._ft || '',
				attachment: options._fan || '',
				line: (options._fl ? parseInt(options._fl, 10) : 0)
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
				} else if(request.type === 'attachment') {
					return context.model.getFragmentAttachment({
						instanceIdentifier: request.id,
						themeId: request.theme,
						name: request.attachment,
						fallback: true
					}).then(function(r){
						if(!r) {
							global.history.back();
						}
						return r;
					});
				// if any other part of the widget, load the full widget
				} else {
					return context.model.getFragment({
						instanceIdentifier: request.id,
						themeId: request.theme
					});
				}
			},
			onSerialize: function(request, options) {
				if(!request)
					return '';

				/*
					options:
						includeLineNumber: default false
				 */
				var pairs = [];

				pairs.push('_fid' + "=" + encodeURIComponent(request.id || ''));
				pairs.push('_ftid' + "=" + encodeURIComponent(request.theme || ''));

				pairs.push('_ft' + "=" + encodeURIComponent(request.type || ''));

				// ignore attachment names for non-attachment requests
				// the field is overloaded for navigating to deeper parts of a component
				// such as resource names, but is not useful in identifying overall tabs
				if(request.type == 'attachment' || (options && options.includeAttachment)) {
					pairs.push('_fan' + "=" + encodeURIComponent(request.attachment || ''));
				}

				if(options && options.includeLineNumber) {
					pairs.push('_fl' + "=" + encodeURIComponent(request.line || 0));
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
		function buildKey(theme, id) {
			return "k:" + (theme || '') + ":" + id;
		}

		var modelEvents = {

			'mfw.model.fragment.staging.changed': function(data) {
				// determine a list of originally staged items by looking at the pre-updated stagingView
				var originalStagedRequests = $.map(context.stagingView.list(), function(m) { return { id: $(m).data('id'), theme: $(m).data('theme') }; } )

				loadAndRenderStagingView(context).then(function(){
					// get list of newly staged items
					var newStagedRequests = $.map(context.stagingView.list(), function(m) { return { id: $(m).data('id'), theme: $(m).data('theme') }; } )

					// map them to a hash for quick checking
					var newStagedRequestsIndex = {};
					for(var i = 0; i < newStagedRequests.length; i++) {
						newStagedRequestsIndex[buildKey(newStagedRequests[i].theme, newStagedRequests[i].id)] = newStagedRequests[i];
					}

					// get list of all currently open fragments, and map them to a hash for
					// quickly determining if they should be reloaded
					// get list of currently open tabs
					var tabs = context.tabListController.listAll();
					var tabsIndex = {};
					for(var i = 0; i < tabs.length; i++) {
						tabsIndex[buildKey(tabs[i].request.theme, tabs[i].request.id)] = tabs[i].request;
					}

					// identify which original requests are no longer represented
					// by looping over the original and comparing with check index
					for(var i = 0; i < originalStagedRequests.length; i++) {
						(function(i){

							var key = buildKey(originalStagedRequests[i].theme, originalStagedRequests[i].id);
							if(newStagedRequestsIndex[key]) {
								return;
							} else {
								// if an item was staged that no longer is...
								var request = originalStagedRequests[i];
								var serializedOriginalRequest = buildKey(request.theme, request.id);

								// if published fragment wasn't open in any tabs, don't reload
								if(!tabsIndex[serializedOriginalRequest])
									return;

								// otherwise, load the fragment
								context.model.getFragment({
									instanceIdentifier: request.id,
									themeId: request.theme
								}).then(function(updatedFragment){
									// if the fragment doesn't exist,
									// then this was a revert of something that was never savedFragment
									// and we want to just close its UI completely
									if(!updatedFragment) {
										context.tabListController.close(request, true);
										context.tabContentController.close(request, true);
										return;
									}

									// otherwise, this was a publish, and we want to treat its UI
									// the same way as when a "revert" happens, in that
									// we let the app take care of investigating what
									// needs to be updated in each album or not
									$.telligent.evolution.messaging.publish('mfw.model.fragment.updated', {
										model: updatedFragment,
										reverted: true,
										id: {
											instanceIdentifier: request.id,
											themeId: request.theme
										}
									})
								});
							}

						})(i);
					}
				});
			},
			'mfw.model.fragments.changed': function(data) {
				// when a mass fragments change has been completed
				context.browseController.loadInitial().then(function(){
					var currentRequest = context.tabListController.getCurrent();
					if(currentRequest) {
						context.browseController.select(currentRequest);
					}
				});
			},
			'mfw.model.fragment.created': function (data) {
				// if cloned, open new clone in a tab
				if(data.cloned) {

					context.navigator.request({
						id: data.model.InstanceIdentifier,
						theme: data.model.ThemeId,
						type: 'overview'
					});

					// update browse view
					context.browseController.select({
						id: data.id.instanceIdentifier,
						theme: data.id.themeId
					});

				} else {
					// update tabs
					context.tabListController.update({
						id: data.id.instanceIdentifier,
						theme: data.id.themeId
					}, data.model);

					// update open edit views
					context.tabContentController.update({
						id: data.id.instanceIdentifier,
						theme: data.id.themeId
					}, data.model);

					// update browse view
					context.browseController.select({
						id: data.id.instanceIdentifier,
						theme: data.id.themeId
					});
				}
			},
			'mfw.model.fragment.updated': function(data) {
				// update tabs
				context.tabListController.update({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId
				}, data.model);

				// update open edit views
				context.tabContentController.update({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId
				}, data.model, data.reverted);

				// update browse view
				context.browseController.update({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId
				}, data.model);

				// if this update was from a revert,
				// then also close (new) and/or update any open edited attachment tabs
				if(data.reverted) {
					// build a quick index of attachments for each reference
					var currentAttachmentIndex = {};
					for(var i = 0; i < data.model.Attachments.length; i++) {
						currentAttachmentIndex[data.model.Attachments[i].Name] = data.model.Attachments[i];
					}

					// get a list of currently-rendered requests for the model
					var renderedRequests = context.tabContentController.listRelatedRenderedRequestsForRequest({
						id: data.id.instanceIdentifier,
						theme: data.id.themeId
					});

					$.each(renderedRequests, function(i, request){
						// filter to attachments only
						if(request.type == 'attachment') {
							// if the staged attachment request is no longer
							// a part of the reverted set of attachments (either it was new or renamed)
							// then just close it altogether.
							if(!currentAttachmentIndex[request.attachment]) {
								context.tabListController.close(request, false);
								context.tabContentController.close(request);
							} else {
								// otherwise, fully load the old attachment content and re-render it
								context.model.getFragmentAttachment({
									instanceIdentifier: request.id,
									themeId: request.theme,
									name: request.attachment
								}).then(function(revertedAttachmentModel){
									context.tabContentController.update({
										id: request.id,
										theme: request.theme,
										attachment: request.attachment,
										type: 'attachment'
									}, revertedAttachmentModel, data.reverted);
								})
							}
						}
					});
				}
			},
			'mfw.model.fragments.updated': function(data) {
				// get a unique list of all currently open requests
				var tabs = context.tabListController.listAll();
				var tabsIndex = {};
				for(var i = 0; i < tabs.length; i++) {
					tabsIndex[buildKey(tabs[i].request.theme, tabs[i].request.id)] = tabs[i].request;
				}

				// filter the list of updated fragments to only those with open tabs
				data.fragments.forEach(function(fragment) {
					if (tabsIndex[buildKey(fragment.themeId, fragment.instanceIdentifier)]) {

						// for each fragment that has open tab(s), load it and synthesize
						// a full update event of it in order to trigger updating of all of its
						// tabs the same as if it had received a full update event or been reverted
						context.model.getFragment(fragment).then(function(updatedFragment){
							if(!updatedFragment) {
								return;
							}

							$.telligent.evolution.messaging.publish('mfw.model.fragment.updated', {
								model: updatedFragment,
								reverted: true, // forces a re-analysis of all request/attachments
								id: fragment
							})
						});
					}
				});
			},
			'mfw.model.fragment.deleted': function(data) {
				// close any tab items for the data
				context.tabListController.close({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId
				}, true);

				// close editor instances
				context.tabContentController.close({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId
				}, true);

				// update browse view
				context.browseController.remove({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId
				});
			},
			'mfw.model.attachment.created': function(data) {
				// if rename, ensure temp item cache doesn't contain old
				if (data.id && data.model && data.id.name != data.model.Name) {
					delete context.temporaryNewItemCache[context.navigator.serialize({ id: data.id.instanceIdentifier, theme: data.id.themeId, attachment: data.id.name, type: 'attachment' })];
				}

				// change the current URL (without navigating)
				// if represents a change to the name of the attachment
				// and that attachment is currently focused/rendered
				if(context.currentRenderedRequest &&
					context.currentRenderedRequest.attachment == data.id.name &&
					data.id.name != data.model.Name)
				{
					context.currentRenderedRequest.attachment = data.model.Name;
					context.navigator.adjustCurrentWithoutProcess({
						id: data.model.InstanceIdentifier,
						theme: data.model.ThemeId,
						type: 'attachment',
						attachment: data.model.Name
					});
				}

				// update tab view
				context.tabListController.update({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId,
					type: 'attachment',
					attachment: data.id.name
				}, data.model);

				// update open edit views
				context.tabContentController.update({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId,
					attachment: data.id.name,
					type: 'attachment'
				}, data.model);

				// select in tree
				context.browseController.select({
					id: data.model.InstanceIdentifier,
					theme: data.model.ThemeId,
					type: 'attachment',
					attachment: data.model.Name
				});
			},
			'mfw.model.attachment.updated': function(data) {
				// if rename, ensure temp item cache doesn't contain old
				if (data.id && data.model && data.id.name != data.model.Name) {
					delete context.temporaryNewItemCache[context.navigator.serialize({ id: data.id.instanceIdentifier, theme: data.id.themeId, attachment: data.id.name, type: 'attachment' })];
				}

				// change the current URL (without navigating)
				// if represents a change to the name of the attachment
				// and that attachment is currently focused/rendered
				if(context.currentRenderedRequest &&
					context.currentRenderedRequest.attachment == data.id.name &&
					data.id.name != data.model.Name)
				{
					context.currentRenderedRequest.attachment = data.model.Name;
					context.navigator.adjustCurrentWithoutProcess({
						id: data.model.InstanceIdentifier,
						theme: data.model.ThemeId,
						type: 'attachment',
						attachment: data.model.Name
					});
				}

				// update tab view
				context.tabListController.update({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId,
					type: 'attachment',
					attachment: data.id.name
				}, data.model);

				// update open edit views
				context.tabContentController.update({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId,
					attachment: data.id.name,
					type: 'attachment'
				}, data.model, data.reverted);

				// select in tree
				context.browseController.select({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId,
					attachment: data.model.Name,
					type: 'attachment'
				});
			},
			'mfw.model.attachment.deleted': function(data) {
				// close any tab items for the data
				context.tabListController.close({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId,
					attachment: data.id.name,
					type: 'attachment'
				});

				context.tabContentController.close({
					id: data.id.instanceIdentifier,
					theme: data.id.themeId,
					attachment: data.id.name,
					type: 'attachment'
				});
			}
		};

		$.each(modelEvents, function(eventName, handler){
			$.telligent.evolution.messaging.subscribe(eventName, function(data){
					if($.telligent.evolution.widgets.manageFragments.LOGGING_ENABLED) {
						console.log('MODEL EVENT: ' + eventName);
						console.log(data);
					}

					handler(data);
				});
		});
	}

	function importFile(context, uploadContext, fileName) {
		context.browseController.captureSelectionState();
		context.model.importFragments({
			uploadContext: uploadContext,
			fileName: fileName
		}).then(function(importResult){
			context.importSelectorView.prompt(importResult, function(response){
				administration.loading(true);
				context.model.importFragments({
					uploadContext: uploadContext,
					fileName: fileName,
					importCommands: response.importCommands,
					provider: response.provider
				}).then(function(r){
					context.stagingView.render(r.stagedFragments);
					context.browseController.reApplySelectionSate()
				}).always(function(){ administration.loading(false) });
			});
		});
	}

	function handleViewEvents(context) {
		context.navigator.registerHandlers();

		function parseFragmentRequestData(data) {
			if (!data) {
				return null
			}
			if (data.reqkey) {
				return context.navigator.parse(data.reqkey);
			} else if (data.id !== undef && data.theme !== undef) {
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

		function initiateNewFragment(context, fragmentId, providerId) {
			context.model.createFragment({
				instanceIdentifier: fragmentId,
				factoryDefaultProvider: providerId
			}).then(function (r) {
				// use the explicit fragmentId, if provided. Otherwise,
				// fall back to the created one
				fragmentId = $.trim(fragmentId || '');
				var request = {
					id: (fragmentId || r.InstanceIdentifier),
					theme: r.ThemeId,
					type: 'overview'
				};
				r.InstanceIdentifier = request.id;
				if(providerId) {
					r.FactoryDefaultProvider = providerId
				}
				context.temporaryNewItemCache[context.navigator.serialize(request)] =  r;
				context.navigator.request(request);
			});
		}

		var viewEvents = {
			'studio.view.import': function(context, data) {
				context.uploader.upload({ withProgress: true }).then(function (file) {
					importFile(context, file.context, file.name);
				});
			},
			'studio.view.settings': function(context, data) {
				context.settingsView.show({
					shortcuts: context.shortcuts.list()
				});
			},
			'studio.view.new': function(context, data) {
				if(context.developerModeEnabled) {
					context.selectProviderView.prompt(function(result){
						initiateNewFragment(context, result.id, result.provider);
					});
				} else {
					initiateNewFragment(context);
				}
			},
			'studio.view.multiselect': function(context, data) {
				context.browseController.toggleSelectMode();
			},
			'studio.view.staging.publish': function(context, data) {
				if(confirm(context.resources.confirmPublish)) {
					administration.loading(true);
					var request = parseFragmentRequestData(data);
					context.model.publishFragment({
						instanceIdentifier: request.id,
						themeId: request.theme
					}).then(function(r){
						context.stagingView.render(r.stagedFragments);
						context.tabContentController.applyComparisonMode(request, null);
					}).always(function(){ administration.loading(false) })
				}
			},
			'studio.view.staging.revert': function(context, data) {
				if(confirm(context.resources.confirmRevert)) {
					administration.loading(true);
					var request = parseFragmentRequestData(data);
					context.model.revertFragment({
						instanceIdentifier: request.id,
						themeId: request.theme
					}).then(function(r){
						context.stagingView.render(r.stagedFragments);
						context.tabContentController.applyComparisonMode(request, null);
					}).always(function(){ administration.loading(false) })
				}
			},
			'studio.view.close': function(context, data) {
				var request = parseFragmentRequestData(data);
				context.tabListController.close(request);
				context.tabContentController.close(request);
				delete context.temporaryNewItemCache[context.navigator.serialize(request)];
			},
			'studio.view.select': function (context, data) {
				var request = data ? parseFragmentRequestData(data) : null;
				context.navigator.request(request);
				if(context.settings.get().syncTree) {
					context.browseController.select(request);
				}
			},
			'studio.view.render': function(context, data) {
				var request = parseFragmentRequestData(data);
				context.tabContentController.render(request, data.model);
				context.tabListController.addOrSelect(request, data.model);
				context.currentRenderedRequest = request;
				context.dockViewController.setEditorTabState(request);
			},
			'studio.view.staging.publish.all': function(context, data) {
				if(confirm(context.resources.confirmPublishAll)) {
					administration.loading(true);
					context.model.listFragments({
						isStaged: true
					}).then(function(r){
						context.model.publishFragments({
							fragments: r.fragments.map(function(f){
								return {
									instanceIdentifier: f.InstanceIdentifier,
									themeId: f.ThemeId
								};
							})
						}).then(function(){
							messaging.publish('mfw.model.fragment.staging.changed');
							context.tabContentController.applyComparisonMode(null, null);
						}).always(function(){ administration.loading(false) })
					});
				}
			},
			'studio.view.staging.revert.all': function(context, data) {
				if(confirm(context.resources.confirmRevertAll)) {
					administration.loading(true);
					context.model.listFragments({
						isStaged: true
					}).then(function(r){
						context.model.revertFragments({
							fragments: r.fragments.map(function(f){
								return {
									instanceIdentifier: f.InstanceIdentifier,
									themeId: f.ThemeId
								};
							})
						}).then(function(){
							messaging.publish('mfw.model.fragment.staging.changed');
							context.tabContentController.applyComparisonMode(null, null);
						}).always(function(){ administration.loading(false) })
					});
				}
			},
			'mfw.view.fragment.delete': function(context, data) {
				administration.loading(true);
				var request = parseFragmentRequestData(data);

				var performDelete = function() {
					administration.loading(true);
					context.model.deleteFragment({
						instanceIdentifier: request.id,
						themeId: request.theme
					}).then(function(r){
						context.stagingView.render(r.stagedFragments);
						context.tabContentController.applyComparisonMode(request, null);
					}).always(function(){ administration.loading(false) })
				};

				context.model.getFragment({
					instanceIdentifier: request.id,
					themeId: request.theme
				}).then(function(targetFragment){
					if(targetFragment && targetFragment.IsStaged) {
						if(confirm(context.resources.confirmStageDelete)) {
							performDelete();
						}
					} else {
						performDelete();
					}
				}).always(function(){ administration.loading(false) });
			},
			'mfw.view.fragment.clone': function(context, data) {
				var request = parseFragmentRequestData(data);
				if(context.developerModeEnabled) {
					context.selectProviderView.prompt(function(result){
						administration.loading(true);
						context.model.cloneFragment({
							instanceIdentifier: request.id,
							themeId: request.theme,
							newInstanceIdentifier: result.id,
							newFactoryDefaultProvider: result.provider
						}).then(function(r){
							context.stagingView.render(r.stagedFragments);
						}).always(function(){ administration.loading(false) })
					});
				} else {
					administration.loading(true);
					context.model.cloneFragment({
						instanceIdentifier: request.id,
						themeId: request.theme
					}).then(function(r){
						context.stagingView.render(r.stagedFragments);
					}).always(function(){ administration.loading(false) })
				}
			},
			'mfw.view.fragment.clone-for-theme': function(context, data) {
				var request = parseFragmentRequestData(data);
				context.model.getFragment({
					instanceIdentifier: request.id,
					themeId: request.theme
				}).then(function(fragment){
					context.selectThemeView.prompt(fragment, function(theme){
						administration.loading(true);
						context.model.createFragmentVariant({
							instanceIdentifier: request.id,
							themeId: request.theme,
							variantThemeId: theme.id
						}).then(function(r){
							context.stagingView.render(r.stagedFragments);
						}).always(function(){ administration.loading(false) })
					});
				});
			},
			'mfw.view.fragment.export': function(context, data) {
				var request = parseFragmentRequestData(data);
				context.exporter.exportFragments([ request ]);
			},
			'mfw.view.resource.export': function(context, data) {
				var request = parseFragmentRequestData(data);
				context.exporter.exportResources([ request ]);
			},
			'mfw.view.fragment.initiate-new-file': function(context, data) {
				var request = parseFragmentRequestData(data);
				context.model.createFragmentAttachment({
					instanceIdentifier: request.id,
					themeId: request.theme
				}).then(function(r){
					var request = {
						id: r.InstanceIdentifier,
						theme: r.ThemeId,
						type: 'attachment',
						attachment: r.Name
					};
					context.temporaryNewItemCache[context.navigator.serialize(request)] =  r;
					context.navigator.request(request);
				});
			},
			'mfw.view.fragment.initiate-upload': function(context, data) {
				context.uploader.upload({ withProgress: true }).then(function(file){
					var request = parseFragmentRequestData(data);
					context.model.saveFragmentAttachment({
						instanceIdentifier: request.id,
						themeId: request.theme,
						name: file.name,
						uploadContext: file.context
					}).then(function(r){
						context.stagingView.render(r.stagedFragments);
						context.navigator.request({
							id: r.savedAttachment.InstanceIdentifier,
							theme: r.savedAttachment.ThemeId,
							type: 'attachment',
							attachment: r.savedAttachment.Name
						});
					});
				});
			},
			'mfw.view.fragment.view-example': function(context, data) {
				var request = parseFragmentRequestData(data);
				context.model.getFragmentExampleInstance({
					instanceIdentifier: request.id,
					themeId: request.theme
				}).then(function(r){
					if(r.ExampleUrl) {
						context.previewingFromWidgetStudio = true;
						global.open(r.ExampleUrl, '_blank');
					} else {
						global.alert(context.resources.noSampleAvailable);
					}
				});
			},
			'mfw.view.fragments.export': function(context, data) {
				if(data.requests) {
					context.exporter.exportFragments(data.requests);
				} else {
					context.exporter.exportAllFragments();
				}
			},
			'mfw.view.fragments.delete': function(context, data) {
				if(data.requests && confirm(context.resources.confirmDeleteFragments)) {
					context.model.deleteFragments({
						fragments: data.requests.map(function(r){
							return {
								instanceIdentifier: r.id,
								themeId: r.theme
							};
						})
					}).then(function() {
						context.tabContentController.applyComparisonMode(null, null);
					});
				}
			},
			'mfw.view.resources.export': function(context, data) {
				if(data.requests) {
					context.exporter.exportResources(data.requests);
				} else {
					context.exporter.exportAllResources();
				}
			},
			'mfw.view.attachment.delete': function(context, data) {
				var request = parseFragmentRequestData(data);
				context.model.deleteFragmentAttachment({
					instanceIdentifier: request.id,
					themeId: request.theme,
					name: request.attachment
				}).then(function(r){
					context.stagingView.render(r.stagedFragments);
				});
			},
			'mfw.view.attachment.restore': function(context, data) {
				var request = parseFragmentRequestData(data);
				context.model.restoreFragmentAttachment({
					instanceIdentifier: request.id,
					themeId: request.theme,
					name: request.attachment
				}).then(function(r){
					// close read-only existing restorable version
					context.tabListController.close(request);
					context.tabContentController.close(request);
					// re-navigate
					context.navigator.request(request);
					// render staging
					context.stagingView.render(r.stagedFragments);
				});
			},
			'mfw.view.manual-save': function(context, data) {
				context.model.flushPendingTasks();
			},
			'mfw.view.fragments.search': function(context, data) {
				context.browseController.focusOnSearch({
					focusedElement: document.activeElement
				});
			},
			'mfw.view.fragment.publish': function(context, data) {
				var currentRequest = context.tabListController.getCurrent();
				messaging.publish('studio.view.staging.publish', currentRequest);
			},
			'mfw.view.fragment.revert': function(context, data) {
				var currentRequest = context.tabListController.getCurrent();
				messaging.publish('studio.view.staging.revert', currentRequest);
			},
			'mfw.view.fragment.preview': function(context, data) {
				var currentRequest = context.tabListController.getCurrent();
				messaging.publish('mfw.view.fragment.view-example', currentRequest);
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
						fragmentId: (currentRequest ? currentRequest.id : null),
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
			$.telligent.evolution.messaging.subscribe(eventName,
				function(data)
			{
				if(data && data.target) {
					$.extend(data, parseDataOptions(data.target));
				}

				if($.telligent.evolution.widgets.manageFragments.LOGGING_ENABLED) {
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
					'ctrl + comma': { message: 'mfw.view.fragments.search', description: context.resources.shortcutSearch },
					'meta + p': { message: 'mfw.view.fragment.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'meta + alt + p': { message: 'mfw.view.fragment.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + alt + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'ctrl + o': { message: 'mfw.view.fragment.preview', description: context.resources.shortcutPreview },
					'ctrl + shift + n': { message: 'studio.view.new', description: context.resources.shortcutNewWidget },
					'ctrl + s': { message: 'mfw.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else {
				combos = {
					'ctrl + comma': { message: 'mfw.view.fragments.search', description: context.resources.shortcutSearch },
					'meta + p': { message: 'mfw.view.fragment.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'meta + shift + p': { message: 'mfw.view.fragment.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + alt + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'ctrl + o': { message: 'mfw.view.fragment.preview', description: context.resources.shortcutPreview },
					'ctrl + shift + n': { message: 'studio.view.new', description: context.resources.shortcutNewWidget },
					'ctrl + s': { message: 'mfw.view.manual-save', description: context.resources.shortcutForceSave }
				}
			}
		} else {
			if(StudioEnvironment.browser.firefox) {
				combos = {
					'alt + comma': { message: 'mfw.view.fragments.search', description: context.resources.shortcutSearch },
					'alt + p': { message: 'mfw.view.fragment.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'alt + shift + p': { message: 'mfw.view.fragment.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + alt + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + o': { message: 'mfw.view.fragment.preview', description: context.resources.shortcutPreview },
					'alt + n': { message: 'studio.view.new', description: context.resources.shortcutNewWidget },
					'ctrl + s': { message: 'mfw.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else if(StudioEnvironment.browser.edge) {
				combos = {
					'alt + comma': { message: 'mfw.view.fragments.search', description: context.resources.shortcutSearch },
					'alt + p': { message: 'mfw.view.fragment.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'alt + shift + p': { message: 'mfw.view.fragment.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + alt + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + o': { message: 'mfw.view.fragment.preview', description: context.resources.shortcutPreview },
					'alt + n': { message: 'studio.view.new', description: context.resources.shortcutNewWidget },
					'ctrl + s': { message: 'mfw.view.manual-save', description: context.resources.shortcutForceSave }
				}
			} else {
				combos = {
					'alt + comma': { message: 'mfw.view.fragments.search', description: context.resources.shortcutSearch },
					'ctrl + p': { message: 'mfw.view.fragment.publish', description: context.resources.shortcutPublish },
					'meta + ctrl + p': { message: 'studio.view.staging.publish.all', description: context.resources.shortcutPublishAll },
					'ctrl + shift + p': { message: 'mfw.view.fragment.revert', description: context.resources.shortcutRevert },
					'meta + ctrl + alt + p': { message: 'studio.view.staging.revert.all', description: context.resources.shortcutRevertAll },
					'alt + o': { message: 'mfw.view.fragment.preview', description: context.resources.shortcutPreview },
					'alt + n': { message: 'studio.view.new', description: context.resources.shortcutNewWidget },
					'ctrl + s': { message: 'mfw.view.manual-save', description: context.resources.shortcutForceSave }
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
			storageNameSpace: 'fragments',
			onLoad: function(key) {
				var request = context.navigator.parse(key);

				if(request.type === 'attachment') {
					return context.model.getFragmentAttachment({
						instanceIdentifier: request.id,
						themeId: request.theme,
						name: request.attachment,
						fallback: true
					}).then(function(model){
						if(model) {
							context.tabContentController.render(request, model);
							context.currentRenderedRequest = request;
							context.dockViewController.setEditorTabState(request);
						}
						return {
							request: request,
							model: model
						};
					});
				// if any other part of the widget, load the full widget
				} else {
					return context.model.getFragment({
						instanceIdentifier: request.id,
						themeId: request.theme
					}).then(function(model){
						if(model) {
							context.tabContentController.render(request, model);
							context.currentRenderedRequest = request;
							context.dockViewController.setEditorTabState(request);
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

		// load currently-staged fragments
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
		if(context.previewingFromWidgetStudio) {
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
			// immeidately re-focus on the editor after showing the documentation
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

		pairs.push('_fid' + "=" + encodeURIComponent(request.id || ''));
		pairs.push('_ftid' + "=" + encodeURIComponent(request.theme || ''));

		if(modelType == 'component' && request.type == 'attachment') {
			pairs.push('_fan' + "=" + encodeURIComponent(request.attachment || ''));
		}

		return pairs.join('&');
	}

	function loadAndRenderStagingView(context) {
		return context.model.listFragments({
			isStaged: true
		}).then(function(r){
			context.stagingView.render(r.fragments);
			return r;
		});
	}

	var Controller = function(options){
		var context = $.extend({}, defaults, options || {});

		// cache of new fragments and attachments that haven't ever yet been saved
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
					container: $.telligent.evolution.administration.panelWrapper()
				});

				// construct inverse mapping of providers
				if (!context.categoriesByProvider) {
					context.categoriesByProvider = {};
					if (context.providerCategories && context.providerCategories.length > 0) {
						for (var category of context.providerCategories) {
							for (var provider of category.Providers) {
								context.categoriesByProvider[provider] = category.Id;
							}
						}
					}
				}

				// set up main content wrapper
				context.panelWrapper = $($.telligent.evolution.template(context.templates.panelWrapperTemplate)({}))
					.appendTo($.telligent.evolution.administration.panelWrapper());

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
				$.telligent.evolution.administration.on('panel.unloaded', function(){
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