(function($, global, undef) {

	var model = {
		update: function(context, options) {
			return $.telligent.evolution.post({
				url: context.updateUrl,
				dataType: 'json',
				data: options
			});
		}
	};

	var api = {
		register: function(context) {

			var header = $($.telligent.evolution.template.compile(context.saveTemplateId)({}));
			var saveButton = header.find('a.save');

			$.telligent.evolution.administration.header(header);

			context.attachment = $('#' + context.attachmentId);
			context.attachmentUpload = context.attachment.find('a.upload');
			context.attachmentRemove = context.attachment.find('a.remove');
			context.attachmentName = context.attachment.find('input');
			context.attachmentPreview = context.attachment.find('.preview');

			function loadPreview() {
				if (context.file && (context.file.fileName || context.file.url)) {
					clearTimeout(context.attachmentPreviewTimeout);
					context.attachmentPreviewTimeout = setTimeout(function () {
						var data = {
							w_uploadContextId: context.uploadContextId
						};
						if (context.file.url) {
							data.w_url = context.file.url;
						}
						if (context.file.fileName) {
							data.w_filename = context.file.fileName;
						}
						$.telligent.evolution.post({
							url: context.previewAttachmentUrl,
							data: data,
							success: function (response) {
								response = $.trim(response);
								if (response && response.length > 0 && response !== context.attachmentPreviewContent) {
									context.attachmentPreviewContent = response;
									context.attachmentPreview.html(context.attachmentPreviewContent).removeClass('empty');
								}
							}
						});
					}, 150);
				} else {
					context.attachmentPreviewContent = '';
					context.attachmentPreview.html('').addClass('empty');
				}
			}

			context.attachmentRemove.hide();
			if (context.file && context.file.fileName) {
				context.attachmentName.attr('readonly', 'readonly');
				context.attachmentUpload.html(context.attachmentChangeText).removeClass('add').addClass('change');
				context.attachmentRemove.show();
			} else if (context.attachment.data('link') != 'True') {
				context.attachmentName.attr('readonly', 'readonly');
			}

			loadPreview();

			context.attachmentName.on('keyup change', function () {
				if (!context.attachmentName.attr('readonly')) {
					context.file = {
						url: $(this).val(),
						isRemote: false,
						isNew: true
					}
					loadPreview();
				}
			});

			context.attachmentRemove.on('click', function () {
				context.file = null;
				context.fileRemoved = 1;
				context.attachmentName.val('');
				context.attachmentUpload.html(context.attachmentAddText).removeClass('change').addClass('add')
				if (context.attachment.data('link') == 'True') {
					context.attachmentName.removeAttr('readonly');
				}
				context.attachmentRemove.hide();
				loadPreview();
				return false;
			});

			context.attachmentUpload.glowUpload({
				fileFilter: null,
				uploadUrl: context.uploadFileUrl,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				context.uploading = true;
				context.attachmentUpload.html(context.attachmentProgressText.replace('{0}', 0));
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					context.file = {
						fileName: file.name,
						isRemote: false,
						isNew: true
					}
					context.attachmentName.val(context.file.fileName).attr('readonly', 'readonly');
					loadPreview();
					context.uploading = false;
					context.attachmentUpload.html(context.attachmentChangeText).removeClass('add').addClass('change');
					context.attachmentRemove.show();

				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				context.attachmentUpload.html(context.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				loadPreview();
				context.uploading = false;
				context.attachmentUpload.html(context.attachmentChangeText).removeClass('change').addClass('add');
			});

			var enableItunes = $(context.inputs.enableITunes);
			enableItunes.on('change', function(){
				if(enableItunes.is(':checked')) {
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-category').show();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-explicit').show();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-keywords').show();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-owner-name').show();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-owner-address').show();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-sub-title').show();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-image').show();
				} else {
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-category').hide();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-explicit').hide();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-keywords').hide();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-owner-name').hide();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-owner-address').hide();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-sub-title').hide();
					$.telligent.evolution.administration.panelWrapper().find('li.itunes-image').hide();
				}
			});

			saveButton.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var updateOptions = {
						metaDescription: $(context.inputs.metaDescription).val(),
						metaKeywords: $(context.inputs.metaKeywords).val(),
						pingUrls: $(context.inputs.pingUrls).val(),
						syndicateExternalLinks: $(context.inputs.syndicateExternalLinks).is(':checked')
					};

					// when RSS is enabled
					if($(context.inputs.enableRss).length > 0)
						updateOptions.enableRss = $(context.inputs.enableRss).is(':checked');
					if($(context.inputs.enableAtom).length > 0)
						updateOptions.enableAtom = $(context.inputs.enableAtom).is(':checked');
					if($(context.inputs.enableTagsRss).length > 0)
						updateOptions.enableTagsRss = $(context.inputs.enableTagsRss).is(':checked');
					if($(context.inputs.enableCommentsRss).length > 0)
						updateOptions.enableCommentsRss = $(context.inputs.enableCommentsRss).is(':checked');
					if($(context.inputs.enableItunes).length > 0)
						updateOptions.enableITunes = enableItunes.is(':checked');
					if($(context.inputs.iTunesCategory).length > 0)
						updateOptions.iTunesCategory = $(context.inputs.iTunesCategory).val();
					if($(context.inputs.iTunesExplicit).length > 0)
						updateOptions.iTunesExplicit = $(context.inputs.iTunesExplicit).val();
					if($(context.inputs.iTunesKeywords).length > 0)
						updateOptions.iTunesKeywords = $(context.inputs.iTunesKeywords).val();
					if($(context.inputs.iTunesOwnerName).length > 0)
						updateOptions.iTunesOwnerName = $(context.inputs.iTunesOwnerName).val();
					if($(context.inputs.iTunesOwnerEmail).length > 0)
						updateOptions.iTunesOwnerEmail = $(context.inputs.iTunesOwnerEmail).val();
					if($(context.inputs.iTunesSubTitle).length > 0)
						updateOptions.iTunesSubTitle = $(context.inputs.iTunesSubTitle).val();
					if($(context.inputs.externalFeedUrl).length > 0)
						updateOptions.externalFeedUrl = $(context.inputs.externalFeedUrl).val();

					if (context.file && context.file.isNew) {
						updateOptions.FileChanged = '1';
						updateOptions.FileName = context.file.fileName;
						updateOptions.FileContextId = context.uploadContextId;
					} else if (context.fileRemoved == 1) {
						updateOptions.FileRemoved = 1;
					}

					model.update(context, updateOptions).then(function(){
						$.telligent.evolution.notifications.show(context.text.updateSuccess, { type: 'success' });
					});
				}
			})
			.evolutionValidation('addField', $(context.inputs.externalFeedUrl),
				{
					url: true,
					messages: {
						text: context.text.urlNotValid
					}
				},
				$(context.inputs.externalFeedUrl).closest('.field-item').find('.field-item-validation'), null);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.blogSyndicationApplicationPanel = api;

})(jQuery, window);
