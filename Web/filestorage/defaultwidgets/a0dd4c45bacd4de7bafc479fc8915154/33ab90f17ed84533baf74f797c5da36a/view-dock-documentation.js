define('StudioApiDocumentationDockView', [
	'StudioApiDocumentation',
	'StudioApiDataModelProvider' ],
function(StudioApiDocumentation,
	StudioApiDataModelProvider,
	$, global, undef) {

	var defaults = {
		template: 'studioShell-documentation',
		breadCrumbTemplate: 'studioShell-documentationBreadcrumb',
		getRendered: StudioApiDataModelProvider.model().getRendered,
		getRenderedType: StudioApiDataModelProvider.model().getRenderedType,
		getRenderedIndex: StudioApiDataModelProvider.model().getRenderedIndex,
		getStaticContent: StudioApiDataModelProvider.model().getRenderedStaticDocumentation,
		name: '',
		includeAutomationEvents: false
	};

	function hideExistingDocumentationInstances(context) {
		$.each(context.documentationInstances, function(k,v){
			v.hide();
		});
	}

	function getOrCreateDocumentationFor(context, fragmentId, container) {
		if(!context.documentationInstances) {
			context.documentationInstances = {};
		}
		if(!fragmentId) {
			if(!context.documentationInstances.generic) {
				context.documentationInstances.generic = new StudioApiDocumentation({
					container: container,
					template: $.telligent.evolution.template(context.template),
					breadCrumbTemplate: $.telligent.evolution.template(context.breadCrumbTemplate),
					getRendered: context.getRendered,
					getRenderedType: context.getRenderedType,
					getRenderedIndex: context.getRenderedIndex,
					getStaticContent: context.getStaticContent,
					includeAutomationEvents: context.includeAutomationEvents
				});
			}
			return context.documentationInstances.generic;
		} else {
			if(!context.documentationInstances[fragmentId]) {
				context.documentationInstances[fragmentId] = new StudioApiDocumentation({
					container: container,
					template: $.telligent.evolution.template(context.template),
					breadCrumbTemplate: $.telligent.evolution.template(context.breadCrumbTemplate),
					fragmentId: fragmentId,
					getRendered: context.getRendered,
					getRenderedType: context.getRenderedType,
					getRenderedIndex: context.getRenderedIndex,
					getStaticContent: context.getStaticContent,
					includeAutomationEvents: context.includeAutomationEvents
				});
			}
			return context.documentationInstances[fragmentId];
		}
	}

	function StudioApiDocumentationDockView(options) {

		var context = $.extend({}, defaults, options || {});

		// create a cache of widget-specific documentation instances
		// as each instane could have a different set of documentation
		// as well as its own unique UI state
		context.documentationInstances = {};
		context.rendered = false;

		return {
			id: 'documentation_dock_view',
			name: context.name,
			render: function(options) {
				context.container = options.container;
				hideExistingDocumentationInstances(context);

				context.renderPromise = $.Deferred(function(d){

					var documentationInstance = getOrCreateDocumentationFor(context,
						((options.editorTabState && options.editorTabState.id) ? options.editorTabState.id : null),
						options.container);
					documentationInstance.show();

					context.rendered = true;
					d.resolve();
				}).promise();

				return context.renderPromise;
			},
			cleanup: function() {},
			setEditorTabState: function(requestState) {
				if(context.renderPromise) {
					context.renderPromise.then(function(){
						hideExistingDocumentationInstances(context);
						var documentationInstance = getOrCreateDocumentationFor(context,
							((requestState && requestState.id) ? requestState.id : null),
							context.container);
						documentationInstance.show();
					});
				}
			},
			hidden: function() {},
			shown: function(options) {
				if(options && context.renderPromise) {
					context.renderPromise.then(function(){
						// get the documentation instance for the fragment id being shown (if any)
						hideExistingDocumentationInstances(context);
						var documentationInstance = getOrCreateDocumentationFor(context,
							((options && options.fragmentId) ? options.fragmentId : null),
							context.container);

						if(documentationInstance) {
							documentationInstance.show(options);
						}
					});
				}
			},
			resized: function() {}
		}
	}

	return StudioApiDocumentationDockView;

}, jQuery, window);
