(function($, global) {
	var frames = [], context = { frameResizeHandle: null };

 	function resizeFrame() {
		global.clearTimeout(context.frameResizeHandle);
		if (frames.length > 0) {
			var currentFrame = frames[frames.length - 1];
			if (currentFrame && currentFrame.container && currentFrame.frame && currentFrame.frame.get(0) && currentFrame.frame.get(0).contentWindow) {
				try {
					var height = currentFrame.container.height();
					if (height == 0) {
						currentFrame.container = currentFrame.frame.get(0).contentWindow.$('html');
						currentFrame.container.height();
					}
					height = Math.max(height, $('.administration-panel-wrapper:last-child .administration-panel-contents').height())
					if (height > 0) {
						if (currentFrame.frame.css('visibility') == 'hidden') {
							$.telligent.evolution.administration.loading(false);
							currentFrame.frame.css('visibility', 'visible');
						}
						if (currentFrame.frame.height() != height) {
							currentFrame.frame.height(height);
						}
					}
				} catch (e) {
				}

				if (frames.length > 1 && currentFrame.title === null) {
					try {
						var title = currentFrame.frame.get(0).contentWindow.document.title;
						$('.administration-panel-wrapper:last-child .administration-panel-heading-meta .name').html(title);
						$.telligent.evolution.administration.header();
						currentFrame.title = title;
					} catch (e) {
					}
				}

				context.frameResizeHandle = global.setTimeout(function() {
					resizeFrame();
				}, 250);
			}
		}
	}

  function showLoading() {
		if (frames.length > 0) {
			if (frames[frames.length - 1] && frames[frames.length - 1].frame) {
				frames[frames.length - 1].frame.css('visibility', 'hidden');
			}
			$.telligent.evolution.administration.loading(true);
		}
  }

	function detectHeaderButtons() {
		if (frames.length > 0) {
			var currentFrame = frames[frames.length - 1];
			if (currentFrame && currentFrame.frame) {
				var cj = currentFrame.frame.get(0).contentWindow.$;
				var hasButtons = false;
				var buttons = $('<span class="field-item-input"></span>');

				try {
					cj('.PanelSaveButton a, .PanelSaveButton input[type="submit"], .PanelSaveButton input[type="button"]').each(function() {
						var button = cj(this);
						buttons.append(
							$('<a href="#"></a>')
								.html(button.html() || button.attr('value'))
								.addClass('button')
								.on('click', function() {
									if (document.createEvent) {
											var e = document.createEvent('MouseEvents');
											e.initMouseEvent(
												'click',
												true,
												false,
												window,
												0,
                    		0,
                    		0,
                    		0,
                    		0,
	                    	false,
                    		false,
		                    false,
		                    false,
                    		0,
		                    null
											);

											button.get(0).dispatchEvent(e);
									} else {
										var e = new MouseEvent("click", {
											"view": window,
											"bubbles": true,
											"cancelable": false
										});

										button.get(0).dispatchEvent(e);
									}

									return false;
							})
						);
						hasButtons = true;
						button.hide();
					});
				} catch (e) {
					hasButtons = false;
				}

				if (hasButtons) {
					cj('.PanelSaveButton').hide();
					$.telligent.evolution.administration.header($('<fieldset></fieldset>')
						.append(
							$('<ul class="field-list"></ul>')
								.append(
									$('<li class="field-item"></li>')
										.append(buttons)
								)
						)
					);
				} else {
					$.telligent.evolution.administration.header('');
				}
			}
		}
	}

	function applyParametersToUrl(url) {
		return $.telligent.evolution.url.modify({
				url: url,
				query: $.extend({}, $.telligent.evolution.url.parseQuery(window.location + ''), $.telligent.evolution.url.hashData()),
				hash: ''
		});
	}

	function isSimilarUrl(url1, url2) {
		return getUrlPath(url1) == getUrlPath(url2);
	}

	function getUrlPath(url) {
		var i = url.indexOf('#');
		if (i >= 0)
			url = url.substr(0, i);

		i = url.indexOf('?');
		if (i >= 0)
			url = url.substr(0, i);

		return url.toLowerCase();
	}

	function openInFrame(url, title, opener, onClose, isModal) {
		if (frames.length == 0) {
			url = applyParametersToUrl(url);
		}

		var frame = {
			frame: $('<iframe style="width:100%; height: 100%; border-width: 0; visibility: hidden;" scrolling="no" allowfullscreen="true"></iframe>').attr('src', url),
			originalUrl: url,
			title: title,
			opener: opener,
			onClose: onClose,
			isModal: isModal || false,
			loaded: false,
			firstLoad: true
		};

		if (frames.length == 0) {
			frames.push(frame);
			frames[frames.length - 1].loaded = false;
			frames[frames.length - 1].loadCheckHandle = global.setTimeout(function() {
				loadCheck(frames.length - 1);
			}, 250);
			$.telligent.evolution.administration.panelWrapper().html([
				frame.frame
			]);
			showLoading();
		} else {
			frames.push(frame);
			frames[frames.length - 1].loaded = false;
			frames[frames.length - 1].loadCheckHandle = global.setTimeout(function() {
				loadCheck(frames.length - 1);
			}, 250);
			$.telligent.evolution.administration.open({
				name: title || '&nbsp;',
				content: '',
				cssClass: 'legacy-control-panel',
				hidden: function(d) {
					if (d.direction == 'backward') {
						var oldFrame = frames.pop();
						if (oldFrame.onClose) {
							oldFrame.onClose();
						}
						if (frames.length > 0 && !oldFrame.isModal) {
							showLoading();
							frames[frames.length - 1].frame.attr('src', frames[frames.length - 1].originalUrl);
						} else {
							global.setTimeout(function() {
								detectHeaderButtons();
							}, 9);
						}
					}
				},
				loaded: function() {
					if ($.telligent.evolution.administration.panelWrapper().children().length == 0) {
						$.telligent.evolution.administration.panelWrapper().html([
							frame.frame
						]);
						showLoading();
					}
				}
			});
		}
	}

	function loadCheck(frameIndex, wasReady) {
		var frame = frames[frameIndex];
		if (!frame || frameIndex != frames.length - 1) {
			return;
		}

		global.clearTimeout(frame.loadCheckHandle);
		var reschedule = true;
		var isReady = false;
		try {
    	var iframe = frame.frame.get(0);
			if (!iframe.contentWindow) {
				reschedule = false;
				$.telligent.evolution.administration.loading(false);
			} else {
				var iframeDoc = iframe.contentWindow.document;
				if (iframeDoc.readyState == 'complete' && (iframe.contentWindow.location + '').indexOf('http') >= 0) { // check URL is valid?
					reschedule = false;
					isReady = true;
					if (!frame.loaded) {
						if (wasReady) {
							global.location.href = iframe.contentWindow.location.href + '';
						} else {
							reschedule = true;
						}
					}
	    	}
			}
		}
		catch (e)
		{
			reschedule = false;
		}

		if (reschedule) {
			frame.loadCheckHandle = global.setTimeout(function() {
				loadCheck(frameIndex, isReady);
			}, 750);
		}
	}

	function isValid() {
		if (frames.length > 0) {
			var currentFrame = frames[frames.length - 1];
			if (currentFrame && currentFrame.container && currentFrame.frame && currentFrame.frame.get(0) && currentFrame.frame.get(0).contentWindow) {
				return true;
			}
		}

		return false;
	}

	var api = {
		register: function(options) {
		    if (options.reset) {
		        frames = [];
		    }
		    
			if (frames.length == 0) {
				openInFrame(options.url);
			} else if (frames[frames.length - 1].frame && frames[frames.length - 1].frame.get(0).contentWindow == options.window) {
				frames[frames.length - 1].loaded = true;
				global.clearTimeout(frames[frames.length - 1].loadCheckHandle);
				if (isSimilarUrl(frames[frames.length - 1].originalUrl, frames[frames.length - 1].frame.get(0).contentWindow.location + '')) {
					frames[frames.length - 1] = $.extend({}, frames[frames.length - 1], options, { originalUrl: frames[frames.length - 1].frame.get(0).contentWindow.location + '' });
					detectHeaderButtons();
					if (frames[frames.length - 1].firstLoad) {
						frames[frames.length - 1].firstLoad = false;
						var w = frames[frames.length - 1].frame.get(0).contentWindow;
						if (w && w.$ && w.$.telligent && w.$.telligent.evolution && w.$.telligent.evolution.messaging) {
							w.$.telligent.evolution.messaging.publish('legacycontrolpanel.loaded', {});
						}
					}
				} else {
					// try to find an old panel that is similar
					var subUrl = frames[frames.length - 1].frame.get(0).contentWindow.location + '';
					var foundMatch = false;

					for (var i = frames.length - 1; !foundMatch && i >= 0; i--) {
						if (isSimilarUrl(frames[i].originalUrl, subUrl)) {
							foundMatch = true;
							frames[i].originalUrl = subUrl;
							var toClose = (frames.length - 1) - i;

							global.setTimeout(function() {
								for (var i = 0; i < toClose; i++) {
									global.$.telligent.evolution.administration.close();
								}
							}, 500);
						}
					}

					if (!foundMatch) {
						// load a new sub-panel
						title = frames[frames.length - 1].frame.get(0).contentWindow.$('title').html();
						openInFrame(subUrl, title);
					}
				}
				resizeFrame();
			}
		},
    unload: function(options) {
			if (frames.length > 0 && frames[frames.length - 1].frame && frames[frames.length - 1].frame.get(0) && frames[frames.length - 1].frame.get(0).contentWindow == options.window) {
				frames[frames.length - 1].loaded = false;
				frames[frames.length - 1].loadCheckHandle = global.setTimeout(function() {
					loadCheck(frames.length - 1);
				}, 750);
      	showLoading();
			}
    },
		open: function(options) {
			// url, onclose, opener

			if (options.url.indexOf('/') == 0) {
				options.url = global.location.protocol + '//' + global.location.host + options.url;
			}

			openInFrame(options.url, null, options.opener, options.onclose, options.ismodal);
		},
		close: function(options) {
			// opener, returnValue
			var currentFrame = frames[frames.length - 1];
			if (currentFrame && (!options.opener || currentFrame.opener == options.opener)) {
				if (currentFrame.onClose) {
					currentFrame.onClose(options.returnValue);
					currentFrame.onClose = null;
				}
				global.setTimeout(function() {
					global.$.telligent.evolution.administration.close();
				}, 500);
			}
		},
		getOpener: function(w) {
			for (var i = frames.length - 1; i >= 0; i--) {
				var f = frames[i].frame;
				if (f != null) {
					f = f.get(0);
					if (f != null) {
						if (f.contentWindow == w) {
							return frames[i].opener;
						}
					}
				}
			}

			return global;
		}
  };

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.legacyAdministrationPanel = api;

	var oldModal = global.Telligent_Modal;

	global.Telligent_Modal = $.extend({}, global.Telligent_Modal, {
    GetWindowOpener: function (modalWindow, openerWindow) {
				if (isValid()) {
        	return api.getOpener(modalWindow);
				} else {
					return oldModal.GetWindowOpener(modalWindow);
				}
    },
    IsShown: function (openerWindow) {
			if (isValid()) {
        return false;
			} else {
				return oldModal.IsShown(openerWindow);
			}
    },
    Resize: function (width, height, preventAutomaticResizing, openerWindow) {
			if (!isValid()) {
				oldModal.Resize(width, height, preventAutomaticResizing, openerWindow);
			}
    },
    MoveTo: function (x, y, openerWindow) {
			if (!isValid()) {
				oldModal.MoveTo(x, y, openerWindow);
			}
    },
    Open: function (url, width, height, onCloseFunction, x, y, ignoreCloseAndAnimation, isManuallyResized, openerWindow) {
			if (isValid()) {
        api.open({
            url: url,
            onclose: onCloseFunction,
            opener: openerWindow || global,
						ismodal: true
        });
			} else {
				return oldModal.Open(url, width, height, onCloseFunction, x, y, ignoreCloseAnimation, isManuallyResized, openerWindow);
			}
    },
    Close: function (returnValue, openerWindow) {
			if (isValid()) {
        api.close({
            opener: openerWindow,
            returnValue: returnValue
        });
			} else {
				oldModal.Close(returnValue, openerWindow);
			}
    },
    Refresh: function (openerWindow) {
			if (!isValid()) {
				oldModal.Refresh(openerWindow);
			}
    }
});

})(jQuery, window);
