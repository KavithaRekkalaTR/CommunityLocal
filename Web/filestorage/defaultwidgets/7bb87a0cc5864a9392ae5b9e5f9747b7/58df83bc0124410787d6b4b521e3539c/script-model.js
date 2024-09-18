var Model = function(context) {

    var conversations = new Cache(20);
    var newestMessages = new Cache(20);

    function getConversation(options) {
        return $.Deferred(function(d) {
            var c = null;
            if (options.id) {
                c = conversations.get(options.id);
                if (c && options.reload !== true) {
                    d.resolve(c);
                    return;
                } else {
                    $.telligent.evolution.get({
                        url: context.urls.getConversation,
                        data: {
                            Id: options.id
                        }
                    })
                        .then(function(conversation) {
                            conversations.set(conversation.Conversation.Id, conversation.Conversation);
                            d.resolve(conversation.Conversation);
                        })
                        .catch(function() {
                            d.reject();
                        });
                }
            } else if (options.userNames) {
                $.telligent.evolution.get({
                    url: context.urls.getConversation,
                    data: {
                        Usernames: options.userNames
                    }
                })
                    .then(function(conversation) {
                        if (conversation.Conversation) {
                            conversations.set(conversation.Conversation.Id, conversation.Conversation);
                            d.resolve(conversation.Conversation);
                        } else {
                            d.reject();
                        }
                    })
                    .catch(function() {
                        d.reject();
                    });
            } else {
                d.reject();
            }
        }).promise();
    }

    function listConversations(pageIndex, unreadOnly) {
        return $.Deferred(function(d) {
            $.telligent.evolution.get({
                url: context.urls.listConversations,
                data: {
                    PageIndex: pageIndex,
                    PageSize: context.pageSize,
                    ReadStatus: unreadOnly ? 'Unread' : 'NotSet'
                }
            })
                .then(function(list) {
                   $.each(list.Conversations, function(i, c) {
                       conversations.set(c.Id, c);
                   });
                   d.resolve(list);
                })
                .catch(function() {
                    d.reject();
                });
        }).promise();
    }

    function listNextMessages(conversationId, afterDate) {
        return $.telligent.evolution.get({
            url: context.urls.listMessages,
            data: {
                ConversationId: conversationId,
                PageIndex: 0,
                PageSize: context.pageSize,
                StartDate: afterDate,
                SortOrder: 'Ascending'
            }
        });
    }

    function listPreviousMessages(conversationId, beforeDate) {
        return $.Deferred(function(d) {
            var isFirstPage = (beforeDate === '');

            if (isFirstPage) {
                var messages = newestMessages.get(conversationId);
                if (messages) {
                    d.resolve(messages);
                    return;
                }
            }

            $.telligent.evolution.get({
                url: context.urls.listMessages,
                data: {
                    ConversationId: conversationId,
                    PageIndex: 0,
                    PageSize: context.pageSize,
                    EndDate: beforeDate,
                    SortOrder: 'Descending'
                }
            })
                .then(function(list) {
                    if (isFirstPage) {
                        newestMessages.set(conversationId, list);
                    }
                    d.resolve(list);
                })
                .catch(function() {
                    d.reject();
                });
        }).promise();
    }

    function addMessage(conversationId, message) {
        return $.Deferred(function(d) {
            $.telligent.evolution.post({
                url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations/{ConversationId}/messages.json',
                data: {
                    ConversationId: conversationId,
                    Body: message
                }
            })
                .then(function(m) {
                    getMessage(m.ConversationMessage.Id)
                        .then(function(m2) {
                            conversations.del(m2.ConversationId);
                            d.resolve(m2);
                        })
                        .catch(function() {
                            d.reject();
                        });
                })
                .catch(function() {
                    d.reject();
                });
        }).promise();
    }

    function deleteConversation(conversationId) {
        return $.telligent.evolution.del({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations/{ConversationId}.json',
            data: {
                ConversationId: conversationId
            }
        });
    }
    
    function leaveConversation(conversationId) {
        return $.telligent.evolution.del({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations/{ConversationId}.json',
            data: {
                ConversationId: conversationId,
                Method: 'Leave'
            }
        });
    }
    
    function restoreParticipant(conversationId, userId) {
        return $.telligent.evolution.put({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations/{ConversationId}/participants/{UserId}/restore.json',
            data: {
                ConversationId: conversationId,
                UserId: userId
            }
        });
    }

    function deleteMessage(conversationId, messageId) {
        return $.telligent.evolution.del({
            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations/{ConversationId}/messages/{MessageId}.json',
            data: {
                ConversationId: conversationId,
                MessageId: messageId
            }
        });
    }

    function addConversation(userNames, message) {
        return $.Deferred(function(d) {
            $.telligent.evolution.post({
                url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations.json',
                data: {
                    Usernames: userNames,
                    Body: message
                }
            })
                .then(function(c) {
                    getConversation({ id: c.Conversation.Id })
                        .then(function(c2) {
                            conversations.set(c2.Id, c2);
                            d.resolve(c2);
                        })
                        .catch(function() {
                            d.reject();
                        });
                })
                .catch(function() {
                    d.reject();
                });
        }).promise();

    }

    function getMessage(id) {
        return $.Deferred(function(d) {
            $.telligent.evolution.get({
                url: context.urls.getMessage,
                data: {
                    Id: id
                }
            })
                .then(function(m) {
                    d.resolve(m.Message);
                })
                .catch(function() {
                    d.reject();
                });
        }).promise();
    }

    function markConversationRead(id) {
        return $.Deferred(function(d) {
            $.telligent.evolution.put({
                url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/conversations/{ConversationId}/read.json',
                data: {
                    ConversationId: id,
                    HasRead: true
                }
            })
                .then(function(m) {
                    var c = conversations.get(id);
                    if (c) {
                        c.HasRead = true;
                    }
                    d.resolve();
                })
                .catch(function() {
                    d.reject();
                });
        }).promise();
    }

    $.telligent.evolution.messaging.subscribe('conversations-newmessage', function(d) {
        if (d.message && d.message.ConversationId) {
            var list = newestMessages.get(d.message.ConversationId);
            if (list) {
                if (list.Messages.length >= context.pageSize) {
                    list.Messages.pop();
                }

                list.Messages.unshift(d.message);
                list.TotalCount++;

                newestMessages.set(d.message.ConversationId, list);
            }
        }
    });

    return {
      listConversations: function(pageIndex, unreadOnly) {
          return listConversations(pageIndex, unreadOnly);
      },
      getConversation: function(options) {
          return getConversation(options);
      },
      listNextMessages: function(conversationId, afterDate) {
          return listNextMessages(conversationId, afterDate);
      },
      listPreviousMessages: function(conversationId, beforeDate) {
          return listPreviousMessages(conversationId, beforeDate);
      },
      addMessage: function(conversationId, message) {
          return addMessage(conversationId, message);
      },
      addConversation: function(userNames, message) {
          return addConversation(userNames, message);
      },
      getMessage: function(id) {
          return getMessage(id);
      },
      deleteConversation: function(conversationId) {
          return deleteConversation(conversationId);
      },
      leaveConversation: function(conversationId) {
        return leaveConversation(conversationId);  
      },
      restoreParticipant: function(conversationId, userId) {
        return restoreParticipant(conversationId, userId);  
      },
      deleteMessage: function(conversationId, id) {
          return deleteMessage(conversationId, id);
      },
      markConversationRead: function(conversationId) {
          return markConversationRead(conversationId);
      },
      expireAllCaches: function() {
        conversations.empty();
        newestMessages.empty();
      }
    };

};