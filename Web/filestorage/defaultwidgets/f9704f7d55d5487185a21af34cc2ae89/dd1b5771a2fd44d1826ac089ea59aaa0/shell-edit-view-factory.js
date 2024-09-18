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
		'AutomationOverviewView',
		'StudioCodeEditView',
		'StudioFileViewerEditView',
		'StudioResourcesEditView'
	],
	 function(
		AutomationOverviewView,
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
			return new AutomationOverviewView({
				template: context.templates.automationOverviewViewTemplate,
				componentsTemplate: context.templates.automationEditorComponentsTemplate,
				actionsTemplate: context.templates.automationActionsTemplate,
				headerTemplate: context.templates.automationConfigurationHeaderTemplate,
				stateTemplate: context.templates.automationEditorStateTemplate,

				editComponentsViewTemplate: context.templates.automationOverviewComponentsViewTemplate,
				filesViewTemplate: context.templates.automationOverviewFilesViewTemplate,
				eventsViewTemplate: context.templates.automationOverviewEventsViewTemplate,
				detailsViewTemplate: context.templates.automationOverviewDetailsViewTemplate,
				triggerSummaryTemplate: context.templates.automationOverviewTriggerSummaryTemplate,

				selectedTab: 'overview',
				selectedTabName: context.resources.overview,
				description: context.resources.overviewDesc,
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,

				resources: context.resources,
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				},
				onSearchEvents: function(query) {
					return context.onSearchEvents(query);
				}
			});
		},
		'configuration': function(context, request, options) {
			//return new StubView('Configuration');
			return new StudioCodeEditView({
				stateTemplate: context.templates.automationEditorStateTemplate,
				componentsTemplate: context.templates.automationEditorComponentsTemplate,
				actionsTemplate: context.templates.automationActionsTemplate,
				headerTemplate: context.templates.automationConfigurationHeaderTemplate,
				selectedTabName: context.resources.configuration,
				description: context.resources.configurationDesc,
				selectedTab: 'configuration',
				mode: 'xml',
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,
				modelIdKey: 'HostId',
				getAutoCompleteSuggestions: function(mode, prefix, id) {
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
					options.container.find('.automation-name').text(options.model.ProcessedName);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'executionscript': function(context, request, options) {
			//return new StubView('Implementation');
			return new StudioCodeEditView({
				stateTemplate: context.templates.automationEditorStateTemplate,
				componentsTemplate: context.templates.automationEditorComponentsTemplate,
				actionsTemplate: context.templates.automationActionsTemplate,
				headerTemplate: context.templates.automationExecutionScriptHeaderTemplate,
				selectedTabName: context.resources.implementation,
				description: context.resources.implementationDesc,
				selectedTab: 'executionscript',
				modeSelector: '.script-language',
				serializeRequest: context.serializeRequest,
				getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
				editorSettings: options.editorSettings,
				stateServiceKey: 'mt.diffwith',
				modelIdKey: 'HostId',
				onGetContent: function(model) {
					return model.ExecutionScript;
				},
				onGetMode: function(model) {
					return (!model.ExecutionScriptLanguage || model.ExecutionScriptLanguage == 'Unknown' ? 'Velocity' : model.ExecutionScriptLanguage);
				},
				onGatherChanges: function(model, newContent, state, options, container) {
					model.ExecutionScript = newContent;
					model.ExecutionScriptLanguage = container.find('.script-language').val();
				},
				onUpdate: function(options) {
					options.container.find('.automation-name').text(options.model.ProcessedName);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'file': function(context, request, options) {
			if(isEditable(context, request.name)) {
				//return new StubView('Editable File');
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
					stateTemplate: context.templates.automationEditorStateTemplate,
					componentsTemplate: context.templates.automationEditorComponentsTemplate,
					actionsTemplate: context.templates.automationActionsTemplate,
					headerTemplate: context.templates.automationEditableFileHeaderTemplate,
					description: context.resources.fileDesc,
					selectedTabName: '&nbsp;',
					selectedTab: '',
					mode: 'velocity',
					serializeRequest: context.serializeRequest,
					editorSettings: options.editorSettings,
					getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
					stateServiceKey: 'mt.diffwith',
					modelIdKey: 'HostId',
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
								return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.HostId)
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
									return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.HostId)
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

						options.container.find('.automation-name').text(options.model.AutomationProcessedName);
					},
					onCompareRequested: function(variantType) {
						context.onCompareRequested(request, variantType);
					}
				});
			} else {
				//return new StubView('Non-Editable File');
				return new StudioFileViewerEditView({
					stateTemplate: context.templates.automationEditorStateTemplate,
					componentsTemplate: context.templates.automationEditorComponentsTemplate,
					actionsTemplate: context.templates.automationActionsTemplate,
					headerTemplate: context.templates.automationNonEditableFileViewHeaderTemplate,
					serializeRequest: context.serializeRequest,
					exampleTemplate: context.templates.automationNonEditableFileViewExampleTemplate,
					stateServiceKey: 'mt.diffwith',
					onUpdate: function(options) {
						options.container.find('.automation-name').text(options.model.AutomationProcessedName);
					},
					onCompareRequested: function(variantType) {
						context.onCompareRequested(request, variantType);
					}
				});
			}
		},
		'resources': function(context, request, options) {
			//return new StubView('Resources');
			return new StudioResourcesEditView({
				selectedTabName: context.resources.resources,
				selectedTab: 'resources',
				stateTemplate: context.templates.automationEditorStateTemplate,
				componentsTemplate: context.templates.automationEditorComponentsTemplate,
				actionsTemplate: context.templates.automationActionsTemplate,
				headerTemplate: context.templates.automationResourcesHeaderTemplate,
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
					options.container.find('.automation-name').text(options.model.ProcessedName);
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

	/*
	class StubView {
		constructor(type) {
			this.type = type;
		}

		render(options) {
			options.container.append(`<div>${options.model.ProcessedName} ${this.type} View</div>`);
		}

		update(model) {}
		show(lineNumber) {}
		hide() {}
		unrender() {}
		updateEditorSettings(settings) {}
		applyBottomMargin(margin) {}
		applyComparisonMode(variantType) {}
	}
	*/

	return EditViewFactory;

}, jQuery, window);
