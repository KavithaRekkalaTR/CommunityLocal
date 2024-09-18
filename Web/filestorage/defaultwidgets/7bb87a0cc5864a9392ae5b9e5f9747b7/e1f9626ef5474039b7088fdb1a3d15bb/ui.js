(function($) {

	var spinner = '<span class="ui-loading" width="48" height="48"></span>',
		searchGroups = function(context, textbox, searchText) {
			if(searchText && searchText.length >= 2) {

				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
				]);

				$.telligent.evolution.get({
					url: context.lookupGroupsUrl,
					data: {
						GroupNameFilter: searchText,
						Permission: 'Group_CreateBlog'
					},
					success: function(response) {
						if (response && response.Groups.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								$.map(response.Groups, function(group, i) {
									return textbox.glowLookUpTextBox('createLookUp', group.Id, group.Name, group.Name, true);
								}));
						} else {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', context.noGroupsMatchText, context.noGroupsMatchText, false)
							]);
						}
					}
				});
			}
		},
		saveBlog = function(context) {
			$.telligent.evolution.post({
				url: context.createBlogUrl,
				data: {
					Name: context.nameInput.val(),
					GroupId: parseInt(context.groupInput.val(), 10)
				},
				success: function(response) {
					if(response.Errors && response.Errors.length > 0) {
						alert(response.Errors[0]);
					} else {
						window.location = response.Blog.Url;
					}
				},
				error: function(xhr, desc, ex) {
					$.telligent.evolution.notifications.show(desc, {type:'error'});
					context.createLink.removeClass('disabled');
				}
			});
		};

	var api = {
		register: function(context) {
			context.groupInput = $(context.groupInput)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: true,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchGroups(context, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: [],
					deleteImageUrl: ''});

			context.nameInput = $(context.nameInput);
			context.createLink = $(context.createLink)
				.evolutionValidation({
					validateOnLoad : false,
					onValidated: function(isValid, buttonClicked, c) {
						if (isValid) {
							context.createLink.removeClass('disabled');
						} else {
							context.createLink.addClass('disabled');
						}
					},
					onSuccessfulClick: function(e) {
						e.preventDefault();
						// show the processing node
						$('.processing', context.createLink.parent()).css("visibility", "visible");
						// set form fields regarding the login
						context.createLink.addClass('disabled');
						// submit the form
						saveBlog(context);
					}})
				.evolutionValidation('addField',
					context.nameInput,
					{ required: true, maxlength: 128 },
					context.nameInput.closest('.field-item').find('.field-item-validation'), null)
				.evolutionValidation('addField',
					context.groupInput,
					{ required: true, messages: { required: context.groupRequiredMessage } },
					context.groupInput.closest('.field-item').find('.field-item-validation'), null);

			if(context.defaultGroupName && context.defaultGroupId > 0) {
				var initialLookupValue = context.groupInput.glowLookUpTextBox('createLookUp',
					context.defaultGroupId,
					context.defaultGroupName,
					context.defaultGroupName,
					true);
				context.groupInput.glowLookUpTextBox('add', initialLookupValue);
			}
		}
	};

	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.createBlog = api;

})(jQuery);
