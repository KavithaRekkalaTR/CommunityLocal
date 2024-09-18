(function($) {

	var setupListDetailLinks = function(context) {
			$('.view', context.wrapper).on('change', function(e){
				var sortedUrl = $(e.target).data('update').replace('VIEWTYPE', $(e.target).val());
				window.location = sortedUrl;
			});
			$('.by', context.wrapper).on('change', function(e){
				var sortedUrl = $(e.target).data('update').replace('SORTBY', $(e.target).val());
				window.location = sortedUrl;
			});
			$('.order', context.wrapper).on('change', function(e){
				var orderedUrl = $(e.target).data('update').replace('SORTORDER', $(e.target).val());
				window.location = orderedUrl;
			});
		},
		setupAttachmentViewLinks = function(context) {
			$.telligent.evolution.messaging.subscribe('hideShowMedia', function(data) {
				var link = $(data.target);
				var mediaId = link.data('mediaid');
				var parent = $('.content-item[data-mediaid="' + mediaId + '"]', context.wrapper);
				if (link.parent().parent().hasClass('view-attachment')) {
					$('.hide-attachment', parent).removeClass('hidden').show();
					link.parent().parent().addClass('hidden').hide();

					$.telligent.evolution.get({
						url: context.previewFileUrl,
						data: {
							mediaId: mediaId
						}
					}).then(function(excerpt){
						parent.find('.content.preview')
							.empty()
							.append(excerpt)
							.removeClass('hidden')
							.show();
					});

					return false;
				} else {
					$('.content .content', parent).addClass('hidden').hide();
					$('.view-attachment', parent).removeClass('hidden').show();
					link.parent().parent().addClass('hidden').hide();
					return false;
				};
			});
		},
		loadNextPage = function(context, pageIndex) {
			context.isLoadingMore = true;

			var data = {}
			data[context.pageIndexKey] = pageIndex;

			return $.telligent.evolution.get({
				url: context.loadNextPageUrl,
				data: data
			}).then(function(response){
				context.isLoadingMore = false;
				return response;
			});
		};
		setupEndlessScrolling = function(context) {
			$(context.thumbnailContainer).parent().evolutionScrollable({
				// set an explicit target that's inside of the selection
				// since masonry wants to control all of its element
				// and evolutionScrollable needs an element (the selection)
				// in which to append loading/load more indicators
				target: $(context.thumbnailContainer),
				initialPageIndex: 1,
				load: function(pageIndex) {
					return $.Deferred(function(d){
						if(context.isLoadingMore || !context.hasMore)
						    d.reject();
					    loadNextPage(context, pageIndex).then(function(response){
							var items = $(response).filter('div');
							context.hasMore = items.data('hasmore') == 'True';
							$(context.thumbnailContainer).evolutionMasonry('append', items);    
							d.resolve(true);
						});
					}).promise();
				}
			});
		};

	var api = {
		register: function(context) {
			context.wrapper = $(context.wrapper);
			setupListDetailLinks(context);
			setupAttachmentViewLinks(context);
			if(context.view == 'Thumbnail') {
				setupEndlessScrolling(context);
				$(context.wrapper).on('click', '.content-item', function(e){
					window.location = $(this).data('url');
				});
			}
		}
	};

	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.mediaGalleryPostList = api;

})(jQuery);