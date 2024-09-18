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
				providerCategories: context.providerCategories,
				urls: context.urls,
				developerModeEnabled: context.developerModeEnabled
			});

			controller.run();
		},
		LOGGING_ENABLED: false
	};

	return api;

}, jQuery, window);
