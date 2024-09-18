/*

EditViewFactory:
	ctor:
		resources
		model
		serializeRequest: function(request, options) {}

methods:
	getInstance(request);

*/
define('EditViewFactory', [
		'ThemeOverviewView',
		'ThemeLayoutsView',
		'ThemeFragmentsView',
		'StudioCodeEditView',
		'StudioFileViewerEditView',
		'StudioResourcesEditView'
	],
	 function(
		ThemeOverviewView,
		ThemeLayoutsView,
		ThemeFragmentsView,
		StudioCodeEditView,
		StudioFileViewerEditView,
		StudioResourcesEditView,
		$, global, undef)
{
	var defaults = {
		resources: [],
		model: {},
		serializeRequest: function(request, options) {}
	};

	function isEditable(context, fileName) {
		if(!fileName || fileName.length <= 1)
			return false;
		for(var i = 0; i < context.editableExtensions.length; i++) {
			if(fileName.indexOf('.' + context.editableExtensions[i], fileName.length - ('.' + context.editableExtensions[i]).length) !== -1) {
				return true;
			}
		}
		return false;
	}

	var factory = {
		'overview': function(context, request, options) {
			return new ThemeOverviewView({
				template: context.templates.themeOverviewViewTemplate,
				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themeConfigurationHeaderTemplate,
				stateTemplate: context.templates.themeEditorStateTemplate,

				editComponentsViewTemplate: context.templates.themeOverviewComponentsViewTemplate,
				filesViewTemplate: context.templates.themeOverviewFilesViewTemplate,
				styleFilesViewTemplate: context.templates.themeOverviewStyleFilesViewTemplate,
				scriptFilesViewTemplate: context.templates.themeOverviewScriptFilesViewTemplate,
				detailsViewTemplate: context.templates.themeOverviewDetailsViewTemplate,

				selectedTab: 'overview',
				selectedTabName: context.resources.overview,
				description: context.resources.overviewDesc,
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,
				onSearchRestScopes: function(filter) {
					return context.model.listRestScopes({
						filter: filter
					});
				},
				resources: context.resources,
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'layouts': function(context, request, options) {
			return new ThemeLayoutsView({
				template: context.templates.themeLayoutsViewTemplate,

				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themeConfigurationHeaderTemplate,
				stateTemplate: context.templates.themeEditorStateTemplate,

				selectedTab: 'layouts',
				selectedTabName: context.resources.layouts,
				description: context.resources.layoutsDesc,
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,

				listTemplate: context.templates.themeLayoutsListViewTemplate,

				onListLayouts: function(options) {
					return context.model.listLayouts(options);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'fragments': function(context, request, options) {
			return new ThemeFragmentsView({
				template: context.templates.themeFragmentsViewTemplate,

				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themeConfigurationHeaderTemplate,
				stateTemplate: context.templates.themeEditorStateTemplate,

				selectedTab: 'fragments',
				selectedTabName: context.resources.fragments,
				description: context.resources.fragmentsDesc,
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,

				listTemplate: context.templates.themeFragmentsListViewTemplate,

				onListFragments: function(options) {
					return context.model.listFragments(options);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'configuration': function(context, request, options) {
			return new StudioCodeEditView({
				stateTemplate: context.templates.themeEditorStateTemplate,
				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themeConfigurationHeaderTemplate,
				selectedTabName: context.resources.configuration,
				description: context.resources.configurationDesc,
				selectedTab: 'configuration',
				mode: 'xml',
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,
				getAutoCompleteSuggestions: function(mode, prefix) {
					return context.getAutoCompleteSuggestions('config', '');
				},
				stateServiceKey: 'mt.diffwith',
				onGetContent: function(model) {
					return model.ConfigurationXml;
				},
				onGatherChanges: function(model, newContent, state) {
					model.ConfigurationXml = newContent;
				},
				onUpdate: function(options) {
					options.container.find('.theme-name').text(options.model.Name);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'headscript': function(context, request, options) {
			return new StudioCodeEditView({
				stateTemplate: context.templates.themeEditorStateTemplate,
				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themeHeadScriptHeaderTemplate,
				selectedTabName: context.resources.headScript,
				description: context.resources.headScriptDesc,
				selectedTab: 'headscript',
				modeSelector: '.script-language',
				serializeRequest: context.serializeRequest,
				getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
				editorSettings: options.editorSettings,
				stateServiceKey: 'mt.diffwith',
				onGetContent: function(model) {
					return model.HeadScript;
				},
				onGetMode: function(model) {
					return (!model.HeadScriptLanguage || model.HeadScriptLanguage == 'Unknown' ? 'Velocity' : model.HeadScriptLanguage);
				},
				onGatherChanges: function(model, newContent, state, options, container) {
					model.HeadScript = newContent;
					model.HeadScriptLanguage = container.find('.script-language').val();
				},
				onUpdate: function(options) {
					options.container.find('.theme-name').text(options.model.Name);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'bodyscript': function(context, request, options) {
			return new StudioCodeEditView({
				stateTemplate: context.templates.themeEditorStateTemplate,
				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themeBodyScriptHeaderTemplate,
				selectedTabName: context.resources.bodyScript,
				description: context.resources.bodyScriptDesc,
				selectedTab: 'bodyscript',
				modeSelector: '.script-language',
				serializeRequest: context.serializeRequest,
				getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
				editorSettings: options.editorSettings,
				stateServiceKey: 'mt.diffwith',
				onGetContent: function(model) {
					return model.BodyScript;
				},
				onGetMode: function(model) {
					return (!model.BodyScriptLanguage || model.BodyScriptLanguage == 'Unknown' ? 'Velocity' : model.BodyScriptLanguage);
				},
				onGatherChanges: function(model, newContent, state, options, container) {
					model.BodyScript = newContent;
					model.BodyScriptLanguage = container.find('.script-language').val();
				},
				onUpdate: function(options) {
					options.container.find('.theme-name').text(options.model.Name);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'palettes': function(context, request, options) {
			return new StudioCodeEditView({
				stateTemplate: context.templates.themeEditorStateTemplate,
				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themePalettesHeaderTemplate,
				selectedTabName: context.resources.palettes,
				description: context.resources.palettesDesc,
				selectedTab: 'palettes',
				mode: 'xml',
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,
				stateServiceKey: 'mt.diffwith',
				getAutoCompleteSuggestions: function(mode, prefix) {
					return context.getAutoCompleteSuggestions('palette', '');
				},
				onGetContent: function(model) {
					return model.PaletteTypesXml;
				},
				onGatherChanges: function(model, newContent, state) {
					model.PaletteTypesXml = newContent;
				},
				onUpdate: function(options) {
					options.container.find('.theme-name').text(options.model.Name);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'style': function(context, request, options) {
			var modes = {
				'css': 'css',
				'less': 'less',
				'vm': 'velocity',
				'velocity': 'vm'
			};

			function constructName(state) {
				return state.fileNameInput.val() + '.' + modes[state.modeSelector.val()];
			}

			function setOptionsVisibility(state) {
				var mode = state.modeSelector.val();
				switch(mode) {
					case 'css':
					case 'less':
						// enable content and option tabs
						state.tabWrapper.show();
						state.contentWrapper.addClass('with-tabs');
						state.header.addClass('with-tabs');
						break;
					case 'velocity':
						// disable options tab
						state.tabWrapper.hide();
						state.contentWrapper.removeClass('with-tabs');
						state.header.removeClass('with-tabs');
						// select content tab
						state.optionsTab.removeClass('selected');
						state.contentTab.addClass('selected');
						state.optionsWrapper.hide();
						state.contentWrapper.show();
						break;
				}
			}

			return new StudioCodeEditView({
				template: context.templates.themeStyleViewTemplate,
				stateTemplate: context.templates.themeEditorStateTemplate,
				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themeStyleHeaderTemplate,
				description: context.resources.styleDesc,
				selectedTabName: '&nbsp;',
				selectedTab: '',
				mode: 'less',
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,
				getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
				stateServiceKey: 'mt.diffwith',
				onGetContent: function(model) {
					return model.Content;
				},
				onGatherChanges: function(model, newContent, state, options) {
					model.Content = newContent;

					if(options.newName) {
						model.NewName = constructName(state);
					}

					model.ApplyToNonModals = state.applyToNonModals.is(':checked');
					model.ApplyToModals = state.applyToModals.is(':checked');
					model.ApplyToAuthorizationRequests = state.applyToAuthorizationRequests.is(':checked');
					model.InternetExplorerMaxVersion = state.internetExplorerMaxVersion.val();
					model.MediaQuery = state.mediaQuery.val();

					switch(state.languageDirection.val()) {
						case 'any':
							model.IsRightToLeft = null;
							break;
						case 'rtl':
							model.IsRightToLeft = true;
							break;
						case 'ltr':
							model.IsRightToLeft = false;
							break;
					}
				},
				onChangeRaised: function(model) {
					delete model.NewName;
				},
				onPreRender: function(options) {
					// update view model prior to render

					var fileExtension, fileName;
					var nameParts = options.model.Name.split('.');
					if(nameParts.length > 1) {
						fileExtension = nameParts[nameParts.length - 1];
					} else {
						fileExtension = 'vm';
					}
					nameParts.pop()
					fileName = nameParts.join('.');

					var mode = modes[fileExtension];

					$.extend(options.viewModel, {
						fileName: fileName,
						fileExtension: fileExtension,
						mode: mode
					});

					// update editor settings prior to render

					var editorSettings = {
						mode: mode,
						line: options.request.line
					};

					if(mode == 'velocity' || mode == 'less' || mode == 'jsm') {
						if (mode == 'jsm')
							mode = 'javascript';
						editorSettings.autoComplete = function(autocompleteOptions){
							return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.Id)
								.then(function(results){
									return { results: results };
								});
						};
					}

					$.extend(options.editorSettings, editorSettings);
				},
				onRender: function(options) {
					options.state.modeSelector = options.container.find('select.text-mode');
					options.state.fileNameInput = options.container.find('input.file-name');
					options.state.container = options.container;

					options.state.modeSelector.on('change', function(){
						// update text mode/autocomplete of editor
						var mode = $(this).val();
						var editorSettings = {
							mode: mode,
							autoComplete: null
						};

						if(mode == 'velocity' || mode == 'less' || mode == 'jsm') {
							if (mode == 'jsm')
								mode = 'javascript';
							editorSettings.autoComplete = function(autocompleteOptions){
								return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.Id)
									.then(function(results){
										return { results: results };
									});
							};
						}

						options.updateEditor(editorSettings);

						setOptionsVisibility(options.state);

						// update model and register change
						options.raiseChange({ newName: true, immediate: true });
					});

					options.state.fileNameInput.on('input', function(){
						if($.trim(options.state.fileNameInput.val() || '').length > 0) {
							// update model and register change
							options.raiseChange({ newName: true });
						}
					});

					// Tabs
					options.state.contentTab = options.container.find('.content-editor-tab.content a');
					options.state.optionsTab = options.container.find('.content-editor-tab.options a');
					options.state.header = options.container.find('.editor-header');
					options.state.tabWrapper = options.container.find('content-editor-tabs');
					options.state.contentWrapper = options.container.find('.editor-content.content');
					options.state.optionsWrapper = options.container.find('.editor-content.options').hide();

					options.state.contentTab.on('click', function(e) {
						options.state.optionsTab.removeClass('selected');
						options.state.contentTab.addClass('selected');
						options.state.optionsWrapper.hide();
						options.state.contentWrapper.show();
						return false;
					});
					options.state.optionsTab.on('click', function(e) {
						options.state.optionsTab.addClass('selected');
						options.state.contentTab.removeClass('selected');
						options.state.contentWrapper.hide();
						options.state.optionsWrapper.show();
						return false;
					});

					// metadata
					options.state.applyToNonModals = options.container.find('input.apply-to-non-modals');
					options.state.applyToModals = options.container.find('input.apply-to-modals');
					options.state.applyToAuthorizationRequests = options.container.find('input.apply-to-oauth');
					options.state.languageDirection = options.container.find('select.language-direction');

					options.state.internetExplorerMaxVersionEnabled = options.container.find('input.apply-to-ie');
					options.state.internetExplorerMaxVersion = options.container.find('input.ie-version');
					options.state.mediaQueryEnabled = options.container.find('input.with-query');
					options.state.mediaQuery = options.container.find('input.media-query');

					// metadata change handling
					options.state.applyToNonModals.on('change', options.raiseChange);
					options.state.applyToModals.on('change', options.raiseChange);
					options.state.applyToAuthorizationRequests.on('change', options.raiseChange);
					options.state.internetExplorerMaxVersion.on('input', options.raiseChange);
					options.state.languageDirection.on('change', options.raiseChange);
					options.state.mediaQuery.on('input', options.raiseChange);
					options.state.internetExplorerMaxVersionEnabled.on('change', function(){
						if($(this).is(':checked')) {
							options.state.internetExplorerMaxVersion.prop('disabled', false);
						} else {
							options.state.internetExplorerMaxVersion.val('');
							options.state.internetExplorerMaxVersion.prop('disabled', true);
							options.raiseChange();
						}
					});
					options.state.mediaQueryEnabled.on('change', function(){
						if($(this).is(':checked')) {
							options.state.mediaQuery.prop('disabled', false);
						} else {
							options.state.mediaQuery.val('');
							options.state.mediaQuery.prop('disabled', true);
							options.raiseChange();
						}
					});

					if(options.model.InternetExplorerMaxVersion) {
						options.state.internetExplorerMaxVersionEnabled.prop('checked', true);
						options.state.internetExplorerMaxVersion.prop('disabled', false);
					} else {
						options.state.internetExplorerMaxVersionEnabled.prop('checked', false);
						options.state.internetExplorerMaxVersion.prop('disabled', true);
					}

					if(options.model.MediaQuery && options.model.MediaQuery.length > 0) {
						options.state.mediaQueryEnabled.prop('checked', true);
						options.state.mediaQuery.prop('disabled', false);
					} else {
						options.state.mediaQueryEnabled.prop('checked', false);
						options.state.mediaQuery.prop('disabled', true);
					}

					setOptionsVisibility(options.state);
				},
				onUnrender: function(options) {
					options.state.contentTab.off('click');
					options.state.optionsTab.off('click');
					options.state.applyToNonModals.off('change');
					options.state.applyToModals.off('change');
					options.state.applyToAuthorizationRequests.off('change');
					options.state.internetExplorerMaxVersion.off('input');
					options.state.internetExplorerMaxVersionEnabled.off('change');
					options.state.mediaQuery.off('input');
					options.state.mediaQueryEnabled.off('change');
					options.state.languageDirection.off('change');
				},
				onUpdate: function(options) {
					var fileExtension, fileName;
					var nameParts = options.model.Name.split('.');
					if(nameParts.length > 1) {
						fileExtension = '.' + nameParts[nameParts.length - 1];
					} else {
						fileExtension = '.vm';
					}
					nameParts.pop();
					fileName = nameParts.join('.');

					// update delete link
					options.state.container.find('.delete-current-file').attr('data-reqkey', context.serializeRequest({
						id: options.model.Id,
						typeId: options.model.TypeId,
						type: 'style',
						name: options.model.Name
					}));

					// only update the name input val if different and not focused
					var currentName = options.state.fileNameInput.val();
					if(currentName !== fileName && (!options.state.fileNameInput.is(':focus') || options.force)) {
						options.state.fileNameInput.val(fileName);
					}

					options.state.modeSelector.find('option').filter(function() {
						return $(this).text() == fileExtension;
					}).prop('selected', true);

					// metadata

					if(options.model.ApplyToNonModals) {
						options.state.applyToNonModals.prop('checked', true);
					} else {
						options.state.applyToNonModals.prop('checked', false);
					}

					if(options.model.ApplyToModals) {
						options.state.applyToModals.prop('checked', true);
					} else {
						options.state.applyToModals.prop('checked', false);
					}

					if(options.model.ApplyToAuthorizationRequests) {
						options.state.applyToAuthorizationRequests.prop('checked', true);
					} else {
						options.state.applyToAuthorizationRequests.prop('checked', false);
					}

					if(!options.state.internetExplorerMaxVersion.is(':focus') || options.force)
						options.state.internetExplorerMaxVersion.val(options.model.InternetExplorerMaxVersion || '');

					if(!options.state.mediaQuery.is(':focus') || options.force)
						options.state.mediaQuery.val(options.model.MediaQuery || '');

					switch (options.model.IsRightToLeft) {
						case true:
							options.state.languageDirection.val('rtl');
							break;
						case false:
							options.state.languageDirection.val('ltr');
							break;
						default:
							options.state.languageDirection.val('any');
							break;
					}

					if(options.model.InternetExplorerMaxVersion) {
						options.state.internetExplorerMaxVersionEnabled.prop('checked', true);
						options.state.internetExplorerMaxVersion.prop('disabled', false);
					} else {
						options.state.internetExplorerMaxVersionEnabled.prop('checked', false);
						options.state.internetExplorerMaxVersion.prop('disabled', true);
					}

					if(options.model.MediaQuery && options.model.MediaQuery.length > 0) {
						options.state.mediaQueryEnabled.prop('checked', true);
						options.state.mediaQuery.prop('disabled', false);
					} else {
						options.state.mediaQueryEnabled.prop('checked', false);
						options.state.mediaQuery.prop('disabled', true);
					}

					options.container.find('.theme-name').text(options.model.ThemeName);
				},
				onDifferencesCompared: function(options) {
					// ApplyToNonModals
					if(options.currentModel.ApplyToNonModals !== options.comparisonModel.ApplyToNonModals)
						options.container.find('.field-item-input.apply-to-non-modals label').addClass('was');
					// ApplyToModals
					if(options.currentModel.ApplyToModals !== options.comparisonModel.ApplyToModals)
						options.container.find('.field-item-input.apply-to-modals label').addClass('was');
					// ApplyToAuthorizationRequests
					if(options.currentModel.ApplyToAuthorizationRequests !== options.comparisonModel.ApplyToAuthorizationRequests)
						options.container.find('.field-item-input.apply-to-oauth label').addClass('was');

					// InternetExplorerMaxVersion
					if(options.currentModel.InternetExplorerMaxVersion !== options.comparisonModel.InternetExplorerMaxVersion) {
						options.container.find('.field-item.apply-to-ie .field-item-description.was').text(options.comparisonModel.InternetExplorerMaxVersion);
						options.container.find('.field-item.apply-to-ie label').addClass('was');
					}

					// MediaQuery
					if(options.currentModel.MediaQuery !== options.comparisonModel.MediaQuery) {
						options.container.find('.field-item.query .field-item-description.was').text(options.comparisonModel.MediaQuery);
						options.container.find('.field-item.query label').addClass('was');
					}

					// IsRightToLeft
					if(options.currentModel.IsRightToLeft !== options.comparisonModel.IsRightToLeft)
						options.container.find('.field-item.language-direction label').addClass('was');
				},
				onDifferencesRemoved: function(options) {
					options.container.find('.field-item-input.apply-to-non-modals label').removeClass('was');
					options.container.find('.field-item-input.apply-to-modals label').removeClass('was');
					options.container.find('.field-item-input.apply-to-oauth label').removeClass('was');
					options.container.find('.field-item.apply-to-ie .field-item-description.was').html('');
					options.container.find('.field-item.query .field-item-description.was').html('');
					options.container.find('.field-item.apply-to-ie label').removeClass('was');
					options.container.find('.field-item.query label').removeClass('was');
					options.container.find('.field-item.language-direction label').removeClass('was');
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'script': function(context, request, options) {
			var modes = {
				'js': 'javascript',
				'javascript': 'js',
				'vm': 'velocity',
				'velocity': 'vm',
				'jsm': 'jsm'
			};

			function constructName(state) {
				return state.fileNameInput.val() + '.' + modes[state.modeSelector.val()];
			}

			return new StudioCodeEditView({
				stateTemplate: context.templates.themeEditorStateTemplate,
				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themeScriptHeaderTemplate,
				description: context.resources.scriptDesc,
				selectedTabName: '&nbsp;',
				selectedTab: '',
				mode: 'javascript',
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,
				getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
				stateServiceKey: 'mt.diffwith',
				onGetContent: function(model) {
					return model.Content;
				},
				onGatherChanges: function(model, newContent, state, options) {
					model.Content = newContent;

					if(options.newName) {
						model.NewName = constructName(state);
					}
				},
				onChangeRaised: function(model) {
					delete model.NewName;
				},
				onPreRender: function(options) {
					// update view model prior to render

					var fileExtension, fileName;
					var nameParts = options.model.Name.split('.');
					if(nameParts.length > 1) {
						fileExtension = nameParts[nameParts.length - 1];
					} else {
						fileExtension = 'vm';
					}
					nameParts.pop()
					fileName = nameParts.join('.');

					var mode = modes[fileExtension];

					$.extend(options.viewModel, {
						fileName: fileName,
						fileExtension: fileExtension,
						mode: mode
					});

					// update editor settings prior to render

					var editorSettings = {
						mode: mode,
						line: options.request.line
					};

					if(mode == 'velocity' || mode == 'less' || mode == 'jsm') {
						if (mode == 'jsm')
							mode = 'javascript';
						editorSettings.autoComplete = function(autocompleteOptions){
							return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.Id)
								.then(function(results){
									return { results: results };
								});
						};
					}

					$.extend(options.editorSettings, editorSettings);

				},
				onRender: function(options) {
					options.state.modeSelector = options.container.find('select.text-mode');
					options.state.fileNameInput = options.container.find('input.file-name');
					options.state.container = options.container;

					options.state.modeSelector.on('change', function(){
						// update text mode/autocomplete of editor
						var mode = $(this).val();
						var editorSettings = {
							mode: mode,
							autoComplete: null
						};

						if(mode == 'velocity' || mode == 'less' || mode == 'jsm') {
							if (mode == 'jsm')
								mode = 'javascript';
							editorSettings.autoComplete = function(autocompleteOptions){
								return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.Id)
									.then(function(results){
										return { results: results };
									});
							};
						}

						options.updateEditor(editorSettings);

						// update model and register change
						options.raiseChange({ newName: true, immediate: true });
					});

					options.state.fileNameInput.on('input', function(){
						if($.trim(options.state.fileNameInput.val() || '').length > 0) {
							// update model and register change
							options.raiseChange({ newName: true });
						}
					});
				},
				onUpdate: function(options) {
					var fileExtension, fileName;
					var nameParts = options.model.Name.split('.');
					if(nameParts.length > 1) {
						fileExtension = '.' + nameParts[nameParts.length - 1];
					} else {
						fileExtension = '.vm';
					}
					nameParts.pop();
					fileName = nameParts.join('.');

					// update delete link
					options.state.container.find('.delete-current-file').attr('data-reqkey', context.serializeRequest({
						id: options.model.Id,
						typeId: options.model.TypeId,
						type: 'script',
						name: options.model.Name
					}));

					// only update the name input val if different and not focused
					var currentName = options.state.fileNameInput.val();
					if(currentName !== fileName && (!options.state.fileNameInput.is(':focus') || options.force)) {
						options.state.fileNameInput.val(fileName);
					}

					options.state.modeSelector.find('option').filter(function() {
						return $(this).text() == fileExtension;
					}).prop('selected', true);

					options.container.find('.theme-name').text(options.model.ThemeName);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'file': function(context, request, options) {
			if(isEditable(context, request.name)) {

				var modes = {
					'css': 'css',
					'less': 'less',
					'html': 'html',
					'js': 'javascript',
					'javascript': 'js',
					'vm': 'velocity',
					'velocity': 'vm',
					'xml': 'xml',
					'jsm': 'jsm'
				};

				function constructName(state) {
					return state.fileNameInput.val() + '.' + modes[state.modeSelector.val()];
				}

				function setFileActionVisibility(state) {
					state.fileActions.uilinks('remove', state.convertToStyleLink);
					state.fileActions.uilinks('remove', state.convertToScriptLink);
					var mode = state.modeSelector.val();
					switch(mode) {
						case 'css':
						case 'less':
							state.fileActions.uilinks('insert', state.convertToStyleLink, 0);
							break;
						case 'javascript':
							state.fileActions.uilinks('insert', state.convertToScriptLink, 0);
							break;
					}
				}

				return new StudioCodeEditView({
					stateTemplate: context.templates.themeEditorStateTemplate,
					componentsTemplate: context.templates.themeEditorComponentsTemplate,
					actionsTemplate: context.templates.themeActionsTemplate,
					headerTemplate: context.templates.themeEditableFileHeaderTemplate,
					description: context.resources.fileDesc,
					selectedTabName: '&nbsp;',
					selectedTab: '',
					mode: 'velocity',
					serializeRequest: context.serializeRequest,
					editorSettings: options.editorSettings,
					getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
					stateServiceKey: 'mt.diffwith',
					onGetContent: function(model) {
						return model.Content;
					},
					onGatherChanges: function(model, newContent, state, options) {
						model.Content = newContent;

						if(options.newName) {
							model.NewName = constructName(state);
						}
					},
					onChangeRaised: function(model) {
						delete model.NewName;
					},
					onPreRender: function(options) {
						// update view model prior to render

						var fileExtension, fileName;
						var nameParts = options.model.Name.split('.');
						if(nameParts.length > 1) {
							fileExtension = nameParts[nameParts.length - 1];
						} else {
							fileExtension = 'vm';
						}
						nameParts.pop()
						fileName = nameParts.join('.');

						var mode = modes[fileExtension];

						$.extend(options.viewModel, {
							fileName: fileName,
							fileExtension: fileExtension,
							mode: mode
						});

						// update editor settings prior to render

						var editorSettings = {
							mode: mode,
							line: options.request.line
						};
						if((mode == 'velocity' || mode == 'less' || mode == 'jsm') && options.getAutoCompleteSuggestions) {
							if (mode == 'jsm')
								mode = 'javascript';
							editorSettings.autoComplete = function(autocompleteOptions){
								return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.Id)
									.then(function(results){
										return { results: results };
									});
							};
						}

						$.extend(options.editorSettings, editorSettings);
					},
					onRender: function(options) {
						options.state.modeSelector = options.container.find('select.text-mode');
						options.state.fileNameInput = options.container.find('input.file-name');
						options.state.fileActions = options.container.find('.file-actions');
						options.state.convertToStyleLink = options.container.find('a.convert-to-style');
						options.state.convertToScriptLink = options.container.find('a.convert-to-script');
						options.state.container = options.container;

						options.state.modeSelector.on('change', function(){

							// update text mode/autocomplete of editor
							var mode = $(this).val();
							var editorSettings = {
								mode: mode,
								autoComplete: null
							};

							if(mode == 'velocity' || mode == 'less' || mode == 'jsm') {
								if (mode == 'jsm')
									mode = 'javascript';
								editorSettings.autoComplete = function(autocompleteOptions){
									return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.Id)
										.then(function(results){
											return { results: results };
										});
								};
							}

							options.updateEditor(editorSettings);

							setFileActionVisibility(options.state);

							// update model and register change
							options.raiseChange({ newName: true, immediate: true });
						});

						options.state.fileNameInput.on('input', function(){
							if($.trim(options.state.fileNameInput.val() || '').length > 0) {
								// update model and register change
								options.raiseChange({ newName: true });
							}
						});

						setFileActionVisibility(options.state);
					},
					onUpdate: function(options) {
						var fileExtension, fileName;
						var nameParts = options.model.Name.split('.');
						if(nameParts.length > 1) {
							fileExtension = '.' + nameParts[nameParts.length - 1];
						} else {
							fileExtension = '.vm';
						}
						nameParts.pop();
						fileName = nameParts.join('.');

						// update delete link
						options.state.container.find('.delete-current-file').attr('data-reqkey', context.serializeRequest({
							id: options.model.Id,
							typeId: options.model.TypeId,
							type: 'file',
							name: options.model.Name
						}));

						// only update the name input val if different and not focused
						var currentName = options.state.fileNameInput.val();
						if(currentName !== fileName && (!options.state.fileNameInput.is(':focus') || options.force)) {
							options.state.fileNameInput.val(fileName);
						}

						options.state.modeSelector.find('option').filter(function() {
							return $(this).text() == fileExtension;
						}).prop('selected', true);

						options.container.find('.theme-name').text(options.model.ThemeName);
					},
					onCompareRequested: function(variantType) {
						context.onCompareRequested(request, variantType);
					}
				});
			} else {
				return new StudioFileViewerEditView({
					stateTemplate: context.templates.themeEditorStateTemplate,
					componentsTemplate: context.templates.themeEditorComponentsTemplate,
					actionsTemplate: context.templates.themeActionsTemplate,
					headerTemplate: context.templates.themeNonEditableFileViewHeaderTemplate,
					serializeRequest: context.serializeRequest,
					exampleTemplate: context.templates.themeNonEditableFileViewExampleTemplate,
					stateServiceKey: 'mt.diffwith',
					onUpdate: function(options) {
						options.container.find('.theme-name').text(options.model.ThemeName);
					},
					onCompareRequested: function(variantType) {
						context.onCompareRequested(request, variantType);
					}
				});
			}
		},
		'resources': function(context, request, options) {
			return new StudioResourcesEditView({
				selectedTabName: context.resources.resources,
				selectedTab: 'resources',
				stateTemplate: context.templates.themeEditorStateTemplate,
				componentsTemplate: context.templates.themeEditorComponentsTemplate,
				actionsTemplate: context.templates.themeActionsTemplate,
				headerTemplate: context.templates.themeResourcesHeaderTemplate,
				serializeRequest: context.serializeRequest,
				description: context.resources.resourcesDesc,
				stateServiceKey: 'mt.diffwith',
				onGetResources: function(model) {
					return model.Resources;
				},
				onGatherChanges: function(model, serializedResources) {
					model.ResourcesToSave = serializedResources;
				},
				onChangeRaised: function(model) {
					delete model.ResourcesToSave;
				},
				onUpdate: function(options) {
					options.container.find('.theme-name').text(options.model.Name);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		}
	};

	var EditViewFactory = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			getInstance: function(request, options) {
				if(!request)
					return null;

				var view = factory[request.type];
				if(!view)
					return null;

				return view(context, request, options);
			}
		}
	};

	return EditViewFactory;

}, jQuery, window);
