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
					var groupId = parseInt($(options.inputs.groupId).val());

					var allowedThreadTypes = $("input[name='threadTypes']:checked").map(function(){
					      return $(this).val();
					    }).get();

					var threadDefaultType = $(options.inputs.threadDefaultTypeId).val();
					var enabled = $(options.inputs.enabledId).prop("checked");
					var sitemap = $(options.inputs.sitemapId).prop("checked");
					var moderated = $(options.inputs.moderatedId).prop("checked");
					var enablePostStatistics = $(options.inputs.enablePostStatisticsId).prop("checked");
					var enableQualityVoting = $(options.inputs.enableQualityVotingId).prop("checked");
					var autoLock = false;
					if($(options.inputs.autoLockingEnabled))
						autoLock = $(options.inputs.autoLockingEnabled).prop("checked");

					var interval;
					if($(options.inputs.autoLockInterval))
						interval = parseInt($(options.inputs.autoLockInterval).val());

					var suggestedAnswerVoteThreshold = parseInt($(options.inputs.suggestedAnswerVoteThresholdId).val());
					var verifiedAnswerVoteThreshold = parseInt($(options.inputs.verifiedAnswerVoteThresholdId).val());

					var appKey =  $(options.inputs.address).val();

					var continueSave = true;
					if (groupId != options.groupId && options.hasPermissionOverrides == 'True')
					{
						continueSave = confirm(options.resources.forumMoveWarning);
					}

					if(continueSave)
					{
						$.telligent.evolution.post({
							url: options.urls.save,
							data: {
								ApplicationId: applicationId,
								Name: name,
								Description: description,
								Address: appKey,
								GroupId: groupId,
								AllowedThreadTypes: allowedThreadTypes.join(),
								ThreadDefaultType: threadDefaultType,
								Enabled: enabled,
								Sitemap: sitemap,
								Moderated: moderated,
								EnablePostStatistics: enablePostStatistics,
								EnableQualityVoting: enableQualityVoting,
								SuggestedAnswerVoteThreshold: suggestedAnswerVoteThreshold,
								VerifiedAnswerVoteThreshold: verifiedAnswerVoteThreshold,
								AutoLockingEnabled:autoLock,
								AutoLockingDefaultInterval:interval
							}
						})
						.then(function(response) {

							$.telligent.evolution.notifications.show(options.resources.forumUpdated);

							if ((options.groupId != -1 && groupId > 0 && options.groupId != groupId) || appKey != options.applicationKey) {
								window.location.href = response.redirectUrl;
							}
							else if (enabled == false && options.redirect == 'True') {
								window.location.href = options.urls.groupRedirect;
							}
						});
					}

					return false;
				}
			});


			button.evolutionValidation('addField', options.inputs.nameId, { required: true, maxlength: 256 }, '.field-item.name .field-item-validation');
			button.evolutionValidation('addField', options.inputs.suggestedAnswerVoteThresholdId, { required: false, digits: true }, '.field-item.suggested-answer-vote-threshold .field-item-validation');
			button.evolutionValidation('addField', options.inputs.verifiedAnswerVoteThresholdId, { required: false, digits: true }, '.field-item.verified-answer-vote-threshold .field-item-validation');

			button.evolutionValidation('addField', $(options.inputs.address), { required: true, maxlength: 256 }, $(options.inputs.address).closest('.field-item').find('.field-item-validation'), null)
			button.evolutionValidation('addField', $(options.inputs.address), {
				required: true,
				pattern: /^[A-Za-z0-9_-]+$/,
				messages: {
					pattern: options.text.addressPatternMessage
				}
			}, $(options.inputs.address).closest('.field-item').find('.field-item-validation'), null);

            button.evolutionValidation('addField', options.inputs.autoLockInterval, { required: false, digits: true }, '.field-item.auto-lock-interval .field-item-validation');

			if (options.canDelete == 'True') {
				deleteButton = $('a.delete', $.telligent.evolution.administration.panelWrapper());

				deleteButton.on('click', function () {
					if (window.confirm(options.resources.deleteConfirmation)) {
						$.telligent.evolution.del({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/' + options.forumId + '.json',
							success: function (response) {
								window.location.href = options.urls.groupRedirect;
							}
						});
					}
					return false;
				});
			}

	        $("input:checkbox[name='threadTypes']").change(function () {
	        	//ensure one item is always checked
		        if ($("input:checkbox[name='threadTypes']:checked").length == 0)
		        	$(this).prop('checked', true);

		        //show thread default type if both discussion and QnA options are checked
				if ($("input:checkbox[name='threadTypes'][value='Discussion']:checked").val() == 'Discussion'
						&& $("input:checkbox[name='threadTypes'][value='QuestionAndAnswer']:checked").val() == 'QuestionAndAnswer') {
	                $('.field-item.thread-default-type', $.telligent.evolution.administration.panelWrapper()).show();
        		}
	            else {
		            $('.field-item.thread-default-type', $.telligent.evolution.administration.panelWrapper()).hide();
		        }
	        });


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
	$.telligent.evolution.widgets.forumOptionsManagement = api;

})(jQuery, window);