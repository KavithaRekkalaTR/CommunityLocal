(function($, global) {
	var listWrapper = null, searchTimeout = null, changedPageList = false;

	function showRevertPage(options, pageDetails) {
	    $.telligent.evolution.administration.open({
			name: options.text.revertPageTitle.replace(/\{0\}/g, pageDetails.title),
			cssClass: 'contextual-page-list',
			content: $.telligent.evolution.get({
				url: options.revertPageUrl,
				data: {
				    w_iscustom: pageDetails.isCustom,
				    w_pagename: pageDetails.name
				}
			})
		});
	}

	function showRevertHeader(options) {
	    $.telligent.evolution.administration.open({
			name: options.text.revertHeaderTitle,
			cssClass: 'contextual-page-list',
			content: $.telligent.evolution.get({
				url: options.revertHeaderUrl
			})
		});
	}

	function showRevertFooter(options) {
	    $.telligent.evolution.administration.open({
			name: options.text.revertFooterTitle,
			cssClass: 'contextual-page-list',
			content: $.telligent.evolution.get({
				url: options.revertFooterUrl
			})
		});
	}

	function showCreateEdit(options, pageDetailsIn, copyFromPageName) {

		var uniqueId = 'f' + (new Date().getTime());

		var pageDetails = $.extend({
			name: '',
			title: '',
			canDelete: false,
			roleIds: '',
			roleIdNames: ''
		}, pageDetailsIn);

        var copyFrom = null;
        if (pageDetails.name == '') {
            copyFrom = $('<select />')
				.attr('name', uniqueId + '_copyFrom')
				.attr('id', uniqueId + '_copyFrom');

		    copyFrom.append('<option value=""></option>');

			$('.content-item.page', listWrapper).each(function() {
				var cft = $(this);
				if (cft.data('iscustom') == 'True') {
				    copyFrom.append($('<option></option>').
				        attr('value', cft.data('pagename'))
				        .text(cft.data('title')));
				}
			});

			if (copyFrom.children().length == 1) {
			    copyFrom = null;
			} else if (copyFromPageName) {
			    copyFrom.val(copyFromPageName);
			}
        }

		var node;
		$.telligent.evolution.ui.suppress(function(){
			node = [$('<form><fieldset></fieldset></form>')
				.children()
				.attr('id', uniqueId)
				.append(
					$('<ul class="field-list"></ul>')
						.append(
							$('<li class="field-item title"></li>')
								.append(
									$('<label class="field-item-name"></label>')
										.attr('for', uniqueId + '_title')
										.text(options.text.pageTitle)
								)
								.append(
									$('<span class="field-item-description"></span>')
										.text(options.text.pageTitleDescription)
								)
								.append(
									$('<span class="field-item-input"></span>')
										.append(
											$('<input type="text" />')
												.attr('name', uniqueId + '_title')
												.attr('id', uniqueId + '_title')
												.val($.telligent.evolution.html.decode(pageDetails.title))
											)
									)
									.append(
										$('<span class="field-item-validation" style="display:none;"></span>')
										)
								)
								.append(
									$('<li class="field-item name"></li>')
										.append(
											$('<label class="field-item-name"></label>')
												.attr('for', uniqueId + '_name')
												.text(options.text.pageName)
										)
										.append(
											$('<span class="field-item-description"></span>')
												.text(options.text.pageNameDescription)
										)
										.append(
											$('<span class="field-item-input"></span>')
												.append(
													$('<input type="text" />')
														.attr('name', uniqueId + '_name')
														.attr('id', uniqueId + '_name')
														.val(pageDetails.name)
													)
											)
											.append(
												$('<span class="field-item-validation" style="display:none;"></span>')
												)
											)
								.append(
									$('<li class="field-item name"></li>')
										.append(
											$('<label class="field-item-name"></label>')
												.attr('for', uniqueId + '_roles')
												.text(options.text.pageRoles)
										)
										.append(
											$('<span class="field-item-description"></span>')
												.text(options.text.pageRolesDescription)
										)
										.append(
											$('<span class="field-item-input"></span>')
												.append(
													$('<input type="text" />')
														.attr('name', uniqueId + '_roles')
														.attr('id', uniqueId + '_roles')
														.val(pageDetails.roleIds)
													)
											)
											.append(
												$('<span class="field-item-validation" style="display:none;"></span>')
												)
											)
								.append(
								    copyFrom == null ? null :
									$('<li class="field-item name"></li>')
										.append(
											$('<label class="field-item-name"></label>')
												.attr('for', uniqueId + '_copyFrom')
												.text(options.text.copyFrom)
										)
										.append(
											$('<span class="field-item-description"></span>')
												.text(options.text.copyFromDescription)
										)
										.append(
											$('<span class="field-item-input"></span>')
												.append(copyFrom)
											)
									 )
							).parent()];

			if (pageDetails.canDelete) {
				node.push($('<form><fieldset></fieldset></form>')
					.children()
					.attr('id', uniqueId)
					.append(
						$('<ul class="field-list"></ul>')
							.append(
								$('<li class="field-item title"></li>')
									.append(
										$('<span class="field-item-input"></span>')
											.append(
												$('<a href="#" class="button delete"></a>')
													.html(options.text.delete)
													.on('click', function(e) {
														var b = $(this);
														if (!b.hasClass('disabled')) {
															var confirmation = options.text.deleteConfirmation;
															var success = options.text.deleteSuccess;
															if (options.isDefault) {
																confirmation = options.text.deleteDefaultConfirmation;
																success = options.text.deleteDefaultSuccess;
															}

															if (global.confirm(confirmation)) {
																b.addClass('disabled');
																$.telligent.evolution.post({
																	url: options.deletePageUrl,
																	data: {
																		PageName: pageDetails.name
																	}
																})
																	.then(function() {
																		changedPageList = true;
																		$.telligent.evolution.notifications.show(success, { type: 'success' });
																		$.telligent.evolution.administration.close();
																	})
																	.always(function() {
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
					.parent()
				);
			}
		});

		$.telligent.evolution.administration.open({
			name: pageDetails.name != '' ? pageDetails.title : options.text.addPage,
			content: $.Deferred(function(d) {
				d.resolve(node);
			}),
			header: $.Deferred(function(d) {
				var elm = $('<form><fieldset></fieldset></form>')
					.children()
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
									)
					.parent();
				d.resolve(elm);
			}).promise(),
			shown: function() {
				var button = $('a', $.telligent.evolution.administration.header());

				button.evolutionValidation({
					validateOnLoad: pageDetails.name != '',
					onValidated: function(isValid, buttonClicked, c) {
					},
					onSuccessfulClick: function(e) {
						var b = $(e.target);
						if (!b.hasClass('disabled')) {
							b.addClass('disabled');

							if (pageDetails.name != '') {
								$.telligent.evolution.post({
									url: options.editPageUrl,
									data: {
										ExistingPageName: pageDetails.name,
										PageTitle: $('#' + uniqueId + '_title').val(),
										PageName: $('#' + uniqueId + '_name').val(),
										RoleIds: options.canSelectRoles ? $('#' + uniqueId + '_roles').val() : pageDetails.roleIds
									}
								})
									.then(function() {
										changedPageList = true;
										$.telligent.evolution.notifications.show(options.text.saveSuccess, { type: 'success' });
										$.telligent.evolution.administration.close();
									})
									.always(function() {
										b.removeClass('disabled');
									});
							} else {
								$.telligent.evolution.post({
									url: options.createPageUrl,
									data: {
										PageTitle: $('#' + uniqueId + '_title').val(),
										PageName: $('#' + uniqueId + '_name').val(),
										CopyFrom: copyFrom == null ? '' : copyFrom.val(),
										RoleIds: options.canSelectRoles ? $('#' + uniqueId + '_roles').val() : pageDetails.roleIds
									}
								})
									.then(function() {
										changedPageList = true;
										$.telligent.evolution.notifications.show(options.text.saveSuccess, { type: 'success' });
										$.telligent.evolution.administration.close();
									})
									.always(function() {
										b.removeClass('disabled');
									});
							}
						}

						return false;
					}
				})

				button.evolutionValidation('addField', '#' + uniqueId + '_title', { required: true }, '#' + uniqueId + ' .field-item.title .field-item-validation');
				button.evolutionValidation('addField', '#' + uniqueId + '_name', {
					required: true,
					pattern: /^[a-zA-Z0-9\_\-]+$/,
					messages: {
						pattern: options.text.pageNamePatternMessage
					}
				}, '#' + uniqueId + ' .field-item.name .field-item-validation')

                if (options.canSelectRoles) {
    				var roleLookupTimeout = null;
    				$('#' + uniqueId + '_roles').glowLookUpTextBox({
        				emptyHtml: options.text.selectRole,
        				minimumLookUpLength: 0,
        				maxValues: 20,
        				selectedLookUpsHtml: pageDetails.roleIdNames == '' ? [] : pageDetails.roleIdNames.split('&').map(function(name) { return decodeURIComponent(name); }),
        				onGetLookUps: function (tb, searchText) {
        					global.clearTimeout(roleLookupTimeout);
        					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
        					roleLookupTimeout = global.setTimeout(function () {
        						$.telligent.evolution.post({
        							url: options.lookupRolesUrl,
        							data: { 
        							    query: searchText
        							},
        							success: function (response) {
        								if (response && response.matches.length > 0) {
        									var suggestions = [];
        									for (var i = 0; i < response.matches.length; i++) {
        										suggestions.push(tb.glowLookUpTextBox('createLookUp', response.matches[i].id, response.matches[i].name, response.matches[i].name, true));
        									}
        									tb.glowLookUpTextBox('updateSuggestions', suggestions);
        								} else {
        									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', options.text.noRoleMatchesText, options.text.noRoleMatchesText, false)]);
        								}
        							}
        						});
        					}, 500);
        				}
        			});
                } else {
                    $('#' + uniqueId + '_roles')
                        .val(pageDetails.roleIdNames == '' ? '' : pageDetails.roleIdNames.split('&').map(function(name) { return decodeURIComponent(name); }).join(', '))
                        .attr('readonly', true)
                        .attr('placeholder', options.text.cannotSelectRoles);
                }

			},
			cssClass: 'contextual-page-list'
		});
	}

	function filterPages(options, searchText) {
		global.clearTimeout(searchTimeout);
		searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0) {
				$('.content-item.page', listWrapper).show();
			} else {
				var searchTerms = searchText.split(' ');
				$('.content-item.page', listWrapper).each(function() {
					var cft = $(this);
					var text = cft.data('text');
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
				$.telligent.evolution.administration.on('panel.shown', function() {
					if (changedPageList) {
						changedPageList = false;
						$.telligent.evolution.administration.refresh();
					}
				});

				$.telligent.evolution.messaging.subscribe('themepages.edit', function(data){
					showCreateEdit(options, {
						name: $(data.target).data('pagename'),
						title: $(data.target).data('pagetitle'),
						canDelete: $(data.target).data('candelete'),
						roleIds: $(data.target).data('roleids'),
						roleIdNames: $(data.target).data('rolenames')
					})
				});

				$.telligent.evolution.messaging.subscribe('themepages.clone', function(data){
					showCreateEdit(options, null, $(data.target).data('pagename'));
				});

				$.telligent.evolution.messaging.subscribe('themepages.revert', function(data){
					showRevertPage(options, {
						name: $(data.target).data('pagename'),
						title: $(data.target).data('pagetitle'),
						isCustom: $(data.target).data('iscustom')
					});
				});

				$.telligent.evolution.messaging.subscribe('themepages.delete', function(data){
					var b = $(data.target);
					var pageName = b.data('pagename');
					if (!b.hasClass('disabled')) {
						var confirmation = options.text.deleteConfirmation;
						var success = options.text.deleteSuccess;
						if (options.isDefault) {
							confirmation = options.text.deleteDefaultConfirmation;
							success = options.text.deleteDefaultSuccess;
						}

						if (global.confirm(confirmation)) {
							b.addClass('disabled');
							$.telligent.evolution.post({
								url: options.deletePageUrl,
								data: {
									PageName: pageName
								}
							})
								.then(function() {
									$.telligent.evolution.notifications.show(success, { type: 'success' });
									$.telligent.evolution.administration.refresh();
								})
								.always(function() {
									b.removeClass('disabled');
								});
						}
					}
				});

				if (options.canCreate || (options.canEdit && options.isDefault && options.hasHeadersAndFooters)) {
					$.telligent.evolution.administration.header(
						$('<form><fieldset></fieldset></form>')
							.children()
							.append(
								$('<ul class="field-list"></ul>')
									.append(
									    options.canCreate ?
    										$('<li class="field-item"></li>')
    											.append(
    												$('<span class="field-item-input"></span>')
    													.append(
    														$('<a href="#"></a>')
    															.addClass('button save')
    															.text(options.text.addPage)
    															.on('click', function() {
    																showCreateEdit(options);
    																return false;
    															})
    													)
    												)
    												: null
											)
									.append(
									    options.canEdit && options.isDefault && options.hasHeadersAndFooters ?
    									    $('<li class="field-item"></li>')
    											.append(
    												$('<span class="field-item-input"></span>')
    													.append(
    														$('<a href="#"></a>')
    															.addClass('inline-button')
    															.text(options.text.revertHeader)
    															.on('click', function() {
    																showRevertHeader(options);
    																return false;
    															})
    													)
    													.append(
    														$('<a href="#"></a>')
    															.addClass('inline-button')
    															.text(options.text.revertFooter)
    															.on('click', function() {
    																showRevertFooter(options);
    																return false;
    															})
    													)
    											)
    											: null
    									    )
									)
									.parent()
								);
				}

				listWrapper = $.telligent.evolution.administration.panelWrapper();

				$('input[type="text"]', listWrapper)
					.on('keyup paste click', function() {
						filterPages(options, $(this).val());
					});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.themePages = api;

})(jQuery, window);