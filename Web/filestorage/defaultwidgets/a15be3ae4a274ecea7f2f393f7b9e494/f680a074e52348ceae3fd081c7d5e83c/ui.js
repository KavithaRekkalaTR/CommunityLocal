(function ($, global) {

	function checkNoPages(context) {
		var list = $('ul.content-list', $.telligent.evolution.administration.panelWrapper());
		if (list.find('li').length == 0) {
			list.append('<div class="message norecords">' + context.resources.noResults + '</div>');
		}
	}

	var api = {
		register: function (options) {
			options.pagesList = $(options.pagesListId);
			options.query = '';

			$.telligent.evolution.messaging.subscribe('wikipage.filter', function(data){
				var filter = $(data.target).data('filter');
				options.filter = filter;
				options.pagesList.empty();
				$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
				options.scrollableResults.reset();
				$(data.target).closest('ul').children('li').removeClass('selected');
				$(data.target).parent().addClass('selected');
				$.telligent.evolution.administration.header();
			});

			$.telligent.evolution.messaging.subscribe('wikipage.publish', function(data){
				var pageId = $(data.target).data('wikipageid');
				var publish = $(data.target).data('publish');

				$.telligent.evolution.post({
					url: options.urls.publishPage,
					data: {
						PageId: pageId,
						Publish: publish
					}
				})
				.then(function() {
					if (publish == "True") {
						$(data.target).data('publish', 'False');
						$(data.target).text(options.resources.unpublish);

						$(data.target).closest('li.wikipage').find('li.attribute-item.status').children('span.value').text(options.resources.published);
						$(data.target).closest('li.wikipage').find('li.attribute-item.status').children('span.value').removeClass('highlight');
					}
					else {
						$(data.target).data("publish", "True");
						$(data.target).text(options.resources.publish);
						$(data.target).closest('li.wikipage').find('li.attribute-item.status').children('span.value').text(options.resources.unpublished);
						$(data.target).closest('li.wikipage').find('li.attribute-item.status').children('span.value').addClass('highlight');
					}
				});
			});

			$.telligent.evolution.messaging.subscribe('wikipage.delete', function(data){
				if (confirm(options.resources.confirmDelete)) {
					var pageId = $(data.target).data('wikipageid');
					var redirect = $(data.target).data('redirect');

					$.telligent.evolution.post({
						url: options.urls.deletePage,
						data: {
							PageId: pageId
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(options.resources.pageDeleted);

						var elm = $(data.target).closest('li.wikipage');
						elm.slideUp('fast', function() {
							elm.remove();
						});

						if (redirect == 'True') {
							window.location.href = options.urls.wiki;
						}
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('wikipage.lock', function(data){
				var pageId = $(data.target).data('wikipageid');
				var lock = $(data.target).data('lock');

				$.telligent.evolution.post({
					url: options.urls.lockPage,
					data: {
						PageId: pageId,
						Lock: lock
					}
				})
				.then(function() {
					if (lock == "True") {
						$(data.target).data('lock', 'False');
						$(data.target).text(options.resources.unlock);

						$(data.target).closest('li.wikipage').find('li.attribute-item.lock-status').children('span.value').text(options.resources.locked);
						$(data.target).closest('li.wikipage').find('li.attribute-item.lock-status').children('span.value').addClass('highlight');
					}
					else {
						$(data.target).data("lock", "True");
						$(data.target).text(options.resources.lock);
						$(data.target).closest('li.wikipage').find('li.attribute-item.lock-status').children('span.value').text('');
						$(data.target).closest('li.wikipage').find('li.attribute-item.lock-status').children('span.value').removeClass('highlight');
					}
				});
			});

			var listWrapper = $('ul.content-list', $.telligent.evolution.administration.panelWrapper());

			options.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: listWrapper,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: options.urls.pagedPages,
							data: {
								w_pageindex: pageIndex,
								w_filter: options.filter,
								w_query: options.query
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (items.length > 0) {
								listWrapper.append(items);
								if (r.data('hasmore') === true) {
									d.resolve();
								} else {
									d.reject();
								}
							} else {
								d.reject();
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});

			var header = $.telligent.evolution.administration.header();

			if (options.urls.addPage) {
				header.append('<fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="' + options.urls.addPage + '" class="button save">' + options.resources.addPage + '</a></span></li></ul></fieldset>');
			}

			var filters = $('<ul class="filter"></ul>');
			filters.append($('<li class="filter-option selected"><a href="#" data-messagename="wikipage.filter" data-filter="">' + options.resources.showall + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="wikipage.filter" data-filter="hidden">' + options.resources.showhidden + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="wikipage.filter" data-filter="unpublished">' + options.resources.showonlydeleted + '</a></li>'));
			header.append(filters);

			$.telligent.evolution.administration.header();

			$('input[type="text"]', $.telligent.evolution.administration.panelWrapper())
				.on('input', function() {
					var query = $(this).val();
					global.clearTimeout(options.queryTimeout);
					options.queryTimeout = global.setTimeout(function() {
						if (options.query != query) {
							options.query = query;
							options.pagesList.empty();
							$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
							options.scrollableResults.reset();
							$.telligent.evolution.administration.header();
						}
					}, 125);
				});

			checkNoPosts(options);
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.wikiPagesManagement = api;

})(jQuery, window);
