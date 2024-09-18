/*
FragmentOverviewView

Raises Messages:

	mfw.view.fragment.delete
	mfw.view.fragment.clone
	mfw.view.fragment.initiate-for-theme
	mfw.view.fragment.export
	mfw.view.resources.export
	mfw.view.fragment.initiate-new-file
	mfw.view.fragment.initiate-upload
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
*/
define('FragmentOverviewView', ['StudioUtility'], function(util, $, global, undef) {

	var defaults = {
		container: null,
		template: null,
		actionsTemplate: null,
		stateTemplate: null,
		componentsTemplate: null,
		versionsTemplate: null,
		attachmentsTemplate: null,
		detailsTemplate: null,
		fragmentEditorComponentsTemplate: null,
		onSearchContexts: function (filter) { },
		onSearchRestScopes: function (filter) { },
		serializeRequest: function(request, options) {}
	};

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function handleChanges(context) {
		function raiseChange(shouldDelay) {
			if(context.willSave) {
				context.willSave();
			}


			context.model.Name = context.name.val();
			if(context.model.HasHeader)
				context.model.ShowHeaderByDefault = context.showHeader.is(':checked');
			context.model.IsCacheable = context.isCacheable.is(':checked');
			context.model.VaryCacheByUser = context.varyCache.is(':checked');
			if(context.model.HasWrapperCss)
				context.model.CssClass = context.cssClass.val();
			context.model.Description = context.description.val();

			var selectedAvailableContexts = $.grep(context.availableContexts.val().split(','), function(c){
				return c && $.trim(c);
			});
			context.model.ContextItemIds = selectedAvailableContexts;

			var selectedRestScopes = $.grep(context.restScopes.val().split(','), function (s) {
				return s && $.trim(s);
			}).map(function (s) { return { Id: s } });
			context.model.RestScopes = selectedRestScopes;

			if(shouldDelay) {
				context.changed(context.model).then(function(){
				});
			} else {
				context.changed(context.model).then(function(){

				});
			}
		}

		context.name.on('input', function(){ raiseChange(true); });
		if(context.model.HasHeader)
			context.showHeader.on('change', function(){ raiseChange(true); });
		context.isCacheable.on('change', function(){ raiseChange(true); });
		context.varyCache.on('change', function(){ raiseChange(true); });
		if(context.model.HasWrapperCss)
			context.cssClass.on('input', function(){ raiseChange(true); });
		context.description.on('input', function(){ raiseChange(true); });
		context.availableContexts.on('change', function () { raiseChange(true); });
		context.restScopes.on('change', function(){ raiseChange(true); });
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
			context.rawElement.show().trigger('focus');
		}
	}

	function initAvailableContextEditor(context) {
		context.availableContexts.glowLookUpTextBox({
			delimiter: ',',
			allowDuplicates: false,
			onGetLookUps: function(textbox, searchText) {
				if(searchText && searchText.length >= 1) {
					textbox.glowLookUpTextBox('updateSuggestions', [
						textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
					]);
					context.currentSearchText = searchText;

					context.onSearchContexts(searchText).then(function(response){
						if (searchText != context.currentSearchText) {
							return;
						}

						var hasResults = false;
						if (response && response.contexts.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								response.contexts.map(function(result, i) {
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
								textbox.glowLookUpTextBox('createLookUp', '', context.resources.noContextsFound, context.resources.noContextsFound, false)
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
			context.availableContexts.trigger('change');
		});
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

	function renderCurrentContextItems(context) {
		// don't re-render if currently focused
		// unfortunately using a private way of finding the actual input within the glow text box
		var input = getGlowLookupTextBoxInput(context.availableContexts);
		if(input.is(':focus')) {
			return;
		}

		// clear any current selections
		var count = context.availableContexts.glowLookUpTextBox('count');
		for(var i = 0; i < count; i++) {
			var removed = context.availableContexts.glowLookUpTextBox('removeByIndex', 0);
		}

		// add items corresponding to current model's context items
		for(var i = 0; i < context.model.ProcessedContextItems.length; i++) {
			var contextItem = context.model.ProcessedContextItems[i];
			var renderedContextItem = context.availableContexts.glowLookUpTextBox('createLookUp',
				contextItem.Id,
				contextItem.Name,
				contextItem.Name,
				true);
			context.availableContexts.glowLookUpTextBox('add', renderedContextItem);
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
			var renderedRestscope = context.availableContexts.glowLookUpTextBox('createLookUp',
				restScope.Id,
				restScope.Name,
				restScope.Name,
				true);
			context.restScopes.glowLookUpTextBox('add', renderedRestscope);
		}
	}

	function initUi(context) {
		var viewModel = $.extend({}, context.model, {
			requestKey: context.serializeRequest(context.request)
		});

		context.container.append(context.template(viewModel));

		context.fragmentName = context.container.find('.managed-item-name');
		context.actionsWrapper = context.container.find('.editor-actions-wrapper');
		context.stateWrapper = context.container.find('.editor-state');
		context.editorComponentsWrapper = context.container.find('.components .managed-items');
		context.editorVersionsWrapper = context.container.find('.components .fragment-versions');
		context.componentsWrapper = context.container.find('.editor-header .managed-items');
		context.attachmentsWrapper = context.container.find('.components .fragment-attachments');
		context.name = context.container.find('input.name');
		context.details = context.container.find('.content.details');
		if(context.model.HasHeader)
			context.showHeader = context.container.find('input.show-header');
		context.isCacheable = context.container.find('input.is-cacheable');
		context.varyCache = context.container.find('input.vary-cache');
		if(context.model.HasWrapperCss)
			context.cssClass = context.container.find('input.css-class');
		context.description = context.container.find('input.description');
		context.nameTokenEditor = context.container.find('.field-item-input.name .token-editor');
		context.descriptionTokenEditor = context.container.find('.field-item-input.description .token-editor');
		context.availableContexts = context.container.find('.field-item.available-contexts .available-contexts');
		context.restScopes = context.container.find('.field-item.rest-scopes .rest-scopes');
		context.detailsAttributes = context.details.find('.attributes');
		initAvailableContextEditor(context);
		initRestScopesEditor(context);

		initTokenEditor(context.nameTokenEditor,
			context.model.Name,
			context.model.ProcessedName);

		initTokenEditor(context.descriptionTokenEditor,
			context.model.Description,
			context.model.ProcessedDescription);

		context.details.on('click', '.show', function(e){
			e.preventDefault();
			context.details.addClass('expanded');
			return false;
		}).on('click', '.hide', function(e){
			e.preventDefault();
			context.details.removeClass('expanded');
			return false;
		});

		// render actions
		var renderedActions = context.actionsTemplate(viewModel);
		context.actionsWrapper.empty().append(renderedActions);

		attemptToRenderCurrentContextItems(context);
		attemptToRenderCurrentRestScopes(context);

		context.stateLabels = context.container.find('.editor-state');
		context.editorContainer = context.container.find('.editor-content');

		context.stateLabels.on('click', 'a.compare', function(e){
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
	}

	function compareWith(context, variantType) {
		removeDifference(context);
		context.stateLabels.find('a.compare').each(function(){
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

		var activatingLink = context.stateLabels.find('a.compare[data-varianttype="' + variantType + '"]');
		activatingLink.text(activatingLink.data('hidelabel'));
		if(context.editorContainer.filter('.editor-content').is(':visible')) {
			context.stateLabels.show();
			context.stateLabels.find('.from').text(activatingLink.data('fromlabel'));
			context.stateLabels.find('.to').text(activatingLink.data('tolabel'));
		}
	}

	function unCompareWith(context) {
		context.stateLabels.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.stateLabels.find('.state-labels').hide();
		removeDifference(context);
		context.comparison = false;
	}

	function attemptToRenderCurrentContextItems(context){
		var availableContextsContainer = getGlowLookupTextBoxContainer(context.availableContexts);
		if(availableContextsContainer.length == 0 || !availableContextsContainer.get(0).offsetHeight) {
			setTimeout(function(){
				attemptToRenderCurrentContextItems(context);
			}, 20)
		} else {
			renderCurrentContextItems(context);
		}
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
		if (util.normalize(currentModel.ProcessedName || '') !== util.normalize(variantModel.ProcessedName || ''))
			context.container.find('.field-item.name .was').text(diffableValue(variantModel.ProcessedName, context));
		// description
		if (util.normalize(currentModel.ProcessedDescription || '') !== util.normalize(variantModel.ProcessedDescription || ''))
			context.container.find('.field-item.description .was').text(diffableValue(variantModel.ProcessedDescription, context));
		// cssclass
		if (util.normalize(currentModel.CssClass || '') !== util.normalize(variantModel.CssClass || ''))
			context.container.find('.field-item.cssclass .was').text(diffableValue(variantModel.CssClass, context));
		// contexts
		var currentContextItems = (currentModel.ContextItemIds || []).sort();
		var variantContextItems = (variantModel.ContextItemIds || []).sort();
		var contextsDiffer = false;
		if(currentContextItems.length !== variantContextItems.length) {
			contextsDiffer = true;
		} else {
			for(var i = 0; i < currentContextItems.length; i++) {
				if(currentContextItems[i] !== variantContextItems[i]) {
					contextsDiffer = true;
					break;
				}
			}
		}
		if(contextsDiffer) {
			context.container.find('.field-item.available-contexts .was').html(
				diffableValue(variantModel.ProcessedContextItems.map(function (contextItem) {
					return contextItem.Name;
				}).sort().join(', '), context));
		}

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
		if (restScopesDiffer) {
			context.container.find('.field-item.rest-scopes .was').html(
				diffableValue(variantModel.RestScopes.map(function (scope) {
					return scope.Name;
				}).sort().join(', '), context));
		}

		// ShowHeaderByDefault
		if(currentModel.ShowHeaderByDefault !== variantModel.ShowHeaderByDefault)
			context.container.find('.field-item-input.ShowHeaderByDefault label').addClass('was');
		// IsCacheable
		if(currentModel.IsCacheable !== variantModel.IsCacheable)
			context.container.find('.field-item-input.IsCacheable label').addClass('was');
		// VaryCacheByUser
		if(currentModel.VaryCacheByUser !== variantModel.VaryCacheByUser)
			context.container.find('.field-item-input.VaryCacheByUser label').addClass('was');

		if(util.normalize(currentModel.ContentScript || '') !== util.normalize(variantModel.ContentScript || ''))
			context.container.find('.managed-items .managed-item-link.content').addClass('was');
		if(util.normalize(currentModel.ConfigurationXml || '') !== util.normalize(variantModel.ConfigurationXml || ''))
			context.container.find('.managed-items .managed-item-link.configuration').addClass('was');
		if(util.normalize(currentModel.HeaderScript || '') !== util.normalize(variantModel.HeaderScript || ''))
			context.container.find('.managed-items .managed-item-link.header').addClass('was');
		if(util.normalize(currentModel.AdditionalCssScript || '') !== util.normalize(variantModel.AdditionalCssScript || ''))
			context.container.find('.managed-items .managed-item-link.css').addClass('was');
		if(!resourcesAreSame(currentModel, variantModel))
			context.container.find('.managed-items .managed-item-link.resources').addClass('was');

		var renderedVariantAttachments = $('<div>' + context.attachmentsTemplate(variantModel) + '</div>');

		// attachments
		// new/changed attachments
		$.each(currentModel.Attachments, function(i, file) {
			var variantFile = findFile(variantModel.Attachments, file.Name);
			if (!variantFile || file.Digest !== variantFile.Digest)
				context.container.find('.managed-items .attachment[data-name="' + file.Name + '"]').addClass('was');
		});
		// deleted
		var attachmentList = context.container.find('.fragment-attachments ul').first();
		$.each(variantModel.Attachments, function(i, file) {
			var currentFile = findFile(currentModel.Attachments, file.Name);
			if (!currentFile) {
				var deletedLink = renderedVariantAttachments.find('.attachment[data-name="' + file.Name + '"]').addClass('was deleted');
				deletedLink.attr('data-tip', deletedLink.attr('data-tip') + '  (' + context.resources.deleted + ')');
				deletedLink.closest('li').prependTo(attachmentList);
			}
		});
	}

	function removeDifference(context) {

		// name
		context.container.find('.field-item.name .was').html('');
		// description
		context.container.find('.field-item.description .was').html('');
		// css class
		context.container.find('.field-item.cssclass .was').html('');
		// available contexts
		context.container.find('.field-item.available-contexts .was').html('');
		// rest scopes
		context.container.find('.field-item.rest-scopes .was').html('');

		// ShowHeaderByDefault
		context.container.find('.field-item-input.ShowHeaderByDefault label').removeClass('was');
		// IsCacheable
		context.container.find('.field-item-input.IsCacheable label').removeClass('was');
		// VaryCacheByUser
		context.container.find('.field-item-input.VaryCacheByUser label').removeClass('was');

		context.container.find('.managed-items .managed-item-link.content').removeClass('was');
		context.container.find('.managed-items .managed-item-link.configuration').removeClass('was');
		context.container.find('.managed-items .managed-item-link.header').removeClass('was');
		context.container.find('.managed-items .managed-item-link.css').removeClass('was');
		context.container.find('.managed-items .managed-item-link.resources').removeClass('was');

		// attachments
		context.container.find('.managed-items .attachment.was.deleted').remove();
		context.container.find('.managed-items .attachment').removeClass('was');
	}

	var FragmentOverviewView = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			// options:
			// 		request
			// 		container
			// 		model
			//		changed(model)
			render: function(options) {
				$.extend(context, options);

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
				if(context.nameTokenEditor) {
					focusOnTokenEditor(context.nameTokenEditor);
				}
				// hide comparison mode class since has no purpose in this view
				$.telligent.evolution.administration.panelWrapper().removeClass('comparing');
			},
			// options
			// 		model
			// 		force
			update: function(options) {
				initTokenEditor(context.nameTokenEditor,
					context.model.Name,
					context.model.ProcessedName,
					options.force);

				if(context.model.HasWrapperCss && (!context.cssClass.is(':focus') || options.force)) {
					context.cssClass.val(context.model.CssClass);
				}

				initTokenEditor(context.descriptionTokenEditor,
					context.model.Description,
					context.model.ProcessedDescription,
					options.force);

				if(context.model.HasHeader) {
					if(context.model.ShowHeaderByDefault) {
						context.showHeader.prop('checked', true);
					} else {
						context.showHeader.prop('checked', false);
					}
				}

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
				context.actionsWrapper.empty().append(context.actionsTemplate(
					$.extend({}, context.model, {
						requestKey: context.serializeRequest(context.request)
					})
				));

				// update details
				context.detailsAttributes.html(context.detailsTemplate(context.model));

				// update context items
				renderCurrentContextItems(context);

				// update rest scopes
				renderCurrentRestScopes(context);

				context.fragmentName.text(options.model.ProcessedName);

				// update state
				context.stateWrapper.empty().append(context.stateTemplate(context.model));

				// update components and attachments
				context.componentsWrapper.empty().append(context.fragmentEditorComponentsTemplate($.extend({}, context.model,{
					selected: 'overview',
					selectedTabName: context.resources.overview
				})));
				context.attachmentsWrapper.empty().append(context.attachmentsTemplate(context.model));
				context.editorComponentsWrapper.empty().append(context.componentsTemplate(context.model));
				context.editorVersionsWrapper.empty().append(context.versionsTemplate(context.model));

				removeDifference(context);
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

	return FragmentOverviewView;

}, jQuery, window);
