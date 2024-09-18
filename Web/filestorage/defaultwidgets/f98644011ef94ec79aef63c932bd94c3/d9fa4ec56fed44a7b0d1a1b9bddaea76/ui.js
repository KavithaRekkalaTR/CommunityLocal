(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }


	$.telligent.evolution.widgets.reportingConfigurationPanel = {
		register: function(options) {

			var tabs = [];
			$.each(options.tabs, function() {
				var t = this;
				tabs.push({
						name: t.name,
						selected: function() {
							t.element.show();
							},
					unselected: function() {
								t.element.hide();
						}
				});
			});
			options.configApi.registerContent(tabs);

			options.configApi.registerSave(function(saveOptions) {
				$.telligent.evolution.post({
					url: options.urls.saveConfiguration,
					data: {
						TimeZone: options.timeZone.val(),
					}
				})
					.then(function(response) {
                        options.timeZone.val(response.timeZone);
                        saveOptions.success();
					})
					.catch(function() {
						saveOptions.error();
					});
            });

            var resetButton = $('a.reset-button', $.telligent.evolution.administration.panelWrapper());

			resetButton.on('click', function() {
				$.telligent.evolution.post({
					url: options.urls.reset,
					success: function (response) {
                        $.telligent.evolution.notifications.show(options.resources.reportingReset, { type: 'information' });
					}
				});

				return false;
			});
		}
	};

}(jQuery, window));