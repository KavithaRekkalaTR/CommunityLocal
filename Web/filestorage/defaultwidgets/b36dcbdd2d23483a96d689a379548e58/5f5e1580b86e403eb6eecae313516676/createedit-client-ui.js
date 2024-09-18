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
	
	function updateAuthorizationTypes(context) {
	    if (context.fields.clientType.filter(':checked').val() == 'Confidential') {
	        context.fields.authorizationCode.removeAttr('disabled');
	        context.fields.clientCredentials.removeAttr('disabled');
	    } else {
	        context.fields.clientCredentials.attr('disabled', true);
	    }
	}
	
	function updateTrusted(context) {
	    if (context.fields.authorizationCode.is(':checked') && !context.fields.authorizationCode.attr('disabled')) {
	        context.fields.trusted.removeAttr('disabled');
	    } else {
	        context.fields.trusted.attr('disabled', true);
	    }
	}
	
	function showSecret(context, secret) {
	    context.fields.secret.find('code').text(secret);
	    context.fields.secret.show();
	    context.fields.secretWarning.hide();
	}

	$.telligent.evolution.widgets.oauthClientsCreateEdit = {
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
			
			context.fields = {
			    name: $(context.fieldIds.name),
                description: $(context.fieldIds.description),
                mainUrl: $(context.fieldIds.mainUrl),
                callbackUrl: $(context.fieldIds.callbackUrl),
                clientType: $('input[type="radio"][name="' + context.fieldIds.clientType + '"]', context.wrapper),
                authorizationCode: $(context.fieldIds.authorizationCode),
                password: $(context.fieldIds.password),
                clientCredentials: $(context.fieldIds.clientCredentials),
                trusted: $(context.fieldIds.trusted),
                secret: $(context.fieldIds.secret),
                secretWarning: $(context.fieldIds.secretWarning),
                moderated: $(context.fieldIds.moderated),
                save: $('.button.save', context.headerWrapper),
                findScopes: $(context.fieldIds.findScopes)
			};
			
			context.fields.findScopes.on('input', function() {
				filterScopes(context, $(this).val());
			});
			
			context.wrapper.on('change', 'input.scope-group', function() {
		       updateScopeGroupState($(this));
		    });
		    
		    context.wrapper.find('input.scope-group').each(function() {
		       updateScopeGroupState($(this)); 
		    });
			
			updateAuthorizationTypes(context);
			context.fields.clientType.on('change', function() {
			    updateAuthorizationTypes(context);
			    updateTrusted(context);
			});
			
            updateTrusted(context);
            context.fields.authorizationCode.on('change', function() {
                updateTrusted(context);
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
						
						var grantTypes = [];
						if (context.fields.authorizationCode.is(':checked')) {
						    grantTypes.push('AuthorizationCode');
						}
						if (context.fields.password.is(':checked')) {
						    grantTypes.push('Password');
						}
						if (context.fields.clientCredentials.is(':checked')) {
						    grantTypes.push('ClientCredentials');
						}
						
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
						        clientid: context.clientId == null ? '' : context.clientId,
						        name: context.fields.name.val(),
						        description: context.fields.description.val(),
						        mainUrl: context.fields.mainUrl.val(),
						        callbackUrl: context.fields.callbackUrl.val(),
						        clientType: context.fields.clientType.filter(':checked').val(),
						        grantTypes: grantTypes.join(','),
						        trusted: context.fields.trusted.is(':checked'),
						        moderated: context.fields.moderated.is(':checked'),
						        allowedScopes: allowedScopes.join('&')
						    }
						})
						    .then(function(client) {
						        $.telligent.evolution.notifications.show(context.text.clientSavedSuccessfully, { type: 'success' });
						        $.telligent.evolution.messaging.publish('oauthclient.saved', {
						            client: client
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
			
			context.fields.save.evolutionValidation('addField', context.fieldIds.mainUrl, {
				required: true,
				pattern: /^(?:(http|https)\:\/\/|(?:[a-zA-Z](?:[a-zA-Z0-9]|\+|\-|\.)*:)).*/,
				messages: {
				    pattern: context.text.mainUrlPatternValidation
				}
			}, context.fieldIds.mainUrlValidation, { tab: 0 });
			
			context.fields.save.evolutionValidation('addField', context.fieldIds.callbackUrl, {
				required: true,
				pattern: /^(?:(http|https)\:\/\/|(?:[a-zA-Z](?:[a-zA-Z0-9]|\+|\-|\.)*:)).*/,
				messages: {
				    pattern: context.text.callbackUrlPatternValidation
				}
			}, context.fieldIds.callbackUrlValidation, { tab: 0 });


			$.telligent.evolution.messaging.subscribe('oauthclient.delete', function (data) {
				var clientId = $(data.target).data('clientid');
				var clientName = $(data.target).data('clientname');
				
				if (global.confirm(context.text.verifyDelete.replace(/\{0\}/g, clientName))) {
				    $.telligent.evolution.post({
				        url: context.urls.del,
				        data: {
				            clientId: clientId
				        }
				    })   
				        .then(function() {
				            $.telligent.evolution.notifications.show(context.text.clientDeletedSuccessfully.replace(/\{0\}/g, clientName), { type: 'success' });
				            $.telligent.evolution.messaging.publish('oauthclients.refresh', {});
                            $.telligent.evolution.administration.close();
				        });
				}
			});
			
			$.telligent.evolution.messaging.subscribe('oauthclient.regeneratesecret', function (data) {
				var clientId = $(data.target).data('clientid');
				var clientName = $(data.target).data('clientname');
				if (global.confirm(context.text.verifyRegenerateSecret.replace(/\{0\}/g, clientName))) {
				    $.telligent.evolution.post({
				        url: context.urls.regenerateSecret,
				        data: {
				            clientId: clientId
				        }
				    })   
				        .then(function(client) {
				            $.telligent.evolution.notifications.show(context.text.clientSecretRegeneratedSuccessfully.replace(/\{0\}/g, clientName), { type: 'success' });
				            showSecret(context, client.secret);
				        });
				}
			});
			
			$.telligent.evolution.messaging.subscribe('oauthclient.editrole', function (data) {
				var roleId = $(data.target).data('roleid');
				var roleName = $(data.target).data('rolename');

				$.telligent.evolution.administration.open({
        			name: context.text.editRole.replace(/\{0\}/, roleName),
        			cssClass: 'administer-oauthclients',
        			content: $.telligent.evolution.get({
    			        url: context.urls.editRolePermissions,
    			        cache: false,
    			        data: {
    			            w_clientid: context.clientId,
    			            w_roleid: roleId
    			        }
    			    })
				});
			});
			
			if (global._oauthClientsTemporarySecret) {
			    var secret = global._oauthClientsTemporarySecret;
			    global._oauthClientsTemporarySecret = null;
			    showSecret(context, secret);
			    $.telligent.evolution.notifications.show(context.text.noteClientSecret, { type: 'success' });
			}

		}
	};

}(jQuery, window));