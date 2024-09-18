(function($){
	var api = {
		register: function(context) {
			context = $.extend({}, api.defaults, context);

			$(context.submitCapture).on('click', function(e){
				e.preventDefault();
				window.location.href = $(context.wikiSelect).val();
				return false;
			});
		}
	};
	$.extend(api, {
		defaults: {
			wrapperId: '',
			wikiCaptureUrl: null,
			wikiSelect: '',
			submitCapture: ''
		}
	});

	// expose api in a public namespace
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.captureThread = api;

}(jQuery));
