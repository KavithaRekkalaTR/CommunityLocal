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
								if (item && item.userId && context.userIds.indexOf(item.userId) < 0) {
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

	$.telligent.evolution.widgets.membersDelete = {
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

    			        var tasks = [];
                        var count = 0;
                        var batchId = null;

                        var baseData = {};
                        var deleteSuccessMessage = context.text.deleteSuccessful;

                        var v = $('input[type="radio"]:checked', context.fields.reassign).val();
                        if (v == 'user') {
                            baseData.ReassignedUserId = context.fields.reassignToUser.glowLookUpTextBox('getByIndex', 0).Value;
                        } else if (v == 'formermember') {
                            baseData.ReassignedUserId = context.formerMemberUserId;
                        } else if (v == 'delete') {
                            baseData.DeleteAllContent = true;
                            var deleteSuccessMessage = context.text.deleteScheduled;
                        }

                        var idsToRemove = [];
                        $.each(context.userIds, function(index, userId) {
                            if (batchId === null || count >= 100) {
                                if (count >= 100) {
                                    tasks.push($.telligent.evolution.batch.process(batchId, {
                                        sequential: false
                                    }));
                                }
                                batchId = $.telligent.evolution.batch.create();
                                count = 0;
                            }

                            var data = $.extend({}, baseData, {
        			            UserId: userId
        			        });

                            $.telligent.evolution.del({
        			            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json',
        			            data: data,
        			            batch: batchId
        			        })
                                .then(function() {
                                    idsToRemove.push(userId);
                                });

                            count++;
                        });

                        if (count > 0) {
                            tasks.push($.telligent.evolution.batch.process(batchId, {
                                sequential: false
                            }));
                        }

                        $.when.apply($, tasks)
                            .then(function() {
								if (idsToRemove.length > 0) {
									$.telligent.evolution.notifications.show(deleteSuccessMessage, {
										type: 'success'
									});
									$.telligent.evolution.messaging.publish('membersearch.refresh', {});
									$.telligent.evolution.administration.close();
								}
    			            })
    			            .always(function() {
    			                if (idsToRemove.length > 0) {
    			                    context.userIds = $.grep(context.userIds, function(id) {
    			                        return idsToRemove.indexOf(id) < 0;
    			                    });
    			                }

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