/*
StudioApiDataModel

Provides cached suggestions for autocompletion

methods:
	listSuggestions(options)
		options:
			mode: velocity|javascript|less|template|rule
			prefix
			fragmentId
		returns
			promised array of suggestions
	clearSuggestionCache()
	getRendered
		mode: velocity|javascript|less|template|rule
		index: rendered member index
		member: rendered member
	getRenderedType
		mode: velocity|javascript|less|template|rule
		type: rendered type
	getRenderedIndex
		mode: velocity|javascript|less|template|rule
		fragmentId: optional fragment id
	getRenderedStaticDocumentation
		content: rendered content
	evaluate(options)
		options:
			input
			mode
		returns
			promised:
				date
				type
				input
				output
 */
define('StudioApiDataModel', function($, global, undef) {

	var emptyPromise = $.Deferred(function(d){
		d.resolve([]);
	}).promise();

	// defaults
	var defaults = {
		modes: {}
	};

	var StudioApiDataModel = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			/*
			options:
				mode: velocity|javascript|less|template|rule
				fragmentId
				prefix
				completeFullMemberSignature
			*/
			listSuggestions: function(opts) {
				opts.mode = opts.mode || 'velocity';
				if (!context.modes[opts.mode]) {
					return emptyPromise;
				} else {
					return context.modes[opts.mode].listSuggestions(opts).then(function(r){
						return r;
					});
				}
			},
			/*
			Clears processed suggestion caches
			*/
			clearSuggestionCache: function() {
				$.each(context.modes, function(mode, model){
					if(model.clearSuggestionCache)
						model.clearSuggestionCache();
				});
			},
			/*
			options:
				mode: velocity|javascript|less|template|rule
				fragmentId
				name
			returns:
				index: rendered member index
				member: rendered member
			*/
			getRendered: function(opts) {
				opts.mode = opts.mode || 'velocity';
				if (!context.modes[opts.mode]) {
					return emptyPromise;
				} else {
					return context.modes[opts.mode].getRendered(opts);
				}
			},
			/*
			options:
				mode: velocity|javascript|less|template|rule
				name:
			returns:
				type: rendered type
			*/
			getRenderedType: function(opts) {
				opts.mode = opts.mode || 'velocity';
				if (!context.modes[opts.mode]) {
					return emptyPromise;
				} else {
					return context.modes[opts.mode].getRenderedType(opts);
				}
			},
			/*
			options:
				mode: velocity|javascript|less|template|rule
				fragmentId
			returns:
				index: rendered member index
			*/
			getRenderedIndex: function(opts) {
				opts.mode = opts.mode || 'velocity';
				if (!context.modes[opts.mode]) {
					return emptyPromise;
				} else {
					return context.modes[opts.mode].getRenderedIndex(opts);
				}
			},
			/*
			options:
				resource
			returns:
				content: rendred content
			*/
			getRenderedStaticDocumentation: function(opts) {
				opts.mode = opts.mode || 'velocity';
				if (!context.modes[opts.mode]) {
					return emptyPromise;
				} else {
					return context.modes[opts.mode].getRenderedStaticDocumentation(opts);
				}
			},
			/*
			options:
				input
				mode
			*/
			evaluate: function(opts) {
				opts.mode = opts.mode || 'velocity';
				if (!context.modes[opts.mode]) {
					return emptyPromise;
				} else {
					return context.modes[opts.mode].evaluate(opts);
				}
			}
		}
	};

	return StudioApiDataModel;

}, jQuery, window);
