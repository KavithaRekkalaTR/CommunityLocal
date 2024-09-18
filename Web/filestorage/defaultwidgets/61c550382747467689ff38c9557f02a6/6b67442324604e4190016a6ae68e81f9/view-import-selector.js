/*
SelectThemeView

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

		if(container.find('input[type="checkbox"]').length > 0) {
			deSelectAll.show();
		}

		container.find('input[type="checkbox"]').on('change', function(){
			var checkedCount = container.find('input[type="checkbox"]:checked').length;
			var uncheckedCount = container.find('input[type="checkbox"]:not(:checked)').length;
			var totalCount = container.find('input[type="checkbox"]').length;

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
		});

		selectAll.on('click', function(e){
			e.preventDefault();

			container.find('input[type="checkbox"]').prop('checked', true);
			selectAll.hide();
			deSelectAll.show();

			return false;
		});

		deSelectAll.on('click', function(e){
			e.preventDefault();

			container.find('input[type="checkbox"]').prop('checked', false)
			selectAll.show();
			deSelectAll.hide();

			return false;
		});
	}

	var ImportSelectorView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(importResult, onSelect) {

				var content = $(context.template(importResult));

				content.on('click','a.cancel', function(e){
					e.preventDefault();
					$.glowModal.close();
					return false;
				});

				content.on('click','a.continue', function(e){
					e.preventDefault();

					var importCommands = [];
					content.find('input.importable-theme').each(function(){
						var request = context.parseRequest($(this).data('request'));
						request.import = $(this).is(':checked');
						importCommands.push(request);
					});

					if(onSelect) {
						onSelect({
							importCommands: importCommands,
							provider: (content.find('select.provider-select').val() || null)
						});
					}

					$.glowModal.close();
					return false;
				});

				var modal = $.glowModal({
					title: (importResult.resourceOnly ? context.resources.resourceImport : context.resources.themeImport),
					html: content,
					width: 550,
					height: '100%'
				});

				initMultiSelector(context, content.find('.field-item.new-themes'));
				initMultiSelector(context, content.find('.field-item.updated-themes'));
			}
		}
	};

	return ImportSelectorView;

}, jQuery, window);
