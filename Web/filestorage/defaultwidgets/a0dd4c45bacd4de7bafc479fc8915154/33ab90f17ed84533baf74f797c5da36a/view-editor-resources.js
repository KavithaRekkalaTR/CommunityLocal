/*

StudioResourcesEditView:

Options:
	container
	serializeRequest: function()
	selectedTabName: ''
	selectedTab: ''
	description: ''
	Templates:
		template
		headerTemplate
		actionsTemplate
		componentsTemplate
		stateTemplate
		emptyResourceTemplate: null,
		diffTemplate: null,

	onChangeRaised
	onGatherChanges
	onGetResources

	Event Callbacks:
		onRender: function()
			request
			model
			container
			editorContainer
			willSave: function()
			raiseChange: function()
		onUpdate: function()
			model
		onShow: function(lineNumber)
		onHide: function()
		onUnrender: function()
		onUpdateEditorSettings: function(settings)
		onApplyBottomMargin: function(margin)
	Comparisons
		onCompareRequested: function(variantType)
		onDifferencesCompared: function
		onDifferencesRemoved: function
			force
Methods:

*/
define('StudioResourcesEditView', function($, global, undef) {

	var defaults = {
		container: null,
		serializeRequest: null,
		selectedTabName: 'Language Resources',
		selectedTab: 'resources',
		description: 'test description',

		headerTemplate: 'studioShell-editorHeader',
		actionsTemplate: 'studioShell-editorActions',
		componentsTemplate: 'studioShell-editorComponents',
		stateTemplate: 'studioShell-editorState',

		template: 'studioShell-editorResources',
		emptyResourceTemplate: 'studioShell-editorResourcesEmptyResource',
		diffTemplate: 'studioShell-editorResourcesDiff',

		onChangeRaised: null,
		onGatherChanges: null,
		onGetResources: null,

		onRender: null,
		onUpdate: null,
		onShow: null,
		onHide: null,
		onUnrender: null,
		onUpdateEditorSettings: null,
		onApplyBottomMargin: null,
		stateServiceKey: 'diffwith'
	};

	function groupResources(context, model) {
		var groupedResources = {};
		for(var i = 0; i < context.onGetResources(model).length; i++) {
			var resource = context.onGetResources(model)[i];
			groupedResources[resource.Language] = groupedResources[resource.Language] || [];
			groupedResources[resource.Language].push({
				name: resource.Name,
				value: resource.Value
			});
		}
		return groupedResources;
	}

	// builds a set of grouped resources in format:
	/*
	[{
		language: language,
		resources: [
			{
				'name': 'name'
				'old': 'value'
				'new': 'value'
				'change': 'added|removed|changed'
			}
		]
	}]
	*/
	function compareResources(context, modelA, modelB) {
		var resourcesA = buildResourceMap(context, modelA);
		var resourcesB = buildResourceMap(context, modelB);
		var targetMap = {};

		for(var langB in resourcesB) {
			if(!targetMap[langB]) {
				targetMap[langB] = {};
			}

			for(var resB in resourcesB[langB]) {
				targetMap[langB][resB] = {
					new: resourcesB[langB][resB]
				};
				// existed before but different
				if(resourcesA[langB] && resourcesA[langB][resB]) {
					if(resourcesA[langB][resB] !== resourcesB[langB][resB]) {
						targetMap[langB][resB].change = 'changed';
						targetMap[langB][resB].old = resourcesA[langB][resB];
					} else {
						targetMap[langB][resB].old = targetMap[langB][resB].new;
						targetMap[langB][resB].change = null;
					}
				// new
				} else {
					targetMap[langB][resB].old = null;
					targetMap[langB][resB].change = 'added';
				}
			}
		}

		// loop through original set to find any that weren't already in new to mark as removed
		for(var langA in resourcesA) {
			if(!targetMap[langA]) {
				targetMap[langA] = {};
			}

			for(var resA in resourcesA[langA]) {
				if(!targetMap[langA][resA]) {
					targetMap[langA][resA] = {
						old: resourcesA[langA][resA],
						new: null,
						change: 'removed'
					}
				}
			}
		}

		// convert to final format
		var result = {};
		for(var lang in targetMap) {
			result[lang] = [];
			for(var res in targetMap[lang]) {
				result[lang].push({
					name: res,
					old: targetMap[lang][res].old,
					new: targetMap[lang][res].new,
					change: targetMap[lang][res].change
				});
			}
			result[lang].sort(function(a,b){
				if(a.name.toLowerCase() < b.name.toLowerCase())
					return -1;
				else if(a.name.toLowerCase() > b.name.toLowerCase())
					return 1;
				else
					return 0;
			});
		}

		return {
			languages: result
		};
	}

	// for quick comparisons
	function buildResourceMap(context, model) {
		var groupedResources = {};
		for(var i = 0; i < context.onGetResources(model).length; i++) {
			var resource = context.onGetResources(model)[i];
			groupedResources[resource.Language] = groupedResources[resource.Language] || {};
			groupedResources[resource.Language][resource.Name] = resource.Value;
		}
		return groupedResources;
	}

	function initUi(context) {
		context.clientState = {};

		var viewModel = $.extend({}, context.model, {
			requestKey: context.serializeRequest(context.request)
		});

		// group resources
		viewModel.groupedResources = groupResources(context, context.model);

		context.container.empty().append(context.template(viewModel));
		context.headerContainer = context.container.find('.template-editor-header');
		context.headerContainer.append(context.headerTemplate(viewModel))
		context.stateContainer = context.container.find('.template-editor-state');
		context.componentsContainer = context.container.find('.template-editor-components');
		context.actionsContainer = context.container.find('.template-editor-actions');

		context.resourceEditor = context.container.find('.resource-editor');
		context.resourceDiff = context.container.find('.resource-diff');

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

		// instantiate resource editor UI
		context.resourceEditor.manageThemesResourceEditor({
			deleteConfirmMessage: 'really delete?',//context.resources.confirmResourceDelete,
			emptyResourceTemplate: context.emptyResourceTemplate,
			enableAddRemove: true,
			onInteracted: function() {
				context.recentlyInteracted = true;
				global.clearTimeout(context.recentlyInteractedTimeout);
				context.recentlyInteractedTimeout = global.setTimeout(function(){
					context.recentlyInteracted = false;
				}, 2 * 1000);
			},
			onChange: function(serialized) {
				context.onGatherChanges(context.model, serialized);

				context.changed(context.model).then(function(){
					context.onChangeRaised(context.model);
				}).catch(function(){
					context.onChangeRaised(context.model);
				});
			}
		});

		context.comparison = false;

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
		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.comparison = variantType;

		context.loadVariant(variantType).then(function(r){
			if(variantType != context.comparison)
				return;

			var comparisonModel = compareResources(context, r, context.model);
			var comparisonNode = $(context.diffTemplate(comparisonModel));
			context.resourceDiff.empty().append(comparisonNode).show();
			context.resourceEditor.hide();

			var activatingLink = context.stateContainer.find('a.compare[data-varianttype="' + variantType + '"]');
			activatingLink.text(activatingLink.data('hidelabel'));
			if(context.editorContainer.filter('.editor-content').is(':visible')) {
				context.stateLabels.show();
				context.stateLabels.find('.from').text(activatingLink.data('fromlabel'));
				context.stateLabels.find('.to').text(activatingLink.data('tolabel'));
			}
		});
	}

	function unCompareWith(context) {
		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.resourceDiff.hide();
		context.resourceEditor.show();
		context.comparison = false;
	}

	var StudioResourcesEditView = function(options){
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
				context.emptyResourceTemplate = $.telligent.evolution.template(context.emptyResourceTemplate);
				context.diffTemplate = $.telligent.evolution.template(context.diffTemplate);

				initUi(context);

				if(context.onRender) {
					context.onRender({
						request: context.request,
						model: context.model,
						container: context.container,
						editorContainer: null,
						willSave: function() {},
						raiseChange: function() {},
						state: context.clientState
					});
				}
			},
			unrender: function() {
				if(context.onUnrender) {
					context.onUnrender({
						state: context.clientState
					});
				}
			},
			hide: function() {
				var focusedInput = context.container.find('input[type="text"]:focus');
				if(focusedInput.length > 0) {
					context.focusedInputSelector = focusedInput.data('focusname');
				} else {
					context.focusedInputSelector = null;
				}

				// save scroll position
				var contentContainer = context.container.find('.editor-content');
				context.previousScrollTop = contentContainer.scrollTop();

				if(context.onHide) {
					context.onHide({
						state: context.clientState
					});
				}

				// restore comparison mode class if comparing at time of hide
				if(context.comparison) {
					$.telligent.evolution.administration.panelWrapper().addClass('comparing');
				}
			},
			show: function(resourceName) {
				var contentContainer = context.container.find('.editor-content');
				// focus on previously-focused element if there is one
				if(context.focusedInputSelector) {
					context.container.find('.editor-content input[data-focusname="' + context.focusedInputSelector + '"]').first().trigger('focus');
				// try to focus on specific resource if requested
				} else if(resourceName) {
					var focusable = contentContainer.find('input[data-focusname="' + resourceName + '"]');
					focusable.trigger('focus');
					StudioUtility.scrollContainerToFocusOnSelection(contentContainer, focusable, 50);
				} else {
					// else try to focus on first field
					context.container.find('input[type="text"]').first().trigger('focus');
				}

				// reset previous scroll position, if set on hide
				if(context.previousScrollTop) {
					contentContainer.stop().scrollTop(context.previousScrollTop);
					context.previousScrollTop = null;
				}

				if(context.onShow) {
					context.onShow({
						state: context.clientState,
						lineNumber: lineNumber
					});
				}

				// hide comparison mode class since has no purpose in this view
				$.telligent.evolution.administration.panelWrapper().removeClass('comparing');
			},
			// options
			// 		model
			// 		force: true|false (when true, updates even if focused)
			update: function(options) {
				if(!context.recentlyInteracted || options.force) {
					// re-render UI and re-apply any bottom offset
					var currentBottom = context.container.find('.editor-content').css('bottom');
					initUi(context);
					context.container.find('.editor-content').css('bottom', currentBottom);
				}

				context.resourceDiff.hide();
				context.resourceEditor.show();

				// update state
				context.stateContainer.empty().append(context.stateTemplate(context.model));

				// update components
				context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, context.model,{
					selected: context.selectedTab,
					selectedTabName: context.selectedTabName
				})));

				// update actions
				context.actionsContainer.empty().append(context.actionsTemplate(
					$.extend({}, context.model, {
						requestKey: context.serializeRequest(context.request)
					})
				));

				if(context.onUpdate) {
					context.onUpdate({
						state: context.clientState,
						model: options.model,
						container: context.container
					});
				}
			},
			updateEditorSettings: function(settings) {
				if(context.onUpdateEditorSettings) {
					content.onUpdateEditorSettings({
						state: context.clientState,
						settings: settings
					});
				}
			},
			applyBottomMargin: function (margin) {
				setTimeout(function(){
					context.container.find('.editor-content').css({
						bottom: margin
					});
				}, 10);

				if(context.onApplyBottomMargin) {
					context.onApplyBottomMargin({
						state: context.clientState,
						margin: margin
					});
				}
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

	/* Legacy Language Resource Editor UI - to be replaced with non-jQuery plugin version */
	(function ($) {
		var api = {};
		var dataKey = '_manageThemesResourceEditor',
			setupLanguageSelect = function (context) {
				var revealLanguage = function () {
					var language = context.internal.languageSelect.val();
					context.internal.languages.hide().filter('[data-language="' + language + '"]').show();
				};
				context.internal.languageSelect.on('change', function () { revealLanguage(); });
				revealLanguage();
			},
			setupDeleteLinks = function (context) {
				if (context.settings.enableAddRemove) {
					context.selection.on('click', '.delete', function(e){
						e.preventDefault();
						var resourceItem = $(this).closest('li');
						var resourceName = resourceItem.find('.attribute-name input').val();

						if (confirm(context.settings.deleteConfirmMessage.replace(/NAME/, resourceName))) {
							resourceItem.remove();
							serialize(context);
							context.settings.onInteracted();
						}
					});
				} else {
					$(context.settings.deleteLinks, context.selection).hide();
				}
			},
			addNew = function (context) {
				context.newResourceCount = (context.newResourceCount || 1);
				context.newResourceCount++;
				var list = $(context.settings.resourceList + ':visible', context.selection);
				var language = list.closest('.language').attr('data-language');
				var newResource = $(context.settings.emptyResourceTemplate({
					language: language,
					focusName: ('non-persisted-resource-' + context.newResourceCount)
				}));
				list.append(newResource);
				serialize(context);
				newResource.find('.attribute-name input').trigger('focus');
				if(context.settings.onInteracted)
					context.settings.onInteracted();
			},
			setupAddNewLink = function (context) {
				if (context.settings.enableAddRemove) {
					context.internal.addNewLink.on('click', function (e) {
						e.preventDefault();
						addNew(context);
						context.settings.onInteracted();
					});
				} else {
					$(context.internal.addNewLink, context.selection).hide();
				}

				context.selection.on('keydown','input[type="text"]', function (e) {
					if (e.which === 13) {
						e.preventDefault();
						e.stopPropagation();
						addNew(context);
					}
				});
				context.selection.on('keyup', 'input[type="text"]',  function (e) {
					var input = $(e.target);
					if (input.val() === '') {
						input.removeClass('populated').addClass('empty');
					} else {
						input.removeClass('empty').addClass('populated');
					}
				});
			},
			serialize = function (context) {
				var serializedResources = [];
				$(context.settings.resources, context.selection).each(function () {
					var resource = $(this);
					serializedResources.push($.param({
						lang: resource.attr('data-language'),
						name: resource.find('.attribute-name input').val(),
						val: resource.find('.attribute-value input').val()
					}));
				});
				var serialized = $.param({ r: serializedResources });
				context.onChange(serialized);
			},
			init = function (options) {
				return this.each(function () {
					var settings = $.extend({}, $.fn.manageThemesResourceEditor.defaults, options || {});
					var item = $(this);
					var context = {
						settings: settings,
						selection: item,
						onChange: settings.onChange,
						internal: {
							state: $(settings.state, item),
							languageSelect: $(settings.languageSelect, item),
							resources: $(settings.resources, item),
							addNewLink: $(settings.addNewLink, item),
							resourceList: $(settings.resourceList, item),
							languages: $(settings.languages, item)
						}
					};
					$(this).on('input','input', function(){
						serialize(context);
						context.settings.onInteracted();
					});
					$(this).data(dataKey, context);
					setupDeleteLinks(context);
					setupAddNewLink(context);
					setupLanguageSelect(context);
				});
			};
		$.fn.manageThemesResourceEditor = function (method) {
			return init.apply(this, arguments);
		};
		$.fn.manageThemesResourceEditor.defaults = {
			enableAddRemove: true,
			languageSelect: 'select',
			resources: 'li.resource',
			deleteLinks: 'li.resource a.delete',
			addNewLink: 'a.add',
			resourceList: 'ul.attribute-list',
			languages: '.language',
			onChange: function(serialized) { },
			onInteracted: function() { },
			deleteConfirmMessage: 'Are you sure you want to delete the resource "NAME"?',
			emptyResourceTemplate: null
		};
	})(jQuery);

	return StudioResourcesEditView;

}, jQuery, window);
