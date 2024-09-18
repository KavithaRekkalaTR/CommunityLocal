/*

StudioUploader

Wraps UI-less initiation, progress, completion of uploading

var uploader = new StudioUploader(options)
	uploadContextId
	uploadUrl
	container

uploader.upload(options)
	.progress(function(data){
		// data.name
		// data.context
		// data.percent
	})
	.then(function(data){
		// data.name
		// data.context
	})
	.catch(function(){

	});

options:
	withProgress: true|false (default false)
		When true, shows a progress indicator and warning if trying to navigate away

*/
define('StudioUploader', [ 'StudioClientResources' ], function(clientResources, $, global, undef) {

	var defaults = {
		uploadContextId: '',
		uploadUrl: ''
	};
	var nameSpace = '_uploader';

	var messaging = $.telligent.evolution.messaging;
	var administration = $.telligent.evolution.administration;

	function init(context) {
		if(context.inited)
			return;
		context.inited = true;

		context.uploadContainer = $('<div></div>').hide().appendTo(context.container);
		context.uploadButtonShim = $('<span>upload</span>').appendTo(context.uploadContainer)
			.glowUpload({
				uploadUrl: context.uploadUrl
			})
	}

	var StudioUploader = function(options){
		var context = $.extend({
		}, defaults, options || {});

		init(context);

		return {
			upload: function(uploadOptions) {
				init(context);

				var progressIndicator = null;
				if (uploadOptions && uploadOptions.withProgress === true) {
					progressIndicator = $('<span></span>').evolutionProgressIndicator({
						includePercentComplete: true,
						includeLatestMessage: false,
						includeAllMessages: false,
						warnBeforeUnload: true,
						beforeUnloadMessageLabel: clientResources.uploadingLabel
					});
				}

				return $.Deferred(function(d){
					context.uploadButtonShim.off(nameSpace)
					context.uploadButtonShim.on('glowUploadBegun.' + nameSpace, function (e) {
						if (progressIndicator !== null) {
							administration.loading(true, {
								message: progressIndicator,
								width: 250,
								height: 250
							});
						}
					});
					context.uploadButtonShim.on('glowUploadError.' + nameSpace, function (e) {
						if (progressIndicator !== null) {
							administration.loading(false);
						}

						d.reject();
					})
					context.uploadButtonShim.on('glowUploadFileProgress.' + nameSpace, function (e, details) {
						if (progressIndicator !== null) {
							progressIndicator.evolutionProgressIndicator('progress', { percentComplete: details.percent / 100 });
						}

						d.notify({
							name: details.name,
							context: context.uploadContextId,
							percent: (details.percent / 100)
						});
					})
					context.uploadButtonShim.on('glowUploadComplete.' + nameSpace, function(e, file){
						if (progressIndicator !== null) {
							progressIndicator.evolutionProgressIndicator('progress', { percentComplete: 1 });
							administration.loading(false);
						}

						d.resolve({
							name: file.name,
							context: context.uploadContextId
						});
					})

					context.uploadContainer.find('input[type="file"]').get(0).click();
				}).promise();
			}
		}
	};

	return StudioUploader;

}, jQuery, window);
