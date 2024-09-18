var ConversationHeader = function(context) {
    
    var spinner = '<span class="ui-loading" width="48" height="48"></span>';
    
    var currentConversation = null;
    var participantTemplate = null;
    var lookupUserTimeout = null;
    var shown = true;
    var currentSearchText = null;
    
    function hide() {
        if (shown) {
            context.layoutRegions.conversationHeader.css({
                height: '0px',
                overflow: 'hidden'
            });
            shown = false;
        }
    }
    
    function show() {
        if (!shown) {
            context.layoutRegions.conversationHeader.css({
                height: 'auto',
                overflow: 'visible'
            });
            shown = true;
        }
    }
    
    function recipientsChanged() {
        var userNames = [];
        for (var i = 0; i < context.fields.newRecipients.glowLookUpTextBox('count'); i++) {
            userNames.push(context.fields.newRecipients.glowLookUpTextBox('getByIndex', i).Value);
        }
        $.telligent.evolution.messaging.publish('conversations-showrecipients', {
            userNames: userNames.join(',')
        });
    }
    
    function findUsers(context, textbox, searchText) {
		window.clearTimeout(lookupUserTimeout);
		currentSearchText = searchText;
		if (searchText && searchText.length >= 2) {
		    var selected = {};
		    for (var i = 0; i < textbox.glowLookUpTextBox('count'); i++) {
		        selected[textbox.glowLookUpTextBox('getByIndex', i).Value] = true;
		    }
		    
			textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)]);
			context.lookupUserTimeout = window.setTimeout(function () {
				$.telligent.evolution.get({
					url: context.urls.lookupUsers,
					data: { w_query: searchText },
					success: function (response) {
					    if (searchText == currentSearchText) {
    						if (response && response.matches.length > 1) {
    							var suggestions = [];
    							for (var i = 0; i < response.matches.length; i++) {
    								var item = response.matches[i];
    								if (item && item.userName) {
    								    if (selected[item.userName] === true) {
    								        suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userName, item.title, '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.text.alreadyInConversation + '</span></div>', false));
    								    } else if (item.valid) {
    								        suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userName, item.title, item.preview, true));
    								    } else {
    								        suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userName, item.title, '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.text.cannotStartConversationWith + '</span></div>', false));
    								    }
    								}
    							}
    
    							textbox.glowLookUpTextBox('updateSuggestions', suggestions);
    						}
    						else
    							textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', context.text.noRecipientsMatch, context.text.noRecipientsMatch, false)]);
					    }
					}
				});
			}, 500);
		}
	}
    
    $.telligent.evolution.messaging.subscribe('conversations-resized', function(d) {
        if (d.isSingleColumn) {
            context.fields.viewAllConversations.show();
        } else {
            context.fields.viewAllConversations.hide();
        }
    });
    
    $.telligent.evolution.messaging.subscribe('conversations-showconversation', function(c) {
        if (c.temporary) {
            return;
        }
        
        currentConversation = c.conversation || {};
        context.fields.newRecipients.closest('fieldset').hide();
        
        if (currentConversation.Id) {
            show();
            
            participantTemplate = participantTemplate || $.telligent.evolution.template(context.templateIds.participant);
            
            context.fields.participants.empty().show();
            $.each(currentConversation.Participants, function(i, p) {
               context.fields.participants.append(participantTemplate(p)); 
            });
            
            context.fields.deleteConversation.show();
            context.fields.leaveConversation.show();
        } else {
            context.fields.participants.hide();
            context.fields.deleteConversation.hide();
            context.fields.leaveConversation.hide();
            hide();
        }
        
        $.telligent.evolution.messaging.publish('conversations-resize');
    });
    
    $.telligent.evolution.messaging.subscribe('conversations-updateconversation', function(data) {
       if (currentConversation == null || data.conversation == null || currentConversation.Id != data.conversation.Id) {
           return;
       } 
       
       currentConversation = data.conversation;
       show();
            
        participantTemplate = participantTemplate || $.telligent.evolution.template(context.templateIds.participant);
        
        context.fields.participants.empty().show();
        $.each(currentConversation.Participants, function(i, p) {
           context.fields.participants.append(participantTemplate(p)); 
        });
        
        context.fields.deleteConversation.show();
        context.fields.leaveConversation.show();
        
         $.telligent.evolution.messaging.publish('conversations-resize');
    });
    
    $.telligent.evolution.messaging.subscribe('conversations-newconversation', function(d) {
       currentConversation = null;
       
       context.fields.deleteConversation.hide();
       context.fields.leaveConversation.hide();
       context.fields.participants.hide();
       context.fields.newRecipients.closest('fieldset').show();
       
       for (var i = context.fields.newRecipients.glowLookUpTextBox('count') - 1; i >= 0; i--) {
           context.fields.newRecipients.glowLookUpTextBox('removeByIndex', 0);
       }
       
       if (d.userId) {
           $.telligent.evolution.get({
               url: context.urls.getUser,
               data:  {
                   w_userId: d.userId
               }
           })
            .then(function(r) {
               if (r.user) {
                   if (r.user.valid) {
                        context.fields.newRecipients.glowLookUpTextBox('add', context.fields.newRecipients.glowLookUpTextBox('createLookUp', r.user.userName, r.user.title, r.user.preview, true));
                        recipientsChanged();
                   } else {
                        $.telligent.evolution.notifications.show(context.text.cannotStartConversationWithUser.replace(/\{0\}/g, r.user.title), {
                            type: 'error',
                            duration: 3500
                        });
                   }
               }
            });
       }
       
       show();
       
       $.telligent.evolution.messaging.publish('conversations-resize');
    });
    
    $.telligent.evolution.messaging.subscribe('conversations.restoreparticipant', function(data) {
	   var id = $(data.target).data('userid');
	   if (currentConversation == null || currentConversation.Id == 'new') {
	       return;
	   }
	   
	    context.model.restoreParticipant(currentConversation.Id, id)
			.then(function() {
				$.telligent.evolution.notifications.show(context.text.participantRestored, {
					type: 'success'
				});
			});
	});

    context.fields.viewAllConversations.hide();
    context.fields.deleteConversation.hide();
    context.fields.leaveConversation.hide();
    context.fields.participants.hide();
    context.fields.newRecipients.glowLookUpTextBox({
        maxValues: 20,
		onGetLookUps: function(tb, query) {
            findUsers(context, tb, query);
        },
		emptyHtml: context.text.addRecipientPlaceholder
    })
        .on('glowLookUpTextBoxChange', function() {
            recipientsChanged();
        });
        
    context.fields.newRecipients.closest('fieldset').hide();
    hide();
};