(function($)
{
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var _createInvite = function(context)
		{
			var data = { 
					emailAddress:context.emailInput.val(),
					message:context.messageInput.val()
				};
			
			$.telligent.evolution.post({
				url: context.createUrl,
				data: data,
				dataType: 'json',
				success: function(response)
				{
					alert(context.successMessage);
					window.location.href = context.successUrl;
				},
				defaultErrorMessage: context.createErrorMessage,
				error: function(xhr, desc, ex) 
				{ 
					$.telligent.evolution.notifications.show(desc,{type:'error'});
					context.sendButton.removeClass('disabled');
					$('.processing', context.sendButton.parent()).css("visibility", "hidden");
				}
			});
		};

	$.telligent.evolution.widgets.inviteUser =
	{
		register: function(context)
		{
			context.sendButton.evolutionValidation(
			{
				validateOnLoad : false,
				onValidated: function(isValid, buttonClicked, c) 
				{ 
					if (isValid) 
						context.sendButton.removeClass('disabled'); 
					else
						context.sendButton.addClass('disabled');
				},
				onSuccessfulClick: function(e) 
				{
					context.sendButton.addClass('disabled');
					$('.processing', context.sendButton.parent()).css("visibility", "visible");
					_createInvite(context);
					e.preventDefault();
				}
			}).evolutionValidation('addField', context.emailInput,	
			{ 
				required: true,
				emails: true
			}, '#' + context.wrapperId + ' .field-item.email-address .field-item-validation', null);
		}
	};
})(jQuery);
