(function($, global) {
	var listWrapper = null, searchTimeout = null, changedGroupList = false, currentSearchText = null, listPageIndex = 0;

	function filterGroups(options, searchText) {
		global.clearTimeout(searchTimeout);
		searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			currentSearchText = searchText;
			if (searchText.length == 0) {
				showList(options);
				options.searchResultList.hide();
			} else {
				$.telligent.evolution.get({
					url: options.searchUrl,
					data: {
						w_searchtext: searchText,
						w_pageindex: 0
					}
				})
					.then(function(result) {
						if (currentSearchText == searchText) {
							options.searchResultList.html(result);
							options.searchResultList.show();
							options.list.hide();

							if (options.searchResultList.find('ul.content-list').data('hasMore')) {
								$.telligent.evolution.administration.scrollable({
									target: options.searchResultList,
									load: function(pageIndex) {
										return $.Deferred(function(d) {
											$.telligent.evolution.get({
												url: options.searchUrl,
												data: {
													w_searchtext: searchText,
													w_pageindex: pageIndex
												}
											})
											.then(function(response) {
												var r = $(response);
												var items = $('li.content-item', r);
												if (items.length > 0) {
													options.searchResultList.find('ul.content-list').append(items);
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

	function del(options, groupId) {
		return $.telligent.evolution.del({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}.json',
			data: {
				GroupId: groupId,
				DeleteApplications: 'True'
			}
		});
	}

	function showList(options) {
		options.list.show();
		if (options.list.find('ul.content-list').data('hasmore') === true) {
			$.telligent.evolution.administration.scrollable({
				initialPageIndex: listPageIndex,
				load: function(pageIndex) {
					return $.Deferred(function(d) {
						$.telligent.evolution.get({
							url: options.listUrl,
							data: {
								w_pageindex: pageIndex
							}
						})
						.then(function(response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (items.length > 0) {
								options.list.find('ul.content-list').append(items).data('hasmore', r.data('hasmore') === true);
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

	function showCreate(options) {
		var saveButton = $('<a href="#"></a>')
			.addClass('button save')
			.text(options.text.save);

		$.telligent.evolution.administration.open({
			name: options.text.addGroup,
			content: $.telligent.evolution.get({
				url: options.createUrl
			}),
			header: $.Deferred(function(d) {
				d.resolve(
					$('<fieldset></fieldset>')
						.append(
							$('<ul class="field-list"></ul>')
								.append(
									$('<li class="field-item"></li>')
										.append(
											$('<span class="field-item-input"></span>')
												.append(
													saveButton
												)
											)
										)
									)
								);
			}).promise(),
			shown: function() {
				var groupName = $('#' + options.groupNameId), groupDescription = $('#' + options.groupDescriptionId);

				saveButton
					.evolutionValidation({
						onValidated: function(isValid, buttonClicked, c) {
							if (isValid) {
								saveButton.removeClass('disabled');
							} else {
								saveButton.addClass('disabled');
							}
						},
						onSuccessfulClick: function(e) {
							e.preventDefault();
							if (!saveButton.hasClass('disabled')) {
								saveButton.addClass('disabled');

								$.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups.json',
									data: {
										Name: groupName.val(),
										Description: groupDescription.val(),
										GroupType: $('input:radio[name=' + options.groupTypeName + ']:checked').val(),
										AutoCreateApplications: false,
										ParentGroupId: options.groupId
									},
								})
								.then(function() {
									$.telligent.evolution.notifications.show(options.text.createSuccess.replace(/\{0\}/, $.telligent.evolution.html.encode(groupName.val())), { type: 'success' });
									changedGroupList = true;
									$.telligent.evolution.administration.close();
								})
								.catch(function() {
									saveButton.removeClass('disabled');
								});
							}
						}})
					.evolutionValidation('addField',
						groupName,
						{
							required: true,
							groupnameexists: {
								getParentId: function(){
									return options.groupId
								}
							},
							messages: {
								required: options.text.requiredNameValidationMessage,
								groupnameexists: options.text.uniqueNameValidationMessage
							}
						},
						groupName.closest('.field-item').find('.field-item-validation'),
						null
					);

			},
			cssClass: 'contextual-group-application-list'
		});
	}

	var api = {
		register: function(options) {
				$.telligent.evolution.administration.on('panel.shown', function() {
					if (changedGroupList) {
						changedGroupList = false;
						$.telligent.evolution.administration.refresh();
					}
				});

				$.telligent.evolution.messaging.subscribe('subgroups.delete', function(data){
					var groupId = $(data.target).data('groupid');

					var item = listWrapper.find('.content-item.group[data-groupid="' + groupId + '"]');
					if (item.length == 0)
						return;

					var name = item.data('name');
					if (global.confirm(options.text.deleteConfirmation.replace(/\{0\}/, name))) {
						del(options, groupId)
							.then(function() {
								item.slideUp('fast', function() {
									item.remove();
								});
								$.telligent.evolution.notifications.show(options.text.deleteSuccess.replace(/\{0\}/, name), { type: 'success' });
							});
					}
				});

				if (options.canCreate) {
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
															.addClass('button save')
															.text(options.text.addGroup)
															.on('click', function() {
																showCreate(options);
																return false;
															})
														)
												)
											)
										)
									);
				}

				listWrapper = $.telligent.evolution.administration.panelWrapper();
				showList(options);

				$('input[type="text"]', listWrapper)
					.on('keyup paste click', function() {
						filterGroups(options, $(this).val());
					});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.subGroups = api;

})(jQuery, window);
