(function($, global, undef) {

	var model = {
		toggleHelpful: function(context, articleId) {
			showLoading(context);
			return $.telligent.evolution.post({
				url: context.callbackHelpful,
				data: {
					_w_articleId: articleId
				}
			}).always(function(r){
				hideLoading(context);
				return r;
			});
		},
		toggleUnhelpful: function(context, articleId, responseType, message) {
			showLoading(context);
			return $.telligent.evolution.post({
				url: context.callbackUnhelpful,
				data: {
					_w_articleId: articleId,
					_w_responseTypeId: responseType,
					_w_message: message
				}
			}).always(function(r){
				hideLoading(context);
				return r;
			});
		},
		getFeedbackForm: function(context, articleId) {
			showLoading(context);
			return $.telligent.evolution.get({
				url: context.callbackFeedbackForm,
				data: {
					_w_articleId: articleId
				}
			}).always(function(r){
				hideLoading(context);
				return r;
			});
		},
		deleteRating: function(context, articleId, ratingId) {
			showLoading(context);
			return $.telligent.evolution.post({
				url: context.callbackDeleteRating,
				data: {
					_w_articleId: articleId,
					_w_ratingId: ratingId,
				}
			}).always(function(r){
				hideLoading(context);
				return r;
			});
		},
		listUnhelpful: function(context, articleId, pageIndex) {
			return $.telligent.evolution.get({
				url: context.callbackListUnhelpful,
				data: {
					_w_articleId: articleId,
					_w_pageIndex: pageIndex
				}
			});
		}
	};

	function showLoading(context) {
		if (!context.loadingIndicator) {
			context.loadingIndicator = $($.telligent.evolution.template(context.loadingTemplate)({})).hide().appendTo(context.actions);
		}
		context.actionsList.hide();
		context.loadingIndicator.show();
	}

	function hideLoading(context) {
		if (context.loadingIndicator)
			context.loadingIndicator.hide();
		context.actionsList.show();
	}

	function isValid(context) {
		var messageIsRequired = false;
		if (context.singleResponseType.length > 0) {
			messageIsRequired = context.singleResponseType.data('messagerequired');
		} else {
			messageIsRequired = context.responseTypeSelect.find(':selected').hasClass('message-required');
		}
		var isValid = (!messageIsRequired || $.trim(context.responseMessage.val()) != '');
		if (isValid) {
			context.modalSubmit.removeClass('disabled');
			context.responseMessageValidation.hide();
		} else {
			context.modalSubmit.addClass('disabled');
		}
		return isValid;
	}

	function handleEvents(context) {
		function subscribe(messageLinkName, handler) {
			$.telligent.evolution.messaging.subscribe('widget.' + context.wrapper + '.' + messageLinkName, handler);
		}

		function updateCountsAndSelections(data, options) {
			if (options && options.helpful !== undef) {
				if (options.helpful)
					context.actions.find('a.helpful').addClass('selected');
				else
					context.actions.find('a.helpful').removeClass('selected');
			}
			if (options && options.unhelpful !== undef) {
				if (options.unhelpful)
					context.actions.find('a.unhelpful').addClass('selected');
				else
					context.actions.find('a.unhelpful').removeClass('selected');
			}
			if (data.totalHelpful !== undef)
				context.actions.find('.count.totalhelpful').text((data.totalHelpful > 0 ? data.totalHelpful : ''));
		}

		subscribe('helpful', function(e) {
			model.toggleHelpful(context, context.articleId).then(function(data){
				updateCountsAndSelections(data, {
					helpful: data.ratedHelpful,
					unhelpful: data.ratedUnhelpful,
				});
			});
		});

		subscribe('deleterating', function(e) {
			model.deleteRating(context, context.articleId, $(e.target).data('ratingid')).then(function(data){
				if (!data.ratedUnhelpful && context.previousFeedback) {
					context.previousFeedback.hide();
				}
				$(e.target).closest('.content-item').fadeOut(200);
				updateCountsAndSelections(data, {
					helpful: data.ratedHelpful,
					unhelpful: data.ratedUnhelpful,
				});
			});
		});

		subscribe('unhelpful', function(e) {
			model.getFeedbackForm(context, context.articleId).then(function(form){
				context.modalContent = $(form);
				context.responseTypeSelect = context.modalContent.find('select.response-type-select')
				context.singleResponseType = context.modalContent.find('.response-type');
				context.responseMessage = context.modalContent.find('textarea.response-message');
				context.responseMessageValidation = context.modalContent.find('.response-message .field-item-validation');
				context.ratings = context.modalContent.find('.unhelpful-ratings');
				context.modalCancel = context.modalContent.find('a.cancel');
				context.modalSubmit = context.modalContent.find('a.submit');
				context.previousFeedback = context.modalContent.find('.previous-feedback');

				context.responseTypeSelect.on('change', function(e){
					isValid(context);
				});

				context.responseMessage.on('input', function(e){
					isValid(context);
				});

				context.modalCancel.on('click', function(e) {
					$.glowModal.close();
					return false;
				});

				context.modalSubmit.on('click', function(e) {
					var link = $(this);
					if (link.hasClass('disabled')) {
						return false;
					}

					if (!isValid(context)) {
						context.responseMessageValidation.show();
						return false;
					}

					var responseTypeId;
					if (context.singleResponseType.length > 0) {
						responseTypeId = context.singleResponseType.data('responsetypeid');
					} else {
						responseTypeId = context.responseTypeSelect.val();
					}

					model.toggleUnhelpful(context,
						context.articleId,
						responseTypeId,
						context.responseMessage.val()).then(function(data){
							updateCountsAndSelections(data, { unhelpful: true, helpful: false });
						});

					$.glowModal.close();
					return false;
				});

				$('body').one('glowModalOpened', function() {
					context.ratings.evolutionScrollable({
						load: function(pageIndex) {
							return model.listUnhelpful(context, context.articleId, pageIndex);
						}
					});
					context.responseMessage.evolutionResize();

					isValid(context);
				});

				$.glowModal({
					title: context.modalTitle,
					html: context.modalContent,
					width: 450,
					height: '100%'
				});
			});
		});

		subscribe('unhelpful-cancel', function(e) {
			$.glowModal.close();
		});
	}

	var api = {
		register: function(context) {
			context.actions = $('#' + context.wrapper).find('.actions.helpfulness');
			context.actionsList = context.actions.find('.navigation-list').first();

			handleEvents(context);
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.articleHelpfulness = api;

}(jQuery, window));