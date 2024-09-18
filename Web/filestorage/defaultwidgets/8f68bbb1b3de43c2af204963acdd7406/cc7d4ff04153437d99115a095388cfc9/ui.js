(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	function filterScopes(context, searchText) {
		global.clearTimeout(context.searchTimeout);
		context.searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0) {
				$('tr.scope-entity', context.wrapper).show();
				$('.field-item.scope-group', context.wrapper).show();
			} else {
				var searchTerms = searchText.split(' ');
				var isMatch = function(text) {
    			    var match = true;
    				for (var i = 0; i < searchTerms.length; i++) {
    					if (text.indexOf(searchTerms[i]) == -1) {
    						match = false;
    						break;
    					}
    				}
    				
    				return match;
    			}
				
				$('tr.scope-entity', context.wrapper).each(function() {
					var cft = $(this);
					if (isMatch(cft.data('text'))) {
						cft.show();
					} else {
						cft.hide();
					}
				});

				$('.field-item.scope-group', context.wrapper).each(function() {
					var visibleItems = $(this).find('tr.scope-entity').filter(":visible");
					if (visibleItems.length == 0 && !isMatch($(this).data('text'))) {
						$(this).hide();
					} else {
						$(this).show();
					}
				});
			}
			
			if ($('.field-item.scope-group', context.wrapper).filter(":visible").length == 0) {
				$('.message.norecords', context.wrapper).show();
			}
			else {
				$('.message.norecords', context.wrapper).hide();
			}
		}, 125);
	}
	
	function updateScopeGroupState(cb) {
	   if(cb.is(':checked')) {
        cb.closest('.field-item.scope-group').find('.scope-entities').slideUp('fast');
       } else {
        cb.closest('.field-item.scope-group').find('.scope-entities').slideDown('fast');
       }
	}

	$.telligent.evolution.widgets.apiKeyScopes = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();
			
			context.fields.save = $('.button.save', context.headerWrapper);

			context.fields.findScopes.on('input', function() {
				filterScopes(context, $(this).val());
			});
			
		    context.wrapper.on('change', 'input.scope-group', function() {
		       updateScopeGroupState($(this));
		    });
		    
		    context.wrapper.find('input.scope-group').each(function() {
		       updateScopeGroupState($(this)); 
		    });

            context.fields.save.on('click', function(e) {
				if (!context.isSaving) {
					context.isSaving = true;
					context.fields.save.addClass('disabled');
					
					// clear the search
					context.fields.findScopes.val('');
					$('tr.scope-entity', context.wrapper).show();
				    $('.field-item.scope-group', context.wrapper).show();

			        var allowedScopes = [];
			        $('.field-item.scope-group input[type="checkbox"]:visible:checked', context.wrapper).each(function() {
			           allowedScopes.push(encodeURIComponent($(this).val())); 
			        });

					$.telligent.evolution.post({
					    url: context.urls.save,
					    data: {
					        allowedScopes: allowedScopes.join('&')
					    }
					})
					    .then(function(client) {
					        $.telligent.evolution.notifications.show(context.text.savedSuccessfully, { type: 'success' });
					    })
					    .always(function() {
					        context.isSaving = false;
					        context.fields.save.removeClass('disabled');
					    });
				}
				
				return false;
			});
		}
	};

}(jQuery, window));