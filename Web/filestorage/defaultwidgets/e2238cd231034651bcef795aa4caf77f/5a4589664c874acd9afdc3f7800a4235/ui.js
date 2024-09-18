(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

    function findRoles(options, tb, q) {
        tb.glowLookUpTextBox('updateSuggestions', [
			tb.glowLookUpTextBox('createLookUp', '', '<span class=""ui-loading"" width=""48"" height=""48""></span>', '<span class=""ui-loading"" width=""48"" height=""48""></span>', false)
		]);
		options.lastFindRolesQuery = q;
		window.clearTimeout(options.findRoleTimeout);
		options.findRoleTimeout = global.setTimeout(function() {
			$.telligent.evolution.get({
				url: options.lookupRoleUrl,
				data: {
					w_query: q
				},
				success: function(response) {
					if (q == options.lastFindRolesQuery ) {
						if (response && response.matches && response.matches.length >= 1) {
							tb.glowLookUpTextBox('updateSuggestions',
								jQuery.map(response.matches, function(m, i) {
									return tb.glowLookUpTextBox('createLookUp', m.id, m.name, m.preview, true);
								}));
						} else {
							tb.glowLookUpTextBox('updateSuggestions', [
								tb.glowLookUpTextBox('createLookUp', '', options.text.roleNotFound, options.text.roleNotFound, false)
							]);
						}
					}
				}
			});
		}, 250);
    }
    
    function getModerationToAbuseContentTypes(options) {
        var contentTypes = options.moderationToAbuseContentTypes.find('input[type="checkbox"]');
        if (contentTypes.filter(':checked').length == contentTypes.length) {
            return 'all';
        }
        
        var contentTypeIds = [];
        contentTypes.filter(':checked').each(function(i, elm) {
           var cb = $(elm);
           contentTypeIds.push('ContentType=' + cb.val());
        });
        
        return contentTypeIds.join('&');
    }
    
    function setModerationToAbuseContentTypes(options, val) {
        var contentTypes = options.moderationToAbuseContentTypes.find('input[type="checkbox"]');
        if (val == 'all') {
            contentTypes.each(function(i, elm) {
                $(elm).prop('checked', true);
            });
        } else {
            contentTypes.each(function(i, elm) {
                $(elm).removeProp('checked');
            });
            
            var nameValuePairs = val.split('&');
            $.each(nameValuePairs, function(i, nameValuePair) {
                var nameValue = nameValuePair.split('=');
                if (nameValue.length == 2 && nameValue[0] == 'ContentType') {
                    contentTypes.find('[value="' + nameValue[1] + '"]').prop('checked', true);
                }
            });
        }
    }
    
    function setExemptReputationDescription(options, val) {

        var exemptCount = 0;
        $.telligent.evolution.get({
            url: $.telligent.evolution.site.getBaseUrl() + "api.ashx/v2/users.json",
            data: {
                PageIndex: 0,
                PageSize: 1
            },
            dataType: 'json'
        })
        .then(function(response) {
            if (response) {
                    
                    if (response.TotalCount > 0 && val > 0) {
                        exemptCount = Math.ceil((val / 100) * response.TotalCount);
                    }
                    var exemptReputationDescription = options.exemptReputation.find('.field-item-description');
                    exemptReputationDescription.empty().append(options.text.exemptReputationDescription.replace('{0}', exemptCount));
                }
        });
            
    }

	$.telligent.evolution.widgets.abuseConfiguration = {
		register: function(options) {

		    options.exemptRoles.glowLookUpTextBox({
		        maxValues: 20,
		        onGetLookUps: function(tb, q) {
		            findRoles(options, tb, q);
		        },
		        emptyHtml: options.text.findRole,
		        minimumLookUpLength: 0,
		        selectedLookUpsHtml: options.selectedExemptRoleNames,
		        delimiter: ','
		    });
		    
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
													.text(options.text.save)
													.on('click', function() {
														var b = $(this);
														if (!b.hasClass('disabled')) {
															b.addClass('disabled');

															var throttlingExempt = [];
															$.each($(options.throttlingExempt).val().split('\n'), function(i, v) {
																var ip = $.trim(v);
																if (ip && ip.length > 0) {
																	throttlingExempt.push(ip);
																}
															});

															$.telligent.evolution.post({
																url: options.saveUrl,
																data: {
																	minFlags: options.minFlags.val(),
																	maxFlags: options.maxFlags.val(),
																	appealTimeWindow: options.appealTimeWindow.val(),
																	moderateTimeWindow: options.moderateTimeWindow.val(),
																	expungeTimeWindow: options.expungeTimeWindow.val(),
																	exemptReputationPercentile: options.exemptReputationPercentile.val(),
																	exemptRoles: options.exemptRoles.val(),
																	userExpungeAgeThreshold: options.userExpungeAgeThreshold.val(),
																	userExpungePostsThreshold: options.userExpungePostsThreshold.val(),
																	moderationToAbuseContentTypes: getModerationToAbuseContentTypes(options),
																	throttlingExempt: throttlingExempt.join(',')
                                                                }
															})
																.then(function(response) {
																	options.minFlags.val(response.minFlags);
																	options.maxFlags.val(response.maxFlags);
																	options.appealTimeWindow.val(response.appealTimeWindow);
																	options.moderateTimeWindow.val(response.moderateTimeWindow);
																	options.expungeTimeWindow.val(response.expungeTimeWindow);
																	options.exemptReputationPercentile.val(response.exemptReputationPercentile);
																	options.userExpungeAgeThreshold.val(response.userExpungeAgeThreshold);
																	options.userExpungePostsThreshold.val(response.userExpungePostsThreshold);

																	setModerationToAbuseContentTypes(options, response.moderationToAbuseContentTypes);
																	setExemptReputationDescription(options, response.exemptReputationPercentile);

																	$.telligent.evolution.notifications.show(options.text.saveSuccess, {
																		type: 'success'
																	});
																})
																.always(function() {
																	b.removeClass('disabled');
																})
														}

														return false;
													})
												)
										)
									)
								)
							);
		}
	};
}(jQuery, window));