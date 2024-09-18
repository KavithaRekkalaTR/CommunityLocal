define('main', ['DataProvider', 'Controller'], function(DataProvider, Controller, $, global, undef)
{
	var api = {
		register: function(options) {
			var context = options;

			// model
			var dataProvider = new DataProvider(context.urls);

			// controller
			var controller = new Controller({
				dataProvider: dataProvider,
				templates: context.templates,
				resources: context.resources,
				editableExtensions: context.editableExtensions,
				urls: context.urls,
				hosts: context.hosts,
				developerModeEnabled: context.developerModeEnabled,
				languagesCount: context.languagesCount
			});

			controller.run();
		},
		LOGGING_ENABLED: false
	};

	return api;

}, jQuery, window);
