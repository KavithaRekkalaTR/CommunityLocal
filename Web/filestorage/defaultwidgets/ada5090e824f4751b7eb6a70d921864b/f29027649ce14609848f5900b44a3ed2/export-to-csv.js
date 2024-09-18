(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	$.telligent.evolution.widgets.membersExport = {
		register: function(context) {

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();
			
			context.exportButton = context.headerWrapper.find('.export');
			context.exportButton.on('click', function() {
			   if (!context.exportButton.hasClass('disabled')) {
			       context.exportButton.addClass('disabled');

			       var fieldIds = [];
			       context.wrapper.find('input[type="checkbox"]:checked').each(function() {
			          fieldIds.push(this.value);
			       });
			       
			       $.telligent.evolution.post({
			           url: context.urls.saveFieldSelections,
			           data: {
			               ExportFieldIds: fieldIds.join(',')
			           }
			       })
			        .done(function(response) {
                        global.open($.telligent.evolution.url.modify({ 
			                url: context.urls.csvExport, query: context.query + '&w_ExportSelectionKey=' + response.key, hash: '' 
			            }));
			       
			            $.telligent.evolution.administration.close();
			        })
			        .catch(function() {
			            context.exportButton.removeClass('disabled');
			        });
			   }
			   
			   return false;
			});
			
			context.wrapper.on('click', '.select-all', function() {
			   $(this).parent().next('ul.field-list').find('input[type="checkbox"]').each(function() {
			       $(this).prop('checked', true);
			   });
			   return false;
			});
			
			context.wrapper.on('click', '.select-none', function() {
			   $(this).parent().next('ul.field-list').find('input[type="checkbox"]').each(function() {
			       $(this).prop('checked', false);
			   });
			   return false;
			});
        }
	};

}(jQuery, window));