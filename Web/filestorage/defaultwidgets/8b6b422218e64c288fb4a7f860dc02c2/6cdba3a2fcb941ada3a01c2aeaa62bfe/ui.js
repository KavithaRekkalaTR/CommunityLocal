(function ($, global) {

	var spinner = '<span class="ui-loading" width="48" height="48"></span>'

	function searchUsers(options, textbox, searchText) {
		if(searchText && searchText.length >= 2) {

			textbox.glowLookUpTextBox('updateSuggestions', [
				textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
			]);

			var selected = {};
			var count = textbox.glowLookUpTextBox('count');
			for (var i = 0; i < count; i++) {
				var item = textbox.glowLookUpTextBox('getByIndex', i);
				if (item) {
					selected[item.Value] = true;
				}
			}

			$.telligent.evolution.get({
				url: options.urls.findUsersUrl,
				data: {
					w_SearchText: searchText
				},
				success: function(response) {
					if (response && response.matches.length > 1) {
						var suggestions = [];
						for (var i = 0; i < response.matches.length; i++) {
							var item = response.matches[i];
							if (item && item.userId) {
								var selectable = !item.alreadySelected && !selected[item.userId];
								suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + options.text.alreadySelected + '</span></div>', selectable));
							}
						}

						textbox.glowLookUpTextBox('updateSuggestions', suggestions);
					} else {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', options.text.noUsersMatchText, options.text.noUsersMatchText, false)
						]);
					}
				},
			});
		}
	}

	function updateVisibleTab(options) {
		var e = options.headerWrapper.find('.filter-option.selected a[data-tab]');
		var tab = options.wrapper.find('.tab.' + e.data('tab'));
		tab.siblings('.tab').css({
			visibility: 'hidden',
			height: '100px',
			width: '800px',
			left: '-1000px',
			position: 'absolute'
		});
		tab.css({
			visibility: 'visible',
			height: 'auto',
			width: 'auto',
			left: '0',
			position: 'static'
		});
		$.fn.uilinks.forceRender();
		
		if (e.data('tab') == 'members') {
			options.hasMore = true;
			$(options.membersList).evolutionScrollable('reset');
			options.headerWrapper.find('.member-options').show();
			options.headerWrapper.find('.role-options').hide();
		} else {
			options.wrapper.scrollTop(0);
			options.headerWrapper.find('.member-options').hide();
			options.headerWrapper.find('.role-options').show();
		}
		$.telligent.evolution.administration.header();
	}

	function checkNoPosts(options) {
		if (options.membersList.find('li').length == 0) {
			options.membersList.append('<div class="message norecords">' + options.text.nomembersText + '</div>');
		}
	}

	function filterPermissions(options, searchText) {
		global.clearTimeout(options.searchTimeout);
		options.searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0) {
				$('.field-item.permission', options.wrapper).show();
				$('.permission-group-header', options.wrapper).show();
			} else {
				var searchTerms = searchText.split(' ');
				$('.field-item.permission', options.wrapper).each(function() {
					var cft = $(this);
					var text = cft.data('text');
					var match = true;
					for (var i = 0; i < searchTerms.length; i++) {
						if (text.indexOf(searchTerms[i]) == -1) {
							match = false;
							break;
						}
					}
					if (match) {
						cft.show();
					} else {
						cft.hide();
					}
				});

				$('.permission-group-header', options.wrapper).each(function() {
					var visibleItems = $(this).parent().find('.field-item.permission').filter(":visible");
					if (visibleItems.length == 0) {
						$(this).hide();
						$(this).parent().children('div.post-attributes').hide();
					}
					else
					{
						$(this).show();
						$(this).parent().children('div.post-attributes').show();
					}
				});

				if ($('.field-item.permission', options.wrapper).filter(":visible").length == 0) {
					$('.message.norecords', options.wrapper).show();
				}
				else {
					$('.message.norecords', options.wrapper).hide();
				}
			}
		}, 125);
	}

	function _deleteRole(roleId, options) {
		var data = {
			RoleId: roleId
		};

		$.telligent.evolution.post({
			url: options.urls.delete,
			data: data,
			success: function (response) {
				$.telligent.evolution.notifications.show(options.text.roleDeleted);
				window.history.back();
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

	function _attachHandlers(options) {
		var saveButton = $('a.save-role', options.headerWrapper);
		saveButton.evolutionValidation({
			validateOnLoad: options.roleId > 0,
			onValidated: function(isValid, buttonClicked, c) {
			},
			onSuccessfulClick: function(e) {
							if (!options.isSaving) {
									options.isSaving = true;
									saveButton.addClass('disabled');
						var selected = [];
						$("input[type='checkbox'][name='permissions']:checked").each(function() {
							selected.push($(this).attr('value'));
						});

						var description = $(options.inputs.descriptionId).val();
						
						if (options.inputs.isPrivateId.length > 0) {
						    var isPrivate = $(options.inputs.isPrivateId).is(':checked');
						}

						var data = {
							Permissions: selected.join(','),
							RoleId: options.roleId,
							CloneRoleId: 0,
							Description: description,
							IsPrivate: isPrivate
						};

						if (options.isSystemRole != "True") {
							var name = $(options.inputs.nameId).val();
							data.Name = name;
						}

						if (options.file && options.file.isNew) {
							data.FileChanged = '1';
							data.FileName = options.file.fileName;
							data.FileContextId = options.uploadContextId;
						}
						else if (options.fileRemoved == 1)
							data.FileRemoved = 1;

						$.telligent.evolution.post({
							url: options.urls.save,
							data: data
						})
						.then(function(response) {
							if (options.roleId == 0) {
								$.telligent.evolution.notifications.show(options.text.roleCreated);
							} else {
								$.telligent.evolution.notifications.show(options.text.roleUpdated);
							}

							$.telligent.evolution.messaging.publish('role.updated', {
								id: response.roleId
							});

							$.telligent.evolution.administration.close();
						})
						.always(function() {
								options.isSaving = false;
								saveButton.removeClass('disabled');
						});
								}

				return false;
			}
		});

		saveButton.evolutionValidation('addField', options.inputs.descriptionId, { required: false, maxlength: 256 }, '.field-item.description .field-item-validation');
		if (options.isSystemRole != "True") {
			saveButton.evolutionValidation('addField', options.inputs.nameId, { required: true, maxlength: 256 }, '.field-item.name .field-item-validation');
		}

		loadNextMembersPage = function(context, pageIndex) {
			context.isLoadingMore = true;

			var data = {
				w_pageindex: pageIndex,
				w_roleid: options.roleId,
				w_querytext: options.queryText
			}

			return $.telligent.evolution.get({
				url: options.urls.pagedMembers,
				data: data
			}).then(function(response){
				context.isLoadingMore = false;
				return response;
			});
		};
	}

	var api = {
		register: function (options) {

			options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);

			options.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(options.headerTemplateId);
			options.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			options.headerWrapper.on('click', '.filter-option a', function() {
				var e = $(this);
				e.parent().siblings('.filter-option').removeClass('selected');
				e.parent().addClass('selected');

				updateVisibleTab(options);

				return false;
			});
			updateVisibleTab(options);

			_attachHandlers(options);

			$('a.revert-to-default', options.wrapper).on('click', function () {
				$("input[type='checkbox'][name='permissions']").each(function(i) {
					$(this).prop('checked', $(this).data('templatevalue')).change();
				});

				return false;
			});

			$('input[type="text"][name="search"]', options.wrapper)
			.on('keyup paste click', function() {
				filterPermissions(options, $(this).val());
			});

			$('a.checkall', options.wrapper).on('click', function () {
				var container = $(this).closest('.permission-group');
				container.find('input[type="checkbox"][name="permissions"]').filter(":visible").each(function() {
					this.checked = true;
					$(this).change();
				});

				return false;
			});

			$('a.checknone', options.wrapper).on('click', function () {
				var container = $(this).closest('.permission-group');
				container.find('input[type="checkbox"][name="permissions"]').filter(":visible").each(function() {
					this.checked = false;
					$(this).change();
				});

				return false;
			});

			$('input[type="checkbox"][name="permissions"]', options.wrapper).on('change', function () {
				var value = $(this).data('value');
				$(this).parent().find('.pill.negative').remove();

				if (value != this.checked) {
					$(this).parent().append('<span class="pill negative">' + options.text.unsavedCustomization + '</span>');
				}
			});

			$.telligent.evolution.messaging.subscribe('administration.role.delete', function (data) {
				var roleId = $(data.target).data('roleid');
				var isMapped = $(data.target).data('ismapped');

				if (isMapped == 'True') {

				}
				else {
					if (confirm(options.text.deleteConfirmation))
						_deleteRole(roleId, options);
				}
			});

			$.telligent.evolution.messaging.subscribe('administration.role.addmember', function (data) {
				var roleId = $(data.target).data('roleid');
				var roleName = $(data.target).data('rolename');

				$.telligent.evolution.administration.open({
					name: options.text.addMemberTo.replace('{0}', roleName),
					content: $.telligent.evolution.get({
						url: options.urls.addMember,
						data: {
							roleId: roleId
						}
					}),
					cssClass: 'administration-roles-addmember'
				});
			});

			$.telligent.evolution.messaging.subscribe('entity.updated', function (data) {
				if (data && data.entity == 'User') {
					global.clearTimeout(options.searchTimeout);
					options.searchTimeout = global.setTimeout(function() {
						options.membersList.empty();
						$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
						options.membersScrollableResults.reset();
					}, 125);
				}
			});

			options.attachment = $('#' + options.attachmentId);
			options.attachmentUpload = options.attachment.find('a.upload');
			options.attachmentRemove = options.attachment.find('a.remove');
			options.attachmentName = options.attachment.find('input');
			options.attachmentPreview = options.attachment.find('.preview');

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
			if (options.file && options.file.fileName) {
				options.attachmentName.attr('readonly', 'readonly');
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
				options.attachmentRemove.show();
			} else if (options.attachment.data('link') != 'True') {
				options.attachmentName.attr('readonly', 'readonly');
			}

			loadPreview();

			options.attachmentName.on('keyup change', function () {
				if (!options.attachmentName.attr('readonly')) {
					options.file = {
						url: $(this).val(),
						isRemote: false,
						isNew: true
					};
					loadPreview();
				}
			});

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
				uploadUrl: options.uploadFileUrl,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', 0));
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					options.file = {
						fileName: file.name,
						isNew: true,
						isRemote: false
					};
					loadPreview();
					options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
					options.attachmentRemove.show();
				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				loadPreview();

				if (!options.file.FileUrl)
					options.attachmentUpload.html(options.attachmentAddText).removeClass('change').addClass('add');
				else
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('change').addClass('add');
			});

			$('.tab.members input[type="text"]', $.telligent.evolution.administration.panelWrapper())
				.on('input', function() {
					var queryText = $(this).val();
					global.clearTimeout(options.searchTimeout);
					options.searchTimeout = global.setTimeout(function() {
						if (queryText != options.queryText) {
							options.queryText = queryText;
							options.membersList.empty();
							$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
							$(options.membersList).evolutionScrollable('reset');
						}
					}, 125);
				});

			options.queryText= '';

			if(options.roleId > 0) {
				options.membersList = $(options.inputs.membersListId, $.telligent.evolution.administration.panelWrapper());

				$(options.membersList).evolutionScrollable({
					load: function(pageIndex) {
						return $.Deferred(function(d){
							var e = options.headerWrapper.find('.filter-option.selected a[data-tab]');
							if (e.data('tab') != 'members')
								d.reject();

							if(options.isLoadingMore || !options.hasMore)
								d.reject();

							loadNextMembersPage(options, pageIndex).then(function(response){
								var items = $('li.content-item', response);
								options.hasMore = $(response).data('hasmore') === true;
								$(options.membersList).append(items);
								d.resolve(true);
							});
						}).promise();
					}
				});
			}

			$.telligent.evolution.messaging.subscribe('administerroles.removefromrole', function (data) {
				var userId = $(data.target).data('userid');
				var username = $(data.target).data('username');
				if (global.confirm(options.text.removeMemberFromRoleConfirmation.replace(/\{0\}/g, username))) {
					$.telligent.evolution.del({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/roles/{RoleId}/user/{UserId}.json',
						data: {
							UserId: userId,
							RoleId: options.roleId
						}
					})
						.then(function() {
							$.telligent.evolution.notifications.show(options.text.removedFromRoleSuccessful.replace(/\{0\}/g, username), {
								type: 'success'
							});
							$('.content-item[data-userid="' + userId + '"]').slideUp('fast', function() { $(this).remove(); });
						});
				}

				return false;
			});

			updateVisibleTab(options);
		}
	};

	var addMemberApi = {
		register: function (options) {

			options.addMemberHeaderWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.addMemberHeaderWrapper);

			var headingTemplate = $.telligent.evolution.template.compile(options.addMemberHeaderTemplateId);
			options.addMemberHeaderWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			options.userToAdd = $(options.inputs.userToAddId)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: false,
					maxValues: 20,
					onGetLookUps: function(tb, searchText) {
						searchUsers(options, tb, searchText);
					},
					emptyHtml: options.text.userLookupPlaceholder,
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});

			options.addToRoleButton = options.addMemberHeaderWrapper.find('.addtorole');
			options.addToRoleButton.on('click', function() {
				if (!options.addToRoleButton.hasClass('disabled')) {
					options.addToRoleButton.addClass('disabled');

					$.telligent.evolution.batch(function() {
						for (var i = 0; i < options.userToAdd.glowLookUpTextBox('count'); i++) {
							$.telligent.evolution.post({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/roles/user/{UserId}.json',
								data: {
									UserId: options.userToAdd.glowLookUpTextBox('getByIndex', i).Value,
									RoleId: options.roleId
								}
							});
						}
					}, {
						sequential: false
					})
					.then(function(response) {
					    if(response && response.BatchResponses) 
					    {
    					    var allSuccess = true;
    					    var anySuccess = false;
    						response.BatchResponses.forEach(function(el) {
		                        if(el.BatchResponse && el.BatchResponse.Errors && el.BatchResponse.Errors.length == 0) {
		                            anySuccess = true;
		                        }
		                        else {
		                            allSuccess = false;
		                        }
						    });
    		                if(anySuccess) {
    		                    var message = allSuccess ? options.text.addRoleSuccessful : options.text.addRoleSomeSuccessful;
                                $.telligent.evolution.notifications.show(message, {
            		                   type: 'success'
                                });
                                $.telligent.evolution.messaging.publish('entity.updated', {
                                    entity: 'User',
                                    properties: ['Roles']
                                });
                                $.telligent.evolution.administration.close();
    		                }
					    }
					})
					.always(function() {
						options.addToRoleButton.removeClass('disabled');
					});
				}

				return false;
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.administrationRolesEdit = api;
	$.telligent.evolution.widgets.administrationRolesAddMember = addMemberApi;

})(jQuery, window);