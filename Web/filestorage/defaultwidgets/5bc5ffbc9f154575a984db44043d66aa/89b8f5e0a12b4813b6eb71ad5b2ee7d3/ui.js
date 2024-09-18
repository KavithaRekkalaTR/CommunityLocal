(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function showDeleteForm(context, pointFactorId, pointFactorTitle) {
		if (global.confirm(context.text.deleteConfirmation.replace(/\{0\}/g, pointFactorTitle))) {
			$.telligent.evolution.post({
				url: context.urls.delete,
				data: {
					PointFactorId: pointFactorId
				}
			})
				.done(function() {
						$.telligent.evolution.notifications.show(context.text.deleteSuccessful.replace(/\{0\}/g, pointFactorTitle), {
							type: 'success'
						});

						refreshList(context, false);
					})
		}
	}

	function showEditForm(context, pointFactorId, pointFactorTitle) {
		$.telligent.evolution.administration.open({
			name: context.text.editPointFactor.replace(/\{0\}/g, pointFactorTitle),
			cssClass: 'administer-pointfactors',
			content: $.telligent.evolution.get({
				url: context.urls.addedit,
				data: {
					w_pointFactorId: pointFactorId
				}
			})
		});
	}

	function showAddForm(context) {
		$.telligent.evolution.administration.open({
			name: context.text.addPointFactor,
			cssClass: 'administer-pointfactors',
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
			context.pointFactorList.empty();
			context.fields.noResults.hide();
			context.pointFactorListScrollableResults.reset();
		}
	}

	$.telligent.evolution.widgets.administrationPointFactors = {
		register: function(context) {
			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			$.telligent.evolution.messaging.subscribe('pointFactors.add', function (data) {
				showAddForm(context);
			});

			$.telligent.evolution.messaging.subscribe('pointFactors.delete', function (data) {
				var id = $(data.target).data('id');
				var title = $(data.target).data('title');
				showDeleteForm(context, id, title);
			});

			$.telligent.evolution.messaging.subscribe('pointFactors.edit', function (data) {
				var id = $(data.target).data('id');
				var title = $(data.target).data('title');
				showEditForm(context, id, title);
			});

			$.telligent.evolution.messaging.subscribe('pointFactors.refresh', function (data) {
				refreshList(context, false);
			});

			$.telligent.evolution.messaging.subscribe('entity.updated', function(d) {
				if (d && d.entity == 'PointFactor') {
					context.shouldRefresh = true;
				}
			});
			$.telligent.evolution.messaging.subscribe('entity.deleted', function(d) {
				if (d && d.entity == 'PointFactor') {
					context.shouldRefresh = true;
				}
			});
			$.telligent.evolution.administration.on('panel.shown', function(){
				if (context.shouldRefresh) {
					context.shouldRefresh = false;
					refreshList(context, false);
				}
			});

			context.pointFactorList = $('ul', context.wrapper);
			context.pointFactorListScrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.pointFactorList,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: context.urls.list,
							data: {
								w_pageindex: pageIndex
							}
						})
						.done(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (items.length > 0) {
								context.pointFactorList.append(items);
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
						.fail(function () {
							d.reject();
						});
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('administeruser.addremovepoints', function (data) {
				$.telligent.evolution.administration.open({
					name: context.text.addremovepoints,
					cssClass: 'administer-user',
					content: $.telligent.evolution.get({
						url: context.urls.addremovepoints
					})
				});
				return false;
			});
		}
	};

}(jQuery, window));