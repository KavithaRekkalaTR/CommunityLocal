(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    function updateVisibleTab(context) {
		var e = context.headerWrapper.find('.filter-option.selected a[data-tab]');
		var tab = context.wrapper.find('.tab.' + e.data('tab'));
		tab.siblings('.tab').css({
			visibility: 'hidden',
			height: '100px',
			width: '800px',
			left: '-1000px',
			position: 'absolute',
			overflow: 'hidden',
			top: '-1000px'
		});
		tab.css({
		   visibility: 'visible',
			height: 'auto',
			width: 'auto',
			left: '0',
			position: 'static',
			overflow: 'visible',
			top: '0'
		});
		$.fn.uilinks.forceRender();

		$.telligent.evolution.administration.header();
	}

	function showSecret(context, secret) {
	    context.fields.secret.find('code').text(secret);
	    context.fields.secret.show();
	    context.fields.secretWarning.hide();
	}
	
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

	$.telligent.evolution.widgets.apiKeyAddEdit = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();
			
			context.headerWrapper.on('click', '.filter-option a', function() {
				var e = $(this);
				e.parent().siblings('.filter-option').removeClass('selected');
				e.parent().addClass('selected');

				updateVisibleTab(context);

				return false;
			});
			updateVisibleTab(context);

			context.fields.name = $(context.fieldIds.name);
            context.fields.secret = $(context.fieldIds.secret);
            context.fields.secretWarning = $(context.fieldIds.secretWarning);
            context.fields.save = $('.button.save', context.headerWrapper);


			context.fields.findScopes.on('input', function() {
				filterScopes(context, $(this).val());
			});
            
            context.fields.save.evolutionValidation({
				validateOnLoad: context.id != null,
				onValidated: function (isValid, buttonClicked, c) {
					if (isValid && !context.isSaving) {
						context.fields.save.removeClass('disabled');
					} else {
						context.fields.save.addClass('disabled');
					}
				},
				onSuccessfulClick: function (e) {
					if (!context.isSaving) {
						context.isSaving = true;
						context.fields.save.addClass('disabled');
						
						var data = {
					        id: context.id == null ? '' : context.id,
					        name: context.fields.name.val()
					    };
					    
					    if (context.id) {
					       // clear the search
        					context.fields.findScopes.val('');
        					$('tr.scope-entity', context.wrapper).show();
        				    $('.field-item.scope-group', context.wrapper).show();
        
        			        var allowedScopes = [];
        			        $('.field-item.scope-group input[type="checkbox"]:visible:checked', context.wrapper).each(function() {
        			           allowedScopes.push(encodeURIComponent($(this).val())); 
        			        });
        			        
					        data.allowedScopes = allowedScopes.join('&');
					    }

						$.telligent.evolution.post({
						    url: context.urls.save,
						    data: data
						})
						    .then(function(apiKey) {
						        $.telligent.evolution.notifications.show(context.text.savedSuccessfully, { type: 'success' });
						        $.telligent.evolution.messaging.publish('apikeys.saved', {
						            apiKey: apiKey
						        });
						        $.telligent.evolution.administration.close();
						    })
						    .always(function() {
						        context.isSaving = false;
						        context.fields.save.removeClass('disabled');
						    });
					}
					
					return false;
				}
			});

			context.fields.save.evolutionValidation('addField', context.fieldIds.name, {
				required: true
			}, context.fieldIds.nameValidation, { tab: 0 });
			
			$.telligent.evolution.messaging.subscribe('apikey.delete', function (data) {
				var id = $(data.target).data('id');
				var name = $(data.target).data('name');
				if (global.confirm(context.text.verifyDelete.replace(/\{0\}/g, name))) {
				    $.telligent.evolution.post({
				        url: context.urls.del,
				        data: {
				            id: id
				        }
				    })   
				        .then(function() {
				            $.telligent.evolution.notifications.show(context.text.deletedSuccessfully.replace(/\{0\}/g, name), { type: 'success' }); $.telligent.evolution.notifications.show(context.text.clientDeletedSuccessfully.replace(/\{0\}/g, clientName), { type: 'success' });
				            $.telligent.evolution.messaging.publish('apikeys.refresh', {});
                            $.telligent.evolution.administration.close();
				        });
				} 
			});
			
			$.telligent.evolution.messaging.subscribe('apikey.regeneratesecret', function (data) {
				var id = $(data.target).data('id');
				var name = $(data.target).data('name');
				if (global.confirm(context.text.verifyRegenerateSecret.replace(/\{0\}/g, name))) {
				    $.telligent.evolution.post({
				        url: context.urls.regenerateSecret,
				        data: {
				            id: id
				        }
				    })   
				        .then(function(apiKey) {
				            $.telligent.evolution.notifications.show(context.text.secretRegeneratedSuccessfully.replace(/\{0\}/g, name), { type: 'success' });
				            showSecret(context, apiKey.secret);
				        });
				}
			});
			
			if (global._apiKeysTemporarySecret) {
			    var secret = global._apiKeysTemporarySecret;
			    global._apiKeysTemporarySecret = null;
			    showSecret(context, secret);
			    $.telligent.evolution.notifications.show(context.text.noteSecret, { type: 'success' });
			}

		}
	};

}(jQuery, window));