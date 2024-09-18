/*

Embeddable Studio Data Model

 * High level methods for interacting with staged embeddables. Intended for direct use by studio UI.
 * Raises/synthesizes events based on server events as well as inferred from client actions
 * Destructive actions are queued
 * Proper cross-tab messages are raised on certain actions

var dataModel = new DataModel(options)
	options:
		provider: provider
		queue: queue

Events/messages:
	me.model.embeddables.changed
		raised when a mass-action completes
			as a result of (.deleteEmbeddables() .publishEmbeddables() .revertEmbeddables())
	me.model.embeddable.staging.changed
		raised from server side when:
			the current set of staged embeddable is changed in a way that results in a different unique set of staged embeddables
			AND this didn't coincide with any other CUD embeddable/file actions in this model
	me.model.embeddable.created
		raised when:
			an embeddable is saved to staging that results in actions new embeddable
		id:
			id
		model:
			resulting model or null
	me.model.embeddable.updated
		raised when:
			an embeddable is saved to staging that results in an update to an existing embeddable
			a customized factory default embeddable is deleted (reverted) back to the factory default state
			an embeddable is published from staging to non-staged
			an embeddable is reverted from staged to no longer staged
			an embeddable's file is saved in staging (as this affects the embeddable's own list of file metadata)
			an embeddable's file is deleted in staging (as this affects the embeddable's own list of file metadata)
		id:
			id
		model:
			resulting model or null
	me.model.embeddable.deleted
		raised when:
			a custom embeddable is deleted and there's no underlying factory default version to fall back to
		id:
			id
		model:
			resulting model or null
	me.model.file.created
		raised when:
			an embeddable file is saved to existing that results in a create
		id:
			id
			name
		model:
			resulting model or null
	me.model.file.updated
		raised when:
			an embeddable file is saved to staging that results in an update of an existing (or a delete of an old and create of a new via "rename")
		id:
			id
			name
		model:
			resulting model or null
	me.model.file.deleted
		raised when:
			an embeddable file is deleted from staging
		id:
			id
			name
		model:
			resulting model or null

Methods:
	listEmbeddables(options)
		options:
			state
			staged
			includeFileDigests (default false)
			factoryDefaultProviderId
		returns
			promised array of embeddable summaries

	getEmbeddable(options)
		options
			id
			staged (default true)
			factoryDefault (default false)
			includeFileDigests (default false)
		returns
			promised embeddable (non summary)

	saveEmbeddable(options)
		options
			id
			factoryDefaultProviderId
			name
			description
			category
			isCacheable
			varyCacheByUser
			contentScript
			contentScriptLanguage
			configurationXml
			resourcesToSave
			newPreviewImageFileName
			newIconImageFileName
			uploadContext
			supportedContentTypesScopeToSave
			supportedContentTypesToSave


	deleteEmbeddable(options)
		options
			id
		returns
			stagedEmbeddables - promised list of all staged embeddable summaries
			embeddable - if null, then was a custom delete. if exists, then is fac default version post revert

	deleteEmbeddables(options)
		options:
!!			embeddables: [
				{ id: '' }
			]
		returns:
			stagedEmbeddables - promised list of all now-staged embeddable summaries
			revertedEmbeddables - promised list of all reverted embeddable summaries from deletion
			deletedEmbeddables - promised list of all deleted embeddables (id)

	cloneEmbeddable(options)
		options
			id
			newId
			factoryDefaultProviderId
		returns
			promised
				clonedEmbeddable - embeddable summary
				stagedEmbeddables - list of all staged embeddables summaries

	createEmbeddable(options)
		options
			id
			factoryDefaultProviderId
		returns
			promised non-saved/staged embeddable

	publishEmbeddable(options)
		options
			id
		returns
			publishedEmbeddable - published embeddable
			stagedEmbeddables - promised list of all staged embeddable summaries

	publishEmbeddables(options, ajaxOptions)
		options:
!!			embeddables: [
				{ id: '' }
			]
		ajaxOptions
			error
		returns:
			stagedEmbeddables - promised list of all staged embeddable summaries

	revertEmbeddable(options)
		options
			id
		returns
			revertedEmbeddable - reverted embeddable
			stagedEmbeddables - promised list of all staged embeddable summaries

	revertEmbeddables(options)
		options:
!!			embeddables: [
				{ id: '' }
			]
		returns:
			stagedEmbeddables - promised list of all staged embeddable summaries

	getEmbeddableFile(options)
		options
			id
			name
			staged (default true)
			factoryDefault (default false)
		returns
			promised embeddable file (non summary)

	createEmbeddableFile(options)
		options
			id
		returns:
			promised
				new non-saved embeddable file

	saveEmbeddableFile(options)
		options
			id
			name
			content
			newName
			uploadContext

		returns
			promised
				embeddable file
				list of all staged embeddable summaries
				isNew - whether save resulted in create (new) or update
				embeddable: related embeddable

	deleteEmbeddableFile(options)
		options
			id
			name
		returns:
			promised
				list of all staged embeddable summaries
				embeddable: related embeddable

	restoreEmbeddableFile(options)
		options
			id
			name
		returns:
			promised
				list of all staged embeddable summaries
				embeddable: related embeddable

	flushPendingTasks()
	dispose()

	listRestScopes(options)
		options:
			query
		returns
			promised array of rest scopes

	search(options)
		options:
			query
			caseSensitive
			regEx
			componentScopes
			id
			factoryDefaultProviderId
			state
			isStaged
			pageSize
			pageIndex
		retures
			promised array of EmbeddableSearchResult
			TotalCount
			PageSize
			PageIndex

	importEmbeddables
		options:
			uploadContext
			fileName
			importCommands
			factoryDefaultProviderId

 */
define('DataModel', function($, global, undef) {

	// defaults
	var defaults = {
		provider: null,
		queue: null,
		stagingChangedTimeoutDelay: 400,
		onRaiseStagingChange: function(raised) {
			// by default, socket events implement raising staging changes
			// can be overriden for testing orchestration of raising
			// of 'me.model.embeddable.staging.changed' which is dependent
			// on other state
			sockets.embeddableManagement.on('staging-updated', raised);
		},
		onRaiseImported: function(raised) {
			sockets.embeddableManagement.on('imported', raised);
		},
		onDispose: function() {
			sockets.embeddableManagement.off('staging-updated');
			sockets.embeddableManagement.off('imported');
		}
	};

	// aliases
	var messaging = $.telligent.evolution.messaging,
		sockets = $.telligent.evolution.sockets;

	var scheduledCommitCompleteSubscription;
	var scheduledCommitErrorSubscription;

	// events
	var events = {
		stagingChanged: 'me.model.embeddable.staging.changed',
		imported: 'me.model.embeddable.management.imported',
		embeddableCreated: 'me.model.embeddable.created',
		embeddableUpdated: 'me.model.embeddable.updated',
		embeddableDeleted: 'me.model.embeddable.deleted',
		fileCreated: 'me.model.file.created',
		fileUpdated: 'me.model.file.updated',
		fileDeleted: 'me.model.file.deleted',
		embeddablesChanged: 'me.model.embeddables.changed', // identifies that there were any kind of changes, just for purposes of updating browse view
		embeddablesUpdated: 'me.model.embeddables.updated' // identification that multiple items were updated in order to load more details about those updates for any open items
	};

	function synthesizeIdForEmbeddable(dataOptions) {
		if(!dataOptions) {
			return {
				id: null
			};
		};
		return {
			id: dataOptions.id
		};
	}

	function synthesizeIdForEmbeddableFile(dataOptions) {
		if(!dataOptions) {
			return {
				id: null,
				name: null,
				type: 'file'
			};
		}
		return {
			id: dataOptions.id,
			name: dataOptions.name,
			type: 'file'
		};
	}

	function raiseMessage(name, data, options) {
		messaging.publish(name, data, options);
	}

	function raiseEmbeddableEvent(context, messageName, dataOptions, model, extraMessageData) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);

		raiseMessage(messageName, $.extend({
			id: synthesizeIdForEmbeddable(dataOptions),
			model: model
		}, (extraMessageData || {})), {
			crossWindow: true
		});
	}

	function raiseEmbeddableFileEvent(context, messageName, dataOptions, model) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);
		raiseMessage(messageName, {
			id: synthesizeIdForEmbeddableFile(dataOptions),
			model: model
		}, {
			crossWindow: true
		});
	}

	// temporarily suppresses any change events received
	function suppressStagingChange(context) {
		context.suppressStagingChange = true;
		global.clearTimeout(context.suppressTimeout);
		context.suppressTimeout = global.setTimeout(function(){
			context.suppressStagingChange = false;
		}, context.stagingChangedTimeoutDelay);
	}

	function publishStagingChanged(context, data) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		context.raiseStagingChangedTimeout = global.setTimeout(function(){
			if(!context.suppressStagingChange) {
				raiseMessage(events.stagingChanged, data);
			}
		}, context.stagingChangedTimeoutDelay);
	}

	function publishImported(context, data) {
		global.clearTimeout(context.raiseImportedTimeout);
		context.raiseImportedTimeout = global.setTimeout(function(){
			raiseMessage(events.imported, data);
		}, context.stagingChangedTimeoutDelay);
	}

	function serializeEmbeddableIds(embeddables) {
		// serialize embeddable requests
		var embeddableIds = [];
		for(var i = 0; i < embeddables.length; i++) {
			if (embeddables[i].model) {
				embeddableIds.push(embeddables[i].id + '|' + embeddables[i].model);
			} else {
				embeddableIds.push(embeddables[i].id);
			}
		}
		return embeddableIds.join(',');
	}

	function serializeImportCommands(commands) {
		var serializedParts = [];
		for(var i = 0; i < (commands || []).length; i++) {
			if(serializedParts.length > 0)
				serializedParts.push(',');
			serializedParts.push(commands[i].id);
			serializedParts.push('`');
			if(commands[i].import) {
				serializedParts.push('1');
			} else {
				serializedParts.push('0');
			}
			serializedParts.push('`');
			if(commands[i].model && commands[i].model == 'configuration') {
				serializedParts.push('2');
			} else {
				serializedParts.push('1');
			}
		}
		return serializedParts.join('');
	}

	var DataModel = function(options){
		var context = $.extend({}, defaults, options || {
			suppressStagingChange: false
		});

		context.onRaiseStagingChange(function(data){
			publishStagingChanged(context, data);
		});

		context.onRaiseImported(function(data){
			publishImported(context, data);
		});

		return {
			/*
			options:
				state
				staged
				includeFileDigests (default false)
				factoryDefaultProviderId
			*/
			listEmbeddables: function(options) {
				return context.provider.listEmbeddables(options);
			},
			/*
			options
				id
				staged (default true)
				factoryDefault (default false)
				includeFileDigests (default false)
			*/
			getEmbeddable: function(options) {
				return context.provider.getEmbeddable(options);
			},
			/*
			options
				id
				factoryDefaultProviderId
				name
				description
				category
				isCacheable
				varyCacheByUser
				contentScript
				contentScriptLanguage
				configurationXml
				resourcesToSave
				newPreviewImageFileName
				newIconImageFileName
				uploadContext
				immediate
				supportedContentTypesScopeToSave
				supportedContentTypesToSave
			*/
			saveEmbeddable: function(options) {
				if (options.events)
					options.events = (options.events || []).join(',');

				return context.queue.add(
					('saveEmbeddable:' + options.id),
					function(){
						return context.provider.saveEmbeddable(options)
							.then(function(response){
								if(response.isNew) {
									raiseEmbeddableEvent(context, events.embeddableCreated, options, response.savedEmbeddable);
								} else {
									raiseEmbeddableEvent(context, events.embeddableUpdated, options, response.savedEmbeddable);
								}
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				id
			*/
			deleteEmbeddable: function(options) {
				return context.queue.add(
					('deleteEmbeddable:' + options.id),
					function(){
						return context.provider.deleteEmbeddable(options)
							.then(function(response){
								// if there's still an embeddable, then this effectively represented
								// a staged revert from customized default to a default or a staged deletion, so raise update instead
								if(response.embeddable) {
									raiseEmbeddableEvent(context, events.embeddableUpdated, options, response.embeddable, {
										reverted: true
									});
								} else {
									raiseEmbeddableEvent(context, events.embeddableDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				id
				newId
				factoryDefaultProviderId
			*/
			cloneEmbeddable: function(options) {
				return context.queue.add(
					('cloneEmbeddable:' + options.id + ':' + (options.newId || '')),
					function(){
						return context.provider.cloneEmbeddable(options)
							.then(function(response){
								raiseEmbeddableEvent(context, events.embeddableCreated, options, response.clonedEmbeddable, {
									cloned: true
								});
								return response;
							});
					});
			},
			/*
			options
				id
				factoryDefaultProviderId
			*/
			createEmbeddable: function(options) {
				return context.queue.add(
					('createEmbeddable:' + options.id + ':' + (options.factoryDefaultProviderId || '')),
					function(){
						return context.provider.createEmbeddable(options);
					});
			},
			/*
			options
				embeddables: [
					{ id: '' }
				]
			*/
			deleteEmbeddables: function(options) {
				if(!options.embeddables)
					return;

				// serialize embeddable requests
				var serializedEmbeddableIds = serializeEmbeddableIds(options.embeddables);

				return context.queue.add(
					('deleteEmbeddables:' + serializedEmbeddableIds),
					function(){
						context.suppressStagingChange = true;
						return context.provider.deleteEmbeddables($.extend({}, options, {
							embeddableIds: serializedEmbeddableIds
						})).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							raiseMessage(events.embeddablesChanged, {}, { crossWindow: true });


							// Items in which this delete does not stage a change, but rather
							// Just undoes _staged_ changes to an item which cannot be
							// undone, like a FD
							if(response && response.revertedEmbeddables) {
								for(var i = 0; i < response.revertedEmbeddables.length; i++) {
									(function(){
										var embeddable = response.revertedEmbeddables[i];
										raiseEmbeddableEvent(context, events.embeddableUpdated, {
											id: embeddable.Id
										}, embeddable, { reverted: true });
									})();
								}
							}

							// Fully deleted (staged custom with no saved version, so not staging any reversion, just gone)
							// Items which are being fully deleted without staging
							if(response && response.deletedEmbeddables) {
								for(var i = 0; i < response.deletedEmbeddables.length; i++) {
									(function(){
										var embeddable = response.deletedEmbeddables[i];
										raiseEmbeddableEvent(context, events.embeddableDeleted, {
											id: embeddable.Id
										}, null);
									})();
								}
							}

							return response;
						});
					}, { immediate: true });
			},
			/*
			options
				id
			*/
			publishEmbeddable: function(options) {
				return context.queue.add(
					('publishEmbeddable:' + options.id),
					function(){
						return context.provider.publishEmbeddable(options)
							.then(function(response){
								// if there's a published embeddable after publishing,
								// this represents a published change of some sort (even if it's a published reversion)
								// so raise update event
								// but if there's no published embeddable, then this represented a published deletion
								// so raise delete event
								if(response.publishedEmbeddable) {
									raiseEmbeddableEvent(context, events.embeddableUpdated, options, response.publishedEmbeddable);
								} else {
									raiseEmbeddableEvent(context, events.embeddableDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				embeddables: [
					{ id: '' }
				]
			*/
			publishEmbeddables: function(options) {
				if(!options.embeddables)
					return;

				// serialize embeddable requests
				var serializedEmbeddableIds = serializeEmbeddableIds(options.embeddables);

				function handleComplete(options) {
					// raise message about a mass change
					context.suppressStagingChange = false;
					messaging.publish(events.embeddablesChanged, {}, { crossWindow: true });

					// Items whose publication reverted them to the factory default
					if(options && options.revertedEmbeddables) {
						for(var i = 0; i < options.revertedEmbeddables.length; i++) {
							(function(){
								var embeddable = options.revertedEmbeddables[i];
								raiseEmbeddableEvent(context, events.embeddableUpdated, {
									id: embeddable.Id
								}, embeddable, { reverted: true });
							})();
						}
					}

					// Items whose publication fully deleted them
					if(options && options.deletedEmbeddables) {
						for(var i = 0; i < options.deletedEmbeddables.length; i++) {
							(function(){
								var embeddable = options.deletedEmbeddables[i];
								raiseEmbeddableEvent(context, events.embeddableDeleted, {
									id: embeddable.Id
								}, null);
							})();
						}
					}
				}

				return context.queue.add(
					('publishEmbeddables:' + serializedEmbeddableIds),
					function(){
						$.telligent.evolution.administration.loading(true);
						return $.Deferred(function(d){
							context.suppressStagingChange = true;
							context.provider.publishEmbeddables({
								embeddableIds: serializedEmbeddableIds
							}).then(function(response){
								// async scheduled publish
								if (!response.complete) {

									// resolve this model's import() on completion of the scheduled import
									if (scheduledCommitCompleteSubscription) {
										$.telligent.evolution.messaging.unsubscribe(scheduledCommitCompleteSubscription);
									}
									scheduledCommitCompleteSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data) {
										if (data.progressKey == response.progressKey) {
											handleComplete(data.result);

											$.telligent.evolution.administration.loading(false);

											d.resolve(data.result);
										}
									});

									// reject on error
									if (scheduledCommitErrorSubscription) {
										$.telligent.evolution.messaging.unsubscribe(scheduledCommitErrorSubscription);
									}
									scheduledCommitErrorSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.error', function (data) {
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

								// completed, synchronous response
								} else if (response.complete) {
									handleComplete(response);

									d.resolve(response);
								}
							}).catch(function(e){
								$.telligent.evolution.administration.loading(false);
								throw e;
							});
						}).promise();

					}, { immediate: true });
			},
			/*
			options
				id
			*/
			revertEmbeddable: function(options) {
				return context.queue.add(
					('revertEmbeddable:' + options.id),
					function(){
						return context.provider.revertEmbeddable(options)
							.then(function(response){
								// if there's still an embeddable, then this effectively represented
								// a revert from staged to non-staged version
								if(response.revertedEmbeddable) {
									raiseEmbeddableEvent(context, events.embeddableUpdated, options, response.revertedEmbeddable, {
										reverted: true
									});
								// if not, then this represented reversion from staged to custom to non-existent (never published) state
								} else {
									raiseEmbeddableEvent(context, events.embeddableDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				embeddables: [
					{ id: '' }
				]
			*/
			revertEmbeddables: function(options) {
				if(!options.embeddables)
					return;

				// serialize embeddable requests
				var serializedEmbeddableIds = serializeEmbeddableIds(options.embeddables);

				return context.queue.add(
					('revertEmbeddables:' + serializedEmbeddableIds),
					function(){
						context.suppressStagingChange = true;
						return context.provider.revertEmbeddables($.extend({}, options, {
							embeddableIds: serializedEmbeddableIds,
						})).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							raiseMessage(events.embeddablesChanged, {}, { crossWindow: true });
							return response;
						});
					}, { immediate: true });
			},
			/*
			options
				id
				name
				staged (default true)
				factoryDefault (default false)
			*/
			getEmbeddableFile: function(options) {
				// if fallback, get any version it can from top-down
				if(options.fallback) {
					return $.Deferred(function(d){
						// current
						context.provider.getEmbeddableFile(options).then(function(r0){
							if(!r0) {
								// force non-staged
								options.staged = false;
								context.provider.getEmbeddableFile(options).then(function(r1){
									if(!r1) {
										// force factory default
										options.factoryDefault = true;
										context.provider.getEmbeddableFile(options)
											.then(function(r2){
												r2.deleted = true;
												d.resolve(r2)
											})
											.catch(function(r2){ d.reject(r2) });
									} else {
										r1.deleted = true;
										r1.IsStaged = true;
										d.resolve(r1);
									}
								}).catch(function(r1){ d.reject(r1) });
							} else {
								d.resolve(r0);
							}
						}).catch(function(r0){ d.reject(r0) });
					}).promise();
				} else {
					return context.provider.getEmbeddableFile(options);
				}
			},
			/*
			options
				id
			*/
			createEmbeddableFile: function(options) {
				return context.provider.createEmbeddableFile(options);
			},
			/*
			options
				id
				name
				content
				newName
				uploadContext
				immediate: default false
			*/
			saveEmbeddableFile: function(options) {
				return context.queue.add(
					('saveEmbeddableFile:' + options.id + ':' + (options.queueSalt || '')),
					function(){
						return context.provider.saveEmbeddableFile(options)
							.then(function(response){
								if(response.isNew) {
									raiseEmbeddableFileEvent(context, events.fileCreated, options, response.savedEmbeddableFile);
								} else {
									raiseEmbeddableFileEvent(context, events.fileUpdated, options, response.savedEmbeddableFile);
								}
								raiseEmbeddableEvent(context, events.embeddableUpdated, options, response.embeddable);
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				id
				name
			*/
			deleteEmbeddableFile: function(options) {
				return context.queue.add(
					('deleteEmbeddableFile:' + options.id + ':' + options.name),
					function(){
						return context.provider.deleteEmbeddableFile(options)
							.then(function(response){
								raiseEmbeddableFileEvent(context, events.fileDeleted, options, null);
								raiseEmbeddableEvent(context, events.embeddableUpdated, options, response.embeddable);
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				id
				name
			*/
			restoreEmbeddableFile: function(options) {
				return context.queue.add(
					('restoreEmbeddableFile:' + options.id + ':' + options.name),
					function(){
						return context.provider.restoreEmbeddableFile(options)
							.then(function(response){
								raiseEmbeddableFileEvent(context, events.fileCreated, options, response.savedEmbeddableFile);
								raiseEmbeddableEvent(context, events.embeddableUpdated, options, response.embeddable);
								return response;
							});
					}, { immediate: true });
			},
			/*
			options:
				filter
			*/
			listRestScopes: function(options) {
				return context.provider.listRestScopes(options);
			},
			/*
			Flushes any pending non-run tasks
			*/
			flushPendingTasks: function() {
				return context.queue.add('flushPendingTasks',
					function(){
						// push an empty promise on to the stack
						return $.Deferred(function(d){
							d.resolve();
						}).promise();
					}, { immediate: true });
			},
			/*
			*/
			dispose: function() {
				return context.onDispose();
			},
			/*
			options:
				query
				caseSensitive
				regEx
				componentScopes
				id
				factoryDefaultProviderId
				state
				isStaged
				pageSize
				pageIndex
			*/
			search: function(options) {
				return context.provider.search(options);
			},
			/*
			options
				uploadContext
				fileName
				importCommands
				factoryDefaultProviderId
			*/
			importEmbeddables: function(options) {
				options.importCommands = serializeImportCommands(options.importCommands);
				return context.queue.add(
					('importEmbeddables:' + options.uploadContext + ':' + options.fileName + ':' + options.importCommands),
					function(){
						$.telligent.evolution.administration.loading(true);

						return $.Deferred(function(d){
							// schedule importing
							context.provider.importEmbeddables(options).then(function(response){
								// resolve this model's import() on completion of the scheduled import
								if (scheduledCommitCompleteSubscription) {
									$.telligent.evolution.messaging.unsubscribe(scheduledCommitCompleteSubscription);
								}
								scheduledCommitCompleteSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data) {
									if (data.progressKey == response.progressKey) {
										// ... but first synthesize client messages regarding imported items
										if(data.result.Imported) {
											for(var i = 0; i < data.result.newEmbeddables.length; i++) {
												raiseEmbeddableEvent(context, events.embeddableCreated, {
													id: data.result.newEmbeddables[i].Id
												}, data.result.newEmbeddables[i]);
											}
											var embeddables = [];
											for(var i = 0; i < data.result.updatedEmbeddables.length; i++) {
												var embeddable = {
													id: data.result.updatedEmbeddables[i].Id
												};
												embeddables.push(embeddable);
												raiseEmbeddableEvent(context, events.embeddableUpdated, embeddable, data.result.updatedEmbeddables[i], {
													// treat this like a revert as it coudl be undoing other current staged changes
													reverted: true
												});
											}

											messaging.publish(events.embeddablesUpdated, {
												embeddables: embeddables
											}, { crossWindow: true });
										}

										$.telligent.evolution.administration.loading(false);

										d.resolve(data.result);
									}
								});

								// reject on error
								if (scheduledCommitErrorSubscription) {
									$.telligent.evolution.messaging.unsubscribe(scheduledCommitErrorSubscription);
								}
								scheduledCommitErrorSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.error', function (data) {
									if (data.progressKey == response.progressKey) {
										$.telligent.evolution.administration.loading(false);
										d.reject();
									}
								});

								// show live progress indicator while scheduled importing is running
								$.telligent.evolution.administration.loading(true, {
									message: response.progressIndicator,
									width: 250,
									height: 250
								});

							});
						}).promise();
					}, { immediate: true });
			}
		}
	};

	return DataModel;

}, jQuery, window);
