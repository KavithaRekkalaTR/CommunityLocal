(function ($, global) {

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};

	function leaveGroup(context) {
		$.telligent.evolution.del({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users/{UserId}.json',
			data: {
				UserId: context.userId,
				GroupId: context.groupId
			},
			success: function (response) {
				alert(context.leftText);
				if(context.isGroupPrivate)
					global.location.href=$.telligent.evolution.site.getBaseUrl()
				else
					global.location.reload();
			},
			defaultErrorMessage: context.errorText
		});
	}

	function joinGroup(context) {
		$.telligent.evolution.post({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users.json',
			data: {
				UserId: context.userId,
				GroupId: context.groupId
			},
			success: function (response) {
				alert(context.joinedText);
				global.location.reload();
			},
			defaultErrorMessage: context.errorText
		});
	}

	function requestJoinGroup(context) {
		Telligent_Modal.Open(context.requestJoinUrl, 550, 300, function() {
			global.location.reload();
		});
	}

	function toggleMembership(context) {
		if (context.membershipType != "None")
			leaveGroup(context);
		else if (context.canJoinGroup)
			joinGroup(context);
		else
			requestJoinGroup(context);
	}

	$.telligent.evolution.widgets.groupBanner = {
		register: function (context) {
			if (context.forceRequestMembership) {
				if (context.canJoinGroup) {
					joinGroup(context);
				} else {
					requestJoinGroup(context);
				}
			}

			if (context.groupMembershipButton && context.groupMembershipButton.length > 0){
				context.groupMembershipButton.on('click', function(e){
					toggleMembership(context); e.preventDefault();
				});
			}
		}
	};

})(jQuery, window);
