/*
var studioApiProvider = new StudioApiDataProvider(options)
	options:
		evaluateUrl: '',
		listApiUrl: '',
		renderedExtensionUrl: '',
		renderedTypeUrl: '',
		renderedExtensionIndexUrl: '',
		renderedStaticDocUrl: '',
		listLessFunctionsUrl: '',
		renderedFunctionUrl: '',
		listTemplatesUrl: '',
		renderedTemplateUrl: '',
		listRulesUrl: '',
		renderedRuleUrl: ''

low-level REST/JSON methods for interacting with studio shell API

Methods:
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

	listApi(options)
		options:
		returns
			promised object with array of extensions and array of types

	getRendered: function(options) {
		options:
			fragmentId
			name
		returns:
			index: rendered member index
			extension: rendered extension

	getRenderedType: function(options) {
		options:
			name:
		returns:
			type: rendered type

	getRenderedIndex: function(options) {
		options:
			fragmentId
		returns:
			index: rendered extension index

	getRenderedStaticDocumentation: function(options) {
		options:
			resource
		returns:
			content: rendered content
 */
define('StudioApiDataProvider', function($, global, undef) {

	var defaults = {
		evaluateUrl: '',
		listApiUrl: '',
		renderedExtensionUrl: '',
		renderedTypeUrl: '',
		renderedExtensionIndexUrl: '',
		renderedStaticDocUrl: '',
		listLessFunctionsUrl: '',
		renderedFunctionUrl: '',
		listTemplatesUrl: '',
		renderedTemplateUrl: '',
		listRulesUrl: '',
		renderedRuleUrl: ''
	};

	function prefix(options) {
		var data = {};
		$.each(options, function(k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	var StudioApiDataProvider = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			/*
			options:
				input
				mode
			*/
			evaluate: function(options) {
				return $.telligent.evolution.post({
					url: context.evaluateUrl,
					data: prefix(options)
				});
			},
			/*
			listApi(options)
				options:
					language
				returns
					promised object with array of extensions and array of types
			*/
			listApi: function(options) {
				return $.telligent.evolution.get({
					url: context.listApiUrl,
					data: prefix(options || {})
				});
			},
			/*
			listLessFunctions(options)
				options:
				returns
					promised object with array of extensions and array of types
			*/
			listLessFunctions: function(options) {
				return $.telligent.evolution.get({
					url: context.listLessFunctionsUrl,
					data: prefix(options || {})
				});
			},
			/*
			listPropertyTemplates(options)
				options:
				returns
					promised object with array of templates
			*/
			listPropertyTemplates: function(options) {
				return $.telligent.evolution.get({
					url: context.listTemplatesUrl,
					data: prefix(options || {})
				});
			},
			/*
			listPropertyRules(options)
				options:
				returns
					promised object with array of rules
			*/
			listPropertyRules: function(options) {
				return $.telligent.evolution.get({
					url: context.listRulesUrl,
					data: prefix(options || {})
				});
			},
			/*
			options:
				fragmentId
				name
				mode
			returns:
				index: rendered member index
				extension: rendered extension
			*/
			getRendered: function(options) {
				var url;
				if(options.mode == 'velocity')
					url = context.renderedExtensionUrl;
				else if (options.mode == 'rest')
					url = context.renderedRestResourceUrl;
				else if(options.mode == 'less')
					url = context.renderedFunctionUrl;
				else if(options.mode == 'template')
					url = context.renderedTemplateUrl;
				else if(options.mode == 'rule')
					url = context.renderedRuleUrl;

				return $.telligent.evolution.get({
					url: url,
					data: prefix(options || {})
				});
			},
			/*
			options:
				name:
			returns:
				type: rendered type
			*/
			getRenderedType: function(options) {
				return $.telligent.evolution.get({
					url: context.renderedTypeUrl,
					data: prefix(options || {})
				});
			},
			/*
			options:
				fragmentId,
				includeAutomationEvents
			returns:
				index: rendered extension index
			*/
			getRenderedIndex: function(options) {
				return $.telligent.evolution.get({
					url: context.renderedExtensionIndexUrl,
					data: prefix(options || {})
				});
			},
			/*
			options:
				resource
			returns:
				content: rendered content
			*/
			getRenderedStaticDocumentation: function(options) {
				return $.telligent.evolution.get({
					url: context.renderedStaticDocUrl,
					data: prefix(options || {})
				});
			}
		}
	};

	return StudioApiDataProvider;

}, jQuery, window);
