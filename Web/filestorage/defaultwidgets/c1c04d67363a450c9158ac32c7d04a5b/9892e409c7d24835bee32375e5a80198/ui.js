(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.cacheConfiguration = {
		register: function(options) {
		    
			$.telligent.evolution.administration.header($.telligent.evolution.template.compile(options.templates.headerId)());
			$.telligent.evolution.administration.header().find('.button.save').on('click', function() {
			    var b = $(this);
				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					$.telligent.evolution.post({
						url: options.urls.save,
						data: {
							cacheMemoryLimitMegabytes: options.inputs.cacheMemoryLimitMegabytes.val(),
							cacheRollingTimeoutMinutes: options.inputs.cacheRollingTimeoutMinutes.val()
                        }
					})
						.then(function(response) {
							options.inputs.cacheMemoryLimitMegabytes.val(response.cacheMemoryLimitMegabytes);
							options.inputs.cacheRollingTimeoutMinutes.val(response.cacheRollingTimeoutMinutes);
							
							$.telligent.evolution.notifications.show(options.text.saveSuccess, {
								type: 'success'
							});
						})
						.always(function() {
							b.removeClass('disabled');
						})
				}

				return false;
			});
		}
	};
}(jQuery, window));