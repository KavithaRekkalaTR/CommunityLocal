(function ($, global) {
    
	var api = {
		register: function (context) {
		    
		    context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
		    
			var headingTemplate = $.telligent.evolution.template.compile(context.templates.header);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();
			
		    var data = {};
            $.telligent.evolution.messaging.publish('categorymanagement.getchanged', data);
            context.changed = data.changed;
            context.deleted = data.deleted;

            context.categoryLookupTimeout = null;
			context.fields.replaceWithCategory.glowLookUpTextBox({
				emptyHtml: '',
				minimumLookUpLength: 0,
				maxValues: 1,
				onGetLookUps: function (tb, searchText) {
					global.clearTimeout(context.categoryLookupTimeout);
					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
					context.categoryLookupTimeout = global.setTimeout(function () {
						$.telligent.evolution.get({
							url: context.urls.lookupCategories,
							data: {
							    _w_querytext: searchText
							},
							success: function (response) {
							    var suggestions = [];
							    var added = {};
							    
							    $.each(context.changed, function(id, category) {
							       if (category.id != context.articleCategoryId && Object.keys(added).length < 20 && !context.deleted[category.id] && category.name.toLowerCase().indexOf(searchText.toLowerCase()) >= 0) {
							           suggestions.push(tb.glowLookUpTextBox('createLookUp', category.id, category.name + (category.location ? ' (' + category.location + ')' : ''), category.name + (category.location ? ' (' + category.location + ')' : ''), true));
							           added[category.id] = true;
							       }
							    });

								if (response && response.matches.length > 0) {
									for (var i = 0; i < response.matches.length && Object.keys(added).length < 20; i++) {
									    if (response.matches[i].id != context.articleCategoryId && !added[response.matches[i].id] && !context.deleted[response.matches[i].id]) {
    										suggestions.push(tb.glowLookUpTextBox('createLookUp', response.matches[i].id, response.matches[i].name, response.matches[i].name, true));
    										added[response.matches[i].id] = true;
									    }
									}
								}
								
								if (suggestions.length > 0) {
									tb.glowLookUpTextBox('updateSuggestions', suggestions);
								} else {
									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noMatchingCategories, context.text.noMatchingCategories, false)]);
								}
							}
						});
					}, 500);
				},
				selectedLookUpsHtml: []
			});
			
			context.del = $.telligent.evolution.administration.header().find('.button.delete');
            context.del.on('click', function() {
                
                var replaceWithCategoryId = null;
                if (context.fields.replaceWithCategory.glowLookUpTextBox('count') > 0) {
                    replaceWithCategoryId = context.fields.replaceWithCategory.glowLookUpTextBox('getByIndex', 0).Value;
                }
                
                $.telligent.evolution.messaging.publish('article-category-delete', {
                    id: context.articleCategoryId,
                    reassignToCategoryId: replaceWithCategoryId
                });
                
                $.telligent.evolution.administration.close();
                
                return false;
            });
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.deleteCategoryPanel = api;

})(jQuery, window);