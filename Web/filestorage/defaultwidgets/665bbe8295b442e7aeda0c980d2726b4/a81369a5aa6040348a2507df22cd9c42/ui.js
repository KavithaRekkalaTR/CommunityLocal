(function ($, global, undef) {

	function updatePreviewState(options) {
		if ($.telligent.evolution.themePreview.enabled()) {
			$('.preview', $.telligent.evolution.administration.header()).hide();
			$('.stop-preview', $.telligent.evolution.administration.header()).show();
		} else {
			$('.preview', $.telligent.evolution.administration.header()).show();
			$('.stop-preview', $.telligent.evolution.administration.header()).hide();
		}
		$.telligent.evolution.administration.header();
	}

	function scrollNextIntoView(options, currentItem, forceCurrentItem) {
		var n, l;
		if (currentItem && currentItem.length > 0 && (currentItem.is('[data-state="NotReviewed"]') || forceCurrentItem)) {
			n = currentItem;
			l = currentItem.closest('.content-list');
			if (l.length == 1 && !options.expandedCategories[l.data('category')]) {
				expandList(options, l.data('category'), l);
			}
		} else {
			n = options.wrapper.find('.content-list:visible .content-item.staged-item[data-state="NotReviewed"]');
		}

		if (n.length > 0) {
			n = n.first();
			n.trigger('click', {
				synthesized: true
			});
			var parent = n.parents('.contextual-panel-content');
			parent.animate({
					scrollTop: Math.max(n.offset().top - parent.offset().top + parent.scrollTop() - (parent.height() / 2) + n.height(), 0)
				},
				'fast',
				'swing');
		}
	}

	function isUpdating(options, val) {
		global.clearTimeout(options.disableUpdatingTimeout);
		global.clearTimeout(options.disableLoadingTimeout);
		if (val) {
			options.isUpdating = true;
			$.telligent.evolution.administration.loading(true);
		} else {
			options.disableUpdatingTimeout = global.setTimeout(function () {
				options.isUpdating = false;
			}, 1500);
			options.disableLoadingTimeout = global.setTimeout(function () {
				$.telligent.evolution.administration.loading(false);
			}, 250);
		}
	}

	function initializeUi(options) {
		if (options.hasStagedItems) {
			$.telligent.evolution.administration.header(
				$('<fieldset></fieldset>')
				.append(
					$('<ul class="field-list"></ul>')
					.append(
						$('<li class="field-item"></li>')
						.append(
							$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#"></a>')
								.addClass('button preview')
								.text(options.text.preview)
								.on('click', function (e) {
									var b = $(e.target);
									if (!b.hasClass('disabled')) {
										b.addClass('disabled');
										$.telligent.evolution.themePreview.enabled(true)
											.then(function () {
												alert(options.text.previewInstructions);
												initializeUi(options);
											})
											.always(function () {
												b.removeClass('disabled');
											});
									}
									return false;
								})
								.hide()
							)
							.append(
								$('<a href="#"></a>')
								.addClass('button stop-preview')
								.text(options.text.stopPreview)
								.on('click', function (e) {
									var b = $(e.target);
									if (!b.hasClass('disabled')) {
										b.addClass('disabled');
										options.originatedDisable = true;
										$.telligent.evolution.themePreview.enabled(false)
											.then(function () {
												initializeUi(options);
											})
											.always(function () {
												b.removeClass('disabled');
											});
									}
									return false;
								})
								.hide()
							)
						)
					)
					.append(
						$('<li class="field-item"></li>')
						.append(
							$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#"></a>')
								.addClass('button save')
								.text(options.text.commit)
								.on('click', function (e) {
									var b = $(e.target);
									if (!b.hasClass('disabled')) {
										var unreviewed = options.wrapper.find('.content-item.staged-item[data-state="NotReviewed"]').length;
										if (unreviewed == 0 || global.confirm(options.text.unreviewedCommitConfirmation.replace(/\{0\}/g, unreviewed))) {
											var previewing = $.telligent.evolution.themePreview.enabled();
											if (unreviewed == 0) {
												$.telligent.evolution.themePreview.enabled(false);
											}

											b.addClass('disabled');
											isUpdating(options, true);
											$.telligent.evolution.post({
													url: options.commitUrl
												})
												.then(function (response) {
													if (!response.complete && response.progressIndicator && response.progressKey) {
														renderProgressIndicator(options, response)
															.then(function () {
																$.telligent.evolution.notifications.show(options.text.commitSuccessfull, {
																	type: 'success'
																});
																$.telligent.evolution.administration.loading(true);
																reloadStagedItems(options)
																	.always(function () {
																		$.telligent.evolution.administration.loading(false);
																	});
															}).catch(function (message) {
																$.telligent.evolution.notifications.show(message, {
																	type: 'warning'
																});
															});;
														isUpdating(options, false);
													} else if (response.complete) {
														$.telligent.evolution.notifications.show(options.text.commitSuccessfull, {
															type: 'success'
														});
														reloadStagedItems(options)
															.always(function () {
																isUpdating(options, false);
															});
													}
												})
												.catch(function () {
													if (unreviewed == 0) {
														$.telligent.evolution.themePreview.enabled(previewing);
													}
													isUpdating(options, false);
												})
												.always(function () {
													b.removeClass('disabled');
												});
										}
									}
									return false;
								})
							)
						)
					)
				)
			);

			updatePreviewState(options);
		} else if ($.telligent.evolution.themePreview.enabled()) {
			$.telligent.evolution.administration.header(
				$('<fieldset></fieldset>')
				.append(
					$('<ul class="field-list"></ul>')
					.append(
						$('<li class="field-item"></li>')
						.append(
							$('<span class="field-item-input"></span>')
							.append(
								$('<a href="#"></a>')
								.addClass('button stop-preview')
								.text(options.text.stopPreview)
								.on('click', function (e) {
									var b = $(e.target);
									if (!b.hasClass('disabled')) {
										b.addClass('disabled');
										$.telligent.evolution.themePreview.enabled(false)
											.always(function () {
												b.removeClass('disabled');
											});
									}
									return false;
								})
							)
						)
					)
				)
			);
		} else {
			$.telligent.evolution.administration.header().empty();
			$.telligent.evolution.administration.header();
		}
	}

	function initializeLists(options) {
		options.wrapper.find('ul.content-list').each(function () {
			var list = $(this);
			var category = list.data('category');
			if (!options.expandedCategories[category]) {
				list.hide();
				options.wrapper.find('.navigation-list.expanded[data-category="' + category + '"]').hide();
				options.wrapper.find('.navigation-list.collapsed[data-category="' + category + '"]').show().uilinks('resize');
				options.wrapper.find('.list-header-wrapper[data-category="' + category + '"]').removeClass('expanded');
			} else {
				options.wrapper.find('.navigation-list.expanded[data-category="' + category + '"]').show().uilinks('resize');
				options.wrapper.find('.navigation-list.collapsed[data-category="' + category + '"]').hide();
				options.wrapper.find('.list-header-wrapper[data-category="' + category + '"]').addClass('expanded');
			}
			updateListState(options, list);
		});
	}

	function updateListState(options, list) {
		var categoryId = list.data('category');
		var reviewState = '';
		var hasUnreviewed = false;
		$('.content-item.staged-item', list).each(function () {
			var state = $(this).data('state');
			if (state == 'Unreviewed') {
				hasUnreviewed = true;
			}
			if (reviewState == '') {
				reviewState = state;
			} else if (reviewState != state) {
				reviewState = 'Mixed';
			}
		});
		$('.review-state[data-category="' + categoryId + '"] .value', options.wrapper).each(function () {
			var state = $(this);
			if (state.data('state') == reviewState) {
				state.show();
			} else {
				state.hide();
			}
		});
	}

	function expandList(options, categoryId, list) {
		options.expandedCategories[categoryId] = true;
		list.slideDown(100, function () {
			$('.navigation-list', list).each(function () {
				$(this).uilinks('resize');
			});
			options.wrapper.find('.navigation-list.expanded[data-category="' + categoryId + '"]').show().uilinks('resize');
			options.wrapper.find('.navigation-list.collapsed[data-category="' + categoryId + '"]').hide();
			options.wrapper.find('.list-header-wrapper[data-category="' + categoryId + '"]').addClass('expanded');
		});
	}

	function collapseList(options, categoryId, list) {
		delete options.expandedCategories[categoryId];
		list.slideUp(100, function () {
			options.wrapper.find('.navigation-list.expanded[data-category="' + categoryId + '"]').hide();
			options.wrapper.find('.navigation-list.collapsed[data-category="' + categoryId + '"]').show().uilinks('resize');
			options.wrapper.find('.list-header-wrapper[data-category="' + categoryId + '"]').removeClass('expanded');
		});
	}

	function renderProgressIndicator(options, response) {
		return $.Deferred(function (d) {
			$.telligent.evolution.administration.loading(false);
			$.telligent.evolution.administration.header().empty();
			$.telligent.evolution.administration.header();

			if (options.scheduledCommitCompleteSubscription)
				$.telligent.evolution.messaging.unsubscribe(options.scheduledCommitCompleteSubscription);
			options.scheduledCommitCompleteSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data) {
				if (data.progressKey == response.progressKey) {
					d.resolve();
				}
			});

			if (options.scheduledCommitErrorSubscription)
				$.telligent.evolution.messaging.unsubscribe(options.scheduledCommitErrorSubscription);
			options.scheduledCommitErrorSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.error', function (data) {
				if (data.progressKey == response.progressKey) {
					d.reject(data.message);
				}
			});

			options.wrapper.find('.staged-items').hide()
			if (response.progressIndicator)
				options.wrapper.find('.progress-indicator').empty().show().append(response.progressIndicator);

		}).promise();
	}

	function reloadStagedItems(options) {
		return $.Deferred(function (d) {
			$.telligent.evolution.get({
					url: options.listUrl
				})
				.then(function (response) {
					options.wrapper.find('.progress-indicator').hide();
					var currentItems = options.wrapper.find('.staged-items');
					var newItems = $(response);
					currentItems.fadeOut('fast', function () {
						currentItems.replaceWith(newItems);
						initializeLists(options);
						newItems.fadeIn('fast', function () {
							scrollNextIntoView(options);
						});
					});

					options.hasStagedItems = newItems.find('.staged-item').length > 0;
					initializeUi(options);
					d.resolve();
				})
				.catch(function () {
					d.reject();
				});
		}).promise();
	}

	var api = {
		register: function (options) {
			options.wrapper = $.telligent.evolution.administration.panelWrapper();
			options.isUpdating = false;
			options.originatedDisable = false;
			options.expandedCategories = {};

			$.telligent.evolution.messaging.subscribe('themepreview.updated', function (data) {
				if (!options.isUpdating) {
					if ($.telligent.evolution.themePreview.enabled()) {
						global.location.reload(true);
					} else {
						reloadStagedItems(options);
					}
				}
			});

			$.telligent.evolution.messaging.subscribe('themepreview.disabled', function () {
				if (!options.isUpdating) {
					initializeUi(options);
					if (options.originatedDisable) {
						options.originatedDisable = false;
						global.location.reload(true);
					} else {
						global.location.replace((global.location + '').split('#')[0]);
					}
				}
			});

			$.telligent.evolution.messaging.subscribe('themepreview.enabled', function () {
				if (!options.isUpdating) {
					initializeUi(options);
					global.location.reload(true);
				}
			});

			if ($.telligent.evolution.themePreview.hasPendingRefresh()) {
				global.location.reload(true);
			}

			$.telligent.evolution.messaging.subscribe('stageditem.set-review-state', function (data) {
				var id = $(data.target).data('id');
				var state = $(data.target).data('state');

				var item = options.wrapper.find('.content-item.staged-item[data-id="' + id + '"]');
				if (item.length != 1)
					return;

				isUpdating(options, true);
				$.telligent.evolution.post({
						url: options.updateReviewStateUrl,
						data: {
							Id: id,
							State: state
						}
					})
					.then(function (response) {
						var newItem = $(response.itemHtml);
						item.replaceWith(newItem);
						updateListState(options, newItem.closest('.content-list'));
						if (item.hasClass('expanded')) {
							scrollNextIntoView(options, newItem);
						}
					})
					.always(function () {
						isUpdating(options, false);
					});
			});

			$.telligent.evolution.messaging.subscribe('stageditem.set-all-review-state', function (data) {
				var category = $(data.target).data('category');
				var state = $(data.target).data('state');
				var ids = [];
				options.wrapper.find('ul[data-category="' + category + '"] .content-item.staged-item').each(function () {
					var item = $(this);
					if (item.data('state') != state) {
						ids.push(item.data('id'));
					}
				});

				if (ids.length > 0) {
					isUpdating(options, true);
					$.telligent.evolution.post({
							url: options.updateReviewStateUrl,
							data: {
								Id: ids,
								State: state
							}
						})
						.then(function () {
							reloadStagedItems(options)
								.always(function () {
									isUpdating(options, false);
								})
						})
						.catch(function () {
							isUpdating(options, false);
						});
				}
			});

			$.telligent.evolution.messaging.subscribe('stageditem.show-all', function (data) {
				var category = $(data.target).data('category');
				var list = options.wrapper.find('ul[data-category="' + category + '"]');
				if (options.expandedCategories[category]) {
					collapseList(options, category, list);
				} else {
					expandList(options, category, list);
				}
			});

			initializeLists(options)
			initializeUi(options);

			global.setTimeout(function () {
				var item = options.wrapper.find('.content-list[data-category="1"] .content-item[data-previewurl="' + global.location.href + '"]');
				scrollNextIntoView(options, item, true);
			}, 500);

			// if publishing in-progress, show indicator by default and reload when complete
			if (options.scheduledCommitInProgress) {
				renderProgressIndicator(options, {
					progressKey: options.scheduledCommitProgressKey
				}).then(function (data) {
					$.telligent.evolution.notifications.show(options.text.commitSuccessfull, {
						type: 'success'
					});
					$.telligent.evolution.administration.loading(true);
					reloadStagedItems(options)
						.always(function () {
							$.telligent.evolution.administration.loading(false);
						});
				}).catch(function (message) {
					$.telligent.evolution.notifications.show(message, {
						type: 'warning'
					});
				});
			}
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.previewTheme = api;

})(jQuery, window);