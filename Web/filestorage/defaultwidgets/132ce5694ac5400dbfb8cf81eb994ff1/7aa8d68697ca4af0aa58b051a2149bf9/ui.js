(function($, global, undef) {

	var model = {
		create: function(context, options) {
			return $.telligent.evolution.post({
				url: context.createUrl,
				dataType: 'json',
				data: options
			});
		},
		update: function(context, feedId, options) {
			options.FeedId = feedId;
			return $.telligent.evolution.post({
				url: context.updateUrl,
				dataType: 'json',
				data: options
			});
		},
		delete: function(context, feedId) {
			return $.telligent.evolution.post({
				url: context.deleteUrl,
				dataType: 'json',
				data: {
					FeedId: feedId
				}
			});
		},
		createForm: function(context) {
			return $.telligent.evolution.get({
				url: context.createFormUrl,
				data: {}
			});
		},
		updateForm: function(context, feedId) {
			return $.telligent.evolution.get({
				url: context.updateFormUrl,
				data: {
					FeedId: feedId
				}
			});
		}
	}

	var api = {
		register: function(context) {
			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);

			// editing
			$.telligent.evolution.messaging.subscribe('edit-feed', function(data){
				var feedId = $(data.target).closest('.content-item').data('feedid');

				var editHeader = $(headingTemplate({
					label: context.text.saveLabel
				}));

				$.telligent.evolution.administration.open({
					name: context.text.editHeading,
					header: editHeader,
					cssClass: 'blog-mirrored-feeds',
					content: model.updateForm(context, feedId),
					loaded: function() {
						var editButton = editHeader.find('a.save');
						var wrapper = $.telligent.evolution.administration.panelWrapper();
						console.log(wrapper.find('.title input').attr('id'));

						editButton.evolutionValidation({
							onValidated: function(isValid, buttonClicked, c) {
							},
							onSuccessfulClick: function(e) {
								e.preventDefault();

								var updateOptions = {
									Title: wrapper.find('.title input').val(),
									Url: wrapper.find('.url input').val(),
									DefaultAuthorUsername: wrapper.find('.defaultAuthorUsername select').val(),
									IntervalMinutes: wrapper.find('.intervalMinutes input').val(),
									ExerptSize: wrapper.find('.exerptSize input').val(),
									PostFullText: wrapper.find('.postFullText input').is(':checked')
								};

								model.update(context, feedId, updateOptions).then(function(){
									$.telligent.evolution.notifications.show(context.text.updateSuccess, { type: 'success' });
									$.telligent.evolution.administration.refresh();
								});

								return false;
							}
						})
						.evolutionValidation('addField', wrapper.find('.title input'), { required: true }, wrapper.find('.title input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.url input'), {
							required: true,
							url: true
						}, wrapper.find('.url input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.intervalMinutes input'), { required: true, digits: true }, wrapper.find('.intervalMinutes input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.exerptSize input'), { required: true, digits: true }, wrapper.find('.exerptSize input').closest('.field-item').find('.field-item-validation'), null);
					}
				});
			});



			// deleting
			$.telligent.evolution.messaging.subscribe('delete-feed', function(data){
				var contentItem = $(data.target).closest('.content-item');
				var feedId = $(data.target).closest('.content-item').data('feedid');

				if(confirm('Delete?')) {
					model.delete(context, feedId).then(function(){
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
					name: context.text.addHeading,
					header: createHeader,
					cssClass: 'blog-mirrored-feeds',
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
									Title: wrapper.find('.title input').val(),
									Url: wrapper.find('.url input').val(),
									DefaultAuthorUsername: wrapper.find('.defaultAuthorUsername select').val(),
									IntervalMinutes: wrapper.find('.intervalMinutes input').val(),
									ExerptSize: wrapper.find('.exerptSize input').val(),
									PostFullText: wrapper.find('.postFullText input').is(':checked')
								};

								model.create(context, createOptions).then(function(){
									$.telligent.evolution.notifications.show(context.text.createSuccess, { type: 'success' });
									$.telligent.evolution.administration.refresh();
								});

								return false;
							}
						})
						.evolutionValidation('addField', wrapper.find('.title input'), { required: true }, wrapper.find('.title input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.url input'), {
							required: true,
							url: true
						}, wrapper.find('.url input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.intervalMinutes input'), { required: true, digits: true }, wrapper.find('.intervalMinutes input').closest('.field-item').find('.field-item-validation'), null)
						.evolutionValidation('addField', wrapper.find('.exerptSize input'), { required: true, digits: true }, wrapper.find('.exerptSize input').closest('.field-item').find('.field-item-validation'), null);
					}
				});

				return false;
			});

		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.blogMirroredFeedsApplicationPanel = api;

})(jQuery, window);
