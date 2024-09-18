(function($, global) {
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';
	var currentSearchText = '';

	$.telligent.evolution.widgets.joinForumThread = {
		register: function(context) {

			var joinButton = $('<a href="#"></a>')
				.addClass('button join')
				.text(context.text.join);

			$.telligent.evolution.administration.header(
				$('<fieldset></fieldset>')
					.append(
						$('<ul class="field-list"></ul>')
							.append(
								$('<li class="field-item"></li>')
									.append(
										$('<span class="field-item-input"></span>')
											.append(
												joinButton
											)
										)
								)
					)
			);

			joinButton.evolutionValidation({
				validateOnLoad: false,
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					if (!joinButton.hasClass('disabled')) {
						joinButton.addClass('disabled');

						$.telligent.evolution.post({
							url: context.joinUrl,
							data: {
								ChildThreadId: context.threadId,
								ParentThreadId: context.threadSelector.glowLookUpTextBox('getByIndex', 0).Value,
								SendEmail: context.sendEmail.is(':checked') ? 'True' : 'False'
							}
						})
						.then(function(response){
							alert(response.message)
							global.location = response.url;
						})
						.always(function() {
							joinButton.removeClass('disabled');
						})
					}

					return false;
				}
			});

			var validateLookup = joinButton.evolutionValidation(
				'addCustomValidation',
				'requiredLookup',
				function () {
						return context.threadSelector.glowLookUpTextBox('count') > 0;
				},
				context.text.required,
				'#' + context.threadSelectorWrapperId + ' .field-item-validation',
				null);

			context.threadSelector.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(textbox, searchText) {
						if(searchText && searchText.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
							]);
							currentSearchText = searchText;

							$.telligent.evolution.get({
								url: context.findThreadsUrl,
								data: {
									w_query: searchText
								},
								success: function(response) {
									if (searchText != currentSearchText) {
										return;
									}

									var hasResults = false;
									if (response && response.matches.length >= 1) {
										textbox.glowLookUpTextBox('updateSuggestions',
											$.map(response.matches, function(result, i) {
												try
												{
													lookup = textbox.glowLookUpTextBox(
														'createLookUp',
														result.id,
														result.label,
														result.label,
														true);

													hasResults = true;
													return lookup;
												} catch (e) {}
											}));
									}

									if (!hasResults) {
										textbox.glowLookUpTextBox('updateSuggestions', [
											textbox.glowLookUpTextBox('createLookUp', '', context.text.noMatches, context.text.noMatches, false)
										]);
									}
								}
							});
						}
					},
					emptyHtml: context.text.lookupPlaceholder,
					selectedLookUpsHtml: [],
					deleteImageUrl: ''
				})
				.on('glowLookUpTextBoxChange', function(){
					validateLookup();
				});
		}
	};
}(jQuery, window));
