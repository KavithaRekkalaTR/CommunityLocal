(function($, global, undef) {

    var spinner = '<span class="ui-loading" width="48" height="48"></span>';

    function contentTypeSelectionChanged(context) {
        for (var i = 0; i < context.nodes.application.glowLookUpTextBox('count'); i++) {
            context.nodes.application.glowLookUpTextBox('removeByIndex', 0);
        }

        findDefaultApplication(context);
        checkShowOptions(context);
        validateSave(context);
    }

    function findGroup(context, textbox, text) {
        textbox.glowLookUpTextBox('updateSuggestions', [
			textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
		]);

		$.telligent.evolution.get({
			url: context.urls.findGroups,
			data: {
				_w_query: text
			},
			success: function(response) {
			    context.lastGroupSearch = text;
				if (response && response.Groups && response.Groups.length >= 1) {
					textbox.glowLookUpTextBox('updateSuggestions',
						$.map(response.Groups, function(group, i) {
							return textbox.glowLookUpTextBox('createLookUp', group.ContainerId, group.Name, group.Name, true);
						}));
				} else {
					textbox.glowLookUpTextBox('updateSuggestions', [
						textbox.glowLookUpTextBox('createLookUp', '', context.text.noGroupsFound, context.text.noGroupsFound, false)
					]);
				}
			}
		});
    }

    function setGroup(context, group) {
        for (var i = 0; i < context.nodes.group.glowLookUpTextBox('count'); i++) {
            context.nodes.group.glowLookUpTextBox('removeByIndex', 0);
        }

        var lu = context.nodes.group.glowLookUpTextBox('createLookUp',
			group.ContainerId,
			group.Name,
			group.Name,
			true);

        context.nodes.group.glowLookUpTextBox('add', lu);
        checkShowOptions(context);
        validateSave(context);
    }

    function groupSelectionChanged(context) {
        for (var i = 0; i < context.nodes.application.glowLookUpTextBox('count'); i++) {
            context.nodes.application.glowLookUpTextBox('removeByIndex', 0);
        }

        if (context.nodes.group.glowLookUpTextBox('count') > 0) {
            context.nodes.applicationWrapper.show();
            findDefaultApplication(context);
        } else {
            context.nodes.applicationWrapper.hide();
        }

        checkShowOptions(context);
        validateSave(context);
    }

    function findDefaultApplication(context) {
        if (context.nodes.group.glowLookUpTextBox('count') > 0) {
            $.telligent.evolution.get({
    			url: context.urls.findApplications,
    			data: {
    				_w_query: context.lastGroupSearch && (context.lastGroupSearch.indexOf('http:') === 0 || context.lastGroupSearch.indexOf('https:') === 0) ? context.lastGroupSearch : null,
    				_w_targetContentTypeId: context.nodes.contentType.val(),
    				_w_targetContainerId: context.nodes.group.glowLookUpTextBox('getByIndex', 0).Value
    			},
    			success: function(response) {
    				if (response && response.Applications && response.Applications.length == 1) {
    					var lu = context.nodes.application.glowLookUpTextBox('createLookUp',
        					{
        					    applicationId: response.Applications[0].ApplicationId,
        					    applicationTypeId: response.Applications[0].ApplicationTypeId
        					},
        					response.Applications[0].Name,
        					response.Applications[0].Name,
        					true);

                        context.nodes.application.glowLookUpTextBox('add', lu);
                        updateOptions(context);
                        validateSave(context);
    				}
    			}
    		});
        }
    }

    function findApplication(context, textbox, text) {
        textbox.glowLookUpTextBox('updateSuggestions', [
			textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
		]);

		$.telligent.evolution.get({
			url: context.urls.findApplications,
			data: {
				_w_query: text,
				_w_targetContentTypeId: context.nodes.contentType.val(),
        		_w_targetContainerId: context.nodes.group.glowLookUpTextBox('getByIndex', 0).Value
			},
			success: function(response) {
				if (response && response.Applications && response.Applications.length >= 1) {
					textbox.glowLookUpTextBox('updateSuggestions',
						$.map(response.Applications, function(application, i) {
							return textbox.glowLookUpTextBox('createLookUp', {
							    applicationId: application.ApplicationId,
							    applicationTypeId: application.ApplicationTypeId,
							    group: application.Container
							}, application.Name, application.Name, true);
						}));
				} else {
					textbox.glowLookUpTextBox('updateSuggestions', [
						textbox.glowLookUpTextBox('createLookUp', '', context.text.noApplicationsFound, context.text.noApplicationsFound, false)
					]);
				}
			}
		});
    }

    function applicationSelectionChanged(context) {
        if (context.nodes.application.glowLookUpTextBox('count') > 0) {
            var group = context.nodes.application.glowLookUpTextBox('getByIndex', 0).Value.group;
            if (group !== null && group.ContainerId !== '' && group.Name !== '') {
                setGroup(context, group);
            }
        }

        updateOptions(context);
        validateSave(context);
    }

    function updateOptions(context) {
        var sibling = context.nodes.optionsWrapper.find('fieldset');
        sibling.nextAll().remove();
        context.hasOptions = false;
        context.optionsId = context.optionsPrefix + '_' + (new Date()).getTime();
        if (context.nodes.application.glowLookUpTextBox('count') < 1) {
            return;
        }

        var targetApplication = context.nodes.application.glowLookUpTextBox('getByIndex', 0).Value;
        $.telligent.evolution.get({
			url: context.urls.getOptionsForm,
			data: {
			    _w_formId: context.optionsId,
    			_w_targetApplicationTypeId: context.nodes.contentType.val(),
    			_w_targetApplicationId: targetApplication.applicationId,
	            _w_targetApplicationTypeId: targetApplication.applicationTypeId
			},
			success: function(response) {
				var f = $(response);
				if (f.length > 0) {
				    context.nodes.optionsWrapper.append(response);
				    context.hasOptions = true;
				    checkShowOptions(context);
				}
			}
		});
    }

    function checkShowOptions(context) {
        if (context.nodes.contentType.val()
            && context.nodes.group.glowLookUpTextBox('count') > 0
            && context.nodes.application.glowLookUpTextBox('count') > 0
            && context.hasOptions) {
            context.nodes.optionsWrapper.show();
        } else {
            context.nodes.optionsWrapper.hide();
        }
    }

    function validateSave(context) {
        if (context.nodes.contentType.val()
            && context.nodes.group.glowLookUpTextBox('count') > 0
            && context.nodes.application.glowLookUpTextBox('count') > 0) {
            context.header.find('.button.save').removeClass('disabled');
        } else {
            context.header.find('.button.save').addClass('disabled');
        }
    }

    function save(context, o) {
        var button = context.header.find('.button.save');
		if(button.length === 0 || button.hasClass('disabled')) {
		    return;
		}

		var targetApplication = context.nodes.application.glowLookUpTextBox('getByIndex', 0).Value;

		var data = {
		    _w_sourceApplicationTypeId: context.sourceApplicationTypeId,
	        _w_sourceApplicationId: context.sourceApplicationId,
	        _w_targetApplicationId: targetApplication.applicationId,
	        _w_targetApplicationTypeId: targetApplication.applicationTypeId
		};

		if (context.hasOptions && $.fn.dynamicForm) {
		    var formOptions = $('#' + context.optionsId).dynamicForm('getValues');
		    data = $.extend(data, formOptions);
		}

		button.addClass('disabled');
		$.telligent.evolution.post({
		    url: context.urls.merge,
		    data: data
		})
                .then(function(response) {
                if (global.confirm(context.text.success)) {
		            global.location = response.Application.Url;
		        } else {
    		        global.location = context.urls.groupRedirect;
		        }
		    })
		    .always(function() {
		        validateSave(context);
		    });
    }

	var api = {
		register: function(context) {

		    context.header = $($.telligent.evolution.template.compile(context.headerTemplate)({}));
			$.telligent.evolution.administration.header(context.header);

		    context.nodes.contentType.on('change', function() {
		        contentTypeSelectionChanged(context);
		    });

			context.nodes.group
			    .glowLookUpTextBox({
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						findGroup(context, tb, searchText);
					},
					emptyHtml: context.text.findGroup,
					selectedLookUpsHtml: [],
			        minimumLookUpLength: 0
			    });

			context.nodes.group.on('glowLookUpTextBoxChange', function() {
		        groupSelectionChanged(context);
			});

			context.nodes.application
			    .glowLookUpTextBox({
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						findApplication(context, tb, searchText);
					},
					emptyHtml: context.text.findApplication,
					selectedLookUpsHtml: [],
			        minimumLookUpLength: 0
			    });

			context.nodes.application.on('glowLookUpTextBoxChange', function() {
		        applicationSelectionChanged(context);
			});

            if (context.currentContainerId !== '' && context.currentContainerName !== '') {
                global.setTimeout(function() {
    				setGroup(context, {
    				    ContainerId: context.currentContainerId,
    				    Name: context.currentContainerName
    				});
    				groupSelectionChanged(context);
                }, 250);
			}

            updateOptions(context);
            validateSave(context);

            $.telligent.evolution.messaging.subscribe('contextual-save', function(){
                save(context);
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.forumMergePanel = api;

})(jQuery, window);