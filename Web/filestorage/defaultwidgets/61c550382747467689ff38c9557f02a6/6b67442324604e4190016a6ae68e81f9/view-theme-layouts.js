/*
ThemeLayoutsVivew

Raises Messages:

	studio.view.staging.publish
	studio.view.staging.revert

Methods
	// constructor
		// options
		//    id
		//    typeId
		//    staged (default false)
		//    factoryDefault (default false)
		onListLayouts(options)
		listTemplate

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
define('ThemeLayoutsView', function($, global, undef) {

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
		serializeRequest: function(request, options) {},
		description: 'test description',
		onListLayouts: function(options) {}
	};

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
		context.pageLayoutList = context.container.find('.layout-list.pages');
		context.headerFooterLayoutList = context.container.find('.layout-list.header-footer');

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

		loadAndRender(context);
	}

	function compareWith(context, variantType) {
		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.comparison = variantType;

		if(variantType == 'nonstaged') {
			loadAndRender(context, {}, {
				staged: true
			});
		} else if(variantType == 'default') {
			loadAndRender(context, {}, {
				factoryDefault: true
			});
		}

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
		loadAndRender(context);
		context.comparison = false;
	}

	function loadAndRender(context, options, compareOptions) {
		if(compareOptions)
			$.telligent.evolution.administration.loading(true);
		loadLayouts(context, options, compareOptions).then(function(layouts){
			renderLayouts(context, layouts);
			$.telligent.evolution.administration.loading(false);
		});
	}

	// options
	//   staged  - force staged - default false
	//   factoryDefault - force factory default - default false
	function loadLayouts(context, options, compareOptions) {
		// process comparison
		var comparisons = {
			same: 'same',
			changed: 'changed',
			new: 'new'
		};

		return $.Deferred(function(d){
			if(compareOptions) {
				var req1, req2;
				// comparing current non-staged (FD, Default) state with staged-only state
				if(compareOptions.staged) {
					req1 = context.onListLayouts({
						typeId: context.model.TypeId,
						id: context.model.Id,
						staged: false
					});
					req2 = context.onListLayouts({
						typeId: context.model.TypeId,
						id: context.model.Id,
						staged: true
					})
				// comparing FD-only state with current non-FD state (default and potentially staged)
				} else if(compareOptions.factoryDefault) {
					req1 = context.onListLayouts({
						typeId: context.model.TypeId,
						id: context.model.Id,
						factoryDefault: true
					});
					req2 = context.onListLayouts({
						typeId: context.model.TypeId,
						id: context.model.Id,
						factoryDefault: false
					});
				}

				$.when(req1, req2).then(function(response1, response2) {
					set1 = response1[0].layouts;
					set2 = response2[0].layouts;

					var header, footer, pages = {};
					set1.forEach(function(layout) {
						layout.Comparison = comparisons.same;
						if (layout.Type == 'header')
							header = layout;
						else if (layout.Type == 'footer')
							footer = layout;
						else
							pages[layout.Name] = layout;
					});

					set2.forEach(function(layout) {
						if (layout.Type == 'header') {
							layout.Comparison = header ? comparisons.changed : comparisons.new;
							header = layout;
						} else if (layout.Type == 'footer') {
							layout.Comparison = footer ? comparisons.changed : comparisons.new;
							footer = layout
						} else {
							layout.Comparison = pages[layout.Name] ? comparisons.changed : comparisons.new;
							pages[layout.Name] = layout;
						}
					});

					var layouts = [];
					for(var page in pages) {
						layouts.push(pages[page]);
					}

					if(footer) {
						layouts.unshift(footer);
					}

					if(header) {
						layouts.unshift(header);
					}

					d.resolve(layouts);

				});

			} else {
				context.onListLayouts($.extend({
					typeId: context.model.TypeId,
					id: context.model.Id
				}, options || {})).then(function(baseResponse){
					baseResponse.layouts.forEach(function(l) {
						l.Comparison = comparisons.same;
					});
					d.resolve(baseResponse.layouts);
				});
			}
		}).promise();
	}

	function renderLayouts(context, layouts) {
		var headerFooterTemplates = layouts.filter(function(l) { return l.Type == 'Header' || l.Type == 'Footer' });
		context.headerFooterLayoutList.empty().append(context.listTemplate({ layouts: headerFooterTemplates }));

		var pageTemplates = layouts.filter(function(l) { return l.Type == 'Page' });
		context.pageLayoutList.empty().append(context.listTemplate({ layouts: pageTemplates }));
	}

	var ThemeLayoutsView = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			// options:
			// 		request
			// 		container
			// 		model
			//		changed(model)
			render: function(options) {
				$.extend(context, options);

				context.lastState = context.model.State;
				context.lastStaged = context.model.IsStaged;

				context.template = $.telligent.evolution.template(context.template);
				context.headerTemplate = $.telligent.evolution.template(context.headerTemplate);
				context.actionsTemplate = $.telligent.evolution.template(context.actionsTemplate);
				context.componentsTemplate = $.telligent.evolution.template(context.componentsTemplate);
				context.stateTemplate = $.telligent.evolution.template(context.stateTemplate);
				context.listTemplate = $.telligent.evolution.template(context.listTemplate);

				initUi(context);
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

				context.container.find('.theme-name').text(options.model.Name);

				if(context.model.State !== context.lastState ||
					context.model.lastStaged !== context.IsStaged)
				{
					loadAndRender(context);
				}
				context.lastState = context.model.State;
				context.lastStaged = context.model.IsStaged;
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

	return ThemeLayoutsView;

}, jQuery, window);