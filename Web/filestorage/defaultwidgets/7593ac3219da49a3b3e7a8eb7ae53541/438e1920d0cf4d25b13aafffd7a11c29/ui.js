(function ($, global) {
	var headerList = null;

	function loadEditFeatureForm(options, contentId, contentTypeId, name) {

		headerList = $('<ul class="field-list"></ul>')
			.append(
				$('<li class="field-item"></li>')
					.append(
						$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#"></a>')
									.addClass('button save-feature')
									.text(options.text.save)
					)
				)
			);

		$.telligent.evolution.administration.open({
			name: name,
			header: $('<fieldset></fieldset>').append(headerList),
			content: $.telligent.evolution.get({
			url: options.editFeatureUrl,
			data: {
					w_contentId: contentId,
					w_contentTypeId: contentTypeId
				}
			}),
			cssClass: 'featured-content-create'
		});
	}

	function attachHandlers(context) {
		var saveButton = $('a.save-feature', headerList);
		saveButton.on('click', function () {
			if (!$(this).evolutionValidation('isValid')) {
				return;
			}

			save(context);
			return false;
		});
	}

	function addValidation(context) {
		 var saveButton = $('a.save-feature', headerList);

		 saveButton.evolutionValidation({
			 validateOnLoad: null,
			 onValidated: function (isValid, buttonClicked, c) {
				 if (isValid) {
					 saveButton.removeClass('disabled');
				 } else {
					 saveButton.addClass('disabled');
				 }
			 },
			 onSuccessfulClick: function (e) {
				 saveButton.parent().addClass('processing');
				 saveButton.addClass('disabled');
			 }
		 });
	 }

	 function deleteFeature(options) {
		 if (window.confirm(options.deleteConfirmation)) {
			$.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v3/features.json?contentId=' + options.contentId + '&contentTypeId=' + options.contentTypeId,
				success: function (response) {
					$.telligent.evolution.messaging.publish('contextual.feature.deleted', {
						 contentId: options.contentId,
						 contentTypeId: options.contentTypeId
					});

					$.telligent.evolution.notifications.show(options.featuredeleted);
					$.telligent.evolution.administration.close();
				}
			});
		}
		return false;
	 }

	 function save(context) {
		 var saveButton = $('a.save-feature', headerList);
		 var data = createPostRequestData(context);

		 $.telligent.evolution.post({
			 url: context.saveUrl,
			 data: data,
			 success: function (response) {
					$.telligent.evolution.messaging.publish('contextual.feature.edited', {
						 contentId: data.ContentId,
						 contentTypeId: data.ContentTypeId,
						 startDate: data.StartDate,
						 endDate: data.EndDate
					});

				$.telligent.evolution.notifications.show(context.featuresaved);
				$.telligent.evolution.administration.close();
			 },
			 defaultErrorMessage: context.saveErrorText,
			 error: function (xhr, desc, ex) {
				 if (xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0) {
					 $.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0], { type: 'error' });
				 }
				 else {
					 $.telligent.evolution.notifications.show(desc, { type: 'error' });
				 }
				 saveButton.parent().removeClass('processing');
				 saveButton.removeClass('disabled');
			 }
		 });
	 }

	function createPostRequestData(context) {
		var data = {
			ContentId: context.contentId,
			ContentTypeId: context.contentTypeId,
			StartDate: $.telligent.evolution.formatDate(context.startDate.glowDateTimeSelector('val')),
			EndDate: $.telligent.evolution.formatDate(context.endDate.glowDateTimeSelector('val')),
			FileChanged: '0'
		};

		var targets = '';
		var target = $('#' + context.featureTargets).val();
		if (target == 'site')
			targets = '[{"containerid":"' + context.rootGroupId + '","containertypeid":"' + context.groupContainerTypeId + '"}]';
		else if (target == 'group')
			targets = '[{"containerid":"' + context.currentGroupId + '","containertypeid":"' + context.groupContainerTypeId + '"}]';
		else if (target == 'both')
			targets = '[{"containerid":"' + context.rootGroupId + '","containertypeid":"' + context.groupContainerTypeId + '"}, {"containerid":"' + context.currentGroupId + '","containertypeid":"' + context.groupContainerTypeId + '"}]';

		data.Targets = targets;
		if (context.file && context.file.isNew) {
			data.FileChanged = '1';
			data.FileName = context.file.fileName;
			data.FileContextId = context.uploadContextId;
		}
		else if (context.fileRemoved == 1)
			data.FileRemoved = 1;
		return data;
	};

	var api = {
		register: function (options) {
			options.featuresList = $('ul.content-list.features', $.telligent.evolution.administration.panelWrapper());

			$.telligent.evolution.messaging.subscribe('contextual-edit-feature', function (data) {
				var contentId = $(data.target).data('contentid');
				var contentTypeId = $(data.target).data('contenttypeid');
				var name = $(data.target).data('featurename');
				loadEditFeatureForm(options, contentId, contentTypeId, name);
			});

			$.telligent.evolution.messaging.subscribe('contextual-delete-feature', function (data) {
				var contentId = $(data.target).data('contentid');
				var contentTypeId = $(data.target).data('contenttypeid');

				options.contentId = contentId;
				options.contentTypeId = contentTypeId;
				deleteFeature(options);
				return false;
			});

			$.telligent.evolution.messaging.subscribe('contextual-feature-filter', function(data){
				var filter = $(data.target).data('filter');
				options.filter = filter;
				options.featuresList.empty();
				$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
				options.scrollableResults.reset();
				$(data.target).closest('ul').children('li').removeClass('selected');
				$(data.target).parent().addClass('selected');
				$.telligent.evolution.administration.header();
			});

			options.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: options.featuresList,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: options.pagedFeaturesUrl,
							data: {
								w_pageindex: pageIndex,
								w_filter: options.filter
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item ', r);

							if (items.length == 0 && pageIndex == 0) {
								$.telligent.evolution.administration.panelWrapper().append(r);
								d.reject();
							}
							else if (items.length > 0) {
								options.featuresList.append(items);

								if (r.data('hasmore') === true) {
									d.resolve();
								} else {
									d.reject();
								}
							} else {
								d.reject();
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('contextual.feature.edited', function(data){
				// listen for messages published by the feature editing pane to update the feature in the list
				var featureNode = $('.feature[data-contentid="'+data.contentId+'"]');

				var startDateTime = $.telligent.evolution.parseDate(data.startDate);
				$.telligent.evolution.language.formatDateAndTime(startDateTime, function (date) {
					featureNode.find('.startdate').html(date.toString());
				});

				var endDateTime = $.telligent.evolution.parseDate(data.endDate);
				$.telligent.evolution.language.formatDateAndTime(endDateTime, function (date) {
					featureNode.find('.enddate').html(date.toString());
				});
			});

			$.telligent.evolution.messaging.subscribe('contextual.feature.deleted', function(data){
				// listen for messages published by the feature editing pane to update the feature in the list
				var featureNode = $('.feature[data-contentid="'+data.contentId+'"]');
				featureNode.remove();
				featureNode.parent.refresh();
			});

			var headerContainer = $("<fieldset></fieldset>");

			if (options.applicationId == options.containerId) {
				headerContainer.append($('<ul class="field-list"></ul>')
					.append(
						$('<li class="field-item panel-instructions"></li>')
							.append(
								$('<span class="field-item-description"></span>').text(options.text.containerPanelInstructions.replace(/\{0\}/g, options.applicationTypeName))
						)
					)
				);

				var filters = $('<ul class="filter"></ul>');
				filters.append($('<li class="filter-option selected"><a href="#" data-messagename="contextual-feature-filter" data-filter="local">' + options.localContentFilter + '</a></li>'));
				filters.append($('<li class="filter-option"><a href="#" data-messagename="contextual-feature-filter" data-filter="displayed">' + options.displayedContentFilter + '</a></li>'));
				headerContainer.append(filters);
			}
			else
			{
				headerContainer.append($('<ul class="field-list"></ul>')
					.append(
						$('<li class="field-item panel-instructions"></li>')
							.append(
								$('<div></div>').text(options.text.applicationPanelInstructions.replace(/\{0\}/g, options.applicationTypeName))
						)
					)
				);
			}
			$.telligent.evolution.administration.header(headerContainer);
		}
	};

	$.telligent.evolution.widgets.featuredManagementEdit = {
		register: function (context) {
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
					};
					loadPreview();
				}
			});

			context.attachmentRemove.on('click', function () {
				context.file = null;
				context.fileRemoved = 1;
				context.attachmentName.val('');
				context.attachmentUpload.html(context.attachmentAddText).removeClass('change').addClass('add');
				if (context.attachment.data('link') == 'True') {
					context.attachmentName.removeAttr('readonly');
				}
				context.attachmentRemove.hide();
				loadPreview();
				return false;
			});

			context.attachmentUpload.glowUpload({
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
					};
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

			$('a.delete', $.telligent.evolution.administration.panelWrapper()).on('click', function () {
				deleteFeature(context);
				return false;
			});

			context.startDate.glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: false,
					})
			);

			context.endDate.glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: false,
					})
			);

			attachHandlers(context);
			addValidation(context);
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.featureManagement = api;

})(jQuery, window);