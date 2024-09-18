(function($, global, undef) {

	function editComment(context, commentId) {
		$.telligent.evolution.administration.open({
			name: context.editCommentText,
			cssClass: 'contextual-comments edit',
			content: $.telligent.evolution.get({
				url: context.editCallback,
				data: {
					commentId: commentId
				}
			})
		});
	};

	function deleteComment(commentId) {
		return $.telligent.evolution.del({
			url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments/{CommentId}.json',
			data: {
				CommentId: commentId
			}
		});
	}

	function search(context, query) {
		return $.telligent.evolution.get({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/search.json',
			data: {
				Query: query,
				ApplicationId: context.applicationId,
				Filters: context.searchFilters,
				PageSize: 10,
				PageIndex: 0
			}
		});
	}

	function listComments(context, pageIndex) {
		var listQuery = $.extend({}, context.listQueryContext, {
			pageIndex: pageIndex
		});

		return $.telligent.evolution.get({
			url: context.listCallback,
			data: listQuery
		});
	}

	var api = {
		register: function(options) {
			var context = options;
			context.commentsList = $(options.commentsListId);

			context.listQueryContext = {};
			if(context.contentTypeId && context.contentId) {
				context.listQueryContext = {
					ContentTypeId: context.contentTypeId,
					ContentId: context.contentId
				};
			} else if(context.applicationId) {
				context.listQueryContext = {
					ApplicationId: context.applicationId
				};
			}

			// pagings
			context.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.commentsList,
				load: function(pageIndex) {
					return $.Deferred(function(d){
						listComments(context, pageIndex).then(function(r){
							// if there was more content, resolve it as true to continue loading
							if($.trim(r).length > 0) {
								context.commentsList.append(r);
								d.resolve();
							} else {
								d.reject();
								// if still the first page, then show the 'no content message'
								if(pageIndex === 0) {
									context.commentsList.append('<div class="message norecords">' + context.noCommentsText + '</div>');
								}
							}
						}).catch(function(){
							d.reject();
						})
					});
				}
			});

			// deleting
			$.telligent.evolution.messaging.subscribe('inline-contextual-delete-comment', function(data){
				if(confirm(context.deleteVerificationText)) {
					var commentId = $(data.target).data('commentid');
					deleteComment(commentId).then(function(){
						$.telligent.evolution.messaging.publish('contextual-delete-comment-deleted', {
							commentId: commentId
						});
					});
				}
			});
			$.telligent.evolution.messaging.subscribe('contextual-delete-comment', function(data){
				if(confirm(context.deleteVerificationText)) {
					var commentId = $(data.target).data('commentid');
					$.telligent.evolution.administration.close();
					deleteComment(commentId).then(function(){
						$.telligent.evolution.messaging.publish('contextual-delete-comment-deleted', {
							commentId: commentId
						});
					});
				}
			});
			$.telligent.evolution.messaging.subscribe('contextual-delete-comment-deleted', function(data) {
				var comment = $('.comment[data-commentid="' + data.commentId + '"]', context.wrapper);
				comment
					.parents('li.content-item')
					.slideUp(function() {
						comment.parents('li.content-item').remove();
					})
				.find('.ui-links').uilinks('hide');
			});

			// editing
			$.telligent.evolution.messaging.subscribe('contextual-edit-comment', function(data){
				editComment(options, $(data.target).data('commentid'));
			})
			$.telligent.evolution.messaging.subscribe('contextual.comments.edited', function(data){
				// listen for messages published by the comment editing pane to update the comment body in the list
				var commentNode = $('.comment[data-commentid="'+data.commentId+'"]');
				commentNode.find('.content').html(data.newBody);
				if(data.approved) {
					commentNode.find('.approval span').html(context.approvedText);
				} else {
					commentNode.find('.approval span').html(context.notApprovedText);
				}
			});

			// filtering
			context.searchInput = $(context.searchInputId);
			context.searchInput
				.css({
					color: '#000'
				})
				.glowLookUpTextBox({
					emptyHtml: context.placeHolderText,
					maxValues: 1,
					onGetLookUps: function (tb, searchText) {
						window.clearTimeout(context.searchTimeout);
						if (searchText && searchText.length >= 2) {
							tb.glowLookUpTextBox('updateSuggestions', [
								tb.glowLookUpTextBox('createLookUp', '',
									'<span class="ui-loading" width="48" height="48"></span>',
									'<span class="ui-loading" width="48" height="48"></span>',
									false)
							]);
							context.searchTimeout = window.setTimeout(function () {
								search(context, searchText)
									.then(function(response){
										if (response && response.SearchResults.length > 0) {
											var suggestions = [];
											for (var i = 0; i < response.SearchResults.length; i++) {
												var item = response.SearchResults[i];
												suggestions.push(tb.glowLookUpTextBox('createLookUp', JSON.stringify({ ContentId: item.Id, ContentTypeId: item.ContentTypeId }), item.Title, item.Title, true));
											}
											tb.glowLookUpTextBox('updateSuggestions', suggestions);
										}
										else
											tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.searchErrorMessage, context.searchErrorMessage, false)]);
									});
							}, 750);
						}
					},
					selectedLookUpsHtml: (context.contentName ? [ context.contentName ] : [])
				})
				.on('glowLookUpTextBoxChange', function(e){
					var val = context.searchInput.val();
					if(val) {
						val = JSON.parse(val);
					} else {
						val = {
							ApplicationId: context.applicationId,
						};
					}
					context.listQueryContext = val;
					context.commentsList.empty();
					context.scrollableResults.reset();
				});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.commentsPanel = api;

})(jQuery, window);
