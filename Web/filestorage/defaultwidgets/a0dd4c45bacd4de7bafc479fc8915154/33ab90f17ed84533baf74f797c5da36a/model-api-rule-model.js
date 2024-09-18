/*
StudioRuleApiDataModel

Provides cached suggestions for property rule autocompletion

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
define('StudioRuleApiDataModel', function($, global, undef) {

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
				context.provider.listPropertyRules(options).then(function(api){
					processRules(context, api);
					d.resolve();
				});
			}).promise();
		}
		return context.apiLoader;
	}

	function processRules(context, api) {
		context.rules = [];
		for(var i = 0; i < api.rules.length; i++) {
			var processedFunction = processRule(api.rules[i]);
			context.rules.push(processedFunction);
		}
	}

	function processRule(rule) {
		rule.name = 'name="' + rule.Name + '"';
		rule.caption = 'name="' + rule.Name + '"';
		rule.value = rule.Signature || ('name="' + rule.Name + '"');
		rule.score = 5000;
		rule.doc = rule.RenderedDoc;
		rule.meta = rule.Type;
		return rule;
	}

	function listRuleSuggestions(context, options) {
		return ensureApiLoaded(context, options).then(function(){
			return context.rules;
		});
	}

	var StudioRuleApiDataModel = function(options){
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
				return listRuleSuggestions(context, opts).then(function(r){
					return r;
				});
			},
			/*
			Clears processed suggestion caches
			*/
			clearSuggestionCache: function() {
				context.apiLoader = null;
				context.rules = [];
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

	return StudioRuleApiDataModel;

}, jQuery, window);
