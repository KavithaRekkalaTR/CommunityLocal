(function($, global) {
	var listWrapper = null, searchTimeout = null, changedApplicationList = false, createFrame = null, frameResizeHandle = null, formOptions = null;

	function setEnabled(options, applicationTypeId, applicationId, enabled) {
		return $.telligent.evolution.post({
			url: options.urls.setEnabled,
			data: {
				ApplicationTypeId: applicationTypeId,
				ApplicationId: applicationId,
				Enabled: enabled
			}
		});
	}

	function del(options, applicationTypeId, applicationId) {
		return $.telligent.evolution.post({
			url: options.urls.del,
			data: {
				ApplicationTypeId: applicationTypeId,
				ApplicationId: applicationId
			}
		});
	}
	
	function restore(options, applicationTypeId, applicationId) {
		return $.telligent.evolution.post({
			url: options.urls.restore,
			data: {
				ApplicationTypeId: applicationTypeId,
				ApplicationId: applicationId
			}
		});
	}

	function showCreate(options) {
		$.telligent.evolution.administration.open({
			name: options.text.addApplication,
			content: $.telligent.evolution.get({
				url: options.urls.addApplication
			}),
			loaded: function() {
				$.telligent.evolution.messaging.subscribe('groupapplications.create', function(data){
					var applicationTypeId = $(data.target).data('applicationtypeid');
					var name = $(data.target).data('name');
					showCreateForm(options, applicationTypeId, name);
				});
			},
			cssClass: 'contextual-group-application-list'
		});
	}

	function showCreateForm(options, applicationTypeId, applicationTypeName) {
	    $.telligent.evolution.get({
	        url: options.urls.getApplicationCreationForm,
	        data: {
	            w_applicationTypeId: applicationTypeId
	        }
	    })
	        .then(function(response) {
	            var formId = response.formId;
	            var html = $(response.html);

        		$.telligent.evolution.administration.open({
        			name: options.text.addApplicationWithName.replace(/\{0\}/, applicationTypeName),
        			content: html,
        			header: $.Deferred(function(d) {
        				d.resolve(
        					$('<fieldset></fieldset>')
        						.append(
        							$('<ul class="field-list"></ul>')
        								.append(
        									$('<li class="field-item"></li>')
        										.append(
        											$('<span class="field-item-input"></span>')
        												.append(
        													$('<a href="#"></a>')
        														.addClass('button save')
        														.text(options.text.save)
        														.on('click', function() {
        														    var configuration = $.telligent.evolution.url.serializeQuery($('#' + formId).dynamicForm('getValues'));
        														    $.telligent.evolution.post({
        														        url: options.urls.createApplication,
        														        data: {
        														            applicationTypeId: applicationTypeId,
        														            configuration: configuration
        														        }
        														    })
        														        .then(function(response) {
        														            $.telligent.evolution.notifications.show(options.text.createSuccessful, {
    																			type: 'success'
    																		});
    																		changedApplicationList = true;
    																		$.telligent.evolution.administration.close();
        														        });

        															return false;
        														})
        													)
        											)
        										)
        									)
        								);
        			}).promise(),
        			shown: function() {
        			},
        			cssClass: 'contextual-group-application-list'
        		});
	        });
	}

	function resizeFrame() {
		global.clearTimeout(frameResizeHandle);
		if (formOptions && formOptions.container) {
			try {
				var height = formOptions.container.height();
				if (createFrame.css('visibility') == 'hidden') {
					createFrame.css('visibility', 'visible');
				}
				if (createFrame.height() != height) {
					createFrame.height(height);
				}
			} catch (e) {
			}
		}
		frameResizeHandle = global.setTimeout(function() {
			resizeFrame();
		}, 250);
	}
	
	function loadList(options) {
	    options.list.html('<span class="ui-loading" width="48" height="48"></span>');
	    var searchText = options.filter.searchText;
		$.telligent.evolution.get({
			url: options.urls.list,
			data: {
				w_searchtext: options.filter.searchText,
				w_isdeleted: options.filter.isDeleted
			}
		})
			.then(function(result) {
				if (options.filter.searchText == searchText) {
					options.list.html(result);
				}
			})
			.catch(function() {
			   options.list.empty(); 
			});
	}

	var api = {
		register: function(options) {
				$.telligent.evolution.administration.on('panel.shown', function() {
					if (changedApplicationList) {
						changedApplicationList = false;
						loadList(options);
					}
				});

				$.telligent.evolution.messaging.subscribe('groupapplications.toggleenabled', function(data){
					var applicationTypeId = $(data.target).data('applicationtypeid');
					var applicationId = $(data.target).data('applicationid');

					var item = listWrapper.find('.content-item.application[data-applicationtypeid="' + applicationTypeId + '"][data-applicationid="' + applicationId + '"]');
					if (item.length != 1)
						return;

                    var enabled = item.data('enabled') == 'True';
					setEnabled(options, applicationTypeId, applicationId, !enabled)
						.then(function() {
							item.data('enabled', enabled ? 'False' : 'True');
							if (enabled) {
								item.find('.value.disabled').show();
								item.find('.value.enabled').hide();
								$(data.target).html(options.text.enable);
							} else {
								item.find('.value.disabled').hide();
								item.find('.value.enabled').show();
								$(data.target).html(options.text.disable);
							}
						});
				});

				$.telligent.evolution.messaging.subscribe('groupapplications.delete', function(data){
					var applicationTypeId = $(data.target).data('applicationtypeid');
					var applicationId = $(data.target).data('applicationid');
					var canRestore = $(data.target).data('canrestore') == '1';

					var item = listWrapper.find('.content-item.application[data-applicationtypeid="' + applicationTypeId + '"][data-applicationid="' + applicationId + '"]');
					if (item.length != 1)
						return;

					var name = item.data('name');
					if (global.confirm((canRestore ? options.text.restorableDeleteConfirmation : options.text.deleteConfirmation).replace(/\{0\}/, name))) {
						del(options, applicationTypeId, applicationId)
							.then(function() {
								item.slideUp('fast', function() {
									item.remove();
								});
								$.telligent.evolution.notifications.show(options.text.deleteSuccess.replace(/\{0\}/, name), { type: 'success' });
							});
					}
				});
				
				$.telligent.evolution.messaging.subscribe('groupapplications.restore', function(data){
					var applicationTypeId = $(data.target).data('applicationtypeid');
					var applicationId = $(data.target).data('applicationid');

					var item = listWrapper.find('.content-item.application[data-applicationtypeid="' + applicationTypeId + '"][data-applicationid="' + applicationId + '"]');
					if (item.length != 1)
						return;

					var name = item.data('name');
					if (global.confirm(options.text.restoreConfirmation.replace(/\{0\}/, name))) {
						restore(options, applicationTypeId, applicationId)
							.then(function() {
								item.slideUp('fast', function() {
									item.remove();
								});
								$.telligent.evolution.notifications.show(options.text.restoreSuccess.replace(/\{0\}/, name), { type: 'success' });
							});
					}
				});

				if (options.canCreate) {
					$.telligent.evolution.administration.header(
						$('<fieldset></fieldset>')
							.append(
								$('<ul class="field-list"></ul>')
									.append(
										$('<li class="field-item"></li>')
											.append(
												$('<span class="field-item-input"></span>')
													.append(
														$('<a href="#"></a>')
															.addClass('button save')
															.text(options.text.addApplication)
															.on('click', function() {
																showCreate(options);
																return false;
															})
														)
												)
											)
										)
									);
				}

				listWrapper = $.telligent.evolution.administration.panelWrapper();

                options.filter = {
                    searchText: '',
                    isDeleted: false
                };

				$('input[type="text"]', listWrapper)
					.on('keyup paste click', function() {
					    var searchText = $.trim($(this).val());
					    if (searchText != options.filter.searchText) {
    					    options.filter.searchText = searchText;
    					    global.clearTimeout(searchTimeout);
                    		searchTimeout = global.setTimeout(function() {
                    			loadList(options);
                    		}, 250);
					    }
					});
					
				$('select', listWrapper)
				    .on('change', function() {
                        options.filter.isDeleted = $(this).val() == '1';
                        loadList(options);
				    });
		},
		registerCreateForm: function(o) {
			formOptions = o;
			resizeFrame();
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.groupApplications = api;

})(jQuery, window);