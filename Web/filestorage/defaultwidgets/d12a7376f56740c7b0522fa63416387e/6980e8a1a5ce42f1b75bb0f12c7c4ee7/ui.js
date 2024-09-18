(function($, global) {

    function registerContent(context) {
        context.api.registerContent({
            name: context.text.metrics,
            orderNumber: 10,
            selected: function() {
                context.metricsWrapper.css({
                    visibility: 'visible',
                    height: 'auto',
                    width: 'auto',
                    left: '0',
                    position: 'static',
                    overflow: 'visible',
                    top: '0'
                });
                context.viewSampleScores.show();
                context.addMetrics.show();
            },
            unselected: function() {
                context.metricsWrapper.css({
                    visibility: 'hidden',
                    height: '100px',
                    width: '800px',
                    left: '-1000px',
                    position: 'absolute',
                    overflow: 'hidden',
                    top: '-1000px'
                });
                context.viewSampleScores.hide();
                context.addMetrics.hide();
            },
            actions: [
                {
                    label: context.text.addMetricMenu,
                    messageName: 'scoreplugin-addmetrics',
                    show: 'contextually'
                },
                {
                    label: context.text.revertMenu,
                    messageName: 'scoreplugin-revert',
                    show: 'contextually'
                },
                {
                    label: context.text.viewScoresMenu,
                    messageName: 'scoreplugin-scoresamples',
                    show: 'always'
                }
            ]
        });

        if (context.decayWrapper) {
            context.api.registerContent({
                name: context.text.decay,
                orderNumber: 11,
                selected: function() {
                    context.decayWrapper.css({
                        visibility: 'visible',
                        height: 'auto',
                        width: 'auto',
                        left: '0',
                        position: 'static',
                        overflow: 'visible',
                        top: '0'
                    });
                    context.viewSampleScores.show();
                },
                unselected: function() {
                    context.decayWrapper.css({
                        visibility: 'hidden',
                        height: '100px',
                        width: '800px',
                        left: '-1000px',
                        position: 'absolute',
                        overflow: 'hidden',
                        top: '-1000px'
                    });
                    context.viewSampleScores.hide();
                },
                actions: [
                    {
                        label: context.text.viewOverridesMenu,
                        messageName: 'scoreplugin-applicationoverrides',
                        show: 'contextually'
                    },
                    {
                        label: context.text.revertMenu,
                        messageName: 'scoreplugin-revert',
                        show: 'contextually'
                    }
                ],
                validate: function() {
                    return validateHalfLife(context);
                }
            });
        }
    }

    function validateHalfLife(context) {
        var halfLife = context.fields.halfLife.val();
        halfLife = parseInt(halfLife, 10);
        context.fields.halfLife.closest('.field-item').find('.field-item-validation').hide();
        if (context.fields.enableDecay.is(':checked')) {
            if (isNaN(halfLife) || halfLife < 1) {
                context.fields.halfLife.closest('.field-item').find('.field-item-validation').show();
                return false;
            }
        } else {
            context.fields.halfLife.val(30);
        }

        return true;
    }

    function parseFields(context) {
        context.fields = context.fields || {};

        context.fields.enableDecay = $('#' + context.fieldIds.enableDecay);
        context.fields.halfLife = $('#' + context.fieldIds.halfLife);
        context.fields.allowHalfLifeOverrides = $('#' + context.fieldIds.allowHalfLifeOverrides);
    }

    function updateDecayOptions(context) {
        if (context.fields.enableDecay.is(':checked')) {
            context.fields.halfLife.closest('.field-item').show();
            context.fields.allowHalfLifeOverrides.closest('.field-item').show();
        } else {
            context.fields.halfLife.closest('.field-item').hide();
            context.fields.allowHalfLifeOverrides.closest('.field-item').hide();
        }
    }

	var api = {
		register: function(context) {
		    registerContent(context);
		    parseFields(context);

            $('.field-item.view-id a', context.metricsWrapper).on('click', function() {
			   var item = $(this).closest('li');
			   item.siblings('.id').show();
			   item.hide();
			   return false;
			});

			context.fields.enableDecay.on('change', function() {
			    updateDecayOptions(context);
			});

			updateDecayOptions(context);

			context.fields.halfLife.on('input', function() {
			    context.api.validate();
			});

            $.telligent.evolution.messaging.subscribe('scoreplugin-addmetrics', function(data) {
			    $.telligent.evolution.administration.open({
    				name: context.text.addMetrics,
    				cssClass: 'scoreplugin',
    				content: $.telligent.evolution.get({
    					url: context.urls.addMetrics
    				})
    			});
    			return false;
			});

			$.telligent.evolution.messaging.subscribe('scoreplugin-revert', function(data) {
			    $.telligent.evolution.administration.open({
    				name: context.text.revert,
    				cssClass: 'scoreplugin',
    				content: $.telligent.evolution.get({
    					url: context.urls.revert
    				})
    			});
    			return false;
			});

			$.telligent.evolution.messaging.subscribe('scoreplugin-scoresamples', function(data) {
			    $.telligent.evolution.administration.open({
    				name: context.text.scoreSamples,
    				cssClass: 'scoreplugin',
    				content: $.telligent.evolution.get({
    					url: context.urls.scoreSamples
    				})
    			});
    			return false;
			});

			$.telligent.evolution.messaging.subscribe('scoreplugin-applicationoverrides', function(data) {
			    $.telligent.evolution.administration.open({
    				name: context.text.applicationOverrides,
    				cssClass: 'scoreplugin',
    				content: $.telligent.evolution.get({
    					url: context.urls.applicationOverrides
    				})
    			});
    			return false;
			});

			$.telligent.evolution.messaging.subscribe('scoreplugin.metricsample', function(data) {
			    $.telligent.evolution.administration.open({
    				name: context.text.metricSamples.replace(/\{0\}/g, $(data.target).data('metricname')),
    				cssClass: 'scoreplugin',
    				content: $.telligent.evolution.get({
    					url: context.urls.metricSamples,
    					data: {
    					    w_metricid: $(data.target).data('metricid')
    					}
    				})
    			});
    			return false;

			});

			$.telligent.evolution.messaging.subscribe('scoreplugin.removemetric', function(data) {
			    if (global.confirm(context.text.removeMetricConfirmation.replace(/\{0\}/g, $(data.target).data('metricname')))) {
    			    $.telligent.evolution.post({
    		            url: context.urls.removeMetric,
    		            data: {
    		                metric: $(data.target).data('metricid')
    		            }
    		        })
    		            .then(function() {
    		               $.telligent.evolution.notifications.show(context.text.removeMetricSuccessful.replace(/\{0\}/g, $(data.target).data('metricname')), {
                                type: 'success'
                            });
                            $(data.target).closest('.content-item.metric').slideUp('fast', function() {
                                $(this).remove();
                            });
    		            });
			    }
			});

			$.telligent.evolution.messaging.subscribe('scoreplugin.refresh', function(o) {
			    $.telligent.evolution.get({
			        url: context.urls.refresh
			    })
			        .then(function(data) {
			            if (o.changedDecay) {
    			            if (data.enabledecay) {
    			                context.fields.enableDecay.prop('checked', true);
    			            } else {
    			                context.fields.enableDecay.prop('checked', false);
    			            }
    			            context.fields.halfLife.val(data.halflife);
    			            if (data.enableoverrides) {
    			                context.fields.allowHalfLifeOverrides.prop('checked', true);
    			            } else {
    			                context.fields.allowHalfLifeOverrides.prop('checked', false);
    			            }
    			            updateDecayOptions(context);
			            }
			            if (o.changedMetrics) {
			                context.metricsListWrapper.html(data.metrics);
			            } else if (o.addedMetrics) {
			                var list = context.metricsListWrapper.find('ul.content-list');
			                if (list.length == 0) {
			                    context.metricsListWrapper.html(data.metrics);
			                } else {
    			                $(data.metrics).find('.content-item.metric').each(function() {
    			                    var metric = $(this);
    			                    if (context.metricsListWrapper.find('.content-item.metric[data-metricid="' + metric.data('metricid') + '"]').length == 0) {
    			                        list.append(metric);
    			                    }
    			                });
			                }
			            }
			        })
			});

			context.api.registerSave(function(o) {
                var data = {
                    enabledecay: context.fields.enableDecay.is(':checked'),
                    halflife: parseInt(context.fields.halfLife.val(), 10),
                    enableoverrides: context.fields.allowHalfLifeOverrides.is(':checked')
                };

                context.metricsWrapper.find('.content-item.metric').each(function() {
                   var e = $(this);
                   data['weight-' + e.data('metricid')] = e.find('input[type="range"]').val();
                });

                $.telligent.evolution.post({
                    url: context.urls.save,
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
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.scorePlugin = api;

}(jQuery, window));