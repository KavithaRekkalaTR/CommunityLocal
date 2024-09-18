(function($, global, undef) {
	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	var api = {
		register: function(context) {
			$.telligent.evolution.administration.size('wide');

		    context.wrapper = $.telligent.evolution.administration.panelWrapper();
			context.header = $($.telligent.evolution.template.compile(context.templates.header)({}));
			$.telligent.evolution.administration.header(context.header);

			var viewidentifiers = $('a.viewidentifiers', context.wrapper);
			viewidentifiers.on('click', function () {
				$('li.identifiers', context.wrapper).each( function() {
					$(this).toggle();
				});
				return false;
			});
			
			var lookupTimeout = null;
			context.fields.defaultArticle.glowLookUpTextBox({
				'maxValues': 1,
				'emptyHtml': '',
				'onGetLookUps': function (tb, searchText) {
					window.clearTimeout(lookupTimeout);
					if (searchText && searchText.length >= 2) {
						tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
						lookupTimeout = window.setTimeout(function () {
							$.telligent.evolution.post({
								url: context.urls.getArticles,
								data: { 
								    query: searchText, 
								    articleCollectionId: context.articleCollectionId
								},
								success: function (response) {
									if (response && response.matches.length > 0) {
										var suggestions = [];
										for (var i = 0; i < response.matches.length; i++)
											suggestions[suggestions.length] = tb.glowLookUpTextBox('createLookUp', response.matches[i].id, response.matches[i].title, response.matches[i].title, true);
											
										tb.glowLookUpTextBox('updateSuggestions', suggestions);
									}
									else
										tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noMatchingArticles, context.text.noMatchingArticles, false)]);
								}
							});
						}, 250);
					}
				},
				'selectedLookUpsHtml': (context.values.defaultArticleName ? [context.values.defaultArticleName] : [])
			});

			var saveButton = context.header.find('a.save');
			saveButton.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
				    var data = {
				        CollectionId: context.articleCollectionId,
				        Name: context.fields.name.val(),
				        Description: context.getDescription(),
				        IsEnabled: context.fields.enable.is(':checked'),
				        UrlKey: context.fields.urlKey.val()
				    }
				    
					var groupId = context.fields.group.glowLookUpTextBox('getByIndex', 0);
					if (groupId) {
					    data.GroupId = groupId.Value;
					} else {
					    data.RemoveGroupId = true;
					}
					
					var defaultArticleId = context.fields.defaultArticle.glowLookUpTextBox('getByIndex', 0);
					if (defaultArticleId) {
					    data.DefaultArticleId = defaultArticleId.Value;
					} else {
					    data.RemoveDefaultArticleId = true;
					}
					
					$.telligent.evolution.put({
                        url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/collections/{CollectionId}.json',
                        data: data
                    })
                        .then(function(response) {
                            $.telligent.evolution.notifications.show(context.text.updateSuccess, { type: 'success' });

							if (data.IsEnabled && (context.groupId != data.GroupId || context.urlKey != data.UrlKey)) {
								global.location.href = response.ArticleCollection.Url;
							}
							else if (!data.IsEnabled && context.redirect) {
								global.location.href = context.urls.group;
							} 
                        });
				}
			})
			.evolutionValidation('addField', context.fields.name, { required: true, maxlength: 256 }, context.fields.name.closest('.field-item').find('.field-item-validation'), null)
			.evolutionValidation('addField', context.fields.urlKey, {
				required: true,
				maxlength: 256,
				pattern: /^[A-Za-z0-9_-]+$/,
				messages: {
					pattern: context.text.addressPatternMessage
				}
			}, context.fields.urlKey.closest('.field-item').find('.field-item-validation'), null);

			context.fields.group.glowLookUpTextBox({
				delimiter: ',',
				allowDuplicates: true,
				maxValues: 1,
				onGetLookUps: function(tb, searchText) {
					if(searchText && searchText.length >= 2) {
        				tb.glowLookUpTextBox('updateSuggestions', [
        					tb.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
        				]);
        
        				$.telligent.evolution.get({
        					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups.json',
        					data: {
        						GroupNameFilter: searchText,
        						Permission: 'Group_ReadGroup'
        					},
        					success: function(response) {
        						if (response && response.Groups && response.Groups.length >= 1) {
        							tb.glowLookUpTextBox('updateSuggestions',
        								$.map(response.Groups, function(group, i) {
        									return tb.glowLookUpTextBox('createLookUp', group.Id, group.Name, group.Name, true);
        								}));
        						} else {
        							tb.glowLookUpTextBox('updateSuggestions', [
        								tb.glowLookUpTextBox('createLookUp', '', context.text.noGroupsMatch, context.text.noGroupsMatch, false)
        							]);
        						}
        					}
        				});
        			}
				},
				emptyHtml: '',
				selectedLookUpsHtml: [],
				deleteImageUrl: ''
			});

			if (context.groupName) {
				var initialLookupValue = context.fields.group.glowLookUpTextBox('createLookUp',
					context.groupId,
					context.groupName,
					context.groupName,
					true);
					
				context.fields.group.glowLookUpTextBox('add', initialLookupValue);
			}

	        context.fields.group.on('glowLookUpTextBoxChange', saveButton.evolutionValidation('addCustomValidation', 'requiredGroup', function () {
				return context.fields.group.glowLookUpTextBox('count') > 0;
			},
			context.text.requiredText,
			'.field-item.group .field-item-validation',
			null));			

			$.telligent.evolution.messaging.subscribe('contextual-delete', function(){
				if(confirm(context.text.deleteConfirm)) {
					$.telligent.evolution.del({
                        url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/collections/{CollectionId}.json',
                        data: {
                            CollectionId: context.articleCollectionId
                        }
                    })
                        .then(function(r) {
                            window.location.href = context.urls.group;
                        });
				}
			});

		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articleCollectionOptionsApplicationPanel = api;

})(jQuery, window);