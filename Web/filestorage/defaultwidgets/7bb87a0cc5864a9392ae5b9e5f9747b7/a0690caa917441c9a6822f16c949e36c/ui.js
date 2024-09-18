(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var setupEndlessScrolling = function(context) {
		var isLoadingMore = false, pageIndex = 0, hasMore = context.hasMore == 'True';
		$(document).on('scrollend', function(e){
			if(isLoadingMore || !hasMore)
				return;

			isLoadingMore = true;

			var data = {}
			data[context.pageIndexKey] = pageIndex + 2;

			$.telligent.evolution.get({
				url: context.loadUrl,
				data: data
			}).then(function(response){
				isLoadingMore = false;
				var items = $(response).find('div.content-item.thumbnail');
				hasMore = items.data('hasmore') == 'True';
				context.thumbnailsContainer.evolutionMasonry('append', items);
				pageIndex++;
			});
		});
	};

    $.telligent.evolution.widgets.achievementUserList = {
        register: function (context) {
        	setupEndlessScrolling(context);
        	
        	context.thumbnailsContainer
				.on('click', '.content-item', function(e){
    					var elm = $(this);
    					var url = elm.data('url');
    					if (url) {
    						window.location = url;
					}
				});
        }
    };
})(jQuery, window);
