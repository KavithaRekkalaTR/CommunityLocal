(function ($) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
        
    var attachHandlers = function (context) {
        $(context.wrapper).on('change', 'select', function () {
            var s = $(this);
            window.location = $.telligent.evolution.url.modify({
                query: s.data('parameter') + '=' + s.val()
            });
        });
	};

    $.telligent.evolution.widgets.eventRegistrationSort = {
        register: function(context) {
            attachHandlers(context);
        }
    };
})(jQuery);
