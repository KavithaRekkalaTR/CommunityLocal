(function ($, global) {
	var api = {
		register: function (context) {
			context.api.registerContent({
				name: context.text.synonyms,
				orderNumber: 50,
				selected: function () {
					context.synonymsWrapper.css({
						visibility: 'visible',
						height: 'auto',
						width: 'auto',
						left: '0',
						position: 'static',
						overflow: 'visible',
						top: '0'
					});
				},
				unselected: function () {
					context.synonymsWrapper.css({
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

			context.api.registerContent({
				name: context.text.contentTypes,
				orderNumber: 100,
				selected: function () {
					context.contentTypesWrapper.show();
				},
				unselected: function () {
					context.contentTypesWrapper.hide();
				}
			});

			// init multi-selection
			var selectAll = context.fields.multiSelect.filter('.all');
			var selectNone = context.fields.multiSelect.filter('.none');

			selectAll.on('click', function(e){
				context.fields.contentTypes.prop('checked', true);
				renderMultiSelect();
				return false;
			});

			selectNone.on('click', function(e){
				context.fields.contentTypes.prop('checked', false);
				renderMultiSelect();
				return false;
			});

			function renderMultiSelect() {
				context.fields.multiSelect.hide();
				var totalCount = context.fields.contentTypes.length;
				var selectedCount = context.fields.contentTypes.filter(':checked').length;
				if (selectedCount > 0) {
					selectNone.show();
				}
				if (selectedCount < totalCount) {
					selectAll.show();
				}
			}
			context.fields.contentTypes.on('change', renderMultiSelect);
			renderMultiSelect();

			context.fields.synonyms.evolutionCodeEditor({
				mode: 'text',
				minLines: '20',
				maxLines: '20',
				readOnly: false,
				wordWrap: false
			});

			context.fields.import.glowUpload({
					fileFilter: [{
						title: "CSV Files",
						extensions: "csv"
					}],
					uploadUrl: context.urls.uploadFile,
					renderMode: 'link'
				})
				.on('glowUploadBegun', function (e) {
					context.fields.import.html(context.text.uploadProgress.replace('{0}', 0));
				})
				.on('glowUploadComplete', function (e, file) {
					if (file && file.name.length > 0) {
						context.fields.import.html(context.text.importing);

						$.telligent.evolution.post({
								url: context.urls.importFile,
								data: {
									uploadContextId: context.uploadContextId,
									fileName: file.name
								}
							})
							.done(function (result) {
								context.fields.synonyms.evolutionCodeEditor('val', result.synonyms || '');
							})
							.always(function () {
								context.fields.import.html(context.text.import);
							});
					}
				})
				.on('glowUploadFileProgress', function (e, details) {
					context.fields.import.html(context.text.uploadProgress.replace('{0}', details.percent));
				})
				.on('glowUploadError', function (e) {
					context.fields.import.html(context.text.import);
				});

			context.api.registerSave(function (o) {
				$.telligent.evolution.post({
						url: context.urls.save,
						data: {
							synonyms: context.fields.synonyms.evolutionCodeEditor('val'),
							searchableContentTypes: context.fields.contentTypes.filter(':checked').map(function(){
								return $(this).attr('value');
							}).toArray().toString()
						}
					})
					.done(function (result) {
						context.fields.synonyms.evolutionCodeEditor('val', result.synonyms || '');
						result.contentTypes.forEach(function(contentType) {
							context.fields.contentTypes.filter('[value="' + contentType.ContentType.Id + '"]').prop('checked', contentType.IsSearchable);
						});
						o.success();
					})
					.fail(function () {
						o.error();
					});
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.solrConfiguration = api;

}(jQuery, window));