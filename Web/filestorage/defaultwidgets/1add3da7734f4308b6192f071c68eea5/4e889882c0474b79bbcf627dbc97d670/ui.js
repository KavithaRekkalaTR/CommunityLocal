(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    var checkShowUrls = function(context) {
        if (context.fields.xFrameOption.filter(':checked').val() == 'ALLOW-FROM') {
            context.fields.urls.closest('.field-item').slideDown(100);
        } else {
            context.fields.urls.closest('.field-item').slideUp(100);
        }
        
        checkShowCookieNotices(context);
    }
    
    var checkShowCookieNotices = function(context){
        
        context.fields.ssoNotice.hide();
        context.fields.xframeNotice.hide();
        var siteOption = context.fields.sameSiteOption.filter(':checked').val();
        var xframeOption = context.fields.xFrameOption.filter(':checked').val();
        
        if(siteOption != 'none')
        {
            if(context.ssoEnabled){
                context.fields.ssoNotice.show();
            }
            
            if(siteOption == 'strict' || (siteOption != 'lax' || xframeOption != 'SAMEORIGIN'))
            {
                 context.fields.xframeNotice.show();
            }
        }
       
    }

	$.telligent.evolution.widgets.framing = {
		register: function(context) {
			context.wrapper = $.telligent.evolution.administration.panelWrapper();
			$.telligent.evolution.administration.header($.telligent.evolution.template.compile(context.headerTemplateId)({}));
			
		
    		var saveButton = $('.button.save', $.telligent.evolution.administration.header());
    		saveButton.on('click', function() {
    		    if (!saveButton.hasClass('disabled')) {
    		        saveButton.addClass('disabled');

    		        var urls = [];
                    $.each(context.fields.urls.val().split('\n'), function(i, v) {
                        var url = $.trim(v);
                        if (url && url.length > 0) {
                            urls.push(url);
                        }
                    });

                    var data = {
                        XFrameOption:context.fields.xFrameOption.filter(':checked').val(),
                        Urls: urls.join(' '),
                        SameSiteOption: context.fields.sameSiteOption.filter(':checked').val()
                    };

    		        $.telligent.evolution.post({
    		            url: context.urls.save,
    		            data: data
    		        })
    		            .then(function() {
    		                $.telligent.evolution.notifications.show(context.text.saveSuccessful, {
    		                    type: 'success'
    		                })
    		            })
    		            .always(function() {
    		                saveButton.removeClass('disabled');
    		            });
    		    }

    		    return false;
    		});

    		context.fields.xFrameOption.on('change', function() {
    		    checkShowUrls(context);
    		});
    		context.fields.sameSiteOption.on('change', function() {
    		   checkShowCookieNotices(context);
    		});

    		checkShowUrls(context);
    		checkShowCookieNotices(context);
		}
	};
}(jQuery, window));