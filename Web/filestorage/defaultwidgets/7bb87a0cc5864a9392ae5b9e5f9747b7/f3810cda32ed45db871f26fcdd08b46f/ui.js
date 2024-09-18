(function($, global, undef) {

	function askQuestion(context, question) {
		$.telligent.evolution.post({
			url: context.addThreadUrl,
			data: {
				forumId: context.forumId,
				body: question
			}
		}).then(function(response){
			window.location = response.threadUrl;
		});
	}

	function searchThreads(context, question) {
		return $.telligent.evolution.get({
			url: context.searchUrl,
			data: {
				forumId: context.forumId,
				applicationId: context.applicationId,
				contentTypeId: context.forumThreadContentType,
				query: question
			}
		});
	}

	function captureInput(context) {
		context.currentQuestion = $.trim(context.questionInput.evolutionComposer('val'));
		if(context.currentQuestion && context.currentQuestion.length > 0) {
			context.submitInput.removeClass('disabled');
		} else {
			context.submitInput.addClass('disabled');
		}
	}

	var api = {
		register: function(context) {
			context.questionInput = $(context.questionInput);
			context.submitInput = $(context.submitInput);
			context.currentQuestion = null;

			context.questionInput.evolutionComposer({
				plugins: [ 'hashtags', 'autocomplete' ],
				contentTypeId: context.forumThreadContentType,
				suggestionHeader: context.suggestionHeading + ' <a href="#" onclick="$(document).trigger(\'click\'); return false;" style="float: right;">' + context.close + '</a>',
				onSuggestionList: function(query, complete) {
					searchThreads(context, query).then(function(response){
						complete(response.results);
					});
				},
				onSuggestionSelect: function(suggestion) {
					if(suggestion.url) {
						window.location = suggestion.url;
					}
				}
			}).evolutionComposer('oninput', function(e){
				captureInput(context);
			});

			setTimeout(function(){
				captureInput(context);
			}, 100);

			context.submitInput.on('click', function(e){
				e.preventDefault();
				if(context.currentQuestion && context.currentQuestion.length > 0) {
					askQuestion(context, context.currentQuestion);
				}
			})
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.forumAskQuestion = api;

}(jQuery, window));
