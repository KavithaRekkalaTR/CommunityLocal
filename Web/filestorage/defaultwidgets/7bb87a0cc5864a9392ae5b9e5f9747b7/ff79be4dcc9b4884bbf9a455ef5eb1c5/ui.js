(function($, global) {

	var Uploader = (function(){

		var defaults = {
			uploadContextId: '',
			uploadUrl: '',
			container: null
		};
		var nameSpace = '_uploader';

		var messaging = $.telligent.evolution.messaging;

		function init(context) {
			if(context.inited)
				return;
			context.inited = true;

			context.uploadContainer = $('<div></div>').hide().appendTo(context.container);
			context.uploadButtonShim = $('<span>upload</span>').appendTo(context.uploadContainer)
				.glowUpload({
					uploadUrl: context.uploadUrl,
					contentTypeId: context.statusMessageContentTypeId
				})
		}

		return function(options){
			var context = $.extend({
			}, defaults, options || {});

			init(context);

			return {
				upload: function() {
					init(context);

					return $.Deferred(function(d){
						context.uploadButtonShim.off(nameSpace)
						context.uploadButtonShim.on('glowUploadBegun.' + nameSpace, function(e){
						});
						context.uploadButtonShim.on('glowUploadError.' + nameSpace, function(e){
							d.reject();
						})
						context.uploadButtonShim.on('glowUploadFileProgress.' + nameSpace, function(e, details){
							d.notify({
								name: details.name,
								context: context.uploadContextId,
								percent: (details.percent / 100)
							});
						})
						context.uploadButtonShim.on('glowUploadComplete.' + nameSpace, function(e, file){
							d.resolve({
								name: file.name,
								context: context.uploadContextId
							});
						})

						context.uploadContainer.find('input[type="file"]').get(0).click();
					}).promise();
				}
			}
		};

	})();

	var MAX_PENDING = 30;

	var ActivityService = (function(){
	   var holds = 0,
			lockedDataKey = '_stream_locked_for_commenting',
			listUrl,
			getUrl;
		return {
			init: function(context) {
				listUrl = context.moreStoriesUrl;
				getUrl = context.getStoryUrl;
			},
			list: function(query, success, error) {
				if(holds > 0) {
					return;
				}

				var data = {};
				$.each(query, function(key, value) {
					data['w_' + key] = value;
				})
				return $.telligent.evolution.get({
					url: listUrl,
					data: data,
					cache: false,
					success: success,
					error: error
				});
			},
			get: function(storyId, query, success, fail) {
				var data = {};
				$.each(query, function(key, value) {
					data['w_' + key] = value;
				});
				data['w_messageId'] = storyId;
				$.telligent.evolution.get({
					url: getUrl,
					data: data,
					cache: false,
					success: success,
					error: fail
				});
			},
			del: function(id, success, error) {
				$.telligent.evolution.del({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/stories/{StoryId}.json',
					data: { StoryId: id },
					cache: false,
					success: success,
					error: error
				});
			}
		};
	}());

	function StatusService(options) {
		this.updateStatusUrl = options.updateStatusUrl;
		this.previewStatusAttachmentUrl = options.previewStatusAttachmentUrl;
	}
	/*
		message
			id
			message
			fileName
			contextId
	 */
	StatusService.prototype.update = function(message) {
		return $.telligent.evolution.post({
			url: this.updateStatusUrl,
			data: {
				id: message.id,
				message: $.trim(message.message),
				fileName: message.fileName,
				contextId: message.contextId,
				removeAttachment: message.removeAttachment
			}
		});
	};
	StatusService.prototype.previewAttachment = function(preview) {
		return $.telligent.evolution.post({
			url: this.previewStatusAttachmentUrl,
			data: {
				message: $.trim(preview.message),
				fileName: preview.fileName,
				contextId: preview.contextId
			}
		})
	};

	var ReplyService = (function(){
		var listUrl;
		var getUrl;
		return {
			init: function(context) {
				listUrl = context.moreCommentsUrl;
				getUrl = context.getCommentUrl;
			},
			add: function(activityElement, comment, parentCommentId, isSuggested, success) {
				var data;
				if (activityElement.data('threadid')) {
					data = {
						ThreadId: activityElement.data('threadid'),
						Body: comment,
						SubscribeToThread: true
						};

					if (parentCommentId && parentCommentId != 'null') {
						data.ParentReplyId = parentCommentId;
					}

					if (isSuggested) {
						data.IsSuggestedAnswer = true;
					}

					$.telligent.evolution.post({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/threads/{ThreadId}/replies.json',
						data: data,
						cache: false,
						success: function(r) {
							success($.extend({}, r.Reply, {
								Thread: {
									Id: r.ThreadId,
									ContentId: activityElement.data('contentid'),
									ContentTypeId: activityElement.data('contenttypeid')
								}
							}));
						}
					});
				} else {
					data = {
							ContentId: activityElement.data('contentid'),
							ContentTypeId: activityElement.data('contenttypeid'),
							Body: comment
						};

					if (parentCommentId && parentCommentId.length > 0 && parentCommentId != 'null') {
						data.ParentCommentId = parentCommentId;
					}

					if (activityElement.data('typeid')) {
						data.CommentTypeId = activityElement.data('typeid');
					}

					if (activityElement.data('activityurl')) {
						data.Url = activityElement.data('activityurl');
					}

					$.telligent.evolution.post({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments.json',
						data: data,
						cache: false,
						success: function (r) {
							success(r.Comment);
						}
					});
				}
			},
			del: function(activityElement, comment, success, fail) {
				if (activityElement.data('threadid')) {
					$.telligent.evolution.del({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums/threads/replies/{ReplyId}.json',
						data: {
							ReplyId: comment.data('commentid')
						},
						cache: false,
						success: success,
						error: fail
					});
				} else {
					$.telligent.evolution.del({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/comments/{CommentId}.json',
						data: {
							CommentId: comment.data('commentid')
						},
						cache: false,
						success: success,
						error: fail
					});
				}
			},
			list: function(query, success, fail) {
				var data = {};
				$.each(query, function(key, value) {
					data['w_' + key] = value;
				})
				$.telligent.evolution.get({
					url: listUrl,
					data: data,
					cache: false,
					success: success,
					error: fail
				});
			},
			get: function(commentId, contentTypeId, typeId, success, fail) {
				$.telligent.evolution.get({
					url: getUrl,
					data: {
						w_commentId: commentId,
						w_contentTypeId: contentTypeId,
						w_typeId: typeId
					},
					cache: false,
					success: success,
					error: fail
				});
			}
		};
	}());

	var Controller = (function(){
		var activities,
			replies,
			widgetContext,
			loading = false,
			dayDividers = [],
			pendingStories = [],
			pendingComments = {},
			editors = {},
			activityMessageElementFor = function(element) {
				var e = $(element).closest('li.content-item.activity');
				if (e.length > 0) {
					return e;
				} else if ($(element).data('activityid') != null) {
					return widgetContext.wrapper.find('li.content-item.activity[data-activityid="' + $(element).data('activityid') + '"]');
				}
			},
			clear = function() {
				pendingStories = [];
				pendingComments = [];
				updatePendingStoryIdentifier();
				widgetContext.container.empty();
				widgetContext.wrapper.closest('.layout-region.content').css({'min-height':'900px'});
				widgetContext.wrapper.closest('.layout').find('.layout-region-inner.right-sidebar').css({'min-height':'900px'});
			},
			load = function(showMore, autoRefresh) {
				return $.Deferred(function(d){
					loading = true;
					var handleResponse = function(response) {
						var response = $.trim(response);
						if (response) {
							response = $(response);

							var data = response.children('li.data').remove();
							if(!autoRefresh) {
								if (data.length > 0) {
									widgetContext.lastMessageDate = data.data('lastmessagedate');
									widgetContext.hasMoreData = true;
									widgetContext.pager.find('a').show();
								} else {
									widgetContext.hasMoreData = false;
									widgetContext.pager.find('a').hide();
								}
							}

							var items = response.children('li');

							widgetContext.wrapper.trigger('streamLoaded', {
								activities: items
							});

							renderMessages(items, autoRefresh);
							d.resolve();
						} else {
							widgetContext.hasMoreData = false;
							widgetContext.pager.find('a').hide();
							widgetContext.wrapper.trigger('streamLoadError');
							d.reject();
						}
						loading = false;
					};

					widgetContext.wrapper.trigger('streamLoading');

					activities.list({
						filterIndex: widgetContext.filterIndex,
						filterType: widgetContext.filterType,
						endDate: showMore ? widgetContext.lastMessageDate : '',
						pageSize: widgetContext.pageSize,
						userId: widgetContext.userId,
						group: widgetContext.groupId
					},
					handleResponse,     // success
					function() {        // error
						widgetContext.wrapper.trigger('streamLoadError');
						loading = false;
						d.reject();
					});
				}).promise();
			},
			renderMessages = function(messages, autoRefresh) {
				$.telligent.evolution.ui.defer(widgetContext.container, function(){
					if (messages.length > 0) {
						widgetContext.wrapper.find('.message.norecords').parent().remove();
					}

					// filter newly fetched messages into new messages and existing
					var newMessages = [],
						existingMessages = [];
					$.each(messages, function(i, message){
						var existingMessage = $('#' + $(message).attr('id'));
						(existingMessage.length === 0 ? newMessages : existingMessages).push(message);
					});

					var append = function(message) {
						if (autoRefresh) {
							widgetContext.container.prepend(message.show());
						} else {
							var latestDate = null,
								latestMessage = widgetContext.container.find('li.activity').first();
							if(latestMessage.length > 0) {
								latestDate = $.telligent.evolution.parseDate(latestMessage.data('activitydate'));
							}
							var messageDate = message.data('activitydate') ? $.telligent.evolution.parseDate(message.data('activitydate')) : new Date();
							if(messageDate > latestDate) {
								widgetContext.container.prepend(message.show());
							} else {
								widgetContext.container.append(message.show());
							}
						}
					}

					if (autoRefresh) {
						newMessages.reverse();
					}

					// add new messages to ui, initing against client behaviors as well
					var pendingCount = pendingStories.length;
					$.each(newMessages, function(i, message) {
						message = $(message);

						var storyId = message.data('activityid');
						if (storyId && pendingStories.length > 0) {
							pendingStories = $.grep(pendingStories, function(v) { return v.storyId != storyId; });
						}

						widgetContext.wrapper.trigger('activityAppending', { activity: message, auto: autoRefresh });
						append(message);
						widgetContext.wrapper.trigger('activityAppended', { activity: message, auto: autoRefresh  });
					});
					if (pendingStories.length != pendingCount) {
						$.telligent.evolution.notifications.unread(pendingStories.length, {
							isLocal: true,
							namespace: 'activitystorystream-stories'
						});
						updatePendingStoryIdentifier();
					}

					// re-render embedded tweets
					if (twttr) {
						try {
							twttr.widgets.load();
						} catch(e){}
					}

					// for existing messages, add any new comments to the ui
					$.each(existingMessages, function(i, message){
						var m = $(message);
						var ex = $('#' + m.attr('id'));
						// refresh dates of existing messages
						refreshContentItem(ex, m, 'post-author.activity');
						refreshContentItem(ex, m, 'post-content.activity');
						refreshContentItem(ex, m, 'post-actions.activity');
					});

					renderDayDividers();
				});
			},
			renderDayDividers = function() {
				$.each(dayDividers, function(i, divider) {
					divider.remove();
				});
				dayDividers = [];
				var currentDate = null;
				var activityItems = widgetContext.container.find('li.activity');
				$.each(activityItems, function(i, activity){
					var activity = $(activity),
						date = $.telligent.evolution.parseDate(activity.data('activitydate'));

					if(currentDate === null || !(currentDate.getFullYear() === date.getFullYear() && currentDate.getMonth() === date.getMonth() && currentDate.getDate() === date.getDate())) {
						currentDate = date;
						var divider = $('<li class="activity-date-grouping"><span></span></li>'),
							dividerSpan = divider.find('span');
						activity.before(divider);
						buildDivider(date, function(formattedDivider) {
							dividerSpan.html(formattedDivider.text);
							if (formattedDivider.today) {
								divider.addClass('today');
							}
						});
						dayDividers.push(divider);
					}
				});
			},
			buildDivider = function(date, complete) {
				var now = new Date();
				if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()) {
					complete({ text: widgetContext.todayText, today: true });
				} else {
					// floor the date at the beginning of the day to maximimze cache hits for formatted dates
					var dayBasedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
					$.telligent.evolution.language.formatDate(dayBasedDate, function(formatted) {
						complete({ text: formatted, today: false });
					});
				}
			},
			contains = function(array, fn) {
				var contains = false;
				$.each(array, function(i, val){
					if(fn(val)) {
						contains = true;
						return false;
					}
				});
			},
			refreshContentItem = function(existingElement, refreshedElement, className) {
				var existing = existingElement.first().find('.' + className);
				var refreshed = refreshedElement.first().find('.' + className);
				if(existing.length > 0 && refreshed.length > 0) {
					existing.html(refreshed.html());
				}
			},
			refreshComments = function(activityElement, autoRefresh) {
				// when commenting is successful, get the new rendered comment list only
				// for this activity item
				activities.get(activityElement.data('activityid'), {
						filterIndex: widgetContext.filterIndex,
						filterType: widgetContext.filterType,
						pageSize: 1,
						userId: widgetContext.userId,
						group: widgetContext.groupId
					},
					function(response) {        // success
						var response = $.trim(response);
						if (response) {
							response = $(response);
							refreshContentItem(activityElement,response, 'content-list.comments');
							widgetContext.wrapper.trigger('pendingCommentsAdded', { activityElement: activityElement, auto: true });
						}
					},
					function() {        // error
						widgetContext.wrapper.trigger('streamLoadError');
					});
			},
			renderComments = function(messageItem, newCommentItems, autoRefresh, viewMoreLink) {
				var existingMessage = $('#' + messageItem.attr('id'));
				if(existingMessage) {
					var systemElement = existingMessage.find('li.comment-form, li.new-comments, li.reply-form').first(),
						replyList = existingMessage.find('ul.content-list.comments'),
						existingComments = existingMessage.find('li.content-item.comment').not('.comment-form, .new-comments, .reply-form'),
						keepComments = [],
						appendReply = function(reply) {
							var replyDate = $.telligent.evolution.parseDate(reply.data('commentdate')),
								latestReply = replyList.find('li.comment:not(li.comment-form, li.new-comments, li.reply-form, li.placeholder)').last();
							if(latestReply.length > 0 && replyDate > $.telligent.evolution.parseDate(latestReply.data('commentdate'))) {
								latestReply.after(reply.show());
							} else if(latestReply.length > 0) {
								existingComments.first().before(reply.show());
							} else if(systemElement.length > 0) {
								systemElement.before(reply.show());
							} else {
								replyList.append(reply.show());
							}
						};

					var key = getPendingCommentsKey(existingMessage.data('contentid'), existingMessage.data('contentypeid'), existingMessage.data('typeid'));
					var pc = pendingComments[key] || [];
					var originalPc = pc.length;

					// add new comments, track comments that shouildn't be removed
					$.each(newCommentItems, function(i, newComment){
						newComment = $(newComment);
						newComment.hide();

						var newCommentId = newComment.data('commentid');
						var existingComment = existingComments.filter('[data-commentid="'+newCommentId+'"]').first();

						pc = $.grep(pc, function(c) { return c.commentId != newCommentId; });

						if (existingComment.length === 1) {
							existingComment.replaceWith(newComment.show());
						} else {
							appendReply(newComment);
							widgetContext.wrapper.trigger('commentAdded', { activityElement: existingMessage, comment: newComment, auto: autoRefresh });
						}
					});

					if (originalPc != pc.length) {
						pendingComments[key] = pc;
						$.telligent.evolution.notifications.unread(pc.length, {
							isLocal: true,
							namespace: 'activitystorystream-comments-' + key
						});
						updatePendingCommentIdentifier(existingMessage.data('contentid'), existingMessage.data('contentypeid'), existingMessage.data('typeid'));
					}

					if (!autoRefresh) {
						replyList.find('.action.collapse').remove();

						// add view more link
						if(viewMoreLink) {
							var currentViewMoreLink = replyList.find('.action.collapse');
							if(currentViewMoreLink.length == 0) {
								var firstReply = replyList.find('li.comment:not(li.comment-form, li.new-comments)').first();
								viewMoreLink.insertBefore(firstReply);
							}
						}
					}
				}
			},
			debounce = function(fn, ms) {
				var calledInInterval = true;
				setInterval(function(){
					calledInInterval = false;
				}, ms);
				return function(){
					if(!calledInInterval) {
						calledInInterval = true;
						fn.apply(this, arguments)
					}
				};
			},
			addStory = function(storyId, storyTypeId, containerIds) {
				if (!storyId || !storyTypeId) {
					return;
				}

				var f = widgetContext.filters[widgetContext.filterIndex];
				if (f && f[storyTypeId.replace(/\-/g, '')] !== true) {
					return;
				}
				if (widgetContext.filterType == 'Group' && containerIds != null) {
					if (containerIds.indexOf(widgetContext.containerId) == -1) {
						return;
					} else if (!widgetContext.includeSubGroups && containerIds[0] != widgetContext.containerId) {
						return;
					}
				}

				activities.get(storyId, {
					filterIndex: widgetContext.filterIndex,
					filterType: widgetContext.filterType,
					pageSize: 1,
					userId: widgetContext.userId,
					group: widgetContext.groupId
				},
				function(response) {
					if (response && response.length > 0) {
						var story = $(response);
						if (story.data('authorid') == widgetContext.accessingUserId) {
							renderMessages([story], true);
						} else {
							pendingStories = $.grep(pendingStories, function(s) { return s.storyId != storyId; });
							if (pendingStories.length > MAX_PENDING) {
								pendingStories.push({ storyId: storyId });
							} else {
								pendingStories.push({ storyId: storyId, elm: $(response) });
							}
							$.telligent.evolution.notifications.unread(pendingStories.length, {
								isLocal: true,
								namespace: 'activitystorystream-stories'
							});

							updatePendingStoryIdentifier();
						}
					}
				},
				function() {
					// ignore
				});
			},
			updatePendingStoryIdentifier = function() {
				if (pendingStories.length <= 0) {
					widgetContext.moreStories.hide();
				} else if (pendingStories.length == 1) {
					widgetContext.moreStories.html('<a href="#">' + widgetContext.showMoreStoriesSingleText.replace(/\{0\}/g, pendingStories.length) + '</a>').show();
				} else {
					widgetContext.moreStories.html('<a href="#">' + widgetContext.showMoreStoriesMultipleText.replace(/\{0\}/g, pendingStories.length) + '</a>').show();
				}
			},
			updatePendingCommentIdentifier = function(contentId, contentTypeId, typeId) {
				var key = getPendingCommentsKey(contentId, contentTypeId, typeId);
				var comments = pendingComments[key] || [];
				var indicator;
				var storyElm;

				if (typeId && typeId.length > 0) {
					storyElm = $('.content-item.activity-story[data-contentId="' + contentId + '"][data-typeid="' + typeId + '"]', widgetContext.container);
				} else {
					storyElm = $('.content-item.activity-story[data-contentId="' + contentId + '"][data-typeid=""]', widgetContext.container)
				}

				indicator = $('.new-comments', storyElm);

				if (comments.length <= 0) {
					indicator.hide();
				} else if (comments.length == 1) {
					indicator.html('<a href="#">' + widgetContext.showMoreCommentsSingleText.replace(/\{0\}/g, comments.length) + '</a>').show();
				} else {
					indicator.html('<a href="#">' + widgetContext.showMoreCommentsMultipleText.replace(/\{0\}/g, comments.length) + '</a>').show();
				}

				widgetContext.wrapper.trigger('pendingCommentsAdded', { activityElement: storyElm, auto: true });
			},
			updateStory = function(storyId) {
				if (!storyId) {
					return;
				}

				activities.get(storyId, {
					filterIndex: widgetContext.filterIndex,
					filterType: widgetContext.filterType,
					pageSize: 1,
					userId: widgetContext.userId,
					group: widgetContext.groupId
				},
				function(response) {
					if (response && response.length > 0) {
						renderMessages([$(response)], true);
					}
				},
				function() {
					// ignore
				});
			},
			getPendingCommentsKey = function(contentId, contentTypeId, typeId) {
			  if (typeId && typeId.length > 0) {
				  return contentId + '_' + typeId;
			  }  else {
				  return contentId;
			  }
			},
			addComment = function(commentId, contentId, contentTypeId, typeId) {
				var messageItem;
				if (commentId && contentId && contentTypeId) {
					if (typeId && typeId.length > 0) {
						messageItem = $('.content-item.activity-story[data-contentId="' + contentId + '"][data-typeid="' + typeId + '"]', widgetContext.container)
					} else {
						messageItem = $('.content-item.activity-story[data-contentId="' + contentId + '"][data-typeid=""]', widgetContext.container)
					}
					if (messageItem && messageItem.length > 0) {
						replies.get(commentId, contentTypeId, typeId, function(reply) {
							if (reply && reply.length > 0) {
								var key = getPendingCommentsKey(contentId, contentTypeId, typeId);
								var comments = pendingComments[key] || [];

								comments = $.grep(comments, function(c) { return c.commentId != commentId; });
								comments.push({ commentId: commentId, elm: $(reply) });
								pendingComments[key] = comments;

								$.telligent.evolution.notifications.unread(comments.length, {
									isLocal: true,
									namespace: 'activitystorystream-comments-' + key
								});

								updatePendingCommentIdentifier(contentId, contentTypeId, typeId);
							}
						}, function() {
						   // error... ignore
						});
					}
				}
			},
			addUpdateComment = function(commentId, contentId, contentTypeId, typeId) {
				var messageItem;
				if (commentId && contentId && contentTypeId) {
					if (typeId && typeId.length > 0) {
						messageItem = $('.content-item.activity-story[data-contentId="' + contentId + '"][data-typeid="' + typeId + '"]', widgetContext.container)
					} else {
						messageItem = $('.content-item.activity-story[data-contentId="' + contentId + '"][data-typeid=""]', widgetContext.container)
					}
					if (messageItem && messageItem.length > 0) {
						replies.get(commentId, contentTypeId, typeId, function(reply) {
							if (reply && reply.length > 0) {
								renderComments(messageItem, [reply], true, null);
							}
						}, function() {
						   // error... ignore
						});
					}
				}
			},
			showPendingStories = function() {
			  if (pendingStories) {
					var stories = [];

					if (pendingStories.length > MAX_PENDING) {
						clear();
						load();
					} else {
						for (var i = pendingStories.length - 1; i >= 0; i--) {
							stories[pendingStories.length - 1 - i] = pendingStories[i].elm;
						}

						pendingStories = [];

						renderMessages(stories, true);

						widgetContext.moreStories.hide();

						$.telligent.evolution.notifications.unread(0, {
							isLocal: true,
							namespace: 'activitystorystream-stories'
						});
					}
				}
			},
			loadEditor = function(storyId, wrapper, callback, statusMessageId) {
				$.telligent.evolution.get({
					url: widgetContext.getEditorUrl,
					data: {
						w_storyId: storyId,
						w_statusMessageId: statusMessageId
					},
					success: function(response) {
						wrapper.one('rendered', function() {
							if(statusMessageId) {
								callback(editors['status:' + statusMessageId]);
							} else {
								callback(editors[storyId]);
							}
						}).html(response);
					}
				});
			},
			bindEvents = function(context) {
				$.telligent.evolution.messaging.subscribe('activitystory.created', function(data) {
					if ($('.content-item.activity-story[data-activityid="' + data.storyId + '"]', widgetContext.container).length == 0) {
						addStory(data.storyId, data.storyTypeId, data.containerIds);
					}
				});

				$.telligent.evolution.messaging.subscribe('activitystorystream.submitcomment', function(data) {
					if (data && data.from && widgetContext.wrapper.attr('id') == data.from) {
						var activityElement = $('.activity-story[data-activityid="' + data.storyId + '"]', widgetContext.container);
						var editor = editors[data.storyId];
						var formElement = activityElement.find('.comment-form'),
							body = editor.val(),
							isSuggested = editor.isSuggested ? editor.isSuggested() : false,
							replyData = {
								activityElement: activityElement,
								body: body
							};

						if($.trim(body).length > 0) {
							widgetContext.wrapper.trigger('commentAdding', replyData);
							replies.add(activityElement, body, formElement.attr('data-parentcommentid'), isSuggested,
								function(comment) {    // success
									formElement.removeAttr('data-parentcommentid').slideUp(100, function() {
										if (editor) {
											editor.val('');
											editor.moveTo(activityElement.find('.placeholder'));
											if (editor.lastOpener) {
												editor.lastOpener.html(widgetContext.replyText);
											}
										}
									});
									if(!comment.IsApproved && !comment.Approved) {
										$.telligent.evolution.notifications.show(widgetContext.commentModeratedMessaage, { type: 'success', duration: 10000 });
									} else if (comment.ThreadId) {
										addUpdateComment(comment.Id, comment.Thread.ContentId, comment.Thread.ContentTypeId, null);
									} else {
										addUpdateComment(comment.CommentId, comment.Content.ContentId, comment.Content.ContentTypeId, comment.CommentTypeId);
									}
								});
						}
					}
				});

				$.telligent.evolution.messaging.subscribe('activitystorystream.registereditor', function(data) {
					if (data && data.from && widgetContext.wrapper.attr('id') == data.from) {
						if(data.statusMessageId) {
							editors['status:' + data.statusMessageId] = data;
						} else {
							editors[data.storyId] = data;
						}
					}
				});

				$.telligent.evolution.messaging.subscribe('activitystory.updated', function(data) {
					if (data.storyId && $('.content-item.activity-story[data-activityid="' + data.storyId + '"]', widgetContext.container).length > 0) {
						updateStory(data.storyId);
					} else if ($.grep(pendingStories, function(v) { return v.storyId == data.storyId; }).length > 0) {
						addStory(data.storyId, data.storyTypeId, data.containerIds);
					}
				});

				$.telligent.evolution.messaging.subscribe('activitystory.deleted', function(data) {
					if (data.storyId) {
						$('.content-item.activity-story[data-activityid="' + data.storyId + '"]', widgetContext.container).slideUp(150, function() {
							if (($(this).prev().hasClass('activity-date-grouping') && $(this).next().hasClass('activity-date-grouping')) ||$(this).next().length == 0) {
								$(this).prev().remove();
							}
							$(this).remove();

							if (widgetContext.container.children().length == 0) {
								load(false, true);
							}
						});

						pendingStories = $.grep(pendingStories, function(s) { return s.storyId != data.storyId; });

						$.telligent.evolution.notifications.unread(pendingStories.length, {
							isLocal: true,
							namespace: 'activitystorystream-stories'
						});

						updatePendingStoryIdentifier();
					}
				});

				$.telligent.evolution.messaging.subscribe('comment.created', function(data) {
					if ($('.comment[data-commentid="' + data.commentId + '"]', widgetContext.container).length == 0) {
						addComment(data.commentId, data.contentId, data.contentTypeId, data.commentTypeId);
					}
				});

				$.telligent.evolution.messaging.subscribe('comment.updated', function(data) {
					addUpdateComment(data.commentId, data.contentId, data.contentTypeId, data.commentTypeId);
				});

				$.telligent.evolution.messaging.subscribe('comment.deleted', function(data) {
					var commentElm = $('.comment[data-commentid="' + data.commentId + '"]', widgetContext.container);
					if (commentElm.length > 0) {
						$('.post-content', commentElm).html('<span class="comment-deleted">' + widgetContext.commentDeletedText + '</span>');
					}

					if (data.contentId && data.contentTypeId && data.commentId) {
						var key = getPendingCommentsKey(data.contentId, data.contentTypeId, data.commentTypeId);
						var comments = pendingComments[key];
						if (comments) {
							comments = $.grep(comments, function(c) { return c.commentId != data.commentId; });
							pendingComments[key] = comments;

							$.telligent.evolution.notifications.unread(comments.length, {
								isLocal: true,
								namespace: 'activitystorystream-comments-' + key
							});

							updatePendingCommentIdentifier(data.contentId, data.contentTypeId, data.commentTypeId);
						}
					}
				});

				$.telligent.evolution.messaging.subscribe('forumReply.created', function(data){
					var storyElm = $('.activity-story[data-threadid="' + data.threadId + '"]', widgetContext.container);
					if (storyElm.length > 0) {
						addComment(data.replyId, storyElm.data('contentid'), storyElm.data('contenttypeid'), null);
					}
				});

				$.telligent.evolution.messaging.subscribe('forumReply.updated', function(data){
					var storyElm = $('.activity-story[data-threadid="' + data.threadId + '"]', widgetContext.container);
					if (storyElm.length > 0) {
						addUpdateComment(data.replyId, storyElm.data('contentid'), storyElm.data('contenttypeid'), null);
					}
				});

				$.telligent.evolution.messaging.subscribe('forumReply.deleted', function(data){
					var commentElm = $('.comment[data-commentid="' + data.replyId + '"]', widgetContext.container);
					if (commentElm.length > 0) {
						$('.post-content', commentElm).html('<span class="comment-deleted">' + widgetContext.commentDeletedText + '</span>');
					}

					var storyElm = $('.activity-story[data-threadid="' + data.threadId + '"]', widgetContext.container);
					if (storyElm.length > 0) {
						var key = getPendingCommentsKey(storyElm.data('contentid'), storyElm.data('contenttypeid'), null);
						var comments = pendingComments[key];
						if (comments) {
							comments = $.grep(comments, function(c) { return c.commentId != data.replyId; });
							pendingComments[key] = comments;

							$.telligent.evolution.notifications.unread(comments.length, {
								isLocal: true,
								namespace: 'activitystorystream-comments-' + key
							});

							updatePendingCommentIdentifier(storyElm.data('contentid'), storyElm.data('contenttypeid'), null);
						}
					}
				});

				widgetContext.wrapper.on('click', '.new-comments a', function() {
					var indicator = $(this).parent();
					var parent = indicator.closest('.activity-story');
					var contentId = parent.data('contentid');
					var contentTypeId = parent.data('contenttypeid');
					var typeId = parent.data('typeid');

					var key = getPendingCommentsKey(contentId, contentTypeId, typeId);
					var comments = pendingComments[key] || [];

					delete pendingComments[key];

					for (var i = 0; i < comments.length; i++) {
						comments[i] = comments[i].elm;
					}
					renderComments(parent, comments, true, null);

					indicator.hide();

					$.telligent.evolution.notifications.unread(0, {
						isLocal: true,
						namespace: 'activitystorystream-comments-' + key
					});

				   return false;
				});

				widgetContext.moreStories.hide().on('click', 'a', function() {
					showPendingStories();
					return false;
				});

				// prevent endless scrolling in page customization
				if(widgetContext.endlessScroll) {
					$(document).on('customizepage', function() {
						widgetContext.hasMoreData = false;
					})
				}

				// filter tbas
				if(widgetContext.tabs.find('a').length > 1) {
					widgetContext.tabs.find('li.filter-option').first().addClass('selected');
					widgetContext.tabs
						.show()
						.on('click', 'a', function(e){
							e.preventDefault();
							widgetContext.filterIndex = $(e.target).data('filterindex');
							widgetContext.wrapper.trigger('filterSelected', { filterElement: $(e.target) });
							widgetContext.hasMoreData = true;
							widgetContext.lastMessageDate = '';
							if (context.endlessScroll) {
								widgetContext.container.evolutionScrollable('reset');
							} else {
								clear();
								load();
							}
						});
				}

				// activity story deleting
				$.telligent.evolution.messaging.subscribe('deletestory', function(e) {
					if(confirm(widgetContext.deleteActivityMessage)) {
						var activityElement = $(activityMessageElementFor(e.target));
						widgetContext.wrapper.trigger('activityDeleting', { activityElement: activityElement });
						activities.del(activityElement.data('activityid'),
							function(){
								widgetContext.wrapper.trigger('activityDeleted', { activityElement: activityElement });
							},
							function(){
								widgetContext.wrapper.trigger('activityDeleteError', { activityElement: activityElement });
							});
					}
					return false;
				});

				// status editing
				$.telligent.evolution.messaging.subscribe('status.edit', function(e) {
					var activityElement = $(activityMessageElementFor(e.target));
					var statusMessageId = $(e.target).data('statusid');

					activityElement.find('.post-content.activity').hide();
					activityElement.find('.status.editor').removeClass('hidden')
					loadEditor(activityElement.data('activityid'), activityElement.find('.status.editor'), function(editor) {
						editor.onReady(function() {
							editor.focus();
							var attachmentViewer = activityElement.find('.post-attachment-viewer.edit');
							var addAttachment = activityElement.find('.upload-attachment').hide();
							var changeAttachment = activityElement.find('.change-attachment').hide();
							var removeAttachment = activityElement.find('.remove-attachment').hide();
							if(attachmentViewer.children().length == 0) {
								addAttachment.show();
							} else {
								changeAttachment.show();
								removeAttachment.show();
							}
						});
					}, statusMessageId);
				});

				$.telligent.evolution.messaging.subscribe('status.update', function(data) {
					if (data && data.from && widgetContext.wrapper.attr('id') == data.from) {
						var activityElement = $('.activity-story[data-activityid="' + data.storyId + '"]', widgetContext.container);
						var editor = editors['status:' + data.statusMessageId];

						var updateData = {
							id: data.statusMessageId,
							message: $.trim(editor.val())
						};

						// update or remove attachment
						if (editor.attachment) {
							if(editor.attachment.remove) {
								updateData.removeAttachment = true;
							} else if(editor.attachment.fileName && editor.attachment.contextId) {
								updateData.fileName = editor.attachment.fileName;
								updateData.contextId = editor.attachment.contextId;
							}
						}

						context.statusService.update(updateData).then(function(r){
						    editor.remove();
							activityElement.find('.status.editor').empty().addClass('hidden')
							activityElement.find('.post-content.activity').html(r.storyViwHtml).show();
							delete editor.attachment;
							$.telligent.evolution.notifications.show(context.editSuccessText, { type: 'success' });
						});
					}
				});

				$.telligent.evolution.messaging.subscribe('status.cancel', function(e) {
					var activityElement = $(activityMessageElementFor(e.target));
					var statusMessageId = activityElement.data('activityid');
					var editor = editors['status:' + statusMessageId];

					activityElement.find('.post-content.activity').show();
					editor.remove();
					activityElement.find('.status.editor').empty().addClass('hidden')
					delete editor.attachment;
				});

				$.telligent.evolution.messaging.subscribe('status.upload', function(e) {
					var activityElement = $(activityMessageElementFor(e.target));
					var statusMessageId = activityElement.data('activityid');
					var editor = editors['status:' + statusMessageId];
					var attachmentViewer = activityElement.find('.post-attachment-viewer.edit');

					context.uploader.upload().then(function(file){
						editor.attachment = {
							fileName: file.name,
							contextId: file.context
						};
						context.statusService.previewAttachment({
							message: $.trim(editor.val()),
							fileName: file.name,
							contextId: file.context
						}).then(function(r){
							attachmentViewer.html(r);

							var addAttachment = activityElement.find('.upload-attachment').hide();
							var changeAttachment = activityElement.find('.change-attachment').show();
							var removeAttachment = activityElement.find('.remove-attachment').show();
						});
					});
				});

				$.telligent.evolution.messaging.subscribe('status.remove', function(e) {
					var activityElement = $(activityMessageElementFor(e.target));
					var statusMessageId = activityElement.data('activityid');
					var editor = editors['status:' + statusMessageId];
					var attachmentViewer = activityElement.find('.post-attachment-viewer.edit');

					attachmentViewer.empty();
					var addAttachment = activityElement.find('.upload-attachment').show();
					var changeAttachment = activityElement.find('.change-attachment').hide();
					var removeAttachment = activityElement.find('.remove-attachment').hide();

					editor.attachment = {
						remove: true
					};
				});

				// private conversation starting
				$.telligent.evolution.messaging.subscribe('start-private-message', function(e){
					global.location = $(e.target).data('conversationurl');
				});
				// comment form revealing
				$.telligent.evolution.messaging.subscribe('start-story-comment', function(e){
					var elm = $(e.target);
					var storyId = elm.data('activityid');
					var storyElm = $('.activity-story[data-activityid="' + storyId + '"]', widgetContext.container);
					var editor = editors[storyElm.data('activityid')];

					if (storyElm.length == 0) {
						return;
					}

					var replyForm = storyElm.find('.comment.comment-form[data-parentcommentid="null"]');
					if (replyForm.length > 0) {
						replyForm.removeAttr('data-parentcommentid').slideUp(100, function() {
							if (editor) {
								editor.val('');
								editor.lastOpener = null;
								editor.moveTo(storyElm.find('.placeholder'));
								elm.html(widgetContext.replyText);
							} else {
								elm.html(widgetContext.replyText);
							}
						});
					} else {
						replyForm = storyElm.find('.comment.comment-form:not([data-parentcommentid="null"])');
						if (replyForm.length == 0) {
							return;
						}
						if (editor) {
							editor.moveTo(storyElm.find('.placeholder'));
						}
						replyForm.removeClass('reply-form').attr('data-parentcommentid', 'null');
						storyElm.find('.content-list.comments').append(replyForm.show());
						elm.html(widgetContext.cancelText);
						if (editor) {
							editor.val('');
							editor.moveTo(replyForm.find('.editor'));
							if (editor.lastOpener) {
								editor.lastOpener.html(widgetContext.replyText);
							}
							editor.lastOpener = elm;
							editor.focus();
						} else {
							loadEditor(storyElm.data('activityid'), replyForm.find('.editor'), function(editor) {
								editor.lastOpener = elm;
								editor.focus();
							});
						}
					}
				});

				$.telligent.evolution.messaging.subscribe('replytocomment', function(e){
					var elm = $(e.target);
					var commentId = elm.data('commentid');
					var commentElm = $('.comment[data-commentid="' + commentId + '"]', widgetContext.container);
					var storyElm = commentElm.closest('.content-item.activity-story');
					var editor = editors[storyElm.data('activityid')];

					if (storyElm.length == 0 || (!commentId && !replyId) || commentElm.length == 0) {
						return;
					}

					var replyForm = storyElm.find('.comment.comment-form[data-parentcommentid="' + commentId + '"]');
					if (replyForm.length > 0) {
						replyForm.removeAttr('data-parentcommentid').slideUp(100, function() {
							replyForm.removeClass('reply-form');
							if (editor) {
								editor.val('');
								editor.lastOpener = null;
								editor.moveTo(storyElm.find('.placeholder'));
								elm.html(widgetContext.replyText);
							} else {
								elm.html(widgetContext.replyText);
							}
						});
					} else {
						replyForm = storyElm.find('.comment.comment-form:not([data-parentcommentid="' + commentId + '"])');
						if (replyForm.length == 0) {
							return;
						}
						if (editor) {
							editor.moveTo(storyElm.find('.placeholder'));
						}
						replyForm.attr('data-parentcommentid', commentId).addClass('reply-form');
						commentElm.after(replyForm.show());
						elm.html(widgetContext.cancelText);
						if (editor) {
							editor.val('');
							editor.moveTo(replyForm.find('.editor'));
							if (editor.lastOpener) {
								editor.lastOpener.html(widgetContext.replyText);
							}
							editor.lastOpener = elm;
							editor.focus();
						} else {
							loadEditor(storyElm.data('activityid'), replyForm.find('.editor'), function(editor) {
								editor.lastOpener = elm;
								editor.focus();
							});
						}
					}
				});

				// comment deleting
				$.telligent.evolution.messaging.subscribe('deletecomment', function(e) {
					var commentElement = $('li.comment[data-commentid="'+$(e.target).data('commentid')+'"]');
					if(confirm(widgetContext.deleteCommentMessage)) {
						var activityElement = $(activityMessageElementFor(commentElement)),
							data = {
								activityElement: activityElement,
								comment: commentElement
							};
						widgetContext.wrapper.trigger('activityDeleting', data);
						replies.del(activityElement, commentElement,
							function(){
							    if (commentElement.data('replycount') == 0 && commentElement.parent().children('.comment[data-parentcommentid="' + commentElement.data('commentid') + '"]').length == 0) {
    							    commentElement.slideUp(150, function() {
    									var refresh = false;
    									if (commentElement.parent().children('.comment:not(.without-likes, .comment-form, .new-comments)').length == 1) {
    										refresh = true;
    									}
    									commentElement.remove();
    									if (refresh) {
    										refreshComments(activityElement, true);
    									}
    								});
							    } else {
							        $('.post-content', commentElement).html('<span class="comment-deleted">' + widgetContext.commentDeletedText + '</span>');
							    }
							},
							function(){
								widgetContext.wrapper.trigger('activityDeleteError', data);
							});
					}
					return false;
				});

				$.telligent.evolution.messaging.subscribe('deleteforumreply', function(e) {
					var deleteForumReplyPanelUrl = widgetContext.deleteForumReplyPanelUrl.replace('replyid=0', 'replyid=' + $(e.target).data('commentid'));
					global.location.href = deleteForumReplyPanelUrl;
				})

				// collapsed comment expanding
				widgetContext.wrapper.on('click', '.comments .content-item.action.collapse a', function(e) {
					e.preventDefault();
					var link = $(e.target);
					link.html(link.data('loadingtext'));
					replies.list({
						commentTimestamp: link.data('timestamp'),
						storyId: link.data('storyid')
					}, function(response){
						widgetContext.wrapper.trigger('commentsMoreLoaded', {
							comments: $(response),
							activityElement: $(activityMessageElementFor(e.target))
						});
					}, function(){
						widgetContext.wrapper.trigger('commentsMoreError');
					});
				});
				$.telligent.evolution.messaging.subscribe('ui.like', function(data){
					var likedActivityElement = widgetContext.wrapper.find('li.activity-story[data-contentid="' + data.contentId + '"][data-typeid="' + data.typeId + '"]'),
						likedCommentElement = null;
					if(likedActivityElement == null || likedActivityElement.length === 0) {
						likedCommentElement = widgetContext.wrapper.find('li.comment[data-commentid="' + data.contentId + '"][data-contenttypeid="' + data.contentTypeId + '"]')
						if(data.count > 0) {
							widgetContext.wrapper.trigger('likeAdded', { commentElement: likedCommentElement });
						} else {
							widgetContext.wrapper.trigger('likesRemoved', { commentElement: likedCommentElement });
						}
					} else {
						if(data.count > 0) {
							widgetContext.wrapper.trigger('likeAdded', { activityElement: likedActivityElement });
						} else {
							widgetContext.wrapper.trigger('likesRemoved', { activityElement: likedActivityElement });
						}
					}
				});
			};
		return {
			init: function(context, activityService, replyService) {
				widgetContext = context;
				activities = activityService;
				replies = replyService;

				context.uploader = new Uploader({
					uploadContextId: context.statusAttachmentUploadContextId,
					uploadUrl: context.statusAttachmentUploadFileUrl,
					container: widgetContext.wrapper
				});

				context.pager.find('a').on('click', function(e){
					e.preventDefault();
					load(true)
				});

				bindEvents(context);

				if(widgetContext.endlessScroll) {
					widgetContext.container.evolutionScrollable({
						batch: 5,
						load: function(pageIndex) {
							if (!widgetContext.hasMoreData)
								return $.Deferred(function(d){ d.reject(); }).promise()

							// as the stream performs its own parsing and rendering of
							// new items, only resolve the scrolled page load with 'true'
							// instead of actual content
							return load(true, false).then(function(){
								return true;
							});
						}
					})
				} else {
					load();
				}
			},
			on: function(context, eventHandlers) {
				context.wrapper.on(eventHandlers);
			},
			renderDayDividers: renderDayDividers
		};
	}());

	var View = (function(){
		var captureUiElements = function(context) {
				// select elements
				$.each(['tabs','wrapper','loader','pager','container', 'moreStories'], function(i, val) {
					context[val] = $(context[val]);
				});
			},
			checkIfCommentContentExists = function(context, data) {
				if (data.activityElement) {
					var commentList = data.activityElement.find('.content-list.comments');
					var nonActionChildren = commentList.find("> li:visible:not(.without-likes, .comment-form)");
					if(nonActionChildren.length > 0)
						commentList.addClass('with-content');
					else
						commentList.removeClass('with-content');
				}
			},
			handleEvents = function(context, controller) {
				controller.on(context, {
					activityDeleting: function(e, data) { },
					activityDeleted: function(e, data) {
						data.activityElement.fadeOut(250, function(){
							data.activityElement.remove();
							Controller.renderDayDividers();
						});
					},
					activityDeleteError: function(e, data) { },
					streamLoading: function(e, data) {
						// only show loader if not using endless scrolling
						// as endless scrolling implements its own indication
						if (!context.endlessScroll)
							context.loader.show();
					},
					streamLoaded: function(e, data) {
						context.loader.hide();
					},
					streamLoadError: function(e, data) {
						context.loader.hide();
					},
					activityAppending: function(e, data) {
						data.activity.hide();
					},
					activityAppended: function(e, data) {
						if(data.auto) {
							data.activity.addClass('highlight').fadeIn(300);
							global.setTimeout(function() {
									data.activity.removeClass('highlight');
								}, 5000);
						} else {
							data.activity.show();
						}
					},
					commentEdit: function(e, data) {
					},
					commentCancel: function(e, data) {
					},
					commentAdding: function(e, data) {
					},
					commentAdded: function(e, data) {
						if(data.auto) {
							data.comment.addClass('highlight').fadeIn(300);
							global.setTimeout(function() {
								data.comment.removeClass('highlight');
							}, 5000);
						} else {
							data.comment.show();
						}
						checkIfCommentContentExists(context, data);
					},
					pendingCommentsAdded: function(e, data) {
					  checkIfCommentContentExists(context, data);
					},
					commentDeleting: function(e, data) { },
					commentDeleted: function(e, data) {
						data.comment.remove();
					},
					commentDeleteError: function(e, data) {
					},
					commentsMoreLoaded: function(e, data) {
						$.telligent.evolution.ui.defer(data.comments, function(){
							var viewMoreItem = data.activityElement.find('li.content-item.action.collapse');
							// remove comments that are already rendered (since first page was smaller than subsequent)
							data.comments.each(function(){
								if((data.activityElement.find('li[data-commentid="'+$(this).data('commentid')+'"]')).length > 0) {
									data.comments = data.comments.not(this);
								}
							});
							viewMoreItem.replaceWith(data.comments.css({ opacity: 0 }));
							data.comments.evolutionTransform({ opacity: 1 }, { duration: 200 });
							setTimeout(function(){
								data.comments.css({ opacity: 1 })
							}, 210)
						});
						data.activityElement.find('li.content-item.action.collapse').show();
					},
					commentsMoreError: function(e, data) {
					},
					filterSelected: function(e, data) {
						data.filterElement.closest('.filter').find('.filter-option').removeClass('selected');
						data.filterElement.closest('.filter-option').addClass('selected');
					},
					likesRemoved: function(e, data) {
						if(data.activityElement)
							data.activityElement.find('li.likes').removeClass('with-likes').addClass('without-likes');
						if(data.commentElement)
							data.commentElement.removeClass('with-likes');
						checkIfCommentContentExists(context, data);
					},
					likeAdded: function(e, data) {
						if(data.activityElement)
							data.activityElement.find('li.likes').removeClass('without-likes').addClass('with-likes');
						if(data.commentElement)
							data.commentElement.addClass('with-likes');
						checkIfCommentContentExists(context, data);
					}
				});
			};
		return {
			init: function(context, controller) {
				captureUiElements(context);
				handleEvents(context, controller);

				// only show loader if not using endless scrolling
				// as endless scrolling implements its own indication
				if (context.endlessScroll)
					context.loader.hide();
			}
		};
	}());

	var api = {
		register: function(options) {
			var context = $.extend({ filterIndex: 0, hasMoreData: true }, options);
			ActivityService.init(context);
			ReplyService.init(context);
			View.init(context, Controller);
			context.statusService = new StatusService({
				updateStatusUrl: context.updateStatusUrl,
				previewStatusAttachmentUrl: context.previewStatusAttachmentUrl
			});
			Controller.init(context, ActivityService, ReplyService);
		}
	};

	if (!$.telligent) { $.telligent = {}; }
	if (!$.telligent.evolution) { $.telligent.evolution = {}; }
	if (!$.telligent.evolution.widgets) { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.activityStoryStream = api;

})(jQuery, window);