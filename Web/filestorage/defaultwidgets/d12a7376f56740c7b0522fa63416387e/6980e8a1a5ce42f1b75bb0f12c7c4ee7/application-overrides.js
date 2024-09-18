(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.scorePluginApplicationOverrides = {
		register: function(context) {

			context.applicationOverridesScrollable = $(context.applicationList).evolutionScrollable({
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: context.urls.listApplications,
							data: {
								w_pageindex: pageIndex
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (items.length > 0) {
								if (r.data('hasmore') === true) {
									d.resolve(items);
								} else {
									d.reject();
								}
							} else {
								context.applicationList.parent().append(response);
								d.reject();
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('scoreplugin.revertapplicationoverride', function(data) {
				if (global.confirm(context.text.revertApplicationOverrideConfirmation.replace(/\{0\}/g, $(data.target).data('applicationname')))) {
					$.telligent.evolution.post({
						url: context.urls.revert,
						data: {
							application: $(data.target).data('applicationid')
						}
					})
						.then(function() {
						   $.telligent.evolution.notifications.show(context.text.revertApplicationOverrideSuccessful.replace(/\{0\}/g, $(data.target).data('applicationname')), {
								type: 'success'
							});
							$(data.target).closest('.content-item.application-override').slideUp('fast', function() {
								$(this).remove();
								if (context.applicationList.find('li.content-item').length == 0) {
									context.applicationList.empty();
									context.applicationOverridesScrollable.reset();
								}
							});
						});
				}
			});
		}
	};

}(jQuery, window));