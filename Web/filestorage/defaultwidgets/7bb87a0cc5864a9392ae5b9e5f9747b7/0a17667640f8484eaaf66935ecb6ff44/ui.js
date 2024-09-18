(function($, global, undef){

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};

	$.telligent.evolution.widgets.groupLinks = {
		register: function(options) {
			var joinOptions = {
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users.json',
				data: {
					GroupId: options.groupId,
					UserId: options.userId
				},
				success: function() {
					alert(options.joinedText);
					global.location.reload();
				}
			};

			// activate group joining buttons
			$.telligent.evolution.messaging.subscribe(options.joinMessageLinkName, function() {
				joinOptions.data.GroupMembershipType = 'Member';
				$.telligent.evolution.post(joinOptions);
				return false;
			});

			// request join
			$.telligent.evolution.messaging.subscribe(options.requestJoinMessageLinkName, function() {
				if (options.canJoinGroup) {
					joinOptions.data.GroupMembershipType = 'PendingMember';
					$.telligent.evolution.post(joinOptions);
				} else {
					Telligent_Modal.Open(options.requestJoinUrl, 550, 300, function() { global.location.reload(); });
				}
				return false;
			});

			// activate membership cancellation links
			$.telligent.evolution.messaging.subscribe(options.cancelMessageLinkName, function() {
				if(confirm(options.cancelConfirmMessage)) {
					$.telligent.evolution.del({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/members/users/{UserId}.json',
						data: {
							GroupId: options.groupId,
							UserId: options.userId
						},
						success: function(){
							alert(options.leftText);
							if(options.redirectToAfterLeave) {
								global.location.href = options.redirectToAfterLeave;
							} else {
								global.location.href = global.location.href.replace('requestmembership=true','');
							}
						}
					});
				}
				return false;
			});
		}
	};

})(jQuery, window);
