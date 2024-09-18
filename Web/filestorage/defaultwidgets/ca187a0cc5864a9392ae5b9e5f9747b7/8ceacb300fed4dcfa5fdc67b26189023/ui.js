(function ($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	if (typeof $.telligent.evolution.Calendar === 'undefined') { $.telligent.evolution.Calendar = {}; }
	if (typeof $.telligent.evolution.Calendar.widgets === 'undefined') { $.telligent.evolution.Calendar.widgets = {}; }

	var buttonText = "",
	 _setError = function (context) {
		 context.errorMessage.slideDown();
		 global.setTimeout(function () {
			 context.errorMessage.fadeOut().slideUp();
		 }, 9999);
	 },
	_setSuccess = function (wrapper) {
		wrapper.slideUp(function () {
			wrapper.slideDown();
		});
	},
	_setWait = function (context, button) {
		var spinner = '<span class="ui-loading" width="48" height="48"></span>';
		button.prop('disabled', true);
		buttonText = button.val();
		button.val(context.processingMessage);
		$('.processing', $('#' + context.wrapperId)).html(spinner).show();
	},
	_clearWait = function (context, button) {
		button.removeAttr("disabled");
		button.val(buttonText);
		$('.processing', $('#' + context.wrapperId)).html('').hide();
	},
	_attachHandlers = function (context) {
		$cancelWithCode = $(context.elements.cancelWithCode);
		$cancelWithCode.evolutionValidation({
			onValidated: function (isValid, buttonClicked, c) { if (isValid) { $cancelWithCode.removeClass('disabled'); } else { $cancelWithCode.addClass('disabled'); } },
			onSuccessfulClick: function (e) { _cancelRegistrationWithCode(context); }
		});
		$cancelWithCode.evolutionValidation('addCustomValidation', context.inputs.code, function () {
			return _testGuid($(context.inputs.code).val());
		}, context.resources.invalidGuidMessage, '#' + context.wrapperId + ' .field-item.registration-code .field-item-validation', null);

		$save = $(context.elements.save);
		$save.evolutionValidation({
			onValidated: function (isValid, buttonClicked, c) { if (isValid) { $save.removeClass('disabled'); } else { $save.addClass('disabled'); } },
			onSuccessfulClick: function (e) { _saveRegistration(context); }
		});
		$save.evolutionValidation('addField', context.inputs.email, { email: true, required: true, messages: { email: context.resources.emailFormatMessage, required: context.resources.emailRequiredMessage} }, '#' + context.wrapperId + ' .field-item.email-address .field-item-validation', null);
		$save.evolutionValidation('addField', context.inputs.firstName, { required: true, messages: { required: context.resources.firstNameRequiredMessage} }, '#' + context.wrapperId + ' .field-item.first-name .field-item-validation', null);
		$save.evolutionValidation('addField', context.inputs.lastName, { required: true, messages: { required: context.resources.lastNameRequiredMessage} }, '#' + context.wrapperId + ' .field-item.last-name .field-item-validation', null)

		$update = $(context.elements.update);
		$update.evolutionValidation({
			onValidated: function (isValid, buttonClicked, c) { if (isValid) { $update.removeClass('disabled'); } else { $update.addClass('disabled'); } },
			onSuccessfulClick: function (e) { _updateRegistration(context); }
		});
		$update.evolutionValidation('addField', context.inputs.email, { email: true, required: true, messages: { email: context.resources.emailFormatMessage, required: context.resources.emailRequiredMessage} }, '#' + context.wrapperId + ' .field-item.email-address .field-item-validation', null);
		$update.evolutionValidation('addField', context.inputs.firstName, { required: true, messages: { required: context.resources.firstNameRequiredMessage} }, '#' + context.wrapperId + ' .field-item.first-name .field-item-validation', null);
		$update.evolutionValidation('addField', context.inputs.lastName, { required: true, messages: { required: context.resources.lastNameRequiredMessage} }, '#' + context.wrapperId + ' .field-item.last-name .field-item-validation', null)

		$(context.elements.cancel).on('click', function () {
			_cancelRegistration(context);
			return false;
		});
	},
	_saveRegistration = function (context) {

		$.telligent.evolution.post({
			url: context.saveUrl,
			data: _populateData(context, true),
			success: function (response) {
				if (response.redirectUrl) {
					window.location = response.redirectUrl;
				}
				else if (response.errors) {
					alert(context.resources.saveErrorMessage + '\n\n' + response.errors[0].error);

					$(context.elements.save).parent().removeClass('processing');
					$(context.elements.save).removeClass('disabled');
				}
			},
			defaultErrorMessage: context.resources.saveErrorMessage,
			error: function (xhr, desc, ex) {
				$.telligent.evolution.notifications.show(desc, { type: 'error' });
				$(context.elements.save).parent().removeClass('processing');
				$(context.elements.save).removeClass('disabled');
			}
		});

	},
	_updateRegistration = function (context) {

		$.telligent.evolution.post({
			url: context.saveUrl,
			data: _populateData(context, false),
			success: function (response) {
				if (response.redirectUrl) {
					window.location = response.redirectUrl;
				}
				else if (response.errors) {
					alert(context.resources.updateErrorMessage + '\n\n' + response.errors[0].error);
					$(context.elements.udpate).parent().removeClass('processing');
					$(context.elements.udpate).removeClass('disabled');
				}
				else {
					$(context.resultMessageWrapper).html(context.resources.updateRegSuccessMessage);
					_setSuccess($(context.resultMessageWrapper));
				}
			},
			defaultErrorMessage: context.resources.updateErrorMessage,
			error: function (xhr, desc, ex) {
				$.telligent.evolution.notifications.show(desc, { type: 'error' });
				$(context.elements.udpate).parent().removeClass('processing');
				$(context.elements.udpate).removeClass('disabled');
			}
		});

	},
	_cancelRegistration = function (context) {

		$.telligent.evolution.post({
			url: context.cancelUrl,
			data: _populateCancelData(context),
			success: function (response) {
				if (response.redirectUrl) {
					window.location = response.redirectUrl;
				}
				else if (response.errors) {
					alert(context.resources.cancelErrorMessage + '\n\n' + response.errors[0].error);

					$(context.elements.cancel).parent().removeClass('processing');
					$(context.elements.cancel).removeClass('disabled');
				}
			},
			defaultErrorMessage: context.resources.cancelErrorMessage,
			error: function (xhr, desc, ex) {
				$.telligent.evolution.notifications.show(desc, { type: 'error' });
				$(context.elements.cancel).parent().removeClass('processing');
				$(context.elements.cancel).removeClass('disabled');
			}
		});
	},

	_populateData = function (context, isNew) {
		var data = {
			EventId: context.eventId,
			UserId: context.user,
			Token: context.token
		};

		if ($(context.inputs.email).length > 0) {
			data.Email = $(context.inputs.email).val();
		}

		if ($(context.inputs.firstName).length > 0) {
			data.FirstName = $(context.inputs.firstName).val();
		}

		if ($(context.inputs.lastName).length > 0) {
			data.LastName = $(context.inputs.lastName).val();
		}

		if (isNew || context.status == 'Cancelled' || context.status == 'NotSet') {
			if (context.eventRegistrationType == 'Open' && context.userIsRegistered)
				data.Status = 'Confirmed';
			else
				data.Status = 'NotApproved';
		}
		else {
			if (context.status == 'Invited') //&& reg.TokenExpireDate > UserTime.CurrentServerTime)
				data.Status = 'Confirmed';
		}
		return data;
	},

	_populateCancelData = function (context) {
		var data = {
			EventId: context.eventId,
			Token: context.token
		};

		return data;
	},

	_cancelRegistrationWithCode = function (context) {

		$.telligent.evolution.post({
			url: context.cancelUrl,
			data: _populateCancelWithCodeData(context),
			success: function (response) {
				if (response.redirectUrl) {
					window.location = response.redirectUrl;
				}
				else if (response.errors) {
					alert(context.resources.cancelErrorMessage + '\n\n' + response.errors[0].error);

					$(context.elements.cancel).parent().removeClass('processing');
					$(context.elements.cancel).removeClass('disabled');
				}
			},
			defaultErrorMessage: context.resources.cancelErrorMessage,
			error: function (xhr, desc, ex) {
				$.telligent.evolution.notifications.show(desc, { type: 'error' });
				$(context.elements.cancel).parent().removeClass('processing');
				$(context.elements.cancel).removeClass('disabled');
			}
		});
	},

	_populateCancelWithCodeData = function (context) {
		var data = {
			EventId: context.eventId
		};

		if ($(context.inputs.code).length > 0) {
			data.Token = $(context.inputs.code).val();
		}

		return data;
	};

	_testGuid = function(value) {
		var validGuid = /^({|()?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}(}|))?$/;
		var emptyGuid = /^({|()?0{8}-(0{4}-){3}0{12}(}|))?$/;
		return validGuid.test(value) && !emptyGuid.test(value);
	};

	$.telligent.evolution.Calendar.widgets.eventRegistrationAdd = {
		register: function (context) {
			_attachHandlers(context);
		}
	};

})(jQuery, window);
