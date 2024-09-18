(function ($, global) {
	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function loadEmoticonsList(options, collectionId, collectionName) {
		$.telligent.evolution.administration.open({
			name: collectionName,
			//header: $('<fieldset></fieldset>').append(<div>),
			content: $.telligent.evolution.get({
				url: options.urls.listEmoticons,
				data: {
					w_collectionid : collectionId
				}
			}),
			cssClass: 'administration-emoticons-list'
		});
	};

	function loadCollectionEdit(options, collectionId, title) {
		$.telligent.evolution.administration.open({
			name: title,
			content: $.telligent.evolution.get({
				url: options.urls.editCollection,
				data: {
					w_collectionid : collectionId
				}
			}),
			cssClass: 'administration-emoticoncollection-edit'
		});
	};

	function loadEmoticonEdit(options, emoticonId, title, collectionId) {
		$.telligent.evolution.administration.open({
			name: title,
			content: $.telligent.evolution.get({
				url: options.urls.editEmoticon,
				data: {
					w_emoticonId : emoticonId
				}
			}),
			cssClass: 'administration-emoticon-edit'
		});
	};

	function loadVariationEdit(options, emoticonId, title, collectionId) {
		$.telligent.evolution.administration.open({
			name: title,
			content: $.telligent.evolution.get({
				url: options.urls.editVariation,
				data: {
					w_variationId : emoticonId
				}
			}),
			cssClass: 'administration-emoticonvariation-edit'
		});
	};

	function collectionReorder(options, key, direction) {
		var self = this,
		move = {
			up : function(collection, collections){
				if (collection instanceof jQuery){
					$before = collection.prev();
				collection.insertBefore($before);
					return true;
				}

				var pos = collections.indexOf(collection), limit = 0;
				if (pos <= limit) return collections;
				collections.splice(pos--, 1);
				collections.splice(pos, 0, collection);
				return collections;
			},
			down : function(collection, collections){
				if (collection instanceof jQuery){
					$after = collection.next();
				collection.insertAfter($after);
					return true;
				}

				var pos = collections.indexOf(collection), limit = collections.length - 1;
				if (pos === -1 || pos >= limit) return collections;
				collections.splice(pos++, 1);
				collections.splice(pos, 0, collection);
				return collections;
			}
		};

		var sortOrder = 1,
		orderedCollections = move[direction](key, options.collectionList),
		update = function(data, refresh){
			$.telligent.evolution.post({
				url: options.urls.save,
				data: data
			})
			.then(function(response) {
				if (refresh) move[direction]($('.content-item.expanded'));
			})
			.catch(function() { $.telligent.evolution.notifications.show(options.text.collectionSortError); });
		};

		$.each(orderedCollections, function(index, collection) {
			var refresh = index === orderedCollections.length - 1;
			update({ CollectionId : collection, OrderNumber : sortOrder }, refresh);
			sortOrder += 1;
		});

		return false;
	};

	function collectionSortHandlers(options) {
		var sortOrder = $('.sortOrder'),
		sortButtons = {
			up : {
				size : 24,
				background : 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDaGV2cm9uX3RoaW5fdXAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjAgMjAiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDIwIDIwIiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIGZpbGw9IiMwMDAwMDAiIGQ9Ik0yLjU4MiwxMy44OTFjLTAuMjcyLDAuMjY4LTAuNzA5LDAuMjY4LTAuOTc5LDBzLTAuMjcxLTAuNzAxLDAtMC45NjlsNy45MDgtNy44MyAgYzAuMjctMC4yNjgsMC43MDctMC4yNjgsMC45NzksMGw3LjkwOCw3LjgzYzAuMjcsMC4yNjgsMC4yNywwLjcwMSwwLDAuOTY5Yy0wLjI3MSwwLjI2OC0wLjcwOSwwLjI2OC0wLjk3OCwwTDEwLDYuNzVMMi41ODIsMTMuODkxeiAgIi8+DQo8L3N2Zz4=") no-repeat'
			},
			down : {
				size : 24,
				background : 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDaGV2cm9uX3RoaW5fZG93biIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMjAgMjAiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHBhdGggZmlsbD0iIzAwMDAwMCIgZD0iTTE3LjQxOCw2LjEwOWMwLjI3Mi0wLjI2OCwwLjcwOS0wLjI2OCwwLjk3OSwwczAuMjcxLDAuNzAxLDAsMC45NjlsLTcuOTA4LDcuODMgIGMtMC4yNywwLjI2OC0wLjcwNywwLjI2OC0wLjk3OSwwbC03LjkwOC03LjgzYy0wLjI3LTAuMjY4LTAuMjctMC43MDEsMC0wLjk2OWMwLjI3MS0wLjI2OCwwLjcwOS0wLjI2OCwwLjk3OSwwTDEwLDEzLjI1ICBMMTcuNDE4LDYuMTA5eiIvPg0KPC9zdmc+DQo=") no-repeat'
			},
			style : { position : 'absolute', top : '10px', display : 'none' }
		};

		var setStyle = function(orderButton, direction){
			orderButton
			.css('display', 'block')
			.css('background', direction.background)
			.css('height', direction.size + 'px')
			.css('width', direction.size + 'px');
		};

		sortOrder.css(sortButtons.style);
		setStyle($('.up', sortOrder), sortButtons.up);
		setStyle($('.down', sortOrder), sortButtons.down);

		$('.content-item').on('click', function(){
			var selected = $('.sortOrder', this);
			if (selected.is(':visible')) return;

			$('.sortOrder').hide();
			selected.fadeIn('fast');
		});

		$('.sortOrder').css('cursor', 'pointer');
	};


	var api = {
		register: function (options) {
			options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);
			options.wrapper = $.telligent.evolution.administration.panelWrapper();

			options.headerWrapper.append(
				$.telligent.evolution.template.compile(options.headerTemplateId)({})
			);

			$.telligent.evolution.administration.header();

			var addCollectionButton = $('a.add-collection', $.telligent.evolution.administration.header());
			addCollectionButton.on('click', function () {
				loadCollectionEdit(options, null, options.text.addCollection);

				return false;
			});

			collectionSortHandlers(options);

			$.telligent.evolution.messaging.subscribe('administration.emoticoncollection.up',
				function(data) {
					var collectionId = $(data.target).data('collectionid');
					collectionReorder(options, collectionId, 'up');
				}
			);

			$.telligent.evolution.messaging.subscribe('administration.emoticoncollection.down',
				function(data) {
					var collectionId = $(data.target).data('collectionid');
					collectionReorder(options, collectionId, 'down');
				}
			);

			$.telligent.evolution.messaging.subscribe('administration.emoticoncollection.edit', function (data) {
				var collectionId = $(data.target).data('collectionid');
				var collectionName = $(data.target).data('collectionname');
				loadCollectionEdit(options, collectionId, options.text.editCollection + ' ' + collectionName);
			});

			$.telligent.evolution.messaging.subscribe('administration.emoticoncollection.deleted', function (data) {
				var elm = $('#' + options.collectionsList).find('li[data-collectionid="' + data.collectionId + '"]').remove();
			});

			$.telligent.evolution.messaging.subscribe('administration.emoticoncollection.created', function (data) {
				$.telligent.evolution.administration.refresh();
			});

			$.telligent.evolution.messaging.subscribe('administration.emoticoncollection.updated', function (data) {
				$.telligent.evolution.administration.refresh();
			});
		}
	};

	$.telligent.evolution.widgets.administrationEmoticonCollectionEdit = {
		register: function (options) {

			options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);

			options.headerWrapper.append(
				$.telligent.evolution.template.compile(options.headerTemplateId)({
					id: options.collectionId,
					name: options.collectionName,
					hasEmoticons: options.hasEmoticons
				})
			);

			$.telligent.evolution.administration.header();

			var saveButton = $('a.save-collection', options.headerWrapper);
			saveButton.evolutionValidation({
				validateOnLoad: options.collectionId > 0,
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var data = {};

					data.CollectionId = options.collectionId;

					var name = $(options.inputs.nameId).val();
					data.Name = name;

					var enabled = $(options.inputs.enabledId).prop("checked");
					data.Enabled = enabled;

					var changes = '';

					options.emoticonsList.find('li.emoticon-item').each(function( index ) {
						var emoticon_order = index + 1;

						if (emoticon_order != $( this ).attr('data-order')) {
							changes += $( this ).attr('data-id') + ',' + emoticon_order + '::'
						}
					});

					data.OrderChanges = changes;

					if (options.file && options.file.isNew) {
						data.FileChanged = '1';
						data.FileName = options.file.fileName;
						data.FileContextId = options.uploadContextId;
					}

					$.telligent.evolution.post({
						url: options.urls.save,
						data: data
					})
					.then(function(response) {
						if (options.collectionId == '00000000-0000-0000-0000-000000000000') {
							$.telligent.evolution.notifications.show(options.text.collectionCreated);
							$.telligent.evolution.messaging.publish('administration.emoticoncollection.created', {
								collectionId: options.collectionId
							});
						} else {
							$.telligent.evolution.notifications.show(options.text.collectionUpdated);
							$.telligent.evolution.messaging.publish('administration.emoticoncollection.updated', {
								collectionId: options.collectionId
							});
						}

						$.telligent.evolution.administration.close();
					});

					return false;
				}
			});

			saveButton.evolutionValidation('addField', options.inputs.nameId, { required: true, maxlength: 256 }, '.field-item.collection-name .field-item-validation');

			saveButton.evolutionValidation('addCustomValidation', 'collectionfileuploaded', function () {
				return (options.file && !options.uploading && ((!options.file.isRemote && options.file.fileName && options.file.fileName.length > 0)));
			},
				options.text.fileRequired,
				'.field-item.collection-attachment .field-item-validation',
				null
			);

			$.telligent.evolution.messaging.subscribe('administration.emoticoncollection.delete', function (data) {
				var collectionId = $(data.target).data('collectionid');
				var name = $(data.target).data('name');

				if (confirm(options.text.deleteConfirmation))
				{
					var data = {
						collectionId: collectionId,
						name: name
					};

					$.telligent.evolution.post({
						url: options.urls.delete,
						data: data,
						success: function (response) {
							$.telligent.evolution.notifications.show(options.text.collectionDeleted);

							$.telligent.evolution.messaging.publish('administration.emoticoncollection.deleted', {
								collectionId: collectionId
							});
							$.telligent.evolution.administration.close();

						},
						defaultErrorMessage: options.text.deleteError,
						error: function (xhr, desc, ex) {
							if (xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0) {
								$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0], { type: 'error' });
							}
							else {
								$.telligent.evolution.notifications.show(desc, { type: 'error' });
							}
						}
					});
				}
			});

			options.emoticonsList = $('ul.emoticon-list', $.telligent.evolution.administration.panelWrapper());
            
            if (options.emoticonsList.length == 1) {
                $(options.emoticonsList).sortable({
				    placeholder: "ui-state-highlight"
			    });

    			options.scrollableResults = $.telligent.evolution.administration.scrollable({
    				target: options.emoticonsList,
    				load: function (pageIndex) {
    					return $.Deferred(function (d) {
    						$.telligent.evolution.get({
    							url: options.urls.pagedEmoticons,
    							data: {
    								w_pageindex: pageIndex,
    							}
    						})
    						.then(function (response) {
    							var r = $(response);
    							var items = $('li.emoticon-item ', r);
    
    							if (items.length == 0 && pageIndex == 0) {
    								$.telligent.evolution.administration.panelWrapper().append(r);
    								d.reject();
    							}
    							else if (items.length > 0) {
    								options.emoticonsList.append(items);
    
    								if (r.data('hasmore') === true) {
    									d.resolve();
    								} else {
    									d.reject();
    								}
    							} else {
    								d.reject();
    							}
    						})
    						.catch(function () {
    							d.reject();
    						});
    					});
    				}
    			});
            }
			

			$.telligent.evolution.messaging.subscribe('administration.emoticon.add', function (data) {
				var collectionId = $(data.target).data('collectionid');
				var collectionName = $(data.target).data('collectionname');
				loadEmoticonEdit(options, null, options.text.addEmoticon + ' ' + collectionName, collectionId);
			});

			$.telligent.evolution.messaging.subscribe('administration.emoticon.edit', function (data) {
				var emoticonId = $(data.target).data('emoticonid');
				var emoticonName = $(data.target).data('emoticonname');
				loadEmoticonEdit(options, emoticonId, options.text.editEmoticon + ' ' + emoticonName, null);
			});

			$.telligent.evolution.messaging.subscribe('administration.emoticon.deleted', function (data) {
				var list = $('ul.emoticon-list');
				$("li[data-id='" + data.emoticonId + "']").remove();

				if (list.children('li').length == 0) {
					$('div.no-emoticons').show();
				}
			});

			$.telligent.evolution.messaging.subscribe('administration.emoticon.created', function (data) {
				$.telligent.evolution.get({
					url: options.urls.emoticonlistitem + '&w_emoticonId=' + data.emoticonId
				})
				.then(function(response) {
					$('ul.emoticon-list', $.telligent.evolution.administration.panelWrapper()).append(response);
					$('div.no-emoticons').hide();
				});
			});

			$.telligent.evolution.messaging.subscribe('administration.emoticon.updated', function (data) {
				$.telligent.evolution.get({
					url: options.urls.emoticonlistitem + '&w_emoticonId=' + data.emoticonId
				})
				.then(function(response) {
					$("li[data-id='" + data.emoticonId + "']").replaceWith(response);
				});
			});

			options.currentItem = $('fieldset[data-collectionId="' + options.collectionId + '"]', $.telligent.evolution.administration.panelWrapper());
			options.attachment = $('li.collection-attachment', options.currentItem);
			options.attachmentUpload = options.attachment.find('a.upload');
			options.attachmentName = options.attachment.find('input', options.currentItem);
			options.attachmentPreview = options.attachment.find('.preview', options.currentItem);

			function loadPreview() {
				if (options.file && (options.file.fileName || options.file.url)) {
					clearTimeout(options.attachmentPreviewTimeout);
					options.attachmentPreviewTimeout = setTimeout(function () {
						var data = {
							w_uploadContextId: options.uploadContextId
						};
						if (options.file.url) {
							data.w_url = options.file.url;
						}
						if (options.file.fileName) {
							data.w_filename = options.file.fileName;
						}
						$.telligent.evolution.post({
							url: options.previewAttachmentUrl,
							data: data,
							success: function (response) {
								response = $.trim(response);
								if (response && response.length > 0 && response !== options.attachmentPreviewContent) {
									options.attachmentPreviewContent = response;
									options.attachmentPreview.html(options.attachmentPreviewContent).removeClass('empty');
								}
							}
						});
					}, 150);
				} else {
					options.attachmentPreviewContent = '';
					options.attachmentPreview.html('').addClass('empty');
				}
			}

			if (options.file && options.file.fileName) {
				options.attachmentName.attr('readonly', 'readonly');
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
			} else if (options.attachment.data('link') != 'True') {
				options.attachmentName.attr('readonly', 'readonly');
			}

			loadPreview();

			options.attachmentName.on('keyup change', function () {
				if (!options.attachmentName.attr('readonly')) {
					options.file = {
						url: $(this).val(),
						isRemote: false,
						isNew: true
					};
					loadPreview();
				}
			});

			options.attachmentUpload.glowUpload({
				uploadUrl: options.uploadFileUrl,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				options.uploading = true;
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', 0));
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					options.file = {
						fileName: file.name,
						isRemote: false,
						isNew: true
					};
					options.attachmentName.val(options.file.fileName).attr('readonly', 'readonly');
					loadPreview();
					options.uploading = false;
					options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');

				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				options.uploading = false;
				loadPreview();
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('change').addClass('add');
			});
		}
	};

	$.telligent.evolution.widgets.administrationEmoticonEdit = {
		register: function (options) {

			options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);

			options.headerWrapper.append(
				$.telligent.evolution.template.compile(options.headerTemplateId)({
					id: options.emoticonId,
					name: options.emoticonName,
					isDefault: options.default
				})
			);

			$.telligent.evolution.administration.header();

			options.currentItem = $('fieldset[data-emoticonid="' + options.emoticonId + '"]', $.telligent.evolution.administration.panelWrapper());

			$.telligent.evolution.messaging.subscribe('administration.emoticonvariation.edit', function (data) {
				var emoticonId = $(data.target).data('emoticonid');
				var emoticonName = $(data.target).data('emoticonname');
				loadVariationEdit(options, emoticonId, options.text.editEmoticon + ' ' + emoticonName, null);
			});

			var saveButton = $('a.save-emoticon', options.headerWrapper);
			saveButton.evolutionValidation({
				validateOnLoad: options.collectionId > 0,
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var data = {};

					data.EmoticonId = options.emoticonId;
					data.CollectionId = options.collectionId;

					var name = $(options.inputs.nameId, options.currentItem).val();
					data.Name = name;

					var shortcut = $(options.inputs.shortcutId, options.currentItem).val();
					data.Shortcut = shortcut;

					var enabled = $(options.inputs.enabledId).prop("checked");
					data.Enabled = enabled;

					if (options.file && options.file.isNew) {
						data.FileChanged = '1';
						data.FileName = options.file.fileName;
						data.FileContextId = options.uploadContextId;
					}

					$.telligent.evolution.post({
						url: options.urls.save,
						data: data
					})
					.then(function(response) {
						if (options.emoticonId == '00000000-0000-0000-0000-000000000000') {
							$.telligent.evolution.notifications.show(options.text.emoticonCreated);
							$.telligent.evolution.messaging.publish('administration.emoticon.created', {
								emoticonId: response.emoticonId,
								collectionId: response.collectionId
							});
						} else {
							$.telligent.evolution.notifications.show(options.text.emoticonUpdated);
							$.telligent.evolution.messaging.publish('administration.emoticon.updated', {
								emoticonId: options.emoticonId,
								collectionId: response.collectionId
							});
						}

						$.telligent.evolution.administration.close();
					});

					return false;
				}
			});

			if($(options.inputs.nameId).length > 0) {
				saveButton.evolutionValidation('addField', options.inputs.nameId, { required: true, maxlength: 256 }, '.field-item.emoticon-name .field-item-validation');
			}

			saveButton.evolutionValidation('addCustomValidation', 'emoticonfileuploaded', function () {
				return (options.file && !options.uploading && ((!options.file.isRemote && options.file.fileName && options.file.fileName.length > 0)));
			},
				options.text.fileRequired,
				'.field-item.emoticon-attachment .field-item-validation',
				null
			);

			$.telligent.evolution.messaging.subscribe('administration.emoticon.delete', function (data) {
				var emoticonId = $(data.target).data('emoticonId');
				var name = $(data.target).data('name');

				if (confirm(options.text.deleteConfirmation))
				{
					var data = {
						emoticonId: emoticonId,
						name: name
					};

					$.telligent.evolution.post({
						url: options.urls.delete,
						data: data,
						success: function (response) {
							$.telligent.evolution.notifications.show(options.text.emoticonDeleted);
							$.telligent.evolution.messaging.publish('administration.emoticon.deleted', {
								emoticonId: response.emoticonId
							});
							$.telligent.evolution.administration.close();
						},
						defaultErrorMessage: options.text.deleteError,
						error: function (xhr, desc, ex) {
							if (xhr.responseJSON.Errors != null && xhr.responseJSON.Errors.length > 0) {
								$.telligent.evolution.notifications.show(xhr.responseJSON.Errors[0], { type: 'error' });
							}
							else {
								$.telligent.evolution.notifications.show(desc, { type: 'error' });
							}
						}
					});
				}
			});

			$.telligent.evolution.messaging.subscribe('administration.emoticonvariation.updated', function (data) {
				$.telligent.evolution.get({
					url: options.urls.variationlistitem + '&w_variationId=' + data.emoticonId
				})
				.then(function(response) {
					var list = $('ul.variation-list', $.telligent.evolution.administration.panelWrapper())
					$("li[data-id='" + data.emoticonId + "']", list).replaceWith(response);
				});
			});

			options.attachment = $('li.emoticon-attachment', options.currentItem);
			options.attachmentUpload = options.attachment.find('a.upload');
			options.attachmentName = options.attachment.find('input', options.currentItem);
			options.attachmentPreview = options.attachment.find('.preview', options.currentItem);

			function loadPreview() {
				if (options.file && (options.file.fileName || options.file.url)) {
					clearTimeout(options.attachmentPreviewTimeout);
					options.attachmentPreviewTimeout = setTimeout(function () {
						var data = {
							w_uploadContextId: options.uploadContextId
						};
						if (options.file.url) {
							data.w_url = options.file.url;
						}
						if (options.file.fileName) {
							data.w_filename = options.file.fileName;
						}

						$.telligent.evolution.post({
							url: options.previewAttachmentUrl,
							data: data,
							success: function (response) {
								response = $.trim(response);
								if (response && response.length > 0 && response !== options.attachmentPreviewContent) {
									options.attachmentPreviewContent = response;
									options.attachmentPreview.html(options.attachmentPreviewContent).removeClass('empty');
								}
							}
						});
					}, 150);
				} else {
					options.attachmentPreviewContent = '';
					options.attachmentPreview.html('').addClass('empty');
				}
			}

			if (options.file && options.file.fileName) {
				options.attachmentName.attr('readonly', 'readonly');
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
			} else if (options.attachment.data('link') != 'True') {
				options.attachmentName.attr('readonly', 'readonly');
			}

			loadPreview();

			options.attachmentName.on('keyup change', function () {
				if (!options.attachmentName.attr('readonly')) {
					options.file = {
						url: $(this).val(),
						isRemote: false,
						isNew: true
					};
					loadPreview();
				}
			});

			options.attachmentUpload.glowUpload({
				uploadUrl: options.uploadFileUrl,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				options.uploading = true;
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', 0));
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					options.file = {
						fileName: file.name,
						isRemote: false,
						isNew: true
					};
					options.attachmentName.val(options.file.fileName).attr('readonly', 'readonly');
					loadPreview();
					options.uploading = false;
					options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');

				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				loadPreview();
				options.uploading = false;
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('change').addClass('add');
			});


			var viewidentifiers = $('a.viewidentifiers', options.currentItem);
			viewidentifiers.on('click', function () {
				$('li.identifiers', $.telligent.evolution.administration.panelWrapper()).each( function() {
					$(this).toggle();
				});

				return false;
			});
		}
	};

	$.telligent.evolution.widgets.administrationEmoticonVariationEdit = {
		register: function (options) {

			options.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(options.headerWrapper);

			options.headerWrapper.append(
				$.telligent.evolution.template.compile(options.headerTemplateId)({
					id: options.emoticonId,
					name: options.emoticonName,
					isDefault: options.default
				})
			);

			$.telligent.evolution.administration.header();

			options.currentItem = $('fieldset[data-emoticonid="' + options.emoticonId + '"]', $.telligent.evolution.administration.panelWrapper());

			var saveButton = $('a.save-variation', options.headerWrapper);
			saveButton.evolutionValidation({
				validateOnLoad: options.collectionId > 0,
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var data = {};

					data.EmoticonId = options.emoticonId;

					var enabled = $(options.inputs.enabledId).prop("checked");
					data.Enabled = enabled;

					if (options.file && options.file.isNew) {
						data.FileChanged = '1';
						data.FileName = options.file.fileName;
						data.FileContextId = options.uploadContextId;
					}

					$.telligent.evolution.post({
						url: options.urls.save,
						data: data
					})
					.then(function(response) {
						$.telligent.evolution.notifications.show(options.text.variationUpdated);
						$.telligent.evolution.messaging.publish('administration.emoticonvariation.updated', {
							emoticonId: options.emoticonId
						});

						$.telligent.evolution.administration.close();
					});

					return false;
				}
			});

			saveButton.evolutionValidation('addCustomValidation', 'variationfileuploaded', function () {
				return (options.file && !options.uploading && ((!options.file.isRemote && options.file.fileName && options.file.fileName.length > 0)));
			},
				options.text.fileRequired,
				'.field-item.variation-attachment .field-item-validation',
				null
			);

			options.attachment = $('li.variation-attachment', options.currentItem);
			options.attachmentUpload = options.attachment.find('a.upload');
			options.attachmentName = options.attachment.find('input', options.currentItem);
			options.attachmentPreview = options.attachment.find('.preview', options.currentItem);

			function loadPreview() {
				if (options.file && (options.file.fileName || options.file.url)) {
					clearTimeout(options.attachmentPreviewTimeout);
					options.attachmentPreviewTimeout = setTimeout(function () {
						var data = {
							w_uploadContextId: options.uploadContextId
						};
						if (options.file.url) {
							data.w_url = options.file.url;
						}
						if (options.file.fileName) {
							data.w_filename = options.file.fileName;
						}

						$.telligent.evolution.post({
							url: options.previewAttachmentUrl,
							data: data,
							success: function (response) {
								response = $.trim(response);
								if (response && response.length > 0 && response !== options.attachmentPreviewContent) {
									options.attachmentPreviewContent = response;
									options.attachmentPreview.html(options.attachmentPreviewContent).removeClass('empty');
								}
							}
						});
					}, 150);
				} else {
					options.attachmentPreviewContent = '';
					options.attachmentPreview.html('').addClass('empty');
				}
			}

			if (options.file && options.file.fileName) {
				options.attachmentName.attr('readonly', 'readonly');
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');
			} else if (options.attachment.data('link') != 'True') {
				options.attachmentName.attr('readonly', 'readonly');
			}

			loadPreview();

			options.attachmentName.on('keyup change', function () {
				if (!options.attachmentName.attr('readonly')) {
					options.file = {
						url: $(this).val(),
						isRemote: false,
						isNew: true
					};
					loadPreview();
				}
			});

			options.attachmentUpload.glowUpload({
				uploadUrl: options.uploadFileUrl,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function (e) {
				options.uploading = true;
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', 0));
			})
			.on('glowUploadComplete', function (e, file) {
				if (file && file.name.length > 0) {
					options.file = {
						fileName: file.name,
						isRemote: false,
						isNew: true
					};
					options.attachmentName.val(options.file.fileName).attr('readonly', 'readonly');
					loadPreview();
					options.uploading = false;
					options.attachmentUpload.html(options.attachmentChangeText).removeClass('add').addClass('change');

				}
			})
			.on('glowUploadFileProgress', function (e, details) {
				options.attachmentUpload.html(options.attachmentProgressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				loadPreview();
				options.uploading = false;
				options.attachmentUpload.html(options.attachmentChangeText).removeClass('change').addClass('add');
			});

			var viewidentifiers = $('a.viewidentifiers', options.currentItem);
			viewidentifiers.on('click', function () {
				$('li.identifiers', $.telligent.evolution.administration.panelWrapper()).each( function() {
					$(this).toggle();
				});

				return false;
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.administrationEmoticons = api;

})(jQuery, window);