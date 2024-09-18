/*
ThemeOverviewView

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
*/
define('ThemeOverviewView', ['StudioUtility'], function(util, $, global, undef) {

	var defaults = {
		container: null,
		template: null,
		headerTemplate: null,
		actionsTemplate: null,
		stateTemplate: null,
		componentsTemplate: null,
		versionsTemplate: null,
		attachmentsTemplate: null,
		detailsTemplate: null,
		fragmentEditorComponentsTemplate: null,
		onSearchContexts: function(filter) {},
		onSearchRestScopes: function (filter) { },
		serializeRequest: function(request, options) {},
		description: 'test description',

	};

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function raiseChange(context, immediately) {
		if(context.willSave) {
			context.willSave();
		}

		context.model.Name = context.name.val();
		context.model.Description = context.description.val();

		var mediaMaxHeightPixels = parseInt(context.mediaMaxHeightPixels.val(), 10);
		if (mediaMaxHeightPixels)
			context.model.MediaMaxHeightPixels = mediaMaxHeightPixels;
		else
			context.model.MediaMaxHeightPixels = null;

		var mediaMaxWidthPixels = parseInt(context.mediaMaxWidthPixels.val(), 10);
		if (mediaMaxWidthPixels)
			context.model.MediaMaxWidthPixels = mediaMaxWidthPixels;
		else
			context.model.MediaMaxWidthPixels = null;

		var selectedRestScopes = $.grep(context.restScopes.val().split(','), function (s) {
			return s && $.trim(s);
		}).map(function (s) { return { Id: s } });
		context.model.RestScopes = selectedRestScopes;

		context.changed(context.model, immediately).then(function(){

		});
	}

	function handleChanges(context) {
		context.name.on('input', function(){ raiseChange(context); });
		context.description.on('input', function(){ raiseChange(context); });
		context.mediaMaxWidthPixels.on('input', function(){ raiseChange(context); });
		context.mediaMaxHeightPixels.on('input', function () { raiseChange(context); });
		context.restScopes.on('change', function(){ raiseChange(context, true); });
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
			if (restScope && restScope.Id && restScope.Name)
			{
				var renderedRestscope = context.restScopes.glowLookUpTextBox('createLookUp',
					restScope.Id,
					restScope.Name,
					restScope.Name,
					true);
				context.restScopes.glowLookUpTextBox('add', renderedRestscope);
			}
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
		context.mediaMaxWidthPixels = context.container.find('input.mediaMaxWidthPixels');
		context.mediaMaxHeightPixels = context.container.find('input.mediaMaxHeightPixels');

		context.editorComponentsContainer = context.container.find('.components .theme-components');
		context.filesContainer = context.container.find('.components .theme-files');
		context.scriptFilesContainer = context.container.find('.components .theme-scripts');
		context.styleFilesContainer = context.container.find('.components .theme-stylefiles');
		context.details = context.container.find('.content.details');

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
			context.container.find('.field-item.name .was').text(diffableValue(variantModel.Name, context));
		// description
		if (util.normalize(currentModel.Description || '') !== util.normalize(variantModel.Description || '&nbsp;'))
			context.container.find('.field-item.description .was').text(diffableValue(variantModel.Description, context));

		// media
		if(util.normalize(currentModel.MediaMaxHeightPixels || '') !== util.normalize(variantModel.MediaMaxHeightPixels || ''))
			context.container.find('.field-item.mediaMaxHeightPixels .was').html(variantModel.MediaMaxHeightPixels || '&nbsp;');
		if(util.normalize(currentModel.MediaMaxWidthPixels || '') !== util.normalize(variantModel.MediaMaxWidthPixels || ''))
			context.container.find('.field-item.mediaMaxWidthPixels .was').html(variantModel.MediaMaxWidthPixels || '&nbsp;');

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

		if(util.normalize(currentModel.HeadScript || '') !== util.normalize(variantModel.HeadScript || ''))
			context.container.find('.theme-components .theme-component-link.headscript').addClass('was');
		if(util.normalize(currentModel.BodyScript || '') !== util.normalize(variantModel.BodyScript || ''))
			context.container.find('.theme-components .theme-component-link.bodyscript').addClass('was');
		if(util.normalize(currentModel.ConfigurationXml || '') !== util.normalize(variantModel.ConfigurationXml || ''))
			context.container.find('.theme-components .theme-component-link.configuration').addClass('was');
		if(!resourcesAreSame(currentModel, variantModel))
			context.container.find('.theme-components .theme-component-link.resources').addClass('was');
		if(util.normalize(currentModel.PaletteTypesXml || '') !== util.normalize(variantModel.PaletteTypesXml || ''))
			context.container.find('.theme-components .theme-component-link.palettes').addClass('was');

		// temporary rendered versions variant files
		var renderedVariantStyleFiles = $('<div>' + context.styleFilesViewTemplate(variantModel) + '</div>');
		var renderedVariantScriptFiles = $('<div>' + context.scriptFilesViewTemplate(variantModel) + '</div>');
		var renderedVariantFiles = $('<div>' + context.filesViewTemplate(variantModel) + '</div>');

		// style files
		// new/changed files
		$.each(currentModel.StyleFiles, function(i, file) {
			var variantFile = findFile(variantModel.StyleFiles, file.Name);
			if (!variantFile || file.Digest !== variantFile.Digest)
				context.container.find('.theme-stylefiles .style[data-name="' + file.Name + '"]').addClass('was');
		});
		// deleted
		var fileList = context.container.find('.theme-stylefiles ul').first();
		$.each(variantModel.StyleFiles, function(i, file) {
			var currentFile = findFile(currentModel.StyleFiles, file.Name);
			if (!currentFile) {
				var deletedLink = renderedVariantStyleFiles.find('.style[data-name="' + file.Name + '"]').addClass('was deleted');
				deletedLink.attr('data-tip', deletedLink.attr('data-tip') + '  (' + context.resources.deleted + ')');
				deletedLink.closest('li').prependTo(fileList);
			}
		});

		// script files
		$.each(currentModel.ScriptFiles, function(i, file) {
			var variantFile = findFile(variantModel.ScriptFiles, file.Name);
			if (!variantFile || file.Digest !== variantFile.Digest)
				context.container.find('.theme-scriptfiles .style[data-name="' + file.Name + '"]').addClass('was');
		});
		// deleted
		var fileList = context.container.find('.theme-scripts ul').first();
		$.each(variantModel.ScriptFiles, function(i, file) {
			var currentFile = findFile(currentModel.ScriptFiles, file.Name);
			if (!currentFile) {
				var deletedLink = renderedVariantScriptFiles.find('.script[data-name="' + file.Name + '"]').addClass('was deleted');
				deletedLink.attr('data-tip', deletedLink.attr('data-tip') + '  (' + context.resources.deleted + ')');
				deletedLink.closest('li').prependTo(fileList);
			}
		});

		// files
		$.each(currentModel.Files, function(i, file) {
			var variantFile = findFile(variantModel.Files, file.Name);
			if (!variantFile || file.Digest !== variantFile.Digest)
				context.container.find('.theme-files .file[data-name="' + file.Name + '"]').addClass('was');
		});
		// deleted
		var fileList = context.container.find('.theme-files ul').first();
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
			context.container.find('.field-item.preview .was').empty().append(
				$.telligent.evolution.template.compile(
					'<div class="ui-viewhtml" data-width="320" data-height="240" data-url="<%: PreviewImageUrl %>"></div>')(variantModel));
		}
	}

	function removeDifference(context) {
		// name
		context.container.find('.field-item.name .was').html('');
		// description
		context.container.find('.field-item.description .was').html('');

		// media
		context.container.find('.field-item.mediaMaxHeightPixels .was').html('');
		context.container.find('.field-item.mediaMaxWidthPixels .was').html('');

		context.container.find('.theme-components .theme-component-link.headscript').removeClass('was');
		context.container.find('.theme-components .theme-component-link.bodyscript').removeClass('was');
		context.container.find('.theme-components .theme-component-link.configuration').removeClass('was');
		context.container.find('.theme-components .theme-component-link.resources').removeClass('was');
		context.container.find('.theme-components .theme-component-link.palettes').removeClass('was');

		context.container.find('.theme-stylefiles .style.was.deleted').remove();
		context.container.find('.theme-stylefiles .style').removeClass('was');

		context.container.find('.theme-scripts .script.was.deleted').remove();
		context.container.find('.theme-scripts .script').removeClass('was');

		context.container.find('.theme-files .file.was.deleted').remove();
		context.container.find('.theme-files .file').removeClass('was');

		// rest scopes
		context.container.find('.field-item.rest-scopes .was').html('');

		context.container.find('.field-item.preview .was').empty();
	}

	var ThemeOverviewView = function(options){
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
				context.styleFilesViewTemplate = $.telligent.evolution.template(context.styleFilesViewTemplate);
				context.scriptFilesViewTemplate = $.telligent.evolution.template(context.scriptFilesViewTemplate);
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
				if(!context.mediaMaxHeightPixels.is(':focus') || options.force)
					context.mediaMaxHeightPixels.val(options.model.MediaMaxHeightPixels || '');
				if(!context.mediaMaxWidthPixels.is(':focus') || options.force)
					context.mediaMaxWidthPixels.val(options.model.MediaMaxWidthPixels || '');

				context.editorComponentsContainer.empty().append(context.editComponentsViewTemplate(context.model));
				context.filesContainer.empty().append(context.filesViewTemplate(context.model));
				context.styleFilesContainer.empty().append(context.styleFilesViewTemplate(context.model));
				context.scriptFilesContainer.empty().append(context.scriptFilesViewTemplate(context.model));

				context.container.find('.theme-name').text(options.model.Name);

				var newPreview = $(context.template($.extend({}, options.model, {
					requestKey: context.serializeRequest(context.request),
					description: context.description
				}))).find('.field-item.preview').detach();
				context.container.find('.field-item.preview').replaceWith(newPreview);

				// update rest scopes
				renderCurrentRestScopes(context);

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

	return ThemeOverviewView;

}, jQuery, window);
