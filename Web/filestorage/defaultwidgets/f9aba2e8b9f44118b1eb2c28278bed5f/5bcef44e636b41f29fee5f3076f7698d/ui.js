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
						url: self.options.exportAutomationsUrl,
						query: {
							_w_idsStorageKey: temp.key,
							_w_mode: 'ResourcesForConfiguration'
						}
					});
					global.open(url);
				});
			} else {
				// if not many (don't bother with temp data)
				var url = $.telligent.evolution.url.modify({
					url: self.options.exportAutomationsUrl,
					query: {
						_w_ids: serializeRequests(requests),
						_w_mode: 'ResourcesForConfiguration'
					}
				});
				global.open(url);
			}
		};

		Exporter.prototype.exportAllResources = function(){
			var self = this;
			var url = $.telligent.evolution.url.modify({
				url: self.options.exportAutomationsUrl,
				query: {
					_w_mode: 'ResourcesForConfiguration'
				}
			});
			global.open(url);
		};

		/*
		requests: array of requests (StudioNavigator.request) or strings
		*/
		Exporter.prototype.exportAutomations = function(requests, includeConfiguration){
			var self = this;
			// if there are many requests, store them in temp data
			if(requests.length > 5) {
				// store the export list (potentially large) in temp storage
				this.storeTemporaryExportList(requests).then(function(temp){
					// then build a GET url that refers to the temp storage of the export list
					var url = $.telligent.evolution.url.modify({
						url: self.options.exportAutomationsUrl,
						query: {
							_w_idsStorageKey: temp.key,
							_w_mode: includeConfiguration ? 'Configuration' : 'Definition'
						}
					});
					global.open(url);
				});
			} else {
				// if not many (don't bother with temp data)
				var url = $.telligent.evolution.url.modify({
					url: self.options.exportAutomationsUrl,
					query: {
						_w_ids: serializeRequests(requests),
						_w_mode: includeConfiguration ? 'Configuration' : 'Definition'
					}
				});
				global.open(url);
			}
		};

		Exporter.prototype.exportAllAutomations = function(includeConfiguration) {
			var self = this;
			var url = $.telligent.evolution.url.modify({
				url: self.options.exportAutomationsUrl,
				query: {
					_w_mode: includeConfiguration ? 'Configuration' : 'Definition'
				}
			});
			global.open(url);
		};

		return Exporter;

	})();

	function setMultiEnablement(context, configuredAutomationIds, enable) {
		administration.loading(true);
		return $.telligent.evolution.post({
			url: context.multiEnableCallbackUrl,
			data: {
				ids: (configuredAutomationIds || []).join(','),
				enable: enable
			}
		}).always(function(){ administration.loading(false) });
	}

	function deleteConfiguredAutomation(context, configuredAutomationId) {
		administration.loading(true);
		return $.telligent.evolution.post({
			url: context.deleteCallbackUrl,
			data: {
				id: configuredAutomationId
			}
		}).always(function(){ administration.loading(false) });
	}

	function deleteConfiguredAutomations(context, configuredAutomationIds) {
		administration.loading(true);
		return $.telligent.evolution.post({
			url: context.deleteCallbackUrl,
			data: {
				ids: (configuredAutomationIds || []).join(',')
			}
		}).always(function(){ administration.loading(false) });
	}

	function saveConfiguredAutomation(context, options) {
		administration.loading(true);
		return $.telligent.evolution.post({
			url: context.saveCallbackUrl,
			data: options
		}).always(function(){ administration.loading(false) });
	}

	function queriesMatch(queryA, queryB) {
		return (queryA && queryB &&
			queryA.enabled == queryB.enabled &&
			queryA.automationid == queryB.automationid &&
			queryA.query == queryB.query);
	}

	function listConfiguredAutomations(context, pageIndex) {
		var listQuery = $.extend({}, context.listQueryContext, {
			pageIndex: pageIndex
		});

		return $.telligent.evolution.get({
			url: context.listCallbackUrl,
			data: listQuery
		}).then(function(r){
			return queriesMatch(listQuery, context.listQueryContext) ? r.list : null;
		});
	}

	function enableMultipleConfiguredAutomations(context, configuredAutomationIds, enable) {
		return setMultiEnablement(context, configuredAutomationIds, enable).then(function(response){
			if(response && response.savedAutomations) {
				for (var i = 0; i < response.savedAutomations.length; i++) {
					var automation = response.savedAutomations[i];
					automation.preventExpansion = true;
					automation.multiSelect = true;
					messaging.publish('configuredautomation-edited', automation);
				}
			}
		});
	}

	function enableConfiguredAutomation(context, configuredAutomationId, enable) {
		return saveConfiguredAutomation(context, {
			id: configuredAutomationId,
			enabled: enable
		}).then(function(response) {
			if (!response.isNew)
				messaging.publish('configuredautomation-edited', response);
		});
	}

	function showAddEditPanel(context, configuredAutomationId, configuredAutomationName) {
		var data = {};
		if(configuredAutomationId) {
			data.configuredAutomationId = configuredAutomationId;
		}
		administration.open({
			name: configuredAutomationName,
			cssClass: 'configured-automations form',
			content: $.telligent.evolution.get({
				url: context.addEditPanelUrl,
				data: data
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
				name: context.importAutomationsText,
				cssClass: 'configured-automations import',
				content: result.panelContent
			});
		});
	}

	var api = {
		loadWithProgress: loadWithProgress,
		register: function(options) {

			var context = $.extend(options, {
				configuredAutomationsList: $(options.configuredAutomationsListId),
				searchInput: $(options.searchInputId),
				filterSelect: $(options.filterSelectId),
				automationSelect: $(options.automationSelectId),
				listQueryContext: {}
			});

			context.exporter = new Exporter({
				exportAutomationsUrl: context.exportCallbackUrl,
				storeTemporaryExportListUrl: context.exportStoreCallbackUrl
			});

			// header
			administration.header(
				$.telligent.evolution.template(context.headerTemplateId)({}));

			// paging
			context.scrollableResults = administration.scrollable({
				target: context.configuredAutomationsList,
				load: function(pageIndex) {
					return $.Deferred(function(d){
						listConfiguredAutomations(context, pageIndex).then(function(r){
							if (!r)
								d.reject();

							// if there was more content, resolve it as true to continue loading
							if($.trim(r).length > 0) {
								context.configuredAutomationsList.append(r);
								d.resolve();
							} else {
								d.reject();
								// if still the first page, then show the 'no content message'
								if(pageIndex === 0) {
									context.configuredAutomationsList.append('<div class="message norecords">' + context.noConfiguredAutomationsText + '</div>');
								}
							}
						}).catch(function(){
							d.reject();
						})
					});
				}
			});

			// filtering
			context.filterSelect.on('change', function() {
				var val = context.filterSelect.val();
				if(val == 'enabled') {
					context.listQueryContext.enabled = true;
				} else if(val == 'disabled') {
					context.listQueryContext.enabled = false;
				} else {
					delete context.listQueryContext.enabled;
				}
				context.configuredAutomationsList.empty();
				context.scrollableResults.reset();
			});

			context.automationSelect.on('change', function() {
				var val = context.automationSelect.val();
				if(val == 'all') {
					delete context.listQueryContext.automationid;
				} else {
					context.listQueryContext.automationid = val;
				}
				context.configuredAutomationsList.empty();
				context.scrollableResults.reset();
			});

			// searching
			var searchTimeout;
			context.searchInput.on('input', function(){
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(function() {
					context.listQueryContext.query = context.searchInput.val();
					context.configuredAutomationsList.empty();
					context.scrollableResults.reset();
				}, 150);
			});

			// multiselect
			context.multiSelector = new MultiSelector({
				actions: [
					{ label: context.enableText, message: 'enable' },
					{ label: context.disableText, message: 'disable' },
					{ label: context.exportText, message: 'export' },
					{ label: context.exportResourcesText, message: 'exportresources' },
					{ label: context.deleteText, message: 'delete' }
				],
				onAction: function(message, selected) {
					switch(message) {
						case 'enable':
							enableMultipleConfiguredAutomations(context, selected, true);
							break;
						case 'disable':
							enableMultipleConfiguredAutomations(context, selected, false);
							break;
						case 'export':
							context.exporter.exportAutomations(selected, true);
							break;
						case 'exportresources':
							context.exporter.exportResources(selected, true);
							break;
						case 'delete':
							if(confirm(context.confirmDeleteMultipleText)) {
								deleteConfiguredAutomations(context, selected).then(function(r){
									for (var i = 0; i < selected.length; i++) {
										context.configuredAutomationsList.find('.configuredautomation[data-configuredautomationid="' + selected[i] + '"]').remove()
									}
									context.multiSelector.refresh();
								});
							}
							break;
					}
				},
				container: administration.header().find('.panelheader-list').first(),
				selectableItemsContainer: administration.panelWrapper().find('.content-list.automations').first(),
				template: context.multiSelectorTemplateId,
				onGetId: function(elm) {
					return $(elm).data('configuredautomationid')
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
				'configuredautomation-create': function(data){
					showAddEditPanel(context, null, 'New Automation');
				},
				'configuredautomation-created': function(data){
					// could just add new configuredAutomation to list similar to how
					// edited is handled, but refreshing accounts for resetting
					// any other paged/scroll/filter/UI state on root panel
					administration.refresh();
				},
				'configuredautomation-enable': function(data){
					var listItem = $(data.target).closest('.content-item.configuredautomation');
					enableConfiguredAutomation(context, listItem.data('configuredautomationid'), true);
				},
				'configuredautomation-disable': function(data){
					var listItem = $(data.target).closest('.content-item.configuredautomation');
					enableConfiguredAutomation(context, listItem.data('configuredautomationid'), false);
				},
				'configuredautomation-edit': function(data){
					var listItem = $(data.target).closest('.content-item.configuredautomation');
					showAddEditPanel(context, listItem.data('configuredautomationid'), listItem.data('configuredautomationname'));
				},
				'configuredautomation-edited': function(data){
					administration.close();
					var listItem = context.configuredAutomationsList.find('.configuredautomation[data-configuredautomationid="' + data.configuredAutomation.Id + '"]');
					var wasSelected = listItem.hasClass('expanded');
					listItem.removeClass('expanded');
					if(data.preventExpansion) {
						listItem.empty().append(data.renderedConfiguredAutomation);
					} else {
						listItem.empty()
							.append(data.renderedConfiguredAutomation)
							.trigger('click');
					}
					if(data.multiSelect) {
						listItem.find('input[type="checkbox"]').prop('checked', true);
					}
					if (wasSelected) {
						listItem.trigger('click');
					}
					context.multiSelector.refresh();
				},
				'configuredautomation-delete': function(data){
					if(confirm(context.confirmDeleteText)) {
						var id = $(data.target).data('configuredautomationid');
						deleteConfiguredAutomation(context, id).then(function(r){
							context.configuredAutomationsList.find('.configuredautomation[data-configuredautomationid="' + id + '"]').remove()
							administration.close();
							context.multiSelector.refresh();
						});
					}
				},
				'configuredautomation-export': function(data){
					context.exporter.exportAutomations([ $(data.target).data('configuredautomationid') ], true);
				},
				'configuredautomation-exportall': function(data) {
					context.exporter.exportAllAutomations(true);
				},
				'configuredautomation-exportresources': function(data) {
					context.exporter.exportResources([ $(data.target).data('configuredautomationid') ]);
				},
				'configuredautomation-exportallresources': function(data) {
					context.exporter.exportAllResources();
				},
				'configuredautomation-multiselect': function(data) {
					context.multiSelector.enable();
				},
				'configuredautomation-upload': function(data) {
					context.uploader.upload().then(function(file){
						showImportPanel(context, file.context, file.name);
					});
				},
				'configuredautomation-imported': function(data) {
					administration.refresh();
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
	$.telligent.evolution.widgets.automationAdministration = api;

})(jQuery, window);
