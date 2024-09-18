(function ($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	if (typeof $.telligent.evolution.Calendar === 'undefined') { $.telligent.evolution.Calendar = {}; }
	if (typeof $.telligent.evolution.Calendar.widgets === 'undefined') { $.telligent.evolution.Calendar.widgets = {}; }

	var buttonText = "",
	_setSuccess = function (context) {
		context.successMessage.slideDown();
		global.setTimeout(function () {
			context.successMessage.fadeOut().slideUp();
		}, 9999);
	},
	_setWait = function (context) {
		context.save.prop('disabled', true);
		$('.processing').show();
	},
	_clearWait = function (context) {
		context.save.removeAttr("disabled");
		$('.processing').hide();
	},
	_save = function (context) {

		context.errorMessage.hide();
		context.successMessage.hide();

		_setWait(context);

		var data = { CalendarId: context.calendarId, Name: $(context.nameSelector).val(), Description: $(context.bodySelector).val(), GroupId: context.groupId };

		$.telligent.evolution.post({
			url: context.saveUrl,
			data: data
		}).then(function(response) {
			if (response.redirectUrl) {
				window.location = response.redirectUrl;
			}
			else {
				_setSuccess(context);
			}
			_clearWait(context);
		}, function() {
			_clearWait(context);
		});
	},
	_delete = function (context) {

		if (window.confirm(context.deleteConfirmation)){
			$.telligent.evolution.del({
				url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/calendars/{Id}.json',
				data: { Id: context.calendarId },
				success: function(response) {
					window.location = context.groupHomeUrl;
				},
				defaultErrorMessage: context.deleteErrorMessage
			});
		}
	};

	$.telligent.evolution.Calendar.widgets.addEditCalendar = {
		register: function (context) {
			buttonText = context.save.val();
			context.save.evolutionValidation({
				onValidated: function (isValid, buttonClicked, c) { if (isValid) { context.save.removeClass('disabled'); } else { context.save.addClass('disabled'); } },
				onSuccessfulClick: function (e) { _save(context); }
			}).evolutionValidation('addField', context.nameSelector, { required: true, messages: { required: context.nameRequiredMessage} }, '#' + context.wrapperId + ' .field-item.calendar-name .field-item-validation', null)
			  .evolutionValidation('addCustomValidation', context.bodySelector, function () {
				  return $(context.bodySelector, $('#' + context.wrapperId)).val().length <= 256;
			  }, context.descLengthMessage, '#' + context.wrapperId + ' .field-item.calendar-body .field-item-validation', null);

			$(context.delete).on('click', function () {
				_delete(context);
			});
		}

	};

})(jQuery, window);
