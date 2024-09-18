(function ($, global, undef) {

	function handleResponse(options, response, successUrl) {
		// if processing in the background with progress feedback UI
		if (!response.complete && response.progressIndicator && response.progressKey) {
			$.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data) {
				if (data.progressKey == response.progressKey) {
					if (data.result && data.result.warnings && data.result.warnings.length > 0) {
						$.telligent.evolution.notifications.show(data.result.warnings[0], {
							type: 'warning'
						});
					} else {
						global.location = successUrl || options.previewUrl;
					}
				}
			});

			options.formWrapper.hide();
			options.progressWrapper.show().append(response.progressIndicator);
			// processed immediately with warnings
		} else if (response.warnings && response.warnings.length > 0) {
			$.telligent.evolution.notifications.show(response.warnings[0], {
				type: 'warning'
			});
		} else {
			global.location = successUrl || options.previewUrl;
		}
	}

	var api = {
		register: function (options) {
			$.telligent.evolution.messaging.subscribe('administration.upgradetheme.preview-social-theme', function (data) {
				var b = $(data.target);
				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					$.telligent.evolution.administration.loading(true);
					$.telligent.evolution.post({
							url: options.previewSocialThemeUrl
						})
						.then(function (response) {
							handleResponse(options, response);
						})
						.always(function () {
							b.removeClass('disabled');
							$.telligent.evolution.administration.loading(false);
						});
				}
			});

			$.telligent.evolution.messaging.subscribe('administration.upgradetheme.begin-migration', function (data) {
				var postData = {};
				$('input[type="checkbox"]', $.telligent.evolution.administration.panelWrapper()).each(function (i, cb) {
					postData[$(cb).data('name')] = $(cb).is(':checked');
				});

				var b = $(data.target);
				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					$.telligent.evolution.administration.loading(true);
					$.telligent.evolution.post({
							url: options.beginMigrationUrl,
							data: postData
						})
						.then(function (response) {
							handleResponse(options, response, options.systemNotificationUrl);
						})
						.always(function () {
							b.removeClass('disabled');
							$.telligent.evolution.administration.loading(false);
						});
				}
			});

			$.telligent.evolution.messaging.subscribe('administration.upgradetheme.preview-upgrade-widgets', function (data) {
				var b = $(data.target);
				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					$.telligent.evolution.administration.loading(true);
					$.telligent.evolution.post({
							url: options.previewUpgradeWidgetsUrl
						})
						.then(function (response) {
							handleResponse(options, response);
						})
						.always(function () {
							b.removeClass('disabled');
							$.telligent.evolution.administration.loading(false);
						});
				}
			});

			$.telligent.evolution.messaging.subscribe('administration.upgradetheme.preview-upgrade-social-theme', function (data) {
				var b = $(data.target);
				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					$.telligent.evolution.administration.loading(true);
					$.telligent.evolution.post({
							url: options.previewUpgradeSocialThemeUrl
						})
						.then(function (response) {
							handleResponse(options, response);
						})
						.always(function () {
							b.removeClass('disabled');
							$.telligent.evolution.administration.loading(false);
						});
				}
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.upgradeTheme = api;

})(jQuery, window);