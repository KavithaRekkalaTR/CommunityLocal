(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

		function updateVisibleTab(context) {
				var e = context.headerWrapper.find('.filter-option.selected a[data-tab]');
			var tab = context.wrapper.find('.tab.' + e.data('tab'));
			tab.siblings('.tab').css({
					visibility: 'hidden',
					height: '100px',
					width: '800px',
					left: '-1000px',
					position: 'absolute',
						overflow: 'hidden',
						top: '-1000px'
			});
			tab.css({
				 visibility: 'visible',
					height: 'auto',
					width: 'auto',
					left: '0',
					position: 'static',
						overflow: 'visible',
						top: '0'
			});

			$.telligent.evolution.administration.header();
			$.fn.uilinks.forceRender();
		}

		function refresh(context) {
				$.telligent.evolution.get({
						url: context.urls.refresh
				})
						.then(function(response) {
								context.wrapper.find('.tab.usage').html(response.usage);
								context.wrapper.find('.tab.licenses').html(response.licenses);
								context.wrapper.find('.tab.servers').html(response.servers);
						});
		}

	$.telligent.evolution.widgets.licensing = {
		register: function(context) {
			context.headerWrapper = $('<div></div>');

			$.telligent.evolution.administration.header(context.headerWrapper);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

						var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.headerWrapper.on('click', '.filter-option a', function() {
					var e = $(this);
					e.parent().siblings('.filter-option').removeClass('selected');
					e.parent().addClass('selected');

					updateVisibleTab(context);

					return false;
			});

			context.installButton = context.headerWrapper.find('.install');
			context.installButton
					.glowUpload({
						fileFilter: [
								{ title : "License files", extensions : "xml" }
							],
						uploadUrl: context.urls.uploadFile,
						renderMode: 'link'
					})
					.on('glowUploadBegun', function (e) {
						context.installButton.addClass('disabled').html(context.text.installProgress.replace('{0}', 0));
					})
					.on('glowUploadComplete', function (e, file) {
						if (file && file.name.length > 0) {
							context.installButton.addClass('disabled').html(context.text.installing);
							$.telligent.evolution.post({
								url: context.urls.installLicense,
								data: {
									fileName: file.name,
									uploadContextId: context.uploadContextId
								}
							})
								.then(function(response) {
										$.telligent.evolution.notifications.show(context.text.licenseInstallSuccess, { type: 'success' });
															 context.headerWrapper.find('.filter-option.selected').removeClass('selected');
														context.headerWrapper.find('.filter-option a[data-tab="licenses"]').parent().addClass('selected');
														updateVisibleTab(context);
									refresh(context);
								})
								.always(function() {
									context.installButton.removeClass('disabled').html(context.text.install);
								});
						} else {
							context.installButton.removeClass('disabled').html(context.text.install);
						}
					})
					.on('glowUploadFileProgress', function (e, details) {
						context.installButton.addClass('disabled').html(context.text.installProgress.replace('{0}', details.percent));
					})
					.on('glowUploadError', function(e) {
						context.installButton.removeClass('disabled').html(context.text.install);
					});

					$.telligent.evolution.messaging.subscribe('licensing.removeserver', function (data) {
							var serverName = $(data.target).data('servername');

							if (global.confirm(context.text.confirmServerUnregistration.replace(/\{0\}/g, serverName))) {
									$.telligent.evolution.post({
											url: context.urls.unregisterServer,
											data: {
													serverName: serverName
											}
									})
											.then(function() {
												 $.telligent.evolution.notifications.show(context.text.serverUnregisteredSuccess.replace(/\{0\}/g, serverName), { type: 'success' });
												 refresh(context);
											});
							}

					return false;
					});

					$.telligent.evolution.messaging.subscribe('licensing.uninstalllicense', function (data) {
							var licenseId = $(data.target).data('licenseid');
							var licenseName = $(data.target).data('licensename');

							if (global.confirm(context.text.confirmLicenseUninstallation.replace(/\{0\}/g, licenseName))) {
									$.telligent.evolution.post({
											url: context.urls.uninstallLicense,
											data: {
													licenseId: licenseId
											}
									})
											.then(function() {
												 $.telligent.evolution.notifications.show(context.text.licenseUninstallationSuccess.replace(/\{0\}/g, licenseName), { type: 'success' });
												 refresh(context);
											});
							}

					return false;
					});

					updateVisibleTab(context);
		}
	};

}(jQuery, window));
