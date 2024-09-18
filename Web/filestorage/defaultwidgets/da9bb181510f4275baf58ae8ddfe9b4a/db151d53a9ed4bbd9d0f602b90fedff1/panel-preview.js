(function($, global, undef) {

	var administration = $.telligent.evolution.administration;

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function findApplications(context, options) {
		return $.telligent.evolution.get({
			url: context.searchApplicationsCallbackUrl,
			data: {
				_w_query: options.query,
				_w_typeId: options.typeId
			}
		});
	}

	function preview(context, options) {
		administration.loading(true);
		return $.telligent.evolution.post({
			url: context.previewCallbackUrl,
			data: {
				_w_id: context.themeId,
				_w_typeId: context.themeTypeId,
				_w_applicationId: options.applicationId
			}
		}).always(function(){ administration.loading(false) });
	}

	function handleLookups(context) {
		context.applicationLookup = context.wrapper.find('.application-lookup');
		if(context.applicationLookup && context.applicationLookup.length > 0) {

			context.applicationLookup.glowLookUpTextBox({
				delimiter: ',',
				allowDuplicates: true,
				maxValues: 1,
				onGetLookUps: function(textbox, searchText) {
					if(searchText && searchText.length >= 1) {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
						]);
						context.currentSearchText = searchText;

						findApplications(context, {
							typeId: context.typeId,
							query: searchText
						}).then(function(response){
							if (searchText != context.currentSearchText) {
								return;
							}

							var hasResults = false;
							if (response && response.matches.length >= 1) {
								textbox.glowLookUpTextBox('updateSuggestions',
									$.map(response.matches, function(result, i) {
										try {
											var lookup = textbox.glowLookUpTextBox('createLookUp', result.id, result.label, result.label, true);
											hasResults = true;
											return lookup;
										} catch (e) {}
									}));
							}

							if (!hasResults) {
								textbox.glowLookUpTextBox('updateSuggestions', [
									textbox.glowLookUpTextBox('createLookUp', '', context.previewNoMatchText, context.previewNoMatchText, false)
								]);
							}
						});
					}
				},
				emptyHtml: context.previewSearchText,
				selectedLookUpsHtml: [],
				deleteImageUrl: ''
			})
			.on('glowLookUpTextBoxChange', function(){
				processSelectedApplication(context);
			});
		}
	}

	function processSelectedApplication(context) {
		if(!context.applicationLookup || context.applicationLookup.length == 0) {
			context.previewButton.removeClass('disabled');
			return;
		}

		var selectedItem = context.applicationLookup.glowLookUpTextBox('getByIndex', 0);
		if(!selectedItem || !selectedItem.Value || selectedItem.Value.length == 0) {
			context.selectedApplicationId = null;
			context.previewButton.addClass('disabled');
		} else {
			context.selectedApplicationId = selectedItem.Value;
			context.previewButton.removeClass('disabled');
		}
	}


	var api = {
		register: function(options) {
			var context = $.extend(options, {});

			var headerTemplate = $.telligent.evolution.template(context.previewHeaderTemplateId);
			var header = $(headerTemplate({}));
			context.previewButton = header.find('a.button');

			$.telligent.evolution.administration.header(header);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			handleLookups(context);

			processSelectedApplication(context);

			var messageHandlers = {
				'theme-begin-preview': function(data) {
					if(context.selectedApplicationId) {
						preview(context, {
							applicationId: context.selectedApplicationId
						}).then(function(previewResponse){
							if(previewResponse && previewResponse.success && previewResponse.url) {
								global.location = previewResponse.url;
							}
						});
					}
				},
				'theme-preview-cancel': function(data) {
					administration.close();
				}
			};
			for(var messageName in messageHandlers) {
				$.telligent.evolution.messaging.subscribe(messageName, messageHandlers[messageName]);
			}
		}
	}

	$.telligent.evolution.themes.themeAdministration.preview = api;

})(jQuery, window);