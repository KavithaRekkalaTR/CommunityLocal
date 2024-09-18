(function ($) {
    var getValue = function (context) {
        var parts = [];
        context.list.find('li.poll-option-item').each(function(index, element){{
			var option = {
				OptionId: $(this).data('optionid'),
				Option: $(this).find('.poll-option-name').val(),
				Ordinal: index
			};
			if(option.Option != '')
				parts.push(option);
        }});
        return JSON.stringify(parts);
    },
    update = function (context) {
        inputs = context.list.find('input.poll-option-name');
        var size = inputs.length - 1;
        inputs.each(function (index, element) {
            $(element).attr('placeholder', '');
            if (index == size) {
                $(element).attr('placeholder', context.placeholderText);
            }
        });
    },
	add = function (context, option) {
	    if (!option) {
	        option = {
	            Option: '',
	            OptionId: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);})
	        }
	    }
	    var item = $(context.itemTemplate(option));
		context.list.append(item);
		update(context);
	},
	remove = function (item, context) {
		if ((context.list.find('input.poll-option-name').length > 2)) {
		    if (confirm(context.deleteConfirmationText)) {
		        item.remove();
		        context.onChange();
		    }
		} else {
		    $.telligent.evolution.notifications.show(context.deleteErrorText, { type: 'error' });
		}
		update(context);
	},
    up = function (item, context) {
        if (item.prev().length > 0) {
            item.prev().before(item);
            context.onChange();
        }
    },
    down = function (item, context) {
        if (item.next().length > 0) {
            item.next().after(item);
            context.onChange();
        }
    },
    setValue = function(context, val) {
        context.list.empty();
        
        var initialValue = val ? JSON.parse(val) : null;
        if (!initialValue || initialValue.length == 0) {
            add(context);
            add(context);
            add(context);
        } else {
            for (var i = 0; i < initialValue.length; i++) {
                add(context, initialValue[i]);
            }
            add(context);
        }
    };

    if (!$.telligent) $.telligent = {};
	if (!$.telligent.evolution) $.telligent.evolution = {};
	if (!$.telligent.evolution.templates) $.telligent.evolution.templates = {};
    
    $.telligent.evolution.templates.pollOptions = {
        register: function(context) {

            context.itemTemplate = $.telligent.evolution.template.compile(context.itemTemplateId);

            setValue(context, context.initialValue);

            context.api.register({
                val: function(val) { return (typeof val == 'undefined') ? getValue(context) : setValue(context, val); },
                hasValue: function() { return getValue(context) != null; }
            });
            context.onChange = function() {
                context.api.changed(getValue(context));
            };
            
            context.list
                .on('click', '.poll-option-delete', function (e) {
                    e.preventDefault();
                    remove($(this).parent('li'), context);
                })
                .on('click', '.poll-option-up', function (e) {
                    e.preventDefault();
                    up($(this).parent('li'), context);
                })
                .on('click', '.poll-option-down', function (e) {
                    e.preventDefault();
                    down($(this).parent('li'), context);
                })
                .on('change', 'input', function () {
                    context.onChange();
                })
				.on('keyup', 'input[type="text"]:last', function (e) {
					if (e.keyCode != 9 && e.keyCode != 0) {
						e.preventDefault();
						add(context);
					}
                });

            context.add.on('click', function (e) {
                e.preventDefault();
                add(context);
            });
        }
    }
}(jQuery));