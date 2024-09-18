(function($, global) {

	function selectTheme(options, themeId, themeName) {
		return $.Deferred(function(d) {
			if (global.confirm(options.text.selectThemeConfirmation.replace(/\{0\}/g, themeName))) {
				$.telligent.evolution.post({
					url: options.selectThemeUrl,
					data: {
						ThemeId: themeId
					}
				})
					.then(function() {
						global.alert(options.text.selectThemeSuccess);
						global.location.reload(true);
						d.resolve();
					})
					.catch(function() {
						d.reject();
					})
			} else {
				d.reject();
			}
		});
	}

	function setStagedTheme(options, themeId) {
		return $.Deferred(function(d) {
			$.telligent.evolution.post({
				url: options.previewThemeUrl,
				data: {
					ThemeId: themeId
				}
			})
				.then(function() {
					$.telligent.evolution.notifications.show(options.text.stagedThemeSuccess, { type: 'success' });
					global.location = options.previewUrl;
					d.resolve();
				})
				.catch(function() {
					d.reject();
				})
		});
	}

	function revertStagedTheme(options) {
		return $.Deferred(function(d) {
			$.telligent.evolution.post({
				url: options.stopPreviewingThemeUrl
			})
				.then(function() {
					global.alert(options.text.previewStoppedSucess);
					global.location.reload(true);
					d.resolve();
				})
				.catch(function() {
					d.reject();
				})
		});
	}

	var api = {
		register: function(options) {
			$.telligent.evolution.messaging.subscribe('theme.select', function(data){
				var b = $(data.target);
				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					selectTheme(options, b.data('themeid'), b.data('themename'))
						.always(function() {
							b.removeClass('disabled');
						});
				}
			});

			$.telligent.evolution.messaging.subscribe('theme.preview', function(data){
				var b = $(data.target);
				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					setStagedTheme(options, b.data('themeid'))
						.always(function() {
							b.removeClass('disabled');
						});
				}
			});

			$.telligent.evolution.messaging.subscribe('theme.stoppreview', function(data){
				var b = $(data.target);
				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					revertStagedTheme(options)
						.always(function() {
							b.removeClass('disabled');
						});
				}
			});

			$.telligent.evolution.administration.on('panel.shown', function() {
				global.setTimeout(function() {
					$('.theme.selected', $.telligent.evolution.administration.panelWrapper()).trigger('click');
				}, 500);
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.selectTheme = api;

})(jQuery, window);
