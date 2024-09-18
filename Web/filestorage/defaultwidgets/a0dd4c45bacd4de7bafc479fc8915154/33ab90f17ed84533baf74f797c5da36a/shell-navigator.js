/*

StudioNavigator:

routes requests to load views across the URL
handles/processes URL for changes

options
	onSerialize: function(request)
	onDeserialize: function(serializedRequest)
	onLoad: function(options)
		injected logic:
			first, the navigator tries to get it from getRenderedModel
			otherwise, loads via the model

		options:
			// whatever was serialized
	onPrefix
	onDePrefix
	rootUrl
Raises messages:
	studio.view.render
Methods:
	.adjustCurrentWithoutProcess: function(request)
	.request(options)
		Adjusts current hash based on items in request
		options:
			type
			id
			theme
			attachment
			line
	.processRequest(rawRequest)
		stringRequest - when null, looks at current hash
			otherwise, deserializes it
		returns current request
	.registerHandlers(),
	.unregisterHandlers()
	// generates unique string (in querystring format) for a request model in a predictable order
	.serialize(request)
	// deserializes query string format to obj
	.parse(serialized)
*/
define('StudioNavigator', function($, global, undef) {

	var messaging = $.telligent.evolution.messaging,
		administration = $.telligent.evolution.administration,
		url = $.telligent.evolution.url;

	var defaults = {
		rootUrl: '',
		onLoad: function(request) {},
		onSerialize: function(request, options) {},
		onDeserialize: function(serializedRequest) {},
		onPrefix: function(options) {},
		onDePrefix: function(options) {}
	};

	function loadAndRenderRequest(context, request) {
		return $.Deferred(function(d){
			if(request && typeof(request.id) !== 'undefined' && request.id !== null) {
				context.onLoad(request).then(function(model){
					if(!model) {
						d.reject();
						return;
					}
					messaging.publish('studio.view.render', {
						reqkey: context.onSerialize(request, {
							includeLineNumber: true,
							includeAttachment: true
						}),
						model: model
					});
					d.resolve();
				});
			}
		}).promise();
	}

	function processCurrentHashData(context) {
		if(context.suppressProcess) {
			context.suppressProcess = false;
			return;
		}
		// process current request
		var request = context.onDePrefix(url.hashData());
		loadAndRenderRequest(context, request);

		return request;
	}

	var StudioNavigator = function(options){
		var context = $.extend({}, defaults, options || {});
		context.suppressProcess = false;

		return {
			// suppresses processing of hash change
			// while updating the current hash to match the
			// new passed request. Useful for renames
			adjustCurrentWithoutProcess: function(request) {
				context.suppressProcess = true
				url.hashData(context.onPrefix(request));
			},
			request: function(request) {
				if(!request)
					global.location.href = context.rootUrl;
				else
					url.hashData(context.onPrefix(request));
			},
			processCurrent: function() {
				return processCurrentHashData(context);
			},
			registerHandlers: function() {
				// register the hashchange handler for this panel uniquely
				$(global).off('hashchange.studioshell').on('hashchange.studioshell', function(e){
					processCurrentHashData(context);
				});
			},
			unregisterHandlers: function() {
				$(global).off('hashchange.studioshell');
			},
			loadAndRenderRequestWithoutNavigation: function(request) {
				return loadAndRenderRequest(context, request);
			},
			serialize: function(request, options) {
				return context.onSerialize(request, options);
			},
			parse: function(serialized) {
				return context.onDeserialize(serialized);
			}
		}
	};

	return StudioNavigator;

}, jQuery, window);
