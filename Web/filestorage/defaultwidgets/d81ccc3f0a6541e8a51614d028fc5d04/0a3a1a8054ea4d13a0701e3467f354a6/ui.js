(function ($, global) {

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};

	function joinGroup(context, message) {
		return $.telligent.evolution.post({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users.json',
			data: {
				UserId: context.userId,
				GroupId: context.groupId,
				GroupMembershipType: context.canJoinDirectly ? 'Member' : 'PendingMember',
				Message: message || ''
			}
		});
	}

	$.telligent.evolution.widgets.requestGroupMembership = {
		register: function (context) {
		    var message = $(context.messageSelector);

			context.submit.evolutionValidation({
                onValidated: function (isValid, buttonClicked, c) {
                    if (isValid) {
                        context.submit.removeClass('disabled');
                    } else {
                        context.submit.addClass('disabled');
                    }
                },
                onSuccessfulClick: function (e) {
                    $('.processing', context.submit.parent()).css("visibility", "visible");
                    context.submit.addClass('disabled');

                    joinGroup(context, message.length > 0 ? message.val() : '')
                        .catch(function() {
                            $('.processing', context.submit.parent()).css("visibility", "hidden");
                            context.submit.removeClass('disabled');
                        })
                        .then(function() {
                            if (context.canJoinDirectly) {
                                $.telligent.evolution.notifications.show(context.joined, { type: 'success' });
                            } else {
                                $.telligent.evolution.notifications.show(context.requestSent, { type: 'success' });
                            }

                            var opener = global.parent.Telligent_Modal.GetWindowOpener(global);
                            opener.location = opener.location;
                            opener.Telligent_Modal.Close(true);
                        });
                }
            });

            if (message.length > 0) {
                context.submit.evolutionValidation('addField', context.messageSelector, {
                    required: true,
                    messages: {
                        required: context.messageRequired
                    }
                }, '.field-item.request-message .field-item-validation', {});
            }
		}
	};

})(jQuery, window);
