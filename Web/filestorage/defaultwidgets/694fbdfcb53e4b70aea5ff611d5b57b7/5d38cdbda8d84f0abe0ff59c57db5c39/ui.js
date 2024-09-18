(function ($, global) {
	var headerList, button, deleteButton;

	var spinner = '<span class="ui-loading" width="48" height="48"></span>',
		searchGroups = function(context, textbox, searchText) {
			if(searchText && searchText.length >= 2) {

				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
				]);

				$.telligent.evolution.get({
					url: context.urls.lookupGroups,
					data: {
						GroupNameFilter: searchText,
						Permission: 'Group_ReadGroup'
					},
					success: function(response) {
						if (response && response.Groups && response.Groups.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								$.map(response.Groups, function(group, i) {
									return textbox.glowLookUpTextBox('createLookUp', group.Id, group.Name, group.Name, true);
								}));
						} else {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', context.resources.noGroupsMatch, context.resources.noGroupsMatch, false)
							]);
						}
					}
				});
			}
		},
		searchTags = function(context, parentId, textbox, searchText) {
		    if(searchText && searchText.length >= 2) {

				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
				]);

				$.telligent.evolution.get({
					url: context.urls.lookupTags,
					data: {
						w_query: searchText,
						w_parentId: parentId || ''
					},
					success: function(response) {
						if (response && response.tags && response.tags.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								$.map(response.tags, function(tag, i) {
									return textbox.glowLookUpTextBox('createLookUp', tag.id, tag.name, tag.name, true);
								}));
						} else {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', context.resources.noTagsMatch, context.resources.noTagsMatch, false)
							]);
						}
					}
				});
			}
		};

	var api = {
		register: function (options) {

		    $('#' + options.wrapperId + ' a.browse').on('click', function() {
		       var a = $(this);
		       var parentTagId = a.data('parenttagid');
		       var maxValues = parseInt(a.data('maxvalues') || '100');
		       var lu = $('#' + a.data('lookuptextboxid'));

		       if (lu.length > 0 && options.openTagBrowser) {
		           options.openTagBrowser(this, {
                        parentTagId: parentTagId || '',
                        callback: function(v) {
                            var keyValue = v.split('=');
                            if (keyValue.length == 3)
                            {
                                while (lu.glowLookUpTextBox('count') >= maxValues) {
                                    lu.glowLookUpTextBox('removeByIndex', lu.glowLookUpTextBox('count') - 1);
                                }
                                lu.glowLookUpTextBox('removeByValue', decodeURIComponent(keyValue[2]).replace(/\+/g,' '));
                                lu.glowLookUpTextBox('add', lu.glowLookUpTextBox('createLookUp', decodeURIComponent(keyValue[2]).replace(/\+/g,' '),decodeURIComponent(keyValue[1]).replace(/\+/g,' '),decodeURIComponent(keyValue[0]).replace(/\+/g,' '), true));
                            }
                        }
                    });
                }

                return false;
		    });


			headerList = $('<ul class="field-list"></ul>')
				.append(
					$('<li class="field-item"></li>')
						.append(
							$('<span class="field-item-input"></span>')
								.append(
									$('<a href="#"></a>')
										.addClass('button save')
										.text(options.resources.save)
						)
					)
				);

			$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(headerList));

			var viewidentifiers = $('a.viewidentifiers', $.telligent.evolution.administration.panelWrapper());
			viewidentifiers.on('click', function () {
				$('li.identifiers', $.telligent.evolution.administration.panelWrapper()).each( function() {
					$(this).toggle();
				});

				return false;
			});

			button = $('a.save', $.telligent.evolution.administration.header());

			button.evolutionValidation({
				validateOnLoad: $(options.inputs.nameId).val() != '',
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {

					var applicationId = options.applicationId;

					var groupId = parseInt($(options.inputs.groupId).val());
					if (groupId == options.groupId || confirm(options.resources.moveWarning))
					{
					    var data = {
					        ApplicationId: applicationId,
							Name: $(options.inputs.nameId).val(),
							Description: $(options.inputs.descriptionId).val(),
							Address: $(options.inputs.address).val(),
							GroupId: groupId,
							NavigationTagId: $(options.inputs.navigationTag).val()
					    }

					    $.each(options.tagFilterInputs, function(n, v) {
					        data['TagFilter_' + n] = v.val();
					    });

					    var categories = [];
					    $('#' + options.wrapperId + ' .field-item.categories input[type="checkbox"]:checked').each(function() {
					        categories.push($(this).val());
					    });
					    data.Categories = categories.join(',');

					    var languages = [];
					    $('#' + options.wrapperId + ' .field-item.languages input[type="checkbox"]:checked').each(function() {
					        languages.push($(this).val());
					    });
					    data.Languages = languages.join(',');

						$.telligent.evolution.post({
							url: options.urls.save,
							data: data
						})
						.then(function(response) {
							$.telligent.evolution.notifications.show(options.resources.updated);

							if ((options.groupId != -1 && groupId > 0 && options.groupId != groupId) || data.Address != options.applicationKey) {
								window.location.href = response.redirectUrl;
							}
						});
					}

					return false;
				}
			});


			button.evolutionValidation('addField', options.inputs.nameId, { required: true, maxlength: 256 }, '.field-item.name .field-item-validation');
			button.evolutionValidation('addField', options.inputs.descriptionId, { required: false, maxlength: 256 }, '.field-item.description .field-item-validation');
			button.evolutionValidation('addField', $(options.inputs.address), { required: true, maxlength: 256 }, $(options.inputs.address).closest('.field-item').find('.field-item-validation'), null)
			button.evolutionValidation('addField', $(options.inputs.address), {
				required: true,
				pattern: /^[A-Za-z0-9_-]+$/,
				messages: {
					pattern: options.text.addressPatternMessage
				}
			}, $(options.inputs.address).closest('.field-item').find('.field-item-validation'), null);

			if (options.canDelete == 'True') {
				deleteButton = $('a.delete', $.telligent.evolution.administration.panelWrapper());

				deleteButton.on('click', function () {
					if (window.confirm(options.resources.deleteConfirmation)) {
						$.telligent.evolution.post({
							url: options.urls.delete,
							data: {
							  ApplicationId: options.applicationId
							},
							success: function (response) {
								if (options.redirect == 'True') {
    								window.location.href = options.urls.groupRedirect;
    							}
							}
						});
					}
					return false;
				});
			}

			options.inputs.group = $(options.inputs.groupId)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchGroups(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});
	        options.inputs.group.on('glowLookUpTextBoxChange', button.evolutionValidation('addCustomValidation', 'requiredGroup', function () {
		            return options.inputs.group.glowLookUpTextBox('count') > 0;
		        },
				options.resources.requiredText,
				'.field-item.group .field-item-validation',
				null));

			if (options.groupName && options.groupId > 0) {
				var initialLookupValue = options.inputs.group.glowLookUpTextBox('createLookUp',
					options.groupId,
					options.groupName,
					options.groupName,
					true);
				options.inputs.group.glowLookUpTextBox('add', initialLookupValue);
			};

			options.tagFilterInputs = {};
			$('#' + options.wrapperId + ' .field-item.tag-filter input').each(function() {
			   var tb = $(this);
			   var parentId = tb.closest('.field-item.tag-filter').data('parenttagid');
			   options.tagFilterInputs[parentId] = tb;

			   tb.glowLookUpTextBox({
			        delimiter: ',',
					allowDuplicates: false,
					maxValues: 100,
					onGetLookUps: function(tb, searchText) {
						searchTags(options, parentId, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''
			   });

			   var selected = options.tagFilters[parentId];
			   if (selected && selected.length > 0) {
			       for(var i = 0; i < selected.length; i++) {
			           var initialLookupValue = tb.glowLookUpTextBox('createLookUp',
        					selected[i].id,
        					selected[i].name,
        					selected[i].name,
        					true);
        				tb.glowLookUpTextBox('add', initialLookupValue);
			       }
			   }
			});

            options.inputs.navigationTag = $(options.inputs.navigationTagId)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: false,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchTags(options, null, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''
				});

			if (options.navigationTag) {

				var initialLookupValue = options.inputs.navigationTag.glowLookUpTextBox('createLookUp',
					options.navigationTag.id,
					options.navigationTag.name,
					options.navigationTag.name,
					true);
				options.inputs.navigationTag.glowLookUpTextBox('add', initialLookupValue);
			};
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.knowledgeCollectionOptions = api;

})(jQuery, window);