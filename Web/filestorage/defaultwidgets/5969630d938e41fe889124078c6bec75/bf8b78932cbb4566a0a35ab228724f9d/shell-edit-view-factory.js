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
		'FragmentOverviewView',
		'StudioCodeEditView',
		'StudioResourcesEditView',
		'StudioFileViewerEditView' ],
	 function(
		FragmentOverviewView,
		StudioCodeEditView,
		StudioResourcesEditView,
		StudioFileViewerEditView,
		$, global, undef)
{

	var defaults = {
		resources: [],
		model: {},
		serializeRequest: function(request, options) {}
	};

	function isEditable(context, attachmentName) {
		if(!attachmentName || attachmentName.length <= 1)
			return false;
		for(var i = 0; i < context.editableExtensions.length; i++) {
			if(attachmentName.indexOf('.' + context.editableExtensions[i], attachmentName.length - ('.' + context.editableExtensions[i]).length) !== -1) {
				return true;
			}
		}
		return false;
	}

	var factory = {
		'overview': function(context, request, options) {
			return new FragmentOverviewView({
				template: $.telligent.evolution.template(context.templates.fragmentOverviewViewTemplate),
				actionsTemplate: $.telligent.evolution.template(context.templates.fragmentActionsTemplate),
				stateTemplate: $.telligent.evolution.template(context.templates.fragmentEditorStateTemplate),
				componentsTemplate: $.telligent.evolution.template(context.templates.fragmentOverviewComponentsViewTemplate),
				versionsTemplate: $.telligent.evolution.template(context.templates.fragmentOverviewVersionsViewTemplate),
				attachmentsTemplate: $.telligent.evolution.template(context.templates.fragmentOverviewAttachmentsViewTemplate),
				fragmentEditorComponentsTemplate: $.telligent.evolution.template(context.templates.fragmentEditorComponentsTemplate),
				detailsTemplate: $.telligent.evolution.template(context.templates.fragmentOverviewViewDetailsTemplate),
				onSearchContexts: function(filter) {
					return context.model.listContexts({
						filter: filter
					});
				},
				onSearchRestScopes: function(filter) {
					return context.model.listRestScopes({
						filter: filter
					});
				},
				resources: context.resources,
				serializeRequest: context.serializeRequest,
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'language': function(context, request, options) {
			return new StudioResourcesEditView({
				selectedTabName: 'Language Resources',
				selectedTab: 'resources',
				stateTemplate: context.templates.fragmentEditorStateTemplate,
				componentsTemplate: context.templates.fragmentEditorComponentsTemplate,
				actionsTemplate: context.templates.fragmentActionsTemplate,
				headerTemplate: context.templates.fragmentEditorHeaderTemplate,
				serializeRequest: context.serializeRequest,
				stateServiceKey: 'mfw.diffwith',
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
					options.container.find('.managed-item-name').text(options.model.ProcessedName);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'attachment': function(context, request, options) {
			if(isEditable(context, request.attachment)) {
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

				return new StudioCodeEditView({
					stateTemplate: context.templates.fragmentEditorStateTemplate,
					componentsTemplate: context.templates.fragmentEditorComponentsTemplate,
					actionsTemplate: context.templates.fragmentActionsTemplate,
					headerTemplate: context.templates.fragmentEditableAttachmentHeaderTemplate,
					description: '',
					selectedTabName: '&nbsp;',
					selectedTab: '',
					mode: 'velocity',
					serializeRequest: context.serializeRequest,
					editorSettings: options.editorSettings,
					getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
					stateServiceKey: 'mfw.diffwith',
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

						var removeAutoComplete = true;
						if((mode == 'velocity' || mode == 'less' || mode == 'jsm') && options.getAutoCompleteSuggestions) {
							removeAutoComplete = false
							if (mode == 'jsm')
								mode = 'javascript';
							editorSettings.autoComplete = function(autocompleteOptions){
								return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.InstanceIdentifier)
									.then(function(results){
										return { results: results };
									});
							};
						}

						$.extend(options.editorSettings, editorSettings);
						if(removeAutoComplete && options.editorSettings.autoComplete)
							options.editorSettings.autoComplete = null;
					},
					onRender: function(options) {
						options.state.modeSelector = options.container.find('select.text-mode');
						options.state.fileNameInput = options.container.find('input.file-name');
						options.state.container = options.container;

						options.state.modeSelector.on('change', function(){
							// update text mode of editor
							var mode = $(this).val();
							var editorSettings = {
								mode: mode,
								autoComplete: function() {
									return $.Deferred(function(){
										results: []
									});
								}
							};

							if((mode == 'velocity' || mode == 'less' || mode == 'jsm') && options.getAutoCompleteSuggestions) {
								if (mode == 'jsm')
									mode = 'javascript';
								editorSettings.autoComplete = function(autocompleteOptions){
									return options.getAutoCompleteSuggestions(mode, autocompleteOptions.prefix, options.model.InstanceIdentifier)
										.then(function(results){
											return { results: results };
										});
								};
							}

							options.updateEditor(editorSettings);

							// update model and register change
							options.raiseChange({ newName: true });
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

						var mode = modes[fileExtension];

						// update delete link
						options.state.container.find('.delete-current-file').attr('data-reqkey', context.serializeRequest({
							id: options.model.InstanceIdentifier,
							attachment: options.model.Name,
							theme: options.model.ThemeId,
							type: 'attachment'
						}));

						// only update the name input val if different and not focused
						var currentName = options.state.fileNameInput.val();
						if(currentName !== fileName && (!options.state.fileNameInput.is(':focus') || options.force)) {
							options.state.fileNameInput.val(fileName);
						}

						options.state.modeSelector.find('option').filter(function() {
							return $(this).text() == fileExtension;
						}).prop('selected', true);
					},
					onCompareRequested: function(variantType) {
						context.onCompareRequested(request, variantType);
					}
				});
			} else {
				return new StudioFileViewerEditView({
					stateTemplate: context.templates.fragmentEditorStateTemplate,
					componentsTemplate: context.templates.fragmentEditorComponentsTemplate,
					actionsTemplate: context.templates.fragmentActionsTemplate,
					headerTemplate: context.templates.fragmentNonEditableFileViewHeaderTemplate,
					serializeRequest: context.serializeRequest,
					exampleTemplate: context.templates.fragmentNonEditableFileViewExampleTemplate,
					stateServiceKey: 'mfw.diffwith',
					onUpdate: function(options) {
						options.container.find('.managed-item-name').text(options.model.FragmentProcessedName);
					},
					onCompareRequested: function(variantType) {
						context.onCompareRequested(request, variantType);
					}
				});

			}
		},
		'configuration': function(context, request, options) {
			return new StudioCodeEditView({
				stateTemplate: context.templates.fragmentEditorStateTemplate,
				componentsTemplate: context.templates.fragmentEditorComponentsTemplate,
				actionsTemplate: context.templates.fragmentActionsTemplate,
				headerTemplate: context.templates.fragmentEditorHeaderTemplate,
				selectedTab: 'configuration',
				selectedTabName: 'Configuration',
				description: context.resources.configurationDesc,
				mode: 'xml',
				serializeRequest: context.serializeRequest,
				editorSettings: options.editorSettings,
				stateServiceKey: 'mfw.diffwith',
				getAutoCompleteSuggestions: function(mode, prefix) {
					return context.getAutoCompleteSuggestions('config', '');
				},
				onGetContent: function(model) {
					return model.ConfigurationXml;
				},
				onGatherChanges: function(model, newContent, state) {
					model.ConfigurationXml = newContent;
				},
				onUpdate: function(options) {
					options.container.find('.managed-item-name').text(options.model.ProcessedName);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'content': function(context, request, options) {
			return new StudioCodeEditView({
				stateTemplate: context.templates.fragmentEditorStateTemplate,
				componentsTemplate: context.templates.fragmentEditorComponentsTemplate,
				actionsTemplate: context.templates.fragmentActionsTemplate,
				headerTemplate: context.templates.fragmentEditorHeaderTemplate,
				selectedTab: 'content',
				selectedTabName: 'Content',
				description: context.resources.contentDesc,
				modeSelector: '.script-language',
				serializeRequest: context.serializeRequest,
				getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
				editorSettings: options.editorSettings,
				stateServiceKey: 'mfw.diffwith',
				onGetContent: function(model) {
					return model.ContentScript;
				},
				onGetMode: function(model) {
					return (!model.ContentScriptLanguage || model.ContentScriptLanguage == 'Unknown' ? 'Velocity' : model.ContentScriptLanguage);
				},
				onGatherChanges: function(model, newContent, state, options, container) {
					model.ContentScript = newContent;
					model.ContentScriptLanguage = container.find('.script-language').val();
				},
				onUpdate: function(options) {
					options.container.find('.managed-item-name').text(options.model.ProcessedName);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'header': function(context, request, options) {
			return new StudioCodeEditView({
				stateTemplate: context.templates.fragmentEditorStateTemplate,
				componentsTemplate: context.templates.fragmentEditorComponentsTemplate,
				actionsTemplate: context.templates.fragmentActionsTemplate,
				headerTemplate: context.templates.fragmentEditorHeaderTemplate,
				selectedTab: 'header',
				selectedTabName: 'Header',
				description: context.resources.headerDesc,
				modeSelector: '.script-language',
				serializeRequest: context.serializeRequest,
				getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
				editorSettings: options.editorSettings,
				stateServiceKey: 'mfw.diffwith',
				onGetContent: function(model) {
					return model.HeaderScript;
				},
				onGetMode: function(model) {
					return (!model.HeaderScriptLanguage || model.HeaderScriptLanguage == 'Unknown' ? 'Velocity' : model.HeaderScriptLanguage);
				},
				onGatherChanges: function(model, newContent, state, options, container) {
					model.HeaderScript = newContent;
					model.HeaderScriptLanguage = container.find('.script-language').val();
				},
				onUpdate: function(options) {
					options.container.find('.managed-item-name').text(options.model.ProcessedName);
				},
				onCompareRequested: function(variantType) {
					context.onCompareRequested(request, variantType);
				}
			});
		},
		'css': function(context, request, options) {
			return new StudioCodeEditView({
				stateTemplate: context.templates.fragmentEditorStateTemplate,
				componentsTemplate: context.templates.fragmentEditorComponentsTemplate,
				actionsTemplate: context.templates.fragmentActionsTemplate,
				headerTemplate: context.templates.fragmentEditorHeaderTemplate,
				selectedTab: 'css',
				selectedTabName: 'CSS Script',
				description: context.resources.cssDesc,
				modeSelector: '.script-language',
				serializeRequest: context.serializeRequest,
				getAutoCompleteSuggestions: context.getAutoCompleteSuggestions,
				editorSettings: options.editorSettings,
				stateServiceKey: 'mfw.diffwith',
				onGetContent: function(model) {
					return model.AdditionalCssScript;
				},
				onGetMode: function(model) {
					return (!model.AdditionalCssScriptLanguage || model.AdditionalCssScriptLanguage == 'Unknown' ? 'Velocity' : model.AdditionalCssScriptLanguage);
				},
				onGatherChanges: function(model, newContent, state, options, container) {
					model.AdditionalCssScript = newContent;
					model.AdditionalCssScriptLanguage = container.find('.script-language').val();
				},
				onUpdate: function(options) {
					options.container.find('.managed-item-name').text(options.model.ProcessedName);
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
