(function($, global, undef) {

	var api = {
		register: function(context) {
		    context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			var headingTemplate = $.telligent.evolution.template.compile(context.templates.header);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();
			
			context.articleCollectionLookupTimeout = null;
			context.fields.articleCollection.glowLookUpTextBox({
				emptyHtml: context.text.findArticleCollection,
				minimumLookUpLength: 0,
				maxValues: 1,
				onGetLookUps: function (tb, searchText) {
					global.clearTimeout(context.articleCollectionLookupTimeout);
					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
					context.articleCollectionLookupTimeout = global.setTimeout(function () {
						$.telligent.evolution.get({
							url: context.urls.findArticleCollections,
							data: { 
							    query: searchText
							},
							success: function (response) {
								if (response && response.matches.length > 0) {
									var suggestions = [];
									for (var i = 0; i < response.matches.length; i++) {
										suggestions.push(tb.glowLookUpTextBox('createLookUp', response.matches[i].id, response.matches[i].name, response.matches[i].name, response.matches[i].selectable));
									}
									tb.glowLookUpTextBox('updateSuggestions', suggestions);
								} else {
									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noCategoryMatchesText, context.text.noCategoryMatchesText, false)]);
								}
							}
						});
					}, 500);
				},
				selectedLookUpsHtml: []
			})
				.on('glowLookUpTextBoxChange', function() {
				    if (context.fields.articleCollection.glowLookUpTextBox('getByIndex', 0)) {
				        context.save.removeClass('disabled');
				    } else {
				        context.save.addClass('disabled');
				    }
				});

            context.save = $.telligent.evolution.administration.header().find('.button.save');
            context.saving = false;
			context.save.on('click', function() {
			    if (!context.saving && !context.save.hasClass('disabled')) {
			        context.saving = true;
			        context.save.addClass('disabled');
    				$.telligent.evolution.post({
    				    url: context.urls.getCreateArticleUrl,
    				    data: {
    				        threadId: context.threadId,
    				        articleCollectionId: context.fields.articleCollection.glowLookUpTextBox('getByIndex', 0).Value
    				    }
    				})
    				    .then(function(response) {
    				        if (response && response.url) {
    				            global.location.assign(response.url);
    				        }
    				    })
    				    .always(function() {
    				        context.save.removeClass('disabled');
    				        context.saving = false;
    				    });
			    }
				return false;
			});

		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.captureThreadToArticle = api;

})(jQuery, window);