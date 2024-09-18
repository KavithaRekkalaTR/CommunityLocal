(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.editorOptions = {
		register: function(options) {
			options.mobileUserAgentPattern = $(options.mobileUserAgentPatternId);

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
					},
					validate: function() {
					    return validate();
					}
				});
			});
			options.configApi.registerContent(tabs);

			options.configApi.registerSave(function(saveOptions) {

				if (!validate()) {
				    saveOptions.error();
				    return;
				}

				var fonts = [];
				var fontConfig = options.fonts.val().split(/[\n\r]+/g);
				for (var i = 0; i < fontConfig.length ;i++) {
				    var keyValue = fontConfig[i].split('=', 2);
				    if (keyValue.length == 2) {
				        fonts.push(encodeURIComponent(keyValue[0]) + '=' + encodeURIComponent(keyValue[1]));
				    }
				}

				var fontSizes = [];
				var fontSizeConfig = options.fontSizes.val().split(/[\n\r]+/g);
				for (i = 0; i < fontSizeConfig.length ;i++) {
				    keyValue = fontSizeConfig[i].split('=', 2);
				    if (keyValue.length == 2) {
				        fontSizes.push(encodeURIComponent(keyValue[0]) + '=' + encodeURIComponent(keyValue[1]));
				    }
				}

				$.telligent.evolution.post({
					url: options.saveUrl,
					data: {
						mobileUserAgentPattern: $.trim(options.mobileUserAgentPattern.val()),
						enableEnterToSubmitToggle: options.enableEnterToSubmitToggle.is(':checked'),
						fonts: fonts.join('&'),
						fontSizes: fontSizes.join('&'),
						defaultMediaWidth: parseInt(options.defaultMediaWidth.val(), 10),
						defaultMediaHeight: parseInt(options.defaultMediaHeight.val(), 10)
					}
				})
					.then(function(response) {
						saveOptions.success();
					})
					.catch(function() {
						saveOptions.error();
					});
			});

			var validate = function() {
			    if (!validatePattern())
			        return false;

			    if (!validateDimensions())
			        return false;

			    return true;
			};

			var validateDimensions = function() {
			    var w = parseInt(options.defaultMediaWidth.val(), 10);
			    var h = parseInt(options.defaultMediaHeight.val(), 10);
			    if (isNaN(w) || w < 0 || isNaN(h) || h < 0) {
			        $(options.defaultMediaDimensionsWrapperId + ' .field-item-validation').html(options.text.defaultMediaDimensionsInvalid).show();
			        return false;
			    } else {
			        $(options.defaultMediaDimensionsWrapperId + ' .field-item-validation').hide();
			    }

			    return true;
			};

			options.defaultMediaWidth.on('input', function() {
			    validateDimensions();
			});

			options.defaultMediaHeight.on('input', function() {
			    validateDimensions();
			});

			var validatePattern = function () {
				var pattern = $.trim(options.mobileUserAgentPattern.val());
				try {
					var re = new RegExp(pattern);
				} catch (e) {
					pattern = '';
				}

				if (pattern.length > 0) {
				    $(options.mobileUserAgentPatternWrapperId + ' .field-item-validation').hide();
				    return true;
				} else {
				    $(options.mobileUserAgentPatternWrapperId + ' .field-item-validation').html(options.text.mobileUserAgentPatternInvalid).show();
				    return false;
				}
			};

			options.mobileUserAgentPattern.on('input', function() {
				validatePattern();
			});
		}
	};
}(jQuery, window));