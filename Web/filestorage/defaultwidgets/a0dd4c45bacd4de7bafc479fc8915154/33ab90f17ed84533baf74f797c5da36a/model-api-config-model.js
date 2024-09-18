/*
StudioConfigApiDataModel

Provides cached suggestions for config autocompletion including current rules, templates, and general dynamic configuration syntax

methods:
	listSuggestions(options)
		options:
			prefix
		returns
			promised array of suggestions

 */
define('StudioConfigApiDataModel', function($, global, undef) {

	var emptyPromise = $.Deferred(function(d){
		d.resolve([]);
	}).promise();

	// defaults
	var defaults = {
		templateModel: null,
		ruleModel: null
	};

	// raw non-dynamic (template, rule) suggestions for dynamic configuration syntax
	var configurationSuggestions = [
		{ name: '<property labelResourceName="" />', sig: 'property id="" labelResourceName="" descriptionResourceName="" dataType="" defaultValue=""  />' },
		{ name: '<property labelText="" />', sig: 'property id="" labelText="" descriptionText="" dataType="" defaultValue=""  />' },

		{ name: '<propertyValue labelResourceName="" />', sig: 'propertyValue value="" labelResourceName="" />' },
		{ name: '<propertyValue labelText="" />', sig: 'propertyValue value="" labelText="" />' },

		{ name: '<propertyRule />', sig: 'propertyRule  />' },

		{ name: '<propertyGroup labelResourceName="" />', sig: 'propertyGroup id="" labelResourceName="" descriptionResourceName="">' },
		{ name: '<propertyGroup labelText="" />', sig: 'propertyGroup id="" labelText="" descriptionText="">' },
		{ name: '</propertyGroup>', sig: '/propertyGroup>' },

		{ name: '<propertySubGroup labelResourceName="" />', sig: 'propertySubGroup id="" labelResourceName="" descriptionResourceName="">' },
		{ name: '<propertySubGroup labelText="" />', sig: 'propertySubGroup id="" labelText="" descriptionText="">' },
		{ name: '</propertySubGroup>', sig: '/propertySubGroup>' }
	];

	function ensureApiLoaded(context, options) {
		if(!context.apiLoader) {
			context.apiLoader = $.Deferred(function(d){
				$.when(context.templateModel.listSuggestions({ prefix: '' }),
					context.ruleModel.listSuggestions({ prefix: '' })).then(function(templates, rules)
				{
					context.configSuggestions = templates.concat(rules).concat(configurationSuggestions.map(function(s) {
						return processRawConfigurationSuggestion(s);
					}));
					d.resolve();
				});
			}).promise();
		}
		return context.apiLoader;
	}

	function processRawConfigurationSuggestion(suggestion) {
		return {
			name: suggestion.name,
			caption: suggestion.name,
			value: suggestion.sig,
			score: 5000,
			doc: '',
			meta: 'Config'
		}
	}

	function listConfigSuggestions(context, options) {
		return ensureApiLoaded(context, options).then(function(){
			return context.configSuggestions;
		});
	}

	var StudioConfigApiDataModel = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			/*
			options:
				prefix
				completeFullMemberSignature
			*/
			listSuggestions: function(opts) {
				// otherwise, return list of members
				return listConfigSuggestions(context, opts).then(function(r){
					return r;
				});
			}
		}
	};

	return StudioConfigApiDataModel;

}, jQuery, window);
