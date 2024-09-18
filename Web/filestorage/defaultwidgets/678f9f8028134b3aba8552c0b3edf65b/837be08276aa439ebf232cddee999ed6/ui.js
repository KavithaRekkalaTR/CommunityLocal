(function($, global) {

	var administration = $.telligent.evolution.administration;
	var messaging = $.telligent.evolution.messaging;
	var scheduledFileCompleteSubscription;
	var scheduledFileErrorSubscription;

	var Uploader = (function() {

		var defaults = {
			uploadContextId: '',
			uploadUrl: ''
		};
		var nameSpace = '_uploader';

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

		var Uploader = function(options){
			var context = $.extend({
			}, defaults, options || {});

			init(context);

			return {
				upload: function() {
					init(context);

					return $.Deferred(function(d){
						context.uploadButtonShim.off(nameSpace)
						context.uploadButtonShim.on('glowUploadBegun.' + nameSpace, function(e){
						});
						context.uploadButtonShim.on('glowUploadError.' + nameSpace, function(e){
							d.reject();
						})
						context.uploadButtonShim.on('glowUploadFileProgress.' + nameSpace, function(e, details){
							d.notify({
								name: details.name,
								context: context.uploadContextId,
								percent: (details.percent / 100)
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

    function saveConfiguration(context, stage) {
        var data = {};
        $.each(context.configurationGroups, function() {
            var group = this;
            var formData = $('#' + group.formId).dynamicForm('getValues');
            data = $.extend(data, formData);
        });

        return $.telligent.evolution.post({
            url: context.saveUrl,
            data: {
                configuration: $.telligent.evolution.url.serializeQuery(data),
                stage: stage
            }
        });
    }

    // Wraps pattern of calling a .jsm which schedules a task
	// Expects JSON response which contains a progressKey and rendered progressIndicator
	// Expects completion message to include a result and error message to include a message
	function loadWithProgress (promise) {
		administration.loading(true);
		return $.Deferred(function(d){
			promise.then(function(response){
				// complete on complete
				if (scheduledFileCompleteSubscription) {
					$.telligent.evolution.messaging.unsubscribe(scheduledFileCompleteSubscription);
				}
				scheduledFileCompleteSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data)
				{
					if (data.progressKey == response.progressKey) {
						$.telligent.evolution.administration.loading(false);

						d.resolve(data.result);
					}
				});

				// reject on error
				if (scheduledFileErrorSubscription) {
					$.telligent.evolution.messaging.unsubscribe(scheduledFileErrorSubscription);
				}
				scheduledFileErrorSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.error', function (data) {
					if (data.progressKey == response.progressKey) {
						$.telligent.evolution.administration.loading(false);
						d.reject();
					}
				});

				// show live progress indicator while scheduled publish is running
				$.telligent.evolution.administration.loading(true, {
					message: response.progressIndicator,
					width: 250,
					height: 250
				});
			});
		});
	}

	function showImportPanel(context, uploadContext, fileName) {
		loadWithProgress($.telligent.evolution.post({
			url: context.importCallbackUrl,
			data: {
				_w_uploadContext: uploadContext,
				_w_fileName: fileName,
				_w_responseType: 'form',
			}
        })).then(function (result) {
			administration.open({
				name: context.text.importEmailsText,
				cssClass: 'configured-emails import',
				content: result.panelContent
			});
		});
	}

	// Prompts for a language, and returns a promise that resolves with the language key or rejects if canceled
	function promptLanguage(context) {
		return new Promise((resolve, reject) => {
			var modalContent = $(context.selectLanguageTemplate({}));
			var langSelect = modalContent.find('.select-language select');

			modalContent.on('click', 'a.cancel', e => {
				e.preventDefault();
				$.glowModal.close();
				return false;
			});

			modalContent.on('click', 'a.continue', e => {
				e.preventDefault();
				$.glowModal.close(langSelect.val());
				return false;
			});

			$.glowModal({
				title: context.text.sendSample,
				html: modalContent,
				width: 550,
				onClose: result => {
					if (!result)
						reject();
					else
						resolve(result);
				}
			});
		});
	}

    var api = {
        loadWithProgress: loadWithProgress,
		register: function (context) {
			context.uploader = new Uploader({
				container: administration.panelWrapper(),
				uploadContextId: context.uploadContextId,
				uploadUrl: context.uploadUrl
			});

			context.selectLanguageTemplate = $.telligent.evolution.template(context.selectLanguageTemplate);

		    context.api.registerContent({
                orderNumber: 110,
                actions: [{
                    label: context.text.preview,
                    messageName: 'scriptedemail.preview',
                    show: 'always'
                },{
                    label: context.text.sendEmail,
                    messageName: 'scriptedemail.sendsample',
                    show: 'always'
                },{
                    label: context.text.customize,
                    messageName: 'scriptedemail.edit',
                    show: 'always'
                },{
                    label: context.text.export,
                    messageName: 'scriptedemail.export',
                    show: 'always'
                },{
                    label: context.text.exportResources,
                    messageName: 'scriptedemail.exportResources',
                    show: 'always'
                },{
                    label: context.text.import,
                    messageName: 'scriptedemail.import',
                    show: 'always'
                }]
            });

		    $.each(context.configurationGroups, function() {
                var group = this;
                var wrapper = $('#' + group.id);
                context.api.registerContent({
                    name: group.title,
                    orderNumber: 110,
                    selected: function() {
                        wrapper.css({
                            visibility: 'visible',
                            height: 'auto',
                            width: 'auto',
                            left: '0',
                            position: 'static',
                            overflow: 'visible',
                            top: '0'
                        });
                    },
                    unselected: function() {
                        wrapper.css({
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
            });

            context.api.registerSave(function(o) {
                saveConfiguration(context, false)
                    .then(function() {
                        o.success();
                    })
                    .catch(function() {
                        o.error();
                    });
    		});

			$.telligent.evolution.messaging.subscribe('scriptedemail.preview', async () => {
				await saveConfiguration(context, true);

				global.open(context.previewUrl, 'preview' + context.emailId);
			});

            $.telligent.evolution.messaging.subscribe('scriptedemail.edit', function () {
                global.location = context.editUrl
            });

            $.telligent.evolution.messaging.subscribe('scriptedemail.export', function (data) {
                global.location = context.exportUrl;
            });

            $.telligent.evolution.messaging.subscribe('scriptedemail.exportResources', function (data) {
                global.location = $.telligent.evolution.url.modify({
                    url: context.exportUrl,
                    query: {
                        _w_mode: 'Resources'
                    }
                });
            });

            $.telligent.evolution.messaging.subscribe('scriptedemail.import', function () {
                context.uploader.upload().then(function(file){
                    showImportPanel(context, file.context, file.name);
                });
            });

            $.telligent.evolution.messaging.subscribe('configuredemail-imported', function () {
                $.telligent.evolution.administration.refresh();
            });

			$.telligent.evolution.messaging.subscribe('scriptedemail.sendsample', async () => {
				var language = null;
				if (context.languagesCount > 1) {
					try {
						language = await promptLanguage(context);
					} catch (e) {
						return;
					}
				}

				await saveConfiguration(context, false);

				await $.telligent.evolution.post({
					url: context.sendEmailUrl,
					data: {
						language: language
					}
				});

				$.telligent.evolution.notifications.show(context.text.sendEmailSuccessful, {
					type: 'success'
				});
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.scriptedEmailPlugin = api;

}(jQuery, window));