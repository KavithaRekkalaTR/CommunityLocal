(function ($) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	if (typeof $.telligent.evolution.Calendar === 'undefined') { $.telligent.evolution.Calendar = {}; }
	if (typeof $.telligent.evolution.Calendar.widgets === 'undefined') { $.telligent.evolution.Calendar.widgets = {}; }

	var _attachHandlers = function (context) {
		var saveButton = $(context.elements.save);
		$.telligent.evolution.navigationConfirmation.enable();
		$.telligent.evolution.navigationConfirmation.register(saveButton);

		$(context.inputs.registrationType).change(function () {
			if (this.value == '0') {
				context.elements.maxRegistrations.hide();
			}
			else {
				context.elements.maxRegistrations.show();
			}
		});
		
		$(context.cancelLink).on('click', function () {
			if (confirm(context.cancelConfirmationText)) {
			    $.telligent.evolution.navigationConfirmation.ignoreClick();
                window.history.back();
			}
			return false;
		});			
	},
_save = function (context) {

	$('.processing').show();

	$.telligent.evolution.post({
		url: context.saveUrl,
		data: _populateData(context),
		success:function (response) {
			if (response.redirectUrl) {
				window.location = response.redirectUrl;
			}
			else if (response.errors) {
				context.isSaving = false;
				alert(context.resources.saveErrorText + '\n\n' + response.errors[0].error);

				$(context.inputs.save).parent().removeClass('processing');
				$(context.inputs.save).removeClass('disabled');
			}
		},
		error: function (xhr, desc, ex) {
			if(xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0){
				$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0],{type:'error'});
			}
			else{
				$.telligent.evolution.notifications.show(desc,{type:'error'});
			}
			$(context.inputs.save).parent().removeClass('processing');
			$(context.inputs.save).removeClass('disabled');
			$('.processing').hide();
			context.isSaving = false;
		}
	});
},
	_removeTimezoneOffset = function(context, d, selectedMinuteOffset) {
		if (isNaN(d)) {
			return null;
		}
		if (d == null || isNaN(selectedMinuteOffset)) {
			return d;
		}

		var currentMinuteOffset = -d.getTimezoneOffset();
		if (selectedMinuteOffset == currentMinuteOffset) {
			return d;
		} else {
			return new Date(d.getTime() + ((selectedMinuteOffset - currentMinuteOffset) * 60000));
		}
	},
	_populateData = function (context) {
		var data = {
			Body: context.getBodyContent(),
			EventId: context.eventId,
			CalendarId: context.calendarId,
			TimeZone: $(context.inputs.timezone).val()
		};

		if ($(context.inputs.eventTitle).length > 0) {
			data.Title = $(context.inputs.eventTitle).evolutionComposer('val');
		}

		if ($(context.inputs.location).length > 0) {
			data.Location = $(context.inputs.location).val();
		}

		if ($(context.inputs.url).length > 0) {
			data.Url = $(context.inputs.url).val();
		}


		if ($(context.inputs.startDate).length > 0 && $(context.inputs.startDate).val() != '0') {
			var d = $(context.inputs.startDate).glowDateTimeSelector('val');
			data.StartDate = $.telligent.evolution.formatDate(d);
			data.StartDateHourOffset = -(d.getTimezoneOffset() / 60);
		}

		if ($(context.inputs.endDate).length > 0 && $(context.inputs.endDate).val() != '0') {
			var d = $(context.inputs.endDate).glowDateTimeSelector('val');
			data.EndDate = $.telligent.evolution.formatDate(d);
			data.EndDateHourOffset = -(d.getTimezoneOffset() / 60);
		}

		if ($(context.inputs.registrationType).length > 0) {
			data.RegistrationType = $(context.inputs.registrationType).val();
		}

		if ($(context.inputs.allowAnonymous).length > 0) {
			data.AllowAnonymous = $(context.inputs.allowAnonymous).is(':checked') ? 1 : 0;
		}
		else {
			data.AllowAnonymous = -1;
		}

		if ($(context.inputs.maxRegistrations).length > 0) {
			data.MaxRegistrations = $(context.inputs.maxRegistrations).val();
		}

		if ($(context.inputs.tags).length > 0) {
			var inTags = $(context.inputs.tags).val().split(/[,;]/g);
			var tags = [];
			for (var i = 0; i < inTags.length; i++) {
				var tag = $.trim(inTags[i]);
				if (tag) {
					tags[tags.length] = tag;
				}
			}

			data.Tags = tags.join(',');
		}

		if ($(context.map.chkMap).is(':checked')) {
			if ($(context.map.txtAddr).length > 0) {
				data.Address = $(context.map.txtAddr).val();
			}

			if ($(context.map.txtLat).length > 0) {
				data.Latitude = $(context.map.txtLat).val();
			}

			if ($(context.map.txtLng).length > 0) {
				data.Longitude = $(context.map.txtLng).val();
			}
		}
		else {
			data.Address = '';
			data.Latitude = '';
			data.Longitude = '';
		}

		return data;
	},
	_addValidation = function (context) {
		var saveButton = $(context.elements.save);

		saveButton.evolutionValidation({
			onValidated: function (isValid, buttonClicked, c) {
				if (isValid && !context.isSaving) {
					saveButton.removeClass('disabled');
				} else {
					saveButton.addClass('disabled');
				}
			},
			onSuccessfulClick: function (e) {
				if (!context.isSaving) {
					context.isSaving = true;
					saveButton.parent().addClass('processing');
					saveButton.addClass('disabled');
					_save(context);
				}
			}
		})
		.evolutionValidation('addField', context.inputs.eventTitle,
			{
				required: true,
				maxlength: 256,
				messages: { required: context.resources.titleIsMissing, maxlength: context.resources.titleTooLong }
			},
			$(context.inputs.eventTitle).closest('.field-item').find('.field-item-validation'), null)
		.evolutionValidation('addField', context.inputs.location,
			{
				maxlength: 256,
				messages: { maxlength: context.resources.locationTooLong }
			},
			$(context.inputs.location).closest('.field-item').find('.field-item-validation'), null)
		.evolutionValidation('addField', context.inputs.url,
			{
				url: true,
				messages: { maxlength: context.resources.urlNotValid }
			},
			$(context.inputs.url).closest('.field-item').find('.field-item-validation'), null)
		.evolutionValidation('addField', context.inputs.maxRegistrations,
			{
				digits: true,
				messages: { digits: context.resources.maxRegistrationsNotAnInteger }
			},
			$(context.inputs.maxRegistrations).closest('.field-item').find('.field-item-validation'), null)
		.evolutionValidation('addCustomValidation', context.inputs.startDate, function () {
			var startDateValue = $.telligent.evolution.formatDate($(context.inputs.startDate).glowDateTimeSelector('val'));

			return startDateValue != "";
		},
				context.resources.invalidDate,
		$(context.inputs.startDate).closest('.field-item').find('.field-item-validation'), null);


		saveButton.evolutionValidation('addCustomValidation', context.inputs.endDate, function () {
			var start = $.telligent.evolution.formatDate($(context.inputs.startDate).glowDateTimeSelector('val'));
			var end = $.telligent.evolution.formatDate($(context.inputs.endDate).glowDateTimeSelector('val'));

			if (start == "" || end == "")
				return true;
			else
				return (start < end);
		},
				context.resources.invalidDateRange,
		$(context.inputs.endDate).closest('.field-item').find('.field-item-validation'), null);

		$(context.inputs.startDate).on('glowDateTimeSelectorChange', function () {
			saveButton.evolutionValidation('validate');
		});

		$(context.inputs.endDate).on('glowDateTimeSelectorChange', function () {
			saveButton.evolutionValidation('validate');
		});

		context.attachBodyChangeScript(saveButton.evolutionValidation('addCustomValidation', 'body', function () {
			var body = context.getBodyContent();
			return body.length > 0;
		},
				context.resources.descriptionIsMissing, '#' + context.wrapperId + ' .field-item.event-body .field-item-validation', null
				));

	};

	$.telligent.evolution.Calendar.widgets.editevent = {
		register: function (context) {
			var selectedMinuteOffset = $(context.inputs.timezone).val();
			selectedMinuteOffset = parseInt(selectedMinuteOffset.split(/\:/)[0], 10);

            $(context.inputs.eventTitle).evolutionComposer({
				plugins: ['hashtags'],
				contentTypeId: context.eventContentTypeId
			}).evolutionComposer('onkeydown', function (e) {
				if (e.which === 13) {
					return false;
				} else {
					return true;
				}
			});

			$(context.inputs.startDate)
			.val(_removeTimezoneOffset(context, new Date($(context.inputs.startDate).val()), context.startDateHourOffset * 60).toISOString())
			.glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: false,
					})
			);

			$(context.inputs.endDate)
			.val(_removeTimezoneOffset(context, new Date($(context.inputs.endDate).val()), context.endDateHourOffset * 60).toISOString())
			.glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: true,
					})
			);

			if ($(context.inputs.registrationType).val() == '0') {
				context.elements.maxRegistrations.hide();
			}

			$(context.inputs.tags).evolutionTagTextBox({ applicationId: context.applicationId });


			_attachHandlers(context);
			_addValidation(context);

			if (context.map.geocodingEnabled == 'True' || context.map.geocodingEnabled == 'true') {
				MapInit(context);
			} else {
				$(context.map.map_check_area).hide();
			}
		}
	};


	MapInit = function (context) {

		if ($(context.map.txtLat).val() != '' && $(context.map.txtLng).val() != '') {
			$(context.map.chkMap).prop('checked', true);
		}

		if ($(context.inputs.location).val() != '' && $(context.map.chkMap).is(':checked')) {
			GetMap(context, $(context.inputs.location).val())
		}

		$(context.inputs.location).change(
				 function (objEvent) {
					 if ($(context.map.chkMap).is(':checked')) {
						 $(context.map.copyLocLink).html('').hide().off('click');
						 GetMap(context, $(this).val());
					 }
				 }
			 );
		$(context.map.chkMap).on('click', function (objEvent) {
			if ($(context.map.chkMap).is(':checked')) {
				if ($(context.inputs.location).val() != '') {
					GetMap(context, $(context.inputs.location).val());
				}
			}
			else {
				clearData(context);
			}
		});
	}

	GetMap = function (context, query) {

		clearMapError(context);
		clearData(context);
		if (query == '') return;
		var loader = $(context.map.mapLoader);
		$(loader).html('<span class="ui-loading" width="48" height="48"></span>');
		GetMapResult(context, query);
	}
	function LoadMap(context, result) {

		if (result == null || result.Latitude == null || result.Longitude == null || result.AddressString == null) { clearData(context); SetMapUnknown(context); return; }
		var handler = result.MapUrl;
		handler = handler.replace('250x250', '200x200');

		var loader = $(context.map.mapLoader);
		var img = new Image();

		$(context.map.txtLat).val(result.Latitude);
		$(context.map.txtLng).val(result.Longitude);
		$(context.map.txtAddr).val(result.AddressString);

		if ($(context.inputs.location).val() != result.AddressString) {
			var copyId = $(context.map.copyLocLink).attr('id') + '_copy';
			$(context.map.copyLocLink).html([context.resources.Calendar_CopyLink_Text, '<a href="#" ', 'id="', copyId, '">', result.AddressString, '</a>'].join('')).fadeIn();
			$(context.map.copyLocLink).on("click", '#' + copyId, function () {
				$(context.inputs.location).val(result.AddressString);
				$(context.map.copyLocLink).hide();
			});
		}

		$(img)
		.on('load', function(){
			$(this).hide();
			$(loader).removeClass('loading').html(this);
			$(this).fadeIn();
		})
		.on('error', function() {
			$.telligent.evolution.notifications.show(context.resources.errorLoadingMap, { type: 'warning' });
			$(loader).removeClass('loading').html(this);
		})
		.attr('src', handler);

	}
	SetMapError = function (context) { $(context.map.mapLoader).html(context.resources.calendar_addedit_maperror).addClass('message').addClass('error'); }
	SetMapUnknown = function (context) { $(context.map.mapLoader).html(context.resourcescalendar_addedit_mapunknown).addClass('message').addClass('error'); }
	clearMapError = function (context) { $(context.map.mapLoader).html('').removeClass('message').removeClass('error'); }
	clearData = function (context) {
		clearMapError(context);

		$(context.map.txtLat).val('');
		$(context.map.txtLng).val('');
		$(context.map.txtAddr).val('');
		$(context.map.copy_loc_link).html('').hide();
		$(context.map.mapLoader).html('');
	}

	function GetMapResult(context, query) {

		var message = ['query=', query, '&includemapurl=true'].join('');

		$.ajax({
			type: "POST",
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/geocoding/geocode.json',
			data: message,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function (response) {
				LoadMap(context, response.Geocoding);
			},
			beforeSend: function (xhr) {
				TelligentUtility.WriteAuthorizationHeader(xhr);
			},
			error: function (request, textStatus, errorThrown) {
				SetMapError(context);
			}
		});
	}

})(jQuery);