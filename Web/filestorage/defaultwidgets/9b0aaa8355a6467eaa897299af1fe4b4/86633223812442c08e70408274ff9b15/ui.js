(function ($) {

	if (!$.telligent) $.telligent = {};
	if (!$.telligent.evolution) $.telligent.evolution = {};
	if (!$.telligent.evolution.templates) $.telligent.evolution.templates = {};
	
	var addEditNavigationItem = function(tree, options, isEdit, onChanged) {
	    var id = '', label = '', configuration = '', avatarUrl = null, avatarFileName = null, description = null, wrapper, navigationPlugins, configurationWrapper, configurationFormId;
	    var data = null, node = null, nodeIndex, parentNode = null, upload = null, remove = null, revert = null, preview = null, previewTimeout = null, descriptionInput = null, labelInput = null, previewContent = '', showLabel = true;
	    var defaultAvatarUrl = null;
	    var tokenPattern = /\$\{(resource|group_name|application_name|user_name)(?:\:([^\}]*))?\}/ig;

	    if (isEdit) {
	        node = tree.glowTree('selected');
	        if (!node) {
	            return;
	        }
	        parentNode = node.getParent();
	        if (parentNode) {
	            nodeIndex = parentNode.getIndex(node);
	        } else {
	            nodeIndex = tree.glowTree('getIndex', node);
	        }
	        
	        var data = $.telligent.evolution.url.parseQuery(node.value);
	        if (!data) {
	            return;
	        }
	        
	        id = data.id;
	        label = data.label;
	        configuration = data.configuration;
	        avatarUrl = data.avatarUrl;
	        description = data.description;
	    } else {
	        parentNode = tree.glowTree('selected');
	        if (parentNode && !parentNode.canHaveChildren()) {
	            parentNode = null;
	        }
	    }

	    var updateConfigurationForm = function(loadNew) {
	        configurationWrapper.html('<span class="ui-loading"></span>');
	        
	        showLabel = navigationPlugins.children('option:selected').data('showlabel');
	        if (showLabel) {
	            labelInput.closest('.field-item').show();
	        } else {
	            labelInput.closest('.field-item').hide();
	        }
	        
	        $.telligent.evolution.post({
                url: options.urls.getForm,
                data: {
                    id: id,
                    navigationPluginId: navigationPlugins.val(),
                    configuration: configuration
                }
            })
                .then(function(response) {
                    id = response.id;
                    configurationFormId = response.formId;
                    configurationWrapper.html(response.html);
                    
                    $('#' + configurationFormId).dynamicForm('onChange', function(o) {
              			    populateItemDetails(false);
        			});
        			window.setTimeout(function() {
                        populateItemDetails(loadNew);
        			}, 9);
                })
	    }, getNavigationItemDetails = function(id, navigationPluginId, configuration, loadNew) {
	        return $.Deferred(function(d) {
                
                var v = [];
                v.push('<navigation>');
                v.push('<links>');
                v.push('<link type="');
                v.push($.telligent.evolution.html.encode(navigationPluginId));
                v.push('" id="');
                v.push(id);
                v.push('" configuration="');
                v.push($.telligent.evolution.html.encode(configuration));
                v.push('"');
                
                if (loadNew !== true) {
                    if (showLabel) {
                        v.push(' label="');
        				v.push($.telligent.evolution.html.encode(getValue(labelInput)));
        				v.push('"');
                    }
                    
                    v.push(' avatarUrl="');
    				v.push($.telligent.evolution.html.encode(avatarUrl));
    				v.push('"');
    
    			    v.push(' description="');
    				v.push($.telligent.evolution.html.encode(getValue(descriptionInput)));
    				v.push('"');
                }

                v.push(' />');
                v.push('</links>');
                v.push('</navigation>');

	            $.telligent.evolution.post({
	                url: options.urls.parseNavigationItem,
	                data: {
	                    serializedNavigationItem: v.join('')
	                }
	            })
	                .then(function(response) {
	                    if (response.navigationItem) {
	                        d.resolve({
	                            label: response.navigationItem.Label,
	                            description: response.navigationItem.Description,
	                            avatarUrl: response.navigationItem.AvatarUrl,
	                            defaultLabel: response.navigationItem.DefaultLabel,
	                            defaultDescription: response.navigationItem.DefaultDescription,
	                            defaultAvatarUrl: response.navigationItem.DefaultAvatarUrl,
	                            previewHtml: response.previewHtml
	                        });
	                    } else {
	                        d.resolve({
	                            label: id,
	                            description: '',
	                            avatarUrl: null,
	                            previewHtml : id
	                        });
	                    }
	                })
	                .catch(function() {
	                    d.resolve({
                            label: id,
                            description: '',
                            avatarUrl: null,
                            previewHtml: id
                        });
	                });
	        }).promise();
	    }, resolveTokens = function (text) {
	        return $.Deferred(function(d) {
	            if (!text) {
	                d.resolve(text);
	                return;
	            }
	            
	            var resolveOnServer = false;
	            text = text.replace(tokenPattern, function(m, t, p) {
    					t = t.toLowerCase();
    					if (t == 'group_name') {
    							return options.text.groupNamePlaceholder;
    					} else if (t == 'application_name') {
    							return options.text.applicationNamePlaceholder;
    					} else if (t == 'user_name') {
    							return options.text.userNamePlaceholder;
    					} else if (t == 'resource') {
								resolveOnServer = true;
    					} 
    					return m;
    			});
    			if (resolveOnServer) {
    				$.telligent.evolution.post({
    	                url: options.urls.resolveTokens,
    	                data: {
    	                    text: text
    	                }
    	            })
    	                .then(function(response) {
    	                    d.resolve(response.text);
    	                })
    	                .catch(function() {
    	                    d.resolve(text);
    	                });
    			} else {
    				d.resolve(text);
    			}
	        }).promise();
	    }, loadPreview = function() {
    		if (avatarUrl || avatarFileName || defaultAvatarUrl) {
    			clearTimeout(previewTimeout);
    			previewTimeout = setTimeout(function () {
    				var data = {
    					uploadContextId: options.uploadContextId
    				};
    				if (avatarFileName) {
    					data.name = avatarFileName;
    				} else if (avatarUrl) {
    					data.url = avatarUrl;
    				} else if (defaultAvatarUrl) {
    				    data.url = defaultAvatarUrl;
    				} 
    				$.telligent.evolution.post({
    					url: options.urls.preview,
    					data: data,
    					success: function (response) {
    					    if (response && response.success) {
    					        if (data.name) {
    					            avatarUrl = response.url;
    					            avatarFileName = null;
    					        }
    					        
    					        if (data.url == defaultAvatarUrl) {
    					            upload.html(options.text.upload).removeClass('change').addClass('add');
    					            remove.hide();
    					        } else if (avatarUrl) {
    					            upload.html(options.text.change).removeClass('add').addClass('change');
    					            remove.show();
    					        }
    						    var previewHtml = $.trim(response.previewHtml);
        						if (previewHtml && previewHtml.length > 0 && previewHtml !== options.previewContent) {
        							previewContent = previewHtml;
        							preview.html(previewContent).show();
        						}
    					    } else {
    					        removeAvatar();
    					    }
    					}
    				});
    			}, 150);
    		} else {
    			previewContent = '';
    			preview.html('').hide();
    		}
    	}, populateItemDetails = function(loadNew) {
    	    getNavigationItemDetails(id, navigationPlugins.val(), $.telligent.evolution.url.serializeQuery($('#' + configurationFormId).dynamicForm('getValues') || {}), loadNew)
                .then(function(details) {
                    if (loadNew === true) {
                        setValue(labelInput, '');
                        setValue(descriptionInput, '');
                        avatarUrl = null;
                        avatarFileName = null;
                    } else {
                        if (details.defaultLabel == details.label) {
                            setValue(labelInput, '');
                        }
                        if (details.defaultDescription == details.description) {
                            setValue(descriptionInput, '');
                        }
                        if (details.avatarUrl == details.defaultAvatarUrl) {
                            avatarUrl = null;
                            avatarFileName = null;
                        }
                    }
                    
                    resolveTokens(details.defaultLabel || '')
                        .then(function(text) {
                            labelInput.prop('placeholder', text);
                        });
                        
                    resolveTokens(details.defaultDescription || '')
                        .then(function(text) {
                            descriptionInput.prop('placeholder', text);
                        });
                        
                    defaultAvatarUrl = details.defaultAvatarUrl;

                    loadPreview();
                });
    	}, removeAvatar = function() {
    	    avatarFileName = null;
    	    avatarUrl = null;
    		upload.html(options.text.upload).removeClass('change').addClass('add');
    		remove.hide();
    		loadPreview();
    	}, handleTokens = function(i) {
        	i.on('focus', function() {
          	    var v = i.data('_rawval');
                if (v) {
          		    i.val(v);
                }
                i.data('_focused', true);
            });
            i.on('blur', function() {
          	    var v = i.val();
                i.data('_rawval', v);
                resolveTokens(v)
    				.then(function(v) {
    					i.val(v);
    				});
                i.data('_focused', false);
            });
    	}, setValue = function(i, v) {
    	    if (i.data('_focused')) {
                i.val(v);
            } else {
    	        i.data('_rawval', v);
				resolveTokens(v)
					.then(function(v) {
						i.val(v);
					});
            }
    	}, getValue = function(i) {
    	    if (i.data('_focused')) {
                return i.val();
            } else {
                return i.data('_rawval');
            }
    	}, initialize = function() {
	        navigationPlugins = wrapper.find('.field-item.type select');
	        configurationWrapper = wrapper.find('.configuration-form');
	        remove = wrapper.find('.field-item.avatar .upload .remove');
	        upload = wrapper.find('.field-item.avatar .upload .upload');
	        revert = wrapper.find('.field-item.avatar .upload .revert');
	        preview = wrapper.find('.field-item.avatar .preview');
	        descriptionInput = wrapper.find('.field-item.description input[type="text"]');
	        labelInput = wrapper.find('.field-item.label input[type="text"]');
	        
	        handleTokens(descriptionInput);
	        setValue(descriptionInput, description);

            handleTokens(labelInput);
	        setValue(labelInput, label);
	        
	        remove.hide();
			if (avatarFileName || avatarUrl) {
				upload.html(options.text.change).removeClass('add').addClass('change');
				remove.show();
			}

			loadPreview();

			remove.on('click', function () {
			    removeAvatar();
				return false;
			});

			upload.glowUpload({
				uploadUrl: options.urls.upload,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				upload.html(options.text.progress.replace('{0}', 0));
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
				    avatarFileName = file.name;
					loadPreview();
					upload.html(options.text.change).removeClass('add').addClass('change');
					remove.show();
				}
			})
			.on('glowUploadFileProgress', function (e, details) {
			    upload.html(options.text.progress.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				upload.html(options.text.upload).removeClass('change').addClass('add');
			});

            if (data) {
                navigationPlugins.val(data.navigationPluginId)
            }
	        
	        navigationPlugins.on('change', function() {
	            updateConfigurationForm(true);
	        });
	        updateConfigurationForm(false);
	        
	        wrapper.find('a.save-form').on('click', function() {
	            
	            var button = $(this);
	            if (button.hasClass('disabled')) {
	                return false;
	            }
	            
	            var data = {
	                id: id,
	                label: getValue(labelInput),
	                navigationPluginId: navigationPlugins.val(),
	                configuration: $.telligent.evolution.url.serializeQuery($('#' + configurationFormId).dynamicForm('getValues') || {}),
	                description: getValue(descriptionInput),
	                avatarUrl: avatarUrl
	            };
	            
	            button.addClass('disabled').siblings('.processing').css('visibility', 'visible');
	            
	            getNavigationItemDetails(data.id, data.navigationPluginId, data.configuration, false)
	                .then(function(details) {
	                    var newNode = tree.glowTree('createTreeNode', {
                            value: $.telligent.evolution.url.serializeQuery(data),
                            html: details.previewHtml
                        });
        
                        newNode.expanded(true, false);

        	            if (isEdit) {
        	                node.value = newNode.value;
        	                node.html = newNode.html;
			                node.refresh();
        	            } else {
        	                if (parentNode) {
        	                    parentNode.add(newNode);
        	                } else {
        	                    tree.glowTree('add', newNode);
        	                }
        	                tree.glowTree('refresh');
        	            }
        	            
        	            onChanged();
        	            $.glowModal.close();
	                })
	                .always(function() {
	                    button.removeClass('disabled').siblings('.processing').css('visibility', 'hidden');
	                });

	            return false;
	        });
	    }

	    wrapper = $($.glowModal({
	        html: $.Deferred(function(d) {
	            $.telligent.evolution.get({
	                url: options.urls.addEditModal
	            })
	                .then(function(response) {
	                    d.resolve(response);
	                    window.setTimeout(function() { initialize() }, 10);
	                })
	                .catch(function() {
	                    d.reject();
	                });
	        }).promise(),
	        title: isEdit ? options.text.edit : options.text.add,
	        width: 500,
	        height: 200
	    }));
	}, deleteNavigationItem = function(tree, options, onRemoved) {
	    var n = tree.glowTree('selected');
	    if (n != null && window.confirm(options.text.confirmDelete)) {
	        tree.glowTree('remove', n);
	        tree.glowTree('refresh');
	        onRemoved();
	    }
	}, getValue = function(tree, options) {
	    var v = [];
	    var addNodes = function(nodes) {
	        var j, data;
	        for (var i = 0; i < nodes.length; i++) {
	            data = $.telligent.evolution.url.parseQuery(nodes[i].value);
	            v.push('<link type="');
	            v.push($.telligent.evolution.html.encode(data.navigationPluginId));
	            v.push('" id="');
	            v.push(data.id);
	            v.push('" configuration="');
	            v.push($.telligent.evolution.html.encode(data.configuration));
	            v.push('"');
	            
	            if (data.label) {
                    v.push(' label="');
    				v.push($.telligent.evolution.html.encode(data.label));
    				v.push('"');
                }
	            
	            if (options.enableDescriptions) {
	                v.push(' description="');
	                v.push($.telligent.evolution.html.encode(data.description || ''));
	                v.push('"');
	            }
	            
	            if (options.enableAvatars) {
	                v.push(' avatarUrl="');
	                v.push($.telligent.evolution.html.encode(data.avatarUrl || ''));
	                v.push('"');
	            }
	            
	            if (nodes[i].count() > 0) {
	                v.push('>');
	                
	                var subNodes = [];
	                for (j = 0; j < nodes[i].count(); j++) {
	                    subNodes.push(nodes[i].getByIndex(j));
	                }
	                addNodes(subNodes);
	                
	                v.push('</link>');
	            } else {
	             v.push(' />');   
	            }
	        }
	    };
	    
	    if (tree.glowTree('count') == 0) {
	        return null;
	    }
	    
	    v.push('<navigation>');
	    v.push('<links>');
	    
	    var nodes = [];
	    for (var i = 0; i < tree.glowTree('count'); i++) {
	      nodes.push(tree.glowTree('getByIndex', i));  
	    }
	    addNodes(nodes);
	    
	    v.push('</links>');
	    v.push('</navigation>');
	    
	    return v.join('');
	}, setValue = function(tree, options, v) {
	    var i;
	    for (i = tree.glowTree('count') - 1; i >= 0; i--) {
	        tree.glowTree('remove', tree.glowTree('getByIndex', i));
	    }
	    if (!v || v.length <= 0) {
	        tree.glowTree('refresh');
	        return;
	    }
	    
	    var addNodes = function(parentNode, items, depth) {
	        if (options.maxDepth > 0 && depth > options.maxDepth) {
	            return;
	        }
	        
	        var node;
	        for (var i = 0; i < items.length; i++) {
	            node = tree.glowTree('createTreeNode', {
                    value: $.telligent.evolution.url.serializeQuery({
    	                id: items[i].Id,
    	                navigationPluginId: items[i].NavigationPluginId,
    	                configuration: items[i].Configuration
    	            }),
                    html: items[i].Name
                });
                
                node.expanded(true, false);
	            
	            if (parentNode) {
	                parentNode.add(node);
	            } else {
	                tree.glowTree('add', node);
	            }
	            
	            if (items[i].Children && items[i].Children.length > 0) {
	                addNodes(node, items[i].Children, depth + 1);
	            }
	        }
	    };
	    
	    $.telligent.evolution.post({
	        url: options.urls.parseNavigationItems,
	        data: {
	            serializedNavigationItems: v
	        }
	    })
	        .then(function(response) {
	            addNodes(null, response.navigationItems, 1);
	            tree.glowTree('refresh');
	        });
	};
	
	$.telligent.evolution.templates.customNavigationEditor = {
	    register: function(options) {
	        var tree = $('#' + options.id);

	        tree.glowTree({
	           enableDragDrop: true,
	           canHaveChildren: function(t, n) {
	               if (options.maxDepth <= 0) {
	                   return true;
	               }
	               var depth = 1;
	               while ((n = n.getParent()) != null) {
	                   depth++;
	               }
	               return (depth < options.maxDepth);
	           },
	           nodeHtml: options.treeItemHtml
	        });
	        
	        options.api.register({
                val: function(val) { return (typeof val == 'undefined') ? getValue(tree, options) : setValue(tree, options, val); },
                hasValue: function() { return getValue(tree, options) != null; }
            });

	        tree.on('glowTreeNodeMoved', function() {
                options.api.changed(getValue(tree, options));
            });
	            
	        $('#' + options.id + '_add').on('click', function() {
	            addEditNavigationItem(tree, options, false, function() {
	                options.api.changed(getValue(tree, options));
	            });
	            return false;
	        });
	        
	        $('#' + options.id + '_edit').on('click', function() {
	            addEditNavigationItem(tree, options, true, function() {
	               options.api.changed(getValue(tree, options));
	            });
	            return false;
	        });
	        
	        $('#' + options.id + '_delete').on('click', function() {
	            deleteNavigationItem(tree, options, function() {
	                options.api.changed(getValue(tree, options));
	            });
	            return false;
	        });
	    }
	};
	
})(jQuery);