(function($, global) {

	var searchTimeout = null, currentSearchText = null, listPageIndex = 0;

	function deleteTag(options, tag, close) {
		if (global.confirm(options.text.deleteConfirmationMessage.replace(/\{0\}/, $.telligent.evolution.html.decode(tag)))) {
			$.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/aggregatetags.json',
				data: {
					TagName: tag,
					ApplicationId: options.applicationId,
					ApplicationTypeId: options.applicationTypeId
				}
			})
			.then(function(){
				$.telligent.evolution.notifications.show(options.text.deleteSuccessful, { type: 'success' });
				$.telligent.evolution.messaging.publish('tagmanagement.changed');
				if (options.wrapper && $('.content.tag[data-tagname="' + tag + '"]', options.wrapper).length > 0) {
					var elm = $('.content.tag[data-tagname="' + tag + '"]', options.wrapper);
					elm.parent().slideUp('fast', function() {
						elm.parent().remove();
					});
				}
				if (close) {
					$.telligent.evolution.administration.close();
				}
			});
		}
	}

	function openRenameTagForm(options, tag) {
		var uniqueId = 'f' + (new Date().getTime());
		var node;
		$.telligent.evolution.ui.suppress(function(){
			node = $('<form><fieldset></fieldset></form>')
				.children()
				.attr('id', uniqueId)
				.append(
					$('<ul class="field-list"></ul>')
						.append(
							$('<li class="field-item name"></li>')
								.append(
									$('<label class="field-item-name"></label>')
										.attr('for', uniqueId + '_name')
										.text(options.text.newTagName)
								)
								.append(
									$('<span class="field-item-description"></span>')
										.text(options.text.newTagNameDescription)
								)
								.append(
									$('<span class="field-item-input"></span>')
										.append(
											$('<input type="text" />')
												.attr('name', uniqueId + '_name')
												.attr('id', uniqueId + '_name')
												.val($.telligent.evolution.html.decode(tag))
											)
									)
									.append(
										$('<span class="field-item-validation" style="display:none;"></span>')
										)
								)
							)
				.parent();
		});

		$.telligent.evolution.administration.open({
			name: tag,
			content: $.Deferred(function(d) {
				d.resolve(node);
			}),
			header: $.Deferred(function(d) {
				var elm = $('<fieldset></fieldset>')
					.append(
						$('<ul class="field-list"></ul>')
							.append(
								$('<li class="field-item"></li>')
									.append(
										$('<span class="field-item-input"></span>')
											.append(
												$('<a href="#"></a>')
													.addClass('button')
													.text(options.text.renameTag)
												)
											)
										)
									);

				d.resolve(elm);
			}).promise(),
			shown: function() {
				var button = $('a', $.telligent.evolution.administration.header());

				button.evolutionValidation({
					validateOnLoad: true,
					onValidated: function(isValid, buttonClicked, c) {
					},
					onSuccessfulClick: function(e) {
						$.telligent.evolution.put({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/aggregatetags.json',
							data: {
								TagName: tag,
								NewTagName: $('#' + uniqueId + '_name').val(),
								ApplicationId: options.applicationId,
								ApplicationTypeId: options.applicationTypeId
							}
						})
						.then(function(){
							$.telligent.evolution.notifications.show(options.text.renameSuccessful, { type: 'success' });
							$.telligent.evolution.messaging.publish('tagmanagement.changed');
							$.telligent.evolution.administration.close();
						});

						return false;
					}
				})

				button.evolutionValidation('addField', '#' + uniqueId + '_name', {
					required: true,
					pattern: /^[^;,]*$/,
					messages: {
						pattern: options.text.onlyASingleTagAllowed
					}
				}, '#' + uniqueId + ' .field-item.name .field-item-validation')
			},
			cssClass: 'contextual-tag-management'
		});
	}

	function openAddTagForm(options) {
		var uniqueId = 'f' + (new Date().getTime());
		var node;
		$.telligent.evolution.ui.suppress(function(){
			node = $('<fieldset></fieldset>')
				.attr('id', uniqueId)
				.append(
					$('<ul class="field-list"></ul>')
						.append(
							$('<li class="field-item name"></li>')
								.append(
									$('<label class="field-item-name"></label>')
										.attr('for', uniqueId + '_name')
										.text(options.text.tagName)
								)
								.append(
									$('<span class="field-item-description"></span>')
										.text(options.text.tagNameDescription)
								)
								.append(
									$('<span class="field-item-input"></span>')
										.append(
											$('<input type="text" />')
												.attr('name', uniqueId + '_name')
												.attr('id', uniqueId + '_name')
											)
									)
									.append(
										$('<span class="field-item-validation" style="display:none;"></span>')
										)
								)
							);
		});

		$.telligent.evolution.administration.open({
			name: options.text.addTag,
			content: $.Deferred(function(d) {
				d.resolve(node);
			}),
			header: $.Deferred(function(d) {
				var elm = $('<fieldset></fieldset>')
					.append(
						$('<ul class="field-list"></ul>')
							.append(
								$('<li class="field-item"></li>')
									.append(
										$('<span class="field-item-input"></span>')
											.append(
												$('<a href="#"></a>')
													.addClass('button')
													.text(options.text.save)
												)
											)
										)
									);

				d.resolve(elm);
			}).promise(),
			shown: function() {
				var button = $('a', $.telligent.evolution.administration.header());

				button.evolutionValidation({
					validateOnLoad: false,
					onValidated: function(isValid, buttonClicked, c) {
					},
					onSuccessfulClick: function(e) {
						var tags = $('#' + uniqueId + '_name').val().split(/[,;]/);
						var whens = [];
						$.each(tags, function() {
							var tag = $.trim(this);
							if (tag.length > 0) {
								whens.push($.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/aggregatetags.json',
									data: {
										TagName: tag,
										ApplicationId: options.applicationId,
										ApplicationTypeId: options.applicationTypeId
									}
								}));
							}
						});

						$.when.apply($, whens)
							.then(function(){
								if (whens.length > 1) {
									$.telligent.evolution.notifications.show(options.text.addMultipleSuccessful, { type: 'success' });
								} else {
									$.telligent.evolution.notifications.show(options.text.addSuccessful, { type: 'success' });
								}

								$.telligent.evolution.messaging.publish('tagmanagement.changed');
								$.telligent.evolution.administration.close();
							});

						return false;
					}
				})

				button.evolutionValidation('addField', '#' + uniqueId + '_name', {
					required: true,
				}, '#' + uniqueId + ' .field-item.name .field-item-validation')
			},
			cssClass: 'contextual-tag-management'
		});
	}

	function loadTaggedContent(options, tag) {
		$.telligent.evolution.administration.open({
			name: tag,
			content: $.telligent.evolution.get({
				url: options.listContentUrl,
				data: {
					w_tag: tag
				}
			}),
			header: $.Deferred(function(d) {
				var elm = null;

				if (options.canRename || options.canDelete) {
					elm = $('<fieldset></fieldset>')
						.append(
							$('<ul class="field-list"></ul>')
								.append(
									$('<li class="field-item"></li>')
										.append(
											$('<span class="field-item-input"></span>')
												.append(
													options.canRename ?
														$('<a href="#"></a>')
															.addClass('button')
															.addClass(options.canDelete ? 'two-wide' : '')
															.text(options.text.renameTag)
															.on('click', function() {
																openRenameTagForm(options, tag);
																return false;
															})
														: null
													)
													.append(
														options.canDelete ?
															$('<a href="#"></a>')
																.addClass('button')
																.addClass(options.canRename ? 'two-wide' : '')
																.text(options.text.deleteTag)
																.on('click', function() {
																	deleteTag(options, tag, true);
																	return false;
																})
															: null
														)
												)
											)
										);
				}

				d.resolve(elm);
			}).promise()
		});
	}

	function showList(options) {
		options.listWrapper.show();
		if (options.list.data('hasmore') === true) {
			$.telligent.evolution.administration.scrollable({
				initialPageIndex: listPageIndex,
				target: options.list,
				load: function(pageIndex) {
					return $.Deferred(function(d) {
						$.telligent.evolution.get({
							url: options.pagedTagsUrl,
							data: {
								w_pageindex: pageIndex
							}
						})
						.then(function(response) {
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
						})
						.catch(function() {
							d.reject();
						});
					});
				}
			});
		}
	}

	function filterTags(options, searchText) {
		global.clearTimeout(searchTimeout);
		searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			currentSearchText = searchText;
			if (searchText.length == 0) {
				showList(options);
				options.searchWrapper.hide();
			} else {
				$.telligent.evolution.get({
						url: options.pagedTagsUrl,
						data: {
							w_pageindex: 0,
							w_filter: searchText
						}
					})
					.then(function(result) {
						if (currentSearchText == searchText) {
							options.searchWrapper.show();
							options.searchWrapper.html(result);
							options.listWrapper.hide();

							if (options.searchWrapper.find('ul.content-list').data('hasMore')) {
								$.telligent.evolution.administration.scrollable({
									target: options.searchWrapper.find('ul.content-list'),
									load: function(pageIndex) {
										return $.Deferred(function(d) {
											$.telligent.evolution.get({
												url: options.pagedTagsUrl,
												data: {
													w_pageindex: pageIndex,
													w_filter: searchText
												}
											})
											.then(function(response) {
												var r = $(response);
												var items = $('li.content-item', r);
												if (items.length > 0) {
													options.searchWrapper.find('ul.content-list').append(items);
													if (r.data('hasmore') === true) {
														d.resolve();
													} else {
														d.reject();
													}
												} else {
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
						}
					});
			}
		}, 125);
	}

	var api = {
		registerContentList: function(options) {

			var listWrapper = $('ul.content-list', $.telligent.evolution.administration.panelWrapper());
			if (listWrapper.data('hasmore') === true) {
				$.telligent.evolution.administration.scrollable({
					target: listWrapper,
					load: function(pageIndex) {
						return $.Deferred(function(d) {
							$.telligent.evolution.get({
								url: options.pagedContentUrl,
								data: {
									w_pageindex: pageIndex,
									w_tag: options.tag
								}
							})
							.then(function(response) {
								var r = $(response);
								var items = $('li.content-item', r);
								if (items.length > 0) {
									listWrapper.append(items);
									if ($('ul.content-list', response).data('hasmore') === true) {
										d.resolve();
									} else {
										d.reject();
									}
								} else {
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

			options.shouldRefresh = false;
			$.telligent.evolution.messaging.subscribe('tagmanagement.changed', function(){
				options.shouldRefresh = true;
			});

			$.telligent.evolution.administration.on('panel.shown', function(){
				if (options.shouldRefresh) {
					$.telligent.evolution.administration.close();
					options.shouldRefresh = false;
				}
			});

		},
		register: function(options) {
				$.telligent.evolution.messaging.subscribe('contextual-add-tag', function(data){
					openAddTagForm(options);
					return false;
				});

				$.telligent.evolution.messaging.subscribe('contextual-view-tag', function(data){
					var tag = $(data.target).data('tagname');
					loadTaggedContent(options, tag);
				});

				$.telligent.evolution.messaging.subscribe('contextual-rename-tag', function(data){
					var tag = $(data.target).data('tagname');
					openRenameTagForm(options, tag);
				});

				$.telligent.evolution.messaging.subscribe('contextual-delete-tag', function(data){
					var tag = $(data.target).data('tagname');
					deleteTag(options, tag);
					return false;
				});

				$.telligent.evolution.messaging.subscribe('contextual-remove-tag-from-content', function(data){
					var tag = $(data.target).data('tagname');
					var contentName = $(data.target).data('contentname');
					var contentId = $(data.target).data('contentid');
					var contentTypeId = $(data.target).data('contenttypeid');
					if (global.confirm(options.text.removeTagFromContentConfirmationMessage.replace(/\{0\}/, tag).replace(/\{1\}/, contentName))) {
						$.telligent.evolution.del({
							url: jQuery.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/contenttags.json',
							data: {
								Tags: tag,
								ContentId: contentId,
								ContentTypeId: contentTypeId
							}
						})
						.then(function() {
							$.telligent.evolution.notifications.show(options.text.contentRemovedSuccessful, { type: 'success' });
							$.telligent.evolution.messaging.publish('tagmanagement.changed');
							var elm = $('.content.tagged-content[data-contentid="' + contentId + '"]', $.telligent.evolution.administration.panelWrapper());
							elm.parent().slideUp('fast', function() {
								if (elm.parent().parent().children('li').length <= 1) {
										$.telligent.evolution.administration.close();
								} else {
									elm.parent().remove();
								}
							});
						});
					}
					return false;
				});

				if(options.canAdd) {
					$.telligent.evolution.administration.header(
						$('<fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="#" class="button" data-messagename="contextual-add-tag">' + options.text.addTag + '</a></span></li></ul></fieldset>')
					);
				}

				options.wrapper = $.telligent.evolution.administration.panelWrapper;
				options.list = $('ul.content-list', options.listWrapper);
				showList(options);

				$('input[type="text"]', $.telligent.evolution.administration.panelWrapper)
					.on('keyup paste click', function() {
						filterTags(options, $(this).val());
					});

				options.shouldRefresh = false;
				$.telligent.evolution.messaging.subscribe('tagmanagement.changed', function(){
					options.shouldRefresh = true;
				});

				$.telligent.evolution.administration.on('panel.shown', function(){
					if (options.shouldRefresh) {
						$.telligent.evolution.administration.refresh();
						options.shouldRefresh = false;
					}
				});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.tagManagement = api;

})(jQuery, window);
