(function($){
	var spinner = '<span class="ui-loading" width="48" height="48"></span>',
		searchGroups = function(context, textbox, searchText) {
			if(searchText && searchText.length >= 2) {

				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
				]);

				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups.json',
					data: {
						GroupNameFilter: searchText,
						Permission: 'Group_CreateGroup'
					},
					success: function(response) {
						if (response && response.Groups.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								$.map(response.Groups, function(group, i) {
									return textbox.glowLookUpTextBox('createLookUp', group.Id, group.Name, group.Name, true);
								}));
						} else {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', context.noGroupsMatchText, context.noGroupsMatchText, false)
							]);
						}
					}
				});
			}
		},
		createGroup = function(context) {
			var createData = {
				Name: context.groupNameInput.val(),
				Description: context.groupDescriptionInput.val(),
				EnableGroupMessages: context.enableMessagesInput.is(':checked'),
				GroupType: $('input:radio[name='+context.groupTypeName+']:checked').val(),
				AutoCreateApplications: false // want to specify which applications to create
			};
			if(context.parentGroupInput.val() !== null && context.parentGroupInput.val().length > 0) {
				createData.ParentGroupId = Number(context.parentGroupInput.val());
			}
			$.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups.json',
				data: createData,
				success: function(response) {
					window.location.href = response.Group.Url;
				}
			});
		};
	var api = {
		register: function(context) {
			context.parentGroupInput
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchGroups(context, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});

			context.groupDescriptionInput.evolutionResize();

			context.createGroupInput
				.evolutionValidation({
					onValidated: function(isValid, buttonClicked, c) {
						if (isValid) {
							context.createGroupInput.removeClass('disabled');
						} else {
							context.createGroupInput.addClass('disabled');
						}
					},
					onSuccessfulClick: function(e) {
						e.preventDefault();
						context.createGroupInput.parent().addClass('processing');
						context.createGroupInput.addClass('disabled');
						// submit the form
						createGroup(context);
					}})
				.evolutionValidation('addField',
					context.groupNameInput,
					{
						required: true,
						groupnameexists: {
							getParentId: function(){
								var parentGroupInput = Number(context.parentGroupInput.val());
								if(!parentGroupInput) {
									parentGroupInput = context.rootGroupId;
								}
								return parentGroupInput;
							}
						},
						messages: {
							required: context.requiredNameValidationMessage,
							groupnameexists: context.uniqueNameValidationMessage
						}
					},
					context.groupNameInput.closest('.field-item').find('.field-item-validation'), null);

			context.parentGroupInput.on('glowLookUpTextBoxChange', function(){
				context.createGroupInput
					.evolutionValidation('validateField', context.groupNameInput);
			});

			if(context.defaultParentGroupName && context.defaultParentGroupId > 0) {
				var initialLookupValue = context.parentGroupInput.glowLookUpTextBox('createLookUp',
					context.defaultParentGroupId,
					context.defaultParentGroupName,
					context.defaultParentGroupName,
					true);
				context.parentGroupInput.glowLookUpTextBox('add', initialLookupValue);
			}
		}
	};

	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.createGroup = api;

}(jQuery));
