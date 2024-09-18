(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var groupAvatarDiv;

	$.telligent.evolution.widgets.groupConfiguration = {
		register: function(options) {
			groupAvatarDiv = $('div.group-avatar', $.telligent.evolution.administration.panelWrapper());

			var tabs = [];
			$.each(options.tabs, function() {
				var t = this;
				tabs.push({
						name: t.name,
						selected: function() {
							t.element.show();
							},
					unselected: function() {
								t.element.hide();
						}
				});
			});
			options.configApi.registerContent(tabs);

			options.configApi.registerSave(function(saveOptions) {

				var v = options.avatarHeight.val();
				if (isNaN(parseInt(v, 10))) {
					options.avatarHeight.val('300');
				}

				var v = options.avatarWidth.val();
				if (isNaN(parseInt(v, 10))) {
					options.avatarWidth.val('300');
				}

				$.telligent.evolution.post({
					url: options.saveConfigurationUrl,
					data: {
						indexPerRun: options.indexPerRun.val(),
						editCommentAgeLimit: options.editCommentAgeLimit.val(),
						EnableThemes: options.enableThemes.prop("checked"),
						EnableThemeConfig: options.enableThemeConfig.prop("checked"),
						GroupAvatarHeight: options.avatarHeight.val(),
						GroupAvatarWidth: options.avatarWidth.val(),
						EnableGroupUploadedAvatars: options.enableGroupUploadedAvatars.prop("checked"),
						EnableGroupSelectableAvatars: options.enableGroupSelectableAvatars.prop("checked")
					}
				})
					.then(function(response) {
						options.indexPerRun.val(response.indexPerRun);
						saveOptions.success();
					})
					.catch(function() {
						saveOptions.error();
					});
			});

			var avatarsbutton = $('a.selectable-avatars', $.telligent.evolution.administration.panelWrapper());
			avatarsbutton.on('click', function() {
				$.telligent.evolution.administration.open({
					name: options.text.selectableAvatars,
					content: $.telligent.evolution.get({
					url: options.selectableAvatarsUrl,
					}),
					cssClass: 'panel-selectable-avatars'
				});
				return false;
			});

			var changeAvatarsbutton = $('a.change-avatar', $.telligent.evolution.administration.panelWrapper());
			changeAvatarsbutton.on('click', function() {
				$.telligent.evolution.administration.open({
					name: options.text.changeDefaultGroupAvatar,
					content: $.telligent.evolution.get({
					url: options.setAvatarUrl,
					}),
					cssClass: 'panel-change-default-group-avatar'
				});
				return false;
			});
		}
	};

	$.telligent.evolution.widgets.groupAvatarOptionsSelectableAvatars = {
		register: function (options) {
			selectableHeader = $('<ul class="field-list"></ul>')
				.append(
					$('<li class="field-item" id=' + options.attachmentId + '></li>')
						.attr('data-upload', true)
						.attr('data-link', false)
						.append(
							$('<span class="field-item-input upload"></span>')
								.append(
									$('<a href="#"></a>')
										.addClass('button upload add')
										.text(options.attachmentAddText)
						)
					)
				);

			selectableHeader.append(
				$('<li class="field-item delete"></li>')
					.append(
						$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#"></a>')
									.addClass('button delete')
									.text(options.resources.deleteSelectedAvatar)
									.attr('data-messagename', 'delete-group-selectable-avatar')
									.hide()
					)
				)
			);

			$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(selectableHeader));

			$.telligent.evolution.messaging.subscribe('delete-group-selectable-avatar', function (data) {
				if (options.path.length > 0)
					{
					var path = options.path;

					$.telligent.evolution.post({
						url: options.urls.deleteSelectableAvatar,
						data: {
							Path: path
						},
						success: function (response) {
							var elm = $('ul.selectable-avatars').children('li.selectable-avatar.selected');
							elm.slideUp('fast', function() {
								elm.remove();
							});
						}
					});
				}

				$('a.button.delete', selectableHeader).hide();

				return false;
			});

			$.telligent.evolution.messaging.subscribe('select-group-selectable-avatar', function (data) {
				var path = $(data.target).data('path');

				options.path = path;
				$('ul.selectable-avatars').children().removeClass('selected');
				$(data.target).parent().addClass('selected');

				$('a.button.delete', selectableHeader).show();

				return false;
			});

			options.attachment = $('#' + options.attachmentId);
			options.attachmentUpload = options.attachment.find('a.upload');

			options.attachmentUpload.glowUpload({
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
						isRemote: false,
						isNew: true
					};

					options.uploading = false;
					options.attachmentUpload.html(options.attachmentAddText).removeClass('change').addClass('add');

					//save attachment
					$.telligent.evolution.post({
						url: options.urls.addSelectableAvatar,
						data: {
							uploadContextId: options.uploadContextId,
							filename: file.name
						},
						success: function (response) {
							$.telligent.evolution.notifications.show(options.resources.avatarUploaded);
							var path = response.path;

							$.telligent.evolution.get({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ui/image.json',
								data: {
									url: response.url,
									maxHeight: options.avatarHeight,
									maxWidth: options.avatarWidth,
									resizeMethod: 'ZoomAndCrop'
								},
								success: function(response) {
									var avatarlist = $('ul.selectable-avatars');

									var li = $('<li class="content-item selectable-avatar"></li>')
										.append(
											$('<a href="#"></a>')
												.append(response.Html)
												.attr('data-messagename', 'select-group-selectable-avatar')
												.attr('data-path', path)
										);


									avatarlist.append(li);
								}
							});
						}
					});
				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				options.uploading = false;
				options.attachmentUpload.html(options.attachmentAddText).removeClass('change').addClass('add');
			});

			$.telligent.evolution.administration.on('panel.hidden', function(){
				options.attachmentUpload.glowUpload('destroy');
			});
		}
	};

	$.telligent.evolution.widgets.groupAvatarOptionsSetAvatar = {
		register: function (options) {

			options.attachment = $('#' + options.attachmentId);
			options.attachmentUpload = options.attachment.find('a.upload2');

			options.attachmentUpload.glowUpload({
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
						isRemote: false,
						isNew: true
					};

					options.uploading = false;
					options.attachmentUpload.html(options.attachmentAddText).removeClass('change').addClass('add');

					//save attachment
					$.telligent.evolution.post({
						url: options.urls.setUploadedAvatar,
						data: {
							uploadContextId: options.uploadContextId,
							filename: file.name
						},
						success: function (response) {
							$.telligent.evolution.notifications.show(options.resources.avatarUploaded);

							$.telligent.evolution.get({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ui/image.json',
								data: {
									url: response.url.replace('~','') + '?d=' + new Date().getTime(),
									maxHeight: options.avatarHeight,
									maxWidth: options.avatarWidth,
									resizeMethod: 'ZoomAndCrop'
								},
								success: function(response) {
									groupAvatarDiv.empty();
									groupAvatarDiv.append(response.Html);
									$.telligent.evolution.administration.close();
								}
							});
						}
					});
				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				options.uploading = false;
				options.attachmentUpload.html(options.attachmentAddText).removeClass('change').addClass('add');
			});

			var revertAvatarButton = $('a.revert-avatar', $.telligent.evolution.administration.panelWrapper());

			revertAvatarButton.on('click', function() {
				$.telligent.evolution.post({
					url: options.urls.save,
					data: {
						defaultGroupAvatarUrl: options.defaultGroupAvatarUrl
					},
					success: function (response) {
						$.telligent.evolution.get({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ui/image.json',
							data: {
								url: options.defaultGroupAvatarUrl,
								maxHeight: options.avatarHeight,
								maxWidth: options.avatarWidth,
								resizeMethod: 'ZoomAndCrop'
							},
							success: function(response) {
								groupAvatarDiv.empty();
								groupAvatarDiv.append(response.Html);
								$.telligent.evolution.administration.close();
							}
						});
					}
				});

				return false;
			});


			$.telligent.evolution.messaging.subscribe('set-group-default-avatar', function (data) {
				options.selectedAvatarUrl = $(data.target).data('url');

				$.telligent.evolution.post({
					url: options.urls.save,
					data: {
						defaultGroupAvatarUrl: options.selectedAvatarUrl
					},
					success: function (response) {
						$.telligent.evolution.get({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ui/image.json',
							data: {
								url: options.selectedAvatarUrl,
								maxHeight: options.avatarHeight,
								maxWidth: options.avatarWidth,
								resizeMethod: 'ZoomAndCrop'
							},
							success: function(response) {
								groupAvatarDiv.empty();
								groupAvatarDiv.append(response.Html);
								$.telligent.evolution.administration.close();
							}
						});
					}
				});

				return false;
			});
		}
	};
}(jQuery, window));