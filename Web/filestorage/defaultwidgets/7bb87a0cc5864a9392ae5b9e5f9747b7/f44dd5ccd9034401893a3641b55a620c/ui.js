(function ($) {
	if (typeof $.telligent === 'undefined')
		$.telligent = {};

	if (typeof $.telligent.evolution === 'undefined')
		$.telligent.evolution = {};

	if (typeof $.telligent.evolution.widgets === 'undefined')
		$.telligent.evolution.widgets = {};

	var tabClick = function (context, tab) {
		var t = $(tab);
		var wrapper = $('#' + context.elementId);
		$('.filter-option', wrapper).removeClass('selected');
		$(t.parent().get(0)).addClass('selected');
		var ids = tab.id.split('_');
		var filter = ids[ids.length - 1];
		context.selectedTab = filter;

		load(context, filter);
	},
	 _trackChars = function (context, field, maxLength) {
		 var curLen = field.val().length;
		 var togo = maxLength - curLen;
		 var label = field.parent().next('span.character-count');

		 if (togo >= 0) {
			 label.html(curLen + ' ' + context.charactersRemain);
			 label.removeClass('field-item-validation');
		 }
		 else {
			 label.html((togo * -1) + ' ' + context.charactersOver);
			 label.addClass('field-item-validation');
		 }
	 },
		submitClick = function (context) {
			var inTags = context.tags.val().split(/[,;]/g);
			var tags = [];
			for (var i = 0; i < inTags.length; i++) {
				var tag = $.trim(inTags[i]);
				if (tag)
					tags[tags.length] = tag;
			}
			tags = tags.join(',');

			var data = {
				Title: context.title.evolutionComposer('val'),
				Body: context.getBody(),
				Tags: tags,
				WikiId: context.wikiId
			};

			if (context.metaTitle && context.metaTitle.length > 0)
				data.MetaTitle = context.metaTitle.val();
			if (context.metaKeywords && context.metaKeywords.length > 0)
				data.MetaKeywords = context.metaKeywords.val();
			if (context.metaDescription && context.metaDescription.length > 0)
				data.MetaDescription = context.metaDescription.val();

			if (context.tochiding && context.tochiding.length > 0)
				data.HideInTableOfContents = context.tochiding.is(':checked');

			if (context.currentPageOrderedItem && context.canOrder && context.currentPageOrderedItem.value.position != context.currentPageOrderedItem.value.originalPosition) {
				data.Position = context.currentPageOrderedItem.value.position === null ? -1 : context.currentPageOrderedItem.value.position;
			}

			if ((context.pageId === -1 || context.userCanMovePage) && context.parent)
				data.ParentPageId = context.parent.val() ? context.parent.val() : -1;

			if (context.threadId > 0)
				data.ForumThreadId = context.threadId;

			if (context.pageId > 0) {
				data.Id = context.pageId;

				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/{WikiId}/pages/{Id}.json?IncludeFields=WikiPage.RevisionNumber,User,WikiPage.IsLocked',
					cache: false,
					data: {
						WikiId: data.WikiId,
						Id: data.Id
					},
					success: function (response) {
						if (response.WikiPage.IsLocked && !context.userCanLock) {
							context.message.text(context.lockedText);
							context.message.show();
							$('.processing', context.save.parent()).css("visibility", "hidden");
							context.save.removeClass('disabled');
							return;
						}
						else {
							context.message.hide();
						}
						if (response.WikiPage.RevisionNumber == context.originalRevision) {
							data.IsLocked = response.WikiPage.IsLocked;
							$.telligent.evolution.put({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/{WikiId}/pages/{Id}.json?IncludeFields=WikiPage.Id,WikiPage.Url',
								data: data,
								success: function (response) {
									$.telligent.evolution.post({
										url: context.subscribeUrl,
										data: { wikiPageId: response.WikiPage.Id, subscribe: context.subscribe.is(':checked') },
										success: function (response2) {
											_setOrder(context)
												.then(function() {
													window.location = response.WikiPage.Url;
												})
												.catch(function() {
													$('.processing', context.save.parent()).css("visibility", "hidden");
													context.save.removeClass('disabled');
												})
										},
										error: function (xhr, desc, ex) {
											$.telligent.evolution.notifications.show(desc, { type: 'error' });
											$('.processing', context.save.parent()).css("visibility", "hidden");
											context.save.removeClass('disabled');
										}
									});
								},
								error: function (xhr, desc, ex) {
									if(xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0)
										$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0],{type:'error'});
									else
										$.telligent.evolution.notifications.show(desc,{type:'error'});
									$('.processing', context.save.parent()).css("visibility", "hidden");
									context.save.removeClass('disabled');
								}
							});
						}
						else {
							var mergeUrl = context.mergeUrl.replace(/998877/g, context.originalRevision).replace(/778899/g, response.WikiPage.RevisionNumber);

							context.message.html(context.mergeMessage.replace(/{AuthorUrl}/g, response.WikiPage.User.ProfileUrl).replace(/{AuthorName}/g, response.WikiPage.User.DisplayName).replace(/{MergeUrl}/g, 'window.open(\'' + mergeUrl + '\',\'merge\',\'width=530,height=500,resizable=1,scrollbars=1\'); return false;')).show();

							context.save.html(context.overwriteText);
							$('.processing', context.save.parent()).css("visibility", "hidden");
							context.save.removeClass('disabled');

							context.viewChanges.off('click');
							context.viewChanges.on('click', function () {
								window.open(mergeUrl, 'merge', 'width=530,height=500,resizable=1,scrollbars=1');
								return false;
							});
							context.viewChanges.show();

							context.originalRevision = response.WikiPage.RevisionNumber;

							$('html, body').animate({ scrollTop: context.message.offset().top - 100 }, 500);
						}
					},
					error: function (xhr, desc, ex) {
						$.telligent.evolution.notifications.show(desc, { type: 'error' });
						$('.processing', context.save.parent()).css("visibility", "hidden");
						context.save.removeClass('disabled');
					}
				});
			}
			else {
				$.telligent.evolution.post({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/{WikiId}/pages.json?IncludeFields=WikiPage.Id,WikiPage.Url',
					data: data,
					success: function (response) {
						context.pageId = response.WikiPage.Id;
						if (context.currentPageOrderedItem) {
							context.currentPageOrderedItem.value.id = context.pageId;
						}
						$.telligent.evolution.post({
							url: context.subscribeUrl,
							data: { wikiPageId: response.WikiPage.Id, subscribe: context.subscribe.is(':checked') },
							success: function (response2) {
								_setOrder(context)
									.then(function() {
										window.location = response.WikiPage.Url;
									})
									.catch(function() {
										$('.processing', context.save.parent()).css("visibility", "hidden");
										context.save.removeClass('disabled');
									});
							},
							error: function (xhr, desc, ex) {
								$.telligent.evolution.notifications.show(desc, { type: 'error' });
								$('.processing', context.save.parent()).css("visibility", "hidden");
								context.save.removeClass('disabled');
							}
						});
					},
					error: function (xhr, desc, ex) {
						if(xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0)
										$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0],{type:'error'});
									else
										$.telligent.evolution.notifications.show(desc,{type:'error'});
						$('.processing', context.save.parent()).css("visibility", "hidden");
						context.save.removeClass('disabled');
					}
				});
			}
		},
		_setOrder = function(context) {
			return $.telligent.evolution.batch(function() {
				if (context.canOrder) {
					var itemCount = context.ordering.glowOrderedList('count');
					for (var i = 0; i < itemCount; i++) {
						var item = context.ordering.glowOrderedList('getByIndex', i);
						if (item.value.position !== item.value.originalPosition) {
							if (context.pageId != item.value.id) {
								$.telligent.evolution.put({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis/{WikiId}/pages/{Id}.json?IncludeFields=WikiPage.Id,WikiPage.Url',
									data: {
										WikiId: context.wikiId,
										Id: item.value.id,
										Position: item.value.position === null ? -1 : item.value.position
									}
								});
							}
						}
					}
				}
			}, {
			   sequential: false
			});
		},
		_orderChanged = function(context, changedItem, oldIndex, newIndex) {
			var items = [];
			var itemCount = context.ordering.glowOrderedList('count');
			var allInNaturalPosition = true;
			var i;
			for (i = 0; i < itemCount; i++) {
				var item = context.ordering.glowOrderedList('getByIndex', i);
				items.push({
					item: item,
					originalIndex: i
					});

				if (item.value.naturalPosition != i) {
					allInNaturalPosition = false;
				}
			}

			if (allInNaturalPosition) {
				for (i = 0; i < items.length; i++) {
					items[i].item.value.position = null;
				}
			} else {
				for (i = 0; i < items.length; i++) {
					items[i].item.value.position = i;
				}
			}
		},
		_sortOrderList = function(context) {
			var items = [];
			var itemCount = context.ordering.glowOrderedList('count');
			for (var i = 0; i < itemCount; i++) {
				var item = context.ordering.glowOrderedList('getByIndex', i);
				items.push({
					item: item,
					originalIndex: i
					});
			}

			items.sort(function(a, b) {
			   if (a.item.value.isDefault == b.item.value.isDefault) {
				   return a.item.value.title.localeCompare(b.item.value.title);
				} else if (a.item.value.isDefault) {
					return -1;
				} else {
					return 1;
				}
			});

			for ( i = 0; i < itemCount; i++) {
				items[i].item.value.naturalPosition = i;
			}

			items.sort(function(a, b) {
			   if (a.item.value.position === null) {
				   if (b.item.value.position !== null) {
					   return 1;
				   }
			   } else if (b.item.value.position === null) {
				   return -1;
			   } else if (a.item.value.position != b.item.value.position) {
				   return a.item.value.position - b.item.value.position;
			   }

			   if (a.item.value.isDefault == b.item.value.isDefault) {
				   return a.item.value.title.localeCompare(b.item.value.title);
				} else if (a.item.value.isDefault) {
					return -1;
				} else {
					return 1;
				}
			});

			for (i = 0; i < itemCount; i++) {
				if (items[i].originalIndex != i) {
					context.ordering.glowOrderedList('insert', items[i].item, i);
				}
			}

			context.ordering.glowOrderedList('refresh');
		},
		_updateOrderList = function(context) {
			if (context.parent) {
				var parentId = context.parent.val() ? context.parent.val() : -1;
				if (parentId != context.parentId) {
					context.parentId = parentId;
					$.telligent.evolution.get({
						url: context.getChildrenUrl,
						data: {
							_w_wikiPageId: context.parentId,
							_w_wikiId: context.wikiId
						}
					})
						.then(function(response) {
						   context.ordering.glowOrderedList('clear');
						   if (response.toomany) {
							   context.ordering.closest('.field-item.post-ordering').css({
								   position: 'absolute',
								   visibility: 'hidden',
								   left: '-1000px',
								   width: '100px'
							   });
							   context.canOrder = false;
						   } else {
							   context.ordering.closest('.field-item.post-ordering').css({
								   position: 'static',
								   visibility: 'visible',
								   left: '0',
								   width: 'auto'
							   });
							   context.canOrder = true;
							   var found = false;
							   var pageTitle = context.title.evolutionComposer('val');
							   var originalTitle = pageTitle;
							   if (pageTitle === '') {
								   pageTitle = context.orderPlaceholder;
							   }

								if (context.tochiding.is(':checked')) {
									pageTitle = context.titleHidden.replace(/\{0\}/g, pageTitle);
								}

							   var currentPageItem = context.ordering.glowOrderedList('createItem', {
									value: {
										id: context.pageId,
										originalPosition: null,
										naturalPosition: null,
										position: null,
										title: originalTitle,
										isDefault: false
									},
									text: pageTitle,
									html: '<b>' + pageTitle + '</b>'
							   });

							   for (var i = 0; i < response.pages.length; i++) {
								   if (context.pageId == response.pages[i].id) {
									   found = true;
									   currentPageItem.value.originalPosition = response.pages[i].position;
									   currentPageItem.value.naturalPosition = null;
									   currentPageItem.value.position = response.pages[i].position;
									   currentPageItem.value.isDefault = response.pages[i].isDefault;
									   context.ordering.glowOrderedList('add', currentPageItem);
								   } else {
									   context.ordering.glowOrderedList('add', context.ordering.glowOrderedList('createItem', {
										   value: {
											   id: response.pages[i].id,
											   position: response.pages[i].position,
											   originalPosition: response.pages[i].position,
											   naturalPosition: null,
											   title: response.pages[i].title,
											   isDefault: response.pages[i].isDefault
											},
										   text: response.pages[i].hidden ? context.titleHidden.replace(/\{0\}/g, response.pages[i].title) : response.pages[i].title,
										   html: response.pages[i].hidden ? context.titleHidden.replace(/\{0\}/g, response.pages[i].title) : response.pages[i].title
									   }));
								   }
							   }

							   if (!found) {
								   currentPageItem.value.originalPosition = null;
								   currentPageItem.value.position = null;
								   currentPageItem.value.naturalPosition = null;
								   context.ordering.glowOrderedList('add', currentPageItem);
							   }
							   context.currentPageOrderedItem = currentPageItem;
							   _sortOrderList(context);
						   }
						});
				} else {
					if (context.currentPageOrderedItem) {
						var pageTitle = context.title.evolutionComposer('val');
						var originalTitle = pageTitle;
						if (pageTitle === '') {
						   pageTitle = context.orderPlaceholder;
						}

						context.currentPageOrderedItem.value.naturalPosition = null;
						context.currentPageOrderedItem.value.title = originalTitle;

						if (context.tochiding.is(':checked')) {
							pageTitle = context.titleHidden.replace(/\{0\}/g, pageTitle);
						}

						context.currentPageOrderedItem.html = '<b>' + pageTitle + '</b>';
						context.currentPageOrderedItem.text = pageTitle;
						_sortOrderList(context);
					}
				}
			}
		};

	$.telligent.evolution.widgets.pageEdit =
	{
		register: function (context) {
			if (context.tags) {
				context.tags.evolutionTagTextBox({ applicationId: context.applicationId });
			}

			// tab setup
			$(context.tabsSelector).glowTabbedPanes({
				cssClass: 'tab-pane',
				tabSetCssClass: 'tab-set with-panes',
				tabCssClasses: ['tab'],
				tabSelectedCssClasses: ['tab selected'],
				tabHoverCssClasses: ['tab hover'],
				enableResizing: false,
				tabs: [
					[context.writeTabId, context.writeTabLabel, null],
					[context.optionsTabId, context.optionsTabLabel, null]
				]
			});

			context.title.evolutionComposer({
				plugins: ['hashtags'],
				contentTypeId: context.wikiPageContentTypeId
			}).evolutionComposer('onkeydown', function (e) {
				if (e.which === 13) {
					return false;
				} else {
					return true;
				}
			}).on('change', function() {
				_updateOrderList(context);
			});

			if (context.parent && context.lookupPagesUrl && context.noPageMatchesText) {
				var timeout = null;
				context.parent.glowLookUpTextBox(
				{
					'maxValues': 1,
					'emptyHtml': '',
					'onGetLookUps': function (tb, searchText) {
						window.clearTimeout(timeout);
						if (searchText && searchText.length >= 2) {
							tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
							timeout = window.setTimeout(function () {
								$.telligent.evolution.get({
									url: context.lookupPagesUrl,
									data: { w_SearchText: searchText, w_ParentPageIdToExclude: (context.pageId ? context.pageId : -1) },
									success: function (response) {
										if (response && response.pages.length > 1) {
											var suggestions = [];
											for (var i = 0; i < response.pages.length - 1; i++)
												suggestions[suggestions.length] = tb.glowLookUpTextBox('createLookUp', response.pages[i].pageId, response.pages[i].title, response.pages[i].title, true);
											tb.glowLookUpTextBox('updateSuggestions', suggestions);
										}
										else
											tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.noPageMatchesText, context.noPageMatchesText, false)]);
									}
								});
							}, 749);
						}
					},
					'selectedLookUpsHtml': (context.parentPageTitle ? [context.parentPageTitle] : [])
				})
					.on('glowLookUpTextBoxChange', function() {
						_updateOrderList(context);
					});
			}

			if (context.ordering) {
				context.ordering.glowOrderedList({
					height: 200
				});

				_updateOrderList(context);

				if (context.orderingUp) {
					context.orderingUp.on('click', function() {
						context.ordering.glowOrderedList('moveUp');
						return false;
					});
				}

				if (context.orderingDown) {
					context.orderingDown.on('click', function() {
						context.ordering.glowOrderedList('moveDown');
						return false;
					});
				}

				if (context.tochiding) {
					context.tochiding.on('change', function() {
						_updateOrderList(context);
					});
				}

				context.ordering.on('glowOrderedListItemMoved', function(e, item, oldIndex, newIndex) {
					_orderChanged(context, item, oldIndex, newIndex);
				});
			}

			context.save.on('click', function () {
				$(this).evolutionValidation('validate');
				if (!$(this).evolutionValidation('isValid')) {
					return;
				}

				submitClick(context);
			});
			
			
			$(context.cancelLink).on('click', function () {
				if (confirm(context.cancelConfirmationText)) {
				    $.telligent.evolution.navigationConfirmation.ignoreClick();
                    window.history.back();
				}
				return false;
			});
			
			$.telligent.evolution.navigationConfirmation.enable();
			$.telligent.evolution.navigationConfirmation.register(context.save);

			if (context.viewchanges)
				context.viewchanges.on('click', function () { showMerge(context); });

			context.save.on('click', function () {
				if (!context.save.evolutionValidation('validateField', context.titleSelector) && $.trim(context.title.evolutionComposer('val')))
					$.telligent.evolution.notifications.show(context.pageExistsText, { type: 'error' });
			});

			context.save.evolutionValidation(
			{
				validateOnLoad: context.pageId <= 0 ? false : null,
				onValidated: function (isValid, buttonClicked, c) {
					if (isValid)
						context.save.removeClass('disabled');
					else
						context.save.addClass('disabled');
				},
				onSuccessfulClick: function (e) {
					$('.processing', context.save.parent()).css("visibility", "visible");
					context.save.addClass('disabled');
				}
			});

			context.save.evolutionValidation('addField', context.titleSelector,
			{
				required: true,
				wikipageexists: { wikiId: context.wikiId, pageId: context.pageId, parentPageId: function () { return context.parent && context.parent.val() ? context.parent.val() : -1; } },
				messages:
				{
					required: context.requiredFieldText,
					wikipageexists: context.pageExistsText
				}
			}, '#' + context.wrapperId + ' .field-item.post-name .field-item-validation', null);
			context.save.evolutionValidation('validate');

			var f = context.save.evolutionValidation('addCustomValidation', 'pagetext', function () {
				return context.getBody().length > 0;
			},
			context.requiredFieldText, '#' + context.wrapperId + ' .field-item.post-body .field-item-validation', null
			);

			_trackChars(context, context.metaTitle, 55);
			context.metaTitle.on('keyup', function () {
				_trackChars(context, $(this), 55);
			});
			_trackChars(context, context.metaDescription, 150);
			context.metaDescription.on('keyup', function () {
				_trackChars(context, $(this), 150);
			});

			context.attachBodyChangeHandler(f);
		}
	};
})(jQuery);