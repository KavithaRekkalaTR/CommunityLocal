(function($, global, undef) {

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function saveFragment(context, options) {
		return $.telligent.evolution.post({
			url: context.saveCallbackUrl,
			data: options
		});
	}

	// options:
	//   checkboxes - checkboxes container selector
	//   selectAll - select all selector
	//   deselectAll - deselect all selector
	function initMultiSelection(options) {
		var checkboxes = $(options.checkboxes);
		var selectAll = $(options.selectAll);
		var deselectAll = $(options.deselectAll);

		var adjustLinkVisibility = function() {
			var checked = checkboxes.filter(':checked');

			if (checked.length < checkboxes.length) {
				selectAll.show();
			} else {
				selectAll.hide();
			}

			if (checked.length > 0) {
				deselectAll.show();
			} else {
				deselectAll.hide();
			}
		}

		if (checkboxes.length <= 1) {
			deselectAll.hide();
			selectAll.hide();
			return;
		}
		adjustLinkVisibility();

		checkboxes.on('input', function() {
			adjustLinkVisibility();
		});
		selectAll.on('click', function() {
			checkboxes.prop('checked', true).trigger('input');
			return false;
		});
		deselectAll.on('click', function() {
			checkboxes.prop('checked', false).trigger('input');
			return false;
		});
	}

	function adjustInputChangeState(checkbox) {
		checkbox = $(checkbox);
		var checked = checkbox.is(':checked');
		var defaultChecked = checkbox.data('default');
		var lastSavedChecked = checkbox.data('last');

		if (checked == defaultChecked) {
			checkbox.closest('.field-item-input').find('.defaultvalue').hide();
		} else {
			checkbox.closest('.field-item-input').find('.defaultvalue').show();
		}

		if (checked == lastSavedChecked) {
			checkbox.closest('.field-item-input').find('.unsavedchange').hide();
		} else {
			checkbox.closest('.field-item-input').find('.unsavedchange').show();
		}
	}

	function initRevertButton(context, checkboxes) {
		context.revert = $(context.revert);

		context.revert.on('click', function() {
			checkboxes.each(function(){
				$(this).prop('checked', $(this).data('default')).trigger('input');
			});
			return false;
		});

		var adjustRevertButtonVisibility = function () {
			var isDefault = true;
			checkboxes.each(function() {
				if (!isDefault || $(this).is(':checked') != $(this).data('default')) {
					isDefault = false;
				}
			});
			if (isDefault) {
				context.revert.hide();
			} else {
				context.revert.show();
			}
		}

		checkboxes.on('input', function() {
			adjustRevertButtonVisibility(this);
		});
		adjustRevertButtonVisibility();
	}

	var api = {
		register: function(options) {
			var context = $.extend(options, {
				themeTypes: $(options.themeTypesId)
			});

			var headerTemplate = $.telligent.evolution.template(context.headerTemplateId)
			var header = $(headerTemplate({}));
			var saveButton = header.find('a.button');

			$.telligent.evolution.administration.header(header);

			var checkboxes = context.themeTypes.find('input.supported-theme-types');

			initMultiSelection({
				checkboxes: checkboxes,
				selectAll: context.selectAll,
				deselectAll: context.deselectAll
			});

			initRevertButton(context, checkboxes);

			checkboxes.each(function(){
				adjustInputChangeState(this);
			}).on('input', function(){
				adjustInputChangeState(this);
			});

			saveButton.on('click', function(){
				var enabledThemeTypeIds = checkboxes.filter(':checked').map(function(){
					return $(this).val();
				}).get();

				saveFragment(context, {
					instanceIdentifier: context.fragmentId,
					availableThemeTypesToSave: enabledThemeTypeIds.join()
				}).then(function(r){
					$.telligent.evolution.messaging.publish('fragment-edited', r);
				});

				return false;
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.fragmentAdministration.availability = api;

})(jQuery, window);