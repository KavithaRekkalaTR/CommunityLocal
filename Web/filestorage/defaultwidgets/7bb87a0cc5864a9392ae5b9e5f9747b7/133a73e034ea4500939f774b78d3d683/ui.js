(function($, global) {

	// returns the friend id related to a given child element of that friend id's row item
	var setupEndlessScrolling = function(context) {
		var isLoadingMore = false, pageIndex = 0, hasMore = context.hasMore == 'True';
		$(document).on('scrollend', function(e){
			if(isLoadingMore || !hasMore)
				return;

			isLoadingMore = true;

			var data = {}
			data[context.pageIndexKey] = pageIndex + 2;

			$.telligent.evolution.get({
				url: context.loadUrl,
				data: data
			}).then(function(response){
				var items = $(response).find('div.content-item.thumbnail');
				if (context.inEditMode) {
					items.find('.edit-mode').show().find('input[type="checkbox"]').prop('checked', false);
				}
				hasMore = items.data('hasmore') == 'True';
				context.thumbnailsContainer.evolutionMasonry('append', items);
				pageIndex++;
				isLoadingMore = false;
			});
		});
	};

	var api = {
		register: function(context) {
			context.inEditMode = false;
			context.editFormActionTaken = false;

			setupEndlessScrolling(context);

			context.thumbnailsContainer
				.on('click', '.content-item', function(e){
					if (context.inEditMode) {
						var cb = $(this).find('.edit-mode input[type="checkbox"]');
						cb.prop('checked', !cb.is(':checked')).trigger('change');
					} else {
						var elm = $(this);
						window.location = elm.data('url');
					}
				});

			context.thumbnailsContainer
				.on('click', 'input[type="checkbox"]', function(e){
					if (context.inEditMode) {
						var cb = $(this);
						cb.prop('checked', !cb.is(':checked')).trigger('change');
					} else {
						var elm = $(this);
						window.location = elm.data('url');
					}
				});

			context.wrapper.find('select').on('change', function() {
				var s = $(this);
				var url = s.data('update');
				if (url) {
					window.location = url.replace('OPTIONVALUE', s.val());
				}
			});

			context.editMode.on('click', function() {
				context.inEditMode = !context.inEditMode;
				context.selectionCount = 0;

				if (context.inEditMode) {
					context.editForm.slideDown('fast');
					context.editMode.html(context.cancelMessage);
					context.editModeMessage.html(context.selectedUsersMessage.replace('{0}', '0'));
					context.thumbnailsContainer.find('.edit-mode').show().find('input[type="checkbox"]').prop('checked', false)
				} else {
					context.editForm.slideUp('fast');
					context.editMode.html(context.editMessage);
					context.thumbnailsContainer.find('.edit-mode').hide();

					if (context.editFormActionTaken) {
						window.location = window.location;
					}
				}

				return false;
			});

			context.editForm.find('.done').on('click', function() {
				context.inEditMode = false;
				context.editForm.slideUp('fast');
				context.editMode.html(context.editMessage);
				context.thumbnailsContainer.find('.edit-mode').hide();

				if (context.editFormActionTaken) {
					window.location = window.location;
				}
			});

			context.thumbnailsContainer.on('change', '.edit-mode input[type="checkbox"]', function() {
				if ($(this).is(':checked')) {
					context.selectionCount++;
				} else {
					context.selectionCount--;
				}

				if (context.selectionCount == 1) {
					context.editModeMessage.html(context.selectedUserMessage.replace('{0}', '1'));
				} else {
					context.editModeMessage.html(context.selectedUsersMessage.replace('{0}', context.selectionCount));
				}

				if (context.selectionCount > 0) {
					context.editForm.find('.button:not(.done)').removeClass('disabled');
				} else {
					context.editForm.find('.button:not(.done)').addClass('disabled');
				}

			}).on('click', '.edit-mode input[type="checkbox"]', function() {
				event.stopPropagation();
			});

			context.editForm.find('.unfollow-all').on('click', function() {
				var b = $(this);
				if (context.selectionCount == 0 || !b.data('confirmation') || !global.confirm(b.data('confirmation'))) { return false; }

				$('.processing', context.editForm).css("visibility", "visible");
				context.editForm.find('.button').addClass('disabled');

				$.telligent.evolution.batch(function() {
					context.thumbnailsContainer.find('input[type="checkbox"]:checked').each(function() {
						var userId = $(this).parents('.content-item.thumbnail').data('userid');
						$.telligent.evolution.del({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{FollowerId}/following/{FollowingId}.json',
							data: {
								FollowerId: $.telligent.evolution.user.accessing.id,
								FollowingId: userId
								}
							});
					});
				})
					.then(function() {
						if (b.data('success')) { $.telligent.evolution.notifications.show(b.data('success'), { type: 'information' }); }
						context.editFormActionTaken = true;
						$('.processing', context.editForm).css("visibility", "hidden");
						context.editForm.find('.button').removeClass('disabled');
					}, function() {
						$('.processing', context.editForm).css("visibility", "hidden");
						context.editForm.find('.button').removeClass('disabled');
					});
			});

			context.editForm.find('.unfriend-all').on('click', function() {
				var b = $(this);
				if (context.selectionCount == 0 || !b.data('confirmation') || !global.confirm(b.data('confirmation'))) { return false; }

				$('.processing', context.editForm).css("visibility", "visible");
				context.editForm.find('.button').addClass('disabled');

				$.telligent.evolution.batch(function() {
					context.thumbnailsContainer.find('input[type="checkbox"]:checked').each(function() {
						var userId = $(this).parents('.content-item.thumbnail').data('userid');
						$.telligent.evolution.del({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{RequestorId}/friends/{RequesteeId}.json',
							data: {
								RequestorId: $.telligent.evolution.user.accessing.id,
								RequesteeId: userId
								}
							});
					});
				})
					.then(function() {
						if (b.data('success')) { $.telligent.evolution.notifications.show(b.data('success'), { type: 'information' }); }
						context.editFormActionTaken = true;
						$('.processing', context.editForm).css("visibility", "hidden");
						context.editForm.find('.button').removeClass('disabled');
					}, function() {
						$('.processing', context.editForm).css("visibility", "hidden");
						context.editForm.find('.button').removeClass('disabled');
					});
			});

			context.editForm.find('.follow-all').on('click', function() {
				var b = $(this);
				if (context.selectionCount == 0 || !b.data('confirmation') || !global.confirm(b.data('confirmation'))) { return false; }

				$('.processing', context.editForm).css("visibility", "visible");
				context.editForm.find('.button').addClass('disabled');

				$.telligent.evolution.batch(function() {
					context.thumbnailsContainer.find('input[type="checkbox"]:checked').each(function() {
						var userId = $(this).parents('.content-item.thumbnail').data('userid');
						$.telligent.evolution.post({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{FollowerId}/following.json',
							data: {
								FollowerId: $.telligent.evolution.user.accessing.id,
								FollowingId: userId
								}
							})
					});
				})
					.then(function() {
						if (b.data('success')) { $.telligent.evolution.notifications.show(b.data('success'), { type: 'information' }); }
						context.editFormActionTaken = true;
						$('.processing', context.editForm).css("visibility", "hidden");
						context.editForm.find('.button').removeClass('disabled');
					}, function() {
						$('.processing', context.editForm).css("visibility", "hidden");
						context.editForm.find('.button').removeClass('disabled');
					});
			});

			$.telligent.evolution.messaging.subscribe('ignoreUserRecommendation', function(data) {
				var e = $(data.target);
				var userId = e.data('userid');

				$.telligent.evolution.post({
	            	url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/user/recommendation/ignore/{UserId}.json',
	            	data: {
	            		UserId: userId
	            	},
	            	success: function(response) {
	                    context.thumbnailsContainer.find('.content-item[data-userid="' + userId + '"]').fadeOut('fast');
	                    $(document).trigger('click');
	                }
	            });
			});

			$.telligent.evolution.messaging.subscribe('search.registerFilters', function(data) {
				if (data.scope.key == 'anywhere') {
					data.register({
						name: context.searchFilterText,
						query: function(query, complete) {
							$.telligent.evolution.get({
								url: context.searchUrl,
								data: {
									w_query: query.query,
									w_pageIndex: query.pageIndex
								},
								success: function(response) {
									complete(response);
								}
							});
						},
						advancedSearchUrl: function(query) {
							return null;
						},
						isDefault: context.searchFilterDefault
					});
				}
			});
		}
	};



	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.friendshipList = api;

}(jQuery, window));
