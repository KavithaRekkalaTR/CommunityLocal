(function ($, global) {

	function reloadList(context) {
		context.selectAll = false;
		context.selectMultiple = false;

		context.fields.list.empty();
		$('.message.norecords', context.wrapper).remove();
		context.scrollableResults.reset();
	}

	function checkNoHelpfulness(context) {
		if (context.fields.list.find('li').length == 0) {
			context.fields.list.append('<div class="message norecords">' + context.text.noHelpfulness + '</div>');
		}
	}

	var api = {
		register: function (context) {
			$.telligent.evolution.administration.size('wide');

			context.wrapper = $.telligent.evolution.administration.panelWrapper();
			context.filter = {
				sortOrder: 'descending',
				filter: 'Unresolved',
				articleId: '',
				responseTypeId: ''
			};

			if (context.articleId) 
				context.filter.articleId = context.articleId;

			$.telligent.evolution.messaging.subscribe('helpfulnessmanagement.ignore', function(data){
				var e = $(data.target);

				$.telligent.evolution.put({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/helpfulness/{Id}.json',
					data: {
						Id: e.data('id'),
						Ignore: !e.data('ignored')
					}
				})
					.then(function() {
						var wrapper = e.closest('.content-item.helpfulness');

					   e.data('ignored', !e.data('ignored')).html(e.data('ignored') ? context.text.unignore : context.text.ignore);
					   if (e.data('ignored')) {
						   wrapper.find('.status.unresolved').removeClass('unresolved').addClass('ignored').html(context.text.statusIgnored);
					   } else {
						   wrapper.find('.status.ignored').removeClass('ignored').addClass('unresolved').html(context.text.statusUnresolved);
					   }

					   if (context.filter.filter != 'All') {
							wrapper.slideUp('fast', function() {
								wrapper.remove();
								if (context.fields.list.children('.content-item').length == 0) {
									reloadList(context);
								}
							});
					   }
					});
			});

			context.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.fields.list,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						var data = {
							w_pageindex: pageIndex,
							w_sortOrder: context.filter.sortOrder,
							w_filter: context.filter.filter,
							w_selectall: context.selectAll ? '1' : '0',
							w_articleid: context.filter.articleId,
							w_responsetypeid: context.filter.responseTypeId
						};

						$.telligent.evolution.get({
							url: context.urls.getHelpfulness,
							data: data
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (items.length > 0) {
								context.fields.list.append(items);
								if (r.data('hasmore') === true) {
									d.resolve();
								} else {
									d.reject();
								}
							} else {
								d.reject();
							}
							if(pageIndex === 0) {
								checkNoHelpfulness(context);
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});

			context.articleLookupTimeout = null;
			context.fields.article.glowLookUpTextBox({
				emptyHtml: context.text.articlePlaceholder,
				minimumLookUpLength: 0,
				maxValues: 1,
				onGetLookUps: function (tb, searchText) {
					global.clearTimeout(context.articleLookupTimeout);
					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
					context.articleLookupTimeout = global.setTimeout(function () {
						$.telligent.evolution.post({
							url: context.urls.getArticles,
							data: {
								query: searchText,
								articleCollectionId: context.collectionId
							},
							success: function (response) {
								if (response && response.matches.length > 0) {
									var suggestions = [];
									for (var i = 0; i < response.matches.length; i++) {
										suggestions.push(tb.glowLookUpTextBox('createLookUp', response.matches[i].id, response.matches[i].name, response.matches[i].name, true));
									}
									tb.glowLookUpTextBox('updateSuggestions', suggestions);
								} else {
									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noArticleMatches, context.text.noArticleMatches, false)]);
								}
							}
						});
					}, 500);
				},
				selectedLookUpsHtml: []
			})
				.on('glowLookUpTextBoxChange', function() {
					var article = context.fields.article.glowLookUpTextBox('getByIndex', 0);
					if (article) {
						context.filter.articleId = article.Value;
					} else {
						context.filter.articleId = '';
					}

					reloadList(context);
				});

			if (context.articleId) {
				var initialLookupValue = context.fields.article.glowLookUpTextBox('createLookUp', context.articleId, context.articleName, context.articleName, true);
				context.fields.article.glowLookUpTextBox('add', initialLookupValue);
			}

			context.fields.list.on('change', 'input[type="checkbox"]', function() {
			   updateMultipleOptions(context);
			});

			context.fields.list.on('click', 'input[type="checkbox"]', function(e) {
			   e.stopPropagation();
			});

			$('select.sort-field', context.wrapper)
				.on('change', function() {
					var sortOrder = $('select.sortorder', context.wrapper);
					var filter = $('select.helpfulness-filter', context.wrapper);
					var responseType = $('select.helpfulness-responsetype', context.wrapper);

					context.filter.filter = filter.val();
					context.filter.sortOrder = sortOrder.val();
					context.filter.responseTypeId = responseType.val();

					reloadList(context);
				});

			var h = $.telligent.evolution.url.hashData();
			if (h.ArticleId) {
				$.telligent.evolution.post({
					url: context.urls.getArticles,
					data: {
						query: h.ArticleId,
						articleCollectionId: context.collectionId
					},
					success: function (response) {
						if (response && response.matches.length == 1) {
							if (context.fields.article.glowLookUpTextBox('count') > 0) {
								context.fields.article.glowLookUpTextBox('removeByIndex', 0);
							}
							context.fields.article.glowLookUpTextBox('add', context.fields.article.glowLookUpTextBox('createLookUp', response.matches[0].id, response.matches[0].name, response.matches[0].name, true));
							context.filter.articleId = response.matches[0].id;
							reloadList(context);
						}
					}
				});
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articleHelpfulnessManagement = api;

})(jQuery, window);