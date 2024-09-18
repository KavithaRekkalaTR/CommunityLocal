(function($, global) {

    function updateFormState(context) {
        context.wrapper.find('.schedule-type-dependent').hide();
        context.wrapper.find('.schedule-type-' + context.inputs.scheduleType.val()).show();
    }

    function save(context, o) {
        try {


        $.telligent.evolution.post({
            url: context.urls.save,
            data: {
                ScheduleType: context.inputs.scheduleType.val(),
                ScheduleSeconds: context.inputs.scheduleSeconds.val(),
                ScheduleMinutes: context.inputs.scheduleMinutes.val(),
                ScheduleHours: context.inputs.scheduleHours.val(),
                ScheduleDailyTime: $.telligent.evolution.formatDate(context.inputs.scheduleDailyTime.glowDateTimeSelector('val')),
                ScheduleDailySunday: context.inputs.scheduleDailySunday.is(':checked'),
                ScheduleDailyMonday: context.inputs.scheduleDailyMonday.is(':checked'),
                ScheduleDailyTuesday: context.inputs.scheduleDailyTuesday.is(':checked'),
                ScheduleDailyWednesday: context.inputs.scheduleDailyWednesday.is(':checked'),
                ScheduleDailyThursday: context.inputs.scheduleDailyThursday.is(':checked'),
                ScheduleDailyFriday: context.inputs.scheduleDailyFriday.is(':checked'),
                ScheduleDailySaturday: context.inputs.scheduleDailySaturday.is(':checked')
            }
        })
            .then(function() {
                o.success();
            })
            .catch(function() {
                o.error();
            });


        } catch (e) { console.log(e);}
    }

    function validate(context) {
        var sv, v;
        var scheduleType = context.inputs.scheduleType.val();
        if (scheduleType == 'Seconds') {
            sv = $.trim(context.inputs.scheduleSeconds.val());
            v = parseInt(sv, 10);
            if (isNaN(v) || v <= 0 || (v + '').length != sv.length) {
                context.inputs.scheduleSeconds.closest('.field-item').find('.field-item-validation').show();
                return false;
            } else {
                context.inputs.scheduleSeconds.closest('.field-item').find('.field-item-validation').hide();
                return true;
            }
        } else if (scheduleType == 'Minutes') {
            sv = $.trim(context.inputs.scheduleMinutes.val());
            v = parseInt(sv, 10);
            if (isNaN(v) || v <= 0 || (v + '').length != sv.length) {
                context.inputs.scheduleMinutes.closest('.field-item').find('.field-item-validation').show();
                return false;
            } else {
                context.inputs.scheduleMinutes.closest('.field-item').find('.field-item-validation').hide();
                return true;
            }
        } else if (scheduleType == 'Hours') {
            sv = $.trim(context.inputs.scheduleHours.val());
            v = parseInt(sv, 10);
            if (isNaN(v) || v <= 0 || (v + '').length != sv.length) {
                context.inputs.scheduleHours.closest('.field-item').find('.field-item-validation').show();
                return false;
            } else {
                context.inputs.scheduleHours.closest('.field-item').find('.field-item-validation').hide();
                return true;
            }
        } else if (scheduleType == 'Daily') {
            if (context.inputs.scheduleDailyTime.glowDateTimeSelector('val') == null) {
                context.inputs.scheduleDailyTime.closest('.field-item').find('.field-item-validation').show();
                return false;
            } else {
                context.inputs.scheduleDailyTime.closest('.field-item').find('.field-item-validation').hide();
            }

            if (context.wrapper.find('.schedule-type-Daily input[type="checkbox"]:checked').length == 0) {
                context.inputs.scheduleDailySunday.closest('.field-item').find('.field-item-validation').show();
                return false;
            } else {
                context.inputs.scheduleDailySunday.closest('.field-item').find('.field-item-validation').hide();
            }

            return true;
        }

        return false;
    }

	var api = {
		register: function(context) {

            context.inputs.scheduleType.on('change', function() {
               updateFormState(context);
            });

            context.inputs.scheduleDailyTime.glowDateTimeSelector($.extend(
                {},
                $.fn.glowDateTimeSelector.timeDefaults
                )
            ).on('glowDateTimeSelectorChange', function() {
                context.api.validate();
            })

            context.wrapper.find('input, select').on('input click', function() {
                context.api.validate();
            })

            context.api.registerContent({
                name: context.text.schedule,
                orderNumber: 200,
                selected: function() {
                    context.wrapper.css({
                        visibility: 'visible',
                        height: 'auto',
                        width: 'auto',
                        left: '0',
                        position: 'static',
                        overflow: 'visible',
                        top: '0'
                    });
                },
                unselected: function() {
                    context.wrapper.css({
                        visibility: 'hidden',
                        height: '100px',
                        width: '800px',
                        left: '-1000px',
                        position: 'absolute',
                        overflow: 'hidden',
                        top: '-1000px'
                    });
                },
                validate: function() {
                    return validate(context);
                }
            });

			context.api.registerSave(function(o) {
			    save(context, o);
			});

			updateFormState(context);
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.pluginScheduling = api;

}(jQuery, window));