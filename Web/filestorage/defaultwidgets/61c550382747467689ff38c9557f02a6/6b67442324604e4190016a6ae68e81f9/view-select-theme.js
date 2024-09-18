/*
SelectThemeView

options:
	template
	title

methods:
	render
		themes: selectableThemes,
		themeTypeName: targetThemeModel.TypeName,
		onValidate: function(themeId) {} // returns promise
		onSelect: function(selection) {}
*/
define('SelectThemeView', function($, global, undef) {

	var defaults = {
		template: '',
		title: 'title'
	};

	var SelectThemeView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(options) {
				var content = $(context.template({
					themes: options.themes,
					themeTypeName: options.themeTypeName
				}));

				var hasSelectableOptions = options.themes && options.themes.length > 0;

				var relatedThemeSelect = content.find('select.theme');
				var cancelButton = content.find('.cancel');
				var continueButton = content.find('.continue');
				var selectThemeNoneLabel = content.find('.field-item.theme-id .field-item-description.none');
				var selectedThemeId = content.find('span.selected-theme-id');
				var newThemeId = content.find('input.new-theme-id');
				var newThemeIdValid = content.find('.new-theme-id-valid').hide();

				if (hasSelectableOptions) {
					var updateSelectedTheme = function() {
						// related theme selected
						if (relatedThemeSelect.val() != '') {
							selectedThemeId.html(relatedThemeSelect.val()).show();
							newThemeId.hide();
							selectThemeNoneLabel.hide();
						} else {
							selectedThemeId.hide();
							newThemeId.show();
							selectThemeNoneLabel.show();
						}
					};

					relatedThemeSelect.on('change', updateSelectedTheme);
					updateSelectedTheme();
				}

				cancelButton.on('click', function(e){
					e.preventDefault();
					$.glowModal.close();
					return false;
				});

				continueButton.on('click', function(e){
					e.preventDefault();
					// if explicit theme ID, first validate it
					if (newThemeId.is(':visible')) {
						var themeId = $.trim(newThemeId.val());
						options.onValidate(themeId).then(function(isValid) {
							if(isValid) {
								options.onSelect({ themeId: themeId });
								$.glowModal.close();
								return false;
							} else {
								newThemeIdValid.show();
							}
						});
					} else {
						options.onSelect({
							themeId: relatedThemeSelect.val()
						});
						$.glowModal.close();
						return false;
					}
				});

				var modal = $.glowModal({
					title: context.title,
					html: content,
					width: 450,
					height: '100%'
				});
			}
		}
	};

	return SelectThemeView;

}, jQuery, window);
