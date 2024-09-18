/*
StudioTemplateApiDataModel

Provides cached suggestions for property template autocompletion

methods:
	listSuggestions(options)
		options:
			prefix
		returns
			promised array of suggestions
	clearSuggestionCache()
	getRendered
		index: rendered member index
		member: rendered member
	getRenderedType
		type: rendered type
	getRenderedIndex
		index: rendered member index
	getRenderedStaticDocumentation
		content: rendered content
	evaluate(options)
		options:
			input
		returns
			promised:
				date
				type
				input
				output
 */
define('StudioTemplateApiDataModel', function($, global, undef) {

	var emptyPromise = $.Deferred(function(d){
		d.resolve([]);
	}).promise();

	// defaults
	var defaults = {
		provider: null
	};

	function ensureApiLoaded(context, options) {
		if(!context.apiLoader) {
			context.apiLoader = $.Deferred(function(d){
				context.provider.listPropertyTemplates(options).then(function(api){
					processTemplates(context, api);
					d.resolve();
				});
			}).promise();
		}
		return context.apiLoader;
	}

	function processTemplates(context, api) {
		context.templates = [];
		for(var i = 0; i < api.templates.length; i++) {
			var processedFunction = processTemplate(api.templates[i]);
			context.templates.push(processedFunction);
		}
	}

	function processTemplate(templ) {
		templ.name = 'template="' + templ.Name + '"';
		templ.caption = 'template="' + templ.Name + '"';
		templ.value = templ.Signature || ('template="' + templ.Name + '"');
		templ.score = 5000;
		templ.doc = templ.RenderedDoc;
		templ.meta = templ.Type;
		return templ;
	}

	function listTemplateSuggestions(context, options) {
		return ensureApiLoaded(context, options).then(function(){
			return context.templates;
		});
	}

	var StudioTemplateApiDataModel = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			/*
			options:
				fragmentId
				prefix
				completeFullMemberSignature
			*/
			listSuggestions: function(opts) {
				// otherwise, return list of members
				return listTemplateSuggestions(context, opts).then(function(r){
					return r;
				});
			},
			/*
			Clears processed suggestion caches
			*/
			clearSuggestionCache: function() {
				context.apiLoader = null;
				context.templates = [];
			},
			/*
			options:
				fragmentId
				name
			returns:
				index: rendered member index
				member: rendered member
			*/
			getRendered: function(options) {
				return context.provider.getRendered(options);
			},
			/*
			options:
				name:
			returns:
				type: rendered type
			*/
			getRenderedType: function(options) {
				return context.provider.getRenderedType(options);
			},
			/*
			options:
				fragmentId
			returns:
				index: rendered member index
			*/
			getRenderedIndex: function(options) {
				return context.provider.getRenderedIndex(options);
			},
			/*
			options:
				resource
			returns:
				content: rendred content
			*/
			getRenderedStaticDocumentation: function(options) {
				return context.provider.getRenderedStaticDocumentation(options);
			},
			/*
			options:
				input
			*/
			evaluate: function(options) {
				return context.provider.evaluate(options);
			}
		}
	};

	return StudioTemplateApiDataModel;

}, jQuery, window);
