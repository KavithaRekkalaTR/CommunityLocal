/*
PreviewThemeView

options:
	template
	title
	onFindApplications
	resources

methods:
	render(options)
		theme
*/
define('PreviewThemeView', function($, global, undef) {

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	var defaults = {
		template: '',
		title: 'title',
		onFindApplications: function(options) {
			return $.Deferred(function(d){
				setTimeout(function(){
					d.resolve({
						matches: [
							{ label: 'Label A', id: 'ida' },
							{ label: 'Label B', id: 'idb' },
							{ label: 'Label C', id: 'idc' }
						]
					});

				}, 500);
			}).promise();
		}
	};

	function handleLookups(context, promptContext) {
		promptContext.applicationLookup = promptContext.content.find('.application-lookup');
		if(promptContext.applicationLookup && promptContext.applicationLookup.length > 0) {

			promptContext.applicationLookup.glowLookUpTextBox({
				delimiter: ',',
				allowDuplicates: true,
				maxValues: 1,
				onGetLookUps: function(textbox, searchText) {
					if(searchText && searchText.length >= 1) {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
						]);
						promptContext.currentSearchText = searchText;

						context.onFindApplications({
							typeId: promptContext.theme.TypeId,
							query: searchText
						}).then(function(response){
							if (searchText != promptContext.currentSearchText) {
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
									textbox.glowLookUpTextBox('createLookUp', '', context.resources.previewNoMatch, context.resources.previewNoMatch, false)
								]);
							}
						});
					}
				},
				emptyHtml: context.resources.previewSearch,
				selectedLookUpsHtml: [],
				deleteImageUrl: ''
			})
			.on('glowLookUpTextBoxChange', function(){
				processSelectedApplication(context, promptContext);
			});
		}
	}

	function processSelectedApplication(context, promptContext) {
		if(!promptContext.applicationLookup || promptContext.applicationLookup.length == 0) {
			promptContext.continue.removeClass('disabled');
			return;
		}

		var selectedItem = promptContext.applicationLookup.glowLookUpTextBox('getByIndex', 0);
		if(!selectedItem || !selectedItem.Value || selectedItem.Value.length == 0) {
			promptContext.selectedApplicationId = null;
			promptContext.continue.addClass('disabled');
		} else {
			promptContext.selectedApplicationId = selectedItem.Value;
			promptContext.continue.removeClass('disabled');
		}
	}

	var PreviewThemeView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(options) {
				var promptContext = $.extend({}, options);
				promptContext.content = $(context.template($.extend({}, options.theme, {

				})));

				promptContext.cancel = promptContext.content.find('a.cancel');
				promptContext.cancel.on('click', function(e){
					e.preventDefault();
					$.glowModal.close();
					return false;
				});

				handleLookups(context, promptContext);

				promptContext.continue = promptContext.content.find('.continue');

				promptContext.continue.on('click', function(e){
					if($(this).is('.disabled')) {
						e.preventDefault();
						return false;
					}

					e.preventDefault();

					if(options.onStart) {
						options.onStart({
							applicationId: promptContext.selectedApplicationId
						});
					}

					$.glowModal.close();
					return false;
				});

				processSelectedApplication(context, promptContext);

				var modal = $.glowModal({
					title: context.title,
					html: promptContext.content,
					width: 450,
					height: '100%'
				});
			}
		}
	};

	return PreviewThemeView;

}, jQuery, window);
