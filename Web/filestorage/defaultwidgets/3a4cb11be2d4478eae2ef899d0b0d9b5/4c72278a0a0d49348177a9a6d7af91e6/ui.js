(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    function loadFields(context) {
        context.fields = {
            globalFormElement: $(context.fieldIds.globalFormElement),
            legacyJQuery: $(context.fieldIds.legacyJQuery),
            allRestScopesInUserInterface: $(context.fieldIds.allRestScopesInUserInterface)
        };
    }

	$.telligent.evolution.widgets.legacyUiOptions = {
		register: function(context) {
		    loadFields(context);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();
			$.telligent.evolution.administration.header($.telligent.evolution.template.compile(context.headerTemplateId)({}));

    		var saveButton = $('.button.save', $.telligent.evolution.administration.header());
    		saveButton.on('click', function() {
    		    if (!saveButton.hasClass('disabled')) {
    		        saveButton.addClass('disabled');

    		        $.telligent.evolution.post({
    		            url: context.urls.save,
    		            data: {
                            globalFormElement: context.fields.globalFormElement.prop('checked'),
                            legacyJQuery: context.fields.legacyJQuery.prop('checked'),
                            allRestScopesInUserInterface: context.fields.allRestScopesInUserInterface.prop('checked')
                        }
    		        })
		            .then(function() {
		                $.telligent.evolution.notifications.show(context.text.saveSuccessful, {
		                    type: 'success'
		                })
		            })
		            .always(function() {
		                saveButton.removeClass('disabled');
		            });
    		    }

    		    return false;
    		});

		}
	};
}(jQuery, window));