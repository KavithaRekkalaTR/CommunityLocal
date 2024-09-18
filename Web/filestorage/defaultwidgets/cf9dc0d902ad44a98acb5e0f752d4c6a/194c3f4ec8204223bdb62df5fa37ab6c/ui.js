(function($, global, undef) {

	function publish(context, blogPostId, published) {
		return $.telligent.evolution.put({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts/{BlogPostId}.json',
			data: {
				BlogId: context.blogId,
				BlogPostId: blogPostId,
				IsApproved: published
			}
		});
	}

	function deletePost(context, blogPostId) {
		return $.telligent.evolution.del({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts/{BlogPostId}.json',
			data: {
				BlogId: context.blogId,
				BlogPostId: blogPostId
			}
		});
	}

	function listPosts(context, pageIndex) {
		return $.telligent.evolution.get({
			url: context.listCallback,
			data: {
				blogId: context.blogId,
				pageIndex: pageIndex,
				filter: context.filter,
				query: context.queryText
			}
		});
	}

	function checkNoPosts(context) {
		if (context.blogPostsList.find('li').length == 0) {
			context.blogPostsList.append('<div class="message norecords">' + context.noPostsText + '</div>');
		}
		else {
			$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
		}
	}

	var api = {
		register: function(options) {
			var context = options;
			context.queryText = ''

			if(context.headerTemplateId) {
				var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
				$.telligent.evolution.administration.header(headingTemplate());
			}

			context.blogPostsList = $(options.blogPostsListId);

			// pagings
			context.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.blogPostsList,
				load: function(pageIndex) {
					return $.Deferred(function(d){
						var filter = context.filter;
						listPosts(context, pageIndex).then(function(r){
							if (context.filter != filter) {
								d.resolve();
							}
							// if there was more content, resolve it as true to continue loading
							else if($.trim(r).length > 0) {
								context.blogPostsList.append(r);
								d.resolve();
								checkNoPosts(context);
							} else {
								d.reject();
								// if still the first page, then show the 'no content message'
								if(pageIndex === 0) {
									checkNoPosts(context);
								}
							}
						}).catch(function(){
							d.reject();
						})
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('contextualblogposts.filter', function(data){
				var filter = $(data.target).data('filter');
				context.filter = filter;
				context.blogPostsList.empty();
				$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
				context.scrollableResults.reset();

				$(data.target).closest('ul').children('li').removeClass('selected');
				$(data.target).parent().addClass('selected');
				$.telligent.evolution.administration.header();
			});

			// deleting
			$.telligent.evolution.messaging.subscribe('contextual-delete-post', function(data){
				if(confirm(context.deleteVerificationText)) {
					deletePost(options, $(data.target).data('postid')).then(function(r){
						$(data.target).closest('li.content-item').slideUp(function(){
							$.telligent.evolution.notifications.show(options.postDeletedText);
							$(data.target).closest('li.content-item').remove();

							if(context.blogPostId == $(data.target).data('postid')) {
								global.location = context.blogUrl;
							}
						});
					});
				}
			});

			// publish state
			$.telligent.evolution.messaging.subscribe('blogpost.publish', function(data){
				var link = $(data.target),
					published = link.data('publish'),
					postId = link.data('postid');
				publish(options, postId, published).then(function(response){
					link.data('publish', !response.BlogPost.IsApproved);
					var text;
					var highlight = false;

					if (response.BlogPost.HasPendingChanges && response.BlogPost.IsApproved)
						text = context.publishedEditPendingReviewText;
					else if (response.BlogPost.IsPendingReview)
						text = context.createPendingReviewText;
					else if(!response.BlogPost.IsApproved) {
						text = context.notPublishedText;
						highlight = true;
					} else
						text = context.publishedText;

					if (response.BlogPost.IsApproved) {
						link.html(context.unpublishText);
					} else {
						link.html(context.publishText);
					}
					var el = link.closest('.content-item.post').find('.attribute-item.status .value');

					if (highlight)
						el.addClass('highlight');
					else
						el.removeClass('highlight');

					el.html(text);
				});
			});

			if ($.telligent.evolution.url.hashData()['tab'] == 'notpublished') {
				context.filter = 'notpublished';
				$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
				context.blogPostsList.empty();
				context.scrollableResults.reset();
				$('li.filter-option.all').removeClass('selected');
				$("li.filter-option.unpublished").addClass('selected');
				$.telligent.evolution.administration.header();
			} 

			$('input[type="text"]', $.telligent.evolution.administration.panelWrapper())
				.on('input', function() {
					var queryText = $(this).val();
					global.clearTimeout(context.searchTimeout);
					context.searchTimeout = global.setTimeout(function() {
						if (queryText != context.queryText) {
							context.queryText = queryText;
							context.blogPostsList.empty();
							$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
							context.scrollableResults.reset();
						}
					}, 125);
				});
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.blogPostsApplicationPanel = api;

})(jQuery, window);