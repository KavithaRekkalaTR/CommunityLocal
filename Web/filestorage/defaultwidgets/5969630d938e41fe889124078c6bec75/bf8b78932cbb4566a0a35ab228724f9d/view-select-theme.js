/*
SelectThemeView

options:
	template

methods:
	render
*/
define('SelectThemeView', function($, global, undef) {

	var defaults = {
		template: ''
	};

	var SelectThemeView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(sourceModel, onSelect) {
				var content = $(context.template({}));
				var themesUnavailableContainer = content.find('.themes-unavailable').hide();
				var themesAvailableContainer = content.find('.themes-available');

				// remove all theme options from the theme selector
				// where the widget already has the theme variant
				var themeOptions = content.find('.theme-select option');
				var themesAreAvailable = false; // if there are no other themes currently installed that aren't already
				// in use by the fragment, show a message about that instead
				themeOptions.each(function(){
					var option = $(this).attr('value');
					if(sourceModel.ThemeIds[option]) {
						$(this).remove();
					} else {
						themesAreAvailable = true;
					}
				});

				if(!themesAreAvailable) {
					themesAvailableContainer.hide();
					themesUnavailableContainer.show();
				}

				content.on('click','a.cancel', function(e){
					e.preventDefault();
					$.glowModal.close();
					return false;
				});

				var continueButton = content.find('.continue');

				continueButton.evolutionValidation({
					onValidated: function(isValid, buttonClicked, c) {},
					onSuccessfulClick: function(e) {
						e.preventDefault();

						if($(e.target).hasClass('disabled'))
							return false;

						$.glowModal.close();

						if(onSelect) {
							onSelect({
								id: content.find('select.theme-select').val()
							});
						}

						return false;
					}
				})
				.evolutionValidation('addCustomValidation', 'idFormat', function () {
					return true;
				}, 'Invalid Theme', '.field-item.fragment-id .field-item-validation', null);

				var modal = $.glowModal({
					title: context.resources.selectTheme,
					html: content,
					width: 450,
					height: '100%'
				});
			}
		}
	};

	return SelectThemeView;

}, jQuery, window);
