var Conversation = function(context) {
	var PAGE_UNTIL_SCROLL_ATTEMPTS = 5;
	var MAX_MESSAGES = context.pageSize * PAGE_UNTIL_SCROLL_ATTEMPTS;

	var messageTemplate = null;
	var messageHeaderTemplate = null;
	var statusHeaderTemplate = null;
	var hasMoreNext = true;
	var hasMorePrevious = true;
	var nextDate = null;
	var previousDate = null;
	var selectedConversationId = null;
	var selectedConversationRead = true;
	var pageUntilScrollAttempts = 0;
	var initialized = false;
	var typingUsers = {};
	var currentFixedHeaderIndex = -1;
	var hasNewMessages = false;
	var statusMessage = null;
	var loadingNext = false;
	var loadingPrevious = false;
	var ensureScrolledDownHandle = null;
	var lastScrollHeight = 0;
	var lastScrollTop = 0;
	var currentTargetElm = null;

	var currentMessagesIndex = {};
	var currentMessages = [];
	var currentHeadersIndex = {};
	var currentHeaders = [];

	function ensureScrolling(force, maintainCurrentPosition, targetElm) {
		var targetScrollTop;
		global.clearTimeout(ensureScrolledDownHandle);

		if (force === true && maintainCurrentPosition !== true) {
			lastScrollHeight = context.fields.messageList.outerHeight(true);
			lastScrollTop = context.layoutRegions.conversation.scrollTop();
			currentTargetElm = targetElm;
		}

		var currentScrollHeight = context.fields.messageList.outerHeight(true);
		var heightDiff = lastScrollHeight - currentScrollHeight;
		var currentScrollTop = context.layoutRegions.conversation.scrollTop();
		var scrollDiff = lastScrollTop - currentScrollTop;

		if (currentTargetElm && (Math.abs(scrollDiff) === 0 || Math.abs(scrollDiff) <= Math.abs(heightDiff))) {
			var top = currentTargetElm.position().top + currentScrollTop;
			var height = currentTargetElm.outerHeight(true);
			var wrapperHeight = context.layoutRegions.conversation.outerHeight(true);
			top = Math.round(Math.max((top - ((wrapperHeight - height) / 2)), 0));
			if (top > currentScrollHeight - wrapperHeight) {
				top = currentScrollHeight - wrapperHeight;
			}
			lastScrollTop = top;
			lastScrollHeight = currentScrollHeight;
			context.layoutRegions.conversation.scrollTop(top);

			ensureScrolledDownHandle = global.setTimeout(function() {
				ensureScrolling(false, false);
			}, 250);
		} else if (maintainCurrentPosition === true) {
			if (force === true && Math.abs(heightDiff) > 0) {
				targetScrollTop = Math.max(currentScrollTop - heightDiff, 0);
				context.layoutRegions.conversation.scrollTop(targetScrollTop);
				lastScrollHeight = currentScrollHeight;
				lastScrollTop = targetScrollTop;

				ensureScrolledDownHandle = global.setTimeout(function() {
					ensureScrolling(false, true);
				}, 250);
			}
		} else if (force || Math.abs(scrollDiff) === 0 || Math.abs(scrollDiff) <= Math.abs(heightDiff)) {
			if (Math.abs(heightDiff) > 0) {
				targetScrollTop = Math.max(currentScrollHeight - context.layoutRegions.conversation.outerHeight(true), 0);
				context.layoutRegions.conversation.scrollTop(targetScrollTop);
				lastScrollHeight = currentScrollHeight;
				lastScrollTop = targetScrollTop;
			}

			ensureScrolledDownHandle = global.setTimeout(function() {
				ensureScrolling(false, false);
			}, 250);
		} else {
			currentTargetElm = null;
		}
	}

	function updateStatusHeader() {
		var names = [];
		$.each(typingUsers, function(n, v) {
			names.push(n);
		});

		if (names.length > 0 || hasNewMessages || statusMessage) {
			statusHeaderTemplate = statusHeaderTemplate || $.telligent.evolution.template(context.templateIds.conversationStatusHeader);
			context.fields.statusHeaderPlaceholder.html($(statusHeaderTemplate({
				HasNewMessages: hasNewMessages,
				TypingNames: names,
				Status: statusMessage
			}))).show();
		} else {
			context.fields.statusHeaderPlaceholder.hide();
		}

		scroll();
	}

	function pruneMessages(fromTop) {
		if (currentMessages.length <= MAX_MESSAGES)  {
			return;
		}

		var offset = 0, elm, header, message, i, headerDate;
		if (fromTop) {
			while (currentMessages.length > MAX_MESSAGES) {
				message = currentMessages[0];
				elm = message.elm;
				offset += elm.outerHeight(true);
				elm.remove();
				header = currentHeadersIndex[message.headerDate];
				if (header) {
					header.count--;
				}
				currentMessages.shift();
				delete currentMessagesIndex[message.id];
			}

			while (currentHeaders.length > 0 && currentHeadersIndex[currentHeaders[0]].count === 0) {
				headerDate = currentHeaders.shift();
				header = currentHeadersIndex[headerDate];
				offset += header.elm.outerHeight(true);
				header.elm.remove();
				delete currentHeadersIndex[headerDate];
			}

			previousDate = currentMessages[0].createdDate;
			hasMorePrevious = true;

			context.layoutRegions.conversation.scrollTop(context.layoutRegions.conversation.scrollTop() - offset);
		} else {
			while (currentMessages.length > MAX_MESSAGES) {
				message = currentMessages[currentMessages.length - 1];
				elm = message.elm;
				elm.remove();
				header = currentHeadersIndex[message.headerDate];
				if (header) {
					header.count--;
				}
				currentMessages.pop();
				delete currentMessagesIndex[message.id];
			}

			while (currentHeaders.length > 0 && currentHeadersIndex[currentHeaders[currentHeaders.length - 1]].count === 0) {
				headerDate = currentHeaders.pop();
				header = currentHeadersIndex[headerDate];
				header.elm.remove();
				delete currentHeadersIndex[headerDate];
			}

			nextDate = currentMessages[currentMessages.length - 1].createdDate;
			hasMoreNext = true;
		}
	}

	function addMessage(m, addToTop, isNew, scrollToView) {
		messageTemplate = messageTemplate || $.telligent.evolution.template(context.templateIds.conversationMessage);

		if (currentMessagesIndex[m.Id]) {
			return;
		}

		var elm = $(messageTemplate($.extend({}, m, {
			CanDelete: context.userId == m.Author.Id
		})));
		if (scrollToView) {
			ensureScrolling(false, false);
		}
		var isScrolledDown = (context.fields.messageList.outerHeight(true) - (context.layoutRegions.conversation.scrollTop() + context.layoutRegions.conversation.outerHeight(true))) < 50;

		function newIsVisible() {
			var pos = elm.position();
			var hasFocus = global.document.hasFocus();
			if (hasFocus && 0 < (pos.top + elm.outerHeight(true)) && context.layoutRegions.conversation.outerHeight(true) > pos.top) {
				global.setTimeout(function() {
					elm.removeClass('unread');
				}, 5000);
				var unread = $('.unread', context.fields.messageList);
				if (unread.length > 0 && $(unread[unread.length - 1]).data('messageid') == elm.data('messageid')) {
					markConversationRead();
					hasNewMessages = false;
					updateStatusHeader();
				}
			} else {
				if (0 > (pos.top + elm.outerHeight(true)) || context.layoutRegions.conversation.outerHeight(true) < pos.top) {
					hasNewMessages = true;
					updateStatusHeader();
				} else {
					var unread = $('.unread', context.fields.messageList);
					if (unread.length > 0 && $(unread[unread.length - 1]).data('messageid') == elm.data('messageid')) {
						hasNewMessages = false;
						updateStatusHeader();
					}
				}
				global.setTimeout(function() {
					newIsVisible();
				}, 500);
			}
		}

		var headerElm;
		var header = currentHeadersIndex[m.HeaderDate];
		if (addToTop) {
			if (header) {
				header.elm.after(elm);
				header.count++;
			} else {
				context.fields.messageList.prepend(elm);
				messageHeaderTemplate = messageHeaderTemplate || $.telligent.evolution.template(context.templateIds.conversationMessageHeader);
				headerElm = $(messageHeaderTemplate($.extend({}, m, {
					Title: m.HeaderTitle,
					Date: m.HeaderDate
				})));
				currentHeadersIndex[m.HeaderDate] = {
					count: 1,
					elm: headerElm
				};
				currentHeaders.unshift(m.HeaderDate);
				context.fields.messageList.prepend(headerElm);
			}
			currentMessages.unshift({
				id: m.Id,
				headerDate: m.HeaderDate,
				createdDate: m.CreatedDate,
				elm: elm
			});
		} else {
			if (header) {
				header.count++;
			} else {
				messageHeaderTemplate = messageHeaderTemplate || $.telligent.evolution.template(context.templateIds.conversationMessageHeader);
				headerElm = $(messageHeaderTemplate($.extend({}, m, {
					Title: m.HeaderTitle,
					Date: m.HeaderDate
				})));
				currentHeadersIndex[m.HeaderDate] = {
					count: 1,
					elm: headerElm
				};
				currentHeaders.push(m.HeaderDate);
				context.fields.messageList.append(headerElm);
			}
			context.fields.messageList.append(elm);
			currentMessages.push({
				id: m.Id,
				headerDate: m.HeaderDate,
				createdDate: m.CreatedDate,
				elm: elm
			});
		}

		currentMessagesIndex[m.Id] = elm;
		$.telligent.evolution.presence.register({
			node: elm,
			contents: [{
				ContentId: m.Id,
				ContentTypeId: context.conversationMessageContentTypeId,
				TypeId: null
			}]
		});

		if (isNew === true) {
			elm.addClass('unread');
			global.setTimeout(function() {
				newIsVisible();
			}, 500);
		}

		if (scrollToView && isScrolledDown) {
			ensureScrolling(true, false, elm);
		} else if (addToTop) {
			ensureScrolling(true, true, null);
		}
	}

	function deleteMessage(messageId) {
		var elm = $('.conversation-message[data-messageid="' + messageId + '"]', context.fields.messageList);
		if (elm.length > 0) {
			$('.actions', elm).remove();
			$('.content .content', elm).addClass('deleted').html(context.text.deletedMessage);
		}
	}

	function throttle(handler) {
		if (!window.requestAnimationFrame)
			return handler;
		var timeout;
		return function () {
			if (timeout)
				window.cancelAnimationFrame(timeout);
			timeout = window.requestAnimationFrame(handler);
		};
	}

	function scroll() {
		var i, pos, done, elm = null, lastHeaderIndex = currentFixedHeaderIndex, header, scrollTop = context.layoutRegions.conversation.scrollTop();
		var offset = context.layoutRegions.conversation.offset();
		var width = context.layoutRegions.conversation.width();
		var pageX = offset.left + ((context.layoutRegions.conversation.outerWidth() - width) / 2);
		var pageY = offset.top - $(global).scrollTop();

		context.fields.dateHeaderPlaceholder.css({
			top: pageY + 'px',
			position: 'fixed',
			width: width + 'px',
			left: pageX + 'px'
		});

		context.fields.messageList.css({
			'padding-bottom': context.fields.statusHeaderPlaceholder.outerHeight(true) + 'px'
		});

		context.fields.statusHeaderPlaceholder.css({
		   top: (pageY + context.layoutRegions.conversation.outerHeight() - context.fields.statusHeaderPlaceholder.outerHeight(true)) + 'px',
		   position: 'fixed',
			width: width + 'px',
			left: pageX + 'px'
		});

		context.fields.conversationPreviousLoading.css({
			top: (pageY + context.fields.dateHeaderPlaceholder.outerHeight(true)) + 'px',
			position: 'fixed',
			width: width + 'px',
			left: pageX + 'px'
		});

		if (currentFixedHeaderIndex <= 0 || !currentHeaders[currentFixedHeaderIndex] || !currentHeadersIndex[currentHeaders[currentFixedHeaderIndex]] || currentHeadersIndex[currentHeaders[currentFixedHeaderIndex]].elm.closest(document.documentElement).length === 0) {
			// current header is not defined or no longer on the page, look for the first visible header
			currentFixedHeaderIndex = -1;
			done = false;
			for (i = 0; i < currentHeaders.length && !done; i++) {
				header = currentHeadersIndex[currentHeaders[i]];
				elm = header.elm;
				pos = elm.position();
				if (0 > pos.top || i == 0) {
					currentFixedHeaderIndex = i;
				} else {
					done = true;
				}
			}
		} else {
			// is the current header still the current header?
			var headerChanged = false;
			pos = currentHeadersIndex[currentHeaders[currentFixedHeaderIndex]].elm.position();
			if (0 > pos.top) {
				// look for next
				done = false;
				for (i = currentFixedHeaderIndex; i < currentHeaders.length && !done; i++) {
					header = currentHeadersIndex[currentHeaders[i]];
					pos = header.elm.position();
					if (0 > pos.top) {
						currentFixedHeaderIndex = i;
						headerChanged = true;
					} else {
						done = true;
					}
				}
			} else {
				// look for previous
				done = false;
				for (i = currentFixedHeaderIndex; i >= 0 && !done; i--) {
					header = currentHeadersIndex[currentHeaders[i]];
					pos = header.elm.position();
					if (0 > pos.top) {
						currentFixedHeaderIndex = i;
						headerChanged = true;
						done = true;
					}
				}
			}

			if (!headerChanged) {
				return;
			}
		}

		if (lastHeaderIndex >= 0 && currentHeaders[lastHeaderIndex] && currentHeadersIndex[currentHeaders[lastHeaderIndex]]) {
			currentHeadersIndex[currentHeaders[lastHeaderIndex]].elm.css({
				visibility: 'visible'
			});
		}

		if (currentFixedHeaderIndex < 0) {
			context.fields.dateHeaderPlaceholder.empty().hide();
		} else {
			currentHeadersIndex[currentHeaders[currentFixedHeaderIndex]].elm.css({
				visibility: 'hidden'
			})
			context.fields.dateHeaderPlaceholder.html(currentHeadersIndex[currentHeaders[currentFixedHeaderIndex]].elm.children().clone()).show();
		}
	}

	function pageUntilScrolls(direction) {
		if (selectedConversationId && pageUntilScrollAttempts > 0 && context.fields.messageList.height() < context.layoutRegions.conversation.height()) {
			var conversationId = selectedConversationId;

			if (hasMorePrevious && (direction == undefined || direction == 'previous')) {
				pageUntilScrollAttempts--;
				context.fields.conversationPreviousLoading.show();
				context.model.listPreviousMessages(selectedConversationId, previousDate)
					.then(function(messages) {
						if (conversationId != selectedConversationId) {
							return;
						}

						var oldPreviousDate = previousDate;
						var isFirst = true;
						$.each(messages.Messages, function(i, m) {
							var scrollToView = isFirst && previousDate === '';
							isFirst = false;
							addMessage(m, true, false, scrollToView);
							previousDate = m.CreatedDate;
						});
						if (!oldPreviousDate) {
							markConversationRead();
						}
						if (messages.TotalCount <= context.pageSize) {
						   hasMorePrevious = false;
						}
						if (hasMorePrevious) {
							pageUntilScrolls('previous');
						}
					})
					.catch(function() {
						hasMorePrevious = false;
					})
					.always(function() {
						scroll();
						context.fields.conversationPreviousLoading.hide();
					});
			}

			if (hasMoreNext && (direction == undefined || direction == 'next')) {
				pageUntilScrollAttempts--;
				context.fields.conversationNextLoading.show();
				context.model.listNextMessages(selectedConversationId, nextDate)
					.then(function(messages) {
						if (conversationId != selectedConversationId) {
							return;
						}

						var oldNextDate = nextDate;
						$.each(messages.Messages, function(i, m) {
						   addMessage(m, false);
						   nextDate = m.CreatedDate;
						});
						if (!oldNextDate) {
							markConversationRead();
						}
						if (messages.TotalCount <= context.pageSize) {
						   hasMoreNext = false;
						}
						if (hasMoreNext) {
							pageUntilScrolls('next');
						}
					})
					.catch(function() {
						hasMoreNext = false;
					})
					.always(function() {
						scroll();
						context.fields.conversationNextLoading.hide();
					});
			}
		} else {
			initialized = true;
		}
	}

	function markConversationRead() {
		if (!selectedConversationRead) {
			context.model.markConversationRead(selectedConversationId)
				.then(function() {
					selectedConversationRead = true;
					$.telligent.evolution.messaging.publish('conversations-conversationread', {
					   conversationId: selectedConversationId
					});
				});
		}
	}

	function reset(message) {
		initialized = false;
		hasMoreNext = false;
		nextDate = null;
		hasMorePrevious = false;
		previousDate = null;
		currentMessagesIndex = {};
		currentMessages = [];
		currentHeadersIndex = {};
		currentHeaders = [];
		loadingNext = false;
		loadingPrevious = false;
		currentFixedHeaderIndex = -1;
		lastScrollHeight = 0;
		lastScrollTop = 0;
		currentTargetElm = null;
		context.fields.messageList.empty();
		context.fields.statusHeaderPlaceholder.hide()
		context.layoutRegions.conversation.scrollTop(0);
		scroll();

		if (!selectedConversationId)
			return;

		if (message) {
			hasMorePrevious = true;
			previousDate = message.CreatedDate;
			hasMoreNext = true;
			nextDate = message.CreatedDate;
			addMessage(message, false, true, true);
			pageUntilScrollAttempts = PAGE_UNTIL_SCROLL_ATTEMPTS;
		} else {
			hasMorePrevious = true;
			previousDate = '';
			pageUntilScrollAttempts = PAGE_UNTIL_SCROLL_ATTEMPTS;
		}

		pageUntilScrolls();
	}

	$.telligent.evolution.messaging.subscribe('conversations-updateconversation', function(c) {
		if (c && c.conversation && c.conversation.Id == selectedConversationId) {
			selectedConversationRead = c.conversation.HasRead;
		}
	});

	$.telligent.evolution.messaging.subscribe('conversations-showconversation', function(c) {
		typingUsers = {};
	   if (c.conversation && c.conversation.Id) {
		   if (selectedConversationId != c.conversation.Id || c.message) {
			   context.fields.conversationNew.hide();
			   context.fields.messageList.show();
			   context.fields.conversationNone.hide();
			   selectedConversationId = c.conversation.Id;
			   selectedConversationRead = c.conversation.HasRead;
			   reset(c.message);
		   }
	   } else if (c.temporary) {
		   context.fields.conversationNone.hide();
		   context.fields.messageList.hide();
		   context.fields.conversationNew.show();
		   selectedConversationId = null;
		   selectedConversationRead = true;
		   reset();
	   } else {
		   context.fields.conversationNone.show();
		   context.fields.messageList.hide();
		   selectedConversationId = null;
		   selectedConversationRead = true;
		   reset();
	   }
	});

	$.telligent.evolution.messaging.subscribe('conversations-reload', function() {
	   if (selectedConversationId) {
		   context.fields.conversationNew.hide();
		   context.fields.messageList.show();
		   context.fields.conversationNone.hide();
		   reset();
	   }
	});

	$.telligent.evolution.messaging.subscribe('conversations-newconversation', function () {
		context.fields.conversationNone.hide();
		context.fields.messageList.hide();
		context.fields.conversationNew.show();
		selectedConversationId = 'new';
		selectedConversationRead = true;
	});

	$.telligent.evolution.messaging.subscribe('conversations-showmessage', function(m) {
		if (m.message && m.message.ConversationId == selectedConversationId) {
			typingUsers = {};
			updateStatusHeader();
			if (hasMoreNext) {
				if (m.message.Author.Id != context.userId) {
					hasNewMessages = true;
					updateStatusHeader();
				}
			} else {
				addMessage(m.message, false, m.message.Author.Id != context.userId, true);
				if (m.message.Author.Id == context.userId) {
					markConversationRead();
				}
			}
		}
	});

	$.telligent.evolution.messaging.subscribe('conversations-deletemessage', function(m) {
		if (m.messageId && m.conversationId == selectedConversationId) {
			deleteMessage(m.messageId);
		}
	});

	$.telligent.evolution.messaging.subscribe('conversations.deletemessage', function(data) {
	   var id = $(data.target).data('messageid');
	   if (id && global.confirm(context.text.confirmDeleteMessage)) {
		   context.model.deleteMessage(selectedConversationId, id)
			.then(function() {
				$.telligent.evolution.notifications.show(context.text.messageDeleted, {
					type: 'success'
				});
			   $.telligent.evolution.messaging.publish('conversations-deletemessage', {
				   messageId: id,
				   conversationId: selectedConversationId
			   });
			});
	   }
	});

	$.telligent.evolution.messaging.subscribe('conversations-resized', function(m) {
		if (initialized) {
			pageUntilScrolls();
		}
		scroll();
	});

	$.telligent.evolution.messaging.subscribe('conversation-setstatus', function(d) {
		if (d.message && d.message.length > 0) {
			statusMessage = d.message;
		} else {
			statusMessage = null;
		}
		updateStatusHeader();
	})

	$.telligent.evolution.messaging.subscribe('conversations-typing', function (d) {
		if (d.conversationId == selectedConversationId) {
			global.clearTimeout(typingUsers[d.name]);
			typingUsers[d.name] = global.setTimeout(function() {
				delete typingUsers[d.name];
				updateStatusHeader();
			}, (d.delay || 1500) * 2);
		}
		updateStatusHeader();
	});

	context.layoutRegions.conversation.on('scroll', throttle(function() {
		scroll();
	}));

	context.layoutRegions.conversation.on('scrolltop', function() {
		if (!hasMorePrevious || !previousDate || !selectedConversationId || !initialized || loadingPrevious)
			return;

		loadingPrevious = true;
		var conversationId = selectedConversationId;
		context.fields.conversationPreviousLoading.show();

		context.model.listPreviousMessages(selectedConversationId, previousDate)
			.then(function(messages) {
				if (selectedConversationId != conversationId) {
					return;
				}
				$.each(messages.Messages, function(i, m) {
				   addMessage(m, true);
				   previousDate = m.CreatedDate;
				});
				if (messages.TotalCount <= context.pageSize) {
				   hasMorePrevious = false;
				}
				pruneMessages(false);
			})
			.catch(function() {
				hasMorePrevious = false;
			})
			.always(function() {
				context.fields.conversationPreviousLoading.hide();
				scroll();
				loadingPrevious = false;
			});
	});

	context.layoutRegions.conversation.on('scrollend', function(){
		if(!hasMoreNext || !nextDate || !selectedConversationId || !initialized || loadingNext)
			return;

		loadingNext = true;
		var conversationId = selectedConversationId;
		context.fields.conversationNextLoading.show();

		context.model.listNextMessages(selectedConversationId, nextDate)
			.then(function(messages) {
				if (selectedConversationId != conversationId) {
					return;
				}
				$.each(messages.Messages, function(i, m) {
				   addMessage(m, false);
				   nextDate = m.CreatedDate;
				});
				if (messages.TotalCount <= context.pageSize) {
					markConversationRead();
					hasMoreNext = false;
					hasNewMessages = false;
					updateStatusHeader();
				}
				pruneMessages(true);
			})
			.catch(function() {
				hasMoreNext = false;
			})
			.always(function() {
				context.fields.conversationNextLoading.hide();
				scroll();
				loadingNext = false;
			});
	});

	context.fields.conversationPreviousLoading.css({
		top: '0px',
		left: '0px',
		width: '100%',
		position: 'absolute'
	}).hide();
	context.fields.conversationNextLoading.hide();
	context.fields.conversationNew.hide();
	context.fields.messageList.hide();
	reset();
};