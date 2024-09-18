define('messagePager', function($, global, undef){

	var boundHashChanges = {},
		subscribedPagingMessages = {},
		currentPageLoads = {},
		buildLinks = function(context) {
			var links = [],
				settings = context.settings,
				totalPages;
			if(settings.totalItems === 0 || settings.pageSize === 0) {
				totalPages = 0;
			} else {
				totalPages = Math.floor(settings.totalItems / settings.pageSize);
				if(settings.totalItems % settings.pageSize > 0) {
					totalPages = totalPages + 1;
				}
			}

			if(totalPages > 1) {
				// first
				if(settings.showFirst) {
					if(settings.currentPage >= 3 && totalPages > settings.numberOfPagesToDisplay) {
						links[links.length] = {
							type: 'first',
							selected: false,
							page: 1
						};
					}
				}
				// previous
				if(settings.showPrevious) {
					if(settings.currentPage > 0) {
						links[links.length] = {
							type: 'previous',
							selected: false,
							page: settings.currentPage
						};
					}
				}

				// individual page links
				if(settings.showIndividualPages) {
					// determine lower bound
					var start;
					if(totalPages < settings.numberOfPagesToDisplay || settings.currentPage - Math.floor(settings.numberOfPagesToDisplay / 2) < 0) {
						start = 0;
					} else if(settings.currentPage + Math.floor(settings.numberOfPagesToDisplay / 2) >= totalPages) {
						start = totalPages - settings.numberOfPagesToDisplay;
					} else {
						start = settings.currentPage - Math.floor(settings.numberOfPagesToDisplay / 2);
					}

					// determine upper bound
					var end;
					var lastBuffer = Math.floor(settings.numberOfPagesToDisplay / 2);
					if(settings.numberOfPagesToDisplay % 2 === 0) {
						lastBuffer = lastBuffer - 1;
					}
					if(totalPages < settings.numberOfPagesToDisplay || settings.currentPage + lastBuffer >= totalPages) {
						end = totalPages - 1;
					} else if(settings.currentPage - Math.floor(settings.numberOfPagesToDisplay / 2) < 0) {
						end = settings.numberOfPagesToDisplay - 1;
					} else {
						end = settings.currentPage + lastBuffer;
					}
					// add links
					var i;
					for(i = start; i <= end; i++) {
						links[links.length] = {
							type: 'page',
							selected: (settings.currentPage === i),
							page: i + 1
						};
					}
				}

				// next
				if(settings.showNext) {
					if(settings.currentPage + 1 < totalPages) {
						links[links.length] = {
							type: 'next',
							selected: false,
							page: settings.currentPage + 2
						};
					}
				}

				// last
				if(settings.showLast) {
					if(settings.currentPage + 3 < totalPages && totalPages > settings.numberOfPagesToDisplay) {
						links[links.length] = {
							type: 'last',
							selected: false,
							page: totalPages
						};
					}
				}
			}

			return links;
		},
		renderLinks = function(context) {
			var pagerHtml = context.template({ links: context.links, cssClass: context.settings.cssClass });
			context.selection.html(pagerHtml);
		},
		subscribeToPagingMessages = function(context) {
			// unsubscribe from previous subscriptions for this widget, if there were any
			if(subscribedPagingMessages[context.settings.pagedContentPagingEvent + context.settings.tabNameSpace]) {
				context.currentPageIndex = parseInt($.telligent.evolution.url.hashData()[context.settings.pageKey], 10);
				$.telligent.evolution.messaging.unsubscribe(subscribedPagingMessages[context.settings.pagedContentPagingEvent + context.settings.tabNameSpace]);
			}
			// subscribe to paging messages
			subscribedPagingMessages[context.settings.pagedContentPagingEvent + context.settings.tabNameSpace] =
				$.telligent.evolution.messaging.subscribe(context.settings.pagedContentPagingEvent, context.settings.tabNameSpace, function(data) {
					// don't allow page loads to stack up infinitely in case a pager was included on a callback

                    if(currentPageLoads[context.settings.pageKey]) { return; }
					currentPageLoads[context.settings.pageKey] = true;
					// call the implementation of the paged content requestor

					var dataToTrigger = {
						currentPage: context.currentPageIndex || 1,
						newPage: $(data.target).data('page') || 1,
						container: context.settings.pagedContentContainer
					};

					context.settings.onPage(dataToTrigger.newPage, function(response){
						context.currentPageIndex = dataToTrigger.newPage;
						renderNewlyPagedContent(context, dataToTrigger.newPage, dataToTrigger.currentPage, response, true);
					}, ({}));
			});
		},
		renderNewlyPagedContent = function(context, page, oldPage, content, shouldAnimate) {
			var publishPagedMessage = function() {
				var dataToTrigger = {
					page: page,
					container: context.settings.pagedContentContainer
                };
                
				// publish global message
				$.telligent.evolution.messaging.publish(context.settings.pagedContentPagedEvent, dataToTrigger);
				// raise local event on this plugin
				context.selection.trigger('evolutionPagerPaged', dataToTrigger)
			};
			// render content
			if(shouldAnimate && (context.settings.transition === 'slide' || context.settings.transition === 'fade')) {
				var transition = 'fade';
				if(context.settings.transition === 'slide') {
					transition = page < oldPage ? 'slideRight' : 'slideLeft';
				}
				var container = $(context.settings.pagedContentContainer);
				var newContent = $('<div></div>')
					.attr('id',container.attr('id'))
					.html(content)
					.hide()
					.insertAfter(context.settings.pagedContentContainer);

				container.glowTransition(newContent, {
					type: transition,
					duration: context.settings.transitionDuration,
					complete: function() {
						$(context.settings.pagedContentContainer).css({width:'',height:'',overflow:'hidden'});
						publishPagedMessage();
						currentPageLoads[context.settings.pageKey] = false;
					}
				});
			} else {
				$(context.settings.pagedContentContainer).html(content);
				publishPagedMessage();
				currentPageLoads[context.settings.pageKey] = false;
			}

			// update links
			context.settings.currentPage = page - 1;
			context.links = buildLinks(context);
			renderLinks(context);
		};

	$.fn.messagePager = function(options) {

        return this.each(function () {
            var $t = $(this);

            var settings = $.extend({}, $.fn.messagePager.defaults, options || {}),
			context = {
				selection: $t,
				settings: settings,
				template: $.telligent.evolution.template.compile(settings.template)
            };

            context.links = buildLinks(context);
            renderLinks(context);
            subscribeToPagingMessages(context);
        });
	};

    $.fn.messagePager.defaults = {
		// normal options
		currentPage: 0,
		pageSize: 10,
		totalItems: 0,
		showPrevious: false,
		showNext: false,
		showFirst: true,
		showLast: true,
		showIndividualPages: true,
		numberOfPagesToDisplay: 5,
		pageKey: 'pi',
		cssClass: '',
		// ajax-specific options
		onPage: function(pageIndex, complete) { },
		pagedContentContainer: '',
		pagedContentPagingEvent: 'messagingpager.page.paging',
		pagedContentPagedEvent: 'messagingpager.page.paged',
		transition: null, // slide|fade|null
		transitionDuration: 250,
		// template
		template: '' +
		'<ul class="pagination <%= cssClass %>">' + 
		' <% foreach(links, function(link, i) { %> ' +
		'     <% if(link.type === "first") { %> ' +
		'		  <li class="page-item first">' +
		'           <a href="#" class="page-link" data-messagename="messagingpager.page.paging" data-type="first" data-page="<%= link.page %>" data-selected="false">First</a> ' +
		'		  </li>' +
		'     <% } else if(link.type === "previous") { %> ' +
		'		  <li class="page-item prev">' +
		'           <a href="#" class="page-link" data-messagename="messagingpager.page.paging" data-type="previous" data-page="<%= link.page %>" data-selected="false">Previous</a>' +
		'		  </li>' +
		'     <% } else if(link.type === "page") { %> ' +
		'		  <li class="page-item<%= link.selected ? " active" : "" %>">' +
		'           <a href="#" class="page-link" data-messagename="messagingpager.page.paging" data-type="page" data-page="<%= link.page %>" data-selected="<%= link.selected ? "true" : "false" %>"><span><%= link.page %></span></a> ' +
		'		  </li>' +
		'     <% } else if(link.type === "next") { %> ' +
		'		  <li class="page-item next">' +
		'           <a href="#" class="page-link" data-messagename="messagingpager.page.paging" data-type="next" data-page="<%= link.page %>" data-selected="false">Next</a>' +
		'		  </li>' +
		'     <% } else if(link.type === "last") { %> ' +
		'		  <li class="page-item last">' +
		'           <a href="#" class="page-link" data-messagename="messagingpager.page.paging" data-type="last" data-page="<%= link.page %>" data-selected="false">Last</a> ' +
		'		  </li>' +
		'     <% } %> ' +
		' <% }); %> ' +
		'</ul>'
	};

	return {};
}, jQuery, window);
