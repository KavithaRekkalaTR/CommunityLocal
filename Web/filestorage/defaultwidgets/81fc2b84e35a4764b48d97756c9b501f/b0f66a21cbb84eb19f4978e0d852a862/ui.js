(function ($, global) {

	function reloadList(context) {
		context.selectAll = false;
		context.selectMultiple = false;

		context.fields.list.empty();
		$('.message.norecords', context.wrapper).remove();
		context.scrollableResults.reset();
	}

	function checkNoArticles(context) {
		if (context.fields.list.find('li').length == 0) {
			context.fields.list.append('<div class="message norecords">' + context.text.noArticles + '</div>');
		}
	}

	function updateMultipleOptions(context) {
		if (context.selectMultiple) {
			context.fields.selectMultiple.hide();

			context.fields.list.addClass('select-multiple');
			var selectedCount;
			if (context.selectAll) {
				selectedCount = context.totalCount - $('input[type="checkbox"]:not(:checked)', context.fields.list).length;
			} else {
				selectedCount = $('input[type="checkbox"]:checked', context.fields.list).length;
			}

			if (context.filter.filter == 'drafted') {
				context.fields.publishMultiple.show();
			} else {
				context.fields.publishMultiple.hide();
			}

			if (context.filter.filter != 'deletedarticles' && context.filter.filter != 'drafted' && context.filter.filter != 'deleteddrafts') {
				context.fields.unpublishMultiple.show();
			} else {
				context.fields.unpublishMultiple.hide();
			}

			if (context.filter.filter != 'deletedarticles' && context.filter.filter != 'deleteddrafts') {
				context.fields.deleteMultiple.show();
				context.fields.undeleteMultiple.hide();
			} else {
				context.fields.deleteMultiple.hide();
				context.fields.undeleteMultiple.show();
			}

			if (selectedCount > 0) {
				context.fields.publishMultiple.removeClass('disabled').html(context.text.publishMultipleCount.replace(/\{0\}/g, selectedCount));
				context.fields.unpublishMultiple.removeClass('disabled').html(context.text.unpublishMultipleCount.replace(/\{0\}/g, selectedCount));
				context.fields.deleteMultiple.removeClass('disabled').html(context.text.deleteMultipleCount.replace(/\{0\}/g, selectedCount));
				context.fields.undeleteMultiple.removeClass('disabled').html(context.text.undeleteMultipleCount.replace(/\{0\}/g, selectedCount));
				context.fields.deselectMultiple.removeClass('disabled');
			} else {
				context.fields.publishMultiple.addClass('disabled').html(context.text.publishMultiple);
				context.fields.unpublishMultiple.addClass('disabled').html(context.text.unpublishMultiple);
				context.fields.deleteMultiple.addClass('disabled').html(context.text.deleteMultiple);
				context.fields.undeleteMultiple.addClass('disabled').html(context.text.undeleteMultiple);
				context.fields.deselectMultiple.addClass('disabled');
			}

			if (context.performingMultipleAction) {
				context.fields.publishMultiple.addClass('disabled');
				context.fields.unpublishMultiple.addClass('disabled');
				context.fields.deleteMultiple.addClass('disabled');
				context.fields.undeleteMultiple.addClass('disabled');
				context.fields.deselectMultiple.addClass('disabled')
			}

			context.fields.deselectMultiple.show();
			context.fields.cancelMultiple.show();
			context.fields.selectAllMultiple.show();
		} else {
			context.fields.list.removeClass('select-multiple');

			context.fields.selectMultiple.show();
			context.fields.publishMultiple.hide();
			context.fields.unpublishMultiple.hide();
			context.fields.deleteMultiple.hide();
			context.fields.undeleteMultiple.hide();
			context.fields.deselectMultiple.hide();
			context.fields.cancelMultiple.hide();
			context.fields.selectAllMultiple.hide();
		}

		$.telligent.evolution.administration.header();
	}

	function updateSortBy(context) {
		var sortBy = $('select.sort-field.sortby', context.wrapper);
		var originalValue = sortBy.val();
		var defaultValue = null;
		var resetValue = false;

		sortBy.children('option').each(function() {
			var o = $(this);
			if (o.data('filter').indexOf(context.filter.filter) >= 0) {
				if (!defaultValue) {
					defaultValue = o.attr('value');
				}
				o.show();
			} else {
				if (o.attr('value') == originalValue) {
					resetValue = true;
				}
				o.hide();
			}
		});

		if (resetValue && defaultValue) {
			sortBy.val(defaultValue);
		}
	}

	function performMultipleAction(context, action) {
		return $.Deferred(function(d) {
			if (context.selectAll) {
				var excluded = [];
				$('input[type="checkbox"]:not(:checked)', context.fields.list).each(function() {
				   var wrapper = $(this).closest('.content-item.article')
				   excluded.push(wrapper.data('articleid') + ':' + wrapper.data('version'));
				});

				context.bulkActionSubscriptionId = $.telligent.evolution.messaging.subscribe('articlemanagement.bulkactioncompleted', function(data) {
					$.telligent.evolution.messaging.unsubscribe(context.bulkActionSubscriptionId);
					context.bulkActionSubscriptionId = null;
					reloadList(context);
					d.resolve();

					if (data.affectedCurrentArticle) {
						global.location = context.urls.viewCollection;
					}
				});

				context.bulkActionFailedCallback = function(data) {
				  $.telligent.evolution.messaging.unsubscribe(context.bulkActionSubscriptionId);
				  context.bulkActionSubscriptionId = null;
				  d.reject();
				};

				$.telligent.evolution.administration.open({
					name: context.text.applyingChanges,
					content: $.telligent.evolution.post({
						url: context.urls.bulkChange,
						data: {
							queryText: context.filter.queryText,
							sortBy: context.filter.sortBy,
							sortOrder: context.filter.sortOrder,
							filter: context.filter.filter,
							isDefault: context.filter.isDefault,
							publishGroupId: context.filter.publishGroupId,
							categoryId: context.filter.categoryId,
							inCategory: context.filter.inCategory,
							except: excluded.join(';'),
							action: action,
							currentArticleId: context.currentArticleId
						}
					}),
					cssClass: 'article-management'
				});
			} else {
				var articles = $('input[type="checkbox"]:checked', context.fields.list);
				var i = -1, affectedCurrentArticle = false;

				if (articles <= 0) {
					d.resolve();
					return;
				}

				var getNextTask = function() {
					i++;
					if (i >= articles.length) {
						return null;
					}

					var wrapper = $(articles[i]).closest('.content-item.article');

					if (context.filter.filter != 'drafted' && context.filter.filter != 'deleteddrafts' && wrapper.data('articleid') == context.currentArticleId) {
						affectedCurrentArticle = true;
					}

					return $.Deferred(function(d) {
						$.telligent.evolution.post({
							url: context.urls.singleChange,
							data: {
								articleId: wrapper.data('articleid'),
								version: wrapper.data('version'),
								isVersion: context.filter.filter == 'drafted' || context.filter.filter == 'deleteddrafts' ? '1' : '0',
								action: action
							}
						})
							.then(function(r) {
								wrapper.slideUp('fast', function() {
									wrapper.remove();
									context.totalCount--;
									updateMultipleOptions(context);
									if (context.fields.list.children('.content-item').length == 0) {
										reloadList(context);
									}
								});
								d.resolve();
							})
							.catch(function() {
							   d.reject();
							});
					});
				}

				var count = 0;

				var doNext = function() {
					var task = getNextTask();
					if (!task) {
						context.selectAll = false;
						context.selectMultiple = false;
						updateMultipleOptions(context);
						d.resolve();

						if (affectedCurrentArticle) {
							global.location = context.urls.viewCollection;
						}
					} else {
						task
							.then(function() {
								doNext();
							})
							.catch(function() {
								d.reject();

								if (affectedCurrentArticle) {
									global.location = context.urls.viewCollection;
								}
							});
					}
				}

				doNext();
			}
		}).promise();
	}

	var api = {
		register: function (context) {
			$.telligent.evolution.administration.size('wide');

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();
			context.filter = {
				queryText: '',
				sortBy: 'LastUpdateDate',
				sortOrder: 'Descending',
				filter: (context.draftCount > 0 ? 'drafted' : 'published'),
				categoryId: '',
				inCategory: '',
				publishGroupId: ''
			};
			context.selectMultiple = false;
			context.selectAll = false;
			context.filter.publishGroupId = null;
			context.filter.categoryId = '';
			context.totalCount = parseInt(context.fields.list.data('totalcount'), 0);
			context.bulkActionSubscriptionId = null;
			context.bulkActionFailedCallback = null;

			$.telligent.evolution.messaging.subscribe('articlemanagement.delete', function(data){
				var target = $(data.target);
				if (confirm(context.text.deleteConfirm.replace(/\{0\}/g, target.data('title')))) {
					$.telligent.evolution.post({
						url: context.urls.singleChange,
						data: {
							articleId: target.data('articleid'),
							version: target.data('version'),
							isVersion: context.filter.filter == 'drafted' || context.filter.filter == 'deleteddrafts' ? '1' : '0',
							action: 'delete'
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(context.text.deleteSuccessful.replace(/\{0\}/g, target.data('title')));
						var wrapper = context.fields.list.find('.content-item[data-articleid="' + target.data('articleid') + '"]');
						wrapper.slideUp('fast', function() {
							wrapper.remove();
							context.totalCount--;
							updateMultipleOptions(context);
							if (context.fields.list.children('.content-item').length == 0) {
								reloadList(context);
							}
						});

						if (context.filter.filter != 'drafted' && wrapper.data('articleid') == context.currentArticleId) {
							global.location = context.urls.viewCollection;
						}
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('articlemanagement.undelete', function(data) {
				var target = $(data.target);
				if (confirm(context.text.undeleteConfirm.replace(/\{0\}/g, target.data('title')))) {
					$.telligent.evolution.post({
						url: context.urls.singleChange,
						data: {
							articleId: target.data('articleid'),
							version: target.data('version'),
							isVersion: context.filter.filter == 'drafted' || context.filter.filter == 'deleteddrafts' ? '1' : '0',
							action: 'undelete'
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(context.text.undeleteSuccessful.replace(/\{0\}/g, target.data('title')));
						var wrapper = context.fields.list.find('.content-item[data-articleid="' + target.data('articleid') + '"]');
						wrapper.slideUp('fast', function() {
							wrapper.remove();
							context.totalCount--;
							updateMultipleOptions(context);
							if (context.fields.list.children('.content-item').length == 0) {
								reloadList(context);
							}
						});
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('articlemanagement.publish', function(data) {
				var target = $(data.target);
				if (confirm(context.text.publishConfirm.replace(/\{0\}/g, target.data('title')))) {
					$.telligent.evolution.post({
						url: context.urls.singleChange,
						data: {
							articleId: target.data('articleid'),
							version: target.data('version'),
							isVersion: context.filter.filter == 'drafted' || context.filter.filter == 'deleteddrafts' ? '1' : '0',
							action: 'publish'
						}
					})
					.then(function(result) {
						if (result.warning) {
							$.telligent.evolution.notifications.show(result.warning);
							reloadList(context);
						} else {
							$.telligent.evolution.notifications.show(context.text.publishSuccessful.replace(/\{0\}/g, target.data('title')));
							var wrapper = context.fields.list.find('.content-item[data-articleid="' + target.data('articleid') + '"]');
							wrapper.slideUp('fast', function() {
								wrapper.remove();
								context.totalCount--;
								updateMultipleOptions(context);
								if (context.fields.list.children('.content-item').length == 0) {
									reloadList(context);
								}
							});
						}
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('articlemanagement.unpublish', function(data) {
				var target = $(data.target);
				if (confirm(context.text.unpublishConfirm.replace(/\{0\}/g, target.data('title')))) {
					$.telligent.evolution.post({
						url: context.urls.singleChange,
						data: {
							articleId: target.data('articleid'),
							version: target.data('version'),
							isVersion: context.filter.filter == 'drafted' || context.filter.filter == 'deleteddrafts' ? '1' : '0',
							action: 'unpublish'
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(context.text.unpublishSuccessful.replace(/\{0\}/g, target.data('title')));
						var wrapper = context.fields.list.find('.content-item[data-articleid="' + target.data('articleid') + '"]');
						wrapper.slideUp('fast', function() {
							wrapper.remove();
							context.totalCount--;
							updateMultipleOptions(context);
							if (context.fields.list.children('.content-item').length == 0) {
								reloadList(context);
							}
						});
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('articlemanagement.viewfeedback', function(data) {
				global.location.hash = context.urls.helpfulnessManagement + '&ArticleId=' + $(data.target).data('articleid');
			});

			context.publishGroupLookupTimeout = null;
			context.fields.publishGroup.glowLookUpTextBox({
				emptyHtml: context.text.publishGroupPlaceholder,
				minimumLookUpLength: 0,
				maxValues: 1,
				onGetLookUps: function (tb, searchText) {
					global.clearTimeout(context.publishGroupLookupTimeout);
					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
					context.publishGroupLookupTimeout = global.setTimeout(function () {
						$.telligent.evolution.post({
							url: context.urls.getPublishGroups,
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
									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noPublishGroupMatches, context.text.noPublishGroupMatches, false)]);
								}
							}
						});
					}, 500);
				},
				selectedLookUpsHtml: []
			})
				.on('glowLookUpTextBoxChange', function() {
					var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);
					if (publishGroup) {
						context.filter.publishGroupId = publishGroup.Value
					} else {
						context.filter.publishGroupId = '';
					}

					reloadList(context);
				});

			var filterPublishGroupId = $.telligent.evolution.url.hashData()["filter_publishgroupid"];
			if (filterPublishGroupId && filterPublishGroupId.length > 0) {
			    $('select.article-filter', context.wrapper).val('drafted');
			    context.filter.filter = 'drafted';
				context.filter.publishGroupId = filterPublishGroupId;

				var count = context.fields.publishGroup.glowLookUpTextBox('count');
				var i;
				for (i = 0; i < count; i++) {
					context.fields.publishGroup.glowLookUpTextBox('removeByIndex', 0);
				}

				context.fields.publishGroup.glowLookUpTextBox('add', context.fields.publishGroup.glowLookUpTextBox('createLookUp', filterPublishGroupId, '', '', true));

				$.telligent.evolution.post({
					url: context.urls.getPublishGroups,
					data: {
						query: filterPublishGroupId,
						articleCollectionId: context.collectionId
					},
					success: function (response) {
						if (response && response.matches.length > 0) {
						    var count = context.fields.publishGroup.glowLookUpTextBox('count');
            				var i;
            				for (i = 0; i < count; i++) {
            					context.fields.publishGroup.glowLookUpTextBox('removeByIndex', 0);
            				}

							context.fields.publishGroup.glowLookUpTextBox('add', context.fields.publishGroup.glowLookUpTextBox('createLookUp', response.matches[0].id, response.matches[0].name, response.matches[0].name, true));
						}
					}
				});
			}

			context.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.fields.list,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						var data = {
							w_pageindex: pageIndex,
							w_queryText: context.filter.queryText,
							w_sortBy: context.filter.sortBy,
							w_sortOrder: context.filter.sortOrder,
							w_filter: context.filter.filter,
							w_isDefault: context.filter.isDefault,
							w_selectall: context.selectAll ? '1' : '0',
							w_publishgroupid: context.filter.publishGroupId,
							w_incategory: context.filter.inCategory,
							w_categoryid: context.filter.categoryId
						};

						$.telligent.evolution.get({
							url: context.urls.getArticles,
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
								checkNoArticles(context);
								updateMultipleOptions(context);
								context.totalCount = parseInt(r.data('totalcount'), 0);
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});

			var headingTemplate = $.telligent.evolution.template.compile(context.templates.header);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.categoryLookupTimeout = null;
			context.fields.category.glowLookUpTextBox({
				emptyHtml: context.text.categoryPlaceholder,
				minimumLookUpLength: 0,
				maxValues: 1,
				onGetLookUps: function (tb, searchText) {
					global.clearTimeout(context.categoryLookupTimeout);
					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
					context.categoryLookupTimeout = global.setTimeout(function () {
						$.telligent.evolution.post({
							url: context.urls.getCategories,
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
									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noCategoryMatches, context.text.noCategoryMatches, false)]);
								}
							}
						});
					}, 500);
				},
				selectedLookUpsHtml: []
			})
				.on('glowLookUpTextBoxChange', function() {
					var category = context.fields.category.glowLookUpTextBox('getByIndex', 0);
					if (category) {
						if (category.Value == '') {
							context.filter.categoryId = '';
							context.filter.inCategory = 'false';
						} else {
							context.filter.categoryId = category.Value
							context.filter.inCategory = 'true';
						}
					} else {
						context.filter.categoryId = '';
						context.filter.inCategory = '';
					}

					reloadList(context);
				});

			context.fields.selectMultiple = $(context.fieldIds.selectMultiple);
			context.fields.publishMultiple = $(context.fieldIds.publishMultiple);
			context.fields.unpublishMultiple = $(context.fieldIds.unpublishMultiple);
			context.fields.deleteMultiple = $(context.fieldIds.deleteMultiple);
			context.fields.undeleteMultiple = $(context.fieldIds.undeleteMultiple);
			context.fields.deselectMultiple = $(context.fieldIds.deselectMultiple);
			context.fields.selectAllMultiple = $(context.fieldIds.selectAllMultiple);
			context.fields.cancelMultiple = $(context.fieldIds.cancelMultiple);

			updateMultipleOptions(context);

			context.fields.selectMultiple.on('click', function() {
				context.selectMultiple = true;
				updateMultipleOptions(context);
				return false;
			});

			context.fields.publishMultiple.on('click', function() {
				if (!context.fields.publishMultiple.hasClass('disabled') && global.confirm(context.text.publishMultipleConfirm)) {
					context.performingMultipleAction = true;
					updateMultipleOptions(context);
					performMultipleAction(context, 'publish')
						.then(function() {
						   $.telligent.evolution.notifications.show(context.text.publishMultipleSuccessful);
						})
						.always(function() {
							context.performingMultipleAction = false;
							updateMultipleOptions(context);
						});
				}
				return false;
			});

			context.fields.unpublishMultiple.on('click', function() {
				if (!context.fields.publishMultiple.hasClass('disabled') && global.confirm(context.text.unpublishMultipleConfirm)) {
					context.performingMultipleAction = true;
					updateMultipleOptions(context);
					performMultipleAction(context, 'unpublish')
						.then(function() {
						   $.telligent.evolution.notifications.show(context.text.unpublishMultipleSuccessful);
						})
						.always(function() {
							context.performingMultipleAction = false;
							updateMultipleOptions(context);
						});
				}
				return false;
			});

			context.fields.deleteMultiple.on('click', function() {
				if (!context.fields.publishMultiple.hasClass('disabled') && global.confirm(context.text.deleteMultipleConfirm)) {
					context.performingMultipleAction = true;
					updateMultipleOptions(context);
					performMultipleAction(context, 'delete')
						.then(function() {
						   $.telligent.evolution.notifications.show(context.text.deleteMultipleSuccessful);
						})
						.always(function() {
							context.performingMultipleAction = false;
							updateMultipleOptions(context);
						});
				}
				return false;
			});

			context.fields.undeleteMultiple.on('click', function() {
				if (!context.fields.publishMultiple.hasClass('disabled') && global.confirm(context.text.undeleteMultipleConfirm)) {
					context.performingMultipleAction = true;
					updateMultipleOptions(context);
					performMultipleAction(context, 'undelete')
						.then(function() {
						   $.telligent.evolution.notifications.show(context.text.undeleteMultipleSuccessful);
						})
						.always(function() {
							context.performingMultipleAction = false;
							updateMultipleOptions(context);
						});
				}
				return false;
			});

			context.fields.deselectMultiple.on('click', function() {
				$('input[type="checkbox"]:checked', context.fields.list).each(function() {
				   var c = $(this);
				   c.prop("checked", false);
				});
				context.selectAll = false;

				updateMultipleOptions(context);
				return false;
			});

			context.fields.selectAllMultiple.on('click', function() {
			   $('input[type="checkbox"]', context.fields.list).each(function() {
				   var c = $(this);
				   c.prop("checked", true);
				});
				context.selectAll = true;

				updateMultipleOptions(context);
				return false;
			});

			context.fields.cancelMultiple.on('click', function() {
				context.selectMultiple = false;
				updateMultipleOptions(context);
				return false;
			});

			context.fields.list.on('change', 'input[type="checkbox"]', function() {
			   updateMultipleOptions(context);
			});

			context.fields.list.on('click', 'input[type="checkbox"]', function(e) {
			   e.stopPropagation();
			});

			context.searchTimeout = null;
			$('input.search[type="text"]', context.wrapper)
				.on('input', function() {
					var queryText = $(this).val();
					global.clearTimeout(context.searchTimeout);
					context.searchTimeout = global.setTimeout(function() {
						if (queryText != context.filter.queryText) {
							context.filter.queryText = queryText;
							reloadList(context);
						}
					}, 500);
				});

			$('select.sort-field', context.wrapper)
				.on('change', function() {
					var sortBy = $('select.sortby', context.wrapper);
					var sortOrder = $('select.sortorder', context.wrapper);
					var filter = $('select.article-filter', context.wrapper);
					var defaultSelection = $('select.article-default', context.wrapper);

					context.filter.filter = filter.val();
					context.filter.isDefault = defaultSelection.val();
					updateSortBy(context);

					context.filter.sortBy = sortBy.val();
					context.filter.sortOrder = sortOrder.val();

					reloadList(context);
				});

			jQuery.telligent.evolution.administration.on('panel.shown', function() {
				if (context.bulkActionSubscriptionId && context.bulkActionFailedCallback) {
					context.bulkActionFailedCallback();
				}
			});

			updateSortBy(context);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articleManagement = api;

})(jQuery, window);