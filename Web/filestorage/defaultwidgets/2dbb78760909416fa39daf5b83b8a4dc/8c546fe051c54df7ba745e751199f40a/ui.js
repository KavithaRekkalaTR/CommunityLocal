(function ($, global) {
	var headerList = null, listWrapper = null;
	var editWrapper = null, searchTimeout = null;

	var spinner = '<span class="ui-loading" width="48" height="48"></span>',

	searchRoles = function(context, textbox, searchText) {
		if(searchText && searchText.length >= 2) {

			textbox.glowLookUpTextBox('updateSuggestions', [
				textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
			]);

			$.telligent.evolution.get({
				url: context.urls.findLdapRoles,
				data: {
					searchText: searchText,
				},
				success: function(response) {
					if (response && response.Results && response.Results.length >= 1) {
						textbox.glowLookUpTextBox('updateSuggestions',
							$.map(response.Results, function(result, i) {
								return textbox.glowLookUpTextBox('createLookUp', result.Id, result.Name, result.Name, true);
							}));
					} else {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', context.text.noRolesMatch, context.text.noRolesMatch, false)
						]);
					}
				},
			});
		}
	}

	function loadLdapEditForm(options, title) {
		headerList = $('<ul class="field-list"></ul>')
			.append(
				$('<li class="field-item submit"></li>')
					.append(
						$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#"></a>')
									.addClass('button save-ldap-role')
									.text(options.text.save)
					)
				)
			);

		$.telligent.evolution.administration.open({
			name: title,
			header: $('<fieldset></fieldset>').append(headerList),
			content: $.telligent.evolution.get({
				url: options.urls.createLdapRole,
				data: {
				}
			}),
			cssClass: 'administration-roles-edit'
		});
	}

    function _deleteRole(t, roleId, options) {
		 var data = {
			 RoleId: roleId
		 };

		 $.telligent.evolution.post({
			 url: options.urls.delete,
			 data: data,
			 success: function (response) {
                $.telligent.evolution.notifications.show(options.text.roleDeleted, {
                    type: 'success'
                })
                t.closest('li.content-item').slideUp('fast', function() {
                    $(this).remove();
                });
			 },
			 defaultErrorMessage: options.saveErrorText,
			 error: function (xhr, desc, ex) {
				 if (xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0) {
					 $.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0], { type: 'error' });
				 }
				 else {
					 $.telligent.evolution.notifications.show(desc, { type: 'error' });
				 }
			 }
		 });
	 }

	var api = {
		register: function (options) {
			listWrapper = $.telligent.evolution.administration.panelWrapper();

			var createButtonHeader = $('<ul class="field-list"></ul>')
				.append(
					$('<li class="field-item submit"></li>')
						.append(
							$('<span class="field-item-input"></span>')
								.append(
									$('<a></a>')
                                        .attr("href", options.urls.createrole)
										.addClass('button create-role')
										.text(options.text.createRole)
						)
					)
				);

				if (options.useldap == "True") {
					createButtonHeader.append(
						$('<li class="field-item submit"></li>')
							.append(
								$('<span class="field-item-input"></span>')
									.append(
										$('<a href="#"></a>')
											.addClass('button create-ldap-role')
											.text(options.text.createLdapRole)
							)
						)
					);
				}

			$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(createButtonHeader));

			var createLdapButton = $('a.create-ldap-role', $.telligent.evolution.administration.header());
			createLdapButton.on('click', function () {
				loadLdapEditForm(options, options.text.mapLdapRole);

				return false;
			});

			$.telligent.evolution.messaging.subscribe('administration.role.delete', function (data) {
				var roleId = $(data.target).data('roleid');
				var isMapped = $(data.target).data('ismapped');
                var t = $(data.target);

				if (isMapped == 'True') {
					if (confirm(options.text.deleteADConfirmation))
						_deleteRole(t, roleId, options);
				}
				else {
					if (confirm(options.text.deleteConfirmation))
						_deleteRole(t, roleId, options);
				}
			});

            $.telligent.evolution.messaging.subscribe('role.updated', function(data) {
                options.shouldRefresh = true;
            }, { excludeAutoNameSpaces: true });

            $.telligent.evolution.administration.on('panel.shown', function(){
                if (options.shouldRefresh) {
                    options.shouldRefresh = false;
                    $.telligent.evolution.administration.refresh();
                }
            });
        }
	};

	$.telligent.evolution.widgets.administrationRolesCreateLdap = {
		register: function (options) {
			options.ldapLookup = $(options.inputs.ldapLookupId)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchRoles(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});

			var saveButton = $('a.save-ldap-role', headerList);
			saveButton.evolutionValidation({
				validateOnLoad: false,
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {

					var ldapGroupName = $(options.inputs.ldapLookupId).val();
					var data = {
						LdapGroupName: ldapGroupName,
					};

					$.telligent.evolution.post({
						url: options.urls.save,
						data: data
					})
					.then(function(response) {
						$.telligent.evolution.notifications.show(options.text.roleCreated);
						$.telligent.evolution.get({
							url: options.urls.roleslistitem + '&RoleId=' + response.roleId
						})
						.then(function(response) {
							$('ul.content-list', listWrapper).append(response);
							$.telligent.evolution.administration.close();
						});
					});

					return false;
				}
			});

			saveButton.evolutionValidation('addField', options.inputs.ldapLookupId, { required: true }, '.field-item.name .field-item-validation');
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.administrationRoles = api;

})(jQuery, window);
