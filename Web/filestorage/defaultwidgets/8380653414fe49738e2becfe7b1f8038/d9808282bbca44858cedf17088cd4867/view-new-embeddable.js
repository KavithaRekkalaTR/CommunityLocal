/*
NewEmbeddableView
	contructor
		template
		title
`
methods:
	prompt
		onValidate: function(embeddableId) {} // returns promise
		onSelect: function(selection) {}
		enableIdSelection: true
		enableProviderSelection: true
*/
define('NewEmbeddableView', function($, global, undef) {

	var defaults = {
		template: '',
		title: 'title',
		enableIdSelection: true,
		enableProviderSelection: true
	};

	var NewEmbeddableView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(options) {
				var content = $(context.template({
					currentEmbeddableId: options.currentEmbeddableId
				}));

				var cancelButton = content.find('.cancel');
				var continueButton = content.find('.continue');
				var newEmbeddableField = content.find('.embeddable-id');
				var newEmbeddableId = content.find('input.new-embeddable-id');
				var providerSelect = content.find('select.provider-select');
				var newEmbeddableIdValid = content.find('.new-embeddable-id-valid').hide();

				if(context.enableIdSelection) {
					newEmbeddableField.show();
				} else {
					newEmbeddableField.hide();
				}

				cancelButton.on('click', function(e){
					e.preventDefault();
					$.glowModal.close();
					return false;
				});

				continueButton.on('click', function(e){
					e.preventDefault();
					if($(this).is('.disabled'))
						return;

					// if explicit embeddable ID, first validate it
					if (newEmbeddableId.is(':visible')) {
						var embeddableId = $.trim(newEmbeddableId.val());
						options.onValidate(embeddableId).then(function(isValid) {
							if(isValid) {
								options.onSelect({
									embeddableId: embeddableId || null,
									factoryDefaultProviderId: context.enableProviderSelection ? providerSelect.val() : null
								});
								$.glowModal.close();
								return false;
							} else {
								newEmbeddableIdValid.show();
							}
						});
					} else {
						options.onSelect({
							embeddableId: null,
							factoryDefaultProviderId: context.enableProviderSelection ? providerSelect.val() : null
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

	return NewEmbeddableView;

}, jQuery, window);
