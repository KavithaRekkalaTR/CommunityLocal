(function($, global, undef) {

	var model = {
		create: function(context, options) {
			return $.telligent.evolution.post({
				url: context.createUrl,
				dataType: 'json',
				data: options
			});
		},
		update: function(context, snippetId, options) {
			options.snippetId = snippetId;
			return $.telligent.evolution.post({
				url: context.updateUrl,
				dataType: 'json',
				data: options
			});
		},
		delete: function(context, snippetId) {
			return $.telligent.evolution.post({
				url: context.deleteUrl,
				dataType: 'json',
				data: {
					snippetId: snippetId
				}
			});
		},
		createForm: function(context) {
			return $.telligent.evolution.get({
				url: context.createFormUrl,
				data: {}
			});
		},
		updateForm: function(context, snippetId) {
			return $.telligent.evolution.get({
				url: context.updateFormUrl,
				data: {
					snippetId: snippetId
				}
			});
		}
	}

	var api = {
		register: function(context) {
			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);

			// editing
			$.telligent.evolution.messaging.subscribe('edit-snippet', function(data){

				var snippetId = $(data.target).closest('.content-item').data('snippetid');

				var editHeader = $(headingTemplate({
					label: context.text.saveLabel
				}));

				$.telligent.evolution.administration.open({
					name: 'Edit Snippet',
					header: editHeader,
					cssClass: 'blog-snippets',
					content: model.updateForm(context, snippetId),
					loaded: function() {

						var editButton = editHeader.find('a.save');
						var wrapper = $.telligent.evolution.administration.panelWrapper();

						editButton.evolutionValidation({
							onValidated: function(isValid, buttonClicked, c) {
							},
							onSuccessfulClick: function(e) {
								e.preventDefault();

								var updateOptions = {
									token: wrapper.find('.token input').val(),
									link: wrapper.find('.link input').val(),
									text: wrapper.find('.text textarea').val()
								};

								model.update(context, snippetId, updateOptions).then(function(){
									$.telligent.evolution.notifications.show(context.text.updateSuccess, { type: 'success' });
									$.telligent.evolution.administration.refresh();
								});

								return false;
							}
						})
						.evolutionValidation('addField', wrapper.find('.token input'), {
							required: true,
							maxlength: 50,
							pattern: /^[0-9a-zA-Z]{2,50}$/,
							messages: {
								pattern: context.text.invalidToken
							}
						}, wrapper.find('.token input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.link input'), { url: true, maxlength: 255 }, wrapper.find('.link input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.text textarea'), { required: true, maxlength: 500 }, wrapper.find('.text textarea').closest('.field-item').find('.field-item-validation'), null);
					}
				});
			});



			// deleting
			$.telligent.evolution.messaging.subscribe('delete-snippet', function(data){
				var contentItem = $(data.target).closest('.content-item');
				var snippetId = $(data.target).closest('.content-item').data('snippetid');

				if(confirm('Delete?')) {
					model.delete(context, snippetId).then(function(){
						contentItem.fadeOut(function(){
							contentItem.remove();
						});
					});
				}
			});


			// creating
			var addHeader = $(headingTemplate({
				label: context.text.addLabel
			}));
			var addButton = addHeader.find('a.save');
			$.telligent.evolution.administration.header(addHeader);
			addButton.on('click', function(e){
				e.preventDefault();

				var createHeader = $(headingTemplate({
					label: context.text.createLabel
				}));

				$.telligent.evolution.administration.open({
					name: context.text.addLabel,
					header: createHeader,
					cssClass: 'blog-snippets',
					content: model.createForm(context),
					loaded: function() {

						var createButton = createHeader.find('a.save');
						var wrapper = $.telligent.evolution.administration.panelWrapper();

						createButton.evolutionValidation({
							onValidated: function(isValid, buttonClicked, c) {
							},
							onSuccessfulClick: function(e) {
								e.preventDefault();

								var createOptions = {
									token: wrapper.find('.token input').val(),
									link: wrapper.find('.link input').val(),
									text: wrapper.find('.text textarea').val()
								};

								model.create(context, createOptions).then(function(){
									$.telligent.evolution.notifications.show(context.text.createSuccess, { type: 'success' });
									$.telligent.evolution.administration.refresh();
								});

								return false;
							}
						})
						.evolutionValidation('addField', wrapper.find('.token input'), {
							required: true,
							maxlength: 50,
							pattern: /^[0-9a-zA-Z]{2,50}$/,
							messages: {
								pattern: context.text.invalidToken
							}
						}, wrapper.find('.token input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.link input'), { url: true, maxlength: 255 }, wrapper.find('.link input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.text textarea'), { required: true, maxlength: 500 }, wrapper.find('.text textarea').closest('.field-item').find('.field-item-validation'), null);
					}
				});

				return false;
			});

		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.blogSnippetsApplicationPanel = api;

})(jQuery, window);
