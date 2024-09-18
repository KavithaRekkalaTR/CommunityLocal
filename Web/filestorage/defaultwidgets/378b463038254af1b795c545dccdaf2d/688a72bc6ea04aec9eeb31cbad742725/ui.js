(function($, global, undef) {

    var spinner = '<span class="ui-loading" width="48" height="48"></span>';

    function showMigrateWiki(context) {
        var button = context.header.find('.button.save');
	    if (window.confirm(context.text.migrateWikiConfirmation.replace(/\{0\}/g, context.sourceWikiName))) {
    	    $.telligent.evolution.administration.open({
    	        name: context.text.migrateWiki.replace(/\{0\}/g, context.sourceWikiName),
    	        content: $.telligent.evolution.post({
    	            url: context.urls.migrateWiki,
    	            data: {
    	                id: context.sourceWikiId,
    	            },
    	        })
    	    });
	    }
	    
	    button.addClass('disabled');
		
	}
	
	function migrationComplete(context, data) {
	    if (global.confirm(context.text.success)) {
            	global.location = data.url;
            } else {
                global.location = context.urls.groupRedirect;
            }
	}
	
	var api = {
		register: function(context) {

		    context.header = $($.telligent.evolution.template.compile(context.headerTemplate)({}));
			$.telligent.evolution.administration.header(context.header);

			$.telligent.evolution.messaging.subscribe('contextual-save', function(data) {
			    showMigrateWiki(context);
			});
			
			$.telligent.evolution.messaging.subscribe('migration.complete', function(data) {
			   migrationComplete(context, data);
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.wikiToArticleMigrationPanel = api;

})(jQuery, window);