(function ($, global) {
	function checkNoPosts(options) {
		var list = $('ul.content-list', $.telligent.evolution.administration.panelWrapper());
		if (list.find('li').length == 0) {
			list.append('<div class="message norecords">' + options.resources.noPosts + '</div>');
		}
	}

	var api = {
		register: function (options) {
			options.ideasList = $(options.ideasListId);
			options.queryText = '';

			$.telligent.evolution.messaging.subscribe('manageideas.filter', function(data){
				var filter = $(data.target).data('filter');
				options.filter = filter;
				options.ideasList.empty();
				$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
				options.scrollableResults.reset();
				$(data.target).closest('ul').children('li').removeClass('selected');
				$(data.target).parent().addClass('selected');
				$.telligent.evolution.administration.header();
			});

			$.telligent.evolution.messaging.subscribe('idea.delete', function(data){
				if (confirm(options.resources.confirmDelete)) {
					var id = $(data.target).data('id');
					var ideationId = $(data.target).data('ideationId');
					var redirect = $(data.target).data('redirect');

					$.telligent.evolution.post({
						url: options.urls.deleteIdea,
						data: {
							IdeationId: ideationId,
							IdeaId: id
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(options.resources.ideaDeleted);

						var elm = $(data.target).closest('li.idea');
						elm.slideUp('fast', function() {
							elm.remove();
						});

						if (redirect == 'True') {
							window.location.href = options.urls.ideation;
						}
					});
				}
			});

			var listWrapper = $('ul.content-list', $.telligent.evolution.administration.panelWrapper());

			options.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: listWrapper,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: options.urls.pagedIdeas,
							data: {
								w_pageindex: pageIndex,
								w_filter: options.filter,
								w_queryText: options.queryText,
								w_sortBy: options.sortBy,
								w_sortOrder: options.sortOrder
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
							if(pageIndex === 0) {
								checkNoPosts(options);
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});

			var header = $('<div></div>');

			if (options.urls.addFile != '') {
				header.append('<fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="' + options.urls.addIdea + '" class="button save">' + options.resources.addIdea + '</a></span></li></ul></fieldset>');
			}

			var filters = $('<ul class="filter"></ul>');
			filters.append($('<li class="filter-option selected"><a href="#" data-messagename="manageideas.filter" data-filter="">' + options.resources.showAll + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="manageideas.filter" data-filter="open">' + options.resources.showOpen + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="manageideas.filter" data-filter="closed">' + options.resources.showClosed + '</a></li>'));
			header.append(filters);

			$.telligent.evolution.administration.header(header);

			$('input[type="text"]', $.telligent.evolution.administration.panelWrapper())
				.on('input', function() {
					var queryText = $(this).val();
					global.clearTimeout(options.searchTimeout);
					options.searchTimeout = global.setTimeout(function() {
						if (queryText != options.queryText) {
							options.queryText = queryText;
							options.ideasList.empty();
							$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
							options.scrollableResults.reset();
						}
					}, 125);
				});

			$('select.sort-field', $.telligent.evolution.administration.panelWrapper())
				.on('change', function() {
					var sortBy = $('select.sortby');
					var sortOrder = $('select.sortorder');
					options.sortBy = sortBy.val();
					options.sortOrder = sortOrder.val();
					options.ideasList.empty();
					$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
					options.scrollableResults.reset();
				});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.ideaManagement = api;

})(jQuery, window);
