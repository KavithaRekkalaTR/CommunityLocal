(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	
	function filter(context) {
	    global.clearTimeout(context.filterTimeout);
		context.filterTimeout = global.setTimeout(function() {
			var searchText = $.trim(context.fields.filter.val() || '').toLowerCase();
			var redirected = context.fields.redirect.val();
			
			var searchTerms = searchText.split(' ');
			$('.field-item', context.fields.overrides).each(function() {
				var o = $(this);
				var text = o.data('text');
				var match = true;
				if (searchText.length > 0) {
					for (var i = 0; i < searchTerms.length; i++) {
						if (text.indexOf(searchTerms[i]) == -1) {
							match = false;
							break;
						}
					}
				}
				if (redirected == 'WithRedirect') {
				    if (o.data('redirected') != true) {
				        match = false;
				    }
				} else if (redirected == 'WithoutRedirect') {
				    if (o.data('redirected') != false) {
				        match = false;
				    }
				}
				
				if (match) {
					o.slideDown('fast');
				} else {
					o.slideUp('fast');
				}
			})
		}, 125);
	}

	$.telligent.evolution.widgets.messageRedirects = {
		register: function(context) {
			context.wrapper = $.telligent.evolution.administration.panelWrapper();
			$.telligent.evolution.administration.header($.telligent.evolution.template.compile(context.headerTemplateId)({}));

            $.telligent.evolution.messaging.subscribe('messageredirect.preview', function(e){
                var l = $(e.target);
                $.glowModal({
                    title: l.data('name'),
                    html: $.telligent.evolution.get({
                        url: context.urls.preview,
                        data: {
                            w_id: l.data('messageid')
                        }
                    }),
                    width: 400
                });
			});
			
			context.fields.filter.on('keyup paste click', function() {
				filter(context);
			});
			
			context.fields.redirect.on('change', function() {
			    filter(context);
			})
			
    		var saveButton = $('.button.save', $.telligent.evolution.administration.header());
    		saveButton.addClass('disabled');
    		saveButton.on('click', function() {
    		    if (!saveButton.hasClass('disabled')) {
    		        saveButton.addClass('disabled');
    		        
    		        var toSave = [];
    		        context.fields.overrides.find('input[type="text"]').each(function() {
    		            var i = $(this);
    		            if ($.trim(i.val()) != $.trim(i.data('originalvalue'))) {
    		                toSave.push($.Deferred(function(d) {
    		                    $.telligent.evolution.post({
    		                        url: context.urls.save,
    		                        data: {
    		                            id: i.data('messageid'),
    		                            url: $.trim(i.val())
    		                        }
    		                    })
    		                        .then(function() {
    		                            i.data('originalvalue', $.trim(i.val()));
    		                            d.resolve();
    		                        })
    		                        .catch(function() {
    		                            d.reject();
    		                        });
    		                }).promise());
    		            }
    		        });
    		        
    		        var hadSaves = toSave.length > 0;
    		        var saveNext = function() {
    		            var p = toSave.shift();
    		            if (p) {
    		                p.then(function() {
    		                    saveNext();
    		                })
    		                .catch(function() {
    		                    saveButton.removeClass('disabled');
    		                })
    		            } else if (hadSaves) {
		                    $.telligent.evolution.notifications.show(context.text.saveSuccessful, {
    		                    type: 'success'
    		                });
    		            }
    		        }
    		        
    		        saveNext();
    		    }

    		    return false;
    		});
    		
    		context.fields.overrides.on('change input', 'input[type="text"]', function() {
    		    global.clearTimeout(context.stateCheckHandle);
    		    context.stateCheckHandle = global.setTimeout(function() {
                    var hasChanges = false;
                    context.fields.overrides.find('input[type="text"]').each(function() {
                        var i = $(this);
                        var v = $.trim(i.val());
                        if (v != $.trim(i.data('originalvalue'))) {
                            hasChanges = true;
                        }
                        if (v.length > 0) {
                            i.closest('.field-item').data('redirected', true);
                        } else {
                            i.closest('.field-item').data('redirected', false);
                        }
                    });
                    if (hasChanges) {
                        saveButton.removeClass('disabled');
                    } else {
                        saveButton.addClass('disabled');
                    }
    		    }, 150);
    		});
		}
	};
}(jQuery, window));