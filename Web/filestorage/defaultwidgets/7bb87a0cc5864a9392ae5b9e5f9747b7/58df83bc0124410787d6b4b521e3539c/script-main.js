var Main = function(context) {

    var currentConversationId = null;
    var currentUserNames = null;
    var currentConversationTemporary = false;
    var typingDelayHandle = null;
    var suppressTyping = false;

    var updateUnreadCountHandle = null;

    function updateFromHash() {
        var hashdata = $.telligent.evolution.url.hashData();
        var conversationId = hashdata.ConversationID || hashdata.conversationid;
        var conversationMessageId = hashdata.ConversationMessageID || hashdata.MessageID || hashdata.messageid;
        if(conversationId) {
            context.model.getConversation({ id: conversationId })
                .then(function (c) {
                    context.view = 'conversation';
                    if (conversationMessageId) {
                        context.model.getMessage(conversationMessageId)
                            .then(function(m) {
                                $.telligent.evolution.messaging.publish('conversations-showconversation', {
                                    conversation: c,
                                    message: m
                                });
                            })
                            .catch(function() {
                                $.telligent.evolution.messaging.publish('conversations-showconversation', {
                                    conversation: c
                                });
                            });
                    } else {
                        $.telligent.evolution.messaging.publish('conversations-showconversation', {
                            conversation: c
                        });
                    }
                });
        } else if (hashdata.New) {
            $.telligent.evolution.messaging.publish('conversations-showconversation');

            var userId = hashdata.UserId;

            var contentId = hashdata.ContentId;
            var contentTypeId = hashdata.ContentTypeId;
            context.view = 'conversation';
            if (contentId && contentTypeId) {
                $.telligent.evolution.get({
                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/content.json',
                    data: {
                        ContentId: contentId,
                        ContentTypeId: contentTypeId
                    }
                })
                    .then(function(c) {
                        if (c.Content && c.Content.Url) {
                           $.telligent.evolution.messaging.publish('conversations-newconversation', {
                                userId: userId,
                                message: '<p></p><p>[View:' + c.Content.Url + ':320:60]</p>'
                            });
                            context.fields.editor.evolutionHtmlEditor('focus');
                        } else {
                            $.telligent.evolution.messaging.publish('conversations-newconversation', {
                                userId: userId
                            });
                            context.fields.editor.evolutionHtmlEditor('focus');
                        }
                    })
                    .catch(function() {
                        $.telligent.evolution.messaging.publish('conversations-newconversation', {
                            userId: userId
                        });
                        context.fields.editor.evolutionHtmlEditor('focus');
                    });
            } else {
                $.telligent.evolution.messaging.publish('conversations-newconversation', {
                    userId: userId
                });
                context.fields.editor.evolutionHtmlEditor('focus');
            }
        } else if (hashdata.View == 'All') {
            context.view = 'conversation-list';
            $.telligent.evolution.messaging.publish('conversations-resize');
        }
    }

    function keyDown(e, from) {
        var code = (typeof e.which == "number") ? e.which : e.keyCode;

		if (from == 'editor') {
		    if (code == 9 && e.shiftKey) {
		        context.layoutRegions.conversationHeader.find('.glow-lookuptextbox input[type="text"]').trigger('focus');
		        return cancelEvent(e);
		    }

		    if (!suppressTyping) {
		        suppressTyping = true;
    		    typingDelayHandle = global.setTimeout(function() {
    		        suppressTyping = false;
    		    }, 1500);
    		    if (currentConversationId  && currentConversationId != 'new' && $.telligent.evolution.sockets.conversations) {
    		        try {
    		            $.telligent.evolution.sockets.conversations.send('message.typing', {
    		                UserId: context.userId,
    		                ConversationId: currentConversationId,
    		                Delay: 1500
    		            });
    		        } catch (e) { }
		        }
		    }
		} else if (from == 'recipients') {
		    if (code == 9) {
		        context.fields.editor.evolutionHtmlEditor('focus');
		        return cancelEvent(e);
		    }
		}
    }

    function newConversation() {
        global.location = $.telligent.evolution.url.modify({
            hash: 'New=True'
        });
    }

    function deleteCurrentConversation() {
        if (currentConversationId && currentConversationId != 'new' && global.confirm(context.text.confirmDeleteConversation)) {
            context.model.deleteConversation(currentConversationId)
                .then(function() {
                   $.telligent.evolution.messaging.publish('conversations-deleteconversation', {
                       conversationId: currentConversationId
                   }) ;
                   currentConversationId = null;
                   global.location = $.telligent.evolution.url.modify({
                        hash: ''
                    });
                   $.telligent.evolution.messaging.publish('conversations-showconversation');
                   $.telligent.evolution.notifications.show(context.text.conversationDeleted, {
                       type: 'success'
                   });
                });
        }
    }
    
    function leaveCurrentConversation() {
        if (currentConversationId && currentConversationId != 'new' && global.confirm(context.text.confirmLeaveConversation)) {
            context.model.leaveConversation(currentConversationId)
                .then(function() {
                   $.telligent.evolution.messaging.publish('conversations-leaveconversation', {
                       conversationId: currentConversationId
                   }) ;
                   currentConversationId = null;
                   global.location = $.telligent.evolution.url.modify({
                        hash: ''
                    });
                   $.telligent.evolution.messaging.publish('conversations-showconversation');
                   $.telligent.evolution.notifications.show(context.text.conversationLeft, {
                       type: 'success'
                   });
                });
        }
    }

    function cancelEvent(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        return false;
    }

    function updateUnreadCount() {
        global.clearTimeout(updateUnreadCountHandle);
        updateUnreadCountHandle = global.setTimeout(function() {
            $.telligent.evolution.get({
    			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations.json',
    			cache: false,
    			data: {
    				ReadStatus: 'Unread'
    			},
    			success: function(response) {
    				$.telligent.evolution.notifications.unread(response.TotalCount, {
    				    isLocal: true,
    				    namespace: 'conversations'
    				});
    			},
    			error: { }
    		});
        }, 500);
    }

    function submit() {
        if (currentConversationId) {
            var message = $.trim(context.fields.editor.evolutionHtmlEditor('val'));
            if (message.length <= 0) {
                $.telligent.evolution.notifications.show(context.text.messageRequired, {
                    type: 'error',
                    duration: 3500
                });
                return;
            }

            if (currentConversationId == 'new') {
                if (currentUserNames == null || currentUserNames.length == 0) {
                    $.telligent.evolution.notifications.show(context.text.recipientsRequired, {
                        type: 'error',
                        duration: 3500
                    });
                    return;
                }
                $.telligent.evolution.messaging.publish('conversation-setstatus', {
                    message: context.text.sending
                });
                context.model.addConversation(currentUserNames, message)
                    .then(function(c) {
                        global.location = $.telligent.evolution.url.modify({
                            hash: 'ConversationID=' + c.Id
                        });
                    })
                    .always(function() {
                        context.fields.editor.evolutionHtmlEditor('val', '');
                        if ($('body').hasClass('touch')) {
                            try {
                                global.document.activeElement.blur();
                            } catch (err) {}
                        } else {
                            context.fields.editor.evolutionHtmlEditor('focus');
                        }
                       $.telligent.evolution.messaging.publish('conversation-setstatus', {
                            message: null
                        });
                    });
            } else {
                $.telligent.evolution.messaging.publish('conversation-setstatus', {
                    message: context.text.sending
                });
                context.model.addMessage(currentConversationId, message)
                    .then(function(m) {
                        context.model.getConversation({
                            id: m.ConversationId
                        })
                            .then(function(c) {
                                if (currentConversationTemporary) {
                                    global.location = $.telligent.evolution.url.modify({
                                        hash: 'ConversationID=' + c.Id + '&ConversationMessageID=' + m.Id
                                    });
                                } else {
                                    $.telligent.evolution.messaging.publish('conversations-updateconversation', {
                                        conversation: c
                                    });
                                    $.telligent.evolution.messaging.publish('conversations-newmessage', {
                                        message: m
                                    });
                                    $.telligent.evolution.messaging.publish('conversations-showmessage', {
                                        message: m
                                    });
                                }
                            });
                    })
                    .always(function() {
                        context.fields.editor.evolutionHtmlEditor('val', '');
                        if ($('body').hasClass('touch')) {
                            try {
                                global.document.activeElement.blur();
                            } catch (err) {}
                        } else {
                            context.fields.editor.evolutionHtmlEditor('focus');
                        }
                        
                        $.telligent.evolution.messaging.publish('conversation-setstatus', {
                            message: null
                        });
                    });
            }
        }
    }

    $.telligent.evolution.messaging.subscribe('conversations-showrecipients', function(d) {
        if (d.userNames) {
            currentUserNames = d.userNames;
            currentConversationId = 'new';

            $.telligent.evolution.messaging.publish('conversations-showconversation', {
                conversation: null,
                temporary: true
            });

            context.model.getConversation({
                userNames: currentUserNames
            })
                .then(function(c) {
                    if (c) {
                       $.telligent.evolution.messaging.publish('conversations-showconversation', {
                         conversation: c,
                         temporary: true
                       });
                    } else {
                        $.telligent.evolution.messaging.publish('conversations-showconversation', {
                         conversation: null,
                         temporary: true
                       });
                    }
                });
        } else {
            currentUserNames = null;
            currentConversationId = 'new';
            $.telligent.evolution.messaging.publish('conversations-showconversation', {
                conversation: null,
                temporary: true
            });
        }
    });

    $.telligent.evolution.messaging.subscribe('conversations-showconversation', function(c) {
        if (c.conversation && c.conversation.Id) {
            currentConversationId = c.conversation.Id;
            currentConversationTemporary = c.temporary === true;
        } else {
            currentConversationId = 'new';
            currentConversationTemporary = c.temporary === true;
        }
    });

    $.telligent.evolution.messaging.subscribe('conversations-newconversation', function() {
        currentConversationId = 'new';
    });

    $.telligent.evolution.messaging.subscribe('conversations-conversationread', function() {
        updateUnreadCount();
    });

    $.telligent.evolution.messaging.subscribe('notification.read', function(d)  {
        if (d.typeId == context.conversationNotificationTypeId) {
            context.model.getConversation({
                id: d.contentId,
                reload: true
            })
                .then(function(c) {
                    if (c && !c.HasRead) {
                        context.model.markConversationRead(c.Id)
                            .then(function() {
                                $.telligent.evolution.messaging.publish('conversations-conversationread', {
                                    conversationId: c.Id
                                });
                            });
                    }
                })
        }
	});

	$.telligent.evolution.messaging.subscribe('socket.disconnected', function(d) {
	    $.telligent.evolution.messaging.publish('conversations-enablemessaging', { enabled: false });
	});

	$.telligent.evolution.messaging.subscribe('socket.reconnected', function(d) {
	   context.model.expireAllCaches();
	   $.telligent.evolution.messaging.publish('conversations-reload');
	   $.telligent.evolution.messaging.publish('conversations-enablemessaging', { enabled: true });
	});

	$.telligent.evolution.messaging.subscribe('search.registerFilters', function(data) {
		if (data.scope.key == 'anywhere') {
			data.register({
				name: context.text.searchFilter,
				query: function(query, complete) {
					$.telligent.evolution.get({
						url: context.urls.search,
						data: {
							w_query: query.query,
							w_pageIndex: query.pageIndex
						},
						success: function(response) {
							complete(response);
						}
					});
				},
				advancedSearchUrl: function(query) {
					return null;
				},
				isDefault: true
			});
		}
	});

    $.telligent.evolution.messaging.subscribe('socket.connected', function() {
       if (!$.telligent.evolution.sockets.conversations)  {
           return;
       }

       $.telligent.evolution.sockets.conversations.on('message.new', function(data) {
           if (!data.ConversationId || !data.Id) {
               return;
           }

           context.model.getConversation({ id: data.ConversationId, reload: true })
            .then(function(c) {
                $.telligent.evolution.messaging.publish('conversations-updateconversation', {
                    conversation: c
                });

                updateUnreadCount();

                context.model.getMessage(data.Id)
                    .then(function(m) {
                        $.telligent.evolution.messaging.publish('conversations-newmessage', {
                            message: m
                        });
                        if (c.Id == currentConversationId) {
                            $.telligent.evolution.messaging.publish('conversations-showmessage', {
                                message: m
                            });
                        }
                        if (m.Author.Id != context.userId) {
                            context.sound.play();
                        }
                    });
            });
       });
       
       $.telligent.evolution.sockets.conversations.on('message.edited', function(data) {
           if (!data.ConversationId || !data.Id) {
               return;
           }

           context.model.getConversation({ id: data.ConversationId, reload: true })
            .then(function(c) {
                $.telligent.evolution.messaging.publish('conversations-updateconversation', {
                    conversation: c
                });

                updateUnreadCount();

                context.model.getMessage(data.Id)
                    .then(function(m) {
                        if (c.Id == currentConversationId) {
                            $.telligent.evolution.messaging.publish('conversations-showmessage', {
                                message: m
                            });
                        }
                        if (m.Author.Id != context.userId) {
                            context.sound.play();
                        }
                    });
            });
       });

       $.telligent.evolution.sockets.conversations.on('message.typing', function(data) {
           if (!data.ConversationId || !data.DisplayName) {
               return;
           }
           $.telligent.evolution.messaging.publish('conversations-typing', {
              conversationId: data.ConversationId,
              name: data.DisplayName,
              delay: data.UpdateDelay
           });
       });

       $.telligent.evolution.sockets.conversations.on('message.deleted', function(data) {
           if (!data.ConversationId || !data.Id) {
               return;
           }

           context.model.getConversation({ id: data.ConversationId, reload: true })
            .then(function(c) {
                $.telligent.evolution.messaging.publish('conversations-updateconversation', {
                    conversation: c
                });
            });

           $.telligent.evolution.messaging.publish('conversations-deletemessage', {
              conversationId: data.ConversationId,
              messageId: data.Id
           });
       });
       
       $.telligent.evolution.sockets.conversations.on('conversation.participantsupdated', function(data) {
           if (!data.Id) {
               return;
           }

           context.model.getConversation({ id: data.Id, reload: true })
            .then(function(c) {
                $.telligent.evolution.messaging.publish('conversations-updateconversation', {
                    conversation: c
                });
            });
       });
    });

    $(global).on('hashchange', function() {
        updateFromHash();
    });

    $(function() {
        updateFromHash();
    });

    context.fields.viewAllConversations.on('click', function() {
        global.location = $.telligent.evolution.url.modify({
            hash: 'View=All'
        });
        return false;
    });

    context.fields.newConversation.on('click', function() {
        newConversation();
        return false;
    });

    context.fields.deleteConversation.on('click', function() {
        deleteCurrentConversation();
        return false;
    });
    
    context.fields.leaveConversation.on('click', function() {
        leaveCurrentConversation();
        return false;
    });

    $('body').on('keydown', function(e) {
        return keyDown(e, 'body');
    });
    
    function ensureInEditor() {
        context.fields.editor.evolutionHtmlEditor('focus');
    }
    
    $.telligent.evolution.shortcuts.register('alt + right', function(e) {
        $.telligent.evolution.messaging.publish('conversations-nextconversation');
        ensureInEditor();
        return false;
	}, { description: context.text.nextConversation });
	
	$.telligent.evolution.shortcuts.register('alt + left', function(e) {
        $.telligent.evolution.messaging.publish('conversations-previousconversation');
        ensureInEditor();
        return false;
	}, { description: context.text.previousConversation });
	
	$.telligent.evolution.shortcuts.register('alt + up', function(e) {
        context.layoutRegions.conversation.scrollTop(context.layoutRegions.conversation.scrollTop() - (context.layoutRegions.conversation.outerHeight(true) / 4));
        ensureInEditor();
        return false;
	}, { description: context.text.scrollUp });
	
	$.telligent.evolution.shortcuts.register('alt + down', function(e) {
        context.layoutRegions.conversation.scrollTop(context.layoutRegions.conversation.scrollTop() + (context.layoutRegions.conversation.outerHeight(true) / 4));
        ensureInEditor();
        return false;
	}, { description: context.text.scrollDown });
	
	$.telligent.evolution.shortcuts.register('alt + a', function(e) {
        newConversation();
		return false;
	}, { description: context.text.newConversation });
	
	$.telligent.evolution.shortcuts.register('alt + d', function(e) {
        deleteCurrentConversation();
		return false;
	}, { description: context.text.deleteConversation });
	
	$.telligent.evolution.shortcuts.register('alt + l', function(e) {
        leaveCurrentConversation();
		return false;
	}, { description: context.text.leaveConversation });

    context.layoutRegions.conversationHeader.on('keydown', '.glow-lookuptextbox input[type="text"]', function(e) {
       return keyDown(e, 'recipients');
    });

    $.telligent.evolution.notifications.addFilter(context.conversationNotificationTypeId);

    updateUnreadCount();

    return {
        submit: function() {
            submit();
        },
        keyDown: function(e) {
            return keyDown(e, 'editor');
        }
    };
};