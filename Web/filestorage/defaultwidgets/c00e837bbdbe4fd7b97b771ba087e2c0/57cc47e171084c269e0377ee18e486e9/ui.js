(function ($, global) {
	var headerList, button, deleteButton;
	
	var spinner = '<span class="ui-loading" width="48" height="48"></span>';
	
	var panel = {
	    searchGroups: function(context, textbox, searchText) {
			if(searchText && searchText.length >= 2) {

				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
				]);

				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups.json',
					data: {
						GroupNameFilter: searchText,
						Permission: 'Group_ReadGroup'
					},
					success: function(response) {
						if (response && response.Groups && response.Groups.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								$.map(response.Groups, function(group, i) {
									return textbox.glowLookUpTextBox('createLookUp', group.Id, group.Name, group.Name, true);
								}));
						} else {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', context.resources.noGroupsMatch, context.resources.noGroupsMatch, false)
							]);
						}
					}
				});
			}
		},
	};
	
	var api = {
		register: function (options) {
			$.telligent.evolution.administration.size('wide');

			headerList = $('<ul class="field-list"></ul>')
				.append(
					$('<li class="field-item"></li>')
						.append(
							$('<span class="field-item-input"></span>')
								.append(
									$('<a href="#"></a>')
										.addClass('button save')
										.text(options.resources.save)
						)
					)
				);

			$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(headerList));

			var viewidentifiers = $('a.viewidentifiers', $.telligent.evolution.administration.panelWrapper());
			viewidentifiers.on('click', function () {
				$('li.identifiers', $.telligent.evolution.administration.panelWrapper()).each( function() {
					$(this).toggle();
				});

				return false;
			});

			button = $('a.save', $.telligent.evolution.administration.header());

			button.evolutionValidation({
				validateOnLoad: $(options.inputs.nameId).val() != '',
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var applicationId = options.applicationId;
					var name = $(options.inputs.nameId).val();
					var description = options.getDescription();
					
					var groupId = parseInt($(options.inputs.group).val());
					var continueSave = true;
					
					if (groupId != options.groupId && options.hasPermissionOverrides) {
						continueSave = confirm(options.resources.moveWarning);
					}

                    if (continueSave) { 
                        $.telligent.evolution.post({
    						url: options.urls.save,
    						data: {
    							ApplicationId: applicationId,
    							Name: name,
    							Description: description,
    							GroupId: groupId
    						}
    					})
    					.then(function(response) {
    						$.telligent.evolution.notifications.show(options.resources.calendarUpdated);
    						
    						if (options.groupId != -1 && groupId > 0 && options.groupId != groupId) {
								window.location.href = response.redirectUrl;
							}
    					});
                    }

					return false;
				}
			});

			button.evolutionValidation('addField', options.inputs.nameId, { required: true, maxlength: 256 }, '.field-item.name .field-item-validation');
			
			options.inputs.group = $(options.inputs.group)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						panel.searchGroups(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});
					
			if (options.groupName && options.groupId > 0) {
				var initialLookupValue = options.inputs.group.glowLookUpTextBox('createLookUp',
					options.groupId,
					options.groupName,
					options.groupName,
					true);
				options.inputs.group.glowLookUpTextBox('add', initialLookupValue);
			}
			
			options.inputs.group.on('glowLookUpTextBoxChange',
					button.evolutionValidation('addCustomValidation', 'requiredGroup', function () {
						return options.inputs.group.glowLookUpTextBox('count') > 0;
					},
					options.resources.requiredText,
					'.field-item.group .field-item-validation',
					null));
			
			if (options.canDelete == 'True') {
				deleteButton = $('a.delete',  $.telligent.evolution.administration.panelWrapper());

				deleteButton.on('click', function () {
					if (window.confirm(options.resources.deleteConfirmation)) {
						$.telligent.evolution.del({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/calendars/' + options.calendarId + '.json',
							success: function (response) {
								window.location.href = options.urls.groupRedirect;
							}
						});
					}
					return false;
				});
			}
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.calendarOptionsManagement = api;

})(jQuery, window);