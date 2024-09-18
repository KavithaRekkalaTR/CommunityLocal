(function($, global, undef) {

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

	var MultiSelector = (function() {

		var defaults = {
			actions: [], // [{ label: '', tip: '', message: '' }]
			template: null,
			container: null,
			selectableItemsContainer: null,
			selectEnabledClassName: 'multiselect-enabled',
			selectableItemsSelector: 'input[type="checkbox"]',
			onGetId: function() {},
			onAction: function(message, selected) {}
		};

		function render(context) {
			if (context.rendered)
				context.rendered.remove();

			context.rendered = $(context.template({
				actions: context.actions,
				count: context.selected.length
			})).appendTo(context.container);

			// resize header
			administration.header();
		}

		function collectSelected(context) {
			context.selected = context.selectableItemsContainer
				.find(context.selectableItemsSelector)
				.filter(':checked')
				.toArray()
				.map(function(elm){
					return context.onGetId(elm);
				});
		}

		function selectAll(context, select) {
			context.selectableItemsContainer
				.find(context.selectableItemsSelector)
				.prop('checked', select);
			if (select) {
				collectSelected(context);
			} else {
				context.selected = [];
			}
			render(context);
		}

		var MultiSelector = function(options) {
			this.context = $.extend({}, defaults, options || {});
			this.context.template = $.telligent.evolution.template(this.context.template);
			this.context.selected = [];

			this.initialContainerContent = this.context.container.children();

			var self = this;
			var messageHandlers = {
				'multiselect-action': function(data) {
					if($(data.target).is('.disabled'))
						return;
					self.context.onAction($(data.target).data('action'), self.context.selected);
				},
				'multiselect-select-all': function(data) {
					selectAll(self.context, true);
				},
				'multiselect-deselect-all': function(data) {
					selectAll(self.context, false);
				},
				'multiselect-cancel': function(data) {
					self.disable();
				}
			};
			for(var messageName in messageHandlers) {
				messaging.subscribe(messageName, messageHandlers[messageName]);
			}

			var self = this;
			this.context.selectableItemsContainer.on('change', this.selectableItemsSelector, function(e){
				collectSelected(self.context);
				render(self.context);
			});
		};

		MultiSelector.prototype.enable = function() {
			this.initialContainerContent.hide();
			this.context.selectableItemsContainer.addClass(this.context.selectEnabledClassName);
			selectAll(this.context, false);
			administration.header();
		};

		MultiSelector.prototype.disable = function() {
			this.initialContainerContent.show();
			this.context.selectableItemsContainer.removeClass(this.context.selectEnabledClassName);
			selectAll(this.context, false);
			if(this.context.rendered)
				this.context.rendered.remove();
			administration.header();
		};

		MultiSelector.prototype.refresh = function() {
			if(!this.context.rendered)
				return;

			collectSelected(this.context);
			render(this.context);
		};

		return MultiSelector;

	})();

	var Exporter = (function(){

		var Exporter = function(options){
			this.options = options;
		};

		// serializes either list of objects with id string properties or list of id strings
		function serializeRequests(requests) {
			var serializedParts = [];
			for(var i = 0; i < (requests || []).length; i++) {
				if (typeof requests[i] === 'string') {
					serializedParts.push(requests[i]);
				} else if(requests[i].id) {
					serializedParts.push(requests[i].id);
				}
			}
			return serializedParts.join(',');
		}

		Exporter.prototype.storeTemporaryExportList = function(requests) {
			var self = this;
			return $.telligent.evolution.post({
				url: self.options.storeTemporaryExportListUrl,
				data: {
					_w_ids: serializeRequests(requests)
				}
			});
		}

		/*
		requests: array of requests (StudioNavigator.request) or strings
		*/
		Exporter.prototype.exportResources = function(requests){
			var self = this;
			// if there are many requests, store them in temp data
			if(requests.length > 5) {
				// store the export list (potentially large) in temp storage
				this.storeTemporaryExportList(requests).then(function(temp){
					// then build a GET url that refers to the temp storage of the export list
					var url = $.telligent.evolution.url.modify({
						url: self.options.exportThemesUrl,
						query: {
							_w_idsStorageKey: temp.key,
							_w_mode: 'Resource'
						}
					});
					global.open(url);
				});
			} else {
				// if not many (don't bother with temp data)
				var url = $.telligent.evolution.url.modify({
					url: self.options.exportThemesUrl,
					query: {
						_w_ids: serializeRequests(requests),
						_w_mode: 'Resource'
					}
				});
				global.open(url);
			}
		};

		Exporter.prototype.exportAllResources = function(){
			var self = this;
			var url = $.telligent.evolution.url.modify({
				url: self.options.exportThemesUrl,
				query: {
					_w_mode: 'Resource'
				}
			});
			global.open(url);
		};

		/*
		requests: array of requests (StudioNavigator.request) or strings
		*/
		Exporter.prototype.exportThemes = function(requests){
			var self = this;
			// if there are many requests, store them in temp data
			if(requests.length > 5) {
				// store the export list (potentially large) in temp storage
				this.storeTemporaryExportList(requests).then(function(temp){
					// then build a GET url that refers to the temp storage of the export list
					var url = $.telligent.evolution.url.modify({
						url: self.options.exportThemesUrl,
						query: {
							_w_idsStorageKey: temp.key,
							_w_mode: 'Theme'
						}
					});
					global.open(url);
				});
			} else {
				// if not many (don't bother with temp data)
				var url = $.telligent.evolution.url.modify({
					url: self.options.exportThemesUrl,
					query: {
						_w_ids: serializeRequests(requests),
						_w_mode: 'Theme'
					}
				});
				global.open(url);
			}
		};

		Exporter.prototype.exportAllThemes = function() {
			var self = this;
			var url = $.telligent.evolution.url.modify({
				url: self.options.exportThemesUrl,
				query: {
					_w_mode: 'Theme'
				}
			});
			global.open(url);
		};

		return Exporter;

	})();

	function serializeThemes(themes) {
		return (themes || []).map(function(f) {
			return (f.id || '') + '|' + (f.typeId || '');
		}).join(',');
	}

	function publishTheme(context, options) {
		administration.loading(true);
		var data = {
			_w_id: options.id
		};

		if (options.typeId) {
			data._w_typeId = options.typeId
		}

		return $.telligent.evolution.post({
			url: context.publishCallbackUrl,
			data: data
		}).then(function(r){
			messaging.publish('theme-edited', $.extend(r, options));
			$.telligent.evolution.administration.refreshBadges();
		}).always(function(){ administration.loading(false) });
	}

	function publishThemes(context, options) {
		return loadWithProgress($.telligent.evolution.post({
			url: context.publishMultiCallbackUrl,
			data: {
				_w_ids: serializeThemes(options.themes)
			}
		})).then(function(r){
			r.themes.forEach(function(theme) {
				messaging.publish('theme-edited', $.extend(theme, {
					id: theme.id.Id,
					typeId: theme.id.TypeId,
					stagedCount: r.stagedCount
				}));
			});
			$.telligent.evolution.administration.refreshBadges();
			return r;
		}).always(function(){ administration.loading(false) });
	}

	function setAsDefaultTheme(context, options) {
		administration.loading(true);
		var data = {
			_w_id: options.id,
			_w_typeId: options.typeId
		};

		return $.telligent.evolution.post({
			url: context.defaultCallbackUrl,
			data: data
		}).always(function(){ administration.loading(false) });
	}

	function revertTheme(context, options) {
		administration.loading(true);
		var data = {
			_w_id: options.id
		};

		if (options.typeId)
			data._w_typeId = options.typeId;
		if (options.revertStagedPages)
			data._w_revertStagedPages = options.revertStagedPages;
		if (options.revertStagedHeaders)
			data._w_revertStagedHeaders = options.revertStagedHeaders;
		if (options.revertStagedFooters)
			data._w_revertStagedFooters = options.revertStagedFooters;
		if (options.revertStagedFragments)
			data._w_revertStagedFragments = options.revertStagedFragments;

		return $.telligent.evolution.post({
			url: context.revertCallbackUrl,
			data: data
		}).then(function(resultResponse){
			if (resultResponse.reverted) {
				messaging.publish('theme-edited', $.extend(resultResponse, options));
			} else {
				showRevertChildrenPanel(context, {
					themeId: options.id,
					themeTypeId: options.typeId,
					children: resultResponse.revertibleChildren
				});
			}
			$.telligent.evolution.administration.refreshBadges();
		}).always(function(){ administration.loading(false) });
	}

	function revertThemes(context, options) {
		var data = {
			_w_ids: (options.serializedThemes || serializeThemes(options.themes))
		};

		if (options.revertStagedPages)
			data._w_revertStagedPages = options.revertStagedPages;
		if (options.revertStagedHeaders)
			data._w_revertStagedHeaders = options.revertStagedHeaders;
		if (options.revertStagedFooters)
			data._w_revertStagedFooters = options.revertStagedFooters;
		if (options.revertStagedFragments)
			data._w_revertStagedFragments = options.revertStagedFragments;

		return loadWithProgress($.telligent.evolution.post({
			url: context.revertMultiCallbackUrl,
			data: data
		})).then(function(resultResponse){
			if (resultResponse.success) {
				//messaging.publish('theme-edited', $.extend(resultResponse, options));
				resultResponse.themes.forEach(function(theme) {
					messaging.publish('theme-edited', $.extend(theme, {
						id: theme.id.Id,
						typeId: theme.id.TypeId,
						stagedCount: resultResponse.stagedCount
					}));
				});
			} else {
				showRevertChildrenPanel(context, {
					serializedThemes: serializeThemes(options.themes),
					children: resultResponse.revertibleChildren
				});
			}
			$.telligent.evolution.administration.refreshBadges();
			return resultResponse;
		}).always(function(){ administration.loading(false) });
	}

	function deleteTheme(context, options) {
		administration.loading(true);
		var data = {
			_w_id: options.id
		};

		if (options.typeId)
			data._w_typeId = options.typeId
		if (options.revertStagedPages)
			data._w_revertStagedPages = options.revertStagedPages;
		if (options.revertStagedHeaders)
			data._w_revertStagedHeaders = options.revertStagedHeaders;
		if (options.revertStagedFooters)
			data._w_revertStagedFooters = options.revertStagedFooters;
		if (options.revertStagedFragments)
			data._w_revertStagedFragments = options.revertStagedFragments;

		return $.telligent.evolution.post({
			url: context.deleteCallbackUrl,
			data: data
		}).then(function(resultResponse){
			if (resultResponse.success) {
				messaging.publish('theme-edited', $.extend(resultResponse, options));
			} else {
				showRevertChildrenPanel(context, {
					themeId: options.id,
					themeTypeId: options.typeId,
					children: resultResponse.revertibleChildren
				});
			}
			$.telligent.evolution.administration.refreshBadges();
		}).always(function(){ administration.loading(false) });
	}

	function queriesMatch(queryA, queryB, forceAllStaged) {
		var isMatch = (queryA && queryB &&
			queryA.typeId == queryB.typeId &&
			queryA.state == queryB.state &&
			queryA.query == queryB.query);
		if (!forceAllStaged) {
			isMatch = isMatch && (queryA.isStaged == queryB.isStaged)
		}
		return isMatch;
	}

	function listThemes(context, pageIndex, forceAllStaged) {
		var listQuery = $.extend({}, context.listQueryContext, {
			pageIndex: pageIndex,
			pageSize: context.pageSize
		});

		if (forceAllStaged) {
			listQuery.isStaged = forceAllStaged;
			delete listQuery.pageIndex;
			delete listQuery.pageSize;
		}

		return $.telligent.evolution.get({
			url: context.listCallbackUrl,
			data: listQuery
		}).then(function(r){
			return queriesMatch(listQuery, context.listQueryContext, forceAllStaged) ? r : null;
		});
	}

	function showRevertOptionsPanel(context, options) {
		administration.open({
			name: context.revertLayoutAndOptionsText,
			content: $.telligent.evolution.get({
				url: context.revertOptionsPanelUrl,
				data: {
					_w_id: options.id,
					_w_typeId: options.typeId
				}
			})
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
		})).then(function(result){
			administration.open({
				name: context.importThemesText,
				cssClass: 'themes import',
				content: result.panelContent
			});
		});
	}

	// options
	//   themeId
	//   themeTypeId
	//   children
	//   serializedThemes
	function showRevertChildrenPanel(context, options) {
		administration.open({
			name: context.revertChildrenText,
			cssClass: 'themes revert',
			header: $.telligent.evolution.template(context.headerRevertChildrenTemplateId)({
				themeId: options.themeId,
				themeTypeId: options.themeTypeId,
				serializedThemes: options.serializedThemes
			}),
			content: $.telligent.evolution.template(context.revertChildrenTemplateId)({
				children: options.children
			})
		});
	}

	function showPreviewPanel(context, id, typeId) {
		administration.open({
			name: 'Preview Theme',//context.importThemesText,
			cssClass: 'themes preview',
			content: $.telligent.evolution.get({
				url: context.previewPanelUrl,
				data: {
					_w_id: id,
					_w_typeId: typeId
				}
			})
		});
	}

	var api = {
		loadWithProgress: loadWithProgress,
		register: function(options) {

			var context = $.extend(options, {
				themesList: $(options.themesListId),

				typeSelect: $(options.typeSelectId),
				stateSelect: $(options.stateSelectId),
				publishSelect: $(options.publishSelectId),
				searchInput: $(options.searchInputId),
				stagingMessage: $(options.stagingMessageId),

				listQueryContext: {}
			});

			context.exporter = new Exporter({
				exportThemesUrl: context.exportCallbackUrl,
				storeTemporaryExportListUrl: context.exportStoreCallbackUrl
			});

			// header
			administration.header(
				$.telligent.evolution.template(context.headerTemplateId)({}));

			// paging
			context.scrollableResults = administration.scrollable({
				target: context.themesList,
				load: function(pageIndex) {
					return $.Deferred(function(d){
						listThemes(context, pageIndex).then(function(r){
							if (!r)
								d.reject();
							// if there was more content, resolve it as true to continue loading
							if($.trim(r.renderedItems).length > 0) {
								context.themesList.append(r.renderedItems);
								d.resolve();
							} else {
								d.reject();
								// if still the first page, then show the 'no content message'
								if(pageIndex === 0) {
									context.themesList.append('<div class="message norecords">' + context.noThemesText + '</div>');
								}
							}
						}).catch(function(){
							d.reject();
						})
					});
				}
			});

			// filtering
			context.publishSelect.on('change', function() {
				var val = context.publishSelect.val();
				if(val == 'published') {
					context.listQueryContext.isStaged = false;
				} else if(val == 'staged') {
					context.listQueryContext.isStaged = true;
				} else {
					delete context.listQueryContext.isStaged;
				}
				context.themesList.empty();
				context.scrollableResults.reset();
			});

			context.typeSelect.on('change', function() {
				var val = context.typeSelect.val();
				if(val == 'all') {
					delete context.listQueryContext.typeId;
				} else {
					context.listQueryContext.typeId = val;
				}
				context.themesList.empty();
				context.scrollableResults.reset();
			});

			context.stateSelect.on('change', function() {
				var val = context.stateSelect.val();
				if(val == 'all') {
					delete context.listQueryContext.state;
				} else {
					context.listQueryContext.state = val;
				}
				context.themesList.empty();
				context.scrollableResults.reset();
			});

			// searching
			var searchTimeout;
			context.searchInput.on('input', function(){
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(function() {
					context.listQueryContext.query = context.searchInput.val();
					context.themesList.empty();
					context.scrollableResults.reset();
				}, 150);
			});

			// multiselect
			context.multiSelector = new MultiSelector({
				actions: [
					{ label: context.exportText, message: 'export' },
					{ label: context.exportResourcesText, message: 'exportresources' }
				],
				onAction: function(message, selected) {
					switch(message) {
						case 'export':
							context.exporter.exportThemes(selected, true);
							break;
						case 'exportresources':
							context.exporter.exportResources(selected, true);
							break;
					}
				},
				container: administration.header().find('.panelheader-list').first(),
				selectableItemsContainer: administration.panelWrapper().find('.content-list.themes').first(),
				template: context.multiSelectorTemplateId,
				onGetId: function(elm) {
					var typeId = $(elm).data('typeid');
					if (typeId && typeId.length > 0) {
						return $(elm).data('id') + ':' + typeId;
					} else {
						return $(elm).data('id');
					}
				}
			});

			// upload
			context.uploader = new Uploader({
				container: administration.panelWrapper(),
				uploadContextId: context.uploadContextId,
				uploadUrl: context.uploadUrl
			});

			// events + handlers
			var messageHandlers = {
				'theme-export': function(data){
					var typeId = $(data.target).data('typeid');
					var id = $(data.target).data('id');
					var id = typeId && typeId.length > 0 ? id + ':' + typeId : id;
					context.exporter.exportThemes([ id ]);
				},
				'theme-exportresources': function(data) {
					var typeId = $(data.target).data('typeid');
					var id = $(data.target).data('id');
					var id = typeId && typeId.length > 0 ? id + ':' + typeId : id;
					context.exporter.exportResources([ id ]);
				},
				'theme-exportall': function(data) {
					context.exporter.exportAllThemes();
				},
				'theme-exportallresources': function(data) {
					context.exporter.exportAllResources();
				},
				'theme-multiselect': function(data) {
					context.multiSelector.enable();
				},
				'theme-upload': function(data) {
					context.uploader.upload().then(function(file){
						showImportPanel(context, file.context, file.name);
					});
				},
				'theme-imported': function(data) {
					administration.refresh();
					$.telligent.evolution.administration.refreshBadges();
				},
				'theme-preview': function(data) {
					var typeId = data.typeId || $(data.target).data('typeid');
					var id = data.id || $(data.target).data('id');
					showPreviewPanel(context, id, typeId);
				},
				'theme-delete': function(data) {
					deleteTheme(context, {
						id: $(data.target).data('id'),
						typeId: $(data.target).data('typeid')
					});
				},
				'theme-publish': function(data) {
					if (confirm(context.publishConfirmText)) {
						publishTheme(context, {
							id: $(data.target).data('id'),
							typeId: $(data.target).data('typeid')
						});
					}
				},
				'theme-revert': function(data) {
					if (confirm(context.revertConfirmText)) {
						revertTheme(context, {
							id: $(data.target).data('id'),
							typeId: $(data.target).data('typeid')
						});
					}
				},
				'theme-edited': function(data) {
					administration.close();
					var listItem = context.themesList.find('.theme[data-id="' + data.id + '"][data-typeid="' + (data.typeId || '') + '"]');
					// model still exists in some way, so represents an update
					if (data.theme) {
						var wasSelected = listItem.hasClass('expanded');
						listItem
							.removeClass('expanded')
							.empty()
							.append(data.renderedTheme);
						listItem.find('.actions.expandable .navigation-list').first().uilinks('reconfigure');
						if(data.multiSelect) {
							listItem.find('input[type="checkbox"]').prop('checked', true);
						}
						if (wasSelected) {
							listItem.trigger('click');
						}
					// if not updated, publish represents a published removal
					} else {
						listItem.remove();
					}
					if (data.stagedCount > 0) {
						context.stagingMessage.show();
					} else {
						context.stagingMessage.hide();
					}

					context.multiSelector.refresh();
				},
				'theme-reviewstaging': function(data) {
					context.publishSelect.val('staged').trigger('change');
				},
				'theme-publish-all': function(data) {
					if(confirm(context.publishAllConfirmText)) {
						listThemes(context, null, true).then(function(r){
							publishThemes(context, {
								themes: r.items.map(function(f){
									return {
										id: f.Id,
										typeId: f.TypeId
									};
								})
							}).always(function(){ administration.loading(false) })
						})
					}
				},
				'theme-revert-all': function(data) {
					if(confirm(context.revertAllConfirmText)) {
						listThemes(context, null, true).then(function(r){
							revertThemes(context, {
								themes: r.items.map(function(f){
									return {
										id: f.Id,
										typeId: f.TypeId
									};
								})
							}).always(function(){ administration.loading(false) })
						});
					}
				},
				'theme-revert-children': function(data) {
					var serializedThemes = $(data.target).data('ids');
					var id = $(data.target).data('id');
					var typeId = $(data.target).data('typeid');
					if (serializedThemes) {
						revertThemes(context, {
							serializedThemes: serializedThemes,
							revertStagedPages: administration.panelWrapper().find('input[data-type="pages"]').is(':checked'),
							revertStagedHeaders: administration.panelWrapper().find('input[data-type="headers"]').is(':checked'),
							revertStagedFooters: administration.panelWrapper().find('input[data-type="footers"]').is(':checked'),
							revertStagedFragments: administration.panelWrapper().find('input[data-type="fragments"]').is(':checked')
						});
					} else {
						revertTheme(context, {
							id: $(data.target).data('id'),
							typeId: $(data.target).data('typeid'),
							revertStagedHeaders: administration.panelWrapper().find('input[data-type="headers"]').is(':checked'),
							revertStagedFooters: administration.panelWrapper().find('input[data-type="footers"]').is(':checked'),
							revertStagedPages: administration.panelWrapper().find('input[data-type="pages"]').is(':checked'),
							revertStagedFragments: administration.panelWrapper().find('input[data-type="fragments"]').is(':checked')
						});
					}
				},
				'theme-revert-children-cancel': function(data) {
					administration.close();
				},
				'theme-revert-options': function(data) {
					var id = $(data.target).data('id');
					var typeId = $(data.target).data('typeid');
					showRevertOptionsPanel(context, {
						id: id,
						typeId: typeId
					});
				},
				'set-default': function(data) {
					var target = $(data.target);
					var themeId = target.data('id');
					var themeTypeId = target.data('typeid');

					setAsDefaultTheme(context, {
						id: themeId,
						typeId: themeTypeId
					}).then(function(r) {
						context.themesList.find('.theme[data-typeid="' + (themeTypeId || '') + '"]').find('.default-state').removeClass('is-default');
						context.themesList.find('.theme[data-typeid="' + (themeTypeId || '') + '"][data-id="' + themeId + '"]').find('.default-state').addClass('is-default');
					});
				}
			};
			for(var messageName in messageHandlers) {
				messaging.subscribe(messageName, messageHandlers[messageName]);
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.themes = $.telligent.evolution.themes || {};
	$.telligent.evolution.themes.themeAdministration = api;

})(jQuery, window);
