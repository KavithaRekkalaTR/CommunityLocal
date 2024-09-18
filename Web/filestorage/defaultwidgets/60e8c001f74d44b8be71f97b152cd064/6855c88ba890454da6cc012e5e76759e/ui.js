(function ($, global) {

	function checkNoResults(options) {
		if (options.list.find('li').length == 0) {
			if (options.list.find('.norecords').length == 0) {
				options.list.append('<div class="message norecords">' + options.text.noPublishGroups + '</div>');
			}
		} else {
			$('.message.norecords', options.wrapper).remove();
		}
	}

	function getPagedPublishGroups(options, pageIndex) {
		var filter = options.filter;
		return $.Deferred(function (d) {
			$.telligent.evolution.get({
				url: options.urls.pagedPublishGroups,
				data: {
					w_pageindex: pageIndex,
					w_filter: options.filter,
					w_query: options.query
				}
			})
			.then(function (response) {
				if (filter != options.filter) {
					d.reject();
					return;
				}
				var r = $(response);
				var items = $('li.content-item', r);
				if (items.length > 0) {
					options.list.append(items);
					if (r.data('hasmore') === true) {
						d.resolve();
					} else {
						d.reject();
					}
				} else {
					d.reject();
				}
				checkNoResults(options);
			})
			.catch(function () {
				d.reject();
			});
		});
	}

	function selectFilter(options, filter, query, forceReload) {
		filter = filter === null ? options.filter : filter;
		query = query === null ? options.query : query;
		if (options.query != query || options.filter != filter || forceReload === true) {
			options.query = query;
			options.filter = filter;
			options.list.empty();
			options.scrollableList.reset();
			$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
		}
	}

	function showAddPublishGroup(options) {
		$.telligent.evolution.administration.open({
			name: options.text.addPublishGroup,
			content: $.telligent.evolution.post({
				url: options.urls.addEditPublishGroup
			}),
			cssClass: 'createedit-publishgroup'
		});
	}

	function showEditPublishGroup(options, publishGroupId, name) {
		$.telligent.evolution.administration.open({
			name: options.text.editPublishGroup.replace(/\{0\}/g, name),
			content: $.telligent.evolution.post({
				url: options.urls.addEditPublishGroup,
				data: {
					id: publishGroupId
				}
			}),
			cssClass: 'createedit-publishgroup'
		});
	}

	function showPublishUnpublishPublishGroup(options, publishGroupId, name, publish) {
		if (window.confirm(publish ? options.text.publishPublishGroupConfirmation.replace(/\{0\}/g, name) : options.text.unpublishPublishGroupConfirmation.replace(/\{0\}/g, name))) {
			$.telligent.evolution.administration.open({
				name: publish ? options.text.publishPublishGroup.replace(/\{0\}/g, name) : options.text.unpublishPublishGroup.replace(/\{0\}/g, name),
				content: $.telligent.evolution.post({
					url: options.urls.publishUnpublishPublishGroup,
					data: {
						id: publishGroupId,
						publish: publish
					}
				}),
				cssClass: 'publishunpublish-publishgroup'
			});
		}
	}

	var api = {
		register: function (options) {

			options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);
			options.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(options.templates.header);
			options.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			options.filter = 'active';
			options.list = $('.content-list', options.wrapper);
			options.scrollableList = $.telligent.evolution.administration.scrollable({
				target: options.list,
				load: function (pageIndex) {
					return getPagedPublishGroups(options, pageIndex);
				}
			});

			$.telligent.evolution.messaging.subscribe('publishgroups.add', function(data) {
			   showAddPublishGroup(options);
			});

			$.telligent.evolution.messaging.subscribe('publishgroups.edit', function(data) {
			   showEditPublishGroup(options, $(data.target).data('publishgroupid'), $(data.target).data('publishgroupname'));
			});

			$.telligent.evolution.messaging.subscribe('publishgroups.publish', function(data) {
				showPublishUnpublishPublishGroup(options, $(data.target).data('publishgroupid'), $(data.target).data('publishgroupname'), true);
			});

			$.telligent.evolution.messaging.subscribe('publishgroups.unpublish', function(data) {
				showPublishUnpublishPublishGroup(options, $(data.target).data('publishgroupid'), $(data.target).data('publishgroupname'), false);
			});

			$.telligent.evolution.messaging.subscribe('publishgroups.delete', function(data) {
				if (window.confirm(options.text.deleteConfirmation.replace(/\{0\}/g, $(data.target).data('publishgroupname')))) {
					$.telligent.evolution.del({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/publishgroup/{PublishGroupId}.json',
						data: {
							PublishGroupId: $(data.target).data('publishgroupid')
						}
					})
						.then(function() {
							$.telligent.evolution.notifications.show(options.text.deleteSuccessful, { type: 'success' });
							var parent = $(data.target).closest('li.content-item');
							parent.slideUp('fast', function() {
							   parent.remove();
							   if (options.list.children().length == 0) {
								   selectFilter(options, options.filter, null, true);
							   }
							});
						});
				}
			});

			$.telligent.evolution.messaging.subscribe('publishgroups.undelete', function(data) {
				if (window.confirm(options.text.undeleteConfirmation.replace(/\{0\}/g, $(data.target).data('publishgroupname')))) {
					$.telligent.evolution.post({
						url: options.urls.undeletePublishGroup,
						data: {
							id: $(data.target).data('publishgroupid')
						}
					})
						.then(function() {
							$.telligent.evolution.notifications.show(options.text.undeleteSuccessful, { type: 'success' });
							var parent = $(data.target).closest('li.content-item');
							parent.slideUp('fast', function() {
							   parent.remove();
							   if (options.list.children().length == 0) {
								   selectFilter(options, options.filter, null, true);
							   }
							});
						});
				}
			});

			options.fields.filter.on('change', function() {
				selectFilter(options, options.fields.filter.val(), null, true);
			});

			options.fields.find.on('input', function() {
				var query = $(this).val();
				global.clearTimeout(options.queryTimeout);
				options.queryTimeout = global.setTimeout(function() {
					selectFilter(options, null, query, false);
				}, 250);
			});

			$.telligent.evolution.messaging.subscribe('publishgroups.saved', function() {
			   selectFilter(options, null, null, true);
			});

			selectFilter(options, options.filter);
			checkNoResults(options);
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articlePublishGroupManagement = api;

})(jQuery, window);