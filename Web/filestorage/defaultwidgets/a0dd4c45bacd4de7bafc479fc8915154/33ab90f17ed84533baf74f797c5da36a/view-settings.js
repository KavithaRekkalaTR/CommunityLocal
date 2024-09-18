/*

StudioSettingsView

options:
	template: '',
	onGetSettings: function() {},
	onChange: function(settings) { }

methods:
	show(options)

*/
define('StudioSettingsView', function($, global, undef) {

	var defaults = {
		template: 'studioShell-settings',
		onGetSettings: function() {},
		onChange: function(settings) { }
	};

	var StudioSettingsView = function(options) {
		var context = $.extend({}, defaults, options || {});

		context.template = $.telligent.evolution.template(context.template);

		return {
			show: function(options) {
				var editorSettings = context.onGetSettings();

				var content = $(context.template({
					editorSettings: editorSettings
				}));

				content.on('change', 'select.theme', function(e){
					context.onChange($.extend(editorSettings, {
						theme: $(e.target).val()
					}));
				});

				content.on('change', 'input.gutter', function(e){
					context.onChange($.extend(editorSettings, {
						gutter: $(e.target).is(':checked')
					}));
				});

				content.on('change', 'input.syncTree', function(e){
					context.onChange($.extend(editorSettings, {
						syncTree: $(e.target).is(':checked')
					}));
				});

				content.on('change', 'input.completeFullMemberSignature', function(e){
					context.onChange($.extend(editorSettings, {
						completeFullMemberSignature: $(e.target).is(':checked')
					}));
				});

				content.on('change', 'input.wordWrap', function(e){
					context.onChange($.extend(editorSettings, {
						wordWrap: $(e.target).is(':checked')
					}));
				});

				var modal = $.glowModal({
					title: context.resources.settings,
					html: content,
					width: 550,
					height: '100%'
				});
			}
		}
	};

	return StudioSettingsView;

}, jQuery, window);
