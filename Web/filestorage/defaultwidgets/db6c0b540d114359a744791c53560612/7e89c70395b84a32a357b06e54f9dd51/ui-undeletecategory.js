(function ($, global) {
    
    var insertDeletedCategories = function(context) {
        var data = {};
        $.telligent.evolution.messaging.publish('categorymanagement.getdeleted', data);
        
        $.each(data.undeleted, function(id) {
            var item = context.inputs.list.children('.content-item[data-categoryid="' + id + '"]');
            if (item && item.length > 0) {
                item.remove();
            }
        });
        
        var list = context.inputs.list[0];
        $.each(data.deleted, function(index, category) {
            var item = context.templates.deletedCategory({
                category: category
            });
            
            var inserted = false;
            for (var i = 0; i < list.children.length && !inserted; i++) {
                if ($(list.children[i]).data('name') > category.name) {
                    $(list.children[i]).before(item);
                    inserted = true;
                }
            }
            
            if (!inserted) {
                context.inputs.list.append(item);
            }
        });
    }, checkNoItems = function(context) {
        if (context.inputs.list.children(':visible').length == 0) {
            context.inputs.noItems.show();
        } else {
            context.inputs.noItems.hide();
        }
    }
    
	var api = {
		register: function (context) {
            context.templates.deletedCategory = $.telligent.evolution.template.compile(context.templates.deletedCategory);
		   
            insertDeletedCategories(context); 
            
            checkNoItems(context);
            
            context.searchTimeout = null;
			context.inputs.query.on('input', function() {
				var queryText = $.trim($(this).val()).toLowerCase();
				global.clearTimeout(context.searchTimeout);
				context.searchTimeout = global.setTimeout(function() {
					if (queryText != context.queryText) {
						context.queryText = queryText;
            			if (queryText.length == 0) {
            				$('.content-item', context.inputs.list).show();
            				checkNoItems(context);
            			} else {
            				var searchTerms = queryText.split(' ');
            				var foundAny = false;
            				$('.content-item', context.inputs.list).each(function() {
            					var item = $(this);
            					var name = item.data('name').toLowerCase();
            					var match = true;
            					for (var i = 0; i < searchTerms.length; i++) {
            						if (name.indexOf(searchTerms[i]) == -1) {
            							match = false;
            							break;
            						}
            					}
            					if (match) {
            					    foundAny = true;
            						item.slideDown('fast');
            					} else {
            						item.slideUp('fast');
            					}
            				});
            				if (!foundAny) {
            				    global.setTimeout(function() {
            				        checkNoItems(context);
            				    }, 200);
            				} else {
        				        checkNoItems(context);
            				}
            			}
						
					}
				}, 500);
			});
            
            $.telligent.evolution.messaging.subscribe('categorymanagement.undelete', function(data) {
                var target = $(data.target);
                var parentId = target.data('parentcategoryid');
                if (parentId) {
                    var parentItem = context.inputs.list.children('.content-item[data-categoryid="' + parentId + '"]');
                    if (parentItem.length > 0) {
                        $.telligent.evolution.notifications.show(context.text.parentIsDeleted.replace(/\{0\}/g, parentItem.data('name')), { type: 'error' });
                        return;
                    }
                }

			    if (global.confirm(context.text.undeleteConfirmation.replace(/\{0\}/g, target.data('name')))) {
			        $.telligent.evolution.messaging.publish('categorymanagement.stageundelete', {
			            id: target.data('categoryid')
			        });
			        
			        var item = context.inputs.list.children('.content-item[data-categoryid="' + target.data('categoryid') + '"]');
			        item.slideUp('fast', function() {
			            item.remove();
			            checkNoItems(context);
			        })
			    }
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.undeleteCategoryPanel = api;

})(jQuery, window);