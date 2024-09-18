(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var context = null;
	var headerWrapper = null;
	var spinner = '<span class="ui-loading" width="48" height="48"></span>';
	var currentSearchText = '';

	var ItemsLoader = function(context, filterOptions) {
		var appeals = {
			pendingItems: [],
			hasMore: true,
			pageIndex: -1
		}, reviewables = {
			pendingItems: [],
			hasMore: true,
			pageIndex: -1
		};
		var pageSize = 20;

		function ensureListsArePopulated() {
			return $.Deferred(function(d) {
				var whens = [];
				if (appeals.pendingItems >= 20 || appeals.hasMore) {
					whens.push($.Deferred(function(d2) {
						appeals.pageIndex++;
						$.telligent.evolution.get({
							url: context.urls.listAppeals,
							data: {
								w_pageindex: appeals.pageIndex,
								w_sort: filterOptions.sort,
								w_sortorder: filterOptions.sortOrder,
								w_age: filterOptions.age,
								w_state: filterOptions.state,
								w_containerid: filterOptions.containerId,
								w_containertypeid: filterOptions.containerTypeId,
								w_applicationid: filterOptions.applicationId,
								w_applicationtypeid: filterOptions.applicationTypeId,
								w_authorid: filterOptions.authorId,
								w_contenttypeid: filterOptions.contentTypeId
							}
						})
							.then(function(response) {
								if (response.content && response.content.length > 0) {
									for(var i = 0; i < response.content.length; i++) {
										appeals.pendingItems.push(response.content[i]);
									}
									appeals.hasMore = response.hasMore;
								} else {
									appeals.hasMore = false;
								}
								d2.resolve();
							})
							.catch(function() {
								d2.reject();
							});
					}));
				}
				if (reviewables.pendingItems >= 20 || reviewables.hasMore) {
					whens.push(new $.Deferred(function(d2) {
						reviewables.pageIndex++;
						$.telligent.evolution.get({
							url: context.urls.listReviewables,
							data: {
								w_pageindex: reviewables.pageIndex,
								w_sort: filterOptions.sort,
								w_sortorder: filterOptions.sortOrder,
								w_age: filterOptions.age,
								w_state: filterOptions.state,
								w_containerid: filterOptions.containerId,
								w_containertypeid: filterOptions.containerTypeId,
								w_applicationid: filterOptions.applicationId,
								w_applicationtypeid: filterOptions.applicationTypeId,
								w_authorid: filterOptions.authorId,
								w_contenttypeid: filterOptions.contentTypeId
							}
						})
							.then(function(response) {
								if (response.content && response.content.length > 0) {
									for(var i = 0; i < response.content.length; i++) {
										reviewables.pendingItems.push(response.content[i]);
									}
									reviewables.hasMore = response.hasMore;
								} else {
									reviewables.hasMore = false;
								}
								d2.resolve();
							})
							.catch(function() {
								d2.reject();
							});
					}));
				}

				$.when.apply($, whens)
					.then(function() {
						d.resolve();
					})
					.catch(function() {
						d.reject();
					});
			});
		}

		return {
			list: function() {
				return $.Deferred(function(d) {
					ensureListsArePopulated()
						.then(function() {

							var content = [];
							for (var i = 0; i < pageSize && (appeals.pendingItems.length > 0 || reviewables.pendingItems.length > 0); i++) {
								if (appeals.pendingItems.length > 0 && reviewables.pendingItems.length > 0) {
									if ((filterOptions.sortOrder == 'Ascending' && appeals.pendingItems[0].order < reviewables.pendingItems[0].order)
										|| (filterOptions.sortOrder == 'Descending' && appeals.pendingItems[0].order > reviewables.pendingItems[0].order)) {
										content.push(appeals.pendingItems.shift().html);
									} else {
										content.push(reviewables.pendingItems.shift().html);
									}
								} else if (appeals.pendingItems.length > 0) {
									content.push(appeals.pendingItems.shift().html);
								} else {
									content.push(reviewables.pendingItems.shift().html);
								}
							}

							d.resolve({
								content: content,
								hasMore: appeals.pendingItems.length > 0 || reviewables.pendingItems.length > 0 || appeals.hasMore || reviewables.hasMore
							});
						})
						.catch(function() {
							d.reject();
						});
				});
			}
		};
	};

	var AppealService = (function(){
		var updateAppeal = function(appealId, reason, state, complete) {
			return $.telligent.evolution.put({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/abuseappeals/{AppealId}.json',
				data: {
					AppealId: appealId,
					BoardResponse: reason,
					AppealState: state
				}
			})
		};
		return {
			accept: function(appealId, response) {
				return updateAppeal(appealId, response, 'Accepted');
			},
			reject: function(appealId, response) {
				return updateAppeal(appealId, response, 'Rejected');
			}
		}
	})();

	function hideContentTabs(wrapper) {
		wrapper.find('.content-tab').hide();
	}

	function showContentTab(wrapper, tabLink, tabContentWrapper) {
		wrapper.find('.filter-option.selected').removeClass('selected');
		tabLink.parent().addClass('selected');
		tabContentWrapper.show();
		tabLink.closest('.moderated-content').addClass('expanded');
	}

	function throttle(handler) {
		if (!window.requestAnimationFrame)
			return handler;
		var timeout;
		return function () {
			if (timeout)
				window.cancelAnimationFrame(timeout);
			timeout = window.requestAnimationFrame(handler);
		};
	}

	function updateFilterSelector() {
		var filter = context.wrapper.find('.filter-selector'),
			instructions = context.wrapper.find('.instructions');

		filter.children().hide();
		filter.children('.' + context.list.filter).show();
		instructions.children().hide();
		instructions.children('.' + context.list.filter).show();

		context.list.state = filter.find('.' + context.list.filter + ' [data-parameter="state"]').val();
		context.list.age = filter.find('.' + context.list.filter + ' [data-parameter="age"]').val();
		context.list.sort = filter.find('.' + context.list.filter + ' [data-parameter="sort"]').val();
		context.list.sortOrder = filter.find('.' + context.list.filter + ' [data-parameter="sortorder"]').val();
		context.list.contentTypeId = filter.find('.' + context.list.filter + ' [data-parameter="contenttype"]').val();

		context.list.containerId = null;
		context.list.containerTypeId = null;
		context.list.applicationId = null;
		context.list.applicationTypeId = null;
		context.list.authorId = null;

		var c = context.appOrGroupSelector.glowLookUpTextBox('getByIndex', 0);
		if (c && c.Value) {
			var cc = c.Value.split(/:/);
			if (cc.length == 3 && cc[0] == 'c') {
				context.list.containerTypeId = cc[1];
				context.list.containerId = cc[2];
			} else if (cc.length == 3 && cc[0] == 'a') {
				context.list.applicationTypeId = cc[1];
				context.list.applicationId = cc[2];
			}
		}

		c = context.authorSelector.glowLookUpTextBox('getByIndex', 0);
		if (c && c.Value) {
			context.list.authorId = c.Value;
		}

		context.listItemsLoader = new ItemsLoader(context, context.list);
		resetScrollable(context);
	}

	function updateHeader() {
		headerWrapper.empty();

		headerWrapper.append(
			$('<ul class="filter"></ul>')
				.append(
					$('<li class="filter-option to-review selected"></li>')
						.addClass(context.filter == 'to-review' ? 'selected' : '')
						.append(
							$('<a href="#" class="to-review" data-filter="to-review"></a>')
								.text(context.text.awaitingReview)
								.on('click', function() {
									if (context.list.filter != 'to-review') {
										context.list.filter = 'to-review';
										$('.filter-option', headerWrapper).removeClass('selected');
										$(this).parent().addClass('selected');
										var filter = context.wrapper.find('.filter-selector');
										context.list.state = filter.find('.' + context.list.filter + ' [data-parameter="state"]').val('AllActionRequired');
										context.list.sort = filter.find('.' + context.list.filter + ' [data-parameter="sort"]').val('AppealDate');
										context.list.sortOrder = filter.find('.' + context.list.filter + ' [data-parameter="sortorder"]').val('Ascending');
									}
									updateFilterSelector(context);
									return false;
								})
							)
				)
				.append(
					$('<li class="filter-option possible"></li>')
						.addClass(context.filter == 'possible' ? 'selected' : '')
						.append(
							$('<a href="#" class="possible" data-filter="possible"></a>')
								.text(context.text.possiblyAbusive)
								.on('click', function() {
									if (context.list.filter != 'possible') {
										context.list.filter = 'possible';
										$('.filter-option', headerWrapper).removeClass('selected');
										$(this).parent().addClass('selected');
										var filter = context.wrapper.find('.filter-selector');
										context.list.state = filter.find('.' + context.list.filter + ' [data-parameter="state"]').val('Reported');
										context.list.sort = filter.find('.' + context.list.filter + ' [data-parameter="sort"]').val('Certainty');
										context.list.sortOrder = filter.find('.' + context.list.filter + ' [data-parameter="sortorder"]').val('Descending');
									}
									updateFilterSelector(context);
									return false;
								})
							)
				)
				.append(
					$('<li class="filter-option in-process"></li>')
						.addClass(context.filter == 'in-process' ? 'selected' : '')
						.append(
							$('<a href="#" class="in-process" data-filter="in-process"></a>')
								.text(context.text.inAbuseProcess)
								.on('click', function() {
									if (context.list.filter != 'in-process') {
										context.list.filter = 'in-process';
										$('.filter-option', headerWrapper).removeClass('selected');
										$(this).parent().addClass('selected');
										var filter = context.wrapper.find('.filter-selector');
										context.list.state = filter.find('.' + context.list.filter + ' [data-parameter="state"]').val('Initiated');
										context.list.sort = filter.find('.' + context.list.filter + ' [data-parameter="sort"]').val('LastUpdatedDate');
										context.list.sortOrder = filter.find('.' + context.list.filter + ' [data-parameter="sortorder"]').val('Descending');
									}
									updateFilterSelector(context);
									return false;
								})
							)
				)
		);

		$.telligent.evolution.administration.header();
	}

	function resetScrollable() {
		if (context.list.scrollable) {
			context.contentList.empty();
			context.list.scrollable.reset();
			return;
		}

		context.list.scrollable = $.telligent.evolution.administration.scrollable({
			target: context.contentList,
			load: function(pageIndex) {
				return $.Deferred(function(d) {
					context.listItemsLoader.list()
					.then(function(response) {
						if (response.content.length > 0) {
							if (pageIndex == 0) {
								context.contentList.html('<ul class="content-list moderation"></ul>');
							}

							$.each(response.content, function(i, c) {
								var content = $(c);
								processDynamicFormsInContent(content);
								context.contentList.children('ul').append(content);
								adjustCollapseExpand(content);
							});

							if (response.hasMore) {
								d.resolve();
							} else {
								d.reject();
							}
						} else {
							if (pageIndex == 0) {
								context.contentList.html(context.text.noListItems);
							}
							d.reject();
						}
					})
					.catch(function() {
						d.reject();
					});
				});
			}
		});
	}

	function adjustCollapseExpand(content) {
		var contentWrapper = content.is('.moderated-content') ? content : content.find('.moderated-content');
		if (!contentWrapper.hasClass('expanded')) {
			var height = 0;
			contentWrapper.find('.content-tab').each(function() {
				var elm = $(this);
				if (elm.is(':visible')) {
					height = Math.max($(this).height(), height);
				}
			});
			if (height < 300) {
				contentWrapper.addClass('short');
				if (contentWrapper.find('img, video, object').length > 0) {
					global.setTimeout(function() {
						if ($.contains(document, content[0])) {
							adjustCollapseExpand(content);
						}
					}, 1000);
				}
			} else {
				contentWrapper.removeClass('short');
			}
		}
	}

	function processDynamicFormsInContent(content) {
		var dynamicFormTabs = content.find('.content-tab.dynamic-form');
		if (dynamicFormTabs.length > 0) {
			var filters = content.find('ul.filter').first();
			var lastFilterTab = null;

			dynamicFormTabs.each(function() {
				var dynamicFormTab = $(this);
				var tabLabel = dynamicFormTab.find('h3.dynamic-form');
				var tab = $('<li class="filter-option dynamic-form"></li>')
					.append($('<a href="#"></a>')
						.data('groupid', dynamicFormTab.data('groupid'))
						.html(tabLabel.html())
						);

				if (lastFilterTab) {
					tab.insertAfter(lastFilterTab);
					lastFilterTab = tab;
					dynamicFormTab.hide();
				} else {
					filters.prepend(tab);
					lastFilterTab = tab;
					tab.addClass('selected');
				}

				tabLabel.remove();
			});
		}
	}

	function attachFilterHandlers() {
		context.wrapper.on('change', '.filter-selector select', function() {
			updateFilterSelector(context);
		});

		context.appOrGroupSelector.glowLookUpTextBox({
				delimiter: ',',
				allowDuplicates: true,
				maxValues: 1,
				onGetLookUps: function(textbox, searchText) {
					if(searchText && searchText.length >= 2) {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
						]);
						currentSearchText = searchText;

						$.telligent.evolution.get({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/search.json',
							data: {
								Query: 'title:"' + searchText.replace(/"/g, '') + '" && (isapplication:true || iscontainer:true)',
								IncludeFields: 'IsApplication,IsContainer,Title,Application,Container,Content'
							},
							success: function(response) {
								if (searchText != currentSearchText) {
									return;
								}

								var hasResults = false;
								if (response && response.SearchResults.length >= 1) {
									textbox.glowLookUpTextBox('updateSuggestions',
										$.map(response.SearchResults, function(result, i) {
											try
											{
												var lookup = null;
												if (result.IsContainer) {
													lookup = textbox.glowLookUpTextBox(
														'createLookUp',
														'c:' + result.Content.Application.Container.ContainerTypeId + ":" + result.Content.Application.Container.ContainerId,
														context.text.selectedContainer.replace('{0}', result.Title),
														context.text.container.replace('{0}', result.Title),
														true);
												} else if (result.IsApplication) {
													lookup = textbox.glowLookUpTextBox(
														'createLookUp',
														'a:' + result.Content.Application.ApplicationTypeId + ":" + result.Content.Application.ApplicationId,
														context.text.selectedApplication.replace('{0}', result.Title),
														context.text.application.replace('{0}', result.Title).replace('{1}', result.Content.Application.Container.HtmlName),
														true);
												}
												if (lookup) {
													hasResults = true;
													return lookup;
												}
											} catch (e) {}
										}));
								}

								if (!hasResults) {
									textbox.glowLookUpTextBox('updateSuggestions', [
										textbox.glowLookUpTextBox('createLookUp', '', context.text.noAppOrGroupMatches, context.text.noAppOrGroupMatches, false)
									]);
								}
							}
						});
					}
				},
				emptyHtml: context.text.appOrGroupPlaceholder,
				selectedLookUpsHtml: [],
				deleteImageUrl: ''
			})
			.on('glowLookUpTextBoxChange', function(){
				updateFilterSelector(context);
			});

			context.authorSelector.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(textbox, searchText) {
						if(searchText && searchText.length >= 2) {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
							]);
							currentSearchText = searchText;

							$.telligent.evolution.get({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/search.json',
								data: {
									Query: 'title:"' + searchText.replace(/"/g, '') + '" && (type:user)',
									IncludeFields: 'Title,ContentId,Users,Username'
								},
								success: function(response) {
									if (searchText != currentSearchText) {
										return;
									}

									var hasResults = false;
									if (response && response.SearchResults.length >= 1) {
										textbox.glowLookUpTextBox('updateSuggestions',
											$.map(response.SearchResults, function(result, i) {
												try
												{
													var displayName = result.Title;
													var userName = result.Users[0].Username;

													if (displayName != userName) {
														lookup = textbox.glowLookUpTextBox(
															'createLookUp',
															result.Users[0].ContentId,
															context.text.selectedAuthorWithUsername.replace('{0}', displayName).replace('{1}', userName),
															context.text.authorWithUsername.replace('{0}', displayName).replace('{1}', userName),
															true);
													} else {
														lookup = textbox.glowLookUpTextBox(
															'createLookUp',
															result.Users[0].ContentId,
															context.text.selectedAuthor.replace('{0}', displayName),
															context.text.author.replace('{0}', displayName),
															true);

													}

													hasResults = true;
													return lookup;
												} catch (e) {}
											}));
									}

									if (!hasResults) {
										textbox.glowLookUpTextBox('updateSuggestions', [
											textbox.glowLookUpTextBox('createLookUp', '', context.text.noAuthorMatches, context.text.noAuthorMatches, false)
										]);
									}
								}
							});
						}
					},
					emptyHtml: context.text.authorPlaceholder,
					selectedLookUpsHtml: [],
					deleteImageUrl: ''
				})
				.on('glowLookUpTextBoxChange', function(){
					updateFilterSelector(context);
				});
	}

	function showReports(wrapper, contentId, appealId) {
		var pageIndex = 0;
		wrapper.html($('<span class="ui-loading"></span>'));

		function loadPage(pageIndex) {
			$.telligent.evolution.get({
				url: context.urls.listReports,
				data: {
					w_contentid: contentId,
					w_appealid: appealId,
					w_pageindex: pageIndex
				}
			})
				.then(function(response) {
					var r = $(response);
					wrapper.html(r);

					if (pageIndex > 0 || r.data('hasmore') === true) {
						var pager = $('<div class="report-pager"></div>');

						if (pageIndex > 0) {
							pager.append(
								$('<a href="#" class="inline-button"></a>')
									.html(context.text.previous)
									.on('click', function() {
										loadPage(pageIndex - 1);
										return false;
									})
							);
						}

						if (r.data('hasmore') === true) {
							pager.append(
								$('<a href="#" class="inline-button"></a>')
									.html(context.text.next)
									.on('click', function() {
										loadPage(pageIndex + 1);
										return false;
									})
							);
						}

						wrapper.append(pager);
					}
				});
		}

		loadPage(0);
	}

	function showHistory(wrapper, reviewableContentId)
	{
		wrapper.html($('<span class="ui-loading"></span>'));

		$.telligent.evolution.post({
			url: context.urls.listHistory,
			data: {
				ReviewableContentId: reviewableContentId
			}
		})
			.then(function(response) {
				wrapper.html(response);
			});
	}

	function showAppeal(appealId) {
		$.telligent.evolution.administration.open({
			cssClass: 'moderation',
			name: context.text.reviewAppeal,
			content: $.telligent.evolution.get({
				url: context.urls.get,
				data: {
					w_appealid: appealId
				}
			}),
			loaded: function() {
				wrapper = $.telligent.evolution.administration.panelWrapper();
				registerContentHandlers(wrapper, true);
			}
		});
	}

	function showAuthor(wrapper, contentId, contentTypeId, appealId, userId) {
		wrapper.html($('<span class="ui-loading"></span>'));
		$.telligent.evolution.get({
			url: context.urls.getAuthorDetails,
			data: {
				w_contentid: contentId,
				w_contenttypeid: contentTypeId,
				w_appealid: appealId,
				w_authorid: userId
			}
		})
			.then(function(r) {
				wrapper.html(r);
			})
	}

	function showTextContent(wrapper, contentId, contentTypeId, appealId) {
		wrapper.html($('<span class="ui-loading"></span>'));
		$.telligent.evolution.get({
			url: context.urls.getText,
			data: {
				w_contentid: contentId,
				w_contenttypeid: contentTypeId,
				w_appealid: appealId
			}
		})
			.then(function(r) {
				wrapper.html(r);
			})
	}

	function showFileContent(wrapper, contentId, contentTypeId, appealId) {
		wrapper.html($('<span class="ui-loading"></span>'));
		$.telligent.evolution.get({
			url: context.urls.getFiles,
			data: {
				w_contentid: contentId,
				w_contenttypeid: contentTypeId,
				w_appealid: appealId
			}
		})
			.then(function(r) {
				wrapper.html(r);
			})
	}

	function registerContentHandlers(wrapper, isSingleContentRendering) {
		wrapper.on('click', '.moderated-content-header a.reject',function(e){
			e.preventDefault();
			var b = $(this);
			if (!b.hasClass('disabled')) {
				b.addClass('disabled');
				var content = b.closest('li.content-item');
				closeAcceptDenyForm(content, true);
				saveEdits(content)
					.then(function() {
						if (content.is('.appeal')) {
							AppealService.reject(content.data('appealid'), '')
								.then(function() {
									if (isSingleContentRendering) {
										context.reload = true;
										$.telligent.evolution.administration.close();
									} else {
										content.slideUp('fast', function() {
											content.remove();
										});
									}
								})
								.catch(function() {
									b.removeClass('disabled');
								});
						} else if (content.is('.reviewable-content')) {
							acceptDenyReviewableContent(content, b, '', 'Deny');
						}
					})
					.catch(function() {
						b.removeClass('disabled');
					});
			}
		});

		wrapper.on('click', '.moderated-content-header a.accept',function(e){
			e.preventDefault();
			var b = $(this);
			if (!b.hasClass('disabled')) {
				b.addClass('disabled');
				var content = b.closest('li.content-item');
				closeAcceptDenyForm(content, true);
				saveEdits(content)
					.then(function() {
						if (content.is('.appeal')) {
							AppealService.accept(content.data('appealid'), '')
								.then(function() {
									if (isSingleContentRendering) {
										context.reload = true;
										$.telligent.evolution.administration.close();
									} else {
										content.slideUp('fast', function() {
											content.remove();
										});
									}
								})
								.catch(function() {
									b.removeClass('disabled');
								})
						} else if (content.is('.reviewable-content')) {
							acceptDenyReviewableContent(content, b, '', 'Approve');
						}
					})
					.catch(function() {
						b.removeClass('disabled');
					});
			}
		});

		wrapper.on('click', '.moderated-content-header a.respond', function(e) {
            e.preventDefault();
            var b = $(this);
            var contentWrapper = b.closest('li.content-item');
            var formWrapper = contentWrapper.find('.moderated-content-approvedeny-wrapper');

            contentWrapper.find('.moderated-content-header a.accept, .moderated-content-header a.reject').addClass('disabled');
            formWrapper.slideDown();
            context.wrapper.animate({
                scrollTop: (formWrapper.offset().top - contentWrapper.parent().offset().top + contentWrapper.find('.moderated-content-header').height()) + 'px'
            });
            b.hide();
		});

		wrapper.on('click', '.moderated-content-header a.publish',function(e){
			e.preventDefault();
			var b = $(this);
			if (!b.hasClass('disabled') && global.confirm(context.text.publishConfirmation)) {
				b.addClass('disabled');
				var content = b.closest('li.content-item');
				closeAcceptDenyForm(content, true);
				saveEdits(content)
					.then(function() {
						$.telligent.evolution.post({
							url: context.urls.publishReviewableContent,
							data: {
								ReviewableContentId: content.data('reviewablecontentid')
							}
						})
							.then(function() {
							   if (isSingleContentRendering) {
									context.reload = true;
									$.telligent.evolution.administration.close();
								} else {
									content.slideUp('fast', function() {
										content.remove();
									});
								}
								$.telligent.evolution.administration.refreshBadges();
							})
							.catch (function() {
							   b.removeClass('disabled');
							});
					})
					.catch(function() {
						b.removeClass('disabled');
					});
			}
		});

		wrapper.on('click', '.reviewable-content .moderated-content-header a.delete',function(e){
			e.preventDefault();
			var b = $(this);
			if (!b.hasClass('disabled') && global.confirm(context.text.deleteConfirmation)) {
				b.addClass('disabled');
				var content = b.closest('li.content-item');
				closeAcceptDenyForm(content, true);
				saveEdits(content)
					.then(function() {
						$.telligent.evolution.post({
							url: context.urls.deleteReviewableContent,
							data: {
								ReviewableContentId: content.data('reviewablecontentid')
							}
						})
							.then(function() {
							   if (isSingleContentRendering) {
									context.reload = true;
									$.telligent.evolution.administration.close();
								} else {
									content.slideUp('fast', function() {
										content.remove();
									});
								}
								$.telligent.evolution.administration.refreshBadges();
							})
							.catch (function() {
							   b.removeClass('disabled');
							});
					})
					.catch(function() {
						b.removeClass('disabled');
					});
			}
		});

		var closeAcceptDenyForm = function(contentWrapper, isReopening) {
			var scrollTop = context.wrapper.scrollTop();
			if (contentWrapper.is('.appeal')) {
                contentWrapper.find('.moderated-content-header a.accept, .moderated-content-header a.reject').removeClass('disabled');
                contentWrapper.find('.moderated-content-approvedeny-wrapper').slideUp();
                contentWrapper.find('.moderated-content-header a.respond').show();
            } else if (contentWrapper.is('.reviewable-content')) {
        		if (isReopening === true) {
    				contentWrapper.find('.moderated-content-approvedeny-wrapper').hide();
    			} else {
    				contentWrapper.find('.moderated-content-approvedeny-wrapper').slideUp();
    			}
    			var acceptButton = contentWrapper.find('.moderated-content-header .button.accept');
    			if (acceptButton.is('.inprocess-disabled')) {
    				acceptButton.removeClass('disabled').removeClass('inprocess-disabled');
    			}
    			var rejectButton = contentWrapper.find('.moderated-content-header .button.reject');
    			if (rejectButton.is('.inprocess-disabled')) {
    				rejectButton.removeClass('disabled').removeClass('inprocess-disabled');
    			}
            }
			if (isReopening === true) {
				context.wrapper.scrollTop(scrollTop);
			} else {
				context.wrapper.animate({
					scrollTop: scrollTop
				});
			}
		}

		var acceptDenyReviewableContent = function(contentWrapper, button, formData, approveDeny) {
			$.telligent.evolution.post({
				url: context.urls.approveDenyReviewableContent,
				data: {
					ReviewableContentId: contentWrapper.data('reviewablecontentid'),
					ApproveDeny: approveDeny,
					FormData: formData
				}
			})
				.then(function(response) {
				   if (response.success) {
					   if (isSingleContentRendering) {
							context.reload = true;
							$.telligent.evolution.administration.close();
						} else {
						   contentWrapper.slideUp('fast', function() {
								contentWrapper.remove();
							});
						}
				   } else if (response.formHtml && response.formId) {
					   button.addClass('inprocess-disabled');
					   var formWrapper = contentWrapper.find('.moderated-content-approvedeny-wrapper');
					   var message = '';
					   if (approveDeny == 'Approve') {
						   message = context.text.approveFormInstructions;
						   formWrapper.find('.button.accept').show();
							formWrapper.find('.button.reject').hide();
					   } else if (approveDeny == 'Deny') {
						   message = context.text.denyFormInstructions;
						   formWrapper.find('.button.accept').hide();
						   formWrapper.find('.button.reject').show();
					   }

					   formWrapper.find('.moderated-content-approvedeny-form').html(response.formHtml).data('formid', response.formId);
					   formWrapper.find('.moderated-content-approvedeny-instructions').html(message);
					   formWrapper.slideDown();

					   context.wrapper.animate({
						   scrollTop: (formWrapper.offset().top - contentWrapper.parent().offset().top + contentWrapper.find('.moderated-content-header').height()) + 'px'
					   });
				   }
				   $.telligent.evolution.administration.refreshBadges();
				})
				.catch(function() {
					button.removeClass('disabled');
				});
		}

		wrapper.on('click', '.moderated-content-approvedeny-wrapper a.accept', function(e) {
			e.preventDefault();
			var b = $(this);
			if (!b.hasClass('disabled')) {
				b.addClass('disabled');
				var contentWrapper = b.closest('li.content-item');
				if (contentWrapper.is('.appeal')) {
				       AppealService.accept(contentWrapper.data('appealid'), contentWrapper.find('.moderated-content-approvedeny-wrapper textarea').val())
    						.then(function() {
    							if (isSingleContentRendering) {
    								context.reload = true;
    								$.telligent.evolution.administration.close();
    							} else {
    								contentWrapper.slideUp('fast', function() {
    									contentWrapper.remove();
    								});
    							}
    						})
    						.catch(function() {
    							b.removeClass('disabled');
    						})
				} else if (contentWrapper.is('.reviewable-content')) {
    				var formId = contentWrapper.find('.moderated-content-approvedeny-form').data('formid');
    				var formData = $.telligent.evolution.url.serializeQuery($('#' + formId).dynamicForm('getValues') || {});
    				acceptDenyReviewableContent(contentWrapper, b, formData, 'Approve');
				}
			}
		});

		wrapper.on('click', '.moderated-content-approvedeny-wrapper a.reject', function(e) {
			e.preventDefault();
			var b = $(this);
			if (!b.hasClass('disabled')) {
				b.addClass('disabled');
				var contentWrapper = b.closest('li.content-item');
				if (contentWrapper.is('.appeal')) {
				       AppealService.reject(contentWrapper.data('appealid'), contentWrapper.find('.moderated-content-approvedeny-wrapper textarea').val())
    						.then(function() {
    							if (isSingleContentRendering) {
    								context.reload = true;
    								$.telligent.evolution.administration.close();
    							} else {
    								contentWrapper.slideUp('fast', function() {
    									contentWrapper.remove();
    								});
    							}
    						})
    						.catch(function() {
    							b.removeClass('disabled');
    						})
				} else if (contentWrapper.is('.reviewable-content')) {
    				var formId = contentWrapper.find('.moderated-content-approvedeny-form').data('formid');
    				var formData = $.telligent.evolution.url.serializeQuery($('#' + formId).dynamicForm('getValues') || {});
    				acceptDenyReviewableContent(contentWrapper, b, formData, 'Deny');
				}
			}
		});

		wrapper.on('click', '.moderated-content-approvedeny-wrapper a.cancel', function(e) {
		    var contentWrapper = $(this).closest('li.content-item');
			closeAcceptDenyForm(contentWrapper);
			e.preventDefault();
		});

		wrapper.on('click', '.moderated-content-header a.initiate-appeal', function(e) {
			e.preventDefault();
			var b = $(this);
			if (!b.hasClass('disabled')) {
				b.addClass('disabled');
				var contentId = b.data('contentid');
				var contentTypeId = b.data('contenttypeid');
				var li = b.parents('li.abusive-content')
				$.telligent.evolution.post({
					url: context.urls.confirmReport,
					data: { ContentId: contentId, ContentTypeId: contentTypeId }
				})
					.then(function(response) {
						if(response.success) {
							if (isSingleContentRendering) {
								context.reload = true;
								$.telligent.evolution.administration.close();
							} else {
								li.slideUp('fast', function() {
									li.remove();
								});
							}
						}
						$.telligent.evolution.administration.refreshBadges();
					})
					.catch(function() {
						b.removeClass('disabled');
					})
			}
		});

		wrapper.on('click', '.moderated-content-header a.ignore', function(e) {
			e.preventDefault();
			var b = $(this);
			if (!b.hasClass('disabled')) {
				b.addClass('disabled');
				var contentId = b.data('contentid');
				var contentTypeId = b.data('contenttypeid');
				var li = b.parents('li.abusive-content')
				$.telligent.evolution.post({
					url: context.urls.ignoreReport,
					data: { ContentId: contentId, ContentTypeId: contentTypeId }
				})
					.then(function(response) {
						if(response.success) {
							if (isSingleContentRendering) {
								context.reload = true;
								$.telligent.evolution.administration.close();
							} else {
								li.slideUp('fast', function() {
									li.remove();
								});
							}
						}
						$.telligent.evolution.administration.refreshBadges();
					})
					.catch(function() {
						b.removeClass('disabled');
					});
			}
		});

		wrapper.on('click', '.moderated-content-viewall a.view-all',function(e){
			e.preventDefault();
			$(this).closest('.moderated-content').addClass('expanded');
		});

		var saveEdits = function(contentWrapper) {
			return $.Deferred(function(d) {
				var b = contentWrapper.find('.moderated-content-header a.save');
				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					var reviewableContentId = contentWrapper.data('reviewablecontentid');
					if (!reviewableContentId) {
						b.removeClass('disabled');
						d.resolve();
					} else {
						var isReadOnly = (contentWrapper.data('isreadonly') == '1');
						if (!isReadOnly) {
							var data = $('#reviewable_' + reviewableContentId).dynamicForm('getValues') || {};

							$.telligent.evolution.post({
								url: context.urls.saveReviewableContent,
								data: {
									ReviewableContentId: reviewableContentId,
									FormData: $.telligent.evolution.url.serializeQuery(data)
								}
							})
								.then(function(response) {
									b.removeClass('disabled');
									toggleReadOnly(contentWrapper);
									$.telligent.evolution.administration.refreshBadges();
									d.resolve();
								})
								.catch(function() {
									b.removeClass('disabled');
								   d.reject();
								});
						} else {
							b.removeClass('disabled');
							d.resolve();
						}
					}
				} else {
					d.resolve();
				}
			}).promise();
		}

		var toggleReadOnly = function(contentWrapper) {
			var b = contentWrapper.find('a.edit').first();
			if (!b.hasClass('disabled')) {
				b.addClass('disabled');
				var reviewableContentId = contentWrapper.data('reviewablecontentid');
				var isReadOnly = !(contentWrapper.data('isreadonly') == '1');
				$.telligent.evolution.post({
					url: context.urls.getReviewableContent,
					data: {
						ReviewableContentId: reviewableContentId,
						ReadOnly: isReadOnly
					}
				})
					.then(function(response) {
						var content = $(response);
						processDynamicFormsInContent(content);
						contentWrapper.find('.moderated-content').replaceWith(content);
						contentWrapper.find('.moderated-content').addClass('expanded');
						b.removeClass('disabled');
						if (isReadOnly) {
							contentWrapper.data('isreadonly', '1');
							b.html(context.text.edit);
							contentWrapper.find('a.save').first().hide();
						} else {
							contentWrapper.data('isreadonly', '0');
							b.html(context.text.cancelEditing);
							contentWrapper.find('a.save').first().show();
						}
					})
					.catch(function() {
					   b.removeClass('disabled');
					});
			}
		}

		wrapper.on('click', '.moderated-content-header a.edit', function(e) {
			e.preventDefault();
			toggleReadOnly($(this).parents('li.content-item').first());
		});

		wrapper.on('click', '.moderated-content-header a.save', function(e) {
			e.preventDefault();
			saveEdits($(this).closest('li.content-item'));
		});

		wrapper.on('click', '.moderated-content-header a.preview', function(e) {
			e.preventDefault();
			var content = $(this).closest('li.content-item');
			var data = null;
			if (content.is('.appeal') || content.is('.abusive-content')) {
				data = {
					w_type: 'content',
					w_contentid: content.data('contentid'),
					w_contenttypeid: content.data('contenttypeid')
				};
			} else if (content.is('.reviewable-content')) {
				// reviewable content
				data = {
					w_type: 'reviewablecontent',
					w_reviewablecontentid: content.data('reviewablecontentid')
				};
			}

			if (data != null) {
				$.telligent.evolution.administration.open({
					name: context.text.previewTitle,
					content: $.telligent.evolution.get({
						url: context.urls.preview,
						data: data
					}),
					cssClass: 'moderation'
				});
			}
		});

		wrapper.on('click', '.filter-option.reports a', function(e) {
			var link = $(this);
			var contentId = link.data('contentid');
			var appealId = link.data('appealid');
			var content = link.parents('.content-item').find('.moderated-content');

			var reportsWrapper = content.find('.content-tab.reports');
			showReports(reportsWrapper, contentId, appealId);
			hideContentTabs(content);
			showContentTab(content, link, reportsWrapper)

			return false;
		});

		wrapper.on('click', '.filter-option.history a', function(e) {
			var link = $(this);
			var wrapper = link.closest('.content-item');
			var content = wrapper.find('.moderated-content');
			var reviewableContentId = wrapper.data('reviewablecontentid');

			var historyWrapper = content.find('.content-tab.history');
			showHistory(historyWrapper, reviewableContentId);
			hideContentTabs(content);
			showContentTab(content, link, historyWrapper)

			return false;
		});

		wrapper.on('click', '.filter-option.author a', function(e) {
			var link = $(this);
			var contentId = link.data('contentid');
			var contentTypeId = link.data('contenttypeid');
			var appealId = link.data('appealid');
			var userId = link.data('userid');

			var content = link.parents('.content-item').find('.moderated-content');
			var authorWrapper = content.find('.content-tab.author');
			showAuthor(authorWrapper, contentId, contentTypeId, appealId, userId);
			hideContentTabs(content);
			showContentTab(content, link, authorWrapper);

			return false;
		});

		wrapper.on('click', '.filter-option.textcontent a', function(e) {
			var link = $(this);
			var contentId = link.data('contentid');
			var contentTypeId = link.data('contenttypeid');
			var appealId = link.data('appealid');

			var content = link.parents('.content-item').find('.moderated-content');
			var textContentWrapper = content.find('.content-tab.textcontent');
			showTextContent(textContentWrapper, contentId, contentTypeId, appealId);
			hideContentTabs(content);
			showContentTab(content, link, textContentWrapper);

			return false;
		});

		wrapper.on('click', '.filter-option.filecontent a', function(e) {
			var link = $(this);
			var contentId = link.data('contentid');
			var contentTypeId = link.data('contenttypeid');
			var appealId = link.data('appealid');

			var content = link.parents('.content-item').find('.moderated-content');
			var fileContentWrapper = content.find('.content-tab.filecontent');
			showFileContent(fileContentWrapper, contentId, contentTypeId, appealId);
			hideContentTabs(content);
			showContentTab(content, link, fileContentWrapper);

			return false;
		});

		wrapper.on('click', '.filter-option.content a', function(e) {
			var link = $(this);
			var content = link.parents('.content-item').find('.moderated-content');

			hideContentTabs(content);
			showContentTab(content, link, content.find('.content-tab.content'));

			return false;
		});

		wrapper.on('click', '.filter-option.dynamic-form a', function() {
			var link = $(this);
			var content = link.parents('.content-item').find('.moderated-content');

			hideContentTabs(content);
			showContentTab(content, link, content.find('.content-tab.dynamic-form[data-groupid="' + link.data('groupid') + '"]'));

			return false;
		});
	}

	$.telligent.evolution.widgets.appealQueue = {
		register: function(parentContext) {
			context = parentContext;

			headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();



			 $.telligent.evolution.messaging.subscribe('user-moderate-toggle', function (data) {
				var b = $(data.target);

				if (!b.hasClass('disabled')) {
					b.addClass('disabled');
					var userId = b.data('userid');
					var moderated = b.attr('data-moderated');
					$.telligent.evolution.put({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}.json',
						data: {
							UserId: userId,
							ModerationLevel: moderated == 'true' ? 'Unmoderated' : 'Moderated'
						}
					})
						.then(function(response) {
							var b = $('a.moderate-toggle[data-userid="' + userId + '"]');
							b.attr('data-moderated', moderated == 'true' ? 'false' : 'true')
								.removeClass('disabled');
							if (b.data('type') == "author") {
								b.html(moderated == 'true' ? context.text.moderateAuthor : context.text.unmoderateAuthor);
							}
							else {
								b.html(moderated == 'true' ? context.text.moderateUser : context.text.unmoderateUser);
							}
						})
						.catch(function() {
							b.removeClass('disabled');
						});
				}

				return false;
			});

			 $.telligent.evolution.messaging.subscribe('user-delete', function (data) {
				var userId = $(data.target).data('userid');
				var username = $(data.target).data('username');

				var headerList = $('<ul class="field-list"></ul>')
				.append(
					$('<li class="field-item"></li>')
						.append(
							$('<span class="field-item-input"></span>')
								.append(
									$('<a href="#" data-messagename></a>')
										.addClass('button delete')
										.text(context.text.delete + " " + username)
										.data('messagename', 'confirm-user-delete')
										.data('userid', userId)
						)
					)
				);

				$.telligent.evolution.administration.open({
					name: context.text.deleteUser,
					header: $('<fieldset></fieldset>').append(headerList),
					content: $.telligent.evolution.get({
						url: context.urls.deleteAuthor,
						data: {
							w_userId: userId
						}
					}),
					cssClass: 'moderation-user-delete'
				});

				return false;
			});

			 $.telligent.evolution.messaging.subscribe('confirm-user-delete', function (data) {
				var userId = $(data.target).data('userid');

				$.telligent.evolution.del({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/' + userId + '.json',
					data: { DeleteAllContent: true },
					success: function(response) {
						$.telligent.evolution.notifications.show(context.text.userdeletedmessage);
						$.telligent.evolution.administration.close()
					},
					error: function(xhr, desc, ex) { $.telligent.evolution.notifications.show(desc,{type:'error'}); }
				})


				return false;
			});

			registerContentHandlers(context.wrapper, false);

			context.list = {
				filter: 'to-review',
				state: '',
				age: 0,
				sort: '',
				sortOrder: '',
				containerId: null,
				containerTypeId: null,
				applicationId: null,
				applicationTypeId: null,
				authorId: null,
				contentTypeId: null
			};

			attachFilterHandlers();
			updateHeader();
			updateFilterSelector();

			var hashData = $.telligent.evolution.url.hashData();

			if (hashData['ApplicationTypeId'] && hashData['ApplicationId']) {
				$.telligent.evolution.get({
					url: context.urls.getContextDetails,
					data: {
						w_applicationid: hashData['ApplicationId'],
						w_applicationtypeid: hashData['ApplicationTypeId']
					}
				})
					.then(function(result) {
						if (result.Title && result.Value) {
							context.appOrGroupSelector.glowLookUpTextBox('add', context.appOrGroupSelector.glowLookUpTextBox(
								'createLookUp',
								result.Value,
								context.text.selectedApplication.replace('{0}', result.Title),
								'',
								true));

							global.setTimeout(function() {
								updateFilterSelector(context);
							}, 250);
						}
					});
			} else if (hashData['ContainerTypeId'] && hashData['ContainerId']) {
				$.telligent.evolution.get({
					url: context.contextDetailsUrl,
					data: {
						w_containerid: hashData['ContainerId'],
						w_containertypeid: hashData['ContainerTypeId']
					}
				})
					.then(function(result) {
						if (result.Title && result.Value) {
							context.appOrGroupSelector.glowLookUpTextBox('add', context.appOrGroupSelector.glowLookUpTextBox(
								'createLookUp',
								result.Value,
								context.text.selectedContainer.replace('{0}', result.Title),
								'',
								true));

							global.setTimeout(function() {
								updateFilterSelector(context);
							}, 250);
						}
					});
			}

			var appealId = hashData['AbuseAppealId'];
			if (appealId) {
				global.setTimeout(function() {
					showAppeal(appealId);
				}, 250);
			}

			$.telligent.evolution.administration.on('panel.shown', function(){
				if (context.reload) {
					context.reload = false;
					updateFilterSelector();
				}
			});
		}
	};

	$.telligent.evolution.widgets.appealQueueAuthorDelete = {
		register: function (options) {
			options.searchresultlist = $(options.inputs.searchresultlistId, $.telligent.evolution.administration.panelWrapper());

			options.searchResultsScrollableResults = $.telligent.evolution.administration.scrollable({
				target: options.searchresultlist,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: options.urls.pagedcontent,
							data: {
								w_pageindex: pageIndex,
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);

							if (items.length > 0) {
								if (pageIndex == 0) {
									options.searchresultlist.empty();
								}
								options.searchresultlist.append(items);
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
		}
	};

}(jQuery, window));