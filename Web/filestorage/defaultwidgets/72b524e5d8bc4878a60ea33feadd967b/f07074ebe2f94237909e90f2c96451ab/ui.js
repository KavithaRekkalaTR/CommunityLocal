(function ($, global) {

	var spinner = '<span class="ui-loading" width="48" height="48"></span>',

	searchUsers = function(context, textbox, searchText) {
		if(searchText && searchText.length >= 2) {

			textbox.glowLookUpTextBox('updateSuggestions', [
				textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
			]);

			$.telligent.evolution.get({
				url: context.findUsersUrl,
				data: {
					w_SearchText: searchText,
				},
				success: function(response) {
                    if (response && response.matches.length > 1) {
                        var suggestions = [];
                        for (var i = 0; i < response.matches.length; i++) {
                            var item = response.matches[i];
                            if (item && item.userId) {
                                suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userId, item.title, item.preview, true));
                            }
                        }

                        textbox.glowLookUpTextBox('updateSuggestions', suggestions);
                    }
					else {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', context.noUsersMatchText, context.noUsersMatchText, false)
						]);
					}
				},
			});
		}
	}

	var api = {
		register: function (options) {
			$.telligent.evolution.administration.header(
				$('<fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="#" class="button" data-messagename="contextual-save">' + options.saveLabel + '</a></span></li></ul></fieldset>')
			);

			$.telligent.evolution.messaging.subscribe('contextual-save', function(data){
				var applicationId = options.applicationId;
				var enableEmbedding, enabledEmbeddingAllDomains;
				if ($(options.enableEmbeddingId).prop('checked'))
					enableEmbedding = true;
				else
					enableEmbedding = false;
				if ($(options.enableEmbeddingAllDomainsId).prop('checked'))
					enabledEmbeddingAllDomains = true;
				else
					enabledEmbeddingAllDomains = false;

				var allowedDomains = $(options.allowedDomainsId).val();
				var newThreadsUserId = parseInt($(options.newThreadsUserId).val());
                console.log($(options.newThreadsUserId).val());
				$.telligent.evolution.post({
					url: options.saveUrl,
					data: {
						ApplicationId: applicationId,
						EnabledEmbedding: enableEmbedding,
						EnabledEmbeddingAllDomains: enabledEmbeddingAllDomains,
						AllowedDomains: allowedDomains,
						NewThreadsUserId: newThreadsUserId,
					}
				})
				.then(function() {
					$.telligent.evolution.notifications.show(options.forumUpdatedLabel);
				});
			});

	        $(options.enableEmbeddingId).change(function () {
				if ($(this).prop('checked'))
	                $('.field-item.embed-code', options.wrapper).show();
	            else
		            $('.field-item.embed-code', options.wrapper).hide();
	        });

	        $(options.enableEmbeddingAllDomainsId).change(function () {
				if ($(this).prop('checked'))
	                $('.field-item.allowed-domains', options.wrapper).hide();
	            else
					$('.field-item.allowed-domains', options.wrapper).show();
	        });

			options.newThreadsUser = $(options.newThreadsUserId)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchUsers(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});

			if (options.defaultUserName && options.defaultUserId > 0) {
				var initialLookupValue = options.newThreadsUser.glowLookUpTextBox('createLookUp',
					options.defaultUserId,
					options.defaultUserName,
					options.defaultUserName,
					true);
				options.newThreadsUser.glowLookUpTextBox('add', initialLookupValue);
			};
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.forumEmbeddingManagement = api;

})(jQuery, window);
