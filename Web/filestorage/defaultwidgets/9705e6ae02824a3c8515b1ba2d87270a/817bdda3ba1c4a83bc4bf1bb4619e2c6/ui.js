(function($, global, undef) {
	var spinner = '<span class="ui-loading" width="48" height="48"></span>';
	var reset = false;

	var updateCsvEnablement = function(context) {
		if (context.filter == 'article' && context.fields.articleSelector.glowLookUpTextBox('getByIndex', 0) == null) {
			$('a.button.download-csv').attr("disabled", "disabled");
		}
		else {
			$('a.button.download-csv').removeAttr("disabled");
		}
	}

	var updateSubscribers = function(context) {
		if (context.filter == '') {
			context.data = {
				w_applicationId: context.applicationId,
				w_username: $('.filter-username').val()
			};
			reset = true;
		}
		else if (context.fields.articleSelector.glowLookUpTextBox('getByIndex', 0) != null) {
			context.data = {
				w_articleId: context.fields.articleSelector.glowLookUpTextBox('getByIndex', 0).Value,
				w_typeId: $('.filter-subscription-type').val(),
				w_username: $('.filter-username').val()
			};
			reset = true;
		}
		else {
			context.data = {
			};
			reset = false;
		}

		context.subscribersList.empty();
		$('.subscriber-total', context.wrapper).empty();

		if (reset) {
			$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).hide();
			context.scrollableResults.reset();
		}
		else {
			$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).show();
		}

		//TODO:  Update CSV URL
	};

	var api = {
		register: function(context) {
			context.wrapper = $.telligent.evolution.administration.panelWrapper();
			context.fields.articleSelector = $('.filter-article', context.wrapper);

			if(context.headerTemplateId) {
				var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
				$.telligent.evolution.administration.header(headingTemplate());
			}

			if (context.filter == "article") {
				$('.filter-option.articles').addClass('selected');
				$('.filter-option.collection').removeClass('selected');
				$('.field-item.article-filter').show();
			}
			else {
				$('.filter-option.articles').removeClass('selected');
				$('.filter-option.collection').addClass('selected');
				$('.field-item.article-filter').hide();
			}

			context.fields.articleSelector.glowLookUpTextBox({
				delimiter: ',',
				allowDuplicates: true,
				maxValues: 1,
				onGetLookUps: function(textbox, searchText) {
					if(searchText && searchText.length >= 1) {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
						]);
						currentSearchText = searchText;

						$.telligent.evolution.get({
							url: context.urls.findArticlesUrl,
							data: {
								w_query: searchText,
								w_collectionId: context.applicationId
							},
							success: function(response) {
								if (searchText != currentSearchText) {
									return;
								}

								var hasResults = false;
								if (response && response.matches && response.matches.length >= 1) {
									textbox.glowLookUpTextBox('updateSuggestions',
										$.map(response.matches, function(result, i) {
											try
											{
												lookup = textbox.glowLookUpTextBox(
													'createLookUp',
													result.id,
													result.label,
													result.label,
													true);

												hasResults = true;
												return lookup;
											} catch (e) {}
										}));
								}

								if (!hasResults) {
									textbox.glowLookUpTextBox('updateSuggestions', [
										textbox.glowLookUpTextBox('createLookUp', '', context.text.noMatches, context.text.noMatches, false)
									]);
								}
							}
						});
					}
				},
				emptyHtml: context.text.lookupPlaceholder,
				selectedLookUpsHtml: [],
				deleteImageUrl: ''
			})
			.on('glowLookUpTextBoxChange', function(){
				updateCsvEnablement(context);
				updateSubscribers(context);
			});

			if (context.articleName) {
				var initialLookupValue = context.fields.articleSelector.glowLookUpTextBox('createLookUp',
					context.articleId,
					context.articleName,
					context.articleName,
					true);

				context.data.w_articleId = context.articleId;
				context.data.w_articleName = context.articleName;
				context.fields.articleSelector.glowLookUpTextBox('add', initialLookupValue);
			}

			$.telligent.evolution.messaging.subscribe('contextualArticleSubscribers.filter', function(data){
				var filter = $(data.target).data('filter');
				context.filter = filter;

				updateCsvEnablement(context);

				$(data.target).closest('ul').children('li').removeClass('selected');
				$(data.target).parent().addClass('selected');

				if (filter == '') {
					$('.field-item.article-filter').hide();
				}
				else {
					$('.field-item.article-filter').show();
				}

				updateSubscribers(context);
				$.telligent.evolution.administration.header();
			});

			if ($.telligent.evolution.url.hashData().typeId) {
				$('.filter-subscription-type').val($.telligent.evolution.url.hashData().typeId);
				context.data.w_typeId = $.telligent.evolution.url.hashData().typeId;
			}

			context.subscribersList = $(context.fields.subscribersList);
			context.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.subscribersList,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						var data = context.data;
						data .w_pageindex = pageIndex;

						$.telligent.evolution.get({
							url: context.urls.pagedSubscribers,
							data: data
						})
						.then(function (response) {
							var r = $(response);

							var total = $('div.subscriber-total', r);
							$('div.subscriber-total', context.wrapper).replaceWith(total);

							var items = $('li.content-item', r);
							if (items.length > 0) {
								context.subscribersList.append(items);
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

			$('.filter-subscription-type').on('change', function() {
				updateSubscribers(context);
			});

			$('.filter-username').on('input propertychange paste', function() {
				updateSubscribers(context);
			});

			$('a.button.download-csv').on('click', function() {
				if($('a.button.download-csv').attr("disabled") == "disabled")
					return false;
				else {
					var query = "";
					if (context.data.w_username) {
						query += "&usernameSearch=" + encodeURIComponent(context.data.w_username);
					}
					if (context.data.w_applicationId) {
						query += "&applicationId=" + encodeURIComponent(context.data.w_applicationId);
					}
					if (context.data.w_articleId) {
						query += "&articleId=" + encodeURIComponent(context.data.w_articleId);
					}
					if (context.data.w_typeId) {
						query += "&typeId=" + encodeURIComponent(context.data.w_typeId);
					}

					window.location.href = context.urls.csvBaseUrl + query;
					return false;
				}
			});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articleSubscribersApplicationPanel = api;

})(jQuery, window);