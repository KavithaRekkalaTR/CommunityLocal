(function ($, global) {
	var api = {
		register: function (options) {
		    
		    options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);
			options.wrapper = $.telligent.evolution.administration.panelWrapper();
		    
			var headingTemplate = $.telligent.evolution.template.compile(options.templates.header);
			options.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();
			
			options.inputs.publishdate.glowDateTimeSelector(
			    $.extend({}, $.fn.glowDateTimeSelector.dateTimeDefaults, {
					showPopup: true,
					allowBlankvalue: true,
				}));
			
			options.inputs.unpublishdate.glowDateTimeSelector(
			    $.extend({}, $.fn.glowDateTimeSelector.dateTimeDefaults, {
					showPopup: true,
					allowBlankvalue: true,
				}));

            options.isSaving = false;
            options.save = $.telligent.evolution.administration.header().find('.button.save');
			options.save.evolutionValidation({
				onValidated: function (isValid, buttonClicked, c) {
					if (isValid && !options.uploading)
						options.save.removeClass('disabled');
					else
						options.save.addClass('disabled');
				},
				onSuccessfulClick: function (e) {
				    if (!options.save.hasClass('disabled') && !options.isSaving) {
				        options.isSaving = true;
					    options.save.addClass('disabled');
					    
					    var data = {
					        ArticleCollectionId: options.articleCollectionId,
					        Name: options.inputs.name.val()
					    };
					    
					    var publishDate = options.inputs.publishdate.glowDateTimeSelector('val');
					    if (publishDate) {
					        data.PublishDate = $.telligent.evolution.formatDate(publishDate);
					    } else {
					        data.RemovePublishDate = true
					    }
					    
					    var publishEndDate = options.inputs.unpublishdate.glowDateTimeSelector('val');
					    if (publishEndDate) {
					        data.PublishEndDate = $.telligent.evolution.formatDate(publishEndDate);
					    } else {
					        data.RemovePublishEndDate = true
					    }
					    
					    var p;
					    if (options.publishGroupId) {
					        data.PublishGroupId = options.publishGroupId;
					        p = $.telligent.evolution.put({
					            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/publishgroup/{PublishGroupId}.json',
					            data: data
					        });
					    } else {
					        p = $.telligent.evolution.post({
					            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/publishgroup/{ArticleCollectionId}.json',
					            data: data
					        });
					    }
					    
					    p.then(function() {
                            $.telligent.evolution.notifications.show(options.text.saveSuccessful, { type: 'success' });
                            $.telligent.evolution.messaging.publish('publishgroups.saved');
                            $.telligent.evolution.administration.close();
					    });
					    
			            options.isSaving = false;
			            options.save.removeClass('disabled');
				    }
				    
				    return false;
				}
			});
			
			options.save.evolutionValidation('addField', options.selectors.name, {
    				required: true
    			}, 
    			options.selectors.nameValidation, 
    			null
    		);
			
			
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.addUpdatePublishGroupPanel = api;

})(jQuery, window);