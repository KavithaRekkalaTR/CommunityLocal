define('main', ['DataProvider', 'Tests'], function(DataProvider, Tests, $, global, undef)
{
	var api = {
		register: function(options) {
			var context = options;

			// model
			var dataProvider = new DataProvider(context.urls);

			$.telligent.evolution.messaging.subscribe('studio.tests.run', function(data){
				if($(data.target).hasClass('disabled'))
					return;
				$(data.target).addClass('disabled');

				var developerModeEnabled = $(data.target).data('developermode');

				Tests.run(dataProvider, developerModeEnabled);
			});
		},
		LOGGING_ENABLED: false
	};

	return api;

}, jQuery, window);
