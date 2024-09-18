/*
NewAutomationView
	contructor
		template
		title
`
methods:
	prompt
		hosts: []
		onValidate: function(automationId) {} // returns promise
		onSelect: function(selection) {}
		enableIdSelection: true
		enableProviderSelection: true
*/
define('NewAutomationView', function($, global, undef) {

	var defaults = {
		template: '',
		title: 'title',
		enableIdSelection: true,
		enableProviderSelection: true
	};

	var NewAutomationView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(options) {
				var content = $(context.template({
					hosts: options.hosts || [],
					currentAutomationId: options.currentAutomationId
				}));

				var cancelButton = content.find('.cancel');
				var continueButton = content.find('.continue');
				var newAutomationField = content.find('.automation-id');
				var newAutomationId = content.find('input.new-automation-id');
				var providerSelect = content.find('select.provider-select');
				var newAutomationIdValid = content.find('.new-automation-id-valid').hide();

				if(context.enableIdSelection) {
					newAutomationField.show();
				} else {
					newAutomationField.hide();
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

					// if explicit automation ID, first validate it
					if (newAutomationId.is(':visible')) {
						var automationId = $.trim(newAutomationId.val());
						options.onValidate(automationId).then(function(isValid) {
							if(isValid) {
								options.onSelect({
									automationId: automationId || null,
									factoryDefaultProviderId: context.enableProviderSelection ? providerSelect.val() : null,
									hostId: content.find('input[name="automation-host"]:checked').val() || null
								});
								$.glowModal.close();
								return false;
							} else {
								newAutomationIdValid.show();
							}
						});
					} else {
						options.onSelect({
							automationId: null,
							factoryDefaultProviderId: context.enableProviderSelection ? providerSelect.val() : null,
							hostId: content.find('input[name="automation-host"]:checked').val() || null
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

	return NewAutomationView;

}, jQuery, window);
