(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function showDeleteForm(context, achievementId, achievementTitle) {
		if (global.confirm(context.text.deleteConfirmation.replace(/\{0\}/g, achievementTitle))) {
			$.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/achievement/{AchievementId}.json',
				data: {
					AchievementId: achievementId
				}
			})
				.then(function() {
						$.telligent.evolution.notifications.show(context.text.deleteSuccessful.replace(/\{0\}/g, achievementTitle), {
							type: 'success'
						});
						refreshList(context, false);
					})
		}
	}

	function showAwardForm(context, achievementId, achievementTitle) {
		$.telligent.evolution.administration.open({
			name: context.text.awardAchievement.replace(/\{0\}/g, achievementTitle),
			cssClass: 'administer-achievements',
			content: $.telligent.evolution.get({
				url: context.urls.award,
				data: {
					w_achievementId: achievementId
				}
			})
		});
	}

	function showRevokeForm(context, achievementId, achievementTitle) {
		$.telligent.evolution.administration.open({
			name: context.text.revokeAchievement.replace(/\{0\}/g, achievementTitle),
			cssClass: 'administer-achievements',
			content: $.telligent.evolution.get({
				url: context.urls.revoke,
				data: {
					w_achievementId: achievementId
				}
			})
		});
	}

	function showEditForm(context, achievementId, achievementTitle) {
		$.telligent.evolution.administration.open({
			name: context.text.editAchievement.replace(/\{0\}/g, achievementTitle),
			cssClass: 'administer-achievements',
			content: $.telligent.evolution.get({
				url: context.urls.addedit,
				data: {
					w_achievementId: achievementId
				}
			})
		});
	}

	function showAddForm(context) {
		$.telligent.evolution.administration.open({
			name: context.text.addAchievement,
			cssClass: 'administer-achievements',
			content: $.telligent.evolution.get({
				url: context.urls.addedit
			})
		});
	}

	function refreshList(context, delay) {
		global.clearTimeout(context.refreshTimeout);

		if (delay === true) {
			context.refreshTimeout = global.setTimeout(function() {
				refreshList(context, false);
			}, 250);
		} else {
			context.achievementList.empty();
			context.fields.noResults.hide();
			context.achievementListScrollableResults.reset();
		}
	}

	$.telligent.evolution.widgets.administrationAchievements = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			$.telligent.evolution.messaging.subscribe('achievement.add', function (data) {
				showAddForm(context);
			});

			$.telligent.evolution.messaging.subscribe('achievement.delete', function (data) {
				var id = $(data.target).data('id');
				var title = $(data.target).data('title');
				showDeleteForm(context, id, title);
			});

			$.telligent.evolution.messaging.subscribe('achievement.edit', function (data) {
				var id = $(data.target).data('id');
				var title = $(data.target).data('title');
				showEditForm(context, id, title);
			});

			$.telligent.evolution.messaging.subscribe('achievement.award', function (data) {
				var id = $(data.target).data('id');
				var title = $(data.target).data('title');
				showAwardForm(context, id, title);
			});

			$.telligent.evolution.messaging.subscribe('achievement.revoke', function (data) {
				var id = $(data.target).data('id');
				var title = $(data.target).data('title');
				showRevokeForm(context, id, title);
			});

			$.telligent.evolution.messaging.subscribe('achievements.refresh', function (data) {
				refreshList(context, false);
			});

			context.achievementList = $('ul', context.wrapper);
			context.achievementListScrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.achievementList,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: context.urls.list,
							data: {
								w_pageindex: pageIndex
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (items.length > 0) {
								context.achievementList.append(items);
								if (r.data('hasmore') === true) {
									d.resolve();
								} else {
									d.reject();
								}
							} else {
								d.reject();
								if(pageIndex === 0) {
									context.fields.noResults.show();
								}
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});
		}
	};

}(jQuery, window));