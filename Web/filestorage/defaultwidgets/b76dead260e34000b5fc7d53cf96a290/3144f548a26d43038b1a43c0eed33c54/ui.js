(function ($, global) {
	var headerList, button;

	var spinner = '<span class="ui-loading" width="48" height="48"></span>',
		searchMediaGalleries = function(options, textbox, searchText) {
			if(searchText && searchText.length >= 2) {

				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
				]);

				$.telligent.evolution.get({
					url: options.urls.lookupGalleries,
					data: {
						NameQuery: searchText,
						GroupId: options.parentGroupId
					},
					success: function(response) {
						if (response && response.Galleries && response.Galleries.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								$.map(response.Galleries, function(gallery, i) {
									return textbox.glowLookUpTextBox('createLookUp', gallery.SearchUniqueId, gallery.Name, gallery.Name, true);
								}));
						} else {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', options.resources.noGalleriesMatch, options.resources.noGalleriesMatch, false)
							]);
						}
					}
				});
			}
		};

	var api = {
		register: function (options) {
			headerList = $('<ul class="field-list"></ul>')
				.append(
					$('<li class="field-item"></li>')
						.append(
							$('<span class="field-item-input"></span>')
								.append(
									$('<a href="#"></a>')
										.addClass('button save')
										.text(options.resources.save)
						)
					)
				);

			$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(headerList));

			button = $('a.save', headerList);
			button.evolutionValidation({
				validateOnLoad: $(options.inputs.emailAddressId).val() != '',
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var applicationId = options.applicationId;

					var enable = $(options.inputs.enableId).prop("checked");
					var name = $(options.inputs.nameId).val();
					var emailAddress = $(options.inputs.emailAddressId).val();
					var footerMessage = $(options.inputs.footerMessageId).val();
					var enablePassiveMode = $(options.inputs.enablePassiveModeId).prop("checked");
					var passiveModeAddress = $(options.inputs.passiveModeAddressId).val();

					var data = {
						ApplicationId: applicationId,
						Enable: enable,
						Name: name,
						EmailAddress: emailAddress,
						FooterMessage: footerMessage,
						EnablePassiveMode: enablePassiveMode,
						PassiveModeAddress: passiveModeAddress
					};

                    console.log($(options.inputs.mappedMediaGalleryId).val());

					var mappedMediaGalleryId = $(options.inputs.mappedMediaGalleryId).val();
					data.MappedMediaGalleryId = mappedMediaGalleryId;

					$.telligent.evolution.post({
						url: options.urls.save,
						data: data
					})
					.then(function(response) {
						$.telligent.evolution.notifications.show(options.resources.forumUpdated);
					});

					return false;
				}
			});

            button.evolutionValidation('addField', options.inputs.nameId, {
                required: function() {
					return $(options.inputs.enableId).prop("checked")
                },
                messages: {
                    required: options.resources.enabledListRequiredText
                }
            }, '.field-item.name .field-item-validation');

			button.evolutionValidation('addField', options.inputs.emailAddressId, { 
			    mailinglistnameexists: { id: options.mailingListId },
			    pattern: /^\w+([\-\+]?\w+)+$/,
			    required: function() {
			        return $(options.inputs.enableId).prop("checked");
			    },
			    messages: {
					pattern: options.resources.namePatternMessage,
					required: options.resources.enabledListRequiredText
				}
			}, '.field-item.email-address .field-item-validation');

			button.evolutionValidation('addField', options.inputs.passiveModeAddressId, { 
			    email: true,
			    required: function() {
			        return $(options.inputs.enablePassiveModeId).prop("checked");
			    },
			    messages: {
			        required: options.resources.passiveEmailRequiredText
			    }
			}, '.field-item.passive-email-address .field-item-validation');

			options.inputs.mappedMediaGallery = $(options.inputs.mappedMediaGalleryId)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchMediaGalleries(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});

			if (options.mediaGalleryName && options.mediaGalleryId != '00000000-0000-0000-0000-000000000000') {
				var initialLookupValue = options.inputs.mappedMediaGallery.glowLookUpTextBox('createLookUp',
					options.mediaGalleryId,
					options.mediaGalleryName,
					options.mediaGalleryName,
					true);
				options.inputs.mappedMediaGallery.glowLookUpTextBox('add', initialLookupValue);
			};

		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.forumMailingListPanel = api;

})(jQuery, window);