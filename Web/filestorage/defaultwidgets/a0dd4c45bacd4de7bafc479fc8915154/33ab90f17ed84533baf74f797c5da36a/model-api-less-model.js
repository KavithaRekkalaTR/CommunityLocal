/*
StudioLessApiDataModel

Provides cached suggestions for velocity function autocompletion

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
define('StudioLessApiDataModel', function($, global, undef) {

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
				context.provider.listLessFunctions(options).then(function(api){
					processFunctions(context, api);
					d.resolve();
				});
			}).promise();
		}
		return context.apiLoader;
	}

	function processFunctions(context, api) {
		context.functions = [];
		for(var i = 0; i < api.functions.length; i++) {
			var processedFunction = processFunction(api.functions[i]);
			context.functions.push(processedFunction);
		}
	}

	function processFunction(func) {
		func.name = func.Name;
		func.caption = func.Name + '()'
		func.value = func.Signature || (func.Name + '()');
		func.score = 5000;
		func.doc = func.RenderedDoc;
		func.meta = func.Type;
		return func;
	}

	function listFunctionSuggestions(context, options) {
		return ensureApiLoaded(context, options).then(function(){
			return context.functions;
		});
	}

	var StudioLessApiDataModel = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			/*
			options:
				fragmentId
				prefix
				completeFullMemberSignature
			*/
			listSuggestions: function(opts) {
				if(!opts.prefix) {
					return emptyPromise;
				}

				// otherwise, return list of members
				return listFunctionSuggestions(context, opts).then(function(r){
					return r;
				});
			},
			/*
			Clears processed suggestion caches
			*/
			clearSuggestionCache: function() {
				context.apiLoader = null;
				context.functions = [];
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

	return StudioLessApiDataModel;

}, jQuery, window);
