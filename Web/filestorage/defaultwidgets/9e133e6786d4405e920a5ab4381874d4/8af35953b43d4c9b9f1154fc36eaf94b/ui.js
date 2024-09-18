(function($, window, undefined){

	function resize(elm) {
		elm.evolutionSqueezeText();
		elm.on('resized', function(){
			elm.evolutionSqueezeText();
		});
	}

	var api = {
		register: function(options) {
			var wrapper = $(options.wrapper);
			var tabs = wrapper.find('.ffv-sample-tabs a');
			var samples = wrapper.find('.ffv-sample');
			var interactive = samples.filter('.interactive');
			var output = wrapper.find('.ffv-output');

			if(!$.telligent.evolution.fileViewers.fontSupport.supports(options.type)) {
				wrapper.find('.default').show();
				return;
			} else {
				wrapper.find('.viewer').show();
			}

			samples.first().show();

			if(document.fonts && document.fonts.ready) {
				document.fonts.ready.then(function () {
					resize(wrapper.find('.ffv-glyph').evolutionTransform({ opacity: 1 }, { duration: 200 }));
				});
			} else {
				resize(wrapper.find('.ffv-glyph').evolutionTransform({ opacity: 1 }, { duration: 200 }));
			}

			tabs.on('click', function(e){
				tabs.removeClass('selected');
				$(this).addClass('selected');

				samples.hide();
				samples.filter('.' + $(this).data('type')).show();

				return false;
			});

			output.css({ 'font-size': '16px' });
			interactive.find('input[type="range"]').on('input', function(e){
				output.css({ 'font-size': $(this).val() + 'px' });
			});
			interactive.find('select.ffv-font-style').on('change', function(){
				output.css({ 'font-style': $(this).val() });
			});
			interactive.find('select.ffv-font-weight').on('change', function(){
				output.css({ 'font-weight': $(this).val() });
			});
			interactive.find('input[type="text"]').on('input', function(e){
				output.html($(this).val());
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.fileViewers = $.telligent.evolution.fileViewers || {};
	$.telligent.evolution.fileViewers.font = api;

})(jQuery, window)