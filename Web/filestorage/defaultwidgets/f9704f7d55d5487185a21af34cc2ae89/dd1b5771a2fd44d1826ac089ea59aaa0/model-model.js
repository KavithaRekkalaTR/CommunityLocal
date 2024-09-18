/*
Automation Studio Data Model

 * High level methods for interacting with staged automations. Intended for direct use by studio UI.
 * Raises/synthesizes events based on server events as well as inferred from client actions
 * Destructive actions are queued
 * Proper cross-tab messages are raised on certain actions

var dataModel = new DataModel(options)
	options:
		provider: provider
		queue: queue

Events/messages:
	ma.model.automations.changed
		raised when a mass-action completes
			as a result of (.deleteAutomations() .publishAutomations() .revertAutomations())
	ma.model.automation.staging.changed
		raised from server side when:
			the current set of staged automation is changed in a way that results in a different unique set of staged automations
			AND this didn't coincide with any other CUD automation/file actions in this model
	ma.model.automation.created
		raised when:
			an automation is saved to staging that results in actions new automation
		id:
			id
		model:
			resulting model or null
	ma.model.automation.updated
		raised when:
			an automation is saved to staging that results in an update to an existing automation
			a customized factory default automation is deleted (reverted) back to the factory default state
			an automation is published from staging to non-staged
			an automation is reverted from staged to no longer staged
			an automation's file is saved in staging (as this affects the automation's own list of file metadata)
			an automation's file is deleted in staging (as this affects the automation's own list of file metadata)
		id:
			id
		model:
			resulting model or null
	ma.model.automation.deleted
		raised when:
			a custom automation is deleted and there's no underlying factory default version to fall back to
		id:
			id
		model:
			resulting model or null
	ma.model.file.created
		raised when:
			an automation file is saved to existing that results in a create
		id:
			id
			name
		model:
			resulting model or null
	ma.model.file.updated
		raised when:
			an automation file is saved to staging that results in an update of an existing (or a delete of an old and create of a new via "rename")
		id:
			id
			name
		model:
			resulting model or null
	ma.model.file.deleted
		raised when:
			an automation file is deleted from staging
		id:
			id
			name
		model:
			resulting model or null

Methods:
	listConfiguredAutomations(options)
		options:
			query
			enabled
			pageSize
			pageIndex
			automationId
			staged
		returns
			promised array of configured automations

	listAutomations(options)
		options:
			specifyHost
			hostId
			state
			staged
			includeFileDigests (default false)
			factoryDefaultProviderId
		returns
			promised array of automation summaries

	getAutomation(options)
		options
			id
			staged (default true)
			factoryDefault (default false)
			includeFileDigests (default false)
		returns
			promised automation (non summary)

	saveAutomation(options)
		options
			id
			hostId
			factoryDefaultProviderId
			name
			description
			executionScript
			executionScriptLanguage
			configurationXml
			resourcesToSave
!!			events: []
			triggerTypes: []
			scheduleType
			scheduleSeconds
			scheduleMinutes
			scheduleHours
			scheduleDailyTime
			scheduleDailySunday
			scheduleDailyMonday
			scheduleDailyTuesday
			scheduleDailyWednesday
			scheduleDailyThursday
			scheduleDailyFriday
			scheduleDailySaturday
			executeAsServiceUser
			isSingleton
			httpAuthentication

	deleteAutomation(options)
		options
			id
		returns
			stagedAutomations - promised list of all staged automation summaries
			automation - if null, then was a custom delete. if exists, then is fac default version post revert

	deleteAutomations(options)
		options:
!!			automations: [
				{ id: '' }
			]
		returns:
			stagedAutomations - promised list of all now-staged automation summaries
			revertedAutomations - promised list of all reverted automation summaries from deletion
			deletedAutomations - promised list of all deleted automations (id)

	cloneAutomation(options)
		options
			id
			newId
			hostId
		returns
			promised
				clonedAutomation - automation summary
				stagedAutomations - list of all staged automations summaries

	createAutomation(options)
		options
			id
			hostId
			factoryDefaultProviderId
		returns
			promised non-saved/staged automation

	publishAutomation(options)
		options
			id
		returns
			publishedAutomation - published automation
			stagedAutomations - promised list of all staged automation summaries

	publishAutomations(options, ajaxOptions)
		options:
!!			automations: [
				{ id: '', model: 'configuration|automation' }
			]
		ajaxOptions
			error
		returns:
			stagedAutomations - promised list of all staged automation summaries

	revertAutomation(options)
		options
			id
		returns
			revertedAutomation - reverted automation
			stagedAutomations - promised list of all staged automation summaries

	revertAutomations(options)
		options:
!!			automations: [
				{ id: '', model: 'configuration|automation' }
			]
		returns:
			stagedAutomations - promised list of all staged automation summaries

	getAutomationFile(options)
		options
			id
			name
			staged (default true)
			factoryDefault (default false)
		returns
			promised automation file (non summary)

	createAutomationFile(options)
		options
			id
		returns:
			promised
				new non-saved automation file

	saveAutomationFile(options)
		options
			id
			name
			content
			newName
			uploadContext

		returns
			promised
				automation file
				list of all staged automation summaries
				isNew - whether save resulted in create (new) or update
				automation: related automation

	deleteAutomationFile(options)
		options
			id
			name
		returns:
			promised
				list of all staged automation summaries
				automation: related automation

	restoreAutomationFile(options)
		options
			id
			name
		returns:
			promised
				list of all staged automation summaries
				automation: related automation

	flushPendingTasks()
	dispose()

	listEvents(options)
		options:
			query
		returns:
			promised array of ManagedAutomationEvent

	search(options)
		options:
			query
			caseSensitive
			regEx
			componentScopes
			id
			hostId
			factoryDefaultProviderId
			state
			isStaged
			pageSize
			pageIndex
		retures
			promised array of AutomationSearchResult
			TotalCount
			PageSize
			PageIndex

	importAutomations
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
			// of 'ma.model.automation.staging.changed' which is dependent
			// on other state
			sockets.automationManagement.on('staging-updated', raised);
		},
		onRaiseImported: function(raised) {
			sockets.automationManagement.on('imported', raised);
		},
		onDispose: function() {
			sockets.automationManagement.off('staging-updated');
			sockets.automationManagement.off('imported');
		}
	};

	// aliases
	var messaging = $.telligent.evolution.messaging,
		sockets = $.telligent.evolution.sockets;

	var scheduledCommitCompleteSubscription;
	var scheduledCommitErrorSubscription;

	// events
	var events = {
		stagingChanged: 'ma.model.automation.staging.changed',
		imported: 'ma.model.automation.management.imported',
		automationCreated: 'ma.model.automation.created',
		automationUpdated: 'ma.model.automation.updated',
		automationDeleted: 'ma.model.automation.deleted',
		fileCreated: 'ma.model.file.created',
		fileUpdated: 'ma.model.file.updated',
		fileDeleted: 'ma.model.file.deleted',
		automationsChanged: 'ma.model.automations.changed', // identifies that there were any kind of changes, just for purposes of updating browse view
		automationsUpdated: 'ma.model.automations.updated' // identification that multiple items were updated in order to load more details about those updates for any open items
	};

	function synthesizeIdForAutomation(dataOptions) {
		if(!dataOptions) {
			return {
				id: null
			};
		};
		return {
			id: dataOptions.id
		};
	}

	function synthesizeIdForAutomationFile(dataOptions) {
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

	function raiseAutomationEvent(context, messageName, dataOptions, model, extraMessageData) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);

		raiseMessage(messageName, $.extend({
			id: synthesizeIdForAutomation(dataOptions),
			model: model
		}, (extraMessageData || {})), {
			crossWindow: true
		});
	}

	function raiseAutomationFileEvent(context, messageName, dataOptions, model) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);
		raiseMessage(messageName, {
			id: synthesizeIdForAutomationFile(dataOptions),
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

	function serializeAutomationIds(automations, defaultModel) {
		// serialize automation requests
		var automationIds = [];
		for(var i = 0; i < automations.length; i++) {
			if (automations[i].model) {
				automationIds.push(automations[i].id + '|' + automations[i].model);
			} else if (defaultModel) {
				automationIds.push(automations[i].id + '|' + defaultModel);
			} else {
				automationIds.push(automations[i].id)
			}
		}
		return automationIds.join(',');
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
				query
				enabled
				pageSize
				pageIndex
				automationId
				staged
			*/
			listConfiguredAutomations: function(options) {
				return context.provider.listConfiguredAutomations(options);
			},
			/*
			options:
				specifyHost
				hostId
				state
				staged
				includeFileDigests (default false)
				factoryDefaultProviderId
			*/
			listAutomations: function(options) {
				return context.provider.listAutomations(options);
			},
			/*
			options
				id
				staged (default true)
				factoryDefault (default false)
				includeFileDigests (default false)
			*/
			getAutomation: function(options) {
				return context.provider.getAutomation(options);
			},
			/*
			options
				id
				hostId
				factoryDefaultProviderId
				name
				description
				executionScript
				executionScriptLanguage
				configurationXml
				resourcesToSave
				events: []
				triggerTypes: []
				scheduleType
				scheduleSeconds
				scheduleMinutes
				scheduleHours
				scheduleDailyTime
				scheduleDailySunday
				scheduleDailyMonday
				scheduleDailyTuesday
				scheduleDailyWednesday
				scheduleDailyThursday
				scheduleDailyFriday
				scheduleDailySaturday
				executeAsServiceUser
				isSingleton
				httpAuthentication
				immediate
			*/
			saveAutomation: function(options) {
				if (options.events)
					options.events = (options.events || []).join(',');
				if (options.triggerTypes)
					options.triggerTypes = (options.triggerTypes || []).join(',');

				return context.queue.add(
					('saveAutomation:' + options.id),
					function(){
						return context.provider.saveAutomation(options)
							.then(function (response) {
								if(response.isNew) {
									raiseAutomationEvent(context, events.automationCreated, options, response.savedAutomation);
								} else {
									raiseAutomationEvent(context, events.automationUpdated, options, response.savedAutomation);
								}
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				id
			*/
			deleteAutomation: function(options) {
				return context.queue.add(
					('deleteAutomation:' + options.id),
					function(){
						return context.provider.deleteAutomation(options)
							.then(function(response){
								// if there's still an automation, then this effectively represented
								// a staged revert from customized default to a default or a staged deletion, so raise update instead
								if(response.automation) {
									raiseAutomationEvent(context, events.automationUpdated, options, response.automation, {
										reverted: true
									});
								} else {
									raiseAutomationEvent(context, events.automationDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				id
				newId
				hostId
			*/
			cloneAutomation: function(options) {
				return context.queue.add(
					('cloneAutomation:' + options.id + ':' + (options.newId || '')),
					function(){
						return context.provider.cloneAutomation(options)
							.then(function(response){
								raiseAutomationEvent(context, events.automationCreated, options, response.clonedAutomation, {
									cloned: true
								});
								return response;
							});
					});
			},
			/*
			options
				id
				hostId
				factoryDefaultProviderId
			*/
			createAutomation: function(options) {
				return context.queue.add(
					('createAutomation:' + options.id + ':' + (options.hostId || '')),
					function(){
						return context.provider.createAutomation(options);
					});
			},
			/*
			options
				automations: [
					{ id: '' }
				]
			*/
			deleteAutomations: function(options) {
				if(!options.automations)
					return;

				// serialize automation requests
				var serializedAutomationIds = serializeAutomationIds(options.automations);

				return context.queue.add(
					('deleteAutomations:' + serializedAutomationIds),
					function(){
						context.suppressStagingChange = true;
						return context.provider.deleteAutomations($.extend({}, options, {
							automationIds: serializedAutomationIds
						})).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							raiseMessage(events.automationsChanged, {}, { crossWindow: true });


							// Items in which this delete does not stage a change, but rather
							// Just undoes _staged_ changes to an item which cannot be
							// undone, like a FD
							if(response && response.revertedAutomations) {
								for(var i = 0; i < response.revertedAutomations.length; i++) {
									(function(){
										var automation = response.revertedAutomations[i];
										raiseAutomationEvent(context, events.automationUpdated, {
											id: automation.Id
										}, automation, { reverted: true });
									})();
								}
							}

							// Fully deleted (staged custom with no saved version, so not staging any reversion, just gone)
							// Items which are being fully deleted without staging
							if(response && response.deletedAutomations) {
								for(var i = 0; i < response.deletedAutomations.length; i++) {
									(function(){
										var automation = response.deletedAutomations[i];
										raiseAutomationEvent(context, events.automationDeleted, {
											id: automation.Id
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
				model: configuration|automation
			*/
			publishAutomation: function(options) {
				return context.queue.add(
					('publishAutomation:' + options.id + ':' + (options.model || [])),
					function(){
						return context.provider.publishAutomation(options)
							.then(function(response){
								if (options.model == 'configuration') {
									//
								} else {
									// if there's a published automation after publishing,
									// this represents a published change of some sort (even if it's a published reversion)
									// so raise update event
									// but if there's no published automation, then this represented a published deletion
									// so raise delete event
									if(response.publishedAutomation) {
										raiseAutomationEvent(context, events.automationUpdated, options, response.publishedAutomation);
									} else {
										raiseAutomationEvent(context, events.automationDeleted, options, null);
									}
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				automations: [
					{ id: '', model: 'configuration|automation' }
				]
			*/
			publishAutomations: function(options) {
				if(!options.automations)
					return;

				// serialize automation requests
				var serializedAutomationIds = serializeAutomationIds(options.automations, 'automation');

				function handleComplete(options) {
					// raise message about a mass change
					context.suppressStagingChange = false;
					messaging.publish(events.automationsChanged, {}, { crossWindow: true });

					// Items whose publication reverted them to the factory default
					if(options && options.revertedAutomations) {
						for(var i = 0; i < options.revertedAutomations.length; i++) {
							(function(){
								var automation = options.revertedAutomations[i];
								raiseAutomationEvent(context, events.automationUpdated, {
									id: automation.Id
								}, automation, { reverted: true });
							})();
						}
					}

					// Items whose publication fully deleted them
					if(options && options.deletedAutomations) {
						for(var i = 0; i < options.deletedAutomations.length; i++) {
							(function(){
								var automation = options.deletedAutomations[i];
								raiseAutomationEvent(context, events.automationDeleted, {
									id: automation.Id
								}, null);
							})();
						}
					}
				}

				return context.queue.add(
					('publishAutomations:' + serializedAutomationIds),
					function(){
						$.telligent.evolution.administration.loading(true);
						return $.Deferred(function(d){
							context.suppressStagingChange = true;
							context.provider.publishAutomations({
								automationIds: serializedAutomationIds
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
				model: configuration|automation
			*/
			revertAutomation: function(options) {
				return context.queue.add(
					('revertAutomation:' + options.id + ':' + (options.model || [])),
					function(){
						return context.provider.revertAutomation(options)
							.then(function(response){
								if (options.model == 'configuration') {
									//
								} else {
									// if there's still an automation, then this effectively represented
									// a revert from staged to non-staged version
									if(response.revertedAutomation) {
										raiseAutomationEvent(context, events.automationUpdated, options, response.revertedAutomation, {
											reverted: true
										});
									// if not, then this represented reversion from staged to custom to non-existent (never published) state
									} else {
										raiseAutomationEvent(context, events.automationDeleted, options, null);
									}
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				automations: [
					{ id: '', model: 'configuration|automation' }
				]
			*/
			revertAutomations: function(options) {
				if(!options.automations)
					return;

				// serialize automation requests
				var serializedAutomationIds = serializeAutomationIds(options.automations);

				return context.queue.add(
					('revertAutomations:' + serializedAutomationIds),
					function(){
						context.suppressStagingChange = true;
						return context.provider.revertAutomations($.extend({}, options, {
							automationIds: serializedAutomationIds,
						})).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							raiseMessage(events.automationsChanged, {}, { crossWindow: true });
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
			getAutomationFile: function(options) {
				// if fallback, get any version it can from top-down
				if(options.fallback) {
					return $.Deferred(function(d){
						// current
						context.provider.getAutomationFile(options).then(function(r0){
							if(!r0) {
								// force non-staged
								options.staged = false;
								context.provider.getAutomationFile(options).then(function(r1){
									if(!r1) {
										// force factory default
										options.factoryDefault = true;
										context.provider.getAutomationFile(options)
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
					return context.provider.getAutomationFile(options);
				}
			},
			/*
			options
				id
			*/
			createAutomationFile: function(options) {
				return context.provider.createAutomationFile(options);
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
			saveAutomationFile: function(options) {
				return context.queue.add(
					('saveAutomationFile:' + options.id + ':' + (options.queueSalt || '')),
					function(){
						return context.provider.saveAutomationFile(options)
							.then(function(response){
								if(response.isNew) {
									raiseAutomationFileEvent(context, events.fileCreated, options, response.savedAutomationFile);
								} else {
									raiseAutomationFileEvent(context, events.fileUpdated, options, response.savedAutomationFile);
								}
								raiseAutomationEvent(context, events.automationUpdated, options, response.automation);
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				id
				name
			*/
			deleteAutomationFile: function(options) {
				return context.queue.add(
					('deleteAutomationFile:' + options.id + ':' + options.name),
					function(){
						return context.provider.deleteAutomationFile(options)
							.then(function(response){
								raiseAutomationFileEvent(context, events.fileDeleted, options, null);
								raiseAutomationEvent(context, events.automationUpdated, options, response.automation);
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				id
				name
			*/
			restoreAutomationFile: function(options) {
				return context.queue.add(
					('restoreAutomationFile:' + options.id + ':' + options.name),
					function(){
						return context.provider.restoreAutomationFile(options)
							.then(function(response){
								raiseAutomationFileEvent(context, events.fileCreated, options, response.savedAutomationFile);
								raiseAutomationEvent(context, events.automationUpdated, options, response.automation);
								return response;
							});
					}, { immediate: true });
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
				hostId
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
			options:
				query
			*/
			listEvents: function(options) {
				return context.provider.listEvents(options);
			},
			/*
			options
				uploadContext
				fileName
				importCommands
				factoryDefaultProviderId
			*/
			importAutomations: function(options) {
				options.importCommands = serializeImportCommands(options.importCommands);
				return context.queue.add(
					('importAutomations:' + options.uploadContext + ':' + options.fileName + ':' + options.importCommands),
					function(){
						$.telligent.evolution.administration.loading(true);

						return $.Deferred(function(d){
							// schedule importing
							context.provider.importAutomations(options).then(function(response){
								// resolve this model's import() on completion of the scheduled import
								if (scheduledCommitCompleteSubscription) {
									$.telligent.evolution.messaging.unsubscribe(scheduledCommitCompleteSubscription);
								}
								scheduledCommitCompleteSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data) {
									if (data.progressKey == response.progressKey) {
										// ... but first synthesize client messages regarding imported items
										if(data.result.Imported) {
											for(var i = 0; i < data.result.newAutomations.length; i++) {
												raiseAutomationEvent(context, events.automationCreated, {
													id: data.result.newAutomations[i].Id
												}, data.result.newAutomations[i]);
											}
											var automations = [];
											for(var i = 0; i < data.result.updatedAutomations.length; i++) {
												var automation = {
													id: data.result.updatedAutomations[i].Id
												};
												automations.push(automation);
												raiseAutomationEvent(context, events.automationUpdated, automation, data.result.updatedAutomations[i], {
													// treat this like a revert as it coudl be undoing other current staged changes
													reverted: true
												});
											}

											messaging.publish(events.automationsUpdated, {
												automations: automations
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
