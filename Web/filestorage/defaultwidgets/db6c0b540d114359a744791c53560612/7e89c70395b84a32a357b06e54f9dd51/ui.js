(function ($, global) {

	var _adds = {};
	var _updates = {};
	var _deletes = {};
	var _undeletes = [];
	var _undeletedUnloadedByParentId = {};
	var _addedNodeIds = {};
	
	function checkHasChanges(options) {
	    if (Object.keys(_adds).length > 0 ||
	        Object.keys(_updates).length > 0 ||
	        Object.keys(_deletes).length > 0 ||
	        _undeletes.length > 0) {
	        options.save.removeClass('disabled');
	        return true;
	    } else {
	        options.save.addClass('disabled');
	        return false;
	    }
	}

	function saveChanges(options, progressFunc) {
	    return $.Deferred(function(d) {
	        var totalTasks = Object.keys(_adds).length + Object.keys(_updates).length + Object.keys(_deletes) + _undeletes.length;

	        if (totalTasks <= 0) {
	            d.resolve();
	            return;
	        }
	        
	        var getNextTask = function() {
	            var ids, node, data;
	            
	            node = _undeletes.shift();
	            if (node != null) {
	                return $.Deferred(function(d) {
                        $.telligent.evolution.post({
                            url: options.urls.undeleteCategory,
                            data: {
                                categoryId: node.value.id
                            }
                        })
                            .then(function(r) {
                                if (node.value.parentId) {
                                    var nodes = _undeletedUnloadedByParentId[node.value.parentId];
                                    if (nodes) {
                                        nodes = $.grep(nodes, function(n) { return n.id != node.value.id; });
                                        if (nodes.length == 0) {
                                            delete _undeletedUnloadedByParentId[node.value.parentId];
                                        } else {
                                            _undeletedUnloadedByParentId[node.value.parentId] = nodes;
                                        }
                                    }
                                }
                                d.resolve();
                            })
                            .catch(function() {
                                _undeletes.unshift(node);
                               d.reject(); 
                            });
                    });
	            }
	            
	            ids = Object.keys(_adds);
	            if (ids.length > 0) {
	                node = _adds[ids[0]];
	                while (node.value.parentId && (node.value.parentId + '').indexOf('NEW:') == 0) {
	                    if (_addedNodeIds[node.value.parentId]) {
	                        node.value.parentId = _addedNodeIds[node.value.parentId];
	                    } else {
	                        node = _added[node.value.parentId];
	                    }
	                }
	                
	                if (node) {
	                    data = {
                           CollectionId: options.articleCollectionId,
                           Name: node.value.name,
                           Description: node.value.description
                        }
                        
                        if (node.value.parentId) {
                            data.ParentId = node.value.parentId;
                        }
                       
                        if (node.value.sortOrder) {
                            data.SortOrder = node.value.sortOrder;
                        }
                        
                        if (node.value.image.name) {
                            data.ImageFileName = node.value.image.name;
                            data.ImageFileUploadContext = options.uploadContextId;
                        }
                        
                        if (node.value.defaultArticleId) {
                            data.DefaultArticleId = node.value.defaultArticleId;
                        }
	                    
	                    return $.Deferred(function(d) {
                            $.telligent.evolution.post({
                                url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/categories/{CollectionId}.json',
                                data: data
                            })
                                .then(function(r) {
                                    _addedNodeIds[node.value.id] = r.Category.Id;
                                    delete _adds[node.value.id];
                                    node.value.id = r.Category.Id;
                                    node.value.originalParentId = node.value.parentId;
                                    node.value.originalName = node.value.name;
                                    node.value.originalDescription = node.value.description;
                                    node.value.originalSortOrder = node.value.sortOrder;
                                    node.value.originalDefaultArticleId = node.value.defaultArticleId;
                                    node.value.originalImage = node.value.image;
                                    d.resolve();
                                })
                                .catch(function() {
                                   d.reject(); 
                                });
	                    });
	                }
	            }
	            
	            ids = Object.keys(_updates);
	            if (ids.length > 0) {
	                node = _updates[ids[0]];
	                if (node.value.parentId && (node.value.parentId + '').indexOf('NEW:') == 0) {
                        node.value.parentId = _addedNodeIds[node.value.parentId];
	                }
	                
                    data = {
                       Id: node.value.id,
                       Name: node.value.name,
                       Description: node.value.description
                    }
                    
                    if (node.value.parentId) {
                        data.ParentId = node.value.parentId;
                    } else if (node.value.parentId != node.value.originalParentId) {
                        data.RemoveParentId = true;
                    }
                   
                    if (node.value.sortOrder) {
                        data.SortOrder = node.value.sortOrder;
                    } else if (node.value.sortOrder != node.value.originalSortOrder) {
                        data.RemoveSortOrder = true;
                    }
                    
                    if (node.value.image.name) {
                        data.ImageFileName = node.value.image.name;
                        data.ImageFileUploadContext = options.uploadContextId;
                    } else if (node.value.image.url != node.value.originalImage.url) {
                        data.RemoveImage = true;
                    }
                    
                    if (node.value.defaultArticleId) {
                        data.DefaultArticleId = node.value.defaultArticleId;
                    } else if (node.value.originalDefaultArticleId != node.value.defaultArticleId) {
                        data.RemoveDefaultArticleId = true;
                    }
                    
                    return $.Deferred(function(d) {
                        $.telligent.evolution.put({
                            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/category/{Id}.json',
                            data: data
                        })
                            .then(function(r) {
                                delete _updates[node.value.id];
                                node.value.originalParentId = node.value.parentId;
                                node.value.originalName = node.value.name;
                                node.value.originalDescription = node.value.description;
                                node.value.originalSortOrder = node.value.sortOrder;
                                node.value.originalDefaultArticleId = node.value.defaultArticleId;
                                node.value.originalImage = node.value.image;
                                d.resolve();
                            })
                            .catch(function() {
                               d.reject(); 
                            });
                    });
	            }
	            
	            ids = Object.keys(_deletes);
	            if (ids.length > 0) {
	                node = _deletes[ids[0]];
	                
	                data = {
	                    Id: node.value.id
	                };
	                
	                if (node.value.reassignToCategoryId) {
	                    data.ReassignToCategoryid = node.value.reassignToCategoryId;
	                }

                    return $.Deferred(function(d) {
                        $.telligent.evolution.del({
                            url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/category/{Id}.json',
                            data: data
                        })
                            .then(function(r) {
                                delete _deletes[node.value.id];
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
        		    _addedNodeIds = {};
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

	function resizeTree(options) {
		var panel = $.telligent.evolution.administration.panelWrapper();
		options.tree.glowTree('resize', panel.width(), panel.height() - panel.find('p').outerHeight() - 80);
	}

	function nodeSelected(options, node) {
	    if (node) {
	        if (node.value.url) {
    			options.viewCategory.removeClass('disabled');
    			options.viewCategory.off('click');
    			options.viewCategory.prop('href', node.value.url);
	        } else {
	            options.viewCategory.addClass('disabled');
	            options.viewCategory.prop('href', '#');
	            options.viewCategory.on('click', function() { return false; });
	        }
    		options.editCategory.removeClass('disabled');
    		options.deleteCategory.removeClass('disabled');
	    } else {
	        options.viewCategory.addClass('disabled');
	        options.viewCategory.prop('href', '#');
	        options.viewCategory.on('click', function() { return false; });
    		options.editCategory.addClass('disabled');
    		options.deleteCategory.addClass('disabled');
	    }
	}

	function nodeMoved(options, node, originalParent) {
		var parent = node.getParent();
		if (parent !== originalParent) {
			if (parent === null) {
				node.value.parentId = null;
			} else {
				node.value.parentId = parent.value.id;
			}
			reviewOrder(options, originalParent);
		}
		reviewOrder(options, parent);
		checkHasChanges(options);
	}

	function reviewOrder(options, parentNode) {
		var items = [], naturalItems = [];
		var itemCount = 0;
		var item;
		var i, j;

		if (parentNode) {
			itemCount = parentNode.count();
			for (i = 0; i < itemCount; i++) {
				item = parentNode.getByIndex(i);
				item.value.sortOrder = null;
				items.push({
					item: item,
					originalIndex: i
				});
			}
		} else {
			itemCount = options.tree.glowTree('count');
			for (i = 0; i < itemCount; i++) {
				item = options.tree.glowTree('getByIndex', i);
				item.value.sortOrder = null;
				items.push({
					item: item,
					originalIndex: i
				});
			}
		}

		var naturalOffset = 0, isNatural;
		for (i = 0; i < itemCount; i++) {
		    isNatural = i + 1 >= itemCount || items[i + 1].item.value.name.toLowerCase() >= items[i].item.value.name.toLowerCase();
			if (!isNatural) {
				for (j = i; j >= naturalOffset; j--) {
				    items[j].item.value.sortOrder = j + 1;
				}
				naturalOffset = i;
			}
		}

        for (i = 0; i < itemCount; i++) {
            if (isNodeChanged(options, items[i].item)) {
                 _updates[items[i].item.value.id] = items[i].item;
            } else {
                delete _updates[items[i].item.value.id];
            }
        }
	}

	function ensureChildNodesPopulated(options, tree, node) {
	    return $.Deferred(function(d) {
	        if (node && (!node.value.hasChildren || node.count() > 0)) {
	            d.resolve();
	            return;
	        }
	        
    		$.telligent.evolution.get({
    			url: options.urls.getCategories,
    			data: {
    				_w_collectionId: options.articleCollectionId,
    				_w_categoryId: node === null ? null : node.value.id
    			}
    		})
    			.then(function(response) {
    			   var childNode;
    			   for (var i = 0; i < response.categories.length; i++) {
    				   childNode = options.tree.glowTree('createTreeNode', {
    					   value: {
    							id: response.categories[i].id,
    							location: response.categories[i].location,
    							originalParentId: node === null ? null : node.value.id,
    							parentId: node === null ? null : node.value.id,
    							originalSortOrder: response.categories[i].sortOrder,
    							sortOrder: response.categories[i].sortOrder,
    							originalName: response.categories[i].name,
    							name: response.categories[i].name,
    							originalDescription: response.categories[i].description,
    							description: response.categories[i].description,
    							defaultArticleId: response.categories[i].defaultArticleId,
    							originalDefaultArticleId: response.categories[i].defaultArticleId,
    							image: response.categories[i].image,
    							originalImage: response.categories[i].image,
    							hasChildren: response.categories[i].hasChildren,
    							url: response.categories[i].url
    						},
    					   html: response.categories[i].name
    				   });
    
    				   if (!response.categories[i].hasChildren) {
    					   childNode.expanded(true, false);
    				   }
    
    				   if (node === null) {
    					options.tree.glowTree('add', childNode);
    				   } else {
    					node.add(childNode);
    				   }
    			   }
    
    			   if (node === null) {
    				   options.tree.glowTree('refresh');
    			   } else {
    			       loadUndeletedCategories(options, node.value.id, node)
    				   node.refresh();
    				   node.expanded(true, false);
    			   }
    			   
    			   d.resolve();
    			})
    			.catch(function() {
    			    d.fail();
    			});
	    }).promise();
	}
	
	function loadUndeletedCategories(options, parentId, parentNode) {
	    var items = _undeletedUnloadedByParentId[parentId];
	    if (!items || items.length == 0) {
	        return;
	    }
	    
	    $.each(items, function(i, item) {
	        insertDeletedItem(options, item, parentNode);
	    });
	    
	    delete _undeletedUnloadedByParentId[parentId];
	}
	
	function isNodeChanged(options, node) {
	    return !_adds[node.value.id] && (
	        node.value.name != node.value.originalName
	        || node.value.description != node.value.originalDescription
	        || node.value.parentId != node.value.originalParentId
            || node.value.image.url != node.value.originalImage.url
            || node.value.defaultArticleId != node.value.originalDefaultArticleId
            || node.value.sortOrder != node.value.originalSortOrder
            );
	}
	
	function showAddCategory(options) {
	    $.telligent.evolution.administration.open({
			name: options.text.addCategory,
			content: $.telligent.evolution.post({
				url: options.urls.addEditCategory,
				data: {
				    uploadContextId: options.uploadContextId
				}
			}),
			cssClass: 'createedit-category'
		});
	}
	
	function showUndeleteCategories(options) {
	    $.telligent.evolution.administration.open({
			name: options.text.undeleteCategories,
			content: $.telligent.evolution.post({
				url: options.urls.undeleteCategories
			}),
			cssClass: 'undelete-category'
		});
	}
	
	function showEditCategory(options) {
	    
	    var node = options.tree.glowTree('selected');
	    if (!node) {
	        return;
	    }
	    
	    var category = node.value;
	    
	    $.telligent.evolution.administration.open({
			name: options.text.editCategory,
			content: $.telligent.evolution.post({
				url: options.urls.addEditCategory,
				data: {
				    uploadContextId: options.uploadContextId,
				    id: category.id,
				    name: category.name,
				    description: category.description,
				    imageUrl: category.image ? (category.image.url || '') : '',
				    imageFilename: category.image ? (category.image.name || '') : '',
				    defaultArticleId: category.defaultArticleId || ''
				}
			}),
			cssClass: 'createedit-category'
		});
	}
	
	function isBefore(a, b) {
	    if (a.value.originalSortOrder && b.value.originalSortOrder) {
	        return a.value.originalSortOrder < b.value.originalSortOrder;
	    } else if (a.value.originalSortOrder) {
	        return true;
	    } else if (b.value.originalSortOrder) {
	        return false;
	    } else {
	        return a.value.originalName < b.value.originalName;
	    }
	}
	
	function insertDeletedItem(options, item, parent) {
	    if (parent) {
            var position = -1;
            var i = 0;
            while (position == -1 && i < parent.count()) {
                var sibling = parent.getByIndex(i);
                if (isBefore(item, sibling)) {
                    position = i;
                }
                i++;
            }
            
            if (position != -1) {
                parent.insert(item, position);
            } else {
                parent.add(item);
            }
            parent.refresh();
        } else {
            var position = -1;
            var i = 0;
            while (position == -1 && i < options.tree.glowTree('count')) {
                var sibling = options.tree.glowTree('getByIndex', i);
                if (isBefore(item, sibling)) {
                    position = i;
                }
                i++;
            }
            
            if (position != -1) {
                options.tree.glowTree('insert', item, position);
            } else {
                options.tree.glowTree('add', item);
            }
            options.tree.glowTree('refresh');   
        }
	}
	
	function getNode(options, id, parent) {
	    var item, i;
	    if (parent) {
	        for (i = 0; i < parent.count(); i++) {
	            item = parent.getByIndex(i);
	            if (item && item.value.id == id) {
	                return item;
	            } else if (item.isLoaded() && item.count() > 0) {
	                item = getNode(options, id, item);
	                if (item) {
	                    return item;
	                }
	            }
	        }
        } else {
            for (i = 0; i < options.tree.glowTree('count'); i++) {
	            item = options.tree.glowTree('getByIndex', i);
	            if (item && item.value.id == id) {
	                return item;
	            } else if (item.isLoaded() && item.count() > 0) {
	                item = getNode(options, id, item);
	                if (item) {
	                    return item;
	                }
	            }
	        }
        }
        
        return null;
	}

	var api = {
		register: function (options) {
		    
		    options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);
			options.wrapper = $.telligent.evolution.administration.panelWrapper();
		    
			options.tree.glowTree({
				enableDragDrop: true,
				getSubNodes: function(tree, node) {
					ensureChildNodesPopulated(options, tree, node);
				},
				expandedImageUrl: options.urls.expandedImage,
				collapsedImageUrl: options.urls.collapsedImage,
				blankImageUrl: options.urls.blankImage
			})
				.on('glowTreeNodeSelected', function(e, node) {
					nodeSelected(options, node);
				})
				.on('glowTreeNodeMoved', function(e, node, originalParent) {
					nodeMoved(options, node, originalParent);
					checkHasChanges(options);
				});

			$(global).on('resized.articleCategoryManagement', function() {
				resizeTree(options);
			});

			$.telligent.evolution.administration.on('panel.unloaded', function(){
			   $(window).off('.articleCategoryManagement');
			});

			global.setTimeout(function() {
				resizeTree(options);
				ensureChildNodesPopulated(options, options.tree, null);
			}, 25);
			
			var headingTemplate = $.telligent.evolution.template.compile(options.templates.header);
			options.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

            options.save = $.telligent.evolution.administration.header().find('.button.save');
            options.saving = false;
			options.save.on('click', function() {
			    if (!options.saving && !options.save.hasClass('disabled')) {
			        options.saving = true;
			        options.save.addClass('disabled');
    				saveChanges(options, function(progress) {
    				    options.save.html(options.text.saveProgress.replace('{0}', progress));
    				})
    				    .then(function() {
    				        $.telligent.evolution.notifications.show(options.text.saveSuccessful, { type: 'success' });
    				    })
    				    .always(function() {
    				        options.save.html(options.text.save);
    				        options.saving = false;
    				        checkHasChanges(options);
    				    });
			    }
				return false;
			});
			
			options.addCategory = $.telligent.evolution.administration.header().find('.add-category');
			options.addCategory.on('click', function() {
			    showAddCategory(options);
			    return false;
			});
			
			options.viewCategory = $.telligent.evolution.administration.header().find('.view-category');

			options.editCategory = $.telligent.evolution.administration.header().find('.edit-category');
			options.editCategory.on('click', function() {
			    showEditCategory(options);
			    return false;
			});
			
			options.undeleteCategory = $.telligent.evolution.administration.header().find('.undelete-category');
			options.undeleteCategory.on('click', function() {
			    showUndeleteCategories(options);
			    return false;
			});
			
			options.deleteCategory = $.telligent.evolution.administration.header().find('.delete-category');
			options.deleteCategory.on('click', function() {
			    var selectedNode = options.tree.glowTree('selected');
			    if (selectedNode) {
			        if ((selectedNode.value.id + '').indexOf('NEW:') == 0) {
        			    if (window.confirm(options.text.deleteConfirmation.replace(/\{0\}/g, selectedNode.value.name))) {
        			        if ((selectedNode.value.id + '').indexOf('NEW:') != 0) {
        			            _deletes[selectedNode.value.id] = selectedNode;
        			        }
        			        delete _adds[selectedNode.value.id];
        			        delete _updates[selectedNode.value.id];
    
                            options.tree.glowTree('remove', selectedNode);
                            options.tree.glowTree('refresh');
                            
                            checkHasChanges(options);
        			    }
			        } else {
			            $.telligent.evolution.administration.open({
                			name: options.text.deleteCategory.replace(/\{0\}/g, selectedNode.value.name),
                			content: $.telligent.evolution.post({
                				url: options.urls.deleteCategory,
                				data: {
                				    id: selectedNode.value.id
                				}
                			}),
                			cssClass: 'delete-category'
                		});
			        }
			    }
			    return false;
			});
			
			$.telligent.evolution.messaging.subscribe('article-category-delete', function(data) {
			    var selectedNode = options.tree.glowTree('selected');
			    if (selectedNode && selectedNode.value.id == data.id) {
			        selectedNode.value.reassignToCategoryId = data.reassignToCategoryId;
			        
		            _deletes[selectedNode.value.id] = selectedNode;
		        
    		        delete _adds[selectedNode.value.id];
    		        delete _updates[selectedNode.value.id];
    
                    options.tree.glowTree('remove', selectedNode);
                    options.tree.glowTree('refresh');
                    
                    checkHasChanges(options);
			    }
			});

            nodeSelected(options, null);

			$.telligent.evolution.messaging.subscribe('article-category-addupdate', $.telligent.evolution.administration.panelNameSpace(), function(data) {
			    var selectedNode = options.tree.glowTree('selected');
			    var node = selectedNode;
			    if (node && node.value.id != data.id) {
			        node = null;
			    }
			    
			    if (node != null) {
			        // update
			        node.value = $.extend({}, node.value, data);
			        node.html = $.telligent.evolution.html.encode(data.name);
		            if (isNodeChanged(options, node)) {
    			        _updates[data.id] = node;
		            } else {
		                delete _updates[data.id];
		            }
		            checkHasChanges(options);
			        node.refresh();
			    } else {
			        // add
			        var newNode = options.tree.glowTree('createTreeNode', {
                        value: $.extend({}, {
                                parentId: selectedNode == null ? null : selectedNode.value.id,
                                id: '',
                                name: '',
                                defaultArticleId: '',
                                image: { },
                                hasChildren: false,
                                sortOrder: null
                            }, data),
                        html: $.telligent.evolution.html.encode(data.name)
                    });
                    _adds[data.id] = newNode;
                    newNode.expanded(true, false);
                    checkHasChanges(options);
                    
                    if (selectedNode) {
                        ensureChildNodesPopulated(options, options.tree, selectedNode)
                            .then(function() {
                                var position = -1;
                                var i = 0;
                                while (position == -1 && i < selectedNode.count()) {
                                    var sibling = selectedNode.getByIndex(i);
                                    if (sibling.value.sortOrder == null) {
                                        if (sibling.value.name.toLowerCase() > newNode.value.name.toLowerCase()) {
                                            position = i;
                                        }
                                    }
                                    
                                    i++;
                                }
                                
                                if (position != -1) {
                                    selectedNode.insert(newNode, position);
                                } else {
                                    selectedNode.add(newNode);
                                }
                                selectedNode.refresh();
                            });
                    } else {
                        var position = -1;
                        var i = 0;
                        while (position == -1 && i < options.tree.glowTree('count')) {
                            var sibling = options.tree.glowTree('getByIndex', i);
                            if (sibling.value.sortOrder == null) {
                                if (sibling.value.name.toLowerCase() > newNode.value.name.toLowerCase()) {
                                    position = i;
                                }
                            }
                            
                            i++;
                        }
                        
                        if (position != -1) {
                            options.tree.glowTree('insert', newNode, position);
                        } else {
                            options.tree.glowTree('add', newNode);
                        }
                        options.tree.glowTree('refresh');
                    }
			    }
			});
			
			$.telligent.evolution.administration.navigationConfirmation.enable('articles-managecategories', function() { 
			    return checkHasChanges(options);
			});
			
			$.telligent.evolution.messaging.subscribe('categorymanagement.getdeleted', function(data) {
			    var deleted = [];
			    $.each(_deletes, function(id, categoryNode) {
			        deleted.push({
			            id: categoryNode.value.id,
			            location: categoryNode.value.location,
			            name: categoryNode.value.originalName,
			            parentId: categoryNode.value.originalParentId,
			            description: categoryNode.value.originalDescription
			        });
			    });
			    data.deleted = deleted; 
			    
			    var undeleted = {};
			    $.each(_undeletes, function(i, categoryNode) {
			       undeleted[categoryNode.value.id] = {
                        id: categoryNode.value.id,
                        location: categoryNode.value.location,
                        name: categoryNode.value.originalName,
                        parentId: categoryNode.value.originalParentId,
                        description: categoryNode.value.originalDescription
			       }; 
			    });
			    data.undeleted = undeleted;
			});
			
			$.telligent.evolution.messaging.subscribe('categorymanagement.getchanged', function(data) {
			    var deleted = {};
			    $.each(_deletes, function(id, categoryNode) {
			        deleted[id] = true;
			    });
			    data.deleted = deleted; 
			    
			    var changed = {};
			    $.each(_undeletes, function(i, categoryNode) {
			       changed[categoryNode.value.id] = {
                        id: categoryNode.value.id,
                        location: buildLocation(categoryNode.getParent()),
                        name: categoryNode.value.name,
                        parentId: categoryNode.value.parentId,
                        description: categoryNode.value.description
			       }; 
			    });
			    
			    function buildLocation (node) {
			        var path = [];
			        while (node != null) {
			            path.unshift(node.value.name)
			            node = node.getParent();
			        }
			        
			        return path.join(' &gt; ');
			    }
			    
			    $.each(_updates, function(i, categoryNode) {
			       changed[categoryNode.value.id] = {
                        id: categoryNode.value.id,
                        location: buildLocation(categoryNode.getParent()),
                        name: categoryNode.value.name,
                        parentId: categoryNode.value.parentId,
                        description: categoryNode.value.description
			       }; 
			    });
			    
			    data.changed = changed;
			});

			$.telligent.evolution.messaging.subscribe('categorymanagement.stageundelete', function(data) {
			    var item = _deletes[data.id];
			    if (item) {
			        delete _deletes[data.id];
			        insertDeletedItem(options, item, item.getParent());
			        checkHasChanges(options);
			    } else {
			        $.telligent.evolution.get({
			            url: options.urls.getCategory,
			            data: {
			                _w_categoryId: data.id
			            }
			        })
			            .then(function(category) {
			                if (category) {
			                    item = options.tree.glowTree('createTreeNode', {
                                    value: {
                                        id: category.id,
                                        location: category.location,
            							originalParentId: category.parentId,
            							parentId: category.parentId,
            							originalSortOrder: category.sortOrder,
            							sortOrder: category.sortOrder,
            							originalName: category.name,
            							name: category.name,
            							originalDescription: category.description,
            							description: category.description,
            							defaultArticleId: category.defaultArticleId,
            							originalDefaultArticleId: category.defaultArticleId,
            							image: category.image,
            							originalImage: category.image,
            							hasChildren: category.hasChildren,
            							url: category.url
                                    },
                                    html: $.telligent.evolution.html.encode(category.name)
                                });
                                _undeletes.push(item);
                                
                                if (!item.value.hasChildren) {
                                    item.expanded(true, false);
                                } 
                                
                                if (!item.value.parentId) {
                                    insertDeletedItem(options, item, null);
                                } else {
                                    var parent = getNode(options, item.value.parentId);
                                    if (parent != null && parent.isLoaded()) {
                                        insertDeletedItem(options, item, parent);
                                    } else {
                                        var items = _undeletedUnloadedByParentId[item.value.parentId];
                                        if (items == null) {
                                            items = [];
                                            _undeletedUnloadedByParentId[item.value.parentId] = items;
                                        }
                                        items.push(item);
                                    }
                                }
                                
                                checkHasChanges(options);
			                }
			            });
			    }
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articleCategoryManagement = api;

})(jQuery, window);