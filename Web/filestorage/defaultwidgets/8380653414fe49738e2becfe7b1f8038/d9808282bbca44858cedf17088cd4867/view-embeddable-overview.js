/*
EmbeddableOverviewView

Raises Messages:

	studio.view.staging.publish
	studio.view.staging.revert

Methods
	// constructor
	// 		onSearchContexts
	// 		onSearchRestScopes

	// options:
	// 		request
	// 		container
	// 		model
	//		changed(model)
	//		willSave: function() {
	// 		serializeRequest: function(request, options) {}
	render: function(options)

	unrender: function()

	// options
	// 		model
	update: function(options)
	hide: function()
	show: function()

	onSearchEvents: function(query)
*/
define('EmbeddableOverviewView', ['StudioUtility'], function(util, $, global, undef) {

	var defaults = {
		container: null,
		template: null,
		headerTemplate: null,
		actionsTemplate: null,
		stateTemplate: null,
		componentsTemplate: null,
		versionsTemplate: null,
		filesViewTemplate: null,
		eventsViewTemplate: null,
		detailsTemplate: null,
		fragmentEditorComponentsTemplate: null,
		onSearchContexts: function(filter) {},
		serializeRequest: function (request, options) { },
		onSearchRestScopes: function (filter) { },
		description: 'test description',

	};

	var ALL_SUPPORTED_CONTENT_TYPES = 'all';
	var CUSTOM_SUPPORTED_CONTENT_TYPES = 'custom';

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function parseUnit(input, min) {
		if(!input)
			return min;
		var parsed = parseInt(input.val(), 10);
		if (!parsed || parsed < min)
			return min;
		return parsed;
	}

	function raiseChange(context, immediately) {
		if(context.willSave) {
			context.willSave();
		}

		context.model.Name = context.name.val();
		context.model.Description = context.description.val();
		context.model.Category = context.category.val();
		context.model.IsCacheable = context.isCacheable.is(':checked');
		context.model.VaryCacheByUser = context.varyCache.is(':checked');
		context.model.SupportedContentTypesScopeToSave = context.supportedContentTypesScope.val();
		context.model.SupportedContentTypesToSave = context.supportedContentTypes.filter(':checked').map(function(){
			return $(this).val();
		}).get().join();

		var selectedRestScopes = $.grep(context.restScopes.val().split(','), function (s) {
			return s && $.trim(s);
		}).map(function (s) { return { Id: s } });
		context.model.RestScopes = selectedRestScopes;

		context.changed(context.model, immediately).then(function(){

		});
	}

	function handleChanges(context) {
		var raiseImmediateChange = function() {
			raiseChange(context, true);
		};

		context.name.on('input', function(){ raiseChange(context); });
		context.description.on('input', function(){ raiseChange(context); });
		context.category.on('input', function(){ raiseChange(context); });
		context.isCacheable.on('change', function(){ raiseChange(context, true); });
		context.varyCache.on('change', function(){ raiseChange(context, true); });
		context.supportedContentTypesScope.on('change', function(){ raiseChange(context, true); });
		context.supportedContentTypes.on('change', function(){ raiseChange(context, true); });
		context.restScopes.on('change', function(){ raiseChange(context, true); });
	}

	function initTokenEditor(editor, raw, processed, force) {
		var context = $(editor).data('_token_editor_context');
		if(!context) {
			context = {
				rawElement: editor.find('.raw'),
				processedElement: editor.find('.processed'),
				rawValue: (raw || editor.find('.raw').val()),
				processedValue: (processed || editor.find('.processed').text())
			};
			$(editor).data('_token_editor_context', context);

			context.processedElement.on('click', function(){
				context.processedElement.hide();
				context.rawElement.show().trigger('focus');
			});
			context.rawElement.on('blur', function(){
				var value = $.trim(context.rawElement.val());
				if(value == $.trim(context.rawValue)) {
					context.processedElement.text(context.processedValue);
					context.processedElement.show();
					context.rawElement.hide();
				}
			});
		}

		context.rawValue = raw;
		context.processedValue = processed;
		context.processedElement.text(processed);

		if(!context.rawElement.is(':focus') || force) {
			context.rawElement.val(raw);
			context.processedElement.show();
			context.rawElement.hide();
		}
	}

	function focusOnTokenEditor(editor) {
		var context = $(editor).data('_token_editor_context');
		if(context) {
			context.processedElement.hide();
		}
	}

	function logicallyShowContentTypeWarningMessage(context) {
		if (context.model.SupportedContentTypes == null ||
			context.model.SupportedContentTypes.filter(function(c) { return c.Supported; }).length == 0)
		{
			context.supportedContentTypesWarningMessage.show();
		} else {
			context.supportedContentTypesWarningMessage.hide();
		}
	}

	function renderCurrentRestScopes(context) {
		// don't re-render if currently focused
		// unfortunately using a private way of finding the actual input within the glow text box
		var input = getGlowLookupTextBoxInput(context.restScopes);
		if(input.is(':focus')) {
			return;
		}

		// clear any current selections
		var count = context.restScopes.glowLookUpTextBox('count');
		for(var i = 0; i < count; i++) {
			var removed = context.restScopes.glowLookUpTextBox('removeByIndex', 0);
		}

		// add items corresponding to current model's rest scopes
		for(var i = 0; i < context.model.RestScopes.length; i++) {
			var restScope = context.model.RestScopes[i];
			var renderedRestscope = context.restScopes.glowLookUpTextBox('createLookUp',
				restScope.Id,
				restScope.Name,
				restScope.Name,
				true);
			context.restScopes.glowLookUpTextBox('add', renderedRestscope);
		}
	}

	function initUi(context) {
		var viewModel = $.extend({}, context.model, {
			requestKey: context.serializeRequest(context.request),
			description: context.description
		});

		context.container.empty().append(context.template(viewModel));
		context.headerContainer = context.container.find('.template-editor-header');
		context.headerContainer.append(context.headerTemplate(viewModel))
		context.stateContainer = context.container.find('.template-editor-state');
		context.componentsContainer = context.container.find('.template-editor-components');
		context.actionsContainer = context.container.find('.template-editor-actions');
		context.restScopes = context.container.find('.field-item.rest-scopes .rest-scopes');
		initRestScopesEditor(context);

		// render actions
		var renderedActions = context.actionsTemplate(viewModel);
		context.actionsContainer.empty().append(renderedActions);
		attemptToRenderCurrentRestScopes(context);

		// render state...
		context.stateContainer.empty().append(context.stateTemplate(context.model))

		// render components
		context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, context.model,{
			selected: context.selectedTab,
			selectedTabName: context.selectedTabName
		})));


		context.name = context.container.find('input.name');
		context.description = context.container.find('input.description');
		context.category = context.container.find('input.category');

		context.isCacheable = context.container.find('input.is-cacheable');
		context.varyCache = context.container.find('input.vary-cache');

		context.nameTokenEditor = context.container.find('.field-item-input.name .token-editor');
		context.descriptionTokenEditor = context.container.find('.field-item-input.description .token-editor');
		context.categoryTokenEditor = context.container.find('.field-item-input.category .token-editor');

		context.editorComponentsContainer = context.container.find('.components .embeddable-components');
		context.filesContainer = context.container.find('.components .embeddable-files');
		context.details = context.container.find('.content.details');

		context.supportedContentTypesScope = context.container.find('select.supported-content-types-scope');
		context.supportedContentTypes = context.container.find('input.supported-content-types');
		context.supportedContentTypesWrapper = context.container.find('li.supported-content-types');
		// visibility
		context.supportedContentTypesScope.on('change', function() {
			if (context.supportedContentTypesScope.val() === ALL_SUPPORTED_CONTENT_TYPES) {
				context.supportedContentTypesWrapper.slideUp(250);
			} else {
				context.supportedContentTypesWrapper.slideDown(250);
			}
		})
		if (context.supportedContentTypesScope.val() !== ALL_SUPPORTED_CONTENT_TYPES) {
			context.supportedContentTypesWrapper.show();
		} else {
			context.supportedContentTypesWrapper.hide();
		}

		context.supportedContentTypesWarningMessage = context.container.find('.supported-content-types-warning');
		logicallyShowContentTypeWarningMessage(context);

		context.stateLabels = context.container.find('.editor-state');
		context.editorContainer = context.container.find('.editor-content');

		context.stateContainer.on('click', 'a.compare', function(e){
			e.preventDefault();
			var link = $(e.target);
			var variantType = link.data('varianttype');
			if(context.comparison != variantType) {
				context.onCompareRequested(variantType);
			} else {
				context.onCompareRequested(null);
			}
			return false;
		});

		initTokenEditor(context.nameTokenEditor,
			context.model.Name,
			context.model.ProcessedName);

		initTokenEditor(context.descriptionTokenEditor,
			context.model.Description,
			context.model.ProcessedDescription);

		initTokenEditor(context.categoryTokenEditor,
			context.model.Category,
			context.model.ProcessedCategory);
	}

	function compareWith(context, variantType) {
		removeDifference(context);
		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.comparison = variantType;

		$.telligent.evolution.administration.loading(true);
		context.loadVariant('staged', true).then(function(stagedRevision){
			context.loadVariant(variantType, true).then(function(r){
				$.telligent.evolution.administration.loading(false);
				if(variantType != context.comparison)
					return;
				compareAndRenderDifferences(context, stagedRevision, r);
			});
		});

		var activatingLink = context.stateContainer.find('a.compare[data-varianttype="' + variantType + '"]');
		activatingLink.text(activatingLink.data('hidelabel'));
		if(context.editorContainer.filter('.editor-content').is(':visible')) {
			context.stateLabels.show();
			context.stateLabels.find('.from').text(activatingLink.data('fromlabel'));
			context.stateLabels.find('.to').text(activatingLink.data('tolabel'));
		}
	}

	function unCompareWith(context) {
		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.stateContainer.find('.state-labels').hide();
		removeDifference(context);
		context.comparison = false;
	}

	function attemptToRenderCurrentRestScopes(context){
		var restScopesContainer = getGlowLookupTextBoxContainer(context.restScopes);
		if(restScopesContainer.length == 0 || !restScopesContainer.get(0).offsetHeight) {
			setTimeout(function(){
				attemptToRenderCurrentRestScopes(context);
			}, 20)
		} else {
			renderCurrentRestScopes(context);
		}
	}

	function resourcesAreSame(modelA, modelB) {
		// shortcuts
		if(modelA == null && modelB == null)
			return true;
		if(modelA == null || modelB == null)
			return false;
		if(modelA.Resources == null && modelB.Resources == null)
			return true;
		if(modelA.Resources == null || modelB.Resources == null)
			return false;
		if(modelA.Resources.length != modelB.Resources.length)
			return false;

		// build sorted arrays of serialized resources for quick comparison
		resourcesA = [];
		resourcesB = [];
		for(var i = 0; i < modelA.Resources.length; i++) {
			resourcesA.push(modelA.Resources[i].Language + ':' + modelA.Resources[i].Name + ':' + modelA.Resources[i].Value);
			resourcesB.push(modelB.Resources[i].Language + ':' + modelB.Resources[i].Name + ':' + modelB.Resources[i].Value);
		}
		resourcesA.sort();
		resourcesB.sort();

		// compare arrays
		for(var i = 0 ; i < resourcesA.length; i++) {
			if(resourcesA[i] != resourcesB[i])
				return false;
		}

		return true;
	}

	function findFile (files, name) {
		if (!files)
			return null;
		var filteredFiles = files.filter(function(f) {
			return f.Name == name;
		});
		return filteredFiles.length > 0 ? filteredFiles[0] : null;
	}

	function diffableValue(value, context) {
		if (!value || $.trim(value).length == 0)
			return context.resources.diffEmpty;
		return value;
	}

	function compareAndRenderDifferences(context, currentModel, variantModel) {
		// name
		if (util.normalize(currentModel.Name || '') !== util.normalize(variantModel.Name || '&nbsp;'))
			context.container.find('.field-item.name .was').text(diffableValue(variantModel.ProcessedName, context));
		// description
		if (util.normalize(currentModel.Description || '') !== util.normalize(variantModel.Description || '&nbsp;'))
			context.container.find('.field-item.description .was').text(diffableValue(variantModel.ProcessedDescription, context));
		// category
		if (util.normalize(currentModel.Category || '') !== util.normalize(variantModel.Category || '&nbsp;'))
			context.container.find('.field-item.category .was').text(diffableValue(variantModel.ProcessedCategory, context));

		// IsCacheable
		if(currentModel.IsCacheable !== variantModel.IsCacheable)
			context.container.find('.field-item-input.IsCacheable label').addClass('was');
		// VaryCacheByUser
		if(currentModel.VaryCacheByUser !== variantModel.VaryCacheByUser)
			context.container.find('.field-item-input.VaryCacheByUser label').addClass('was');

		// scopes
		var currentRestScopes = (currentModel.RestScopes || []).map(function (s) { return s.Id }).sort();
		var variantRestScopes = (variantModel.RestScopes || []).map(function (s) { return s.Id }).sort();
		var restScopesDiffer = false;
		if(currentRestScopes.length !== variantRestScopes.length) {
			restScopesDiffer = true;
		} else {
			for(var i = 0; i < currentRestScopes.length; i++) {
				if(currentRestScopes[i] !== variantRestScopes[i]) {
					restScopesDiffer = true;
					break;
				}
			}
		}
		if(restScopesDiffer) {
			context.container.find('.field-item.rest-scopes .was').html(
				diffableValue(variantModel.RestScopes.map(function (scope) {
					return scope.Name;
				}).sort().join(', '), context));
		}

		if(util.normalize(currentModel.ContentScript || '') !== util.normalize(variantModel.ContentScript || ''))
			context.container.find('.embeddable-components .embeddable-component-link.contentscript').addClass('was');
		if(util.normalize(currentModel.ConfigurationXml || '') !== util.normalize(variantModel.ConfigurationXml || ''))
			context.container.find('.embeddable-components .embeddable-component-link.configuration').addClass('was');
		if(!resourcesAreSame(currentModel, variantModel))
			context.container.find('.embeddable-components .embeddable-component-link.resources').addClass('was');

		context.supportedContentTypesWrapper.show();
		if(
			(currentModel.SupportedContentTypes == null && variantModel.SupportedContentTypes != null) ||
			(currentModel.SupportedContentTypes != null && variantModel.SupportedContentTypes == null) ||
			(currentModel.SupportedContentTypes != null && currentModel.SupportedContentTypes.length != variantModel.SupportedContentTypes.length) ||
			((currentModel.SupportedContentTypes || []).filter(function(c){ return c.Supported }).map(function(c) { return c.TypeId; }).join() != (variantModel.SupportedContentTypes || []).filter(function(c){ return c.Supported }).map(function(c) { return c.TypeId; }).join())
		)
		{
			context.container.find('.field-item.supported-content-types-scope label').addClass('was');
			var difference = (variantModel.SupportedContentTypes || [])
				.filter(function(c){ return c.Supported })
				.map(function(c) { return c.Name; })
				.join(', ');
			context.container.find('.field-item.supported-content-types-scope .field-item-description.was').text(difference)
		}

		// temporary rendered versions variant files
		var renderedVariantFiles = $('<div>' + context.filesViewTemplate(variantModel) + '</div>');

		// files
		$.each(currentModel.Files, function(i, file) {
			var variantFile = findFile(variantModel.Files, file.Name);
			if (!variantFile || file.Digest !== variantFile.Digest)
				context.container.find('.embeddable-files .file[data-name="' + file.Name + '"]').addClass('was');
		});
		// deleted
		var fileList = context.container.find('.embeddable-files ul').first();
		$.each(variantModel.Files, function(i, file) {
			var currentFile = findFile(currentModel.Files, file.Name);
			if (!currentFile) {
				var deletedLink = renderedVariantFiles.find('.file[data-name="' + file.Name + '"]').addClass('was deleted');
				deletedLink.attr('data-tip', deletedLink.attr('data-tip') + '  (' + context.resources.deleted + ')');
				deletedLink.closest('li').prependTo(fileList);
			}
		});

		// preview
		if(currentModel.PreviewImageDigest !== variantModel.PreviewImageDigest) {
			context.container.find('.field-item.preview').addClass('was');
			if (variantModel.PreviewImageUrl) {
				context.container.find('.field-item.preview .was').empty().append(
					$.telligent.evolution.template.compile(
						'<div class="ui-viewhtml" data-width="320" data-height="240" data-url="<%: PreviewImageUrl %>"></div>')(variantModel));
			}
		}

		// icon
		if(currentModel.IconImageDigest !== variantModel.IconImageDigest) {
			context.container.find('.field-item.icon').addClass('was');
			if (variantModel.IconImageUrl) {
				context.container.find('.field-item.icon .was').empty().append(
					$.telligent.evolution.template.compile(
						'<div class="ui-viewhtml" data-width="320" data-height="240" data-url="<%: IconImageUrl %>"></div>')(variantModel));
			}
		}
	}

	function removeDifference(context) {
		// name
		context.container.find('.field-item.name .was').html('');
		// description
		context.container.find('.field-item.description .was').html('');
		// category
		context.container.find('.field-item.category .was').html('');

		// IsCacheable
		context.container.find('.field-item-input.IsCacheable label').removeClass('was');
		// VaryCacheByUser
		context.container.find('.field-item-input.VaryCacheByUser label').removeClass('was');
		// rest scopes
		context.container.find('.field-item.rest-scopes .was').html('');

		context.container.find('.embeddable-components .embeddable-component-link.contentscript').removeClass('was');
		context.container.find('.embeddable-components .embeddable-component-link.configuration').removeClass('was');
		context.container.find('.embeddable-components .embeddable-component-link.resources').removeClass('was');

		context.container.find('.embeddable-files .file.was.deleted').remove();
		context.container.find('.embeddable-files .file').removeClass('was');

		context.container.find('.field-item.preview').removeClass('was');
		context.container.find('.field-item.preview .was').empty();

		context.container.find('.field-item.icon').removeClass('was');
		context.container.find('.field-item.icon .was').empty();

		context.container.find('.field-item.supported-content-types-scope label').removeClass('was');
		context.container.find('.field-item.supported-content-types-scope .field-item-description.was').empty();

		if (context.supportedContentTypesScope.val() !== ALL_SUPPORTED_CONTENT_TYPES) {
			context.supportedContentTypesWrapper.show();
		} else {
			context.supportedContentTypesWrapper.hide();
		}
	}

	function initRestScopesEditor(context) {
		context.restScopes.glowLookUpTextBox({
			delimiter: ',',
			allowDuplicates: false,
			onGetLookUps: function(textbox, searchText) {
				if(searchText && searchText.length >= 1) {
					textbox.glowLookUpTextBox('updateSuggestions', [
						textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
					]);
					context.currentScopeSearchText = searchText;

					context.onSearchRestScopes(searchText).then(function(response){
						if (searchText != context.currentScopeSearchText) {
							return;
						}

						var hasResults = false;
						if (response && response.scopes.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								response.scopes.map(function(result, i) {
									try {
										lookup = textbox.glowLookUpTextBox(
											'createLookUp',
											result.Id,
											result.Name,
											result.Name,
											true);

										hasResults = true;
										return lookup;
									} catch (e) {}
								}));
						}

						if (!hasResults) {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', context.resources.noRestScopesFound, context.resources.noRestScopesFound, false)
							]);
						}
					});

				}
			},
			emptyHtml: '',
			selectedLookUpsHtml: [],
			deleteImageUrl: ''
		})
		.on('glowLookUpTextBoxChange', function(){
			context.restScopes.trigger('change');
		});
	}

	function getGlowLookupTextBoxInput(selection) {
		return selection.closest('.field-item').find('.glow-lookuptextbox input[type="text"]').first();
	}

	function getGlowLookupTextBoxContainer(selection) {
		return selection.closest('.field-item').find('.glow-lookuptextbox');
	}

	var EmbeddableOverviewView = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			// options:
			// 		request
			// 		container
			// 		model
			//		changed(model)
			render: function(options) {
				$.extend(context, options);

				context.template = $.telligent.evolution.template(context.template);
				context.headerTemplate = $.telligent.evolution.template(context.headerTemplate);
				context.actionsTemplate = $.telligent.evolution.template(context.actionsTemplate);
				context.componentsTemplate = $.telligent.evolution.template(context.componentsTemplate);
				context.stateTemplate = $.telligent.evolution.template(context.stateTemplate);

				context.editComponentsViewTemplate = $.telligent.evolution.template(context.editComponentsViewTemplate);
				context.filesViewTemplate = $.telligent.evolution.template(context.filesViewTemplate);
				context.eventsViewTemplate = $.telligent.evolution.template(context.eventsViewTemplate);
				context.detailsViewTemplate = $.telligent.evolution.template(context.detailsViewTemplate);

				initUi(context);
				handleChanges(context);
			},
			unrender: function() {
			},
			hide: function() {
				// restore comparison mode class if comparing at time of hide
				if(context.comparison) {
					$.telligent.evolution.administration.panelWrapper().addClass('comparing');
				}
			},
			show: function() {
				// hide comparison mode class since has no purpose in this view
				$.telligent.evolution.administration.panelWrapper().removeClass('comparing');
			},
			// options
			// 		model
			// 		force: true|false (when true, updates even if focused)
			update: function(options) {
				initTokenEditor(context.nameTokenEditor,
					context.model.Name,
					context.model.ProcessedName,
					options.force);

				initTokenEditor(context.descriptionTokenEditor,
					context.model.Description,
					context.model.ProcessedDescription,
					options.force);

				initTokenEditor(context.categoryTokenEditor,
					context.model.Category,
					context.model.ProcessedCategory,
					options.force);

				context.supportedContentTypes.prop('checked', false);
				if (context.model.SupportedContentTypes == null) {
					context.supportedContentTypesScope.val(ALL_SUPPORTED_CONTENT_TYPES);
					context.supportedContentTypesWrapper.hide();
				} else {
					context.supportedContentTypesWrapper.show();
					context.supportedContentTypesScope.val(CUSTOM_SUPPORTED_CONTENT_TYPES);
					context.model.SupportedContentTypes.forEach(function(c) {
						if (c.Supported) {
							context.supportedContentTypes.filter('[value="' + c.TypeId + '"]').prop('checked', true);
						}
					});
				}

				// render actions
				var renderedActions = context.actionsTemplate($.extend({}, options.model, {
					requestKey: context.serializeRequest(context.request)
				}));
				context.actionsContainer.empty().append(renderedActions);

				// render state...
				context.stateContainer.empty().append(context.stateTemplate(options.model))

				// render components
				context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, options.model,{
					selected: context.selectedTab,
					selectedTabName: context.selectedTabName
				})));

				if(context.model.IsCacheable) {
					context.isCacheable.prop('checked', true);
				} else {
					context.isCacheable.prop('checked', false);
				}

				if(context.model.VaryCacheByUser) {
					context.varyCache.prop('checked', true);
				} else {
					context.varyCache.prop('checked', false);
				}

				// update actions
				context.actionsContainer.empty().append(context.actionsTemplate(
					$.extend({}, options.model, {
						requestKey: context.serializeRequest(context.request)
					})
				));

				if(!context.name.is(':focus') || options.force)
					context.name.val(options.model.Name);
				if(!context.description.is(':focus') || options.force)
					context.description.val(options.model.Description);
				if(!context.category.is(':focus') || options.force)
					context.category.val(options.model.Category);

				// update rest scopes
				renderCurrentRestScopes(context);

				// update events

				context.editorComponentsContainer.empty().append(context.editComponentsViewTemplate(context.model));
				context.filesContainer.empty().append(context.filesViewTemplate(context.model));

				context.container.find('.embeddable-name').text(options.model.ProcessedName);

				var newPreview = $(context.template($.extend({}, options.model, {
					requestKey: context.serializeRequest(context.request),
					description: context.description
				}))).find('.field-item.preview').detach();
				context.container.find('.field-item.preview').replaceWith(newPreview);

				var newIcon = $(context.template($.extend({}, options.model, {
					requestKey: context.serializeRequest(context.request),
					description: context.description
				}))).find('.field-item.icon').detach();
				context.container.find('.field-item.icon').replaceWith(newIcon);

				removeDifference(context);

				logicallyShowContentTypeWarningMessage(context);
			},
			applyBottomMargin: function (margin) {
				context.container.find('.editor-content').css({
					bottom: margin
				});
			},
			applyComparisonMode: function (variantType) {
				if(variantType) {
					compareWith(context, variantType);
				} else {
					unCompareWith(context);
				}
			}
		}
	};

	return EmbeddableOverviewView;

}, jQuery, window);
