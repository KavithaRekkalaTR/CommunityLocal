(function($, global, undef) {
    
    var truncatePattern = /^(.{1,100}[^\s]*)/;

	var defaults = {
		contentSelector: '.content-fragment-page .content.full .content',
		scrollOffset: 120,
		animationDuration: 200,
		maxParseDepth: 6,
		maxDepth: 2,
		collapseAt: 1,
		renderInline: false,
		currentlyFocused: null
	};

	// constrain indentation to a max depth
	function constrainIndentation(depth, maxDepth) {
		return depth <= maxDepth ? depth : maxDepth;
	}

	function scrollTo(context, element) {
		// find and pre-highlight targeted link before animated scrolling
		var linkToFocus = null;
		var i = context.links.findIndex(function(l) {
			return l.heading == element;
		});
		if (i >= 0) {
			linkToFocus = context.links[i];
			focus(context, linkToFocus);
		}

		// animate scrolling, pausing live highlighting of links while scrolling
		context.scrollingTo = true;
		$('html, body').animate({
			scrollTop: $(element).offset().top - context.scrollOffset
		}, {
			duration: context.animationDuration,
			complete: function () {
				setTimeout(function() {
					context.scrollingTo = false;
				}, 50);
				if (!linkToFocus)
					scrolled(context);
			}
		});
	}

	function inViewport (context, element) {
		var rect = element.getBoundingClientRect();
		return (
			(rect.top + context.scrollOffset || 0) >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (global.innerHeight || document.documentElement.clientHeight) &&
			rect.right <= (global.innerWidth || document.documentElement.clientWidth)
		);
	}

	// processes headings in content into link models
	// determines and smooths indentation levels
	function processHeadings(context) {
		var links = [];
		context.anchors = {};

		// collect links
		context.headings.each(function(){
			var heading = $(this);
			var link = {
				heading: this,
			};

			// capture text
			link.label = $.trim(heading.text());
			var labelMatch = truncatePattern.exec(link.label);
			if (labelMatch != null && labelMatch.length == 2 && labelMatch[1].length < link.label.length)
			    link.label = labelMatch[1] + '…';

            if (link.label.length > 0) {
    			// determine level
    			link.level = 1;
    			if (heading.is('h1'))
    				link.level = 1;
    			else if (heading.is('h2'))
    				link.level = 2;
    			else if (heading.is('h3'))
    				link.level = 3;
    			else if (heading.is('h4'))
    				link.level = 4;
    			else if (heading.is('h5'))
    				link.level = 5;
    			else if (heading.is('h6'))
    				link.level = 6;
    
    			// capture existing anchor name for id or create a new one if not already set
    			link.anchorName = $(link.heading).attr('id');
    			if (!link.anchorName || link.anchorName.length == 0) {
    				link.anchorName = link.label.toLowerCase().replace(/\W/g, '-').substring(0, 100);
    				if (context.anchors[link.anchorName]) {
    					link.anchorName = link.anchorName + '-' + links.length;
    				}
    				$(link.heading).attr('id', link.anchorName);
    			}
    			context.anchors[link.anchorName] = link;
    
    			links.push(link);
            }
		});

		// process indentation depths to smooth out discrepancies
		// in heading level vs indentation depths
		for (var i = 0; i < links.length; i++) {
			var link = links[i];

			// first link is consiered to be root depth
			if (i === 0) {
				link.indent = 0;

			// if heading is same as previous, same indent level
			} else if (link.level === links[i - 1].level) {
				link.indent = constrainIndentation(links[i - 1].indent, context.maxDepth);

			// if heading is at all greater than than previous (regardless of how much),
			// then it's only ever 1 level deeper than previous
			} else if (link.level > links[i - 1].level) {
				link.indent = constrainIndentation(links[i - 1].indent + 1, context.maxDepth);

			// if heading has a lower level than previous...
			} else if (link.level < links[i - 1].level) {
				// then walk backward up previous links until gets to a root
				// or gets to a link at equal level as current
				// or gets to al ink at less than current (so link will be considered a child of parent)
				for (var j = (i - 1); j >= 0; j--) {
					// got to a root
					if (links[j].indent === 0) {
						link.indent = 0;
						break;
					// got to an ancestor heading of equal level, so equivalent depth
					} else if (link.level === links[j].level) {
						link.indent = constrainIndentation(links[j].indent, context.maxDepth);
						break;
					// got to an ancestor of lower level, so there's effectively non-linear depth levels
					// so link gets same indentation as earlier sibling which is a deeper level heading
					} else if (links[j].level < link.level) {
						link.indent = constrainIndentation(links[j].indent + 1, context.maxDepth);
						break;
					}
				}
			}
		}

		// capture parent child references for quick expand/collapse
		var parent = null;
		for (var i = 0; i < links.length; i++) {
			var link = links[i];
			link.children = [];

			if (link.indent == 0) {
				parent = link;
				link.parent = null;
			} else {
				if (link.indent > links[i - 1].indent) {
					parent = links[i - 1];
				} else if (link.indent < links[i - 1].indent) {
					parent = parent.parent;
				}

				link.parent = parent;
				parent.children.push(link);
			}
		}

		return links;
	}

	function renderAndHandleLinks(context) {
		var container = $($.telligent.evolution.template(context.containerTemplate)({}));

		context.links.forEach(function(link) {
			link.linkAnchor = $('<a></a>').text(link.label).attr('href', '#' + link.anchorName);
			link.linkAnchor.on('click', function(e){
				scrollTo(context, link.heading);
			});

			link.linkNode = $('<li class="content-toc-item indent-' + link.indent + '"></li>');
			link.linkNode.append(link.linkAnchor);

			if (link.indent > context.collapseAt) {
				hide(link);
			}

			container.append(link.linkNode);
		});

		return container;
	}

	function hide(link) {
		link.linkNode.css('display', 'none');
	}

	function show(link) {
		link.linkNode.css('display', 'block');
	}


	function highlight(context, link) {
		link.linkNode.addClass('current');
		if (link.indent >= context.collapseAt && !context.renderInline)
			showChildren(context, link);
		if (link.indent > context.collapseAt && !context.renderInline)
			showSelfAndAncestors(context, link);
	}

	function unhighlight(context, link) {
		link.linkNode.removeClass('current');
		if (link.indent >= context.collapseAt && !context.renderInline) {
			hideSelfAndAncestors(context, link);
			hideSelfAndChildren(context, link, true);
		}
	}

	function showChildren(context, link) {
		link.children.forEach(function(l) {
			show(l);
		});
	}

	function hideChildren(context, link) {
		link.children.forEach(function(l) {
			hide(l);
		});
	}

	function hideSelfAndAncestors(context, link) {
		if (!link)
			return;
		if (link.indent >= context.collapseAt)
			hideChildren(context, link);
		if (link.indent <= context.collapseAt)
			return;
		hide(link);
		if (link.parent)
			hideSelfAndAncestors(context, link.parent);
	}

	function showSelfAndAncestors(context, link) {
		if (!link)
			return;
		show(link);
		if (link.parent) {
			showSelfAndAncestors(context, link.parent);
			link.parent.children.forEach(function(l) {
				show(l);
			});
		}
	}

	function hideSelfAndChildren(context, link, excludeSelf) {
		if (!excludeSelf)
			hide(link);
		if (link.children) {
			link.children.forEach(function(l) {
				hideSelfAndChildren(context, l);
			});
		}
	}

	function scrolled(context) {
		var linkToFocus = null;
		for (var i = 0; i < context.links.length; i++) {
			if (inViewport(context, context.links[i].heading)) {
				linkToFocus = context.links[i];
				break;
			}
		}
		if (linkToFocus) {
			focus(context, linkToFocus);
		}
	}

	function focus(context, link) {
		// unhighlight currently-highlighted
		if (context.currentlyFocused) {
			if (link == context.currentlyFocused)
				return;
			unhighlight(context, context.currentlyFocused);
			context.currentlyFocused = null;
		}

		// highlight
		context.currentlyFocused = link;
		highlight(context, link);
	}

	function handleEvents(context) {
		var scrolling = false;
		var scrollDebounceTimeout;

		global.addEventListener('scroll', function(e) {
			if (context.scrollingTo)
				return;
			if (!scrolling) {
				global.requestAnimationFrame(function() {
					scrolled(context);
					scrolling = false;
				});
				scrolling = true;
			}
		});

		scrolled(context);
	}

	// scroll to initial hash, if included
	function scrollToInitialHash(context) {
		var hash = global.location.hash;
		if (!hash || hash.length <= 1)
			return;

		hash = hash.substring(1);

		if (context.anchors[hash])
			scrollTo(context, context.anchors[hash].heading)
	}
	
	function addEntityWrappers(context, links) {
	    var width = Math.floor(context.contentWidth) - Math.ceil(links.outerWidth(true));
	    context.content.find('img, video, audio, object, embed, iframe').each(function() {
	        var entity = $(this);
	        if (Math.min(entity.outerWidth(true)) >= width) {
	            if (!entity.parent().hasClass('content-toc-entity-wrapper')) {
	                entity.wrap('<span class="content-toc-entity-wrapper"></span>');
	            }
	        } else if (entity.parent().hasClass('content-toc-entity-wrapper')) {
	            entity.unwrap();
	        }
	    });
	}
	
	function monitorContentWidths(context, links) {
	    context.contentWidth = context.content.width();
	    
	    context.content.on('resized', function() {
	        var width = context.content.width();
	        if (width != context.lastWidth) {
                context.contentWidth = width;
                addEntityWrappers(context, links); 
	        }
	    });
	    
	    addEntityWrappers(context, links);
	}

	var api = {
		register: function(options) {
			var context = $.extend({}, defaults, options);

			context.content = $(context.contentSelector);

			var headingSelectors = [];
			for (var i = 1; i <= context.maxParseDepth; i++) {
				headingSelectors.push('h' + i);
			}

			context.headings = context.content.find(headingSelectors.join(','));
			context.links = processHeadings(context);
			
			if (context.links.length == 0) {
				$(context.wrapper).closest('.content-fragment').hide();
				return ;
			}
			
			var renderedLinks = renderAndHandleLinks(context);
			handleEvents(context);
			scrollToInitialHash(context);

			// render inline in content or within host widget
			if (context.renderInline) {
				context.content.prepend(renderedLinks);
				monitorContentWidths(context, renderedLinks);
			} else {
				$(context.wrapper).append(renderedLinks);
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.contentDynamicToc = api;

})(jQuery, window);