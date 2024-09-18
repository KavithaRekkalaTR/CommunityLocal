/*
StudioSettings

Client-side persisted user-specific editor settings
	Can share settings across all instances or per instance based on storageKey

API:

var settings = new StudioSettings(options)
	options:
		storageKey: 'editor-settings'

var settings = settings.get();

settings.set(settings);

*/
define('StudioSettings', [ 'StudioStorageProxy' ], function(StudioStorageProxy, $, global, undef) {

	var defaults = {
		storageKey: 'editor-settings'
	};

	var defaultEditorSettings = {
		theme: 'fusion',
		gutter: true,
		wordWrap: false,
		syncTree: true,
		completeFullMemberSignature: true
	};

	var StudioSettings = function(options){

		var context = $.extend({}, defaults, options || {});
		context.storageProxy = new StudioStorageProxy($.telligent.evolution.user.accessing);

		return {
			get: function() {
				// first try to use local copy of editor settings
				if(context.editorSettings) {
					return context.editorSettings;
				}

				// if not local, look in local storage
				var savedSettings = context.storageProxy.get(context.storageKey);
				if(savedSettings) {
					context.editorSettings = $.extend({}, defaultEditorSettings, savedSettings);
					return context.editorSettings;
				}

				// if not in local storage, use defaults
				context.editorSettings = defaultEditorSettings;
				return context.editorSettings;
			},
			set: function(settings) {
				context.storageProxy.set(context.storageKey, settings);
				context.editorSettings = settings;
			}
		};
	};

	return StudioSettings;

}, jQuery, window);
