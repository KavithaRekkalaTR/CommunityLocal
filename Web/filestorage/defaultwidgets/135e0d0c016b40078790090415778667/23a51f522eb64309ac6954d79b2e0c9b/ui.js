(function ($, global) {
	var headerList, button, deleteButton;

	var spinner = '<span class="ui-loading" width="48" height="48"></span>',
		searchGroups = function(context, textbox, searchText) {
			if(searchText && searchText.length >= 2) {

				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
				]);

				$.telligent.evolution.get({
					url: context.urls.lookupGroups,
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
		checkShowMaxVotesPerIdea = function(options) {
            var maxVotesPerIdea = $(options.inputs.maximumVotesPerIdeaId).closest('.field-item');
            if (!$(options.inputs.allowMultipleVotesId).is(':checked')) {
                maxVotesPerIdea.hide();
            } else {
                maxVotesPerIdea.slideDown(100);
            }
		};



	var api = {
		register: function (options) {
			$.telligent.evolution.administration.size('wide');

            $(options.inputs.allowMultipleVotesId).on('input change', function() {
                checkShowMaxVotesPerIdea(options);
            });
            checkShowMaxVotesPerIdea(options);

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
					var appKey = $(options.inputs.webAddressId).val();
					var description = options.getDescription();
					var groupId = parseInt($(options.inputs.groupId).val());
					var enabled = $(options.inputs.enabledId).prop("checked");
					var moderated = $(options.inputs.moderatedId).prop("checked");
					var requiresCategory = $(options.inputs.requiresCategoryId).prop("checked");
					var maxVotesPerUser = $.trim($(options.inputs.maximumVotesPerUserId).val());
					var maxVotesPerIdea = $.trim($(options.inputs.maximumVotesPerIdeaId).val());
					var allowMultipleVotes = $(options.inputs.allowMultipleVotesId).is(':checked');

					var continueSave = true;
					if (groupId != options.groupId && options.hasPermissionOverrides == 'True')
					{
						continueSave = confirm(options.resources.moveWarning);
					}

					if(continueSave)
					{
						$.telligent.evolution.post({
							url: options.urls.save,
							data: {
								ApplicationId: applicationId,
								Name: name,
								Description: description,
								ApplicationKey: appKey,
								GroupId: groupId,
								Enabled: enabled,
								Moderated: moderated,
								RequiresCategory: requiresCategory,
								MaximumVotesPerUser: maxVotesPerUser == '' ? '0' : maxVotesPerUser,
								MaximumVotesPerIdea: !allowMultipleVotes ? '0' : maxVotesPerIdea,
								AllowMultipleVotes: allowMultipleVotes
							}
						})
						.then(function(response) {
							$.telligent.evolution.notifications.show(options.resources.challengeUpdated);

							if (enabled == false && options.redirect == 'True') {
								window.location.href = options.urls.groupRedirect;
							}
							else if ((options.groupId != -1 && groupId > 0 && options.groupId != groupId) || appKey != options.applicationKey) {
								window.location.href = response.redirectUrl;
							}
						});
					}

					return false;
				}
			});

			button.evolutionValidation('addField', options.inputs.nameId, { required: true, maxlength: 256 }, '.field-item.name .field-item-validation');

			button.evolutionValidation('addField', options.inputs.webAddressId, { required: true, maxlength: 256 }, '.field-item.web-address .field-item-validation');
			button.evolutionValidation('addField', options.inputs.webAddressId, {
				required: true,
				pattern: /^[A-Za-z0-9_-]+$/,
				messages: {
					pattern: options.resources.addressPatternMessage
				}
			}, '.field-item.web-address .field-item-validation');

			button.evolutionValidation('addField', options.inputs.maximumVotesPerUserId, {
			    digits: true
			}, '.field-item.max-votes-per-user .field-item-validation');

			button.evolutionValidation('addField', options.inputs.maximumVotesPerIdeaId, {
			    digits: true
			}, '.field-item.max-votes-per-idea .field-item-validation');

			if (options.canDelete == 'True') {
				deleteButton = $('a.delete',  $.telligent.evolution.administration.panelWrapper());

				deleteButton.on('click', function () {
					if (window.confirm(options.resources.deleteConfirmation)) {
						$.telligent.evolution.del({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/challenge.json?Id=' + options.challengeId,
							success: function (response) {
								window.location.href = options.urls.groupRedirect;
							}
						});
					}
					return false;
				});
			}

			options.inputs.group = $(options.inputs.groupId)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchGroups(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});

			options.inputs.group.on('glowLookUpTextBoxChange', button.evolutionValidation('addCustomValidation', 'requiredGroup', function () {
					return options.inputs.group.glowLookUpTextBox('count') > 0;
				},
				options.resources.requiredText,
				'.field-item.group .field-item-validation',
				null));

			if (options.groupName && options.groupId > 0) {
				var initialLookupValue = options.inputs.group.glowLookUpTextBox('createLookUp',
					options.groupId,
					options.groupName,
					options.groupName,
					true);
				options.inputs.group.glowLookUpTextBox('add', initialLookupValue);
			};

		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.challengeOptionsManagement = api;

})(jQuery, window);