(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	function updateSelectedTab(context) {
	    var selectedTabName = context.headerWrapper.find('.filter-option.selected a').data('tab');
	    
	    context.wrapper.find('.tab-content[data-tab!="' + selectedTabName + '"]').css({
	        visibility: 'hidden',
            height: '100px',
            width: '800px',
            left: '-1000px',
            position: 'absolute',
            overflow: 'hidden',
            top: '-1000px'
	    });
	    
	    context.wrapper.find('.tab-content[data-tab="' + selectedTabName + '"]').css({
	        visibility: 'visible',
            height: 'auto',
            width: 'auto',
            left: '0',
            position: 'static',
            overflow: 'visible',
            top: '0'
	    });
	}
	
	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

    function findContent(context, textbox, searchText) {
		window.clearTimeout(context.lookupContentTimeout);
		textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)]);
		context.lookupContentTimeout = window.setTimeout(function () {
			$.telligent.evolution.get({
				url: context.urls.lookupContent,
				data: { w_query: searchText },
				success: function (response) {
					if (response && response.matches.length > 1) {
                        var count = textbox.glowLookUpTextBox('count');
						var suggestions = [];
						for (var i = 0; i < response.matches.length; i++) {
							var item = response.matches[i];
							if (item && item.id) {
                                suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.id, item.title, item.preview, true));
							}
						}

						textbox.glowLookUpTextBox('updateSuggestions', suggestions);
					}
					else
						textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', context.text.noSearchMatch, context.text.noSearchMatch, false)]);
				}
			});
		}, 500);
	}

	$.telligent.evolution.widgets.scorePluginMetricSamples = {
		register: function(context) {
            context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

            var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();
			
			context.headerWrapper.on('click', '.filter-option a', function(e) {
			    $(this).closest('ul').find('li').removeClass('selected');
			    $(this).closest('.filter-option').addClass('selected');
			    updateSelectedTab(context);
			    return false;
			});
			
			context.fields.findContent.glowLookUpTextBox({
			    maxValues: 1,
			    onGetLookUps: function(tb, query) {
			        findContent(context, tb, query);
			    },
			    emptyHtml: context.text.findContentPlaceholder,
			    minimumLookUpLength: 1
			})
			    .on('glowLookUpTextBoxChange', function() {
			        if (context.fields.findContent.glowLookUpTextBox('count') > 0) {
			            context.fields.searchSample.empty();
			            
			            var ids = context.fields.findContent.glowLookUpTextBox('getByIndex', 0).Value.split(/,/);
			            $.telligent.evolution.get({
            				url: context.urls.getSampleMetric,
            				data: { w_contentid: ids[0], w_contenttypeid: ids[1] },
            				success: function (response) {
            					context.fields.searchSample.html(response);
            				}
            			});
			            
			        } else {
			            context.fields.searchSample.empty();
			        }
			    });
			
			
			updateSelectedTab(context);
		}
	};

}(jQuery, window));