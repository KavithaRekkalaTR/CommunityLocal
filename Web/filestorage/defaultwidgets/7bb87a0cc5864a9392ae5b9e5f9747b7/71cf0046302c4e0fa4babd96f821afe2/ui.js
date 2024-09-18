(function($){

	var _resendVerification = function(context, data) {
		$.telligent.evolution.post({
			url: context.urls.resend,
			data: data,
			success: function(response) {
				$.telligent.evolution.notifications.show(context.messages.resent, {});
			}
		});
	},
	_verifyKey = function(context) {
		$.telligent.evolution.post({
			url: context.urls.verifykey,
			data: {
			    key: context.key
			},
			success: function(response) {
			    var jsonResponse = JSON.parse(response);
			    if(jsonResponse.result === "Verified")
			    {
    				$.telligent.evolution.notifications.show(context.messages.verified, {type: 'success'});
    				if(jsonResponse.isNew === true)
			        {
    				    window.location.replace(context.urls.login + context.urls.returnUrl);
			        }
			        else
			        {
			             window.location.replace(context.urls.login);
			        }
			    }
			    else if(jsonResponse.result === "AlreadyVerified")
			    {
    				$.telligent.evolution.notifications.show(context.messages.alreadyverified, {type: 'success'});
    				window.location.replace(context.urls.home);
			    }
			    else
			    {
    				$.telligent.evolution.notifications.show(context.messages.invalid_short, {type: 'error'});
    				$(context.selectors.message).text(context.messages.invalid);
    				$(context.selectors.message).show();
			    }
			}
		});	    
	};

	var api = {
		register: function(context) {
            $(context.selectors.message).hide();
		    if(context.key !== "")
		    {
                _verifyKey(context);
		    }
		    
			$(context.selectors.resendEmailLink).each(function(index) {
                $(this).on('click', function(e)
                {
                    e.preventDefault();
                    var data = {
            			userId: $(this).data('user'),
            			context: $(this).data('context')
            		};
        			_resendVerification(context, data);
                })
            });
		}
	};

	// expose api in a public namespace
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.verifyEmail = api;

}(jQuery));