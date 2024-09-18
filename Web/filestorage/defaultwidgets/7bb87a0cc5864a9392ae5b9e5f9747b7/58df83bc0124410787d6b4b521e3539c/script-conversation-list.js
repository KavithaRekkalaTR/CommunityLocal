var ConversationList = function(context) {
    var conversationTemplate = null;
    var conversations = {};
    var pageIndex = 0;
    var unreadOnly = false;
    var hasMore = true;
    var selectedConversation = null;
    var selectedConversationId = null;

    function ensureSelectedIsVisible() {
        if (selectedConversation) {
            var pos = selectedConversation.position();
            var height = selectedConversation.outerHeight(true);
            var wrapperScrollTop = context.layoutRegions.conversationList.scrollTop();
            var wrapperHeight = context.layoutRegions.conversationList.outerHeight(true);

            if (0 > pos.top) {
                context.layoutRegions.conversationList.scrollTop(wrapperScrollTop + pos.top);
            } else if ((pos.top + height) > wrapperHeight) {
                context.layoutRegions.conversationList.scrollTop(wrapperScrollTop + (pos.top + height - wrapperHeight));
            }
        }
    }

    function addConversation(c, addToTop) {
        if (unreadOnly && c.HasRead)
            return;

        conversationTemplate = conversationTemplate || $.telligent.evolution.template(context.templateIds.conversation);
        var elm = $(conversationTemplate(c));

        var existing = conversations[c.Id];
        if (existing) {
            existing.remove();
            delete conversations[c.Id];
        }

        if (c.Id == selectedConversationId) {
            selectedConversation = elm;
            elm.addClass('selected');
        }

        if (addToTop) {
            context.fields.conversationList.prepend(elm);
        } else {
            context.fields.conversationList.append(elm);
        }

        ensureSelectedIsVisible()
        conversations[c.Id] = elm;
    }

    function load(conversationId) {
        if (conversationId) {
            global.location = $.telligent.evolution.url.modify({
                hash: 'ConversationID=' + conversationId
            });
            context.view = 'conversation';
            $.telligent.evolution.messaging.publish('conversations-resize');
        }
    }

    function select(conversationId) {
        if (selectedConversation && selectedConversation) {
            selectedConversation.removeClass('selected');
        }
        
        selectedConversationId = conversationId;

        if (conversationId) {
            var c = conversations[conversationId];
            if (c) {
                selectedConversation = c;
                c.addClass('selected');
                ensureSelectedIsVisible()
            } else {
                // new or unloaded conversation, load it and select it
                context.model.getConversation({
                    id: conversationId
                })
                    .then(function(conversation) {
                        addConversation(conversation, true);
                        var c = conversations[conversationId];
                        if (c) {
                            selectedConversation = c;
                            c.addClass('selected');
                            ensureSelectedIsVisible()
                        }
                    });
            }
        } else {
            selectedConversation = null;
        }
    }

    function pageUntilScrolls() {
        if (pageUntilScrollAttempts > 0 && context.fields.conversationList.height() < context.layoutRegions.conversationList.height()) {
            pageUntilScrollAttempts--;
            pageIndex++;
            context.fields.conversationListLoading.show();
            context.model.listConversations(pageIndex, unreadOnly)
                .then(function(conversations) {
                    $.each(conversations.Conversations, function(i, c) {
                       addConversation(c, false);
                    });
                    if (pageIndex === 0 && conversations.Conversations.length === 0) {
                        context.fields.conversationListNone.show();
                    } else {
                        context.fields.conversationListNone.hide();
                    }
                    if (pageIndex === 0 && conversations.Conversations.length > 0 && !selectedConversationId) {
                        $.telligent.evolution.messaging.publish('conversations-showconversation', {
                            conversation: conversations.Conversations[0]
                        });
                    }
                    if (conversations.PageIndex != pageIndex || conversations.TotalCount <= ((pageIndex + 1) * context.pageSize)) {
                        hasMore = false;
                    }
                    if (hasMore) {
                       pageUntilScrolls();
                    }
                })
                .always(function() {
                   context.fields.conversationListLoading.hide();
                });
        }
    }

    function reset() {
        unreadOnly = context.fields.conversationFilter.val() == 'unread';
        pageIndex = -1;
        hasMore = true;
        conversations = {};

        context.fields.conversationList.empty();

        pageUntilScrollAttempts = 9;
        pageUntilScrolls();
    }

    context.fields.conversationFilter.on('change', function() {
        reset();
    });

    context.fields.conversationList.on('click', '.conversation', function() {
        var conversationId = $(this).data('conversationid');
        load(conversationId);
    });

    $.telligent.evolution.messaging.subscribe('conversations-showconversation', function(c) {
       if (c.conversation && c.conversation.Id) {
           if (c.conversation.Id != selectedConversationId) {
                select(c.conversation.Id);
           }
       } else {
           select();
       }
    });

    $.telligent.evolution.messaging.subscribe('conversations-updateconversation', function(c) {
        if (c.conversation && c.conversation.Id) {
            addConversation(c.conversation, true);
            context.fields.conversationListNone.hide();
        }
    });

    $.telligent.evolution.messaging.subscribe('conversations-deleteconversation', function (d) {
        if (d.conversationId) {
            var elm = conversations[d.conversationId];
            if (elm) {
                elm.remove();
                delete conversations[d.conversationId];
                if (context.fields.conversationList.children().length == 0) {
                    context.fields.conversationListNone.show();
                } else {
                    pageUntilScrolls();
                }
            }
        }
    });
    
    $.telligent.evolution.messaging.subscribe('conversations-leaveconversation', function(d) {
       if (d.conversationId) {
            var elm = conversations[d.conversationId];
            if (elm) {
                elm.remove();
                delete conversations[d.conversationId];
                if (context.fields.conversationList.children().length == 0) {
                    context.fields.conversationListNone.show();
                } else {
                    pageUntilScrolls();
                }
            }
        }
    });

    $.telligent.evolution.messaging.subscribe('conversations-conversationread', function(c) {
        if (c && c.conversationId) {
            var elm = conversations[c.conversationId];
            if (elm) {
                elm.removeClass('unread');
            }
        }
    });

    $.telligent.evolution.messaging.subscribe('conversations-nextconversation', function() {
        if (selectedConversationId) {
            var elm = conversations[selectedConversationId];
            if (elm) {
                elm = elm.next();
                if (elm.length > 0) {
                    load(elm.data('conversationid'));
                }
            }
        } else {
            var elms = context.fields.conversationList.find('.conversation');
            if (elms.length > 0) {
                load(elms.data('conversationid'));
            }
        }
    });

    $.telligent.evolution.messaging.subscribe('conversations-previousconversation', function() {
        if (selectedConversationId) {
            var elm = conversations[selectedConversationId];
            if (elm) {
                elm = elm.prev();
                if (elm.length > 0) {
                    load(elm.data('conversationid'));
                }
            }
        } else {
            var elms = context.fields.conversationList.find('.conversation');
            if (elms.length > 0) {
                load(elms.data('conversationid'));
            }
        }
    });

    $.telligent.evolution.messaging.subscribe('conversations-reload', function() {
       reset();
    });

    context.layoutRegions.conversationList.on('scrollend', function(){
        if(!hasMore)
            return;
        pageIndex++;
        context.fields.conversationListLoading.show();
        context.model.listConversations(pageIndex, unreadOnly)
            .then(function(conversations) {
                $.each(conversations.Conversations, function(i, c) {
                   addConversation(c, false);
                });
                if (pageIndex === 0 && conversations.Conversations.length === 0) {
                    context.fields.conversationListNone.show();
                } else {
                    context.fields.conversationListNone.hide();
                }
                if (conversations.PageIndex != pageIndex || conversations.TotalCount <= ((pageIndex + 1) * context.pageSize)) {
                   hasMore = false;
                }
            })
            .always(function() {
               context.fields.conversationListLoading.hide();
            });
    });

    $(function() {
        reset();
    });

    context.fields.conversationListNone.hide();
    context.fields.conversationListLoading.hide();
};