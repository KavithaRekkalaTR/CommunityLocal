/*
ReportingTabSettings

Client-side persisted user-specific tab filter settings
	Can share settings across all instances or per instance based on storageKey

API:

var settings = new TabSettings(options)
	options:
		storageKey: 'reporting-tab-settings'

var settings = settings.get();

settings.set(settings);

*/
define('ReportingTabSettings', [ 'StudioStorageProxy' ], function(StudioStorageProxy, $, global, undef) {

	var defaults = {
		storageKey: 'reporting-tab-settings'
	};

	var tabs = [];

 var ReportingTabSettings = function(options){

		var context = $.extend({}, defaults, options || {});
		context.storageProxy = new StudioStorageProxy($.telligent.evolution.user.accessing);

		return {
			get: function() {
				// first try to use local copy of editor settings
				if(context.tabSettings) {
					return context.tabSettings;
				}

				// if not local, look in local storage
				var savedTabSettings = context.storageProxy.get(context.storageKey);
				if(savedTabSettings) {
					context.tabSettings = savedTabSettings;
					return context.tabSettings;
				}

				// if not in local storage, use defaults
				context.tabSettings = tabs;
				return context.tabSettings;
			},
			set: function(settings) {
				context.storageProxy.set(context.storageKey, settings);
				context.tabSettings = settings;
			}
		};
	};

	return ReportingTabSettings;

}, jQuery, window);
