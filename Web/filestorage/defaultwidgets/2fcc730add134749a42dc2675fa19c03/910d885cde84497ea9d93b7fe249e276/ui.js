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
						url: self.options.exportFragmentsUrl,
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
					url: self.options.exportFragmentsUrl,
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
				url: self.options.exportFragmentsUrl,
				query: {
					_w_mode: 'Resource'
				}
			});
			global.open(url);
		};

		/*
		requests: array of requests (StudioNavigator.request) or strings
		*/
		Exporter.prototype.exportFragments = function(requests){
			var self = this;
			// if there are many requests, store them in temp data
			if(requests.length > 5) {
				// store the export list (potentially large) in temp storage
				this.storeTemporaryExportList(requests).then(function(temp){
					// then build a GET url that refers to the temp storage of the export list
					var url = $.telligent.evolution.url.modify({
						url: self.options.exportFragmentsUrl,
						query: {
							_w_idsStorageKey: temp.key,
							_w_mode: 'Fragment'
						}
					});
					global.open(url);
				});
			} else {
				// if not many (don't bother with temp data)
				var url = $.telligent.evolution.url.modify({
					url: self.options.exportFragmentsUrl,
					query: {
						_w_ids: serializeRequests(requests),
						_w_mode: 'Fragment'
					}
				});
				global.open(url);
			}
		};

		Exporter.prototype.exportAllFragments = function() {
			var self = this;
			var url = $.telligent.evolution.url.modify({
				url: self.options.exportFragmentsUrl,
				query: {
					_w_mode: 'Fragment'
				}
			});
			global.open(url);
		};

		return Exporter;

	})();

	function serializeFragments(fragments) {
		return (fragments || []).map(function(f) {
			return (f.id || '') + '|' + (f.themeId || '');
		}).join(',');
	}

	function publishFragment(context, options) {
		administration.loading(true);
		var data = {
			_w_id: options.id
		};

		if (options.themeId) {
			data._w_themeId = options.themeId
		}

		return $.telligent.evolution.post({
			url: context.publishCallbackUrl,
			data: data
		}).then(function(r){
			messaging.publish('fragment-edited', $.extend(r, options));
			$.telligent.evolution.administration.refreshBadges();
		}).always(function(){ administration.loading(false) });
	}

	function publishFragments(context, options) {
		return loadWithProgress($.telligent.evolution.post({
			url: context.publishMultiCallbackUrl,
			data: {
				_w_ids: serializeFragments(options.fragments)
			}
		})).then(function(r){
			r.fragments.forEach(function(fragment) {
				messaging.publish('fragment-edited', $.extend(fragment, {
					id: fragment.id.InstanceIdentifier,
					themeId: fragment.id.ThemeId,
					stagedCount: r.stagedCount
				}));
			});
			$.telligent.evolution.administration.refreshBadges();
			return r;
		}).always(function(){
			if (!context.bulkPublish)
				administration.loading(false)
		});
	}

	function revertFragment(context, options) {
		administration.loading(true);
		var data = {
			_w_id: options.id
		};

		if (options.themeId) {
			data._w_themeId = options.themeId
		}

		return $.telligent.evolution.post({
			url: context.revertCallbackUrl,
			data: data
		}).then(function(r){
			messaging.publish('fragment-edited', $.extend(r, options));
			$.telligent.evolution.administration.refreshBadges();
		}).always(function(){ administration.loading(false) });
	}

	function revertFragments(context, options) {
		return loadWithProgress($.telligent.evolution.post({
			url: context.revertMultiCallbackUrl,
			data: {
				_w_ids: serializeFragments(options.fragments)
			}
		})).then(function(r){
			r.fragments.forEach(function(fragment) {
				messaging.publish('fragment-edited', $.extend(fragment, {
					id: fragment.id.InstanceIdentifier,
					themeId: fragment.id.ThemeId,
					stagedCount: r.stagedCount
				}));
			});
			$.telligent.evolution.administration.refreshBadges();
			return r;
		}).always(function(){
			if (!context.bulkPublish)
				administration.loading(false)
		});
	}

	function deleteFragment(context, options) {
		administration.loading(true);
		var data = {
			_w_id: options.id
		};

		if (options.themeId) {
			data._w_themeId = options.themeId
		}

		return $.telligent.evolution.post({
			url: context.deleteCallbackUrl,
			data: data
		}).then(function (r) {
			$.telligent.evolution.administration.refreshBadges();
			messaging.publish('fragment-edited', $.extend(r, options));
		}).always(function(){ administration.loading(false) });
	}

	function queriesMatch(queryA, queryB, forceAllStaged) {
		var isMatch = (queryA && queryB &&
			queryA.factoryDefaultProvider == queryB.factoryDefaultProvider &&
			queryA.themeId == queryB.themeId &&
			queryA.state == queryB.state &&
			queryA.query == queryB.query);
		if (!forceAllStaged) {
			isMatch = isMatch && (queryA.isStaged == queryB.isStaged)
		}
		return isMatch;
	}

	function listFragments(context, pageIndex, forceAllStaged) {
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
				name: context.importFragmentsText,
				cssClass: 'configured-fragments import',
				content: result.panelContent
			});
		})
	}

	function showAvailabilityPanel(context, id, themeId, name) {
		var data = {};
		if(id) {
			data._w_id = id;
		}
		if(themeId) {
			data._w_themeId = themeId;
		}
		$.telligent.evolution.administration.open({
			name: name,
			cssClass: 'fragment form',
			content: $.telligent.evolution.get({
				url: context.availabilityPanelUrl,
				data: data
			})
		});
	}

	function showReplacementPanel(context, id, themeId, name) {
		var data = {};
		if(id) {
			data._w_id = id;
		}
		if(themeId) {
			data._w_themeId = themeId;
		}
		$.telligent.evolution.administration.open({
			name: name,
			cssClass: 'fragment form',
			content: $.telligent.evolution.get({
				url: context.replacePanelUrl,
				data: data
			})
		});
	}

	var api = {
		loadWithProgress: loadWithProgress,
		register: function(options) {

			var context = $.extend(options, {
				fragmentsList: $(options.fragmentsListId),

				providerSelect: $(options.providerSelectId),
				themeSelect: $(options.themeSelectId),
				stateSelect: $(options.stateSelectId),
				publishSelect: $(options.publishSelectId),
				searchInput: $(options.searchInputId),
				stagingMessage: $(options.stagingMessageId),

				listQueryContext: {}
			});

			context.exporter = new Exporter({
				exportFragmentsUrl: context.exportCallbackUrl,
				storeTemporaryExportListUrl: context.exportStoreCallbackUrl
			});

			// header
			administration.header(
				$.telligent.evolution.template(context.headerTemplateId)({}));

			// paging
			context.scrollableResults = administration.scrollable({
				target: context.fragmentsList,
				load: function(pageIndex) {
					return $.Deferred(function(d){
						listFragments(context, pageIndex).then(function(r){
							if (!r)
								d.reject();
							// if there was more content, resolve it as true to continue loading
							if($.trim(r.renderedItems).length > 0) {
								context.fragmentsList.append(r.renderedItems);
								d.resolve();
							} else {
								d.reject();
								// if still the first page, then show the 'no content message'
								if(pageIndex === 0) {
									context.fragmentsList.append('<div class="message norecords">' + context.noFragmentsText + '</div>');
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
				context.fragmentsList.empty();
				context.scrollableResults.reset();
			});

			context.providerSelect.on('change', function() {
				var val = context.providerSelect.val();
				if(val == 'all') {
					delete context.listQueryContext.factoryDefaultProvider;
				} else {
					context.listQueryContext.factoryDefaultProvider = val;
				}
				context.fragmentsList.empty();
				context.scrollableResults.reset();
			});

			context.themeSelect.on('change', function() {
				var val = context.themeSelect.val();
				if(val == 'all') {
					delete context.listQueryContext.themeId;
				} else {
					context.listQueryContext.themeId = val;
				}
				context.fragmentsList.empty();
				context.scrollableResults.reset();
			});

			context.stateSelect.on('change', function() {
				var val = context.stateSelect.val();
				if(val == 'all') {
					delete context.listQueryContext.state;
				} else {
					context.listQueryContext.state = val;
				}
				context.fragmentsList.empty();
				context.scrollableResults.reset();
			});

			// searching
			var searchTimeout;
			context.searchInput.on('input', function(){
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(function() {
					context.listQueryContext.query = context.searchInput.val();
					context.fragmentsList.empty();
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
							context.exporter.exportFragments(selected, true);
							break;
						case 'exportresources':
							context.exporter.exportResources(selected, true);
							break;
					}
				},
				container: administration.header().find('.panelheader-list').first(),
				selectableItemsContainer: administration.panelWrapper().find('.content-list.fragments').first(),
				template: context.multiSelectorTemplateId,
				onGetId: function(elm) {
					var themeId = $(elm).data('themeid');
					if (themeId && themeId.length > 0) {
						return $(elm).data('id') + ':' + themeId;
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
				'fragment-export': function(data){
					var themeId = $(data.target).data('themeid');
					var id = $(data.target).data('id');
					var id = themeId && themeId.length > 0 ? id + ':' + themeId : id;
					context.exporter.exportFragments([ id ]);
				},
				'fragment-exportresources': function(data) {
					var themeId = $(data.target).data('themeid');
					var id = $(data.target).data('id');
					var id = themeId && themeId.length > 0 ? id + ':' + themeId : id;
					context.exporter.exportResources([ id ]);
				},
				'fragment-exportall': function(data) {
					context.exporter.exportAllFragments();
				},
				'fragment-exportallresources': function(data) {
					context.exporter.exportAllResources();
				},
				'fragment-multiselect': function(data) {
					context.multiSelector.enable();
				},
				'fragment-upload': function(data) {
					context.uploader.upload().then(function(file){
						showImportPanel(context, file.context, file.name);
					});
				},
				'fragment-imported': function(data) {
					administration.refresh();
				},
				'fragment-preview': function(data) {
					var sampleUrl = $(data.target).data('sampleurl');
					var stage = $(data.target).data('staged');
					if (sampleUrl && sampleUrl.length > 0) {
						if (stage) {
							$.telligent.evolution.themePreview.enabled(true).then(function(){
								global.open(sampleUrl, '_blank');
							});
						} else {
							global.open(sampleUrl, '_blank');
						}
					}
				},
				'fragment-delete': function(data) {
					deleteFragment(context, {
						id: $(data.target).data('id'),
						themeId: $(data.target).data('themeid')
					});
				},
				'fragment-publish': function(data) {
					if (confirm(context.publishConfirmText)) {
						publishFragment(context, {
							id: $(data.target).data('id'),
							themeId: $(data.target).data('themeid')
						});
					}
				},
				'fragment-revert': function(data) {
					if (confirm(context.revertConfirmText)) {
						revertFragment(context, {
							id: $(data.target).data('id'),
							themeId: $(data.target).data('themeid')
						});
					}
				},
				'fragment-edit': function(data){
					var listItem = $(data.target).closest('.content-item.fragment');
					showAvailabilityPanel(context, listItem.data('id'), listItem.data('themeid'), listItem.data('availabilitytitle'));
				},
				'fragment-replace': function(data){
					var listItem = $(data.target).closest('.content-item.fragment');
					showReplacementPanel(context, listItem.data('id'), listItem.data('themeid'), listItem.data('replacementtitle'));
				},
				'fragment-edited': function(data) {
					administration.close();
					var listItem = context.fragmentsList.find('.fragment[data-id="' + data.id + '"][data-themeid="' + (data.themeId || '') + '"]');
					// model still exists in some way, so represents an update
					if (data.fragment) {
						var wasSelected = listItem.hasClass('expanded');
						listItem
							.removeClass('expanded')
							.empty()
							.append(data.renderedFragment);
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
				'fragment-reviewstaging': function(data) {
					context.publishSelect.val('staged').trigger('change');
				},
				'fragment-publish-all': function(data) {
					if(confirm(context.publishAllConfirmText)) {
						listFragments(context, null, true).then(function(r){
							publishFragments(context, {
								fragments: r.items.map(function(f){
									return {
										id: f.InstanceIdentifier,
										themeId: f.ThemeId
									};
								})
							}).then(function(){
								context.bulkPublish = false;
								administration.loading(false);
							});
						});
						context.bulkPublish = true;
					}
				},
				'fragment-revert-all': function(data) {
					if(confirm(context.revertAllConfirmText)) {
						listFragments(context, null, true).then(function(r){
							revertFragments(context, {
								fragments: r.items.map(function(f){
									return {
										id: f.InstanceIdentifier,
										themeId: f.ThemeId
									};
								})
							}).then(function(){
								context.bulkPublish = false;
								administration.loading(false);
							});
						});
						context.bulkPublish = true;
					}
				}
			};
			for(var messageName in messageHandlers) {
				messaging.subscribe(messageName, messageHandlers[messageName]);
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.fragmentAdministration = api;

})(jQuery, window);
