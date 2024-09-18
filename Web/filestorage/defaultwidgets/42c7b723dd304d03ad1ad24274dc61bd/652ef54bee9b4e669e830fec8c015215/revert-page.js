(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.themePagesRevertPage = {
		register: function(context) {
		    if (context.hasCustomizations) {
                context.headerWrapper = $('<div></div>');
    			$.telligent.evolution.administration.header(context.headerWrapper);
    			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
    			context.headerWrapper.html(headingTemplate());
    			$.telligent.evolution.administration.header();

    			context.headerWrapper.on('click', '.revert-all', function(e) {
    			    if(global.confirm(context.text.revertAllConfirmation)) {
    			        $.telligent.evolution.post({
    			            url: context.urls.revertAllPage,
    			            data: {
    			                pagename: context.pageName,
    			                iscustom: context.isCustom
    			            }
    			        })
    			            .then(function() {
    			                $.telligent.evolution.notifications.show(context.text.revertAllSuccessful, {
                                   type: 'success'
                               });
                               $.telligent.evolution.administration.close();
    			            })
    			    }
    			    return false;
    			});
		    }

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			$.telligent.evolution.messaging.subscribe('themepages.revertapplicationoverride', function(data){
				var id = $(data.target).data('applicationid');
				var name = $(data.target).data('applicationname');

                if (global.confirm(context.text.revertApplicationConfirmation.replace(/\{0\}/g, name))) {
                    $.telligent.evolution.post({
                        url: context.urls.revertApplicationPage,
                        data: {
                            pagename: context.pageName,
                            iscustom: context.isCustom,
                            applicationid: id
                        }
                    })
                        .then(function() {
                           $.telligent.evolution.notifications.show(context.text.revertApplicationSuccessful.replace(/\{0\}/g, name), {
                               type: 'success'
                           });
                           var parent = $(data.target).closest('.content-item');
                           parent.slideUp('fast', function() {
                               parent.remove();
                           })
                        });
                }
			});
		}
	};

}(jQuery, window));