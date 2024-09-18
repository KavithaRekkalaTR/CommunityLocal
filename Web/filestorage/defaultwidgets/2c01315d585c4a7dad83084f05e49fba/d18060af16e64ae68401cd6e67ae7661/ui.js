(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function showAddForm(context) {
		$.telligent.evolution.administration.open({
			name: context.text.addApiKey,
			cssClass: 'api-key-management',
			content: $.telligent.evolution.get({
				url: context.urls.addEdit
			})
		});
	}
	
	function showEditForm(context, id, name, secret) {
	    
	    if (secret) {
	        global._apiKeysTemporarySecret = secret;
	    }
	    
	    $.telligent.evolution.administration.open({
	       name: context.text.editApiKey.replace(/\{0\}/g, name),
	       cssClass: 'api-key-management with-header-filter',
	       content: $.telligent.evolution.get({
	           url: context.urls.addEdit,
	           cache: false,
	           data: {
	               w_id: id
	           }
	       })
	    });
	}

	function refresh(context) {
		context.fields.list.html(spinner);
		$.telligent.evolution.get({
		    url: context.urls.list,
		    cache: false
		}).then(function(html) {
		    context.fields.list.html(html);
		});
	}

	$.telligent.evolution.widgets.manageApiKeys = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			$.telligent.evolution.messaging.subscribe('apikeys.add', function (data) {
				showAddForm(context);
			});
			
			$.telligent.evolution.messaging.subscribe('apikeys.edit', function (data) {
				var id = $(data.target).data('id');
				var name = $(data.target).data('name');
				showEditForm(context, id, name);
			});
			
			$.telligent.evolution.messaging.subscribe('apikeys.toggleenabled', function (data) {
				var id = $(data.target).data('id');
				var name = $(data.target).data('name');
				var enabled = $(data.target).data('enabled') == '1';
			    $.telligent.evolution.post({
			        url: context.urls.save,
			        data: {
			            id: id,
			            enabled: !enabled
			        }
			    })
			        .then(function() {
			           $(data.target).html(enabled ? context.text.enable : context.text.disable).data('enabled', enabled ? 0 : 1);
			           var el = context.fields.list.find('.content-item.apikey[data-id="' + id + '"] .attribute-item.enabled .value');
			           if (enabled) {
			               el.html(context.text.disabled).removeClass('highlight');
			           } else {
			               el.html(context.text.enabled).addClass('highlight');
			           }
			        });
			});

			$.telligent.evolution.messaging.subscribe('apikeys.delete', function (data) {
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
				            $.telligent.evolution.notifications.show(context.text.deletedSuccessfully.replace(/\{0\}/g, name), { type: 'success' });
				            refresh(context);
				        });
				}
			});
			
			$.telligent.evolution.messaging.subscribe('apikeys.regeneratesecret', function(data) {
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
				            showEditForm(context, apiKey.id, apiKey.name, apiKey.secret);
				        });
				}
			});

			$.telligent.evolution.messaging.subscribe('apikeys.refresh', function (data) {
				refresh(context);
			});

			$.telligent.evolution.messaging.subscribe('apikeys.saved', function (data) {
			    refresh(context);

				if (data.apiKey.id && data.apiKey.secret && data.apiKey.name) {
				    global.setTimeout(function() {
				        showEditForm(context, data.apiKey.id, data.apiKey.name, data.apiKey.secret);
				    }, 100);
				}
			});
		}
	};

}(jQuery, window));