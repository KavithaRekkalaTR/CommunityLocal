define('UiOverrides', function($, global, undef) {

	$.extend($.fn.glowPopUpPanel.defaults, {
		animate: function(data) {
			return $.Deferred(function(d) {
				if (data.action == 'initialize') {
					data.panel.css({
						overflow: 'hidden',
						transform: 'translate3d(0px 0px, 0px)'
					});
					d.resolve();
				} else if (data.action == 'open') {
					var initialX = 0, initialY = 0;

					if (data.position.indexOf('left') === 0) {
						initialX = data.openerWidth;
					} else if (data.position.indexOf('right') === 0) {
						initialX = -data.openerWidth;
					}

					if (data.position.indexOf('down') === 0) {
						initialY = -data.openerHeight;
					} else if (data.position.indexOf('up') === 0) {
						initialY = data.openerHeight;
					}

					data.panel
						.evolutionTransform({
							x: initialX,
							y: initialY,
							opacity: 0
						}, {
							duration: 0
						})
						.evolutionTransform({
							x: 0,
							y: 0,
							opacity: 1
						}, {
							complete: function() {
								d.resolve();
							},
							duration: 150,
							easing: 'ease-out'
						});

				} else if (data.action == 'resize') {
					data.panel.css({
						width: data.orginalWidth + 'px',
						height: data.originalHeight + 'px'
					}).evolutionTransform({
						width: data.width,
						height: data.height
					}, {
						complete: function() {
							d.resolve();
						},
						duration: 150
					});
				} else if (data.action == 'close') {
					var targetX = 0, targetY = 0;

					if (data.position.indexOf('left') === 0) {
						targetX = data.openerWidth;
					} else if (data.position.indexOf('right') === 0) {
						targetX = -data.openerWidth;
					}

					if (data.position.indexOf('down') === 0) {
						targetY = -data.openerHeight;
					} else if (data.position.indexOf('up') === 0) {
						targetY = data.openerHeight;
					}

					data.panel.evolutionTransform({
						x: targetX,
						y: targetY,
						opacity: 0
					}, {
						complete: function() {
							d.resolve();
						},
						duration: 150,
						easing: 'ease-in'
					});
				} else {
				  d.resolve();
				}
		  }).promise();
		}
	});

	return {};

}, jQuery, window);
