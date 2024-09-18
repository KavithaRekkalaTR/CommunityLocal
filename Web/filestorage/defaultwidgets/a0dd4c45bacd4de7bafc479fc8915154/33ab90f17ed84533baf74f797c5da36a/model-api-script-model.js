/*
StudioScriptApiDataModel

Provides cached suggestions for API script (either velocity or javascript) autocompletion
Currently limited only to extension and extension members

methods:
	listSuggestions(options)
		options:
			prefix
			fragmentId
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
			mode
		returns
			promised:
				date
				type
				input
				output
 */
define('StudioScriptApiDataModel', function($, global, undef) {

	var emptyPromise = $.Deferred(function(d){
		d.resolve([]);
	}).promise();

	// defaults
	var defaults = {
		provider: null,
		language: 'velocity' // velocity|javascript
	};

	function ensureApiLoaded(context) {
		if(!context.apiLoader) {
			context.apiLoader = $.Deferred(function(d){
				context.provider.listApi({ language: context.language }).then(function(api){
					processExtensions(context, api);
					d.resolve();
				});
			}).promise();
		}
		return context.apiLoader;
	}

	function processExtensions(context, api) {
		context.publicExtensions = [];
		context.privateExtensions = {};
		context.extensionMap = {};
		for(var i = 0; i < api.extensions.length; i++) {
			var processedExtension = processExtension(api.extensions[i], context.language);
			if(processedExtension.InstanceIdentifier) {
				if(!context.privateExtensions[processedExtension.InstanceIdentifier]) {
					context.privateExtensions[processedExtension.InstanceIdentifier] = [];
				}
				// private apis should show up higher
				processExtension.score = 10000;
				context.privateExtensions[processedExtension.InstanceIdentifier].push(processedExtension);
			} else {
				context.publicExtensions.push(processedExtension);
			}
			context.extensionMap[buildExtensionId(api.extensions[i].Name, api.extensions[i].InstanceIdentifier)] = processedExtension;
		}
	}

	function buildExtensionId(extensionName, fragmentId) {
		return (fragmentId || '') + ':' + extensionName;
	}

	function processExtension(extension, language) {
		var prefix = (language == 'velocity' ? '$' : '');
		extension.name = prefix + extension.Name;
		extension.value = prefix + extension.Name;
		extension.score = 5000;
		extension.doc = extension.RenderedDoc;
		extension.meta = extension.Type;
		return extension;
	}

	// collect members of an extension for use in ACE auto completion, and cache with extension
	function processMembers(context, extension, completeFullMemberSignature, language) {
		var prefix = (language == 'velocity' ? '$' : '');
		extension.processedMembers = [];
		if(extension.Properties) {
			for(var i = 0; i < extension.Properties.length; i++) {
				extension.processedMembers.push({
					caption: prefix + extension.Name + '.' + extension.Properties[i].Name,
					name: prefix + extension.Name + '.' + extension.Properties[i].Name,
					value: (completeFullMemberSignature
						? (extension.Properties[i].Signature || (prefix + extension.Name + '.' + extension.Properties[i].Name))
						: (prefix + extension.Name + '.' + extension.Properties[i].Name)),
					score: 15000,
					doc:  extension.Properties[i].RenderedDoc,
					meta: extension.Properties[i].Type
				})
			}
		}
		if(extension.Methods) {
			for(var i = 0; i < extension.Methods.length; i++) {
				extension.processedMembers.push({
					caption: prefix + extension.Name + '.' + extension.Methods[i].Name + '()',
					name: prefix + extension.Name + '.' + extension.Methods[i].Name,
					value: (completeFullMemberSignature
						? (extension.Methods[i].Signature || (prefix + extension.Name + '.' + extension.Methods[i].Name))
						: (prefix + extension.Name + '.' + extension.Methods[i].Name)),
					score: 10000,
					doc: extension.Methods[i].RenderedDoc,
					meta: extension.Methods[i].Type
				})
			}
		}
	}

	/*
	options
		fragmentId
	*/
	function listExtensionSuggestions(context, options) {
		return ensureApiLoaded(context).then(function(){
			if(options.fragmentId) {
				var privateExtensions = context.privateExtensions[options.fragmentId];
				if(privateExtensions) {
					return privateExtensions.concat(context.publicExtensions);
				} else {
					return context.publicExtensions;
				}
			} else {
				return context.publicExtensions;
			}
		});
	}

	/*
	options
		fragmentId
		extensionName
		completeFullMemberSignature
	*/
	function listExtensionMemberSuggestions(context, options) {
		return ensureApiLoaded(context).then(function(){
			var extension = context.extensionMap[buildExtensionId(options.extensionName, options.fragmentId)];
			if(!extension) {
				extension = context.extensionMap[buildExtensionId(options.extensionName, '')];
			}
			if(!extension) {
				return emptyPromise;
			}
			if(!extension.processedMembers) {
				processMembers(context, extension, options.completeFullMemberSignature, context.language);
			}
			return extension.processedMembers;
		});
	}

	var StudioScriptApiDataModel = function(options){
		var context = $.extend({}, defaults, options || {});


		var prefixRegex;
		if(context.language == 'velocity') {
			prefixRegex = /^\$([a-zA-Z_0-9]+)\./;
		} else {
			prefixRegex = /^([a-zA-Z_0-9]+)\./;
		}

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

				// determine if prefix includes a full extension name
				var matches = prefixRegex.exec(opts.prefix);
				// prefix includes a full extextension ($core_v2_something)
				if(matches && matches.length > 1 && matches[1].length > 0) {
					// return list of members for extension
					return listExtensionMemberSuggestions(context, {
						fragmentId: opts.fragmentId,
						extensionName: matches[1],
						completeFullMemberSignature: opts.completeFullMemberSignature
					});
				} else {
					// otherwise, return list of extensions
					return listExtensionSuggestions(context, {
						fragmentId: opts.fragmentId
					}).then(function(r){
						return r;
					});
				}
			},
			/*
			Clears processed suggestion caches
			*/
			clearSuggestionCache: function() {
				context.apiLoader = null;
				context.publicExtensions = [];
				context.privateExtensions = {};
				context.extensionMap = {};
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
				mode
			*/
			evaluate: function(options) {
				return context.provider.evaluate(options);
			}
		}
	};

	return StudioScriptApiDataModel;

}, jQuery, window);
