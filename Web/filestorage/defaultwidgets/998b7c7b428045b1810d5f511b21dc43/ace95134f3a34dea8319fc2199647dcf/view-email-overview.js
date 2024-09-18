/*
EmailOverviewView

Raises Messages:

	studio.view.staging.publish
	studio.view.staging.revert

Methods
	// constructor
	// 		onSearchContexts

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
define('EmailOverviewView', ['StudioUtility'], function(util, $, global, undef) {

	var defaults = {
		container: null,
		template: null,
		headerTemplate: null,
		actionsTemplate: null,
		stateTemplate: null,
		componentsTemplate: null,
		versionsTemplate: null,
		filesViewTemplate: null,
		detailsTemplate: null,
		fragmentEditorComponentsTemplate: null,
		onSearchContexts: function(filter) {},
		serializeRequest: function(request, options) {},
		description: 'test description',

	};

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

		context.changed(context.model, immediately).then(function(){

		});
	}

	function handleChanges(context) {
		var raiseImmediateChange = function() {
			raiseChange(context, true);
		};

		context.name.on('input', function(){ raiseChange(context); });
		context.description.on('input', function(){ raiseChange(context); });
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

		// render actions
		var renderedActions = context.actionsTemplate(viewModel);
		context.actionsContainer.empty().append(renderedActions);

		// render state...
		context.stateContainer.empty().append(context.stateTemplate(context.model))

		// render components
		context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, context.model,{
			selected: context.selectedTab,
			selectedTabName: context.selectedTabName
		})));


		context.name = context.container.find('input.name');
		context.description = context.container.find('input.description');

		context.nameTokenEditor = context.container.find('.field-item-input.name .token-editor');
		context.descriptionTokenEditor = context.container.find('.field-item-input.description .token-editor');

		context.editorComponentsContainer = context.container.find('.components .email-components');
		context.filesContainer = context.container.find('.components .email-files');
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

		initTokenEditor(context.nameTokenEditor,
			context.model.Name,
			context.model.ProcessedName);

		initTokenEditor(context.descriptionTokenEditor,
			context.model.Description,
			context.model.ProcessedDescription);
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

		if(util.normalize(currentModel.SubjectScript || '') !== util.normalize(variantModel.SubjectScript || ''))
			context.container.find('.email-components .email-component-link.subjectscript').addClass('was');
		if(util.normalize(currentModel.HeaderScript || '') !== util.normalize(variantModel.HeaderScript || ''))
			context.container.find('.email-components .email-component-link.headerscript').addClass('was');
		if(util.normalize(currentModel.FooterScript || '') !== util.normalize(variantModel.FooterScript || ''))
			context.container.find('.email-components .email-component-link.footerscript').addClass('was');
		if(util.normalize(currentModel.BodyScript || '') !== util.normalize(variantModel.BodyScript || ''))
			context.container.find('.email-components .email-component-link.bodyscript').addClass('was');
		if(util.normalize(currentModel.TemplateScript || '') !== util.normalize(variantModel.TemplateScript || ''))
			context.container.find('.email-components .email-component-link.templatescript').addClass('was');

		if (util.normalize(currentModel.ConfigurationXml || '') !== util.normalize(variantModel.ConfigurationXml || ''))
			context.container.find('.email-components .email-component-link.configuration').addClass('was');
		if(!resourcesAreSame(currentModel, variantModel))
			context.container.find('.email-components .email-component-link.resources').addClass('was');

		// temporary rendered versions variant files
		var renderedVariantFiles = $('<div>' + context.filesViewTemplate(variantModel) + '</div>');

		// files
		$.each(currentModel.Files, function(i, file) {
			var variantFile = findFile(variantModel.Files, file.Name);
			if (!variantFile || file.Digest !== variantFile.Digest)
				context.container.find('.email-files .file[data-name="' + file.Name + '"]').addClass('was');
		});
		// deleted
		var fileList = context.container.find('.email-files ul').first();
		$.each(variantModel.Files, function(i, file) {
			var currentFile = findFile(currentModel.Files, file.Name);
			if (!currentFile) {
				var deletedLink = renderedVariantFiles.find('.file[data-name="' + file.Name + '"]').addClass('was deleted');
				deletedLink.attr('data-tip', deletedLink.attr('data-tip') + '  (' + context.resources.deleted + ')');
				deletedLink.closest('li').prependTo(fileList);
			}
		});
	}

	function removeDifference(context) {
		// name
		context.container.find('.field-item.name .was').html('');
		// description
		context.container.find('.field-item.description .was').html('');

		context.container.find('.email-components .email-component-link.subjectscript').removeClass('was');
		context.container.find('.email-components .email-component-link.headerscript').removeClass('was');
		context.container.find('.email-components .email-component-link.footerscript').removeClass('was');
		context.container.find('.email-components .email-component-link.bodyscript').removeClass('was');
		context.container.find('.email-components .email-component-link.templatescript').removeClass('was');
		context.container.find('.email-components .email-component-link.configuration').removeClass('was');
		context.container.find('.email-components .email-component-link.resources').removeClass('was');

		context.container.find('.email-files .file.was.deleted').remove();
		context.container.find('.email-files .file').removeClass('was');
	}

	var EmailOverviewView = function(options){
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

				context.editorComponentsContainer.empty().append(context.editComponentsViewTemplate(context.model));
				context.filesContainer.empty().append(context.filesViewTemplate(context.model));

				context.container.find('.email-name').text(options.model.ProcessedName);

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

	return EmailOverviewView;

}, jQuery, window);
