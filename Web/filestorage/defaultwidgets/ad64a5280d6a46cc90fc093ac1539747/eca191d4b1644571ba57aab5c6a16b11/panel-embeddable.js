(function($, global, undef) {

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function saveEmbeddable(context, options) {
		return $.telligent.evolution.post({
			url: context.saveCallbackUrl,
			data: options
		});
	}

	function searchRoles(context, query) {
		return $.telligent.evolution.get({
			url: context.searchRolesCallbackUrl,
			data: { _w_query: query }
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
			checkboxes.prop('checked', true);
			adjustLinkVisibility();
			return false;
		});
		deselectAll.on('click', function() {
			checkboxes.prop('checked', false);
			adjustLinkVisibility();
			return false;
		});
	}

	function initRoleLookupUi(context) {
		var adjustRoleForm = function() {
			if (context.rolesType.val() == 'custom')
				context.rolesLookupWrapper.show();
			else
				context.rolesLookupWrapper.hide();
		};

		context.rolesType.on('change', adjustRoleForm);

		context.rolesLookupWrapper = context.rolesLookup.parent();
		context.rolesLookup.glowLookUpTextBox({
			delimiter: ',',
			allowDuplicates: false,
			emptyHtml: context.rolesLookup.prop('placeholder'),
			onGetLookUps: function(textbox, searchText) {
				if(searchText && searchText.length >= 1) {
					textbox.glowLookUpTextBox('updateSuggestions', [
						textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
					]);
					context.currentSearchText = searchText;

					searchRoles(context, searchText).then(function(response){
						if (searchText != context.currentSearchText) {
							return;
						}

						var hasResults = false;
						if (response && response.results.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								response.results.map(function(role, i) {
									try {
										lookup = textbox.glowLookUpTextBox(
											'createLookUp',
											role.Id,
											role.Name,
											role.Name,
											true);

										hasResults = true;
										return lookup;
									} catch (e) {}
								}));
						}

						if (!hasResults) {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', 'No Roles Found', 'No Roles Found', false)
							]);
						}
					});
				}
			},
			selectedLookUpsHtml: [],
			deleteImageUrl: ''
		})
		.on('glowLookUpTextBoxChange', function(){
			context.rolesLookup.trigger('change');
		});

		attemptToRenderCurrentRoles(context, context.roles);
		adjustRoleForm();
	}

	function attemptToRenderCurrentRoles(context, roles){
		var roleLookupContainer = context.rolesLookup.parent();
		if(roleLookupContainer.length == 0 || !roleLookupContainer.get(0).offsetHeight) {
			setTimeout(function(){
				attemptToRenderCurrentRoles(context, roles);
			}, 20)
		} else {
			renderCurrentRoles(context, roles);
		}
	}

	function renderCurrentRoles(context, roles) {
		// clear any current selections
		var count = context.rolesLookup.glowLookUpTextBox('count');
		for(var i = 0; i < count; i++) {
			var removed = context.rolesLookup.glowLookUpTextBox('removeByIndex', 0);
		}

		for(var i = 0; i < roles.length; i++) {
			var role = roles[i];
			var renderedRole = context.rolesLookup.glowLookUpTextBox('createLookUp',
				role.Id,
				role.Name,
				role.Name,
				true);
			context.rolesLookup.glowLookUpTextBox('add', renderedRole);
		}
	}

	var api = {
		register: function(options) {
			var context = $.extend(options, {
				contentTypes: $(options.contentTypesId),
				rolesLookup: $(options.rolesId),
				rolesType: $(options.rolesTypeID)
			});

			var headerTemplate = $.telligent.evolution.template(context.headerTemplateId)
			var header = $(headerTemplate({}));
			var saveButton = header.find('a.button');

			$.telligent.evolution.administration.header(header);

			var checkboxes = context.contentTypes.find('input.supported-content-types');

			initMultiSelection({
				checkboxes: checkboxes,
				selectAll: context.selectAll,
				deselectAll: context.deselectAll
			});

			initRoleLookupUi(context);

			saveButton.on('click', function(){
				var enabledContentTypeIds = checkboxes.filter(':checked').map(function(){
					return $(this).val();
				}).get();

				var enabledRoleIds = context.rolesType.val() == 'custom' ? context.rolesLookup.val() : 'all';

				saveEmbeddable(context, {
					id: context.embeddableId,
					enabledContentTypesToSave: enabledContentTypeIds.join(),
					enabledRolesToSave: enabledRoleIds
				}).then(function(r){
					$.telligent.evolution.messaging.publish('embeddable-edited', r);
				});

				return false;
			});
		}
	}

	$.telligent.evolution.embeddables.embeddableAdministration.edit = api;

})(jQuery, window);