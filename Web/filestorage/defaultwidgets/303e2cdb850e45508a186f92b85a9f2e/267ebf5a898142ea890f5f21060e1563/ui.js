(function($, global) {

    function initialize(context) {
        $.each(context.configurationGroups, function() {
            var group = this;
            var wrapper = $('#' + group.id);
            context.api.registerContent({
                name: group.title,
                orderNumber: 100,
                selected: function() {
                    wrapper.css({
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
                    wrapper.css({
                        visibility: 'hidden',
                        height: '100px',
                        width: '800px',
                        left: '-1000px',
                        position: 'absolute',
                        overflow: 'hidden',
                        top: '-1000px'
                    });
                }
            });
        });

        context.api.registerSave(function(o) {
            var data = {};
            $.each(context.configurationGroups, function() {
                var group = this;
                var formData = $('#' + group.formId).dynamicForm('getValues');
                data = $.extend(data, formData);
            });

            $.telligent.evolution.post({
                url: context.saveUrl,
                data: data
            })
                .then(function() {
                    o.success();
                })
                .catch(function() {
                    o.error();
                });
		});
    }

	var api = {
		register: function(context) {
		    initialize(context);
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.configurablePlugin = api;

}(jQuery, window));