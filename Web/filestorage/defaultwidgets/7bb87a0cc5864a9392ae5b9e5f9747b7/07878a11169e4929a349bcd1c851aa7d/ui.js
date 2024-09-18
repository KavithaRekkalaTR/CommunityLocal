(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    $.telligent.evolution.widgets.achievementList = {
        register: function (context) {
        	context.thumbnailsContainer
				.on('click', '.content-item', function(e){
    					var elm = $(this);
    					var url = elm.data('url');
    					if (url) {
    						window.location = url;
					}
				});
        }
    };
})(jQuery, window);
