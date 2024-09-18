(function($) {

	var Uploader = (function(){
		var defaults = {
			uploadContextId: '',
			uploadUrl: ''
		};
		var nameSpace = '_uploader';

		var messaging = $.telligent.evolution.messaging;

		function init(context) {
			if(context.inited)
				return;
			context.inited = true;

			context.uploadContainer = $('<div></div>').hide().appendTo(context.container);
			context.uploadButtonShim = $('<span>upload</span>').appendTo(context.uploadContainer)
				.glowUpload({
					uploadUrl: context.uploadUrl,
					contentTypeId: context.contentTypeId
				})
		}

		var Uploader = function(options){
			var context = $.extend({
			}, defaults, options || {});

			init(context);

			return {
				upload: function() {
					init(context);

					return $.Deferred(function(d){
						context.uploadButtonShim.off(nameSpace)
						context.uploadButtonShim.on('glowUploadBegun.' + nameSpace, function(e, details){
							d.notify({
								context: context.uploadContextId,
								percent: 0
							});
						});
						context.uploadButtonShim.on('glowUploadError.' + nameSpace, function(e){
							d.reject();
						})
						context.uploadButtonShim.on('glowUploadFileProgress.' + nameSpace, function(e, details){
							d.notify({
								name: details.name,
								context: context.uploadContextId,
								percent: details.percent
							});
						})
						context.uploadButtonShim.on('glowUploadComplete.' + nameSpace, function(e, file){
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

		return Uploader;
	})();

	function setCoverPhoto(context, url) {
		$(context.coverPhotoContainer).css({
			'display': 'block',
			'background-image': 'url(' + url + ')'
		});
		$(context.wrapper).addClass('with-cover-photo');
		$(context.removeCoverPhotoLink).show();
	}

	function removeCoverPhoto(context) {
		$(context.coverPhotoContainer).css({
			'display': 'none',
			'background-image': 'none'
		});
		$(context.wrapper).removeClass('with-cover-photo');
		$(context.removeCoverPhotoLink).hide();
	}

	function resize(context, imageUrl) {
		return $.telligent.evolution.get({
			url: context.resizedCoverPhotoUrl,
			data: {
				'w_url': imageUrl
			},
		}).then(function(r){
			return r.url;
		});
	}

	function upload(context, contextId, fileName) {
		return $.telligent.evolution.put({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}/coverphoto.json',
			data: {
				UserId: context.userId,
				FileUploadContext: contextId,
				FileName: fileName
			}
		})
	}

	function remove(context) {
		return $.telligent.evolution.del({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/users/{UserId}/coverphoto.json',
			data: {
				UserId: context.userId
			}
		})
	}

	var api = {
		register: function(context) {
			var uploader = new Uploader({
				uploadContextId: context.uploadContextId,
				uploadUrl: context.uploadUrl,
				container: $(context.wrapper)
			});

			$.telligent.evolution.messaging.subscribe('widgets.delete-cover', function(){
				if(confirm(context.removeConfirm)) {
					remove(context).then(function(){
						removeCoverPhoto(context);
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('widgets.upload-cover', function(){
				uploader.upload()
					.progress(function(data) {
						$(context.coverPhotoUploadLink).html(context.progressText.replace(/\{0\}/g, data.percent));
					})
					.then(function(data){
						$(context.coverPhotoUploadLink).html(context.progressText.replace(/\{0\}/g, 100));
						window.setTimeout(function() {
							$(context.coverPhotoUploadLink).html(context.uploadText);
						}, 500);
						upload(context, data.context, data.name).then(function(coverPhoto){
							resize(context, coverPhoto.CoverPhoto.Url).then(function(resizedUrl){
								setCoverPhoto(context, resizedUrl);
							})
						})
					})
					.catch(function() {
						$(context.coverPhotoUploadLink).html(context.uploadText);
					});
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.userBanner = $.telligent.evolution.widgets.userBanner || api;

})(jQuery);