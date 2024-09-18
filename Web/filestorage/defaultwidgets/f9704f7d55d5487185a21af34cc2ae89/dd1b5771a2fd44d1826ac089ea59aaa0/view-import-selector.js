/*
SelectAutomationView

options:
	template

methods:
	render
*/
define('ImportSelectorView', function($, global, undef) {

	var defaults = {
		template: '',
		parseRequest: function(request) { }
	};

	function initMultiSelector(context, container) {
		var selectAll = container.find('a.select-all');
		var deSelectAll = container.find('a.de-select-all');

		function processCheckCount() {
			var checkedCount = container.find('input[type="checkbox"]:checked:not(:disabled)').length;
			var uncheckedCount = container.find('input[type="checkbox"]:not(:checked):not(:disabled)').length;
			var totalCount = container.find('input[type="checkbox"]:not(:disabled)').length;

			if (totalCount <= 1) {
				deSelectAll.hide();
				selectAll.hide();
				return;
			}

			if(checkedCount > 0) {
				deSelectAll.show();
			} else {
				deSelectAll.hide();
			}

			if(uncheckedCount > 0) {
				selectAll.show();
			} else {
				selectAll.hide();
			}
		}

		selectAll.on('click', function(e){
			e.preventDefault();

			container.find('input[type="checkbox"]:not(:disabled)').prop('checked', true).trigger('change');
			selectAll.hide();
			deSelectAll.show();

			return false;
		});

		deSelectAll.on('click', function(e){
			e.preventDefault();

			container.find('input[type="checkbox"]:not(:disabled)').prop('checked', false).trigger('change');
			selectAll.show();
			deSelectAll.hide();

			return false;
		});

		container.find('input[type="checkbox"]:not(:disabled)').on('change', processCheckCount);
		processCheckCount();
	}

	var ImportSelectorView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(importResult, onSelect) {

				var content = $(context.template(importResult));

				content.on('change', 'input[type="checkbox"]', function(e) {
					var cb = $(e.target);
					var request = context.parseRequest(cb.data('request'));
					if(request.model == 'automation') {
						var relatedImportableItem = content.find('input.importable-automation[data-automationid="' + cb.data('id') + '"]');
						if (cb.prop('checked')) {
							relatedImportableItem.prop('disabled', false).prop('checked', true).trigger('change');
						} else {
							relatedImportableItem.prop('checked', false).prop('disabled', true).trigger('change');
						}
					}
				});

				content.on('click','a.cancel', function(e){
					e.preventDefault();
					$.glowModal.close();
					return false;
				});

				content.on('click','a.continue', function(e){
					e.preventDefault();

					var importCommands = [];
					content.find('input.importable-automation').each(function(){
						var request = context.parseRequest($(this).data('request'));
						request.import = $(this).is(':checked');
						importCommands.push(request);
					});

					if(onSelect) {
						onSelect({
							importCommands: importCommands,
							factoryDefaultProviderId: (content.find('select.provider-select').val() || null)
						});
					}

					$.glowModal.close();
					return false;
				});

				var modal = $.glowModal({
					title: (importResult.resourceOnly ? context.resources.resourceImport : context.resources.automationImport),
					html: content,
					width: 550,
					height: '100%'
				});

				initMultiSelector(context, content.find('.field-item.new-automations'));
				initMultiSelector(context, content.find('.field-item.updated-automations'));
				initMultiSelector(context, content.find('.field-item.new-configured-automations'));
				initMultiSelector(context, content.find('.field-item.updated-configured-automations'));
			}
		}
	};

	return ImportSelectorView;

}, jQuery, window);
