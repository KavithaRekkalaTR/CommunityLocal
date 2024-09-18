(function($, global) {

	function save(context, o) {
		$.telligent.evolution.post({
			url: context.urls.save,
			data: {
				template: getTemplatesForCallback(context)
			}
		})
			.then(function() {
				reset(context);
				o.success();
			})
			.catch(function() {
				o.error();
			});
	}

	function previewEmail(context, sendEmail) {
		$.telligent.evolution.post({
			url: context.urls.previewEmail,
			data: {
				template: getTemplatesForCallback(context),
				language: context.inputs.language.val(),
				sendEmail: sendEmail
			}
		})
			.then(function(response) {
				if (sendEmail) {
					$.telligent.evolution.notifications.show(context.text.previewEmailSentSuccessful, {
						type: 'success'
					})
				} else {
					var frame = $('<iframe frameborder="0" width="650" height="600"></iframe>');
					frame.on('load', function() {
						frame.contents().find('html').html(response.preview.body);
					});

					$.glowModal({
						html: frame,
						width: 650,
						height: 600,
						title: response.preview.subject.replace(/\<[^\>]*\>/g, ''),
						windowContentCssClasses: ['email-preview-wrapper'],
					});
				}
			});
	}

	function revert(context) {
		if (global.confirm(context.text.revertConfirm)) {
			$.telligent.evolution.post({
				url: context.urls.revert
			})
				.then(function(response) {
					context.templates = response.templates;
					reset(context);
					$.telligent.evolution.notifications.show(context.text.revertSuccessful, {
						type: 'success'
					})
				});
		}
	}

	function getTemplatesForCallback(context) {
		var templates = [];

		$.each(context.templates, function(templateId, template) {
			$.each(template, function(language, data) {
				if (data.save) {
					templates.push($.param({
						Id: templateId,
						Language: language,
						Value: data.value
					}));
				}
			});
		});

		return templates;
	}

	function reset(context) {
		$.each(context.templates, function(templateId, template) {
			$.each(template, function(language, data) {
				data.originalValue = data.value;
				data.save = false;
			});
		});

		context.wrapper.find('.modified-status').html(context.text.notModified).removeClass('modified');

		selectLanguage(context);
	}

	function selectLanguage(context) {

		var l = context.inputs.language.val();

		context.wrapper.find('.content-item.template').each(function() {
			var t = $(this);

			var editorId = t.data('editorid');
			var templateId = t.data('templateid');
			var dataTypeIds = t.data('datatypeids');
			var template = context.templates[templateId] || {};
			var translation = template[l] || {};
			
			var editor = $('#' + editorId);
			if (!editor.data('initialized')) {
    			editor.evolutionHtmlEditor({
    			    width: '100%',
    			    height: '300px',
    			    enableFileUpload: true,
    			    _enableLegacyTokens: true 
    			}).data('initialized', true);
			}
			
            editor.evolutionHtmlEditor('ready', function() {
    			var mceEditor = tinymce.EditorManager.get(editorId);
    			if (mceEditor) {
    			    editor.evolutionHtmlEditor('val', translation.value);
    				mceEditor.settings.tokenDataTypeIds = dataTypeIds.split(',');
    				mceEditor.getBody().dir = context.inputs.language.find('option:selected').attr('data-dir');
    			}
            });
		});
	}

	function normalizeTemplate(context, template) {
		return (template || '')
			.replace(/(?:^\W*<p[^>]*>(?:&nbsp;)?<\/p>|<p[^>]*>(?:&nbsp;)?<\/p>\W*$)/gi, '')
			.replace(/^\W*<p[^>]*>((?:(?!<p>).)+)?<\/p>\W*$/i, '$1')
			.replace(/(?:<[^>]*>| )/g, function(text) {
				if (text == ' ') {
					return '&nbsp;';
				} else {
					return text;
				}
			}).replace(/[\n\r]/g, '');
	}

	function attachHandlers(context) {
		context.wrapper.find('.content-item.template').each(function() {
			var t = $(this);

			var editorId = t.data('editorid');
			var templateId = t.data('templateid');

			$('#' + editorId).on('change', function() {
				var val = $('#' + editorId).evolutionHtmlEditor('val');
				var l = context.inputs.language.val();
				var template = context.templates[templateId] || {};
				var translation = template[l] || {};

				translation.value = val;

				if (normalizeTemplate(context, translation.originalValue) != normalizeTemplate(context, val)) {
					translation.save = true;
					t.find('.modified-status').html(context.text.modified).addClass('modified');
				} else {
					translation.save = false;
					t.find('.modified-status').html(context.text.notModified).removeClass('modified');
				}
			});
		});
	}

	var api = {
		register: function(context) {

			context.initialized = false;

			context.inputs.language.on('change', function() {
				selectLanguage(context);
			});

			context.api.registerContent({
				name: context.text.templates,
				orderNumber: 400,
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

					if (!context.initialized) {
						context.initialized = true;
						reset(context);
						attachHandlers(context);
					}
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
				},
				validate: function() {
					return validate(context);
				}
			});

			context.api.registerSave(function(o) {
				save(context, o);
			});

			$.telligent.evolution.messaging.subscribe('plugintemplates.preview-send-email', function(data) {
				previewEmail(context, true);
			});

			$.telligent.evolution.messaging.subscribe('plugintemplates.preview-email', function(data) {
				previewEmail(context, false);
			});

			$.telligent.evolution.messaging.subscribe('plugintemplates.revert', function(data) {
				revert(context);
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.pluginTemplates = api;

}(jQuery, window));