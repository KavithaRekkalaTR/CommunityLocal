/*
SelectProviderView

options:
	template

methods:
	render
*/
define('SelectProviderView', function($, global, undef) {

	var defaults = {
		template: ''
	};

	var SelectProviderView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(onSelect) {
				var content = $(context.template({}));

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
								provider: content.find('select.provider-select').val(),
								id: content.find('input.fragment-id').val()
							});
						}

						return false;
					}
				})
				.evolutionValidation('addCustomValidation', 'idFormat', function () {
					// if a fragment id provided, make sure it's valid
					var fragmentId = $.trim(content.find('input.fragment-id').val());
					if(fragmentId) {
						return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(content.find('input.fragment-id').val());
					} else {
						return true;
					}
				}, context.resources.invalidGuid, '.field-item.fragment-id .field-item-validation', null);

				var modal = $.glowModal({
					title: context.resources.developerModeNewWidgetDetails,
					html: content,
					width: 450,
					height: '100%'
				});
			}
		}
	};

	return SelectProviderView;

}, jQuery, window);
