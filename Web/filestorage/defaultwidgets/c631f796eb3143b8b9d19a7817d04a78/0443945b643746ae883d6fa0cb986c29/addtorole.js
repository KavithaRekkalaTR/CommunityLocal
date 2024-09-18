(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    var spinner = '<span class="ui-loading" width="48" height="48"></span>';

    function findRoles(context, textbox, searchText) {
		window.clearTimeout(context.lookupRoleTimeout);
		textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)]);
		context.lookupRoleTimeout = window.setTimeout(function () {
			$.telligent.evolution.get({
				url: context.urls.lookupRolesUrl,
				data: { w_query: searchText },
				success: function (response) {
					if (response && response.matches.length > 1) {
					    var selected = {};
                        var count = textbox.glowLookUpTextBox('count');
                        for (var i = 0; i < count; i++) {
                            var item = textbox.glowLookUpTextBox('getByIndex', i);
                            if (item) {
                                selected[item.Value] = true;
                            }
                        }

						var suggestions = [];
						for (var i = 0; i < response.matches.length; i++) {
							var item = response.matches[i];
							if (item && item.roleId) {
							    var selectable = !item.alreadySelected && !selected[item.roleId];
                                suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.roleId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.text.alreadySelected + '</span></div>', selectable));
							}
						}

						textbox.glowLookUpTextBox('updateSuggestions', suggestions);
					}
					else
						textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', context.text.noUsersMatch, context.text.noRolesMatch, false)]);
				}
			});
		}, 500);
	}

	$.telligent.evolution.widgets.userAdministrationAddToRole = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.saveButton = context.headerWrapper.find('.addtorole');
			context.saveButton.on('click', function() {

			    if (!context.saveButton.hasClass('disabled')) {
			        context.saveButton.addClass('disabled');

			        $.telligent.evolution.batch(function() {
			            for (var i = 0; i < context.fields.roleToAdd.glowLookUpTextBox('count'); i++) {
			                $.telligent.evolution.post({
			                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/roles/user/{UserId}.json',
			                    data: {
			                        UserId: context.userId,
			                        RoleId: context.fields.roleToAdd.glowLookUpTextBox('getByIndex', i).Value
			                    }
			                });
			            }
			        }, {
			            sequential: false
			        })
			        .then(function(response) {
			            if(response && response.BatchResponses) {
                            var allSuccess = true;
                            var anySuccess = false;
                            response.BatchResponses.forEach(function(el) {
                                if(el.BatchResponse && el.BatchResponse.Errors && el.BatchResponse.Errors.length == 0) {
                                    anySuccess = true;
                                }
                                else {
                                    allSuccess = false;
                                }
                            });
                            if(anySuccess) {
                                var message = allSuccess ? context.text.addRoleSuccessful : context.text.addRoleSomeSuccessful;
                                $.telligent.evolution.notifications.show(message, {
                                       type: 'success'
                                });
                                $.telligent.evolution.messaging.publish('entity.updated', {
                                    entity: 'User',
                                    properties: ['Roles']
                                });
                                $.telligent.evolution.administration.close();
                            }
                        }
                    })
			        .always(function() {
			            context.saveButton.removeClass('disabled');
			        });
			    }


			    return false;
			}).addClass('disabled');

			context.fields.roleToAdd.glowLookUpTextBox({
			    maxValues: 20,
			    onGetLookUps: function(tb, query) {
			        findRoles(context, tb, query);
			    },
			    emptyHtml: context.text.roleLookupPlaceholder,
			    minimumLookUpLength: 0
			})
			    .on('glowLookUpTextBoxChange', function() {
			        if (context.fields.roleToAdd.glowLookUpTextBox('count') > 0) {
			            context.saveButton.removeClass('disabled');
			        } else {
			            context.saveButton.addClass('disabled');
			        }
			    });
		}
	};

}(jQuery, window));