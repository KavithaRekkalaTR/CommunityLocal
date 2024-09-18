(function($, global) {

	function listDocuments(context, status, pageIndex) {
		return $.telligent.evolution.get({
			url: context.urls.list,
			data: {
				w_status: status,
				w_pageIndex: pageIndex
			}
		});
	}

	function getDocument(context, request) {
		return $.telligent.evolution.get({
			url: context.urls.listItem,
			data: request
		});
	}

	function reconvert(context, request) {
		return $.telligent.evolution.post({
			url: context.urls.reconvert,
			data: request
		});
	}

	function cancelConvert(context, request) {
		return $.telligent.evolution.post({
			url: context.urls.cancelConvert,
			data: request
		});
	}

	function startScrollable(context) {
		if(context.scrollable) {
			context.listWrapper.empty();
			context.scrollable.reset();
		} else {
			context.scrollable = $(context.listWrapper).evolutionScrollable({
				load: function(pageIndex) {
					return $.Deferred(function(d) {
						var status = context.status = context.inputs.status.val();
						listDocuments(context, status, pageIndex).then(function(r){
							if(context.status != status) {
								d.resolve();
							}
							else if($.trim(r).length > 0) {
								d.resolve(r);
							} else {
								d.reject();
							}
						}).catch(function(){
							d.reject();
						});
					});
				}
			});
		}
	}

	var api = {
		register: function(context) {
			context.api.registerContent({
				name: context.text.documents,
				orderNumber: 200,
				selected: function() {
					context.wrapper.css({
						visibility: 'visible',
						height: 'auto',
						width: 'auto',
						left: '0',
						position: 'static',
						overflow: 'visible',
						top: '0'
					});
					startScrollable(context);
				},
				unselected: function() {
					context.wrapper.css({
						visibility: 'hidden',
						height: '100px',
						width: '800px',
						left: '-1000px',
						position: 'absolute',
						overflow: 'hidden',
						top: '-1000px'
					});
				}
			});

			context.inputs.status.on('change', function(){
				context.listWrapper.empty();
				context.scrollable.reset();
			});

			$.telligent.evolution.messaging.subscribe('administration.documentViewer.cancel',
				function(data){
					var contentItem = $(data.target).closest('.content-item');
					var request = {
						w_fileStoreKey: $(data.target).data('filestorekey'),
						w_path: $(data.target).data('path'),
						w_fileName: $(data.target).data('filename')
					};
					if(confirm(context.text.deleteConfirm)) {
						cancelConvert(context, request).then(function(r){
							contentItem.remove();
						});
					}
				});

			$.telligent.evolution.messaging.subscribe('administration.documentViewer.reConvert',
				function(data){
					var contentItem = $(data.target).closest('.content-item');
					var request = {
						w_fileStoreKey: $(data.target).data('filestorekey'),
						w_path: $(data.target).data('path'),
						w_fileName: $(data.target).data('filename')
					};
					if(confirm(context.text.reconvertConfirm)) {
						reconvert(context, request).then(function(r){
							getDocument(context, request).then(function(v){
								contentItem.replaceWith(v);
								setTimeout(function(){
									var listItem = context.listWrapper.find('li[data-filestorekey="'+request.w_fileStoreKey+'"][data-path="'+request.w_path+'"][data-filename="'+request.w_fileName+'"]').first();
									listItem.trigger('click');
								}, 50);
							});
						});
					}
				});

			$.telligent.evolution.messaging.subscribe('administration.documentViewer.theater',
				function(data){
					$.evolutionTheater.show({
						content: function(complete) {
							$.telligent.evolution.get({
								url: $(data.target).data('theaterurl'),
								cache: false,
								success: function(response) {
									complete(response);
								}
							});
						},
						loaded: function(content) {
						}
					});
				});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.documentViewerAdmin = api;

}(jQuery, window));