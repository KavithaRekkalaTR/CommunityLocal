(function ($, global) {
    var headerList = null, searchTimeout = null;

    function filterEvents(options, searchText) {
		global.clearTimeout(searchTimeout);
		searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			if (searchText.length == 0) {
				$('.field-item.webhook-event', $.telligent.evolution.administration.panelWrapper()).show();
			} else {
				var searchTerms = searchText.split(' ');
				$('.field-item.webhook-event', $.telligent.evolution.administration.panelWrapper()).each(function() {
					var cft = $(this);
					var text = cft.data('text');
					var match = true;
					for (var i = 0; i < searchTerms.length; i++) {
						if (text.indexOf(searchTerms[i]) == -1) {
							match = false;
							break;
						}
					}
					if (match) {
						cft.show();
					} else {
						cft.hide();
					}
				});
			}
		}, 125);
	}

    var api = {
        register: function (options) {
    		headerList = $('<ul class="field-list"></ul>')
    			.append(
    				$('<li class="field-item submit"></li>')
    					.append(
    						$('<span class="field-item-input"></span>')
    							.append(
    								$('<a href="#"></a>')
    									.addClass('button add-webhook')
    									.text(options.resources.addWebhook)
    					)
    				)
    			);
            $.telligent.evolution.administration.header($('<fieldset></fieldset>').append(headerList));

            $('a.add-webhook').on('click', function(){
                $.telligent.evolution.administration.open({
                    name: options.resources.addWebhook,
                    content: $.telligent.evolution.get({
                            url: options.urls.editWebhook
                        }),
                    cssClass: 'webhook-administration-editwebhook'
                });

                return false;
            });

            $.telligent.evolution.messaging.subscribe('contextual-edit-webhook', function (data) {
				var id = $(data.target).data('id');
				var url = $(data.target).data('url');
                $.telligent.evolution.administration.open({
                    name: url,
                    content: $.telligent.evolution.get({
                            url: options.urls.editWebhook,
                            data: {
                                w_id: id
                            }
                        }),
                    cssClass: 'webhook-administration-editwebhook'
                });

				return false;
			});

            $.telligent.evolution.messaging.subscribe('contextual-enable-webhook', function(data){
				var webhookId = $(data.target).data('id');
				var enable = $(data.target).data('enable');

				$.telligent.evolution.post({
					url: options.urls.enable,
					data: {
						w_id: webhookId,
						w_enable: enable
					}
				})
				.then(function() {
					if (enable == "True") {
						$(data.target).data('enable', 'False');
						$(data.target).text(options.resources.disable);

						$(data.target).closest('li.webhook').find('div.attribute-item.status').children('span.value').text(options.resources.enabled);
						$(data.target).closest('li.webhook').find('div.attribute-item.status').children('span.value').removeClass('highlight');
						$(data.target).closest('li.webhook').find('div.attribute-item.connectivity').children('span.value').text('');
						$(data.target).closest('li.webhook').find('div.attribute-item.connectivity').children('span.value').removeClass('highlight');
					}
					else {
						$(data.target).data('enable', 'True');
						$(data.target).text(options.resources.enable);

						$(data.target).closest('li.webhook').find('div.attribute-item.status').children('span.value').text(options.resources.disabled);
						$(data.target).closest('li.webhook').find('div.attribute-item.status').children('span.value').addClass('highlight');
					}
				});
			});

           $.telligent.evolution.messaging.subscribe('contextual-delete-webhook', function (data) {
                if (confirm(options.resources.confirmDelete)) {
    			    var id = $(data.target).data('id');

    				$.telligent.evolution.post({
    					url: options.urls.deleteWebhook,
    					data: {
    						w_id: id
    					},
        				success: function () {
                   		   $.telligent.evolution.notifications.show(options.resources.deleteSuccess);
    					   $(data.target).parents('li.content-item')
        						.slideUp(function() {
        							$(data.target).parents('li.content-item').remove();
        						});
    					}
    				});
                }

				return false;
			});
        }
    };

    var editApi = {
        register: function (options) {
    		var saveList = $('<ul class="field-list"></ul>')
    			.append(
    				$('<li class="field-item submit"></li>')
    					.append(
    						$('<span class="field-item-input"></span>')
    							.append(
    								$('<a href="#"></a>')
    									.addClass('button save')
    									.text(options.resources.save)
    					)
    				)
    			);

            $.telligent.evolution.administration.header($('<fieldset></fieldset>').append(saveList));

			$('input[type="text"][name="search"]', $.telligent.evolution.administration.panelWrapper())
			  .on('keyup paste click', function() {
				filterEvents(options, $(this).val());
			});


            var saveButton = $('a.save', saveList);

            saveButton.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
                    var selected = [];
                    $("input[type='checkbox'][name='webhook']:checked").each(function() {
                        selected.push($(this).val());
                    });

                    var url = $(options.inputs.callbackUrlId, $.telligent.evolution.administration.panelWrapper()).val();
                    var enabled = $(options.inputs.enabledId).prop("checked");
                    $.telligent.evolution.post({
                        url: options.urls.saveWebhook,
                        data: {
                             Id: options.id,
                             SubscribedWebhookEventIds: selected.join(','),
                             CallBackUrl: url,
                             Enabled: enabled
                        }
					}).then(function(response) {
                         success: {
                            if (options.id == 0) {
                                $.telligent.evolution.notifications.show(options.resources.saveSuccess);
                            }
                            else {
                                $.telligent.evolution.notifications.show(options.resources.updateSuccess);
                            }
                            $.telligent.evolution.administration.refresh();
                         }
                    });

                    return false;
				}
			})
			.evolutionValidation('addField', options.inputs.callbackUrlId, {
				required: true,
				url: true
			}, '.field-item.webhook-url .field-item-validation');

            $('input.select-all').on('click', function () {
                var isChecked = $(this).is(':checked');
                $("input[type='checkbox'][name='webhook']").each(function() {
                    $(this).prop('checked', isChecked);
                });
            });

            $("a.sample").on('click', function () {
                var isExpanded = $(this).hasClass("expanded");

                $("a.sample").each(function() {
                    $(this).removeClass("expanded");
                    $(this).text(options.resources.showSample);
                });
                $("div.documentation").each(function() {
                    $(this).hide();
                });

                if(!isExpanded) {
                    $(this).addClass("expanded");
                    $(this).siblings('div.documentation').show();
                    $(this).text(options.resources.hideSample);
                }
            });



            $.telligent.evolution.messaging.subscribe('webhook-regeneratesecret', function (data) {
				var id = $(data.target).data('id');

                $.telligent.evolution.post({
                    url: options.urls.regenSecret,
                    data: {
                         Id: id
                     },
                    success: function(response) {
                        $('.field-item.secret-token').find('.field-item-input').text(response.secretToken);
                        $.telligent.evolution.notifications.show(options.resources.secretRegenerated);
                    }
                });

                return false;
			});
        }
    };

    $.telligent = $.telligent || {};
    $.telligent.evolution = $.telligent.evolution || {};
    $.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
    $.telligent.evolution.widgets.webhookManagement = api;
    $.telligent.evolution.widgets.webhookManagementEditForm = editApi;

})(jQuery, window);
