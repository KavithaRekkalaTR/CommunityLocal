(function ($, global) {
    if (typeof $.telligent === 'undefined') { $.telligent = {}; }
    if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
    if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    function resetList(context) {
        context.pageIndex = -1;
        context.hasMore = true;
        context.isLoadingMore = true;
        context.thumbnailsContainer.evolutionMasonry('empty');
        $('.message.norecords', context.wrapper).remove();
        context.loading.show();

        var membershipType = context.membershipType, query = context.query, pageIndex = context.pageIndex;

        $.telligent.evolution.get({
			url: context.loadUrl,
			data: {
			    w_membershiptype: context.membershipType,
			    w_query: context.query,
			    w_pageindex: context.pageIndex + 1
			}
		}).then(function(response){
		    if (context.membershipType == membershipType && context.query == query && context.pageIndex == pageIndex) {
		        var r = $(response);
		        var newContainer = r.filter('div.content-list');
    			var items = r.find('div.content-item.thumbnail');
    			context.hasMore = items.data('hasmore') == 'True';
    			context.thumbnailsContainer.after(r);
    			if (newContainer.length > 0) {
    			    context.thumbnailsContainer.remove();
    			    context.thumbnailsContainer = newContainer;
    			    setupClickHandler(context);
    			}
    			context.pageIndex++;
		    }
		}).always(function() {
		    if (context.membershipType == membershipType && context.query == query && context.pageIndex == pageIndex + 1) {
		        context.isLoadingMore = false;
		    }
		    context.loading.hide();
		});
    }
    
    function setupClickHandler(context) {
        context.thumbnailsContainer
			.on('click', '.content-item', function(e){
				var elm = $(this);
				var url = elm.data('url');
				if (url) {
					window.location = url;
				}
			});
    }

	function setupEndlessPaging(context) {
		$(document).on('scrollend', function(e){
			if(context.isLoadingMore || !context.hasMore)
				return;

			context.isLoadingMore = true;
			context.loading.show();

            var membershipType = context.membershipType, query = context.query, pageIndex = context.pageIndex;

			$.telligent.evolution.get({
				url: context.loadUrl,
				data: {
    			    w_membershiptype: context.membershipType,
    			    w_query: context.query,
			        w_pageindex: context.pageIndex + 1
    			}
			}).then(function(response){
			    if (context.membershipType == membershipType && context.query == query && context.pageIndex == pageIndex) {
    				var items = $(response).find('div.content-item.thumbnail');
    				context.hasMore = items.data('hasmore') == 'True';
    				context.thumbnailsContainer.evolutionMasonry('append', items);
    				context.pageIndex++;
			    }
			}).always(function() {
			    if (context.membershipType == membershipType && context.query == query && context.pageIndex == pageIndex + 1) {
			        context.isLoadingMore = false;
			        context.loading.hide();
			    }
			});
		});
	};

    $.telligent.evolution.widgets.groupMembersList = {
        register: function (context) {
            context.pageIndex = 0;
            context.hasMore = context.hasMore == 'True';
            context.isLoadingMore = false;
            context.query = '';
            context.membershiptype = '';
            context.loading = $('.ui-loading', context.wrapper).hide();
            
        	setupEndlessPaging(context);
        	setupClickHandler(context);
				
			context.membershipTypeFilter.on('change', function() {
			    context.membershipType = context.membershipTypeFilter.val();
			    resetList(context);
			});
			
			$.telligent.evolution.messaging.subscribe('search.ready', function(ctx) {
    			ctx.init({
    				initialQuery: '',
    				placeholder: context.searchPlaceholder,
    				customResultRendering: true
    			});
    		});
    
    		$.telligent.evolution.messaging.subscribe('search.query', function(ctx) {
    			context.query = ctx.value;
    			resetList(context);
    		});
        }
    };
})(jQuery, window);