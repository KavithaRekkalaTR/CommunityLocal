(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	function validate(context) {
	    var d = context.fields.bannedUntil.glowDateTimeSelector('val');
        if (d && d > (new Date())) {
            context.banButton.removeClass('disabled');
        } else {
            context.banButton.addClass('disabled');
        }
	}

	$.telligent.evolution.widgets.membersBan = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.banButton = context.headerWrapper.find('.ban');
			context.banButton.on('click', function() {
			    if (!context.banButton.hasClass('disabled')) {
			        if (global.confirm(context.text.verifyBan)) {
    			        context.banButton.addClass('disabled');

    			        var tasks = [];
                        var count = 0;
                        var batchId = null;

                        var baseData = {
                            AccountStatus: 'Banned',
                            BanReason: context.fields.bannedReason.val(),
                            BannedUntil : $.telligent.evolution.formatDate(context.fields.bannedUntil.glowDateTimeSelector('val'))
                        };

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

                            $.telligent.evolution.put({
                                url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json?IncludeFields=Id',
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
    			               $.telligent.evolution.notifications.show(context.text.banSuccessful, {
    			                   type: 'success'
    			               });
    			               $.telligent.evolution.messaging.publish('membersearch.refresh', {});
    			               $.telligent.evolution.administration.close();
    			            })
    			            .always(function() {
    			                if (idsToRemove.length > 0) {
    			                    context.userIds = $.grep(context.userIds, function(id) {
    			                        return idsToRemove.indexOf(id) < 0;
    			                    });
    			                }

    			                context.banButton.removeClass('disabled');
    			            });
			        }
			    }

			    return false;
			});

			context.fields.bannedUntil.glowDateTimeSelector(
                $.extend({},
                    $.fn.glowDateTimeSelector.dateDefaults,
                {
                showPopup: true,
                allowBlankvalue: true
                }
            ))
                .on('glowDateTimeSelectorChange', function() {
                    validate(context);
                });

			validate(context);
		}
	};

}(jQuery, window));