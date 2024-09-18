(function ($, global) {
    var _navigationConfirmationId = '_articles_createedit';
    
	if (typeof $.telligent === 'undefined')
		$.telligent = {};

	if (typeof $.telligent.evolution === 'undefined')
		$.telligent.evolution = {};

	if (typeof $.telligent.evolution.widgets === 'undefined')
		$.telligent.evolution.widgets = {};

	var _trackChars = function (context, field, maxLength) {
		 var curLen = field.val().length;
		 var togo = maxLength - curLen;
		 var label = field.parent().next('span.character-count');

		 if (togo >= 0) {
			 label.html(curLen + ' ' + context.text.charactersRemain);
			 label.removeClass('field-item-validation');
		 }
		 else {
			 label.html((togo * -1) + ' ' + context.text.charactersOver);
			 label.addClass('field-item-validation');
		 }
	},
	_submit = function (context, publish) {
	    return $.Deferred(function(d) {
	        
	        if (publish && context.fields.categories.glowLookUpTextBox('count') == 0 && !context.loadedVersion.defaultFor && !global.confirm(context.text.uncategorizedConfirmation)) {
	            d.reject();
	            return;
	        }
	        
			var data = {
			    TypeId: context.fields.type.glowDropDownList('val'),
				Title: context.fields.title.evolutionComposer('val'),
				Body: context.fields.body.evolutionHtmlEditor('val'),
				Tags: context.fields.tags.evolutionTagTextBox('val'),
				MetaTitle: context.fields.metaTitle.val(),
				MetaKeywords: context.fields.metaKeywords.val(),
				MetaDescription: context.fields.metaDescription.val(),
				CollectionId: context.collectionId,
                SuppressNotifications: context.fields.suppressNotifications.is(':checked')
			};

			var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);
			var publishGroupId = null;
	        if (publishGroup) {
	            publishGroupId = publishGroup.Value;
	        }
	        if (publishGroupId) {
	            data.PublishGroupId = publishGroupId;
	        } else {
	            data.RemovePublishGroup = true;
	        }

            var savePromise;
			if (context.articleId != null) {
				data.Id = context.articleId;

				if (context.version) {
				    data.Version = context.version;
    				savePromise = $.telligent.evolution.put({
    					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/article/{Id}/version/{Version}.json?IncludeFields=Id,Version,IsPublished,Url',
    					data: data
    				});
				} else {
				    data.ReadyToPublish = false;
				    savePromise = $.telligent.evolution.put({
    					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/article/{Id}.json?IncludeFields=Id,Version,IsPublished,Url',
    					data: data
    				});
				}
			}
			else {
			    data.ReadyToPublish = false;
				savePromise = $.telligent.evolution.post({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/collection/{CollectionId}/article.json?IncludeFields=Id,Version,IsPublished,Url',
					data: data,
				});
			}

			savePromise
			    .then(function (response) {
			        context.articleId = response.ArticleVersion.Id;
					_saveOrder(context, response.ArticleVersion.Id, response.ArticleVersion.Version, data.PublishGroupId, function(percent) {
					    if (publish) {
					        context.fields.publish.html(context.text.saveProgress.replace(/\{0\}/g, Math.round(percent / 2)));
					    } else {
					        context.fields.draft.html(context.text.saveProgress.replace(/\{0\}/g, Math.round(percent / 2)));
					    }
					})
    					.then(function() {
    					    _saveResolved(context, response.ArticleVersion.Id, response.ArticleVersion.Version, function(percent) {
    					        if (publish) {
        					        context.fields.publish.html(context.text.saveProgress.replace(/\{0\}/g, Math.round(50 + (percent / 2))));
        					    } else {
        					        context.fields.draft.html(context.text.saveProgress.replace(/\{0\}/g, Math.round(50 + (percent / 2))));
        					    }
    					    })
    					        .then(function() {
    					            
    					            var data = {
    					                ReadyToPublish: publish,
    					                Id: response.ArticleVersion.Id,
    					                Version: response.ArticleVersion.Version
    					            };
    					            
    					            if (!publishGroupId) {
                        			    var publishDate = context.fields.publishDate.glowDateTimeSelector('val');
                        			    if (publishDate) {
                        			        data.PublishDate = $.telligent.evolution.formatDate(publishDate);
                        			    } else {
                        			        data.RemovePublishDate = true;
                        			    }
                        			}
                        
                        			var publishEndDate = context.fields.publishEndDate.glowDateTimeSelector('val');
                        		    if (publishEndDate) {
                        		        data.PublishEndDate = $.telligent.evolution.formatDate(publishEndDate);
                        		    } else {
                        		        data.RemovePublishEndDate = true;
                        		    }
                        		    
                        		    // update publish status now that categories/resolved flags are saved
                    				$.telligent.evolution.put({
                    					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/article/{Id}/version/{Version}.json?IncludeFields=Id,Version,IsPublished,Url',
                    					data: data
                    				})
                    				    .then(function(response) {
                    				        d.resolve(response.ArticleVersion.IsPublished, response.ArticleVersion.IsPendingReview, response.ArticleVersion.Url);
                    				    })
                    				    .catch(function() {
                    				        d.reject();
                    				    });
    					        })
    					        .catch(function() {
    					            d.reject();
    					        })
    					})
    					.catch(function() {
    					    d.reject();
    					});
				})
				.catch(function() {
				    d.reject();
				});
	    }).promise();
	},
	_getOrderingChanges = function(context, articleId, version, publishGroupId) {
	    var changes = {
	        remove: [],
	        update: []
	    };
		
	    var i, count, categories;
	    if (!context.canOrder) {
			categories = {};

			count = context.fields.categories.glowLookUpTextBox('count');
    	    for (i = 0; i < count; i++) {
    	        category = context.fields.categories.glowLookUpTextBox('getByIndex', i);
    	        categories[category.Value] = true;
    	    }

			// deleted categories
    	    $.each(context.originalCategories, function(i, category) {
    	       if (!categories[category.id]) {
    	           changes.remove.push({
    	               ArticleId: articleId,
    	               Version: version,
    	               CategoryId: category.id,
    	               PublishGroupId: publishGroupId
    	           });
    	       }
    	    });

	        // add/update categories
	        $.each(categories, function(categoryId) {
	           changes.update.push({
	               ArticleId: articleId,
	               Version: version,
	               CategoryId: categoryId,
	               SortOrder: null,
	               RemoveSortOrder: false,
    	           PublishGroupId: publishGroupId
	           });
	        });
	    } else {
    	    // deleted categories
    	    $.each(context.originalCategories, function(i, category) {
    	       if (!context.fields.categoryOrders[category.id]) {
    	           changes.remove.push({
    	               ArticleId: articleId,
    	               Version: version,
    	               CategoryId: category.id,
    	               PublishGroupId: publishGroupId
    	           });
    	       }
    	    });

    	    // updated categories
    	    $.each(context.fields.categoryOrders, function(categoryId, orderOptions) {
                var items = [], naturalItems = [];
        		var itemCount = 0;
        		var item;
        		var i, j;

    			itemCount = orderOptions.list.glowOrderedList('count');
    			for (i = 0; i < itemCount; i++) {
    				item = orderOptions.list.glowOrderedList('getByIndex', i);
    				item.value.sortOrder = null;
    				items.push({
    					item: item,
    					originalIndex: i
    				});
    			}

    			if (orderOptions.item.value.manualIndex === null) {
    			    // article is not manually ordered, just ensure its associated
    			    changes.update.push({
    	               ArticleId: articleId,
    	               Version: version,
    	               CategoryId: categoryId,
    	               SortOrder: null,
    	               RemoveSortOrder: true,
        	           PublishGroupId: publishGroupId
    	           });
    			} else {
    			    // review order of items before the current article
    			    var articleIndex = -1, nextSortOrder = null;
            		var naturalOffset = 0, isNatural;
            		for (i = 0; i < itemCount && articleIndex == -1; i++) {
            		    if (i + 1 == itemCount) {
            		        isNatural = itemCount <= 1 || items[i - 1].item.value.name.toLowerCase() <= items[i].item.value.name.toLowerCase();
            		    } else if (i == 0) {
            		        isNatural = items[i + 1].item.value.name.toLowerCase() >= items[i].item.value.name.toLowerCase() && items[i + 1].item.value.originalSortOrder === null;
            		    } else {
            		        isNatural = items[i + 1].item.value.name.toLowerCase() >= items[i].item.value.name.toLowerCase() 
            		            && items[i - 1].item.value.name.toLowerCase() <= items[i].item.value.name.toLowerCase()
            		            && items[i + 1].item.value.originalSortOrder === null;
            		    }

            			if (!isNatural) {
            				for (j = i; j >= naturalOffset; j--) {
            				    items[j].item.value.sortOrder = j + 1;
            				}
            				naturalOffset = i;
            			}
            			// stop reviewing once we reach the article
            			if (items[i].item == orderOptions.item) {
            			    articleIndex = i;
            			    if (i + 1 < itemCount) {
            			        nextSortOrder = items[i + 1].item.value.originalSortOrder;
            			    }
            			}
            		}

            		if (orderOptions.item.value.sortOrder === null) {
            		    // order is natural
            		    changes.update.push({
        	               ArticleId: articleId,
        	               Version: version,
        	               CategoryId: categoryId,
        	               SortOrder: null,
        	               RemoveSortOrder: true,
            	           PublishGroupId: publishGroupId
        	           });
            		} else {
            		    var prevSortOrder = null;
            		    if (articleIndex > 0) {
            		        prevSortOrder = items[articleIndex - 1].item.value.originalSortOrder;
            		    }

            		    if (nextSortOrder !== null) {
            		        if (prevSortOrder === null && nextSortOrder > 2) {
                                changes.update.push({
                	               ArticleId: articleId,
                	               Version: version,
                	               CategoryId: categoryId,
                	               SortOrder: nextSortOrder / 2,
                	               RemoveSortOrder: false,
                    	           PublishGroupId: publishGroupId
                	           });
            		        } else if (prevSortOrder !== null && nextSortOrder - prevSortOrder > 1) {
            		            changes.update.push({
                	               ArticleId: articleId,
                	               Version: version,
                	               CategoryId: categoryId,
                	               SortOrder: Math.round((nextSortOrder + prevSortOrder) / 2),
                	               RemoveSortOrder: false,
                    	           PublishGroupId: publishGroupId
                	           });
            		        } else {
            		            // need to do more reordering :/
            		            for (i = 0; i < itemCount && (i <= articleIndex || items[i].item.value.originalSortOrder !== null); i++) {
            		                if (i == articleIndex) {
            		                    changes.update.push({
                        	               ArticleId: articleId,
                        	               Version: version,
                        	               CategoryId: categoryId,
                        	               SortOrder: (i + 1) * 100,
                        	               RemoveSortOrder: false,
                            	           PublishGroupId: publishGroupId
                        	           });
            		                } else {
                		                changes.update.push({
                    		                ArticleId: items[i].item.value.articleId,
                    		                Version: items[i].item.value.version,
                    		                CategoryId: categoryId,
                    		                SortOrder: (i + 1) * 100,
                    		                RemoveSortOrder: false,
                    		                PublishGroupId: items[i].item.value.publishGroupId
                    		            });
            		                }
            		            }
            		        }
            		    } else {
            		        // order everything through this article
            		        for (i = 0; i < articleIndex; i++) {
            		            changes.update.push({
            		                ArticleId: items[i].item.value.articleId,
            		                Version: items[i].item.value.version,
            		                CategoryId: categoryId,
            		                SortOrder: (i + 1) * 100,
            		                RemoveSortOrder: false,
            		                PublishGroupId: items[i].item.value.publishGroupId
            		            });
            		        }

            		        changes.update.push({
            	               ArticleId: articleId,
            	               Version: version,
            	               CategoryId: categoryId,
            	               SortOrder: (articleIndex + 1) * 100,
            	               RemoveSortOrder: false,
                	           PublishGroupId: publishGroupId
            	           });
            		    }
            		}
    			}
    	    });
	    }

	    return changes;
	},
	_saveResolved = function(context, articleId, version, progressFunc) {
	    return $.Deferred(function(d) {
	        if (!context.helpfulnessLoaded) {
	            d.resolve();
	            return;
	        }
	        
	        var checkboxes = context.fields.helpfulness.find('input[type="checkbox"]');
	        var getNextTask = function() {
	            while (count < checkboxes.length) {
    	            var cb = $(checkboxes[count]);
    	            if (cb.is(':checked') != cb.data('waschecked')) {
    	                if (cb.is(':checked')) {
                            return $.telligent.evolution.put({
        	                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/helpfulness/{HelpfulnessId}.json',
        	                    data: {
        	                        HelpfulnessId: cb.data('id'),
        	                        ResolvedArticleVersionId: version
        	                    }
        	                });
    	                } else {
    	                    return $.telligent.evolution.put({
        	                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/helpfulness/{HelpfulnessId}.json',
        	                    data: {
        	                        HelpfulnessId: cb.data('id'),
        	                        UnresolvedArticleVersionId: version
        	                    }
        	                });
    	                }
    	            }
    	            
    	            count++;
	            }
	            
	            return null;
	        }
	        
	        var totalTasks = checkboxes.length;
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
	},
	_saveOrder = function(context, articleId, version, publishGroupId, progressFunc) {
	    return $.Deferred(function(d) {
	        var changes = _getOrderingChanges(context, articleId, version, publishGroupId);
	        var totalTasks = changes.remove.length + changes.update.length;
	        var removeIndex = 0;
	        var updateIndex = 0;

	        var getNextTask = function() {
	            if (removeIndex < changes.remove.length) {
	                var remove = changes.remove[removeIndex];
	                removeIndex++;

	                return $.telligent.evolution.del({
                        url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/article/{ArticleId}/{Version}/category/{CategoryId}.json',
                        data: remove
                    });
                }

	            if (updateIndex < changes.update.length) {
	                var update = changes.update[updateIndex];
	                updateIndex++;
	                
	                if (!update.Version) {
	                    return $.telligent.evolution.post({
    	                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/article/{ArticleId}/category/{CategoryId}.json',
    	                    data: update
    	                });
	                } else {
                        return $.telligent.evolution.post({
    	                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/article/{ArticleId}/{Version}/category/{CategoryId}.json',
    	                    data: update
    	                });
	                }
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
	},
	_requestLoadVersion = function(context, versionId, isPublished, publishGroupId, publishGroupName) {
	    return $.Deferred(function(d) {
            if (!_isVersionChanged(context) || global.confirm(context.text.confirmIgnoreUnsavedChanges)) {
                if (versionId == null) {
                    _loadVersion(context)
                        .then(function() {
                            d.resolve();
                        })
                        .catch(function() {
                            d.reject();
                        });
		        } else if (isPublished === false) {
        			if (context.fields.viewPublishGroup.length > 0) {
	                    var count = context.fields.viewPublishGroup.glowLookUpTextBox('count');
        			    var i;
        			    for (i = 0; i < count; i++) {
        			        context.fields.viewPublishGroup.glowLookUpTextBox('removeByIndex', 0);
        			    }
        			    if (publishGroupId !== null && publishGroupName !== null) {
        			        context.fields.viewPublishGroup.glowLookUpTextBox('add', context.fields.viewPublishGroup.glowLookUpTextBox('createLookUp', publishGroupId, publishGroupName, publishGroupName, true));
        			    }
                    }

                    _loadVersion(context, versionId)
                        .then(function() {
                            d.resolve();
                        })
                        .catch(function() {
                            d.reject();
                        });
                } else if (context.hasPublishGroups) {
                    $.glowModal({
                        html: $.telligent.evolution.get({
                            url: context.urls.selectPublishGroup,
                            data: {
                                w_collectionId: context.collectionId
                            }
                        }),
                        title: context.text.selectPublishGroup,
                        width: 450,
                        onClose: function(v) {
                            if (v === undefined) {
                                d.reject();
                            } else {
                                var publishGroup = v.length == 0 ? null : JSON.parse(v);

                                $.telligent.evolution.post({
            		                url: context.urls.getVersion,
            		                data: {
            		                    articleId: context.articleId,
            		                    publishGroupId: publishGroup == null ? null : publishGroup.id,
            		                    articleCollectionId: context.collectionId
            		                }
            		            })
            		                .then(function(version) {
            		                    if (version && version.exists) {
            		                        global.alert(context.text.versionDraftAlreadyExists);
            		                        d.reject();
            		                    } else {
            		                        if (context.fields.viewPublishGroup.length > 0) {
                        	                    var count = context.fields.viewPublishGroup.glowLookUpTextBox('count');
                                			    var i;
                                			    for (i = 0; i < count; i++) {
                                			        context.fields.viewPublishGroup.glowLookUpTextBox('removeByIndex', 0);
                                			    }
                                			    if (publishGroup) {
                                			        context.fields.viewPublishGroup.glowLookUpTextBox('add', context.fields.viewPublishGroup.glowLookUpTextBox('createLookUp', publishGroup.id, publishGroup.name, publishGroup.name, true));
                                			    }
                                            }

            		                        _loadVersion(context, versionId)
                                                .then(function() {
                                                    d.resolve();
                                                })
                                                .catch(function() {
                                                    d.reject();
                                                });
            		                    }
            		                })
            		                .catch(function() {
            		                    d.reject();
            		                });
                            }
                        }
                    });
		        } else {
		            $.telligent.evolution.post({
		                url: context.urls.getVersion,
		                data: {
		                    articleId: context.articleId,
            		        articleCollectionId: context.collectionId
		                }
		            })
		                .then(function(version) {
		                    if (version && version.exists) {
		                        global.alert(context.text.versionDraftAlreadyExists);
		                        d.reject();
		                    } else {
		                        _loadVersion(context, versionId)
                                    .then(function() {
                                        d.resolve();
                                    })
                                    .catch(function() {
                                        d.reject();
                                    });
		                    }
		                })
		                .catch(function() {
		                    d.reject();
		                });
		        }
            } else if (context.loadedVersion) {
                var count = context.fields.viewPublishGroup.glowLookUpTextBox('count');
    		    var i;
    		    for (i = 0; i < count; i++) {
    		        context.fields.viewPublishGroup.glowLookUpTextBox('removeByIndex', 0);
    		    }
    		    if (context.loadedVersion.publishGroup) {
    		        context.fields.viewPublishGroup.glowLookUpTextBox('add', context.fields.viewPublishGroup.glowLookUpTextBox('createLookUp', context.loadedVersion.publishGroup.id, context.loadedVersion.publishGroup.name, context.loadedVersion.publishGroup.name, true));
    		    }
    		    d.reject();
            }
	    }).promise();
	},
	_loadVersion = function(context, versionId) {
	    return $.Deferred(function(d) {
    	    var viewPublishGroup = context.fields.viewPublishGroup.glowLookUpTextBox('getByIndex', 0);

    	    $.telligent.evolution.post({
    	        url: context.urls.getVersion,
    	        data: {
    	            articleCollectionId: context.collectionId,
    	            articleId: context.articleId,
    	            publishGroupId: viewPublishGroup == null ? null : viewPublishGroup.Value,
    	            versionId: versionId == null ? '' : versionId
    	        }
    	    })
    	        .then(function(data) {
    	            context.fields.versionInfo.html(context.templates.versionInfo({
    	                version: data
    	            }));
    	            if ($.trim(context.fields.versionInfo.html()).length > 0) {
    	                context.fields.versionInfo.show();
    	            } else {
    	                context.fields.versionInfo.hide();
    	            }

    	            if (data.title && data.title.length > 0) {
    	                context.fields.formTitle.html(data.title);
    	            } else {
    	                context.fields.formTitle.html(context.text.newArticle);
    	            }

    	            if (data.id) {
    	                context.fields.viewPublishGroup.closest('.filter').show();
    	            } else {
    	                context.fields.viewPublishGroup.closest('.filter').hide();
    	            }

    	            context.version = data.isPublished ? null : data.version;
    	            context.originalCategories = data.categories;

    	            if (data.typeId) {
    	                context.fields.type.glowDropDownList('val', data.typeId);
    	            } else {
    	                context.fields.type.glowDropDownList('val', '');
    	            }

    			    context.fields.title.evolutionComposer('val', data.title);

    			    context.fields.body.evolutionHtmlEditor('val', '');
    			    context.fields.body.evolutionHtmlEditor('context', context.collectionId + ':' + (data.id || 'new') + ':' + (data.publishGroup ? data.publishGroup.id : 'nopublishgroup'));
    			    if (context.fields.body.evolutionHtmlEditor('val').replace(/(<p>\s*<\/p>|<div>\s*<\/div>|\s*)/g, '') == '') {
    			        context.fields.body.evolutionHtmlEditor('val', data.body);
    			    }

    			    context.fields.tags.evolutionTagTextBox('val', data.tags);

    			    var count = context.fields.publishGroup.glowLookUpTextBox('count');
    			    var i;
    			    for (i = 0; i < count; i++) {
    			        context.fields.publishGroup.glowLookUpTextBox('removeByIndex', 0);
    			    }
    			    if (data.publishGroup) {
    			        context.fields.publishGroup.glowLookUpTextBox('add', context.fields.publishGroup.glowLookUpTextBox('createLookUp', data.publishGroup.id, data.publishGroup.name, data.publishGroup.name, true));
    			    }

    			    if (data.publishDate) {
    			        context.fields.publishDate.glowDateTimeSelector('val', new Date(data.publishDate));
    			    } else {
    			        context.fields.publishDate.glowDateTimeSelector('val', null);
    			    }

    			    if (data.publishEndDate) {
    			        context.fields.publishEndDate.glowDateTimeSelector('val', new Date(data.publishEndDate));
    			    } else {
    			        context.fields.publishEndDate.glowDateTimeSelector('val', null);
    			    }

        			context.fields.metaTitle.val($.telligent.evolution.html.decode(data.metaTitle));
        			context.fields.metaKeywords.val($.telligent.evolution.html.decode(data.metaKeywords));
        			context.fields.metaDescription.val($.telligent.evolution.html.decode(data.metaDescription));

        			var count = context.fields.categories.glowLookUpTextBox('count');
        		    var i;
        		    for (i = 0; i < count; i++) {
        		        context.fields.categories.glowLookUpTextBox('removeByIndex', 0);
        		    }
        		    for (i = 0; i < data.categories.length; i++) {
        		        context.fields.categories.glowLookUpTextBox('add', context.fields.categories.glowLookUpTextBox('createLookUp', data.categories[i].id, data.categories[i].name, data.categories[i].name, true));
        		    }
        		    
        		    if (data.defaultFor) {
        		        context.fields.categories.closest('.field-item').find('.default-for').html(data.defaultFor);
        		    } else {
        		        context.fields.categories.closest('.field-item').find('.default-for').hide();
        		    }

        		    context.loadedVersion = data;
        		    context.categoriesChanged = false;
        		    context.orderingChanged = false;

        			_updateButtonState(context);
        			_updateOrdering(context, data.categories);
        			_publishGroupChanged(context, false);
        			_refreshHelpfulness(context);

        			d.resolve();
    	        })
    	        .catch(function() {
    	            d.reject();
    	        })
	    }).promise();
	},
	_normalizeDate = function(d) {
	  if (!d) {
	      return d;
	  }

	  d.setSeconds(0);
	  d.setMilliseconds(0);

	  return d;
	},
	_isVersionChanged = function(context) {
	    if (!context.loadedVersion) {
	        return false;
	    }

	    if (context.loadedVersion.typeId != context.fields.type.glowDropDownList('val')
            || context.loadedVersion.title != context.fields.title.evolutionComposer('val')
	        || $.telligent.evolution.html.decode(context.loadedVersion.body) != $.telligent.evolution.html.decode(context.fields.body.evolutionHtmlEditor('val'))
	        || context.loadedVersion.tags != context.fields.tags.evolutionTagTextBox('val')
	        || (context.loadedVersion.metaTitle || '') != context.fields.metaTitle.val()
	        || (context.loadedVersion.metaKeywords || '') != context.fields.metaKeywords.val()
	        || (context.loadedVersion.metaDescription || '') != context.fields.metaDescription.val())
	        return true;

		var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);
		var publishGroupId = null;
        if (publishGroup) {
            publishGroupId = publishGroup.Value;
        }

	    if ((context.loadedVersion.publishGroup == null) != (publishGroupId == null)) {
	        return true;
	    } else if (context.loadedVersion.publishGroup && context.loadedVersion.publishGroup.id != publishGroupId) {
	        return true;
	    }

	    var publishDate = context.fields.publishDate.glowDateTimeSelector('val');
	    if ((publishDate == null) != (context.loadedVersion.publishDate == null)) {
	        return true;
	    } else if (publishDate != null && $.telligent.evolution.formatDate(_normalizeDate(publishDate)) != $.telligent.evolution.formatDate(_normalizeDate(new Date(context.loadedVersion.publishDate)))) {
	        return true;
	    }

		var publishEndDate = context.fields.publishEndDate.glowDateTimeSelector('val');
	    if ((publishEndDate == null) != (context.loadedVersion.publishEndDate == null)) {
	        return true;
	    } else if (publishEndDate != null && $.telligent.evolution.formatDate(_normalizeDate(publishEndDate)) != $.telligent.evolution.formatDate(_normalizeDate(new Date(context.loadedVersion.publishEndDate)))) {
	        return true;
	    }

	    if (context.categoriesChanged || context.orderingChanged) {
	        return true;
	    }

	    return false;
	},
	_updateButtonState = function(context) {
	    var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);
	    if (publishGroup != null) {
	        if (context.loadedVersion && context.loadedVersion.publishGroup && publishGroup.Value == context.loadedVersion.publishGroup.id && !context.loadedVersion.publishGroup.isActive) {
	            publishGroup = null;
	        }
	    }
	    
	    if (publishGroup != null || context.fields.publishDate.glowDateTimeSelector('val')) {
	        context.fields.publish.html(context.text.readyToPublish);
	    } else {
	        context.fields.publish.html(context.text.publish);
	    }
	},
	_registerValidation = function(context, button, getSavePromise, onValidated) {
	    button.evolutionValidation({
			validateOnLoad: context.pageId <= 0 ? false : null,
			onValidated: function (isValid, buttonClicked, c) {
				if (isValid && !context.isSaving) {
					button.removeClass('disabled');
					onValidated(isValid);
				} else {
					button.addClass('disabled');
					onValidated(isValid);
				}
			},
			onSuccessfulClick: function (e) {
			    if (!button.hasClass('disabled')) {
			        var buttonHtml = button.html();
			        context.isSaving = true;
					$('.processing', button.parent()).css('visibility', 'visible');
				    button.addClass('disabled');
				    onValidated(false);
				    getSavePromise(e)
				        .always(function() {
				            context.isSaving = false;
				            button.removeClass('disabled').html(buttonHtml);
				            onValidated(true);
				            $('.processing', button.parent()).css('visibility', 'hidden');
				        });
			    }
			    
			    return false;
			}
		});

		var tf = button.evolutionValidation('addCustomValidation', 'post-type', function () {
				return context.fields.type.glowDropDownList('val').length > 0;
			},
			context.text.requiredField,
			'#' + context.wrapperId + ' .field-item.post-type .field-item-validation',
			null
		);
		context.fields.type.on('change', tf);

		button.evolutionValidation('addField', context.selectors.title, {
				required: true,
				messages: {
					required: context.text.requiredField
				}
			},
			'#' + context.wrapperId + ' .field-item.post-name .field-item-validation',
			null
		);

		var bf = button.evolutionValidation('addCustomValidation', 'post-body', function () {
				return context.fields.body.evolutionHtmlEditor('val').length > 0;
			},
			context.text.requiredField,
			'#' + context.wrapperId + ' .field-item.post-body .field-item-validation',
			null
		);
		context.fields.body.on('change', bf);
	},
	_publishGroupChanged = function(context, reloadOrdering) {
	  var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);
	  if (publishGroup == null) {
	      context.fields.publishDate.closest('li.field-item').show();
	  } else {
	      context.fields.publishDate.closest('li.field-item').hide();
	  }
	  
	  if (reloadOrdering !== false) {
    	  // reload/reset ordering
    	  _updateOrdering(context, []);
	  }
	},
	_updateEditorContext = function(context) {
        var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);
        var content = context.fields.body.evolutionHtmlEditor('val');
        context.fields.body.evolutionHtmlEditor('context', context.collectionId + ':' + (context.articleId || 'new') + ':' + (publishGroup ? publishGroup.Value : 'nopublishgroup'));
        if (context.fields.body.evolutionHtmlEditor('val').replace(/(<p>\s*<\/p>|<div>\s*<\/div>|\s*)/g, '') == '') {
	        context.fields.body.evolutionHtmlEditor('val', content);
	    }
	},
	_updateOrdering = function(context, existingArticleCategories) {
	    var existingOrders = {}, i, count, category, html;

	    if (existingArticleCategories) {
	        for (i = 0; i < existingArticleCategories.length; i++) {
	            existingOrders[existingArticleCategories[i].id] = {
	                sortOrder: existingArticleCategories[i].sortOrder,
	                manualIndex: null
	            };
	        }
	    } else {
	        $.each(context.fields.categoryOrders, function(categoryId, data) {
	            existingOrders[categoryId] = {
	                manualIndex: data.manualIndex,
	                sortOrder: data.sortOrder
	            };
	        });
	    }

	    context.fields.ordering.html('');
	    count = context.fields.categories.glowLookUpTextBox('count');
	    if (count == 0 || !context.canOrder) {
	        context.fields.orderingWrapper.hide();
	    } else {
	        context.fields.orderingWrapper.show();
	    }

	    context.fields.categoryOrders = {};
	    for (i = 0; i < count; i++) {
	        category = context.fields.categories.glowLookUpTextBox('getByIndex', i);
	        html = $(context.templates.orderingItem({
	            category: {
    	            name: category.SelectedHtml,
    	            id: category.Value
    	        },
    	        articles: []
	        }));
	        context.fields.ordering.append(html);
	        _populateOrder(context, html.find('select'), category.Value, existingOrders[category.Value] || null);
	    }
	},
	_populateOrder = function(context, list, categoryId, existingOrder) {
	    context.fields.categoryOrders[categoryId] = {
	        list: list,
	        item: null,
	        sortOrder: existingOrder ? existingOrder.sortOrder : null,
	        manualIndex: existingOrder? existingOrder.manualIndex : null
	    };

	    list.glowOrderedList({
	        height: 200
	    }).on('glowOrderedListItemMoved', function(e, item, oldIndex, newIndex) {
	        context.fields.categoryOrders[categoryId].manualIndex = newIndex;
            item.value.manualIndex = newIndex;
            context.orderingChanged = true;
        });

        var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);

	    $.telligent.evolution.post({
	        url: context.urls.getArticlesInCategory,
	        data: {
	            categoryId: categoryId,
	            publishGroupId: publishGroup == null ? null : publishGroup.Value
	        }
	    })
	        .then(function(response) {
	            response.articles.forEach(function(a) {
	                a.originalSortOrder = a.sortOrder;
	                var item = list.glowOrderedList('createItem', {
	                    value: a,
	                    text: a.name,
	                    html: a.name,
	                    orderable: a.articleId == context.articleId,
	                    selectable: a.articleId == context.articleId
	                });

	                if (a.articleId == context.articleId) {
	                    context.fields.categoryOrders[categoryId].item = item;
	                    item.value.manualIndex = null;
	                    if (existingOrder) {
	                        item.value.manualIndex = existingOrder.manualIndex;
	                        item.value.sortOrder = existingOrder.sortOrder;
	                    }
	                }
	                list.glowOrderedList('add', item);
	            });

	            if (!context.fields.categoryOrders[categoryId].item) {
	                context.fields.categoryOrders[categoryId].item = list.glowOrderedList('createItem', {
	                    value: {
	                        name: '',
                            sortOrder: null,
                            articleId: context.articleId,
                            version: null,
                            publishGroupId: null,
                            originalSortOrder: null,
                            manualIndex: null
	                    },
	                    text: '???',
	                    html: '???',
	                    orderable: true,
	                    selectable: true
	                });
	                if (existingOrder) {
                        context.fields.categoryOrders[categoryId].item.value.manualIndex = existingOrder.manualIndex;
                        context.fields.categoryOrders[categoryId].item.value.sortOrder = existingOrder.sortOrder;
                    }
	                list.glowOrderedList('add', context.fields.categoryOrders[categoryId].item);
	            }

	            if (!context.fields.categoryOrders[categoryId].item.value.manualIndex && context.fields.categoryOrders[categoryId].item.value.sortOrder) {
                    _placeInSortOrder(context, context.fields.categoryOrders[categoryId], context.fields.categoryOrders[categoryId].item.value.sortOrder);
	            }

	            _reorderListForTitleChange(context, context.fields.categoryOrders[categoryId]);
	        });
	},
	_reorderForTitleChange = function(context) {
	    $.each(context.fields.categoryOrders, function(categoryId, listOptions) {
	        _reorderListForTitleChange(context, listOptions);
	    });
	},
	_placeInSortOrder = function(context, listOptions, sortOrder) {
	    listOptions.item.value.sortOrder = sortOrder;

	    var count, i, sibling;
        count = listOptions.list.glowOrderedList('count');
        for (i = 0; i < count; i++) {
            sibling = listOptions.list.glowOrderedList('getByIndex', i);
            if (sibling.value.sortOrder == null 
                || sibling.value.sortOrder > listOptions.item.value.sortOrder
                || (sibling.value.sortOrder == listOptions.item.value.sortOrder && sibling.value.articleId == context.articleId)) {
                listOptions.item.value.manualIndex = i;
                listOptions.list.glowOrderedList('insert', listOptions.item, i);
                listOptions.list.glowOrderedList('refresh');
                listOptions.list.glowOrderedList('select', i);
                return;
            }
        }

        listOptions.list.glowOrderedList('refresh');
        if (count > 0) {
            listOptions.list.glowOrderedList('select', count - 1, true);
        }
	},
	_reorderListForTitleChange = function(context, listOptions) {
	    var title = $.trim(context.fields.title.val());
	    if (!title || title.length == 0) {
	        title = context.text.sortOrderPlaceholder;
	    }

        var currentIndex = 0, insertIndex;
	    if (title != listOptions.item.value.name) {
	        var newItem = listOptions.list.glowOrderedList('createItem', {
                value: {
                    name: $.telligent.evolution.html.encode(title),
                    sortOrder: listOptions.item.value.sortOrder,
                    articleId: listOptions.item.value.articleId,
                    version: listOptions.item.value.version,
                    publishGroupId: listOptions.item.value.publishGroupId,
                    originalSortOrder: listOptions.item.value.originalSortOrder,
                    manualIndex: listOptions.item.value.manualIndex
                },
                text: title,
                html: '<strong>' + $.telligent.evolution.html.encode(title) + '</strong>',
                orderable: true,
                selectable: true
            });

            listOptions.list.glowOrderedList('add', newItem);
            listOptions.list.glowOrderedList('remove', listOptions.item);
            listOptions.item = newItem;
            currentIndex = listOptions.list.glowOrderedList('count') - 1;
	    } else {
	        count = listOptions.list.glowOrderedList('count');
	        for (i = 0; i < count; i++) {
	            if (listOptions.list.glowOrderedList('getByIndex', i).value.articleId == listOptions.item.value.articleId) {
	                currentIndex = i;
	                break;
	            }
	        }
	    }

	    var count, i, sibling;
	    if (listOptions.item.value.manualIndex != null) {
	        // place in explicit order
            listOptions.list.glowOrderedList('insert', listOptions.item, listOptions.item.value.manualIndex);
	        listOptions.list.glowOrderedList('refresh');
            listOptions.list.glowOrderedList('select', listOptions.item.value.manualIndex);
	        return;
	    } else if (listOptions.item.value.sortOrder == null) {
	        // find natural order
	        count = listOptions.list.glowOrderedList('count');
	        for (i = 0; i < count; i++) {
	            sibling = listOptions.list.glowOrderedList('getByIndex', i);
	            if (sibling.value.sortOrder == null && sibling.value.name.toLowerCase() > listOptions.item.value.name.toLowerCase()) {

	                insertIndex = i;
	                if (insertIndex > currentIndex) {
	                    insertIndex--;
	                }

	                listOptions.list.glowOrderedList('insert', listOptions.item, insertIndex);
	                listOptions.list.glowOrderedList('refresh');
	                listOptions.list.glowOrderedList('select', insertIndex);
	                return;
	            }
	        }

	        if (count > 0) {
	            listOptions.list.glowOrderedList('refresh');
	            listOptions.list.glowOrderedList('select', currentIndex, true);
	            return;
	        }
	    }

	    listOptions.list.glowOrderedList('refresh');
	}, _moveCategoryOrder = function(context, list, direction) {
	    if (!list || list.length == 0) {
	        return;
	    }

	    var index = list.glowOrderedList('selectedIndex');
	    if (index < 0) {
	        return;
	    }

	    if (direction === '+1') {
	        list.glowOrderedList('moveDown');
	    } else if (direction === '-1') {
	        list.glowOrderedList('moveUp');
	    } else if (direction == 0) {
	        list.glowOrderedList('moveTop');
	    } else {
	        list.glowOrderedList('moveBottom');
	    }
	},
	_ensureLoadHistory = function(context) {
	    if (!context.historyLoaded) {
    	    context.historyLoaded = true;
    	    context.historyFilter = 'all';
    	    _updateHistoryActions(context);

    	    context.fields.history.evolutionScrollable({
    	        load: function(pageIndex) {
    	            return $.telligent.evolution.post({
            	        url: context.urls.getVersions,
            	        data: {
            	            articleId: context.articleId,
            	            pageIndex: pageIndex,
            	            filter: context.historyFilter,
            	            hasPublishGroups: context.hasPublishGroups
            	        }
            	    })
    	        },
    	        batch: 0
    	    });
	    }
	},
	_refreshHistory = function(context) {
	    if (context.historyLoaded) {
	        _updateHistoryActions(context);
	        context.fields.history.evolutionScrollable('reset');
	    }
	},
	_updateHistoryActions = function(context) {
	    if (context.historyFilter == 'deleted') {
            context.fields.historyUndelete.show();
            context.fields.historyDelete.hide();
            context.fields.historyOpen.hide();
        } else {
            context.fields.historyUndelete.hide();
            context.fields.historyDelete.show();
            context.fields.historyOpen.show();
        }
	    
        var selection = context.fields.history.find('input[type="checkbox"]:checked');
        if (selection.length > 0) {
            context.fields.historyClearSelection.removeClass('disabled');
        } else {
            context.fields.historyClearSelection.addClass('disabled');
        }

        if (selection.length > 0 && selection.length <= 100) {
            context.fields.historyDelete.removeClass('disabled');
        	context.fields.historyUndelete.removeClass('disabled');
        } else {
            context.fields.historyDelete.addClass('disabled');
        	context.fields.historyUndelete.addClass('disabled');
        }

        if (selection.length == 0 || selection.length > 2) {
        	context.fields.historyView.addClass('disabled');
        	context.fields.historyOpen.addClass('disabled');
        	context.fields.historyDiff.addClass('disabled');
        } else if (selection.length == 1) {
        	context.fields.historyView.removeClass('disabled');
        	context.fields.historyOpen.removeClass('disabled');
        	context.fields.historyDiff.addClass('disabled');
        } else if (selection.length == 2) {
        	context.fields.historyView.addClass('disabled');
        	context.fields.historyOpen.addClass('disabled');
        	context.fields.historyDiff.removeClass('disabled');
        }
	}, 
	_ensureLoadHelpfulness = function(context) {
	    if (!context.helpfulnessLoaded) {
    	    context.helpfulnessLoaded = true;
    	    context.helpfulnessFilter = 'all';

    	    context.fields.helpfulness.evolutionScrollable({
    	        load: function(pageIndex) {
    	            return $.telligent.evolution.post({
            	        url: context.urls.getHelpfulness,
            	        data: {
            	            articleId: context.articleId,
            	            version: context.version,
            	            pageIndex: pageIndex
            	        }
            	    })
    	        },
    	        batch: 0
    	    });
	    }
	},
	_refreshHelpfulness = function(context) {
	    if (context.helpfulnessLoaded) {
	        context.fields.helpfulness.evolutionScrollable('reset');
	    }
	};

	$.telligent.evolution.widgets.articleCreateEdit = {
		register: function (context) {
			context.templates.versionInfo = $.telligent.evolution.template.compile(context.templates.versionInfo);
			context.templates.orderingItem = $.telligent.evolution.template.compile(context.templates.orderingItem);

			// tab setup
			context.tabs.wrapper.glowTabbedPanes({
				cssClass: 'tab-pane',
				tabSetCssClass: 'tab-set with-panes',
				tabCssClasses: ['tab'],
				tabSelectedCssClasses: ['tab selected'],
				tabHoverCssClasses: ['tab hover'],
				enableResizing: false,
				tabs: [
    				[context.tabs.writeId, context.tabs.writeLabel, function() {
    				    context.fields.formButtons.show();
    				}],
    				[context.tabs.optionsId, context.tabs.optionsLabel, function() {
    				    context.fields.formButtons.show();
    				}],
    				[context.tabs.helpfulnessId, context.tabs.helpfulnessLabel, function() {
    				    context.fields.formButtons.show();
    				   _ensureLoadHelpfulness(context); 
    				}],
    				[context.tabs.historyId, context.tabs.historyLabel, function() {
    				    context.fields.formButtons.hide();
    			        _ensureLoadHistory(context);
    			    }]
			    ]
			});

            if (!context.articleId) {
                var tab = context.tabs.wrapper.glowTabbedPanes('getByIndex', 2);
    		    if (tab)
    			    tab.disabled = true;
    			    
    			tab = context.tabs.wrapper.glowTabbedPanes('getByIndex', 3);
    			if (tab)
    			    tab.disabled = true;

        	    context.tabs.wrapper.glowTabbedPanes('refresh');
            } else if (!context.helpfulnessEnabled) {
                var tab = context.tabs.wrapper.glowTabbedPanes('getByIndex', 2);
    		    if (tab)
    			    tab.disabled = true;
    			    
    			context.tabs.wrapper.glowTabbedPanes('refresh');    
            }

            context.fields.type.glowDropDownList({
                selectedItemWidth: 300,
                itemsWidth: 300,
                itemsHtml: context.typeHtml
            });

			context.fields.categoryOrders = {};

			context.fields.title.evolutionComposer({
				plugins: ['hashtags'],
				contentTypeId: context.contentTypeId
			}).evolutionComposer('onkeydown', function (e) {
				if (e.which === 13) {
					return false;
				} else {
					return true;
				}
			}).on('change', function() {
				_reorderForTitleChange(context);
			});

			context.categoryLookupTimeout = null;
			context.fields.categories.glowLookUpTextBox({
				emptyHtml: '',
				minimumLookUpLength: 0,
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
									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noCategoryMatches, context.text.noCategoryMatches, false)]);
								}
							}
						});
					}, 500);
				},
				selectedLookUpsHtml: []
			})
				.on('glowLookUpTextBoxChange', function() {
				    context.categoriesChanged = true;
					_updateOrdering(context);
				});

			_updateOrdering(context);

			context.viewPublishGroupLookupTimeout = null;
			context.fields.viewPublishGroup.glowLookUpTextBox({
			    emptyHtml: context.fields.viewPublishGroup.attr('placeholder'),
				minimumLookUpLength: 0,
				maxValues: 1,
				onGetLookUps: function (tb, searchText) {
					global.clearTimeout(context.viewPublishGroupLookupTimeout);
					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
					context.viewPublishGroupLookupTimeout = global.setTimeout(function () {
						$.telligent.evolution.post({
							url: context.urls.getPublishGroups,
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
									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noPublishGroupMatches, context.text.noPublishGroupMatches, false)]);
								}
							}
						});
					}, 500);
				},
				selectedLookUpsHtml: []
			})
			    .on('glowLookUpTextBoxChange', function() {
			        var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);
        			var publishGroupId = null;
        			var publishGroupName = null;
        	        if (publishGroup) {
        	            publishGroupId = publishGroup.Value;
        	            publishGroupName = publishGroup.SelectedHtml;
        	        }

			        _requestLoadVersion(context);
				});

			context.publishGroupLookupTimeout = null;
			context.fields.publishGroup.glowLookUpTextBox({
			    emptyHtml: '',
				minimumLookUpLength: 0,
				maxValues: 1,
				onGetLookUps: function (tb, searchText) {
					global.clearTimeout(context.publishGroupLookupTimeout);
					tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
					context.publishGroupLookupTimeout = global.setTimeout(function () {
						$.telligent.evolution.post({
							url: context.urls.getPublishGroups,
							data: {
							    query: searchText,
							    articleCollectionId: context.collectionId
							},
							success: function (response) {
							    if (context.loadedVersion && context.loadedVersion.publishGroup && !context.loadedVersion.publishGroup.isActive) {
					                if (response && response.matches) {
					                    response.matches.push({ 
					                        id: context.loadedVersion.publishGroup.id, 
					                        name: context.loadedVersion.publishGroup.name
					                    });
					                }
					            }
							    
								if (response && response.matches.length > 0) {
									var suggestions = [];
									for (var i = 0; i < response.matches.length; i++) {
										suggestions.push(tb.glowLookUpTextBox('createLookUp', response.matches[i].id, response.matches[i].name, response.matches[i].name, true));
									}
									tb.glowLookUpTextBox('updateSuggestions', suggestions);
								} else {
									tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', context.text.noPublishGroupMatches, context.text.noPublishGroupMatches, false)]);
								}
							}
						});
					}, 500);
				},
				selectedLookUpsHtml: []
			})
			    .on('glowLookUpTextBoxChange', function() {
			        var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);

            	    $.telligent.evolution.post({
            	        url: context.urls.getVersion,
            	        data: {
            	            articleCollectionId: context.collectionId,
            	            articleId: context.articleId,
            	            publishGroupId: publishGroup == null ? null : publishGroup.Value
            	        }
            	    })
            	        .then(function(data) {
            	            if (!data.exists) {
                	            _publishGroupChanged(context);
                	            _updateEditorContext(context);
			                    _updateButtonState(context);
            	            } else {
            	                if (!context.loadedVersion 
            	                    || ((context.loadedVersion.publishGroup == null) != (publishGroup == null))
            	                    || (context.loadedVersion.publishGroup != null && context.loadedVersion.publishGroup.id != publishGroup.Value)) {
                	                global.alert(context.text.draftAlreadyExists);
            	                }
            	                var count = context.fields.publishGroup.glowLookUpTextBox('count');
                			    var i;
                			    for (i = 0; i < count; i++) {
                			        context.fields.publishGroup.glowLookUpTextBox('removeByIndex', 0);
                			    }
                			    if (context.loadedVersion && context.loadedVersion.publishGroup) {
                			        context.fields.publishGroup.glowLookUpTextBox('add', context.fields.publishGroup.glowLookUpTextBox('createLookUp', context.loadedVersion.publishGroup.id, context.loadedVersion.publishGroup.name, context.loadedVersion.publishGroup.name, true));
                			    }
                			    _publishGroupChanged(context);
                			    _updateEditorContext(context);
                			    _updateButtonState(context);
            	            }
            	        })
            	        .catch(function() {
            	            var count = context.fields.publishGroup.glowLookUpTextBox('count');
            			    var i;
            			    for (i = 0; i < count; i++) {
            			        context.fields.publishGroup.glowLookUpTextBox('removeByIndex', 0);
            			    }
            			    if (context.loadedVersion && context.loadedVersion.publishGroup) {
            			        context.fields.publishGroup.glowLookUpTextBox('add', context.fields.publishGroup.glowLookUpTextBox('createLookUp', context.loadedVersion.publishGroup.id, context.loadedVersion.publishGroup.name, context.loadedVersion.publishGroup.name, true));
            			    }
            	        });
				});

			$(context.fields.cancel).on('click', function () {
                global.history.back();
				return false;
			});

            context.ignoreVersionChange = false;
			$.telligent.evolution.navigationConfirmation.enable(_navigationConfirmationId, function() { 
			    return !context.ignoreVersionChange && _isVersionChanged(context); 
			});

            context.fields.body.evolutionHtmlEditor({
               contentTypeId: context.contentTypeId,
               applicationTypeId: context.applicationTypeId,
               applicationId: context.applicationId
            });

            context.fields.tags.evolutionTagTextBox({
                applicationId: context.applicationId
            });

			context.fields.publishDate.glowDateTimeSelector(
				$.extend({}, $.fn.glowDateTimeSelector.dateTimeDefaults, {
					showPopup: true,
					allowBlankvalue: true,
				})
			).on('glowDateTimeSelectorChange', function() {
			    _updateButtonState(context);
			});

			context.fields.publishEndDate.glowDateTimeSelector(
				$.extend({}, $.fn.glowDateTimeSelector.dateTimeDefaults, {
					showPopup: true,
					allowBlankvalue: true,
				})
			);

			_trackChars(context, context.fields.metaTitle, 55);
			context.fields.metaTitle.on('keyup', function () {
				_trackChars(context, $(this), 55);
			});
			_trackChars(context, context.fields.metaDescription, 150);
			context.fields.metaDescription.on('keyup', function () {
				_trackChars(context, $(this), 150);
			});

			$.telligent.evolution.messaging.subscribe('articles-category-movefirst', function(e){
			    _moveCategoryOrder(context, $(e.target).closest('li.field-item').find('select'), 0);
			});

			$.telligent.evolution.messaging.subscribe('articles-category-moveup', function(e){
			    _moveCategoryOrder(context, $(e.target).closest('li.field-item').find('select'), '-1');
			});

			$.telligent.evolution.messaging.subscribe('articles-category-movedown', function(e){
			    _moveCategoryOrder(context, $(e.target).closest('li.field-item').find('select'), '+1');
			});

			$.telligent.evolution.messaging.subscribe('articles-category-movelast', function(e){
			    _moveCategoryOrder(context, $(e.target).closest('li.field-item').find('select'), 2);
			});
			
			context.fields.helpfulness.on('click', '.action-ignore', function(e) {
			   if (global.confirm(context.text.ignoreConfirmation)) {
			       $.telligent.evolution.put({
	                    url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/helpfulness/{HelpfulnessId}.json',
	                    data: {
	                        HelpfulnessId: $(e.target).data('id'),
	                        Ignore: true
	                    }
	                }).then(function() {
	                    var item = $(e.target).closest('.content-item.helpfulness');
	                    item.slideUp('fast', function() {
	                        item.remove();
	                    });
	                });
			   }
			   
			   return false;
			});

			context.fields.historyFilter.on('change', function() {
			    context.historyFilter = context.fields.historyFilter.val();
			    _refreshHistory(context);
			});

			context.fields.history.on('change', 'input[type="checkbox"]', function() {
			   _updateHistoryActions(context);
			});

			context.fields.historyClearSelection.on('click', function() {
			    context.fields.history.find('input[type="checkbox"]:checked').each(function() {
			       $(this).prop('checked', false).trigger('change');
			    });
			    context.fields.historyViewWrapper.empty();
			    return false;
			});

			context.fields.historyDelete.on('click', function() {
			    var selection = context.fields.history.find('input[type="checkbox"]:checked');
			    if (selection.length > 0 && global.confirm(context.text.versionDeleteConfirmation)) {
			        $.telligent.evolution.batch(function() {
    			        selection.each(function() {
    			            var parent = $(this).closest('tr');
    			            var version = parent.data('version');

    			            $.telligent.evolution.del({
    			                url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/article/{Id}/version/{Version}.json?IncludeFields=Id',
    			                data: {
    			                    Id: context.articleId,
    			                    Version: parent.data('version')
    			                }
    			            })
    			                .then(function() {
    			                    parent.slideUp('fast', function() {
            			               parent.remove();
            			               if (version == context.version) {
            			                   context.loadedVersion = null;
                		                   context.categoriesChanged = false;
                		                   context.orderingChanged = false;
            			                   _loadVersion(context);
            			               }
            			            });
    			                });
    			        });
			        }, { sequential: true })
			            .then(function() {
			                $.telligent.evolution.notifications.show(context.text.versionDeletedSuccessful, { type: 'success' });
			            })
			            .always(function() {
			              _updateHistoryActions(context);
			              global.setTimeout(function() {
    			              if (context.fields.history.children('tr').length == 0) {
        		                _refreshHistory(context);
        		              }
			              }, 500);
			            })
			    }

			    return false;
			});

			context.fields.historyUndelete.on('click', function() {
			    var selection = context.fields.history.find('input[type="checkbox"]:checked');
			    if (selection.length > 0 && global.confirm(context.text.versionUndeleteConfirmation)) {
			        $.telligent.evolution.batch(function() {
    			        selection.each(function() {
    			            var parent = $(this).closest('tr');

    			            $.telligent.evolution.put({
    			                url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/article/{Id}/version/{Version}.json?IncludeFields=Id',
    			                data: {
    			                    Id: context.articleId,
    			                    Version: parent.data('version'),
    			                    Undelete: true
    			                }
    			            })
    			                .then(function() {
    			                    parent.slideUp('fast', function() {
            			               parent.remove();
            			            });
    			                });
    			        });
			        }, { sequential: true })
			            .then(function() {
			               $.telligent.evolution.notifications.show(context.text.versionUndeletedSuccessful, { type: 'success' });
			            })
			            .always(function() {
			                _updateHistoryActions(context);
			                global.setTimeout(function() {
        			              if (context.fields.history.children('tr').length == 0) {
            		                _refreshHistory(context);
            		              }
    			             }, 500);
			            });
			    }

			    return false;
			});

			context.fields.historyView.on('click', function() {
			    var selection = context.fields.history.find('input[type="checkbox"]:checked');
			    if (selection.length == 1) {
			        context.fields.historyViewWrapper.html('<span class="ui-loading"></span>');
			        $.telligent.evolution.post({
			            url: context.urls.viewVersion,
			            data: {
			                version: $(selection[0]).closest('tr').data('version'),
			                articleId: context.articleId
			            }
			        }).then(function(response) {
			            context.fields.historyViewWrapper.html(response);
			            context.fields.historyViewWrapper[0].scrollIntoView();
			        }).catch(function() {
                        context.fields.historyViewWrapper.empty();
			        });
			    }
			    return false;
			});

			context.fields.historyOpen.on('click', function() {
			    var selection = context.fields.history.find('input[type="checkbox"]:checked');
			    if (selection.length == 1) {
			        var d = $(selection[0]).closest('tr');
			        var isPublished = d.data('ispublished') == 1;
			        var publishGroupName = d.data('publishgroupname');
			        var publishGroupId = d.data('publishgroupid');
			        if (publishGroupId == '')
			            publishGroupId = null;

			        _requestLoadVersion(context, d.data('version'), isPublished, publishGroupId, publishGroupName)
			            .then(function() {
    	                    var tab = context.tabs.wrapper.glowTabbedPanes('getByIndex', 0);
                    		if (tab)
                    			context.tabs.wrapper.glowTabbedPanes('selected', tab);
                        });
			    }
			    return false;
			});

			context.fields.historyDiff.on('click', function() {
			    var selection = context.fields.history.find('input[type="checkbox"]:checked');
			    if (selection.length == 2) {
			        context.fields.historyViewWrapper.html('<span class="ui-loading"></span>');
			        $.telligent.evolution.post({
			            url: context.urls.diffVersions,
			            data: {
			                versionA: $(selection[0]).closest('tr').data('version'),
			                versionB: $(selection[1]).closest('tr').data('version'),
			                articleId: context.articleId
			            }
			        }).then(function(response) {
			            context.fields.historyViewWrapper.html(response);
			            context.fields.historyViewWrapper[0].scrollIntoView();
			        }).catch(function() {
                        context.fields.historyViewWrapper.empty();
			        });
			    }
			    return false;
			});

			context.fields.historyViewWrapper.on('click', 'a.history-view', function(e) {
			   var view = $(e.target).data('view');
			   context.fields.historyViewWrapper.find('.history-content').each(function() {
			       var c = $(this);
			       if (c.data('view') == view) {
			           c.show();
			       } else {
			           c.hide();
			       }
			   });
			   context.fields.historyViewWrapper.find('a.history-view').each(function() {
			       var c = $(this);
			       if (c.data('view') == view) {
			           c.hide();
			       } else {
			           c.show();
			       }
			   });
			   return false;
			});

			context.isSaving = false;
			_registerValidation(context, context.fields.publish, function(e) {
			    return $.Deferred(function(d) {
			        var draftHtml = context.fields.draft.html();
			        _submit(context, !e.isDraft)
				        .then(function(published, pendingReview, url) {
				            if (published) {
    				            $.telligent.evolution.notifications.show(context.text.publishSuccessful, {
    				                type: 'success'
    				            });
    				            
    				            var redirect = function() {
    				                if (url) {
        				                global.location = url;
        				            } else {
        				                global.location = context.urls.viewCollection;
        				            }
    				            };
    				            
    				            context.ignoreVersionChange = true;
    				            if ($.telligent.evolution.navigationConfirmation.isEnabled()) {
    				                context.ignoreVersionChange = false;
    				                _loadVersion(context)
    				                    .then(function() {
    				                        redirect();
    				                    })
    				            } else {
    				                redirect();
    				            }
				            } else {
				                if (e.isDraft) {
    				                $.telligent.evolution.notifications.show(context.text.draftSuccessful, {
        				                type: 'success'
        				            });
				                } else if (pendingReview) {
				                    $.telligent.evolution.notifications.show(context.text.publishPendingReviewSuccessful, {
        				                type: 'success'
        				            });
				                } else {
				                    $.telligent.evolution.notifications.show(context.text.futurePublishSuccessful, {
        				                type: 'success'
        				            });
				                }

    				            // identify the publish group being viewed to continue drafting
    				            if (context.fields.publishGroup.length > 0) {
        				            var publishGroup = context.fields.publishGroup.glowLookUpTextBox('getByIndex', 0);
    			        			if (context.fields.viewPublishGroup.length > 0) {
        			                    var count = context.fields.viewPublishGroup.glowLookUpTextBox('count');
                        			    var i;
                        			    for (i = 0; i < count; i++) {
                        			        context.fields.viewPublishGroup.glowLookUpTextBox('removeByIndex', 0);
                        			    }
                        			    if (publishGroup) {
                        			        context.fields.viewPublishGroup.glowLookUpTextBox('add', context.fields.viewPublishGroup.glowLookUpTextBox('createLookUp', publishGroup.Value, publishGroup.SelectedHtml, publishGroup.SelectedHtml, true));
                        			    }
    			                    }
    				            }

                        		var tab = context.tabs.wrapper.glowTabbedPanes('getByIndex', 2);
                        		if (tab && context.helpfulnessEnabled)
                        			tab.disabled = false;

                    			tab = context.tabs.wrapper.glowTabbedPanes('getByIndex', 3);
                    			if (tab)
                    			    tab.disabled = false;

                            	context.tabs.wrapper.glowTabbedPanes('refresh');

    				            context.loadedVersion = null;
    		                    context.categoriesChanged = false;
    		                    context.orderingChanged = false;

    				            _loadVersion(context);
				            }
				            d.resolve();
				        })
				        .catch(function() {
				            d.reject();
				        })
				        .always(function() {
				            context.historyLoaded = false;
                            context.fields.draft.html(draftHtml);
				        });
			    }).promise();
			}, function(enable) {
			    if (enable) {
			        context.fields.draft.removeClass('disabled');
			    } else {
			        context.fields.draft.addClass('disabled');
			    }
			});

		    context.fields.draft.on('click', function() {
		        context.fields.publish.trigger({ type: "click", isDraft: true });
		        return false;
		    });

			context.fields.body.evolutionHtmlEditor('ready', function() {
			    if (context.publishGroup) {
			        context.fields.viewPublishGroup.glowLookUpTextBox('add', context.fields.viewPublishGroup.glowLookUpTextBox('createLookUp', context.publishGroup.id, context.publishGroup.name, context.publishGroup.name, true));
			    }
		        _loadVersion(context)
		            .then(function() {
        		        if (context.tempData) {
        		            if (context.tempData.title) {
        		                context.fields.title.val(context.tempData.title);
        		            }
        		            if (context.tempData.body) {
        		                context.fields.body.evolutionHtmlEditor('val', context.tempData.body);
        		            }
        		        }
		            });
			});
		}
	};
})(jQuery, window);