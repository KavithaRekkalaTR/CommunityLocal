(function($, global) {

	var searchTimeout = null;

	function deleteCategory(options, id, name) {
		$.telligent.evolution.administration.open({
			name: name,
			content: $.telligent.evolution.post({
				url: options.deleteUrl,
				data: {
					CategoryId: id
				}
			}),
			header: $.Deferred(function(d) {
				var node = $('<form></form>');
				var fieldset = $('<fieldset></fieldset>')
					.append(
						$('<ul class="field-list"></ul>')
							.append(
								$('<li class="field-item"></li>')
									.append(
										$('<span class="field-item-input"></span>')
											.append(
												$('<a href="#"></a>')
													.addClass('button')
													.text(options.text.deleteCategory)
												)
											)
										)
									).appendTo(node);

				d.resolve(node);
			}).promise(),
			shown: function() {
				var button = $('a', $.telligent.evolution.administration.header());
				var replacement = $('.field-item.replacement select', $.telligent.evolution.administration.panelWrapper());

				if (replacement.find('option').length == 0) {
					replacement.hide();
					button.addClass('disabled').on('click', function() { return false; });
				} else {
					button.on('click', function() {
						if (global.confirm(options.text.deleteConfirmationMessage.replace(/\{0\}/, $.telligent.evolution.html.decode(name)))) {
							$.telligent.evolution.del({
								url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/category.json',
								data: {
									IdeationId: options.ideationId,
									Id: id,
									ReassignCategoryId: replacement.val()
								}
							})
							.then(function(){
								$.telligent.evolution.notifications.show(options.text.deleteSuccessful.replace(/\{0\}/, $.telligent.evolution.html.decode(name)), { type: 'success' });
								$.telligent.evolution.messaging.publish('ideacategorymanagement.changed');
								$.telligent.evolution.administration.close();
							});
						}

						return false;
					});
				}
			},
			cssClass: 'contextual-tag-management'
		});
	}

	function openEditCategoryForm(options, id, name) {
		var uniqueId = 'f' + (new Date().getTime());
		var node;
		$.telligent.evolution.ui.suppress(function(){
			node = $('<form></form>');
			var fieldSet = $('<fieldset></fieldset>')
				.attr('id', uniqueId)
				.append(
					$('<ul class="field-list"></ul>')
						.append(
							$('<li class="field-item name"></li>')
								.append(
									$('<label class="field-item-name"></label>')
										.attr('for', uniqueId + '_name')
										.text(options.text.categoryName)
								)
								.append(
									$('<span class="field-item-description"></span>')
										.text(options.text.categoryNameDescription)
								)
								.append(
									$('<span class="field-item-input"></span>')
										.append(
											$('<input type="text" />')
												.attr('name', uniqueId + '_name')
												.attr('id', uniqueId + '_name')
												.val($.telligent.evolution.html.decode(name))
											)
									)
									.append(
										$('<span class="field-item-validation" style="display:none;"></span>')
										)
								)
							).appendTo(node);
		});

		$.telligent.evolution.administration.open({
			name: name,
			content: $.Deferred(function(d) {
				d.resolve(node);
			}),
			header: $.Deferred(function(d) {
				var node = $('<form></form>');
				var fieldset = $('<fieldset></fieldset>')
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
									).appendTo(node);

				d.resolve(node);
			}).promise(),
			shown: function() {
				var button = $('a', $.telligent.evolution.administration.header());

				button.evolutionValidation({
					validateOnLoad: true,
					onValidated: function(isValid, buttonClicked, c) {
					},
					onSuccessfulClick: function(e) {
						$.telligent.evolution.put({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/category.json',
							data: {
								IdeationId: options.ideationId,
								Id: id,
								Name: $('#' + uniqueId + '_name').val()
							}
						})
						.then(function(response){
							$.telligent.evolution.notifications.show(options.text.editSuccessful.replace(/\{0\}/, $.telligent.evolution.html.decode(response.IdeaCategory.Name)), { type: 'success' });
							$.telligent.evolution.messaging.publish('ideacategorymanagement.changed');
							$.telligent.evolution.administration.close();
						});

						return false;
					}
				})

				button.evolutionValidation('addField', '#' + uniqueId + '_name', {
					required: true
				}, '#' + uniqueId + ' .field-item.name .field-item-validation')
			},
			cssClass: 'contextual-tag-management'
		});
	}

	function openAddCategoryForm(options) {
		var uniqueId = 'f' + (new Date().getTime());
		var node;
		$.telligent.evolution.ui.suppress(function(){
			node = $('<form></form>');
			var fieldSet = $('<fieldset></fieldset>')
				.attr('id', uniqueId)
				.append(
					$('<ul class="field-list"></ul>')
						.append(
							$('<li class="field-item name"></li>')
								.append(
									$('<label class="field-item-name"></label>')
										.attr('for', uniqueId + '_name')
										.text(options.text.categoryName)
								)
								.append(
									$('<span class="field-item-description"></span>')
										.text(options.text.categoryNameDescription)
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
							).appendTo(node);
		});

		$.telligent.evolution.administration.open({
			name: options.text.addCategory,
			content: $.Deferred(function(d) {
				d.resolve(node);
			}),
			header: $.Deferred(function(d) {
				var node = $('<form></form>');
				var fieldSet = $('<fieldset></fieldset>')
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
									).appendTo(node);

				d.resolve(node);
			}).promise(),
			shown: function() {
				var button = $('a', $.telligent.evolution.administration.header());

				button.evolutionValidation({
					validateOnLoad: false,
					onValidated: function(isValid, buttonClicked, c) {
					},
					onSuccessfulClick: function(e) {
						var name = $('#' + uniqueId + '_name').val();
						$.telligent.evolution.post({
							url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/category.json',
							data: {
								IdeationId: options.ideationId,
								Name: name
							}
						})
							.then(function(response){
								$.telligent.evolution.notifications.show(options.text.addSuccessful.replace(/\{0\}/g, $.telligent.evolution.html.decode(response.IdeaCategory.Name)), { type: 'success' });
								$.telligent.evolution.messaging.publish('ideacategorymanagement.changed');
								$.telligent.evolution.administration.close();
							});

						return false;
					}
				});

				button.evolutionValidation('addField', '#' + uniqueId + '_name', {
					required: true,
				}, '#' + uniqueId + ' .field-item.name .field-item-validation');
			},
			cssClass: 'contextual-tag-management'
		});
	}

	function filterCategories(options, searchText) {
		global.clearTimeout(searchTimeout);
		searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0) {
				$('.content-item.category', options.list).show();
			} else {
				var searchTerms = searchText.split(' ');
				$('.content-item.category', options.list).each(function() {
					var cft = $(this);
					var text = cft.data('text').toLowerCase();
					var match = true;
					for (var i = 0; i < searchTerms.length; i++) {
						if (text.indexOf(searchTerms[i]) == -1) {
							match = false;
							break;
						}
					}
					if (match) {
						cft.slideDown('fast');
					} else {
						cft.slideUp('fast');
					}
				})
			}
		}, 125);
	}

	var api = {
		register: function(options) {
				$.telligent.evolution.messaging.subscribe('contextual-add-category', function(data){
					openAddCategoryForm(options);
					return false;
				});

				$.telligent.evolution.messaging.subscribe('contextual-edit-category', function(data){
					var categoryId = $(data.target).data('categoryid');
					var categoryName = $(data.target).data('categoryname');
					openEditCategoryForm(options, categoryId, categoryName);
				});

				$.telligent.evolution.messaging.subscribe('contextual-delete-category', function(data){
					var categoryId = $(data.target).data('categoryid');
					var categoryName = $(data.target).data('categoryname');
					deleteCategory(options, categoryId, categoryName);
					return false;
				});

				$.telligent.evolution.administration.header(
					$('<form><fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="#" class="button" data-messagename="contextual-add-category">' + options.text.addCategory + '</a></span></li></ul></fieldset></form>')
				);

				options.wrapper = $.telligent.evolution.administration.panelWrapper;
				options.list = $('ul.content-list', options.listWrapper);

				$('input[type="text"]', $.telligent.evolution.administration.panelWrapper)
					.on('keyup paste click', function() {
						filterCategories(options, $(this).val());
					});

				options.shouldRefresh = false;
				$.telligent.evolution.messaging.subscribe('ideacategorymanagement.changed', function(){
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
	$.telligent.evolution.widgets.ideaCategoryManagement = api;

})(jQuery, window);
