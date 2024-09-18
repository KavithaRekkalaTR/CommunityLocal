(function($, global) {

    function prefix(options) {
		var data = {};
		$.each(options, function(k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	function parseFilter(context) {
		return {
			currentLanguage: context.filter.find('.language').val(),
		};
	}

	var Model = {
        saveTranslations: function(context, o) {
        	var serializedResources = [];
        	context.list.find("li").each(function () {
        		var resource = $(this);
        		if (resource.attr('data-language') != 'all') {
            		serializedResources.push($.param({
            			lang: resource.attr('data-language'),
            			name: resource.attr('data-resourcekey'),
            			val: resource.find('input').val()
            		}));
        		}
        	});

        	var serialized = $.param({ r: serializedResources });

            $.telligent.evolution.post({
                url: context.saveTranslationsUrl,
                data: {
                    serialized: serialized
                }
            })
            .then(function(response) {
                o.success();
            })
            .catch(function() {
                o.error();
            });
        }
	};

	var api = {
		register: function(context) {
			// header

			// init
			context.list = $(context.list);
			context.filter = $(context.filter);

			// filtering
			context.currentFilter = parseFilter(context);

			context.filter.on('change', function(e){
				// adjust filter
				context.currentFilter = parseFilter(context);

                context.list.find("li:not([data-language='all'])").each(function() {
                    $( this ).hide();
                });
                var currentResources = context.list.find("li[data-language='" + context.currentFilter.currentLanguage + "']");
                currentResources.each(function() {
                        $( this ).show();
                });
			});

			context.api.registerSave(function(o) {
			    Model.saveTranslations(context, o);
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.pluginTranslations = api;

}(jQuery, window));