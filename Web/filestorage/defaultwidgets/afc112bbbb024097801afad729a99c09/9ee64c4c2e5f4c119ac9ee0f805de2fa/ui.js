(function ($, global) {
	var headerList, button, deleteButton;

	var spinner = '<span class="ui-loading" width="48" height="48"></span>',
		searchGroups = function(options, textbox, searchText) {
			if(searchText && searchText.length >= 2) {

				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
				]);

				$.telligent.evolution.get({
					url: options.urls.lookupGroups,
					data: {
						GroupNameFilter: searchText,
						Permission: 'Group_CreateGroup'
					},
					success: function(response) {
						if (response && response.Groups && response.Groups.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								$.map(response.Groups, function(group, i) {
									return textbox.glowLookUpTextBox('createLookUp', group.Id, group.Name, group.Name, true);
								}));
						} else {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', options.resources.noGroupsMatch, options.resources.noGroupsMatch, false)
							]);
						}
					}
				});
			}
		};

	var api = {
		register: function (options) {
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

			button = $('a.save', headerList);
			button.evolutionValidation({
				validateOnLoad: $(options.inputs.nameId).val() != '',
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var applicationId = options.applicationId;

					var groupType = $("input:radio[name='GroupType']:checked").val();

					var continueSave = true;
					if (options.originalGroupType != groupType)
					{
						continueSave = confirm(options.resources.groupTypeChangeWarning);
					}

					if(continueSave)
					{
						var description = $(options.inputs.descriptionId).val();
						var enableMessages = $(options.inputs.enableMessagesId).prop("checked");
						var enableContactForm = $(options.inputs.enableContactFormId).prop("checked");
												var name = $(options.inputs.nameId).val();

						var data = {
							ApplicationId: applicationId,
							Name: name,
							Description: description,
							GroupType: groupType,
							EnableMessages: enableMessages,
							EnableContactForm: enableContactForm
						};

						if (options.parentGroupId != -1) {
							var applicationKey = $(options.inputs.applicationKeyId).val();
							data.ApplicationKey = applicationKey;

							var parentGroupId = parseInt($(options.inputs.parentGroupId).val());
							data.ParentGroupId = parentGroupId;
						}

						if (options.file && options.file.fileName && options.file.isNew) {
							data.FileChanged = '1';
							data.FileName = options.file.fileName;
							data.FileContextId = options.uploadContextId;
						}
						else if (options.file && options.file.url && options.file.isNew) {
								data.FileChanged = '2';
								data.FileName = options.file.url;
						} else if (options.fileRemoved == 1)
							data.FileRemoved = 1;

						$.telligent.evolution.post({
							url: options.urls.save,
							data: data
						})
						.then(function(response) {
							$.telligent.evolution.notifications.show(options.resources.groupUpdated);

							if (options.parentGroupId != -1 && parentGroupId > 0 && options.parentGroupId != parentGroupId)
								window.location.href = response.redirectUrl;
							else if (options.parentGroupId != -1 && options.originalApplicationKey != applicationKey)
								window.location.href = response.redirectUrl;
						});
					}

					return false;
				}
			});

			button.evolutionValidation('addField', options.inputs.descriptionId, { required: false, maxlength: 256 }, '.field-item.description .field-item-validation');

			if (options.parentGroupId != -1) {
				button.evolutionValidation('addField', options.inputs.applicationKeyId, {
					required: true,
					pattern: /^[A-Za-z0-9_-]+$/,
					maxlength: 256,
					messages: {
						pattern: options.resources.addressPatternMessage
					}
				}, '.field-item.application-key .field-item-validation');
			}

			if (options.parentGroupId != -1) {
				button.evolutionValidation('addField', options.inputs.nameId, {
					required: true,
					maxlength: 256
				}, '.field-item.name .field-item-validation');
			}

			if (options.canDeleteGroups == 'True') {
				deleteButton = $('a.delete', $.telligent.evolution.administration.panelWrapper());

				if(options.hasChildGroups == 'True')
				{
					deleteButton.on('click', function () {
						alert(options.resources.childGroupMessage);

						return false;
					});
				}
				else
				{
					deleteButton.on('click', function () {
						if (window.confirm(options.resources.deleteConfirmation)) {
							$.telligent.evolution.del({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/' + options.groupId + '.json?DeleteApplications=true',
								success: function (response) {
									window.location.href = options.urls.groupDeleteRedirect;
								}
							});
						}
						return false;
					});
				}
			}
			options.inputs.parentGroup = $(options.inputs.parentGroupId);
			if (options.inputs.parentGroup.length > 0) {
					options.inputs.parentGroup
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

							options.inputs.parentGroup.on('glowLookUpTextBoxChange', button.evolutionValidation('addCustomValidation', 'requiredGroup', function () {
										return options.inputs.parentGroup.glowLookUpTextBox('count') > 0;
								},
						options.resources.requiredText,
						'.field-item.parent-group .field-item-validation',
						null));

					if (options.parentGroupName && options.parentGroupId > 0) {
						var initialLookupValue = options.inputs.parentGroup.glowLookUpTextBox('createLookUp',
							options.parentGroupId,
							options.parentGroupName,
							options.parentGroupName,
							true);
						options.inputs.parentGroup.glowLookUpTextBox('add', initialLookupValue);
					}
			}

			options.attachment = $('#' + options.attachmentId);
			options.attachmentUpload = options.attachment.find('a.upload', $.telligent.evolution.administration.panelWrapper());
			options.attachmentRemove = options.attachment.find('a.remove', $.telligent.evolution.administration.panelWrapper());
			options.attachmentName = options.attachment.find('input');
			options.attachmentPreview = options.attachment.find('.preview');
			options.selectFile = options.attachment.find('a.select', $.telligent.evolution.administration.panelWrapper());

			options.selectFile.on('click', function() {
				$.telligent.evolution.administration.open({
					name: options.resources.selectAvatar,
					content: $.telligent.evolution.get({
							url: options.urls.selectAvatar,
					}),
					cssClass: 'panel-selectable-avatars'
				});
				return false;
			});

			$.telligent.evolution.messaging.subscribe('groupoptions.avatarselected', function(d) {
				options.file = {
					url: d.url,
					fileName: null,
					isSelected: true,
					isNew: true
				};
				loadPreview();
				options.uploading = false;
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
				options.attachmentRemove.show();
			});

			function loadPreview() {
				if (options.file && (options.file.fileName || options.file.url)) {
					clearTimeout(options.attachmentPreviewTimeout);
					options.attachmentPreviewTimeout = setTimeout(function () {
						var data = {
							w_uploadContextId: options.uploadContextId
						};
						if (options.file.url) {
							data.w_url = options.file.url;
						}
						if (options.file.fileName) {
							data.w_filename = options.file.fileName;
						}
						$.telligent.evolution.post({
							url: options.previewAttachmentUrl,
							data: data,
							success: function (response) {
								response = $.trim(response);
								if (response && response.length > 0 && response !== options.attachmentPreviewContent) {
									options.attachmentPreviewContent = response;
									options.attachmentPreview.html(options.attachmentPreviewContent).removeClass('empty');
								}
							}
						});
					}, 150);
				} else {
					options.attachmentPreviewContent = '';
					options.attachmentPreview.html('').addClass('empty');
				}
			}

			options.attachmentRemove.hide();
			if (options.file && (options.file.fileName || options.file.url)) {
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
				options.attachmentRemove.show();
			}

			loadPreview();

			options.attachmentRemove.on('click', function () {
				options.file = null;
				options.fileRemoved = 1;
				options.attachmentName.val('');
				options.attachmentUpload.html(options.attachmentAddText).removeClass('change').addClass('add');
				if (options.attachment.data('link') == 'True') {
					options.attachmentName.removeAttr('readonly');
				}
				options.attachmentRemove.hide();
				loadPreview();
				return false;
			});

			options.attachmentUpload.glowUpload({
				fileFilter: null,
				uploadUrl: options.uploadFileUrl,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				options.uploading = true;
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', 0));
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					options.file = {
						fileName: file.name,
						url: null,
						isSelected: false,
						isNew: true
					};
					options.attachmentName.val(options.file.fileName).attr('readonly', 'readonly');
					loadPreview();
					options.uploading = false;
					options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
					options.attachmentRemove.show();
				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				options.uploading = false;
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('change').addClass('add');
			});

		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.groupOptionsPanel = api;

})(jQuery, window);
