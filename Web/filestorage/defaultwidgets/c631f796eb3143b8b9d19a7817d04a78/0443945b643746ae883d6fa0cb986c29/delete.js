(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	
	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

    function findUsers(context, textbox, searchText) {
		window.clearTimeout(context.lookupUserTimeout);
		if (searchText && searchText.length >= 2) {
			textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)]);
			context.lookupUserTimeout = window.setTimeout(function () {
				$.telligent.evolution.get({
					url: context.urls.lookupUsersUrl,
					data: { w_query: searchText },
					success: function (response) {
						if (response && response.matches.length > 1) {
							var suggestions = [];
							for (var i = 0; i < response.matches.length; i++) {
								var item = response.matches[i];
								if (item && item.userId) {
									suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userId, item.title, item.preview, true));
								}
							}

							textbox.glowLookUpTextBox('updateSuggestions', suggestions);
						}
						else
							textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', context.text.noUsersMatch, context.text.noUsersMatch, false)]);
					}
				});
			}, 500);
		}
	}
	
	function validate(context) {
	    var v = $('input[type="radio"]:checked', context.fields.reassign).val();
        if (v == 'user') {
            if (context.fields.reassignToUser.glowLookUpTextBox('count') > 0) {
                context.deleteButton.removeClass('disabled');
            } else {
                context.deleteButton.addClass('disabled');
            }
        } else {
            context.deleteButton.removeClass('disabled');
        }
	}

	$.telligent.evolution.widgets.userAdministrationDelete = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();
			
			context.deleteButton = context.headerWrapper.find('.delete');
			context.deleteButton.on('click', function() {
			    if (!context.deleteButton.hasClass('disabled')) {
			        if (global.confirm(context.text.verifyDelete)) {
    			        context.deleteButton.addClass('disabled');
    			        
    			        var data = {
    			            UserId: context.userId
    			        };
    			        
    			        var v = $('input[type="radio"]:checked', context.fields.reassign).val();
                        if (v == 'user') {
                            data.ReassignedUserId = context.fields.reassignToUser.glowLookUpTextBox('getByIndex', 0).Value;
                        } else if (v == 'formermember') {
                            data.ReassignedUserId = context.formerMemberUserId;
                        } else if (v == 'delete') {
                            data.DeleteAllContent = true;
                        }
    			        
    			        $.telligent.evolution.del({
    			            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json',
    			            data: data
    			        })
    			            .then(function() {
    			               $.telligent.evolution.notifications.show(context.text.deleteSuccessful, {
    			                   type: 'success'
    			               });
    			               $.telligent.evolution.messaging.publish('entity.deleted', {
                                    entity: 'User',
                                    id: context.userId,
                                    properties: ['AvatarUrl']
                                });
    			               global.history.go(-2);
    			            })
    			            .always(function() {
    			                context.deleteButton.removeClass('disabled');
    			            });
			        }
			    }
			    
			    return false;
			});

			context.fields.reassignToUser.glowLookUpTextBox({
			    maxValues: 1,
			    onGetLookUps: function(tb, query) {
			        findUsers(context, tb, query);
			    },
			    emptyHtml: context.text.userLookupPlaceholder
			})
			    .glowLookUpTextBox('disabled', true)
			    .on('glowLookUpTextBoxChange', function() {
			        validate(context);
			    });
			
			$('input[type="radio"]', context.fields.reassign).on('change input', function() {
                var v = $('input[type="radio"]:checked', context.fields.reassign).val();
                if (v == 'user') {
                    context.fields.reassignToUser.glowLookUpTextBox('disabled', false);
                } else {
                    context.fields.reassignToUser.glowLookUpTextBox('disabled', true);
                }
                validate(context);
            });
		}
	};

}(jQuery, window));
