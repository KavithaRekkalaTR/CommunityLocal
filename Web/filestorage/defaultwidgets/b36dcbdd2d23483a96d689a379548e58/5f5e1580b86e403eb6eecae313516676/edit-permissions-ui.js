(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.oauthClientsEditPermissions = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();
			
			context.fields = {
			    save: context.headerWrapper.find('a.save')
			};

            context.fields.save.on('click', function() {
				if (!context.isSaving) {
					context.isSaving = true;
					context.fields.save.addClass('disabled');
					
					var permissionIds = [];
					$('input[type="checkbox"]', context.wrapper).each(function() {
					   var cb = $(this);
					   if (cb.is(':checked') && cb.data('permissionid')) {
                            permissionIds.push(cb.data('permissionid'));
					   }
					});

					$.telligent.evolution.post({
					    url: context.urls.save,
					    data: {
					        clientid: context.clientId,
					        roleid: context.roleId,
					        grantedPermissionIds: permissionIds.join(',')
					    }
					})
					    .then(function(client) {
					        $.telligent.evolution.notifications.show(context.text.permissionsSavedSuccessfully, { type: 'success' });
					        $.telligent.evolution.administration.close();
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