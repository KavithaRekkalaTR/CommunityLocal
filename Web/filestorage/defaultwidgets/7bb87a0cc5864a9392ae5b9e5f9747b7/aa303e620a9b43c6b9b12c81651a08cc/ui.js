(function ($) {

	if (!$.telligent) $.telligent = {};
	if (!$.telligent.evolution) $.telligent.evolution = {};
	if (!$.telligent.evolution.widgets) $.telligent.evolution.widgets = {};

	var model = {
		subscribe: function (blogId, postId) {
			return $.telligent.evolution.post({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts/{Id}/subscriptions.json',
				data: {
					BlogId: blogId,
					Id: postId
				}
			});
		},
		unsubscribe: function (blogId, postId) {
			return $.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts/{Id}/subscriptions.json',
				data: {
					BlogId: blogId,
					Id: postId,
					IsSubscribed: false
				}
			});
		},
		deletePost: function (blogId, postId) {
			return $.telligent.evolution.del({
				url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts/{Id}.json',
				data: {
					BlogId: blogId,
					Id: postId
				}
			});
		},
		creatOrUpdatePost: function (blogId, postId, shouldSubscribe, isSubscribed, data) {
			return $.Deferred(function (d) {
				// update post
				if (postId > 0) {
					data.PostId = postId;
					$.telligent.evolution.put({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts/{PostId}.json?IncludeFields=BlogPost.Id,BlogPost.Url,BlogPost.IsPostEnabled',
						data: data,
						success: function (response) {
							// create or update subscription
							if (!shouldSubscribe && isSubscribed) {
								model.unsubscribe(blogId, postId).then(function () {
									d.resolve(response.BlogPost);
								});
							} else if (shouldSubscribe && !isSubscribed) {
								model.subscribe(blogId, postId).then(function () {
									d.resolve(response.BlogPost);
								});
							} else {
								d.resolve(response.BlogPost);
							}
						},
						error: function (xhr, desc, ex) {
							d.reject(xhr);
							if (xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0)
								$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0],{type:'error'});
							else
								$.telligent.evolution.notifications.show(desc,{type:'error'});
						}
					});
					// create post
				} else {
					$.telligent.evolution.post({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts.json?IncludeFields=BlogPost.Id,BlogPost.Url,BlogPost.IsPostEnabled',
						data: data,
						success: function (response) {
							// create subscription
							if (shouldSubscribe) {
								model.subscribe(blogId, response.BlogPost.Id).then(function () {
									d.resolve(response.BlogPost);
								});
							} else {
								d.resolve(response.BlogPost);
							}
						},
						error: function (xhr, desc, ex) {
							d.reject(xhr);
							if (xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0)
								$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0],{type:'error'});
							else
								$.telligent.evolution.notifications.show(desc,{type:'error'});
						}
					});
				}
			}).promise();
		},
		searchAuthors: function (context, blogId, query) {
			return $.telligent.evolution.get({
				url: context.searchAuthorsUrl,
				data: {
					_w_blogId: blogId,
					_w_query: query
				}
			});
		}
	}

	function deleteClick(context) {
		model.deletePost(context.blogId, context.postId).then(function () {
			window.location = context.blogUrl;
		});
	}

	function trackChars(context, field, maxLength) {
		var curLen = field.val().length;
		var togo = maxLength - curLen;
		var label = field.parent().next('span.character-count');

		if (togo >= 0) {
			label.html(curLen + ' ' + context.charactersRemain);
			label.removeClass('field-item-validation');
		}
		else {
			label.html((togo * -1) + ' ' + context.charactersOver);
			label.addClass('field-item-validation');
		}
	}

	function submitClick(context, enable) {

		// build data
		var data = {
			Title: context.title.evolutionComposer('val'),
			Body: context.getBody(),
			BlogId: context.blogId,
			Slug: context.slug.val(),
			PublishedDate: $.telligent.evolution.formatDate(context.publicationDate.glowDateTimeSelector('val')),
			IsApproved: enable,
			AuthorId: context.authorInput.val() || $.telligent.evolution.user.accessing.id
		};

		// parse tags
		var inTags = context.tags.val().split(/[,;]/g);
		var tags = [];
		for (var i = 0; i < inTags.length; i++) {
			var tag = $.trim(inTags[i]);
			if (tag)
				tags[tags.length] = tag;
		}
		data.Tags = tags.join(',');

        if (context.postImageAlternateText && context.postImageAlternateText.length > 0)
            data.PostImageAlternateText = context.postImageAlternateText.val();

		if (context.metaTitle && context.metaTitle.length > 0)
			data.MetaTitle = context.metaTitle.val();
		if (context.metaKeywords && context.metaKeywords.length > 0)
			data.MetaKeywords = context.metaKeywords.val();


		// post summaries
		switch (context.summary.val()) {
			case 'none':
				data.UsePostSummary = false;
				data.GeneratePostSummary = false;
				data.Excerpt = '';
				break;
			case 'automatic':
				data.UsePostSummary = true;
				data.GeneratePostSummary = true;
				data.Excerpt = '';
				break;
			case 'custom':
				data.UsePostSummary = true;
				data.GeneratePostSummary = false;
				data.Excerpt = context.customSummary.val();
				break;
		}

		data.IsCrossPostingEnabled = $(context.IsCrossPostingEnabled).is(':checked');

		// attachment
		if (context.file) {
			if (context.file.isNew) {
				if (context.file.isRemote) {
					data.FileUrl = context.file.url;
				} else {
					data.FileUploadContext = context.uploadContextId;
					data.FileName = context.file.fileName;
				}
			}
		} else {
			data.RemoveAttachment = true;
		}

		if (context.postimagefile) {
			if (context.postimagefile.isNew) {
				if (context.postimagefile.isRemote) {
					data.PostImageUrl = context.postimagefile.url;
				} else {
					data.PostImageFileUploadContext = context.postimageuploadContextId;
					data.PostImageFileName = context.postimagefile.fileName;
				}
			}
		} else {
			data.RemovePostImage = true;
		}

		// create or update post, process subscriptions, and redirect to new/updated post url
		model.creatOrUpdatePost(context.blogId, context.postId, $(context.subscribe).is(':checked'), context.subscribed, data).then(function (blogPost) {
			if (!enable) {
				context.postId = blogPost.Id;
				$.telligent.evolution.notifications.show(context.draftSavedText, { type: 'success' });
				$('.processing', context.save.parent()).css("visibility", "hidden");
				context.save.removeClass('disabled');
				context.saveDraft.removeClass('disabled');
				context.isSaving = false;
			} else {
				window.location = blogPost.IsPostEnabled ? blogPost.Url : context.blogUrl;
			}
		}, function () {
			context.isSaving = false;
			$('.processing', context.save.parent()).css("visibility", "hidden");
			context.save.removeClass('disabled');
			context.saveDraft.removeClass('disabled');
		});
	}

	$.telligent.evolution.widgets.blogCreateEditPost = {
		register: function (context) {

			// enable blog tags
			if (context.tags) {
				context.tags.evolutionTagTextBox({ applicationId: context.applicationId });
			}

			// set up hashtags in the title
			context.title.evolutionComposer({
				plugins: ['hashtags'],
				contentTypeId: context.blogPostContentTypeId
			}).evolutionComposer('onkeydown', function (e) {
				if (e.which === 13) {
					return false;
				} else {
					return true;
				}
			});

			trackChars(context, context.metaTitle, 55);
			context.metaTitle.on('keyup', function () {
				trackChars(context, $(this), 55);
			});

			// saving post
			context.saveDraft.on('click', function () {
				context.save.trigger({ type: "click", isDraft: true });
				return false;
			});

			// navigation confirmation
			$.telligent.evolution.navigationConfirmation.enable();
			$.telligent.evolution.navigationConfirmation.register(context.save.add(context.deleteLink).add(context.saveDraft));

			// validation support

			var tabbedPanes = $(context.tabsSelector);
			context.save.evolutionValidation({
				validateOnLoad: context.pageId <= 0 ? false : null,
				onValidated: function (isValid, buttonClicked, c) {
					if (isValid && !context.isSaving) {
						context.save.removeClass('disabled');
						context.saveDraft.removeClass('disabled');
					} else {
						context.save.addClass('disabled');
						context.saveDraft.addClass('disabled');

						if (c) {
							var tabbedPane = tabbedPanes.glowTabbedPanes('getByIndex', c.tab);
							if (tabbedPane)
								tabbedPanes.glowTabbedPanes('selected', tabbedPane);
						}
					}
				},
				onSuccessfulClick: function (e) {
					if (!context.isSaving) {
						context.isSaving = true;
						$('.processing', context.save.parent()).css("visibility", "visible");
						context.save.addClass('disabled');
						context.saveDraft.addClass('disabled');
						submitClick(context, !e.isDraft);
					}
				}
			});

			context.save.evolutionValidation('addField', context.titleSelector, {
				required: true,
				messages: {
					required: context.titleRequiredText
				}
			}, '#' + context.wrapperId + ' .field-item.post-name .field-item-validation', { tab: 0 });

			context.save.evolutionValidation('validate');

			var f = context.save.evolutionValidation('addCustomValidation', 'pagetext',
				function () { return context.getBody().length > 0; },
				context.bodyRequiredText,
				'#' + context.wrapperId + ' .field-item.post-body .field-item-validation',
				{ tab: 0 });

			context.attachBodyChangeHandler(f);

			// delete support
			$(context.deleteLink).on('click', function () {
				if (confirm(context.deleteConfirmationText)) {
					deleteClick(context);
				}
			});

			$(context.cancelLink).on('click', function () {
				if (confirm(context.cancelConfirmationText)) {
                    $.telligent.evolution.navigationConfirmation.ignoreClick();
                    window.history.back();
                }
                return false;
			});

            // summary type selection
			$(context.summary).on('change', function () {
				if ($(this).val() == 'custom') {
					$(context.customSummaryFields).show();
				} else {
					$(context.customSummaryFields).hide();
				}
			});

			// publication date setup
			context.publicationDate.glowDateTimeSelector(
				$.extend({}, $.fn.glowDateTimeSelector.dateTimeDefaults, {
					showPopup: true,
					allowBlankvalue: false,
				})
			);

			// attachment uploading
			context.attachment = $('#' + context.attachmentId);
			context.attachmentUpload = context.attachment.find('a.upload');
			context.attachmentRemove = context.attachment.find('a.remove');
			context.attachmentName = context.attachment.find('input');
			context.attachmentPreview = context.attachment.find('.preview');

			function loadPreview() {
				if (context.file && (context.file.fileName || context.file.url)) {
					clearTimeout(context.attachmentPreviewTimeout);
					context.attachmentPreviewTimeout = setTimeout(function () {
						if (context.file) {
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
						}
					}, 150);
				} else {
					context.attachmentPreviewContent = '';
					context.attachmentPreview.html('').addClass('empty');
				}
			}


			context.attachmentRemove.hide();
			if (context.file && context.file.url && context.file.isRemote) {
				context.attachmentRemove.hide();
			} else if (context.file && context.file.fileName && !context.file.isRemote) {
				context.attachmentName.attr('readonly', 'readonly');
				context.attachmentUpload.html(context.attachmentChangeText).removeClass('add').addClass('change');
				context.attachmentRemove.show();
			} else if (context.attachment.data('link') != 'True') {
				context.attachmentName.attr('readonly', 'readonly');
			}

			loadPreview();
			context.attachmentName.on('keyup change', function () {
				if (!context.attachmentName.attr('readonly')) {
					if ($.trim($(this).val()).length == 0) {
						context.file = null;
					} else {
						context.file = {
							url: $(this).val(),
							isRemote: true,
							isNew: true
						}
					}
					loadPreview();
				}
			});

			context.attachmentRemove.on('click', function () {
				context.file = null;
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
				contentTypeId: context.contentTypeId,
				applicationTypeId: context.applicationTypeId,
				applicationId: context.applicationId
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
			.on('glowUploadError', function (e) {
				context.uploading = false;
				context.file = null;
				context.attachmentName.val('');
				context.attachmentUpload.html(context.attachmentAddText).removeClass('change').addClass('add')
				if (context.attachment.data('link') == 'True') {
					context.attachmentName.removeAttr('readonly');
				}
				context.attachmentRemove.hide();
				loadPreview();
			});

			// postimage uploading
			context.postimageattachment = $('#' + context.postimageId);
			context.postimageattachmentUpload = context.postimageattachment.find('a.upload');
			context.postimageattachmentRemove = context.postimageattachment.find('a.remove');
			context.postimageattachmentName = context.postimageattachment.find('input');
			context.postimageattachmentPreview = context.postimageattachment.find('.preview');

			function loadPostImagePreview() {
				if (context.postimagefile && (context.postimagefile.fileName || context.postimagefile.url)) {
					clearTimeout(context.postimageattachmentPreviewTimeout);
					context.postimageattachmentPreviewTimeout = setTimeout(function () {
						var data = {
							w_uploadContextId: context.postimageuploadContextId
						};
						if (context.postimagefile.url) {
							data.w_url = context.postimagefile.url;
						}
						if (context.postimagefile.fileName) {
							data.w_filename = context.postimagefile.fileName;
						}

						$.telligent.evolution.post({
							url: context.previewAttachmentUrl,
							data: data,
							success: function (response) {
								response = $.trim(response);
								if (response && response.length > 0 && response !== context.postimageattachmentPreviewContent) {
									context.postimageattachmentPreviewContent = response;
									context.postimageattachmentPreview.html(context.postimageattachmentPreviewContent).removeClass('empty');
								}
							}
						});
					}, 150);
				} else {
					context.postimageattachmentPreviewContent = '';
					context.postimageattachmentPreview.html('').addClass('empty');
				}
			}

			context.postimageattachmentRemove.hide();
			if (context.postimagefile && context.postimagefile.url && context.postimagefile.isRemote) {
				context.postimageattachmentRemove.hide();
			} else if (context.postimagefile && context.postimagefile.fileName && !context.postimagefile.isRemote) {
				context.postimageattachmentName.attr('readonly', 'readonly');
				context.postimageattachmentUpload.html(context.postimageattachmentChangeText).removeClass('add').addClass('change');
				context.postimageattachmentRemove.show();
			} else if (context.postimageattachment.data('link') != 'True') {
				context.postimageattachmentName.attr('readonly', 'readonly');
			}

			loadPostImagePreview();

			context.postimageattachmentRemove.on('click', function () {
				context.postimagefile = null;
				context.postimageattachmentName.val('');
				context.postimageattachmentUpload.html(context.attachmentAddText).removeClass('change').addClass('add')
				if (context.postimageattachment.data('link') == 'True') {
					context.postimageattachmentName.removeAttr('readonly');
				}
				context.postimageattachmentRemove.hide();
				loadPostImagePreview();
				return false;
			});

			context.postimageattachmentUpload.glowUpload({
				fileFilter: null,
				uploadUrl: context.postimageuploadFileUrl,
				renderMode: 'link',
				type: 'image',
				contentTypeId: context.contentTypeId,
				applicationTypeId: context.applicationTypeId,
				applicationId: context.applicationId
			})
			.on('glowUploadBegun', function (e) {
				context.uploading = true;
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					context.postimagefile = {
						fileName: file.name,
						isRemote: false,
						isNew: true
					}
					context.postimageattachmentName.val(context.postimagefile.fileName).attr('readonly', 'readonly');
					loadPostImagePreview();
					context.uploading = false;
					context.postimageattachmentUpload.html(context.attachmentChangeText).removeClass('add').addClass('change');
					context.postimageattachmentRemove.show();
				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				context.postimageattachmentUpload.html(context.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function (e) {
			    context.uploading = false;
			    context.postimagefile = null;
				context.postimageattachmentName.val('');
				context.postimageattachmentUpload.html(context.attachmentAddText).removeClass('change').addClass('add')
				if (context.postimageattachment.data('link') == 'True') {
					context.postimageattachmentName.removeAttr('readonly');
				}
				context.postimageattachmentRemove.hide();
				loadPostImagePreview();
			});

            // author
            if (context.authorEditable == true) {
                context.authorInput = context.authorInput.glowLookUpTextBox({
                    maxValues: 1,
                    minimumLookUpLength: 0,
                    onGetLookUps: function(tb, searchText) {
                        model.searchAuthors(context, context.blogId, searchText).then(function(response){
                            if (response && response.authors && response.authors.length >= 1) {
                                context.authorInput.glowLookUpTextBox('updateSuggestions',
                                    $.map(response.authors, function(author, i) {
                                        return context.authorInput.glowLookUpTextBox('createLookUp', author.id, author.name, author.name, true);
                                    }));
                            } else {
                                context.authorInput.glowLookUpTextBox('updateSuggestions', [
                                    context.authorInput.glowLookUpTextBox('createLookUp', '', context.noMatchesFoundText, context.noMatchesFoundText, false)
                                ]);
                            }
                        });
                    },
                    selectedLookUpsHtml: [ context.authorName ]
                });
            }
			// tab setup
			$(context.tabsSelector).glowTabbedPanes({
				cssClass: 'tab-pane',
				tabSetCssClass: 'tab-set with-panes',
				tabCssClasses: ['tab'],
				tabSelectedCssClasses: ['tab selected'],
				tabHoverCssClasses: ['tab hover'],
				enableResizing: false,
				tabs: [
					[context.writeTabId, context.writeTabLabel, null],
					[context.optionsTabId, context.optionsTabLabel, null]
				]
			});
		}
	};

})(jQuery);