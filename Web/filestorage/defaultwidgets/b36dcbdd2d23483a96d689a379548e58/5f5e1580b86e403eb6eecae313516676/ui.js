(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function showAddForm(context) {
		$.telligent.evolution.administration.open({
			name: context.text.addClient,
			cssClass: 'administer-oauthclients',
			content: $.telligent.evolution.get({
				url: context.urls.addEdit
			})
		});
	}
	
	function showEditForm(context, clientId, clientName, secret) {
	    
	    if (secret) {
	        global._oauthClientsTemporarySecret = secret;
	    }
	    
	    $.telligent.evolution.administration.open({
	       name: context.text.editClient.replace(/\{0\}/g, clientName),
	       cssCLass: 'administer-oauthclients',
	       content: $.telligent.evolution.get({
	           url: context.urls.addEdit,
	           cache: false,
	           data: {
	               w_id: clientId
	           }
	       })
	    });
	}

	function refresh(context) {
		context.fields.clientList.html(spinner);
		$.telligent.evolution.get({
		    url: context.urls.list,
		    cache: false
		}).then(function(html) {
		    context.fields.clientList.html(html);
		});
	}

	$.telligent.evolution.widgets.oauthClients = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			$.telligent.evolution.messaging.subscribe('oauthclients.add', function (data) {
				showAddForm(context);
			});
			
			$.telligent.evolution.messaging.subscribe('oauthclients.edit', function (data) {
				var clientId = $(data.target).data('clientid');
				var clientName = $(data.target).data('clientname');
				showEditForm(context, clientId, clientName);
			});

			$.telligent.evolution.messaging.subscribe('oauthclients.delete', function (data) {
				var clientId = $(data.target).data('clientid');
				var clientName = $(data.target).data('clientname');
				
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
				            refresh(context);
				        });
				}
			});

			$.telligent.evolution.messaging.subscribe('oauthclients.refresh', function (data) {
				refresh(context);
			});

			$.telligent.evolution.messaging.subscribe('oauthclient.saved', function (data) {
			    refresh(context);

				if (data.client.clientId && data.client.secret && data.client.name) {
				    global.setTimeout(function() {
				        showEditForm(context, data.client.clientId, data.client.name, data.client.secret);
				    }, 100);
				}
			});
		}
	};

}(jQuery, window));