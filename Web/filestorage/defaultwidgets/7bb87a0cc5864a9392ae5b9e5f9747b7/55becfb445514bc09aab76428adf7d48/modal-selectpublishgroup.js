(function ($, global) {
	if (typeof $.telligent === 'undefined')
		$.telligent = {};

	if (typeof $.telligent.evolution === 'undefined')
		$.telligent.evolution = {};

	if (typeof $.telligent.evolution.widgets === 'undefined')
		$.telligent.evolution.widgets = {};

	$.telligent.evolution.widgets.articleSelectPublishGroup = {
		register: function (context) {

			context.publishGroupLookupTimeout = null;
			context.fields.publishGroup.glowLookUpTextBox({
			    emptyHtml: '',
				minimumLookUpLength: 0,
				maxValues: 1,
				onGetLookUps: function (tb, searchText) {
					global.clearTimeout(context.publishGroupLookupTimeout);
					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
					context.publishGroupLookupTimeout = global.setTimeout(function () {
						$.telligent.evolution.post({
							url: context.urls.getPublishGroups,
							data: { 
							    query: searchText, 
							    articleCollectionId: context.collectionId
							},
							success: function (response) {
								if (response && response.matches.length > 0) {
									var suggestions = [];
									for (var i = 0; i < response.matches.length; i++) {
										suggestions.push(tb.glowLookUpTextBox('createLookUp', response.matches[i].id, response.matches[i].name, response.matches[i].name, true));
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
			});

			$(context.fields.cancel).on('click', function () {
				$.glowModal.close();
				return false;
			});
			
			$(context.fields.open).on('click', function () {
			    var v = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);
    	        if (v) {
    	            $.glowModal.close(JSON.stringify({
    	                id: v.Value,
    	                name: v.SelectedHtml
    	            }));
    	        } else {
    	            $.glowModal.close('');
    	        }
			});
		}
	};
})(jQuery, window);