(function($)
{
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var _save = function(context)
	{
		$.telligent.evolution.post({
			url: context.saveUrl,
			data: _populateData(context),
			success: function(response)
			{
				if (response.redirectUrl) {
					window.location = response.redirectUrl;
				}
				else if (response.errors) {
					alert(context.saveErrorText + '\n\n' + response.errors[0].error);

					$('#' + context.wrapperId + ' a.save-post').parent().removeClass('processing');
					$('.processing', $('#' + context.wrapperId + ' a.save-post').parent()).css("visibility", "hidden");
					$('#' + context.wrapperId + ' a.save-post').removeClass('disabled');
				}
			},
			defaultErrorMessage: context.saveErrorText,
			error: function(xhr, desc, ex)
			{
				if(xhr.responseJSON.Errors !== null && xhr.responseJSON.Errors.length > 0){
					$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0],{type:'error'});
				}
				else{
					$.telligent.evolution.notifications.show(desc,{type:'error'});
				}
				$('#' + context.wrapperId + ' a.save-post').parent().removeClass('processing');
				$('.processing', $('#' + context.wrapperId + ' a.save-post').parent()).css("visibility", "hidden");
				$('#' + context.wrapperId + ' a.save-post').removeClass('disabled');
			}
		});
	},
	_populateData = function(context)
	{
		var data = {
			Body: context.getBodyContent(),
			ForumId: context.forumId
		};

		if (context.threadTypeQA.length > 0 && context.threadTypeQA.is(':checked'))
		{
			data.IsQuestion = 1;
		}
		else if (context.threadTypeDiscussion.length > 0 && context.threadTypeDiscussion.is(':checked'))
		{
			data.IsQuestion = 0;
		}
		else
		{
			data.IsQuestion = -1;
		}

		if ($('#' + context.subjectId).length > 0)
		{
			data.Subject =  $('#' + context.subjectId).evolutionComposer('val');
		}

		if ($('#' + context.editNotesId).length > 0)
		{
			data.EditNotes = $('#' + context.editNotesId).val();
		}

		if (context.tagBox.length > 0)
		{
			var inTags = context.tagBox.val().split(/[,;]/g);
			var tags = [];
			for (var i = 0; i < inTags.length; i++)
			{
				var tag = $.trim(inTags[i]);
				if (tag) {
					tags[tags.length] = tag;
				}
			}

			data.Tags = tags.join(',');
		}

		if (context.subscribe.length > 0)
		{
			data.Subscribe = context.subscribe.is(':checked') ? 1 : 0;
		}
		else
		{
			data.Subscribe = -1;
		}

		if (context.file)
		{
			data.AttachmentChanged = 1;
			if (context.file.isRemote)
			{
				data.AttachmentName = context.file.fileName;
				data.AttachmentUrl = context.file.url;
				data.AttachmentIsRemote = '1';
			}
			else
			{
				data.AttachmentName = context.file.fileName;
				data.AttachmentContextId = context.file.contextId;
				data.AttachmentIsRemote = '0';
			}
		}
		else if (context.removeAttachment)
		{
			data.RemoveAttachment = 1;
		}

		if (context.lock.length > 0)
		{
			data.IsLocked = context.lock.is(':checked') ? 1 : 0;
		}
		else
		{
			data.IsLocked = -1;
		}

		if (context.suggestAnswer.length > 0)
		{
			data.IsSuggestedAnswer = context.suggestAnswer.is(':checked') ? 1 : 0;
		}
		else
		{
			data.IsSuggestedAnswer = -1;
		}

		if (context.sticky.length > 0 && context.sticky.val() != '0')
		{
			data.StickyDate = $.telligent.evolution.formatDate(new Date((new Date()).getTime() + (parseInt(context.sticky.val(), 10) * 1000 * 60 * 60 * 24)));
			data.HasStickyDate = 1;
		}
		else
		{
			data.HasStickyDate = 0;
		}

		if (context.replyId > 0)
		{
			data.ReplyId = context.replyId;
		}

		if (context.threadId > 0)
		{
			data.ThreadId = context.threadId;
		}

		if (context.replyToThreadId > 0)
		{
			data.ReplyToThreadId = context.replyToThreadId;
		}

		if (context.replyToReplyId > 0)
		{
			data.ReplyToReplyId = context.replyToReplyId;
		}

		return data;
	},
	_attachHandlers = function(context)
	{
		context.attachmentUpdate.on('click', function()
		{
			$.glowModal(context.uploadFileUrl, { width: 500, height: 300, onClose: function(file)
				{
					if (file)
					{
						context.attachmentFileName.text(file.fileName);
						context.fileUploaded = true;
						context.file = file;
						context.attachmentRemove.show();
						context.attachmentUpdate.text(context.attachmentUpdateText);
					}
				}
			});

			return false;
		});

		context.attachmentRemove.on('click', function()
		{
			context.fileUploaded = false;
			context.file = null;
			context.attachmentFileName.text('');
			context.attachmentRemove.hide();
			context.attachmentUpdate.text(context.attachmentAddText);
			context.removeAttachment = true;

			return false;
		});

		if (!context.attachmentFileName.text())
		{
			context.attachmentRemove.hide();
		}

		var saveButton = $('#' + context.wrapperId + ' a.save-post');
		//$.telligent.evolution.navigationConfirmation.enable();
		//$.telligent.evolution.navigationConfirmation.register(saveButton);

		if (context.quoteButton.length > 0)
		{
			context.quoteButton.on('click', function()
			{
				context.saveBodyBookmark();
				var content = $.telligent.glow.utility.getSelectedHtmlInElement(context.quoteText.get(0),true,false,context.quoteInvalidSelectionText);
				if (content)
				{
					context.insertBodyContent('[quote user="' + context.replyToAuthor + '"]' + content + '[/quote]');
				}

				return false;
			});
		}
		
		$(context.cancelLink).on('click', function () {
			if (confirm(context.cancelConfirmationText)) {
			    $.telligent.evolution.navigationConfirmation.ignoreClick();
                window.history.back();
			}
			return false;
		});		
	},
	_addValidation = function(context)
	{
		var saveButton = $('#' + context.wrapperId + ' a.save-post');

		saveButton.evolutionValidation({
			validateOnLoad: context.mediaId <= 0 ? false : null,
			onValidated: function(isValid, buttonClicked, c) {
				if (isValid) {
					saveButton.removeClass('disabled');
				} else {
					saveButton.addClass('disabled');
				}
			},
			onSuccessfulClick: function(e) {
				if (!saveButton.parent().hasClass('processing'))
				{
					saveButton.parent().addClass('processing');
					$('.processing', saveButton.parent()).css("visibility", "visible");
					saveButton.addClass('disabled');
					_save(context);
				}

				return false;
			}
		});

		if ($('#' + context.subjectId).length > 0)
		{
			saveButton.evolutionValidation('addField', '#' + context.subjectId,
				{
					required: true,
					messages: { required: context.subjectRequiredText }
				},
				'#' + context.wrapperId + ' .field-item.post-subject .field-item-validation'
			);
		}

		context.attachBodyChangeScript(saveButton.evolutionValidation('addCustomValidation', 'body', function()
			{
				var body = context.getBodyContent();
				var beginningMatches = body.match(/\[quote((?:\s*)user=(?:\"|&quot;|&#34;).*?(?:\"|&quot;|&#34;))?\]/g);
				var endingMatches = body.match(/\[\/quote(?:\s*)\]/g);
				if ((beginningMatches == null) != (endingMatches == null))
					return false;

				return body.length > 0 && ((beginningMatches == null && endingMatches == null) || beginningMatches.length == endingMatches.length);
			},
			context.bodyRequiredText, '#' + context.wrapperId + ' .field-item.post-body .field-item-validation'
		));

		if (context.editNotesRequired && $('#' + context.editNotesId).length > 0)
		{
			saveButton.evolutionValidation('addField', '#' + context.editNotesId,
				{
					required: true,
					messages: { required: context.editNotesRequiredText }
				},
				'#' + context.wrapperId + ' .field-item.edit-notes .field-item-validation'
			);
		}
	},
	_searchThreads = function(context, question) {
		return $.telligent.evolution.get({
			url: context.searchUrl,
			data: {
				forumId: context.forumId,
				applicationId: context.applicationId,
				contentTypeId: context.forumThreadContentType,
				query: question
			}
		});
	};

	$.telligent.evolution.widgets.createEditPost = {
		register: function(context) {
			var composerOptions = {};

			if(context.supportsQA) {
				composerOptions = {
					plugins: [ 'hashtags', 'autocomplete' ],
					suggestionHeader: context.suggestionHeading + ' <a href="#" onclick="$(document).trigger(\'click\'); return false;" style="float: right;">' + context.close + '</a>',
					onSuggestionList: function(query, complete) {
						_searchThreads(context, query).then(function(response){
							complete(response.results);
						});
					},
					onSuggestionSelect: function(suggestion) {
						if(suggestion.url) {
							window.location = suggestion.url;
						}
					}
				};
			} else {
				composerOptions = {
					plugins: ['hashtags']
				};
			}

			$('#' + context.subjectId).evolutionComposer(composerOptions)
				.evolutionComposer('onkeydown', function(e) {
					if(e.which === 13) {
						return false;
					} else {
						return true;
					}
				});

			if($('#' + context.subjectId).evolutionComposer('val').length > 0) {
				$('#' + context.subjectId).evolutionComposer('release').trigger('blur');
				setTimeout(function(){
					context.focusBodyContent();
				}, 150);
			}

			context.tagBox.evolutionTagTextBox({applicationId:context.applicationId});

			_attachHandlers(context);
			_addValidation(context);
		}
	};
})(jQuery);