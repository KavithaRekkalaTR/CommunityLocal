/*
StudioPaletteApiDataModel

Provides cached suggestions for palette type autocompletion. At this time, all static.

methods:
	listSuggestions(options)
		options:
			prefix
		returns
			promised array of suggestions

 */
define('StudioPaletteApiDataModel', function($, global, undef) {

	var emptyPromise = $.Deferred(function(d){
		d.resolve([]);
	}).promise();

	// defaults
	var defaults = {
		templateModel: null,
		ruleModel: null
	};

	// static suggestions for palette definition syntax
	var paletteDefinitionSuggestions = [
		{ name: '<paletteType>', sig: 'paletteType id="paletteTypeId" name="Palette Type Name">'},
		{ name: '<palette>', sig: 'palette id="paletteId" name="Palette Name" previewCss="background-color:#FFFFFF; color:#000000; padding:15px; font-weight:600;" default="false">'},
		{ name: '<value>', sig: 'value id="paletteValueId" dataType="Color">#FFFFFF</value>'},
		{ name: '</palette>', sig: 'palette>'},
		{ name: '</paletteType>', sig: 'paletteType>'}
	];

	function ensureApiLoaded(context, options) {
		if(!context.apiLoader) {
			context.apiLoader = $.Deferred(function(d){
				context.paletteDefinitionSuggestions = paletteDefinitionSuggestions.map(function(s) {
					return processRawPaletteDefinitionSuggestion(s);
				});
				d.resolve();
			}).promise();
		}
		return context.apiLoader;
	}

	function processRawPaletteDefinitionSuggestion(suggestion) {
		return {
			name: suggestion.name,
			caption: suggestion.name,
			value: suggestion.sig,
			score: 5000,
			doc: '',
			meta: 'Palette'
		}
	}

	function listpaletteDefinitionSuggestions(context, options) {
		return ensureApiLoaded(context, options).then(function(){
			return context.paletteDefinitionSuggestions;
		});
	}

	var StudioPaletteApiDataModel = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			/*
			options:
				prefix
				completeFullMemberSignature
			*/
			listSuggestions: function(opts) {
				return listpaletteDefinitionSuggestions(context, opts).then(function(r){
					return r;
				});
			}
		}
	};

	return StudioPaletteApiDataModel;

}, jQuery, window);
