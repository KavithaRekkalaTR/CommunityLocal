var Editor = function(context) {
    
    var currentConversationId = null;
    var shown = true;
    var isSingleColumn = false;
    var checkScrollTimeout = null;
    var isEnabled = true;
    var shouldShow = true;
    var recipientsFocused = false;

    function hide() {
        if (shown) {
            context.layoutRegions.editor.css({
                height: '0px',
                overflow: 'hidden'
            });
            shown = false;
            $.telligent.evolution.messaging.publish('conversations-resize');
        }
    }
    
    function show(adjustConversationScrollTop) {
        if (!shown) {
            context.layoutRegions.editor.css({
                height: 'auto',
                overflow: 'visible'
            });
            shown = true;
            
            if (adjustConversationScrollTop === true) {
                context.layoutRegions.conversation.scrollTop(context.layoutRegions.conversation.scrollTop() + context.layoutRegions.editor.outerHeight(true));
            }
            
            $.telligent.evolution.messaging.publish('conversations-resize');
            
            if (adjustConversationScrollTop === true) {
                context.layoutRegions.conversation.scrollTop(context.fields.messageList.outerHeight(true) - context.layoutRegions.conversation.outerHeight(true));
            }
        }
    }
    
    function updateShowHide(adjustConversationScrollTop) {
        if (shouldShow && isEnabled) {
            show(adjustConversationScrollTop);
        } else {
            hide();
        }
    }
    
    function showWhenConversationScrolled() {
        var scrollOffset = (context.fields.messageList.outerHeight(true) - (context.layoutRegions.conversation.scrollTop() + context.layoutRegions.conversation.outerHeight(true)));
        if (shouldShow) {
            if (recipientsFocused || scrollOffset >= context.layoutRegions.editor.outerHeight(true) + 26 || context.fields.conversationNextLoading.css('display') != 'none') {
                shouldShow = false;
                updateShowHide();
            }
        } else {
            if (!recipientsFocused && scrollOffset <= 25 && context.fields.conversationNextLoading.css('display') == 'none') {
                shouldShow = true;
                updateShowHide(true);
            }
        }
    }
    
    
    $.telligent.evolution.messaging.subscribe('conversations-enablemessaging', function(d) {
        isEnabled = d.enabled;
        updateShowHide();
    });
    
    $.telligent.evolution.messaging.subscribe('conversations-showconversation', function(c) {
        if (!c.temporary && (!c.conversation || currentConversationId != c.conversation.Id)) {
            currentConversationId = c.conversation ? c.conversation.Id : null;
            if (currentConversationId) {
                shouldShow = true;
                updateShowHide();
                context.fields.editor.evolutionHtmlEditor('ready', function() {
                    context.fields.editor.evolutionHtmlEditor('context', 'conversation-' + currentConversationId);
                });
            } else {
                shouldShow = false;
                context.fields.editor.evolutionHtmlEditor('ready', function() {
                    context.fields.editor.evolutionHtmlEditor('context', '');
                });
                updateShowHide();
            }
        }
    });
    
    $.telligent.evolution.messaging.subscribe('conversations-newconversation', function(d) {
        if (currentConversationId != 'new') {
            $.telligent.evolution.messaging.publish('conversations-resize');
            currentConversationId = 'new';
            shouldShow = true;
            updateShowHide();
            context.fields.editor.evolutionHtmlEditor('ready', function() {
                context.fields.editor.evolutionHtmlEditor('context', 'conversation-' + currentConversationId);
                if (d.message) {
                    context.fields.editor.evolutionHtmlEditor('val', d.message);
                }
            });
        }
    });
    
    $.telligent.evolution.messaging.subscribe('conversations-resized', function (d) {
        isSingleColumn = d.isSingleColumn;
        if (currentConversationId) {
            if (isSingleColumn) {
                global.clearTimeout(checkScrollTimeout);
                checkScrollTimeout = global.setTimeout(function() {
                    showWhenConversationScrolled();
                }, 250);
            } else {
                shouldShow = true;
                updateShowHide();
            }
        }
    });
    
    context.layoutRegions.conversation.on('scroll', function() {
        if (isSingleColumn && currentConversationId) {
            global.clearTimeout(checkScrollTimeout);
            checkScrollTimeout = global.setTimeout(function() {
                showWhenConversationScrolled();
            }, 250);
        }
    });
    
    context.layoutRegions.conversationHeader.on('focus', '.glow-lookuptextbox input[type="text"]', function() {
        recipientsFocused = true;
        if (isSingleColumn && currentConversationId) {
            global.clearTimeout(checkScrollTimeout);
            showWhenConversationScrolled();
        }
    });
    
    context.layoutRegions.conversationHeader.on('blur', '.glow-lookuptextbox input[type="text"]', function() {
        recipientsFocused = false;
        if (isSingleColumn && currentConversationId) {
            global.clearTimeout(checkScrollTimeout);
            showWhenConversationScrolled();
        }
    });

    hide();
};