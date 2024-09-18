/*

FlattenedReplies

Thread widget private alternative to $.fn.evolutionThreadedReplies for flattened views of a thread

*/
(function ($, global, undef) {

	var FlattenedRepliesVotersPopup = (function () {
		var defaults = {
			votersTemplate: '' +
				' <% if(voters && voters.length > 0) { %>' +
				' 	<% foreach(voters, function(voter) { %>' +
				' 		<li class="content-item">' +
				' 			<div class="full-post-header"></div>' +
				' 			<div class="full-post">' +
				' 				<span class="avatar">' +
				' 					<a href="<%: voter.profileUrl %>"  class="internal-link view-user-profile">' +
				' 						<% if(voter.avatarHtml) { %>' +
				' 							<%= voter.avatarHtml %>' +
				' 						<% } else { %>' +
				' 							<img src="<%: voter.avatarUrl %>" alt="" border="0" width="32" height="32" style="width:32px;height:32px" />' +
				' 						<% } %>' +
				' 					</a>' +
				' 				</span>' +
				' 				<span class="user-name">' +
				' 					<a href="<%: voter.profileUrl %>" class="internal-link view-user-profile"><%= voter.displayName %></a>' +
				' 				</span>' +
				' 			</div>' +
				' 			<div class="full-post-footer"></div>' +
				' 		</li>' +
				' 	<% }); %>' +
				' <% } else { %>' +
				' 	<li>' +
				' 		<span class="content"><%= noVotesText %></span>' +
				' 	</li>' +
				' <% } %>',
			votersPopupTemplate: '' +
				' <div class="who-likes-list"> ' +
				'     <div class="content-list-header"></div> ' +
				'     <ul class="content-list"><%= voters %></ul> ' +
				'     <div class="content-list-footer"></div> ' +
				'     <% if(hasMorePages) { %> ' +
				'         <a href="#" class="show-more"><%= showMoreText %></a>' +
				'     <% } %> ' +
				' </div> ',
			noVotesText: 'No Votes',
			delegatedSelector: '.votes .current',
			modalTitleText: '',
			modalShowMoreText: 'More',
			loadVoters: function (options) {}
		};

		var FlattenedRepliesVotersPopup = function (options) {
			var context = $.extend({}, defaults, options || {});

			var settings = $.extend({}, defaults, options || {}),
				votersTemplate = $.telligent.evolution.template.compile(settings.votersTemplate),
				votersPopupTemplate = $.telligent.evolution.template.compile(settings.votersPopupTemplate),
				getOptions = function (elm) {
					return $.telligent.evolution.ui.data($(elm));
				},
				getVoters = function (options, pageIndex, complete) {
					var req = context.loadVoters({
						replyId: options.replyid,
						pageIndex: pageIndex
					});
					req.then(function (response) {
						// get the resized image html of all the avatars within a batch
						$.telligent.evolution.batch(function () {
							$.each(response.Users, function (i, user) {
								$.telligent.evolution.get({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ui/image.json',
									data: {
										url: user.AvatarUrl,
										maxWidth: 32,
										maxHeight: 32,
										resizeMethod: 'ZoomAndCrop'
									}
								}).then(function (response) {
									user.userAvatarHtml = response.Html;
								});
							});
						}).then(function () {
							complete({
								voters: $.map(response.Users, function (user) {
									var voter = {
										displayName: user.DisplayName,
										profileUrl: user.ProfileUrl,
										avatarHtml: user.userAvatarHtml
									};
									return voter;
								}),
								hasMorePages: (((response.PageIndex + 1) * response.PageSize) < response.TotalCount)
							});
						});
					});
				},
				showPopup = function (data, elm) {
					var currentPageIndex = 0,
						votersContent = $(votersTemplate($.extend(data, {
							noVotesText: settings.noVotesText || defaults.noVotesText
						}))),
						queryOptions = getOptions(elm),
						votersPopup = $(votersPopupTemplate({
							voters: votersContent,
							hasMorePages: data.hasMorePages,
							showMoreText: settings.modalShowMoreText
						})),
						votersList = votersPopup.find('ul'),
						showMoreLink = votersPopup.find('.show-more');

					votersList.html(votersContent);
					showMoreLink.on('click', function (e) {
						e.preventDefault();
						currentPageIndex++;
						getVoters(queryOptions, currentPageIndex, function (data) {
							votersList.append(votersTemplate(data));
							if (data.hasMorePages) {
								showMoreLink.show();
							} else {
								showMoreLink.hide();
							}
							var height = votersList[0].scrollHeight;
							votersList.scrollTop(height);
						});
					});

					$.glowModal({
						title: settings.modalTitleText,
						html: votersPopup,
						width: 450,
						height: '100%'
					});
				},
				delegateEvents = function () {
					$(settings.containerSelector).on('click', settings.delegatedSelector, function (e) {
						e.preventDefault();
						var elm = $(this);
						var queryOptions = getOptions(elm);
						getVoters(queryOptions, 0, function (data) {
							showPopup(data, elm);
						});
						return false;
					});
				};

			return {
				// options
				//   container
				handleVoterPopupRequests: function (options) {
					$(options.container).on('click', settings.delegatedSelector, function (e) {
						e.preventDefault();
						var elm = $(this);
						var queryOptions = getOptions(elm);
						getVoters(queryOptions, 0, function (data) {
							showPopup(data, elm);
						});
						return false;
					});
				}
			};
		};

		return FlattenedRepliesVotersPopup;
	})();

	var messaging = $.telligent.evolution.messaging;

	var defaults = {
		containerSelector: 'ul.content-list.threaded',
		replySelector: 'li.threaded.content-item',
		newReplySelector: 'a.new-reply',
		submitReplySelector: 'a.submit-new-reply',
		cancelReplySelector: 'a.cancel-new-reply',
		renderedContentSelector: '.rendered-content',
		wrapper: null,
		replyFormTemplate: null,
		onEditorAppendTo: null,
		onEditorRemove: null,
		onEditorVal: null,
		onEditorFocus: null,
		onGetReply: null,
		highlightClassName: 'new',
		highlightTimeout: 4 * 1000
	};

	// attempts to find an existing rendered reply to use instead of adding a duplicate (for merging)
	function getExistingRenderedReply(context, container, replyId) {
		var existing = context.container.find('li.content-item[data-id="' + replyId + '"]').first();
		if (existing && existing.length) {
			return existing;
		}
		return null;
	};

	function showReplyForm(context, replyId) {
		hideReplyForms(context);

		var newReplyWrapper = null;
		var reply = getExistingRenderedReply(context, context.container, replyId);
		newReplyWrapper = reply.find('.newreply').first();

		if (!newReplyWrapper || newReplyWrapper.length == 0) {
			return;
		}

		// create reply form if there
		var newReplyForm = newReplyWrapper.find('.reply-form').first();
		if (newReplyForm.length == 0) {
			newReplyForm = $(context.replyFormTemplate({
				editingReplyId: null
			}));
			newReplyWrapper.append(newReplyForm);
		}

		// move editor to it, clear it and focus it
		context.onEditorAppendTo({
			container: newReplyForm.find('.editor').first()
		});
		context.onEditorFocus();
	}

	function renderEdit(context, options) {
		var renderedReply = getExistingRenderedReply(context, context.container, options.replyId);
		if (renderedReply && renderedReply.length > 0) {
			renderedReply.addClass('hide-content').addClass('edit');
			hideReplyForms(context);


			var editReplyWrapper = renderedReply.find('.edit-form').first();
			var replyForm = editReplyWrapper.find('.reply-form').first();
			if (replyForm.length == 0) {
				replyForm = $(context.replyFormTemplate({
					editingReplyId: options.replyId
				}));
				editReplyWrapper.append(replyForm);
			}

			// move editor to it, clear it and focus it
			context.onEditorAppendTo({
				container: replyForm.find('.editor').first()
			});
			context.onEditorVal({
				val: options.reply.rawBody,
				suggested: options.reply.status == 'suggested'
			});
			context.onEditorFocus();
		}
	}

	function hideReplyForms(context) {
		context.onEditorRemove();

		context.container.find('.reply-form').each(function () {
			var form = $(this);
			form.closest('.threaded.content-item').removeClass('hide-content').removeClass('edit');
		}).remove();

		var newReplyLink = context.wrapper.find(context.newReplySelector);
		if (newReplyLink.data('label-reply')) {
			newReplyLink.html(newReplyLink.data('label-reply'));
		}
	}

	function indicateTyping(context, options) {
		// get the existing parent reply to render the indicator alongside
		var existingReply = getExistingRenderedReply(context, context.container, options.parentId);
		if (existingReply !== null) {
			var typingStatusWrapper = existingReply.find('.typing-status-wrapper').first();
			if (options.typing) {
				typingStatusWrapper.empty().append(context.typingIndicatorTemplate({
					displayName: options.authorDisplayName
				}));
			} else {
				typingStatusWrapper.empty();
			}
			// indicate typing of new root reply
		} else {
			var typingStatusWrapper = context.wrapper.find('.typing-status-wrapper').first();
			if (options.typing) {
				typingStatusWrapper.empty().append(context.typingIndicatorTemplate({
					displayName: options.authorDisplayName
				}));
			} else {
				typingStatusWrapper.empty();
			}
		}
	}

	function getReplyItem(context, replyId) {
		return context.wrapper.find('.content-list.threaded .threaded.content-item[data-id="' + replyId + '"]');
	}

	function isOnLastPage(context) {
		var nextPageLink = context.wrapper.find('.pager .next');
		return nextPageLink.length == 0 || nextPageLink.is('.disabled');
	}

	function renderReply(context, reply) {
		return context.replyTemplate(reply);
	}

	function appendReply(context, reply) {
		var listContainer = context.wrapper.find('.threaded-wrapper .content-list.threaded');
		if ($('.threaded.content-item[data-id="' + reply.id + '"]', listContainer).length == 0) {
		    var renderedReply = renderReply(context, reply);
    		listContainer.append(renderedReply)
		}
	}

	function highlight(context, replyId, className) {
		className = className || 'new';
		context.wrapper.find('.content-list.threaded .threaded.content-item.permalinked').removeClass(className);
		var replyItem = getReplyItem(context, replyId);
		replyItem.addClass(className);
		setTimeout(function () {
			replyItem.removeClass(className);
		}, context.highlightTimeout);
	}

	function isFullyVisible (container, item, padding) {
		padding = padding || 0;

		if (container == document || (container instanceof jQuery && (container.get(0) == document || container.is('body')))) {
			var bound = (item instanceof jQuery) ? item.get(0).getBoundingClientRect() : item.getBoundingClientRect();
			return (
				(bound.top - padding) > 0 &&
				(bound.top + padding) <= (global.innerHeight || document.documentElement.clientHeight) &&
				(bound.bottom - padding) > 0 &&
				(bound.bottom + padding) <= (global.innerHeight || document.documentElement.clientHeight)
			);
		} else {
			container = $(container);

			var itemTop = item.offset().top;
			var itemBottom = itemTop + item.height();

			var containerTop = container.offset().top;
			var containerBottom = containerTop + container.height();

			return (
				((itemTop + padding) >= containerTop) &&
				((itemBottom - padding) <= containerBottom)
			);
		}
	}

	function scrollToElementIfNotVisible (container, item, padding, duration) {
		padding = padding || 0;
		duration = duration || 100;

		if (!isFullyVisible(container, item, padding)) {
			container = $(container);
			if (container.get(0) == document) {
				container = $('html, body');
			}
			container.stop().animate({
				scrollTop: item.offset().top - padding
			}, duration);
		}
	}

	function scrollTo(context, replyId) {
		var replyItem = getReplyItem(context, replyId);
		scrollToElementIfNotVisible($(document), replyItem, 200, 150);
	}

	function updateUrl(reply) {
		if (reply && reply.url) {
			history.pushState({}, "", reply.url);
		}
	}

	function navigateToLastPage(context) {
		return $.Deferred(function (d) {
			var navigatedSubscription = messaging.subscribe(context.pagedMessage, function () {
				messaging.unsubscribe(navigatedSubscription);
				d.resolve();
			});
			// navigate to last page via simply invoking ajax paging's own paging
			context.wrapper.find('.pager .ends a').last().trigger('click');
		}).promise();
	}

	function updateVotes(context, options) {
		var renderedReply = getExistingRenderedReply(context, context.container, options.replyId);
		if (renderedReply && renderedReply.length > 0) {
			var votes = renderedReply.find('.votes').first();

			// highlight currently-voted vote action
			if (options.value === true) {
				votes.find('a.vote').removeClass('selected');
				votes.find('.up').first().addClass('selected');
			} else if (options.value === false) {
				votes.find('a.vote').removeClass('selected');
				votes.find('.down').first().addClass('selected');
			} else if (options.value === null) {
				votes.find('a.vote').removeClass('selected');
			}

			// update current vote total for item
			if (options.yesVotes !== undef && options.noVotes !== undef) {
				var netVotes = options.yesVotes - options.noVotes;
				votes.find('.vote.current').html(netVotes > 0 ? '+' + netVotes : netVotes);
			}
		}
	}

	function buildVoterPopup(context) {
		context.voterPopup = new FlattenedRepliesVotersPopup({
			modalTitleText: context.text.peopleWhoVoted,
			modalShowMoreText: context.text.more,
			noVotesText: context.text.noVotes,
			loadVoters: function (options) {
				return context.onListVoters(options);
			}
		});
		context.voterPopup.handleVoterPopupRequests({
			container: context.container
		});
	}

	function handleEvents(context) {

		context.container.on('click', context.newReplySelector, function (e) {
			e.preventDefault();
			var target = $(e.target);

			// toggle reply form
			if (target.closest(context.replySelector).find('>.newreply .reply-form').length == 0) {
				showReplyForm(context, target.closest(context.replySelector).data('id'), true);
				// update the label if provided
				if (target.data('label-cancel')) {
					target.html(target.data('label-cancel'));
				}
			} else {
				hideReplyForms(context);
				// update the label if provided
				if (target.data('label-reply')) {
					target.html(target.data('label-reply'));
				}
			}

			return false;
		});
	}

	function handleMessages(context) {
		messaging.subscribe('ui.replies.edit.cancel', function (data) {
			hideReplyForms(context);
		});

		messaging.subscribe('ui.replies.edit', function (data) {
			var replyId = $(data.target).data('id');

			context.onGetReply({ replyId: replyId }).then(function (reply) {
				renderEdit(context, {
					replyId: replyId,
					reply: reply
				})
			});
		});

		messaging.subscribe('ui.replies.delete', function (data) {
			context.onPromptDelete($(data.target).data('id'))
		});

		messaging.subscribe('ui.replies.vote.message', function (data) {
			var target = $(data.target);
			if (target.hasClass('selected')) {
				context.onVoteReply({
					replyId: target.data('replyid'),
				}).then(function (v) {
					updateVotes(context, {
						value: null,
						replyId: v.replyId,
						yesVotes: v.yesVotes,
						noVotes: v.noVotes
					});
				});
			} else {
				context.onVoteReply({
					replyId: target.data('replyid'),
					value: target.data('value')
				}).then(function (v) {
					updateVotes(context, {
						replyId: v.replyId,
						value: target.data('value'),
						yesVotes: v.yesVotes,
						noVotes: v.noVotes
					});
				});
			}
		});
	}

	function debounce(fn, limit, onInitialBlockedAttempt) {
		var bounceTimout;
		return function () {
			var scope = this,
				args = arguments;
			if (onInitialBlockedAttempt && !bounceTimout) {
				onInitialBlockedAttempt.apply(scope, args);
			}
			clearTimeout(bounceTimout);
			bounceTimout = null;
			bounceTimout = setTimeout(function () {
				fn.apply(scope, args);
				clearTimeout(bounceTimout);
				bounceTimout = null;
			}, limit || 10);
		}
	}

	function requestAnimationFrameThrottle(fn) {
		if (!window.requestAnimationFrame)
			return fn;
		var timeout;
		return function () {
			var self, args = arguments;
			if (timeout)
				window.cancelAnimationFrame(timeout);
			var run = function() {
				fn.apply(self, args);
			}
			timeout = window.requestAnimationFrame(run);
		};
	}

	function FlattenedReplies(options) {
		this.context = $.extend({}, defaults, options || {});
	}

	FlattenedReplies.prototype.render = function (container) {
		var context = this.context;

		context.container = container;

		context.replyFormTemplate = $.telligent.evolution.template(context.replyFormTemplate);
		context.replyTemplate = $.telligent.evolution.template(context.replyTemplate);
		context.typingIndicatorTemplate = $.telligent.evolution.template(context.typingIndicatorTemplate);

		handleEvents(context);
		handleMessages(context);
		buildVoterPopup(context);

		context.container.show();
		if (context.replyId) {
			scrollTo(context, context.replyId);
		}

		// pre-focusing
		setTimeout(function () {
			// attempt to wait long enough to show pre-focused reply form after
			// logging in from anonymous, but can't be directly detected
			try {
				var query = $.telligent.evolution.url.parseQuery(global.location.href);
				if (query && query.focus) {
				    if (!context.replyId) {
            		    $.telligent.evolution.messaging.publish('telligent.evolution.widgets.thread.composereply', {
            		        target: $('.thread-start .navigation-list-item.compose a', context.wrapper)[0]
            		    });
        		    } else {
    					showReplyForm(context, context.replyId);
        		    }
				}
			} catch (e) {}
		}, 300);

		// schedule highlighted items to have their highlights removed once scrolled into view or paged
		context.scheduleHighlightRemovals = debounce(function () {
			context.container.find('li.content-item.' + context.highlightClassName).each(function () {
				var highlightedItem = $(this);
				if (highlightedItem.data('_unhighlighting')) {
					return;
				}
				highlightedItem.data('_unhighlighting', true);

				global.setTimeout(function () {
					highlightedItem.removeClass(context.highlightClassName);
				}, context.highlightTimeout);
			});
		}, 250);

		// highlight removal scheduling on debounced scroll
		$(global).on('scroll', requestAnimationFrameThrottle(function () {
			context.scheduleHighlightRemovals();
		}));
		// and on paging...
		messaging.subscribe(context.pagedMessage, function () {
			context.scheduleHighlightRemovals();
		});
		// and on init
		context.scheduleHighlightRemovals();
	};

	FlattenedReplies.prototype.replyCreated = function (options) {
		var context = this.context;
		context.onGetReply(options).then(function (reply) {
			if (reply.parentId) {
				indicateTyping(context, {
					typing: false,
					parentId: reply.parentId,
					authorDisplayName: ''
				});
			}
			if (options.isAuthor) {
				// render new reply and adjust current URL to permalink of new reply
				if (isOnLastPage(context)) {
					appendReply(context, reply);
					highlight(context, options.replyId, 'permalinked');
					scrollTo(context, options.replyId);
					updateUrl(reply);
				} else {
					// on a permalink, so natively navigate to the new reply's permalink URL
					if (context.replyId) {
						global.location.href = reply.url;
					} else {
						// on an organic page of replies, so just ajax page to end and adjust current URL to permalink
						navigateToLastPage(context).then(function () {
							highlight(context, options.replyId, 'permalinked');
							scrollTo(context, options.replyId);
							updateUrl(reply);
						});
					}
				}
			} else {
				if (isOnLastPage(context)) {
					appendReply(context, reply);
					highlight(context, options.replyId);
				} else {
					// rely on notifications
				}
			}
		});
	};

	FlattenedReplies.prototype.hideReplyForms = function () {
		this.context.onEditorRemove();

		this.context.container.find('.reply-form').each(function () {
			var form = $(this);
			form.closest('.threaded.content-item').removeClass('hide-content').removeClass('edit');
		}).remove();

		var newReplyLink = this.context.wrapper.find(this.context.newReplySelector);
		if (newReplyLink.data('label-reply')) {
			newReplyLink.html(newReplyLink.data('label-reply'));
		}
	};

	FlattenedReplies.prototype.updateReply = function (replyId, options) {
		// then re-load the reply
		var context = this.context;
		context.onGetReply({ replyId: replyId }).then(function (reply) {
			if (reply.isApproved === false)
				return;

			// and re-render it with a highlight
			var existingRenderedReply = getExistingRenderedReply(context, context.container, replyId);
			var newRenderedReply = renderReply(context, reply);
			if (existingRenderedReply)
				existingRenderedReply.replaceWith(newRenderedReply);

			if (options && options.highlight)
				highlight(context, replyId);
		});
	};

	FlattenedReplies.prototype.updateVotes = function (options) {
		var context = this.context;
		updateVotes(context, options);
	}

	FlattenedReplies.prototype.indicateTyping = function (data) {
		var context = this.context;

		// ignore messages from self
		if (data && data.authorId == $.telligent.evolution.user.accessing.id)
			return;

		// raise start typing
		indicateTyping(context, {
			typing: true,
			parentId: data.parentId,
			authorDisplayName: data.authorDisplayName
		});

		// raise stop typing after delay
		context.typingTimeouts = context.typingTimeouts || {};
		global.clearTimeout(context.typingTimeouts[data.parentId]);
		delete context.typingTimeouts[data.parentId];
		context.typingTimeouts[data.parentId] = global.setTimeout(function () {
			indicateTyping(context, {
				typing: false,
				parentId: data.parentId,
				authorDisplayName: data.authorDisplayName
			});
		}, data.delay * 1.5);
	}

	return FlattenedReplies;

})(jQuery, window);