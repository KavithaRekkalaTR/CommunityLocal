(function ($, global, undef) {

	var PageRenderer = function (options) {

		var initialized = false,
			pages = [],
			currentPage = {
				index: -1,
				offsetLeft: 0,
				offsetTop: 0
			},
			highlightElm = $('<div class="doc-preview-highlight"></div>').css({
				'position': 'absolute',
				'display': 'none',
				'opacity': '.5',
				'box-sizing': 'border-box',
				'z-index': '3'
			}),
			currentPageElm = $('<div class="doc-preview-current-page"></div>').css({
				'position': 'absolute',
				'display': 'none',
				'opacity': '.75',
				'box-sizing': 'border-box',
				'z-index': '4',
				'bottom': '32px',
				'right': '32px'
			}),
			currentHighlight = null,
			zoom = 1.0,
			animationOptions = {
				duration: 250,
				queue: false,
				easing: 'swing'
			},
			pageUrlFormat = null,
			pagesContainer = null,
			pageOffsetHeight = 0,
			pageOffsetWidth = 0,
			scrollbarWidth = 0,
			isAdjusting = false;

		var showPage = function (pageIndex, animate) {
				var pageData = pages[pageIndex];
				if (!pageData) {
					return;
				}

				currentPage.index = pageIndex;
				currentPage.offsetLeft = 0;
				currentPage.offsetTop = 0;

				if (animate !== false) {
					container.animate({
						scrollTop: pageData.top
					}, animationOptions);
				} else {
					container.scrollTop(pageData.top);
				}
			},
			highlight = function (pageIndex, x, y, width, height, animate) {
				var pageData = pages[pageIndex];
				if (!pageData) {
					return;
				}

				ensurePageIsLoaded(pageIndex, true);
				page = pageData.elm;
				if (!page) {
					return;
				}

				var img = page.get(0);

				currentHighlight = {
					pageIndex: pageIndex,
					x: x,
					y: y,
					width: width,
					height: height
				};

				highlightElm.appendTo(page).css({
					top: (y * pageData.scale) + 'px',
					left: (x * pageData.scale) + 'px',
					width: (width * pageData.scale) + 'px',
					height: (height * pageData.scale) + 'px'
				}).show();

				var scrollTop = img.offsetTop + (y * pageData.scale) + (((height * pageData.scale) - container.height()) / 2);
				if (scrollTop < 0) {
					scrollTop = 0;
				}

				var scrollLeft = 0;
				if (page.width() > container.width()) {
					scrollLeft = img.offsetLeft + (x * pageData.scale) + (((width * pageData.scale) - container.width()) / 2);
				}
				if (scrollLeft < 0) {
					scrollLeft = 0;
				}

				currentPage.index = pageIndex;
				currentPage.offsetLeft = x;
				currentPage.offsetTop = y;
				currentPage.centerOffset = true;

				if (animate !== false) {
					container.animate({
						scrollTop: scrollTop,
						scrollLeft: scrollLeft
					}, animationOptions);
				} else {
					container.scrollTop(scrollTop).scrollLeft(scrollLeft);
				}
			},
			clearHighlight = function () {
				if (currentHighlight) {
					highlightElm.hide();
					currentHighlight = null;
				}
			},
			resize = function (width, height) {
				options.width = width;
				options.height = height;
				container.css({
					width: options.width + 'px',
					height: options.height + 'px'
				});

				updatePages();
			},
			updatePages = function () {
				if (!initialized) {
					pages = [];
					container.empty();

					pagesContainer = $('<div></div>').css({
						position: 'relative',
						padding: '0px',
						margin: '0px',
						'border-width': '0px'
					});

					container.append(pagesContainer);

					var scrollDiv = $('<div></div>').css({
						width: '100px',
						height: '100px',
						overflow: 'scroll',
						position: 'absolute',
						top: '-99999px',
						'-webkit-transform': 'translate3d(0,0,0)'
					});
					$('body').append(scrollDiv);
					scrollbarWidth = scrollDiv.get(0).offsetWidth - scrollDiv.get(0).clientWidth;
					var paddingLeft = parseInt(container.css('padding-left'), 10);
					if (isNaN(paddingLeft)) {
						paddingLeft = 0;
					}
					container.css({
						'padding-right': (scrollbarWidth + paddingLeft) + 'px'
					});
					scrollDiv.remove();

					var tempPage = $('<div class="doc-preview-page"></div>').css({
						width: '0px',
						height: '0px',
						position: 'absolute',
						top: '0px',
						'margin-left': 'auto',
						'margin-right': 'auto',
						'-webkit-transform': 'translate3d(0,0,0)'
					});
					pagesContainer.append(tempPage);
					pageOffsetHeight = tempPage.outerHeight();
					pageOffsetWidth = tempPage.outerWidth();
					tempPage.remove();

					var maxWidth = container.width(),
						maxHeight = container.height(),
						topOffset = 0;;
					for (var i = 0; i < options.pageData.length; i++) {
						var scale = getScale(maxWidth, maxHeight, options.pageData[i][0], options.pageData[i][1], options.fit);

						pages.push({
							width: options.pageData[i][0] * scale,
							height: options.pageData[i][1] * scale,
							url: null,
							top: topOffset,
							left: Math.max(0, (maxWidth - (options.pageData[i][0] * scale) - pageOffsetWidth) / 2),
							elm: null,
							scale: scale
						});

						topOffset += (pageOffsetHeight + (options.pageData[i][1] * scale));
					}

					pagesContainer.css({
						height: topOffset + 'px'
					});

					initialized = true;
				} else {
					isAdjusting = true;
					var maxWidth = container.width(),
						maxHeight = container.height(),
						topOffset = 0,
						totalHeight = 0,
						totalWidth = 0;
					for (var i = 0; i < pages.length; i++) {
						var oldHeight = pages[i].height;

						pages[i].scale = getScale(maxWidth, maxHeight, options.pageData[i][0], options.pageData[i][1], options.fit);
						pages[i].width = options.pageData[i][0] * pages[i].scale;
						if (pages[i].width > totalWidth) {
							totalWidth = pages[i].width + pageOffsetWidth;
						}
						pages[i].height = options.pageData[i][1] * pages[i].scale;
						pages[i].left = Math.max(0, (maxWidth - pages[i].width - pageOffsetWidth) / 2);
						pages[i].top += topOffset;
						pages[i].url = null;

						if (pages[i].elm) {
							pages[i].elm.animate({
								width: pages[i].width + 'px',
								height: pages[i].height + 'px',
								left: pages[i].left + 'px',
								top: pages[i].top + 'px'
							}, animationOptions);
							$('img', pages[i].elm).animate({
								width: pages[i].width + 'px',
								height: pages[i].height + 'px'
							}, animationOptions);
						}

						topOffset += (pages[i].height - oldHeight);
						totalHeight = pages[i].top + pages[i].height;
					}

					pagesContainer.animate({
						height: totalHeight + 'px',
						width: Math.max(maxWidth, totalWidth) + 'px'
					}, $.extend({},
						animationOptions, {
							done: function () {
								isAdjusting = false;
							}
						}
					));
				}

				if (currentHighlight && currentHighlight.pageIndex >= 0 && currentHighlight.pageIndex < pages.length) {
					var page = pages[currentHighlight.pageIndex];
					highlightElm.appendTo(page.elm).animate({
						top: (currentHighlight.y * page.scale) + 'px',
						left: (currentHighlight.x * page.scale) + 'px',
						width: (currentHighlight.width * page.scale) + 'px',
						height: (currentHighlight.height * page.scale) + 'px'
					}, animationOptions).show();
				}

				if (currentPage.index >= 0 && currentPage.index < pages.length) {
					var targetTop = pages[currentPage.index].top + (currentPage.offsetTop * pages[currentPage.index].scale),
						targetLeft = currentPage.offsetLeft * pages[currentPage.index].scale;

					if (currentPage.centerOffset) {
						targetTop = Math.max(0, targetTop - (container.height() / 2));
						targetLeft = Math.max(0, targetLeft - (container.width() / 2));
						if (pages[currentPage.index].width - targetLeft < container.width()) {
							targetLeft = Math.max(0, pages[currentPage.index].width - container.width());
						}
					}

					container.animate({
						scrollTop: targetTop,
						scrollLeft: targetLeft
					}, animationOptions);
				}

				global.setTimeout(function () {
					ensureVisiblePagesAreLoaded(true);
				}, 349);
			},
			changeFit = function (fit) {
				options.fit = fit;
				zoom = 1.0;
				updatePages();
			},
			getScale = function (maxWidth, maxHeight, pageWidth, pageHeight, fit) {
				if (fit == 'height') {
					return (maxHeight / pageHeight) * zoom;
				} else if (fit == 'width') {
					return (maxWidth / pageWidth) * zoom;
				} else {
					return (Math.min(maxHeight / pageHeight, maxWidth / pageWidth)) * zoom;
				}
			},
			getPageImageUrl = function (pageIndex, scale) {
				var density = (Math.round(window.devicePixelRatio || 1) || 1);
				var quality = scale * zoom * density * 72;

				var urlFormat = null;
				var dpi = null;
				for (var i = 0; i < options.pageUrlFormats.length; i++) {
					if (dpi == null || Math.abs(dpi - quality) > Math.abs(options.pageUrlFormats[i].dpi - quality)) {
						urlFormat = options.pageUrlFormats[i].format;
						dpi = options.pageUrlFormats[i].dpi;
					}
				}

				if (urlFormat != null) {
					return urlFormat.replace(/\{PAGE\}/, pageIndex + 1)
				} else {
					return null;
				}

			},
			ensureVisiblePagesAreLoaded = function (loadImages) {
				if (initialized) {
					var top = container.scrollTop(),
						bottom = top + container.height();

					var index = -1;
					for (var i = 0; i < pages.length; i++) {
						if (top <= pages[i].top + pages[i].height && bottom >= pages[i].top) {
							index = i;
							break;
						}
					}

					if (index >= 0) {
						var visiblePages = {};

						currentPage.index = index;
						currentPage.offsetTop = Math.max(0, (top - pages[index].top) / pages[index].scale);
						currentPage.offsetLeft = Math.max(0, (container.scrollLeft() - pages[index].left) / pages[index].scale);
						currentPage.centerOffset = false;
						ensurePageIsLoaded(index, loadImages);
						visiblePages[index] = true;
						for (var i = index + 1; i < pages.length && top <= pages[i].top + pages[i].height && bottom >= pages[i].top; i++) {
							ensurePageIsLoaded(i, loadImages);
							visiblePages[i] = true;
						}

						var allPages = pagesContainer.children('.doc-preview-page');
						allPages.each(function () {
							var e = $(this);
							var i = parseInt(e.data('pageindex'));
							if (!isNaN(i) && visiblePages[i] !== true && (currentHighlight == null || currentHighlight.pageIndex != i)) {
								global.clearTimeout(e.data('imageLoadTimeout'));
								e.remove();
								pages[i].elm = null;
							}
						});
					}
				}
			},
			ensurePageIsLoaded = function (index, loadImages) {
				if (initialized) {
					var page = pages[index];
					if (page) {
						if (page.elm === null) {
							page.elm = $('<div class=\"doc-preview-page\"></div>')
								.attr('data-pageindex', index)
								.css({
									position: 'absolute',
									top: page.top + 'px',
									width: page.width + 'px',
									height: page.height + 'px',
									left: page.left + 'px',
									'-webkit-transform': 'translate3d(0,0,0)'
								});

							pagesContainer.append(page.elm);
						}

						if (loadImages) {
							var url = page.url;
							var enableTransition = false;
							if (url == null) {
								page.url = url = getPageImageUrl(index, page.scale);
								enableTransition = true;
							}

							if (page.elm.children('img').length == 0) {
								// load the image
								var newSource = new Image();
								newSource.onload = function () {
									if (page.elm) {
										page.elm.append(
											$('<img />')
											.attr('src', page.url)
											.css({
												'width': page.width + 'px',
												'height': page.height + 'px',
												'-webkit-transform': 'translate3d(0,0,0)',
												'position': 'absolute',
												'top': '0px',
												'left': '0px',
												'opacity': '0'
											})
											.animate({
												'opacity': '1'
											}, animationOptions)
										);
									}
								};
								newSource.src = page.url;
							} else if (enableTransition && page.elm.children('img').attr('src').indexOf(page.url) < 0) {
								// transition to alternate image
								var newSource = new Image();
								newSource.onload = function () {
									if (page.elm) {
										var oldImage = page.elm.children('img');
										oldImage
											.css({
												'z-index': '2'
											})
											.animate({
												'opacity': '0'
											}, $.extend({}, animationOptions, {
												complete: function () {
													oldImage.remove();
												}
											}));
										page.elm.append(
											$('<img />')
											.attr('src', page.url)
											.css({
												'width': page.width + 'px',
												'height': page.height + 'px',
												'-webkit-transform': 'translate3d(0,0,0)',
												'position': 'absolute',
												'top': '0px',
												'left': '0px',
												'opacity': '0'
											})
											.animate({
												'opacity': '1'
											}, animationOptions)
										);
									}
								};
								newSource.src = page.url;
							}
						}
					}
				}
			}

		var scrollTimeout = null,
			pageIndexHideTimeout = null,
			isPageIndexDisplayed = -1,
			lastUpdateTime = 0;

		options.parent.css({
			position: 'relative'
		}).append(currentPageElm);

		var updatePageIndex = function () {
			isPageIndexDisplayed = 1
			global.clearTimeout(pageIndexHideTimeout);

			currentPageElm.text(options.currentPageText.replace(/\{currentpage\}/g, currentPage.index + 1).replace(/\{totalpages\}/g, pages.length));
			currentPageElm.finish().fadeIn(animationOptions);
			isPageIndexDisplayed = 0;

			pageIndexHideTimeout = global.setTimeout(function () {
				if (isPageIndexDisplayed == 0) {
					currentPageElm.finish().fadeOut(animationOptions);
					isPageIndexDisplayed = -1;
				}
			}, 1000);
		}

		function throttle(handler) {
			if (!window.requestAnimationFrame)
				return handler;
			var timeout;
			return function () {
				if (timeout)
					window.cancelAnimationFrame(timeout);
				timeout = window.requestAnimationFrame(handler);
			};
		}

		var container = $('<div class="doc-preview-container"></div>')
			.css({
				overflow: 'auto',
				'box-sizing': 'border-box',
				position: 'relative',
				'-webkit-overflow-scrolling': 'touch',
				'-webkit-transform': 'translate3d(0,0,0)'
			})
			.on('scroll', throttle(function (e) {
				var time = new Date().getTime();
				if (time - lastUpdateTime > 50 && !isAdjusting) {
					lastUpdateTime = time;
					ensureVisiblePagesAreLoaded(false);

					var top = container.scrollTop();
					if (initialized) {
						updatePageIndex();
					}

					clearTimeout(scrollTimeout);
					scrollTimeout = global.setTimeout(function () {
						if (initialized) {
							ensureVisiblePagesAreLoaded(true);
							updatePageIndex();
						}
					}, 150);
				}
			}))
			.on('doubletap', function (e) {
				if (e.pointers && e.pointers.length > 0) {
					var left = e.pointers[0].pageX,
						top = e.pointers[0].pageY,
						offset = container.offset();

					if (scrollbarWidth > 0 && (top >= (container.height() + offset.top - scrollbarWidth) || left >= (container.width() + offset.left - scrollbarWidth))) {
						return;
					}

					top = top - offset.top + container.scrollTop();
					left = left - offset.left + container.scrollLeft();

					for (var i = 0; i < pages.length; i++) {
						if (top <= pages[i].top + pages[i].height && top >= pages[i].top) {
							currentPage.index = i;
							currentPage.offsetTop = Math.max(0, ((top - pages[i].top) / pages[i].scale));
							currentPage.offsetLeft = Math.max(0, ((left - pages[i].left) / pages[i].scale));
							currentPage.centerOffset = true;

							break;
						}
					}
				}

				if (zoom != 1.0) {
					zoom = 1.0;
					updatePages();
				} else {
					zoom = 2.0;
					updatePages();
				}

				return false;
			})
			.on('panstart panend pan swipe', function (e) {
				if ((e.direction == 'left' || e.direction == 'right') && container.width() < container.get(0).scrollWidth) {
					e.stopPropagation();
				} else if ((e.direction == 'up' || e.direction == 'down') && container.height() < container.get(0).scrollHeight) {
					e.stopPropagation();
				}
			});

		options.parent.append(container);

		if (options.pageData.length > 0) {
			currentPage.index = 0;
			currentPage.offsetLeft = 0;
			currentPage.offsetTop = 0;
			currentPage.centerOffset = false;
		}

		resize(options.width, options.height);

		return {
			showPage: showPage,
			highlight: highlight,
			clearHighlight: clearHighlight,
			resize: resize,
			changeFit: changeFit,
			getCurrentPage: function () {
				return currentPage.index;
			},
			getPageCount: function () {
				return options.pageData.length;
			}
		};
	};

	var handleWindowResize = function (context) {
			var windowHeight = $(global).height() * .8;
			if (windowHeight < context.settings.height) {
				context.internal.state.css({
					'max-height': windowHeight + 'px'
				});
			} else {
				context.internal.state.css({
					'max-height': '100%'
				});
			}
		},
		handlePostResize = function (context) {
			if (context.internal.initialized) {
				var newWidth = context.internal.container.width(),
					newHeight = context.internal.container.height();

				if (newWidth != context.internal.lastWidth || newHeight != context.internal.lastHeight) {
					context.internal.lastWidth = newWidth;
					context.internal.lastHeight = newHeight;

					var height = newHeight - context.internal.toolbar.outerHeight();

					if (context.internal.initialized) {
						context.internal.pageRenderer.resize(newWidth, height);

						if (newWidth <= 480) {
							$('.fit-width, .fit-height, .fit-page', context.internal.container).hide();
							setFit(context, 'width');
						} else {
							$('.fit-width, .fit-height, .fit-page', context.internal.container).show();
						}
					}
				}
			}
		},
		setFit = function (context, fit) {
			$('.doc-preview-toolbar-item.fit-width, .doc-preview-toolbar-item.fit-height, .doc-preview-toolbar-item.fit-page', context.internal.toolbar).removeClass('selected');
			context.settings.fit = fit;
			$('.doc-preview-toolbar-item.fit-' + context.settings.fit, context.internal.toolbar).addClass('selected');
			if (context.internal.initialized) {
				context.internal.pageRenderer.changeFit(context.settings.fit);
			}
		},
		findNextInPage = function (context, keyword, pageIndex, isLooping) {
			if (!context.settings.keywordUrlFormat) {
				return;
			}
			if (!keyword || keyword.length <= 0) {
				context.internal.pageRenderer.clearHighlight();
				return;
			}

			var findNextInPopulatedPage = function () {
				if (keyword == context.internal.findContext.keyword) {
					var matchIndex = context.internal.findContext.matchIndex;
					if (context.internal.findContext.pageIndex != pageIndex || isLooping) {
						matchIndex = -1;
					}

					var pageKeywords = context.internal.keywordData[pageIndex];

					var found = false;
					for (var i = matchIndex + 1; i < pageKeywords.length && !found; i++) {
						if (pageKeywords[i][0].indexOf(keyword) >= 0) {
							context.internal.findContext.matchIndex = i;
							context.internal.findContext.pageIndex = pageIndex;
							found = true;
						}
					}

					if (!found) {
						if (isLooping && context.internal.findContext.pageIndex == pageIndex) {
							context.internal.pageRenderer.clearHighlight();
						} else if (pageIndex + 1 < context.internal.pageRenderer.getPageCount()) {
							findNextInPage(context, keyword, pageIndex + 1, isLooping);
						} else {
							findNextInPage(context, keyword, 0, true);
						}
					} else if (context.internal.findContext.matchIndex >= 0) {
						var m = pageKeywords[context.internal.findContext.matchIndex];
						context.internal.pageRenderer.highlight(pageIndex, m[1], m[2], m[3], m[4]);
					}
				}
			}

			if (context.internal.keywordData[pageIndex] === undefined) {
				if (context.internal.keywordData.size > context.settings.keywordCachePageSize) {
					context.internal.keywordData = {
						size: 0
					};
				}


				$.telligent.evolution.get({
					url: context.settings.keywordUrlFormat.replace(/\{PAGE\}/, pageIndex + 1),
					dataType: 'json',
					success: function (data) {
						if (data && data.text) {
							context.internal.keywordData[pageIndex] = data.text;
							context.internal.keywordData.size++;
							findNextInPopulatedPage();
						} else {
							context.internal.keywordData[pageIndex] = [];
							findNextInPopulatedPage();
						}
					},
					error: function () {
						context.internal.keywordData[pageIndex] = [];
						findNextInPopulatedPage();
					}
				});
			} else {
				findNextInPopulatedPage();
			}
		},
		_init = function (options) {
			return this.each(function () {
				var context = {
					settings: $.extend({}, $.fn.documentPreview.defaults, options || {}),
					internal: {
						state: $(this),
						initialized: false,
						pageRenderer: null,
						lastWidth: 0,
						lastHeight: 0,
						toolbar: null,
						findHandle: null,
						isFullscreen: false
					}
				};

				context.internal.state
					.data('documentPreview', context)
					.css({
						width: context.settings.width + 'px',
						height: context.settings.height + 'px'
					});

				context.internal.lastWidth = 0;
				context.internal.lastHeight = 0;

				context.internal.container = $('<div></div>').css({
					width: '100%',
					height: '100%',
					overflow: 'hidden'
				});

				context.internal.state.css({
					'max-width': '100%',
					'max-height': '100%',
					'overflow': 'hidden'
				});

				global.setInterval(function () {
					handlePostResize(context);
				}, 499);

				handleWindowResize(context);
				$(global).on('resized', function () {
					handleWindowResize(context);
				});

				context.internal.state.append(context.internal.container);

				context.internal.toolbar = $('<div class="doc-preview-toolbar"></div>')
					.append($('<a class="doc-preview-toolbar-item fit-width ui-tip" href="#"></a>').html(context.settings.text.fitwidth).attr('title', context.settings.text.fitwidth).on('click', function () {
						context.internal.state.documentPreview('fit', 'width');
						return false;
					}))
					.append($('<a class="doc-preview-toolbar-item fit-height ui-tip" href="#"></a>').html(context.settings.text.fitheight).attr('title', context.settings.text.fitheight).on('click', function () {
						context.internal.state.documentPreview('fit', 'height');
						return false;
					}))
					.append($('<a class="doc-preview-toolbar-item fit-page ui-tip" href="#"></a>').html(context.settings.text.fitpage).attr('title', context.settings.text.fitpage).on('click', function () {
						context.internal.state.documentPreview('fit', 'page');
						return false;
					}))
					.append('<span class="doc-preview-toolbar-seperator fullscreen-separator"></span>')
					.append($('<a class="doc-preview-toolbar-item fullscreen ui-tip" href="#"></a>').html(context.settings.text.enterfullscreen).attr('title', context.settings.text.enterfullscreen).on('click', function () {
						if (context.internal.state.documentPreview('fullscreen')) {
							context.internal.state.documentPreview('fullscreen', false);
						} else {
							context.internal.state.documentPreview('fullscreen', true);
						}
						return false;
					}))
					.append((context.settings.downloadUrl && context.settings.downloadUrl.length > 0) ? $('<a class="doc-preview-toolbar-item download-original ui-tip" href="#"></a>').html(context.settings.text.downloadoriginal).attr('title', context.settings.text.downloadoriginal).on('click', function () {
						context.internal.state.documentPreview('downloadOriginal');
						return false;
					}) : '')
					.append((context.settings.pdfUrl && context.settings.pdfUrl.length > 0) ? $('<a class="doc-preview-toolbar-item download-pdf ui-tip" href="#"></a>').html(context.settings.text.downloadpdf).attr('title', context.settings.text.downloadpdf).on('click', function () {
						context.internal.state.documentPreview('downloadPdf');
						return false;
					}) : '')
					.append($('<span class="doc-preview-toolbar-item find"><input type="text" /></span>').on('keyup', 'input', function (e) {
						global.clearTimeout(context.internal.findHandle);
						var val = $(this).val();
						if (context.internal.findContext && context.internal.findContext.keyword == val) {
							if (e.which == 13) {
								context.internal.state.documentPreview('findNext', val);
							}
						} else {
							context.internal.findHandle = global.setTimeout(function () {
								context.internal.state.documentPreview('findNext', val);
							}, 249);
						}
					}));

				$('input', context.internal.toolbar).attr('placeholder', context.settings.text.find);

				$('.doc-preview-toolbar-item.fit-' + context.settings.fit, context.internal.toolbar).addClass('selected');

				var elm = context.internal.container.get(0);
				if (!elm.requestFullscreen && !elm.msRequestFullscreen && !elm.mozRequestFullScreen && !elm.webkitRequestFullScreen) {
					$('.doc-preview-toolbar-item.fullscreen, .doc-preview-toolbar-seperator.fullscreen-separator', context.internal.toolbar).hide();
				}

				if (!context.settings.keywordUrlFormat || /(Android|iPhone|iPad|iPod)/.test(navigator.userAgent)) {
					$('.doc-preview-toolbar-item.find', context.internal.toolbar).hide();
				}

				context.internal.container
					.attr('tabindex', '0')
					.css({
						outline: 'none !important'
					})
					.on('keydown', function (e) {
						if ((e.which == 78 && !$(e.target).is('input')) || e.which == 34) {
							context.internal.state.documentPreview('pageIndex', '+1');
							e.stopPropagation();
							e.preventDefault();
							return false;
						} else if ((e.which == 80 && !$(e.target).is('input')) || e.which == 33) {
							context.internal.state.documentPreview('pageIndex', '-1');
							e.stopPropagation();
							e.preventDefault();
							return false;
						}
					});

				context.internal.container.append(context.internal.toolbar);

				$.telligent.evolution.get({
					url: context.settings.jsonUrl,
					dataType: 'json',
					success: function (data) {
						var height = context.settings.height - context.internal.toolbar.outerHeight();

						context.internal.pageRenderer = new PageRenderer({
							parent: context.internal.container,
							pageData: data.pages,
							pageUrlFormats: context.settings.imageUrlFormats,
							width: context.settings.width,
							height: height,
							fit: context.settings.fit,
							currentPageText: context.settings.text.page
						});
						context.internal.keywordData = {
							size: 0
						};
						context.internal.findContext = {
							keyword: null,
							matchIndex: -1,
							pageIndex: -1
						}
						context.internal.initialized = true;
						handlePostResize(context);
					}
				});
			});
		},
		api = {
			fit: function (fit) {
				if (fit === undefined) {
					var context = this.data('documentPreview');
					if (context)
						return context.settings.fit;
					else
						return null;
				} else {
					return this.each(function () {
						var context = $(this).data('documentPreview');
						if (context) {
							setFit(context, fit);
						}
					});
				}
			},
			resize: function (width, height) {
				return this.each(function () {
					var context = $(this).data('documentPreview');
					if (context) {
						context.settings.width = width;
						context.settings.height = height;
						context.internal.state.css({
							width: width + 'px',
							height: height + 'px'
						});
						handleWindowResize(context);
						handlePostResize(context);
					}
				});
			},
			fullscreen: function (setFullscreen) {
				if (setFullscreen == undefined) {
					var context = $(this).data('documentPreview');
					return context != null && context.internal.isFullscreen;
				} else {
					return this.each(function () {
						var context = $(this).data('documentPreview');
						if (context && context.internal.initialized) {

							if (setFullscreen) {
								if (context.internal.isFullscreen) {
									return;
								}

								var elm = context.internal.container.get(0);
								if (elm.requestFullscreen) {
									elm.requestFullscreen();
								} else if (elm.msRequestFullscreen) {
									elm.msRequestFullscreen();
								} else if (elm.mozRequestFullScreen) {
									elm.mozRequestFullScreen();
								} else if (elm.webkitRequestFullScreen) {
									elm.webkitRequestFullScreen();
								} else {
									context.internal.isFullscreen = false;
									return;
								}

								context.internal.isFullscreen = true;
								$('a.fullscreen', context.internal.toolbar).addClass('selected').html(context.settings.text.exitfullscreen).attr('title', context.settings.text.exitfullscreen);

								var exitCheckHandle = global.setInterval(function () {
									var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
									if (!fullscreenElement) {
										handlePostResize(context);
										global.clearInterval(exitCheckHandle);
										context.internal.isFullscreen = false;
										$('.fullscreen', context.internal.toolbar).removeClass('selected').html(context.settings.text.enterfullscreen).attr('title', context.settings.text.enterfullscreen);
									} else {
										handlePostResize(context);
									}
								}, 249);

								$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function () {
									var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
									if (!fullscreenElement) {
										handlePostResize(context);
										global.clearInterval(exitCheckHandle);
										context.internal.isFullscreen = false;
										$('.fullscreen', context.internal.toolbar).removeClass('selected').html(context.settings.text.enterfullscreen).attr('title', context.settings.text.enterfullscreen);
									}
								});
							} else {
								if (!context.internal.isFullscreen) {
									return;
								}
								var exitFullscreen = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen;
								if (exitFullscreen) {
									exitFullscreen.call(document, []);
									handlePostResize(context);
									global.clearInterval(exitCheckHandle);
									context.internal.isFullscreen = false;
									$('.fullscreen', context.internal.toolbar).removeClass('selected').html(context.settings.text.enterfullscreen).attr('title', context.settings.text.enterfullscreen);
								}
							}
						}
					});
				}
			},
			findNext: function (inkeyword) {
				return this.each(function () {
					var context = $(this).data('documentPreview');
					if (context && context.internal.initialized) {
						keyword = (inkeyword || '').toLowerCase();
						if (context.internal.findContext.keyword != keyword) {
							context.internal.findContext.keyword = keyword;
							context.internal.findContext.matchIndex = -1;
							context.internal.findContext.pageIndex = context.internal.pageRenderer.getCurrentPage();
						}
						findNextInPage(context, keyword, context.internal.findContext.pageIndex, false);
					}
				});
			},
			clearFind: function () {
				return this.each(function () {
					var context = $(this).data('documentPreview');
					if (context && context.internal.initialized) {
						context.internal.findContext.keyword = '',
							context.internal.findContext.matchIndex = -1;
						$('input', context.internal.toolbar).val('');
						context.internal.pageRenderer.clearHighlight();
					}
				});
			},
			pageIndex: function (val) {
				if (val == undefined) {
					var context = $(this).data('documentPreview');
					if (context != null && context.internal.initialized) {
						return context.internal.pageRenderer.getCurrentPage();
					} else {
						return -1;
					}
				} else {
					return this.each(function () {
						var context = $(this).data('documentPreview');
						if (context && context.internal.initialized) {
							var dir = (val + '').substr(0, 1);
							if (dir == '+') {
								var index = parseInt((val + '').substr(1), 10);
								if (!isNaN(index)) {
									context.internal.pageRenderer.showPage(context.internal.pageRenderer.getCurrentPage() + index);
								}
							} else if (dir == '-') {
								var index = parseInt((val + '').substr(1), 10);
								if (!isNaN(index)) {
									context.internal.pageRenderer.showPage(context.internal.pageRenderer.getCurrentPage() - index);
								}
							} else {
								var index = parseInt(val, 10);
								if (!isNaN(index)) {
									context.internal.pageRenderer.showPage(index);
								}
							}
						}
					});
				}
			},
			pageCount: function () {
				var context = $(this).data('documentPreview');
				if (context != null && context.internal.initialized) {
					return context.internal.pageRenderer.getPageCount();
				} else {
					return 0;
				}
			},
			downloadOriginal: function () {
				return this.each(function () {
					var context = $(this).data('documentPreview');
					if (context && context.settings.downloadUrl) {
						global.open(context.settings.downloadUrl, '_system');
					}
				});
			},
			downloadPdf: function () {
				return this.each(function () {
					var context = $(this).data('documentPreview');
					if (context && context.settings.pdfUrl) {
						global.open(context.settings.pdfUrl, '_system');
					}
				});
			}
		};


	$.fn.documentPreview = function (method) {
		if (method in api)
			return api[method].apply(this, Array.prototype.slice.call(arguments, 1));
		else if (typeof method === 'object' || !method)
			return _init.apply(this, arguments);
		else
			$.error('Method ' + method + ' does not exist on jQuery.fn.documentPreview');
	};

	$.extend($.fn.documentPreview, {
		defaults: {
			jsonUrl: null,
			imageUrlFormats: [],
			keywordUrlFormat: null,
			pdfUrl: null,
			width: 400,
			height: 300,
			fit: 'width',
			keywordCachePageSize: 5,
			text: {
				fitwidth: 'Fit to width',
				fitheight: 'Fit to height',
				fitpage: 'Fit entire page',
				enterfullscreen: 'Fullscreen',
				exitfullscreen: 'Exit fullscreen',
				downloadoriginal: 'Download original',
				downloadpdf: 'Download as a PDF',
				find: 'Search within this document...',
				page: '{currentpage} of {totalpages}'
			}
		}
	});

})(jQuery, window);

function DocumentViewer(context) {

	var _getViewer = function (context) {

			_toggleViewerDisplay(true, context);

			jQuery('#' + context.viewerContainer).documentPreview({
				jsonUrl: context.viewerParameters.jsonUrl,
				imageUrlFormats: context.viewerParameters.imageUrlFormats,
				pdfUrl: context.viewerParameters.pdfUrl,
				width: context.viewerParameters.width,
				height: context.viewerParameters.height,
				keywordUrlFormat: context.viewerParameters.keywordUrlFormat,
				text: context.viewerParameters.text,
				downloadUrl: context.downloadUrl
			});

		},
		_checkStatus = function (context) {

			var index = context.handlerUrl.indexOf("?");
			var baseUrl = "";
			if (index < 0) {
				baseUrl = context.handlerUrl + "?";
			} else {
				baseUrl = context.handlerUrl + "&";
			}

			var url = baseUrl + "fs=" + window.encodeURIComponent(context.fileStore) + "&p=" + window.encodeURIComponent(context.path) + "&f=" + window.encodeURIComponent(context.fileName);
			_get(url, function (data) {
				var result = null;
				if (data && data.length > 0) {
					try {
						eval("result = " + data)
					} catch (e) {}
					if (result != null && result.state == 1) {
						context.viewerParameters.pdfUrl = result.PDFUrl;
						context.viewerParameters.jsonUrl = result.JSONUrl;
						context.viewerParameters.imageUrlFormats = result.IMGDATA;
						context.viewerParameters.keywordUrlFormat = result.TXTUrl;
						_toggleMessageDisplay(false, context);
						_getViewer(context);
					} else if (result != null && result.state == 0) {
						_startTimer(context);
					} else {
						_toggleMessageDisplay(false, context);
						_toggleErrorDisplay(true, context);
					}
				}
			});

		},
		_startTimer = function (context) {
			window.setTimeout(function () {
				_checkStatus(context);
			}, 60000);
		},
		_toggleViewerDisplay = function (visible, context) {
			var container = document.getElementById(context.containerId);
			if (container) {
				if (visible)
					container.style.display = 'block';
				else
					container.style.display = 'none';
			}
		},
		_get = function (url, callback) {
			var x = _getXmlHttpRequest();
			x.open("GET", url, false);
			x.onreadystatechange = function () {
				if (x.readyState == 4) {
					callback(x.responseText)
				}
			};
			x.send();
			delete x;
		},
		_getXmlHttpRequest = function () {
			var x = null;
			if (typeof XMLHttpRequest != "undefined") {
				x = new XMLHttpRequest();
			} else {
				try {
					x = new ActiveXObject("Msxml2.XMLHTTP");
				} catch (e) {
					try {
						x = new ActiveXObject("Microsoft.XMLHTTP");
					} catch (e) {}
				}
			}

			return x;
		},

		_toggleMessageDisplay = function (visible, context) {
			var container = document.getElementById(context.messageContainerId);
			if (container) {
				var messageTemplate = $.telligent.evolution.template.compile('<div><%= processLabel %><% if(downloadUrl && downloadUrl.length > 0) { %><div class="download" style="margin-top:1em;font-weight:normal;font-size:8.5pt;"><a href="<%: downloadUrl %>" download><%= downloadLabel %></a></div><% } %></div>')
				var message = $(messageTemplate({
					processLabel: context.message,
					downloadUrl: context.downloadUrl,
					downloadLabel: context.downloadLabel
				}));
				$(container.firstChild).html(message);
				if (visible)
					container.style.display = 'flex';
				else
					container.style.display = 'none';
			}
		};

	_toggleErrorDisplay = function (visible, context) {
		var container = document.getElementById(context.messageContainerId);
		if (container) {
			var messageTemplate = $.telligent.evolution.template.compile('<div><%= processLabel %><% if(downloadUrl && downloadUrl.length > 0) { %><div class="download" style="margin-top:1em;font-weight:normal;font-size:8.5pt;"><a href="<%: downloadUrl %>" download><%= downloadLabel %></a></div><% } %></div>')
			var message = $(messageTemplate({
				processLabel: context.errorMessage,
				downloadUrl: context.downloadUrl,
				downloadLabel: context.downloadLabel
			}));
			$(container.firstChild).html(message);
			if (visible)
				container.style.display = 'flex';
			else
				container.style.display = 'none';
		}
	};



	if (context.viewerParameters.jsonUrl &&
		context.viewerParameters.jsonUrl != '' &&
		context.viewerParameters.imageUrlFormats &&
		context.viewerParameters.imageUrlFormats.length > 0 &&
		context.viewerParameters.keywordUrlFormat &&
		context.viewerParameters.keywordUrlFormat != '') {
		_getViewer(context);
	} else {

		_toggleViewerDisplay(false, context);
		_toggleMessageDisplay(true, context);
		_startTimer(context);
	}
}