(function ($, global) {
    
    function loadPreview(options) {
		if (options.values.image && (options.values.image.name || options.values.image.url)) {
			clearTimeout(options.previewTimeout);
			options.previewTimeout = setTimeout(function () {
				var data = {
					uploadContextId: options.uploadContextId
				};
				if (options.values.image.url) {
					data.url = options.values.image.url;
				}
				if (options.values.image.name) {
					data.name = options.values.image.name;
				}
				$.telligent.evolution.post({
					url: options.urls.preview,
					data: data,
					success: function (response) {
					    if (response && response.success) {
					        options.values.image.url = response.url;
						    var previewHtml = $.trim(response.previewHtml);
    						if (previewHtml && previewHtml.length > 0 && previewHtml !== options.previewContent) {
    							options.previewContent = previewHtml;
    							options.inputs.preview.html(options.previewContent).removeClass('empty');
    						}
					    } else {
					        removeImage(options);
					    }
					}
				});
			}, 150);
		} else {
			options.previewContent = '';
			options.inputs.preview.html('').addClass('empty');
		}
	}
	
	function removeImage(options) {
	    options.values.image = null;
		options.inputs.upload.html(options.text.upload).removeClass('change').addClass('add');
		options.inputs.remove.hide();
		loadPreview(options);
	}

	var api = {
		register: function (options) {
		    
		    options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);
			options.wrapper = $.telligent.evolution.administration.panelWrapper();
		    
			var headingTemplate = $.telligent.evolution.template.compile(options.templates.header);
			options.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			options.inputs.remove.hide();
			if (options.values.image && (options.values.image.url || options.values.image.name)) {
				options.inputs.upload.html(options.text.change).removeClass('add').addClass('change');
				options.inputs.remove.show();
			}

			loadPreview(options);

			options.inputs.remove.on('click', function () {
			    removeImage(options);
				return false;
			});

			options.inputs.upload.glowUpload({
				fileFilter: null,
				uploadUrl: options.urls.upload,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				options.uploading = true;
				options.inputs.upload.html(options.text.progress.replace('{0}', 0));
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					options.values.image = {
						name: file.name
					};
					loadPreview(options);
					options.uploading = false;
					options.inputs.upload.html(options.text.change).removeClass('add').addClass('change');
					options.inputs.remove.show();
				}
			})
			.on('glowUploadFileProgress', function (e, details) {
			    options.inputs.upload.html(options.text.progress.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				options.uploading = false;
				options.inputs.upload.html(options.text.upload).removeClass('change').addClass('add');
			});
			
			var lookupTimeout = null;
			options.inputs.defaultArticle.glowLookUpTextBox({
				'maxValues': 1,
				'emptyHtml': '',
				'onGetLookUps': function (tb, searchText) {
					window.clearTimeout(lookupTimeout);
					if (searchText && searchText.length >= 2) {
						tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', '<span class="ui-loading" width="48" height="48"></span>', '<span class="ui-loading" width="48" height="48"></span>', false)]);
						lookupTimeout = window.setTimeout(function () {
							$.telligent.evolution.post({
								url: options.urls.getArticles,
								data: { 
								    query: searchText, 
								    articleCollectionId: options.articleCollectionId
								},
								success: function (response) {
									if (response && response.matches.length > 0) {
										var suggestions = [];
										for (var i = 0; i < response.matches.length; i++)
											suggestions[suggestions.length] = tb.glowLookUpTextBox('createLookUp', response.matches[i].id, response.matches[i].title, response.matches[i].title, true);
											
										tb.glowLookUpTextBox('updateSuggestions', suggestions);
									}
									else
										tb.glowLookUpTextBox('updateSuggestions', [tb.glowLookUpTextBox('createLookUp', '', options.text.noMatchingArticles, options.text.noMatchingArticles, false)]);
								}
							});
						}, 250);
					}
				},
				'selectedLookUpsHtml': (options.values.defaultArticleName ? [options.values.defaultArticleName] : [])
			});

            options.isSaving = false;
            options.save = $.telligent.evolution.administration.header().find('.button.save');
			options.save.evolutionValidation({
				onValidated: function (isValid, buttonClicked, c) {
					if (isValid && !options.uploading)
						options.save.removeClass('disabled');
					else
						options.save.addClass('disabled');
				},
				onSuccessfulClick: function (e) {
				    if (!options.save.hasClass('disabled') && !options.isSaving) {
				        options.isSaving = true;
					    options.save.addClass('disabled');
					    
					    var defaultArticleId = null;
					    if (options.inputs.defaultArticle.glowLookUpTextBox('count') > 0) {
					        defaultArticleId = options.inputs.defaultArticle.glowLookUpTextBox('getByIndex', 0).Value;
					    }
					    
					    $.telligent.evolution.messaging.publish('article-category-addupdate', {
					        id: options.articleCategoryId,
					        name: options.inputs.name.val(),
					        description: options.inputs.description.val(),
					        image: options.values.image || {},
					        defaultArticleId: defaultArticleId
					    });
					    
					    $.telligent.evolution.administration.close();

			            options.isSaving = false;
			            options.save.removeClass('disabled');
				    }
				    
				    return false;
				}
			});
			
			options.save.evolutionValidation('addField', options.selectors.name, {
    				required: true
    			}, 
    			options.selectors.nameValidation, 
    			null
    		);
			
			
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.addUpdateCategoryPanel = api;

})(jQuery, window);