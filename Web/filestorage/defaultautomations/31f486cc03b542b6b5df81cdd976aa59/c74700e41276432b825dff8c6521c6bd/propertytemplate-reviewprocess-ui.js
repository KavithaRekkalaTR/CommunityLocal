(function ($, global, undef) {

    if (!$.telligent) {
        $.telligent = {};
    }
    if (!$.telligent.evolution) {
        $.telligent.evolution = {};
    }
    if (!$.telligent.evolution.propertyTemplates) {
        $.telligent.evolution.propertyTemplates = {};
    }
    
    function getPhaseId(options) {
        return (new Date()).getTime();
    }
    
    function applyPhaseChanges(options, phase) {
        var val, id;
        
        var phaseData = phase.data('phaseData');
        
        var i = phase.find('.phase-name');
        if (i.length > 0) {
            phaseData.name = i.val();
            if (phaseData.name.length == 0) {
                phaseData.name = options.defaultPhaseNameText.replace(/\{id\}/gi, phaseData.id);
            }
        }
        
        i = phase.find('.phase-reviewers');
        if (i.length > 0) {
            phaseData.reviewers = {
                users: [],
                roles: []
            };
            
            for (var j = 0; j < i.glowLookUpTextBox('count'); j++) {
                var selectedItem = i.glowLookUpTextBox('getByIndex', j);
                if (selectedItem) {
                    if (selectedItem.Value.indexOf('user:') == 0) {
                        id = parseInt(selectedItem.Value.substr(5), 10);
                        if (!isNaN(id)) {
                            phaseData.reviewers.users.push({
                                id: id,
                                name: selectedItem.SelectedHtml
                            });
                        }
                    } else if (selectedItem.Value.indexOf('role:') == 0) {
                        id = parseInt(selectedItem.Value.substr(5), 10);
                        if (!isNaN(id)) {
                            phaseData.reviewers.roles.push({
                                id: id,
                                name: selectedItem.SelectedHtml
                            });
                        }
                    }
                }
            }
        }
        
        phase.data('phaseData', phaseData);
    }
    
    function getUserAndRoleSuggestions(options, tb, searchText) {
        global.clearTimeout(options.getUserAndRoleSuggestionsTimeout);
        if (searchText && searchText.length >= 2) {
            tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
            options.getUserAndRoleSuggestionsTimeout = window.setTimeout(function () {
                $.telligent.evolution.get({
                    url: options.findUsersOrRolesUrl,
                    data: { w_searchText: searchText },
                    success: function (response) {
                        if (response && response.matches.length > 1) {

                            var selected = {};
                            var count = tb.glowLookUpTextBox('count');
                            for (var i = 0; i < count; i++) {
                                var item = tb.glowLookUpTextBox('getByIndex', i);
                                if (item) {
                                    selected[item.Value] = true;
                                }
                            }

                            var suggestions = [], selectable;
                            for (var i = 0; i < response.matches.length; i++) {
                                var item = response.matches[i];
                                if (item) {
                                    selectable = !selected[item.id];
                                    suggestions.push(tb.glowLookUpTextBox('createLookUp', item.id, item.name, item.preview, selectable));
                                }
                            }

                            tb.glowLookUpTextBox('updateSuggestions', suggestions);
                        }
                        else
                            tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', options.noUserOrRoleMatchesText, options.noUserOrRoleMatchesText, false)]);
                    }
                });
            }, 749);
        }
    }

    function initializePhase(options, phase, phaseData) {
        var reviewers = phase.find('input.phase-reviewers');
        
        var selectedHtml = [];
        $.each(phaseData.reviewers.users, function(i, user) {
            selectedHtml.push(user.name);
        });
        $.each(phaseData.reviewers.roles, function(i, role) {
            selectedHtml.push(role.name);
        });
        
        reviewers.glowLookUpTextBox({
            delimiter: ',',
			allowDuplicates: false,
			maxValues: 100,
			onGetLookUps: function(tb, searchText) {
				getUserAndRoleSuggestions(options, tb, searchText);
			},
			emptyHtml: reviewers.prop('placeholder'),
			selectedLookUpsHtml: selectedHtml,
			deleteImageUrl: ''
        });
    }

    function addPhase(options) {
        var phaseData = {
            id: getPhaseId(options),
            name: '',
            reviewers: {
                users: [],
                roles: []
            }
        };
        var phase = $(options.editTemplate(phaseData));
        options.processWrapper.append(phase);
        phase.data('phaseData', phaseData);
        initializePhase(options, phase, phaseData);
        
        phaseAddRemoved(options);
    }
    
    function phaseAddRemoved(options) {
        if (options.processWrapper.find('.phase').length > 1) {
            options.processWrapper.removeClass('single-phase');
        } else {
            options.processWrapper.addClass('single-phase');
        }
    }
    
    function setValue(options, val) {
        options.initialized = false;

        try {
            val = JSON.parse(val);
        } catch (e) {
            val = null;
        }
        
        if (!val || !val.phases || !val.phases.length) {
            val = {
                phases: []
            };
        }
        
        options.data = val;
        options.processWrapper.empty();
        
        if (options.data.phases.length > 0) {
            var userIds = [];
            var roleIds = [];
            
            $.each(options.data.phases, function(i, phaseData) {
               $.each(phaseData.reviewers.users, function(j, user) {
                    if (userIds.indexOf(user.id) < 0) {
                        userIds.push(user.id);  
                    }
               });
               $.each(phaseData.reviewers.roles, function(j, role) {
                    if (roleIds.indexOf(role.id) < 0) {
                        roleIds.push(role.id);  
                    }
               });
            });
            
            var completeInitialization = function(userAndRoleData) {
                $.each(options.data.phases, function(i, phaseData) {
                    var users = [];
                    $.each(phaseData.reviewers.users, function(j, user) {
                        if (userAndRoleData.users[user.id]) {
                            users.push({
                                id: user.id,
                                name: userAndRoleData.users[user.id]
                            });
                        }
                    });
                    phaseData.reviewers.users = users;
                    
                    var roles = [];
                    $.each(phaseData.reviewers.roles, function(j, role) {
                        if (userAndRoleData.roles[role.id]) {
                            roles.push({
                                id: role.id,
                                name: userAndRoleData.roles[role.id]
                            });
                        }
                    });
                    phaseData.reviewers.roles = roles;
                });
                
                $.each(options.data.phases, function(i, phaseData) {
                    var phase = $(options.viewTemplate(phaseData));
                    phase.data('phaseData', phaseData);
                    options.processWrapper.append(phase);
                    initializePhase(options, phase, phaseData);
                });
                phaseAddRemoved(options);
                options.initialized = true;
                
                if (options.editable) {
                    $('#' + options.uniqueId + '_addphase').show();
                }
            }
            
            if (userIds.length == 0 && roleIds.length == 0) {
                completeInitialization({
                    users: {},
                    roles: {}
                });
            } else {
                $.telligent.evolution.post({
                    url: options.loadUsersAndRolesUrl,
                    data: {
                        userIds: userIds.join(','),
                        roleIds: roleIds.join(',')
                    }
                })
                    .then(function(response) {
                        completeInitialization(response);
                    });
            }
        } else if (options.editable) {
            addPhase(options);
            options.initialized = true;
            $('#' + options.uniqueId + '_addphase').show();
        }
    }

    $.telligent.evolution.propertyTemplates.reviewProcess = {
        register: function(options) {
            options.initialized = false;
            options.editTemplate = $.telligent.evolution.template.compile(options.uniqueId + '_EditPhaseTemplate');
            options.viewTemplate = $.telligent.evolution.template.compile(options.uniqueId + '_ViewPhaseTemplate');
            options.processWrapper = $('#' + options.uniqueId + '_process');
            
            options.processWrapper.on('click', 'a.phase-moveup', function() {
                var phase = $(this).closest('.phase');
                var previous = phase.prev();
                if (previous.length > 0) {
                    phase.insertBefore(previous);
                }
                
                return false;
            });
            
            options.processWrapper.on('click', 'a.phase-movedown', function() {
                var phase = $(this).closest('.phase');
                var n = phase.next();
                if (n.length > 0) {
                    phase.insertAfter(n);
                }
                
                return false;
            });
            
            options.processWrapper.on('click', 'a.phase-remove', function() {
                if (global.confirm(options.confirmPhaseRemoveText)) {
                    var phase = $(this).closest('.phase');
                    phase.slideUp('fast', function() {
                        phase.remove();
                        phaseAddRemoved(options);
                    });
                }
                return false;
            });
            
            options.processWrapper.on('click', 'a.phase-apply', function() {
               var phase = $(this).closest('.phase');
               applyPhaseChanges(options, phase);
               
               var phaseData = phase.data('phaseData');
               var newPhase = $(options.viewTemplate(phaseData));
               newPhase.insertAfter(phase);
               newPhase.data('phaseData', phaseData);
               initializePhase(options, newPhase, phaseData);
               phase.remove();
               
               return false; 
            });
            
            options.processWrapper.on('click', 'a.phase-edit', function() {
               var phase = $(this).closest('.phase');
               var phaseData = phase.data('phaseData');
               
               var newPhase = $(options.editTemplate(phaseData));
               newPhase.insertAfter(phase);
               newPhase.data('phaseData', phaseData);
               initializePhase(options, newPhase, phaseData);
               phase.remove();
               
               return false;
            });

            $('#' + options.uniqueId + '_addphase').on('click', function() {
                if (!options.initialized) {
                    return false;
                }
                
                addPhase(options);
                return false;
            });
            
            setValue(options, options.initialValue);
            
            if (options.editable) {
                options.jsonApi.register({
                    val: function(val) {
                        if (typeof val == 'undefined') {
                            val = {
                                phases: []
                            };
                            
                            options.processWrapper.children().each(function() {
                                var phase = $(this);
                                if (phase.hasClass('editable')) {
                                    applyPhaseChanges(options, phase);
                                }
                                
                                var phaseData = phase.data('phaseData');
                                if (phaseData) {
                                    val.phases.push(phaseData);
                                }
                            });
                            
                            return JSON.stringify(val);
                        } else {
                            setValue(val);
                        }
                    },
                    hasValue: function() {
                        return options.initialied && options.processWrapper.children().length > 0
                    }
                });
            }
        }
    };
    
})(jQuery, window);