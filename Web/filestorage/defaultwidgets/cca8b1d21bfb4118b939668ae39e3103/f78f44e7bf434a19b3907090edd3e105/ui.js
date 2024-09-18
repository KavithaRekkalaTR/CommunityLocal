(function ($, global) {

	function checkHasChanges(context) {
	    if (Object.keys(context.updates).length > 0) {
	        context.save.removeClass('disabled');
	        return true;
	    } else {
	        context.save.addClass('disabled');
	        return false;
	    }
	}

	function saveChanges(context, progressFunc) {
	    return $.Deferred(function(d) {
	        var totalTasks = Object.keys(context.updates).length;
	        var category = context.fields.category.glowLookUpTextBox('getByIndex', 0);
	        
	        if (totalTasks <= 0) {
	            d.resolve();
	            return;
	        }
	        
	        var getNextTask = function() {
	            var ids, item, data;

	            ids = Object.keys(context.updates);
	            if (ids.length > 0) {
	                item = context.updates[ids[0]];

                    data = {
                       Id: item.value.id,
                       CategoryId: category.Value
                    }
                    
                    if (item.value.sortOrder) {
                        data.SortOrder = item.value.sortOrder;
                    } else if (item.value.sortOrder != item.value.originalSortOrder) {
                        data.RemoveSortOrder = true;
                    }
                    
                    return $.Deferred(function(d) {
                        $.telligent.evolution.post({
                            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/article/{Id}/category/{CategoryId}.json',
                            data: data
                        })
                            .then(function(r) {
                                delete context.updates[item.value.id];
                                item.value.originalSortOrder = item.value.sortOrder;
                                d.resolve();
                            })
                            .catch(function() {
                               d.reject(); 
                            });
                    });
	            }
	            
	            return null;
	        }
	        
    		var count = 0;
    		
    		var doNext = function() {
    		    var task = getNextTask();
    		
        		if (!task) {
        		    d.resolve();
        		} else {
        		    task
        		        .then(function() {
                            count++;
                            progressFunc(Math.round(count * 100 / totalTasks));
                            doNext(); 
        		        })
        		        .catch(function() {
                            d.reject();
        		        });
        		}
    		}
    		
    		doNext();
	    }).promise();
	}

	function resizeOrderedList(context) {
		var panel = $.telligent.evolution.administration.panelWrapper();
		context.fields.articles.glowOrderedList('resize', panel.width(), panel.height() - panel.find('p').outerHeight() - context.fields.category.closest('li').outerHeight() - panel.find('.navigation-list').outerHeight() - 80);
	}

	function reviewOrder(context) {
		var items = [];
		var itemCount = 0;
		var item;
		var i;

		itemCount = context.fields.articles.glowOrderedList('count');
		for (i = 0; i < itemCount; i++) {
			item = context.fields.articles.glowOrderedList('getByIndex', i);
			item.value.sortOrder = null;
			items.push({
				item: item,
				originalIndex: i
			});
		}
		
		var naturalOffset = -1;
		for (i = itemCount - 1; i >= 0 && naturalOffset == -1; i--) {
			if (i + 1 < itemCount && items[i + 1].item.value.name.toLowerCase() < items[i].item.value.name.toLowerCase()) {
			    naturalOffset = i;
			}
		}
		
		for (i = 0; i <= naturalOffset; i++) {
	        if (i > 0) {
	            var prev = items[i - 1].item.value.sortOrder;
	            var next = null;
	            if (i + 1 <= naturalOffset) {
	                next = items[i + 1].item.value.originalSortOrder;
	                if (!next) {
	                    next = prev + 200;
	                }
	            }
	            
	            if (items[i].item.value.originalSortOrder && items[i].item.value.originalSortOrder > prev && (next == null || items[i].item.value.originalSortOrder < next)) {
	                items[i].item.value.sortOrder = items[i].item.value.originalSortOrder;    
	            } else if (next && prev - next > 1) {
	                items[i].item.value.sortOrder = Math.ceiling(prev + next / 2.0);
	            } else {
	                items[i].item.value.sortOrder = prev + 100;
	            }
	        } else if (items[i].item.value.originalSortOrder) {
	            items[i].item.value.sortOrder = items[i].item.value.originalSortOrder;
	        } else {
	            items[i].item.value.sortOrder = 100;
	        }
		}

        for (i = 0; i < itemCount; i++) {
            if (items[i].item.value.sortOrder != items[i].item.value.originalSortOrder) {
                 context.updates[items[i].item.value.id] = items[i].item;
            } else {
                delete context.updates[items[i].item.value.id];
            }
        }
	}
	
	function loadArticles(context) {
	    return $.Deferred(function(d) {
    	    var category = context.fields.category.glowLookUpTextBox('getByIndex', 0);
    	    
    	    context.updates = {};
    	    context.fields.articles.glowOrderedList('clear');
    	    if (category == null) {
    	        context.fields.articles.glowOrderedList('refresh');
    	        d.resolve();
    	        return;
    	    }
    	    
    	    $.telligent.evolution.post({
    	        url: context.urls.getArticles, 
    	        data: {
    	            categoryId: category.Value
    	        }
    	    })
    	        .then(function(response) {
    	           response.articles.forEach(function(article) {
    	              context.fields.articles.glowOrderedList('add', context.fields.articles.glowOrderedList('createItem', {
    	                  value: {
    	                      id: article.id,
    	                      originalSortOrder: article.sortOrder,
    	                      sortOrder: article.sortOrder,
    	                      name: article.name
    	                  }, 
    	                  text: article.name, 
    	                  html: article.name
    	              }));
    	           });
    	           context.fields.articles.glowOrderedList('refresh');
    	           
    	           d.resolve();
    	        })
    	        .catch(function() {
    	            d.reject();
    	        });
	    }).promise();
	}
	
	function moveOrder(context, direction) {
	    var index = context.fields.articles.glowOrderedList('selectedIndex');
	    if (index < 0) {
	        return;
	    }
	    
	    if (direction === '+1') {
	        context.fields.articles.glowOrderedList('moveDown');
	    } else if (direction === '-1') {
	        context.fields.articles.glowOrderedList('moveUp');
	    } else if (direction == 0) {
	        context.fields.articles.glowOrderedList('moveTop');
	    } else {
	        context.fields.articles.glowOrderedList('moveBottom');
	    }
	}

	
	var api = {
		register: function (context) {
		    
		    context.updates = {};
		    
		    context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();
			
			context.fields.articles.glowOrderedList({
    	        height: 200
    	    }).on('glowOrderedListItemMoved', function(e, item, oldIndex, newIndex) {
    	        reviewOrder(context);
    	        checkHasChanges(context);
            });
			
			context.categoryLookupTimeout = null;
			context.fields.category.glowLookUpTextBox({
				emptyHtml: context.text.selectACategory,
				minimumLookUpLength: 0,
				maxValues: 1,
				onGetLookUps: function (tb, searchText) {
					global.clearTimeout(context.categoryLookupTimeout);
					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
					context.categoryLookupTimeout = global.setTimeout(function () {
						$.telligent.evolution.post({
							url: context.urls.getCategories,
							data: { 
							    query: searchText, 
							    articleCollectionId: context.collectionId
							},
							success: function (response) {
								if (response && response.matches.length > 0) {
									var suggestions = [];
									for (var i = 0; i < response.matches.length; i++) {
										suggestions.push(tb.glowLookUpTextBox('createLookUp', response.matches[i].id, response.matches[i].name, response.matches[i].name, true));
									}
									tb.glowLookUpTextBox('updateSuggestions', suggestions);
								} else {
									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noCategoryMatchesText, context.text.noCategoryMatchesText, false)]);
								}
							}
						});
					}, 500);
				},
				selectedLookUpsHtml: []
			})
				.on('glowLookUpTextBoxChange', function() {
				    if (!context.saving && (!checkHasChanges(context) || global.confirm(context.text.confirmUnsavedChanges))) {
				        context.currentCategory = context.fields.category.glowLookUpTextBox('getByIndex', 0);
				        loadArticles(context);
				    } else {
				        context.fields.category.glowLookUpTextBox('removeByIndex', 0);
				        context.fields.category.glowLookUpTextBox('add', context.currentCategory);
				    }
				});
		    
		    $.telligent.evolution.messaging.subscribe('articleordering-movefirst', function(e){
			    moveOrder(context, 0);
			});
			
			$.telligent.evolution.messaging.subscribe('articleordering-moveup', function(e){
			    moveOrder(context, '-1');
			});
			
			$.telligent.evolution.messaging.subscribe('articleordering-movedown', function(e){
			    moveOrder(context, '+1');
			});
			
			$.telligent.evolution.messaging.subscribe('articleordering-movelast', function(e){
			    moveOrder(context, 2);
			});
		    

			$(global).on('resized.articleOrderManagement', function() {
				resizeOrderedList(context);
			});

			$.telligent.evolution.administration.on('panel.unloaded', function(){
			   $(window).off('.articleOrderManagement');
			});

			global.setTimeout(function() {
				resizeOrderedList(context);
			}, 25);
			
			var headingTemplate = $.telligent.evolution.template.compile(context.templates.header);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

            context.save = $.telligent.evolution.administration.header().find('.button.save');
            context.saving = false;
			context.save.on('click', function() {
			    if (!context.saving && !context.save.hasClass('disabled')) {
			        context.saving = true;
			        context.save.addClass('disabled');
    				saveChanges(context, function(progress) {
    				    context.save.html(context.text.saveProgress.replace('{0}', progress));
    				})
    				    .then(function() {
    				        $.telligent.evolution.notifications.show(context.text.saveSuccessful, { type: 'success' });
    				    })
    				    .always(function() {
    				        context.save.html(context.text.save);
    				        context.saving = false;
    				        checkHasChanges(context);
    				    });
			    }
				return false;
			});
			
			$.telligent.evolution.administration.navigationConfirmation.enable('articles-managecategories', function() { 
			    return checkHasChanges(context);
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articleOrderingManagement = api;

})(jQuery, window);