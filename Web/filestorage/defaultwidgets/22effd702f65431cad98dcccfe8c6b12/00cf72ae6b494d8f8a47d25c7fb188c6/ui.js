(function($, global, undef) {

    function hideShowResponseTypes(context) {
      if (context.inputs.enableHelpfulness.is(':checked')) {
		    context.inputs.responseTypeWrapper.show();
		} else {
		    context.inputs.responseTypeWrapper.hide();
		}  
    }
    
    function registerResponseTypeHandlers(context) {
        var add = context.inputs.responseTypeWrapper.find('a.add');
        add.on('click', function() {
            context.inputs.responseTypeWrapper.find('tbody').append('<tr><td><input type="text" /></td><td><input type="checkbox" /></td><td><a href="#" class="inline-button delete">' + context.text.del + '</a></td></tr>');
            return false;
        })
        
        context.responseTypesToDelete = [];
        context.inputs.responseTypeWrapper.on('click', 'a.delete', function(e) {
            var row = $(e.target).closest('tr');
            if (row.length > 0 && global.confirm(context.text.responseTypeDeleteConfirmation)) {
                if (row.data('id')) {
                    context.responseTypesToDelete.push(row.data('id'));
                }
                row.remove();
                context.checkHasResponseTypes();
            }
            return false;
        });
    }
    
    function saveResponseTypeChanges(context) {
        return $.telligent.evolution.batch(function() {

            context.inputs.responseTypeWrapper.find('tbody tr').each(function() {
               var row = $(this);
               var name = $.trim(row.find('input[type="text"]').val());
               var requireMessage = row.find('input[type="checkbox"]').is(':checked');
               
               if (name) {
                   if (row.data('id')) {
                        $.telligent.evolution.put({
                            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/helpfulness/responsetype/{Id}.json',
                            data: {
                                Id: row.data('id'),
                                Name: name,
                                RequireMessage: requireMessage ? 'True' : 'False'
                            }
                        })
                   } else {
                       $.telligent.evolution.post({
                           url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/helpfulness/responsetypes/{CollectionId}.json',
                           data: {
                               CollectionId: context.collectionId,
                               Name: name,
                               RequireMessage: requireMessage
                           }
                       })
                        .then(function(response) {
                            row.data('id', response.HelpfulnessResponseType.Id);
                        });
                   }
               }
            });
        
            context.responseTypesToDelete.forEach(function(id) {
                $.telligent.evolution.del({
                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/helpfulness/responsetype/{Id}.json',
                    data: {
                        Id: id
                    }
                })
                    .then(function() {
                       var i = context.responseTypesToDelete.indexOf(id);
                       if (i >= 0) {
                           context.responseTypesToDelete.splice(i, 1);
                       }
                    });
            });
        
        
        }, {
            sequential: true
        });
    }

	var api = {
		register: function(context) {
		    
		    $.telligent.evolution.administration.size('wide');

			var header = $($.telligent.evolution.template.compile(context.saveTemplateId)({}));
			var saveButton = header.find('a.save');

			$.telligent.evolution.administration.header(header);
			
			context.inputs.defaultType.glowDropDownList({
                selectedItemWidth: 300,
                itemsWidth: 300,
                itemsHtml: context.typeHtml
            });
            
            registerResponseTypeHandlers(context);

			if (context.reviewWorkflowIsEditable) {
    			var reviewWorkflow = $(context.inputs.reviewWorkflow);
    			reviewWorkflow.on('change', function() {
        		    var reviewWorkflowId = reviewWorkflow.val();
        
        		    var data = context.reviewWorkflowConfiguration.getValues();
        		    reviewWorkflow.closest('li').nextAll().remove();
        
        		    if (reviewWorkflowId == '') {
        		        return;
        		    }
        
        		    $.telligent.evolution.post({
        		        url: context.updateReviewWorkflowConfigurationFormUrl,
        		        data: {
        		            reviewWorkflowId: reviewWorkflowId,
        		            reviewWorkflowConfiguration: data != null ? $.telligent.evolution.url.serializeQuery(data) : ''
        		        }
        		    })
        		        .then(function(formHtml) {
        		           reviewWorkflow.closest('li').after(formHtml);
        		        });
        		});
			}

			saveButton.evolutionValidation({
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
				    var data = {
				        Prefix: context.inputs.prefix.val(),
				        EnableHelpfulness: context.inputs.enableHelpfulness.is(':checked')
				    };
				    
				    if (context.inputs.defaultType.val()) {
				        data.DefaultTypeId = context.inputs.defaultType.val();
				    } else {
				        data.RemoveDefaultTypeId = true;
				    }
				    
					if (context.reviewWorkflowIsEditable) {
					    var reviewConfigurationData = context.reviewWorkflowConfiguration.getValues();
					    data.reviewWorkflowId = reviewWorkflow.val();
					    data.reviewWorkflowConfiguration = reviewConfigurationData != null ? $.telligent.evolution.url.serializeQuery(reviewConfigurationData) : '';
					}
					
					$.telligent.evolution.post({
            				url: context.updateUrl,
            				data: data
            			}).then(function(response){
            			    saveResponseTypeChanges(context)
            			        .then(function() {
    						        $.telligent.evolution.notifications.show(context.text.updateSuccess, { type: 'success' });
            			        });
    					});
				}
			});

			saveButton.evolutionValidation('addField', context.inputs.prefix, { required: true }, '.field-item.prefix .field-item-validation');

			
			context.checkHasResponseTypes = saveButton.evolutionValidation('addCustomValidation', 'hasResponseTypes', function() {
			    return (!context.inputs.enableHelpfulness.is(':checked') || 
			        context.inputs.responseTypeWrapper.find('tbody input[type="text"]').filter(function() {
                        return this.value != '';
                    }).length > 0);
			}, context.text.responseTypeRequired, context.inputIds.responseTypeWrapper + ' .field-item-validation', null);

			context.inputs.enableHelpfulness.on('change', function() {
			    hideShowResponseTypes(context);
			    context.checkHasResponseTypes();
			});
			
			context.inputs.responseTypeWrapper.on('input', 'input', function() {
			    context.checkHasResponseTypes();
			});
			
			context.checkHasResponseTypes();
			
			hideShowResponseTypes(context);
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articleOptionsPanel = api;

})(jQuery, window);