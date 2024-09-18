(function($, global){

	var notificationId = 'dragdrop_';

	function hideUploadProgress(options) {
		if (options.currentNotificationId) {
			$.telligent.evolution.notifications.hide(options.currentNotificationId);
		}
	}

	function showUploadProgress(options, fileName, percentage) {
		options.currentNotificationId = notificationId + fileName;
		$.telligent.evolution.notifications.show(options.text.uploadProgress.replace(/\{0\}/g, fileName).replace(/\{1\}/g, percentage || '0'), {
				type: 'success',
				id: notificationId + fileName,
				duration: 90000 /* upload is adjusted to support completing a chunk in 45 seconds, so show the message for at least twice that */
			});
	}

	function finalizeUpload(options, fileName) {
		options.currentNotificationId = notificationId + fileName;
		$.telligent.evolution.post({
			url: options.finalizeUrl,
			data: {
				FileName: fileName,
				GalleryId: options.mediaGalleryId,
				FileContextId: options.uploadContextId
			}
		})
			.then(function() {
				options.hasSuccessfulUploads = true;
				$.telligent.evolution.notifications.show(options.text.uploadComplete.replace(/\{0\}/g, fileName), {
					type: 'success',
					id: notificationId + fileName,
					duration: 5000
				});
			})
			.catch(function() {
				hideUploadProgress(options);
			})
			.always(function() {
				if (options.hasSuccessfulUploads && !options.isUploading) {
					global.clearTimeout(options.reloadTimeout);
					options.reloadTimeout = global.setTimeout(function() {
						global.location.reload(true);
					}, 2500);
				}
			})
	}

	function showShade(options, message) {
		global.clearTimeout(options.hideTimeout);
    var width = $('body').width();
		var height = $(window).height();
    if (message) {
      options.shadeMessage
        .html(message)
				.height(height)
	      .width(width)
				.show();
    } else {
        options.shadeMessage.css('display', 'none');
    }
    options.shade
      .height(height)
      .width(width)
      .show();
	}

	function hideShade(options) {
		global.clearTimeout(options.hideTimeout);
    options.hideTimeout = global.setTimeout(function () {
      options.shade.hide();
      options.shadeMessage.hide();
    }, 999);
	}

	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }
	$.telligent.evolution.widgets.mediaGalleryDragAndDrop = {
		register: function(options) {
			options.hasSuccessfulUploads = false;
			options.shadeContainer = $('<div></div>')
				.addClass('drag-drop-container')
				.css({
					position: 'fixed',
					top: '0px',
					left: '0px'
				})
				.appendTo($('body'));

			options.shade = $('<div></div>')
				.addClass('drag-drop-shade')
				.css({
					position: 'absolute',
					left: '0px',
					top: '0px'
				})
				.hide()
				.appendTo(options.shadeContainer);

			options.shadeMessage = $('<div></div>')
				.addClass('drag-drop-message')
				.css({
					position: 'absolute',
					left: '0px',
					top: '0px'
				})
				.hide()
				.appendTo(options.shadeContainer);

			$('body')
				.on('dragover.mediagallerydragdrop dragenter.mediagallerydragdrop', function () {
					showShade(options, options.text.upload);
				}).on('dragleave.mediagallerydragdrop dragend.mediagallerydragdrop drop.mediagallerydragdrop mouseout.mediagallerydragdrop', function () {
					hideShade(options);
				})
				.glowUpload({
					fileFilter: null,
					renderMode: 'dragdrop',
					uploadUrl: options.uploadUrl,
					contentTypeId: options.contentTypeId,
    				applicationTypeId: options.applicationTypeId,
    				applicationId: options.applicationId
				})
				.on('glowUploadError', function (e) {
				    if ($(e.target).is('body')) {
    					hideUploadProgress(options);
    					$.telligent.evolution.notifications.show(options.text.uploadError, {
    						type: 'error'
    					});
				    }
				})
				.on('glowUploadFileProgress', function (e, d) {
				    if ($(e.target).is('body')) {
    					options.isUploading = true;
    					showUploadProgress(options, d.name, d.percent);
				    }
				})
				.on('glowUploadComplete', function (e, f) {
				    if ($(e.target).is('body')) {
    					global.setTimeout(function() {
    						showUploadProgress(options, f.name, 100);
    						finalizeUpload(options, f.name);
    					}, 9);
				    }
				})
				.on('glowUploadsComplete', function(e) {
				    if ($(e.target).is('body')) {
					    options.isUploading = false;
				    }
				});

				options.enabled = true;

			$(document).on('customizepage', function() {
				if (options.enabled) {
					options.enabled = false;

					$('body')
						.off('.mediagallerydragdrop')
						.glowUpload('destroy');
				}
			});
		}
	};

})(jQuery, window);