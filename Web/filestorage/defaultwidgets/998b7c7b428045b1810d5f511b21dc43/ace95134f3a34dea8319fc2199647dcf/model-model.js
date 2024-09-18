/*
Email Studio Data Model

 * High level methods for interacting with staged emails. Intended for direct use by studio UI.
 * Raises/synthesizes events based on server events as well as inferred from client actions
 * Destructive actions are queued
 * Proper cross-tab messages are raised on certain actions

var dataModel = new DataModel(options)
	options:
		provider: provider
		queue: queue

Events/messages:
	me.model.emails.changed
		raised when a mass-action completes
			as a result of (.deleteEmails() .publishEmails() .revertEmails())
	me.model.email.staging.changed
		raised from server side when:
			the current set of staged email is changed in a way that results in a different unique set of staged emails
			AND this didn't coincide with any other CUD email/file actions in this model
	me.model.email.updated
		raised when:
			an email is saved to staging that results in an update to an existing email
			a customized factory default email is deleted (reverted) back to the factory default state
			an email is published from staging to non-staged
			an email is reverted from staged to no longer staged
			an email's file is saved in staging (as this affects the email's own list of file metadata)
			an email's file is deleted in staging (as this affects the email's own list of file metadata)
		id:
			id
		model:
			resulting model or null
	me.model.email.deleted
		raised when:
			a custom email is deleted and there's no underlying factory default version to fall back to
		id:
			id
		model:
			resulting model or null
	me.model.file.created
		raised when:
			an email file is saved to existing that results in a create
		id:
			id
			name
		model:
			resulting model or null
	me.model.file.updated
		raised when:
			an email file is saved to staging that results in an update of an existing (or a delete of an old and create of a new via "rename")
		id:
			id
			name
		model:
			resulting model or null
	me.model.file.deleted
		raised when:
			an email file is deleted from staging
		id:
			id
			name
		model:
			resulting model or null

Methods:
	listEmails(options)
		options:
			state
			staged
			includeFileDigests (default false)
			includeTemplate
			includeEmails
		returns
			promised array of email summaries

	listConfigurations(options)
		options:
			staged
		returns
			promised array of config summaries

	getEmail(options)
		options
			id
			staged (default true)
			factoryDefault (default false)
			includeFileDigests (default false)
		returns
			promised email (non summary)

	saveEmail(options)
		options
			id
			name
			description
			templateScript
			templateScriptLanguage
			subjectScript
			subjectScriptLanguage
			headerScript
			headerScriptLanguage
			footerScript
			footerScriptLanguage
			bodyScript
			bodyScriptLanguage
			configurationXml
			resourcesToSave

	deleteEmail(options)
		options
			id
		returns
			stagedEmails - promised list of all staged email summaries
			email - if null, then was a custom delete. if exists, then is fac default version post revert

	deleteEmails(options)
		options:
!!			emails: [
				{ id: '' }
			]
		returns:
			stagedEmails - promised list of all now-staged email summaries
			revertedEmails - promised list of all reverted email summaries from deletion
			deletedEmails - promised list of all deleted emails (id)

	publishEmail(options)
		options
			id
		returns
			publishedEmail - published email
			stagedEmails - promised list of all staged email summaries

	publishEmails(options, ajaxOptions)
		options:
!!			emails: [
				{ id: '', model: 'configuration|email' }
			]
		ajaxOptions
			error
		returns:
			stagedEmails - promised list of all staged email summaries

	revertEmail(options)
		options
			id
		returns
			revertedEmail - reverted email
			stagedEmails - promised list of all staged email summaries

	revertEmails(options)
		options:
!!			emails: [
				{ id: '', model: 'configuration|email' }
			]
		returns:
			stagedEmails - promised list of all staged email summaries

	getEmailFile(options)
		options
			id
			name
			staged (default true)
			factoryDefault (default false)
		returns
			promised email file (non summary)

	createEmailFile(options)
		options
			id
		returns:
			promised
				new non-saved email file

	saveEmailFile(options)
		options
			id
			name
			content
			newName
			uploadContext

		returns
			promised
				email file
				list of all staged email summaries
				isNew - whether save resulted in create (new) or update
				email: related email

	deleteEmailFile(options)
		options
			id
			name
		returns:
			promised
				list of all staged email summaries
				email: related email

	restoreEmailFile(options)
		options
			id
			name
		returns:
			promised
				list of all staged email summaries
				email: related email

	flushPendingTasks()
	dispose()

	listEvents(options)
		options:
			query
		returns:
			promised array of ManagedEmailEvent

	search(options)
		options:
			query
			caseSensitive
			regEx
			componentScopes
			id
			state
			isStaged
			pageSize
			pageIndex
		retures
			promised array of EmailSearchResult
			TotalCount
			PageSize
			PageIndex

	importEmails
		options:
			uploadContext
			fileName
			importCommands
			factoryDefaultProviderId

	sendSample
		options
			id
			language
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
			// of 'me.model.email.staging.changed' which is dependent
			// on other state
			sockets.emailManagement.on('staging-updated', raised);
		},
		onRaiseImported: function(raised) {
			sockets.emailManagement.on('imported', raised);
		},
		onDispose: function() {
			sockets.emailManagement.off('staging-updated');
			sockets.emailManagement.off('imported');
		}
	};

	// aliases
	var messaging = $.telligent.evolution.messaging,
		sockets = $.telligent.evolution.sockets;

	var scheduledCommitCompleteSubscription;
	var scheduledCommitErrorSubscription;

	// events
	var events = {
		stagingChanged: 'me.model.email.staging.changed',
		imported: 'me.model.email.management.imported',
		emailUpdated: 'me.model.email.updated',
		emailDeleted: 'me.model.email.deleted',
		fileCreated: 'me.model.file.created',
		fileUpdated: 'me.model.file.updated',
		fileDeleted: 'me.model.file.deleted',
		emailsChanged: 'me.model.emails.changed', // identifies that there were any kind of changes, just for purposes of updating browse view
		emailsUpdated: 'me.model.emails.updated' // identification that multiple items were updated in order to load more details about those updates for any open items
	};

	function synthesizeIdForEmail(dataOptions) {
		if(!dataOptions) {
			return {
				id: null
			};
		};
		return {
			id: dataOptions.id
		};
	}

	function synthesizeIdForEmailFile(dataOptions) {
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

	function raiseEmailEvent(context, messageName, dataOptions, model, extraMessageData) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);

		raiseMessage(messageName, $.extend({
			id: synthesizeIdForEmail(dataOptions),
			model: model
		}, (extraMessageData || {})), {
			crossWindow: true
		});
	}

	function raiseEmailFileEvent(context, messageName, dataOptions, model) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);
		raiseMessage(messageName, {
			id: synthesizeIdForEmailFile(dataOptions),
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

	function serializeEmailIds(emails, defaultModel) {
		// serialize email requests
		var emailIds = [];
		for(var i = 0; i < emails.length; i++) {
			if (emails[i].model) {
				emailIds.push((emails[i].id || 't') + '|' + emails[i].model);
			} else if (defaultModel) {
				emailIds.push((emails[i].id || 't') + '|' + defaultModel);
			} else {
				emailIds.push((emails[i].id || 't'))
			}
		}
		return emailIds.join(',');
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
			serializedParts.push('`');
			serializedParts.push(commands[i].mode);
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
				includeTemplate
				includeEmails
			*/
			listEmails: function(options) {
				return context.provider.listEmails(options);
			},
			/*
			options:
				staged
			*/
			listConfigurations: function (options) {
				return context.provider.listConfigurations(options);
			},
			/*
			options
				id
				staged (default true)
				factoryDefault (default false)
				includeFileDigests (default false)
			*/
			getEmail: function(options) {
				return context.provider.getEmail(options);
			},
			/*
			options
				id
				name
				description
				templateScript
				templateScriptLanguage
				subjectScript
				subjectScriptLanguage
				headerScript
				headerScriptLanguage
				footerScript
				footerScriptLanguage
				bodyScript
				bodyScriptLanguage
				configurationXml
				resourcesToSave
			*/
			saveEmail: function(options) {
				if (options.events)
					options.events = (options.events || []).join(',');
				if (options.triggerTypes)
					options.triggerTypes = (options.triggerTypes || []).join(',');

				return context.queue.add(
					('saveEmail:' + options.id),
					function(){
						return context.provider.saveEmail(options)
							.then(function (response) {
								if(response.isNew) {
									raiseEmailEvent(context, events.emailCreated, options, response.savedEmail);
								} else {
									raiseEmailEvent(context, events.emailUpdated, options, response.savedEmail);
								}
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				id
			*/
			deleteEmail: function(options) {
				return context.queue.add(
					('deleteEmail:' + options.id),
					function(){
						return context.provider.deleteEmail(options)
							.then(function(response){
								// if there's still an email, then this effectively represented
								// a staged revert from customized default to a default or a staged deletion, so raise update instead
								if(response.email) {
									raiseEmailEvent(context, events.emailUpdated, options, response.email, {
										reverted: true
									});
								} else {
									raiseEmailEvent(context, events.emailDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				emails: [
					{ id: '' }
				]
			*/
			deleteEmails: function(options) {
				if(!options.emails)
					return;

				// serialize email requests
				var serializedEmailIds = serializeEmailIds(options.emails);

				return context.queue.add(
					('deleteEmails:' + serializedEmailIds),
					function(){
						context.suppressStagingChange = true;
						return context.provider.deleteEmails($.extend({}, options, {
							emailIds: serializedEmailIds
						})).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							raiseMessage(events.emailsChanged, {}, { crossWindow: true });


							// Items in which this delete does not stage a change, but rather
							// Just undoes _staged_ changes to an item which cannot be
							// undone, like a FD
							if(response && response.revertedEmails) {
								for(var i = 0; i < response.revertedEmails.length; i++) {
									(function(){
										var email = response.revertedEmails[i];
										raiseEmailEvent(context, events.emailUpdated, {
											id: email.Id
										}, email, { reverted: true });
									})();
								}
							}

							// Fully deleted (staged custom with no saved version, so not staging any reversion, just gone)
							// Items which are being fully deleted without staging
							if(response && response.deletedEmails) {
								for(var i = 0; i < response.deletedEmails.length; i++) {
									(function(){
										var email = response.deletedEmails[i];
										raiseEmailEvent(context, events.emailDeleted, {
											id: email.Id
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
				model: configuration|email
			*/
			publishEmail: function(options) {
				return context.queue.add(
					('publishEmail:' + options.id + ':' + (options.model || [])),
					function(){
						return context.provider.publishEmail(options)
							.then(function(response){
								if (options.model == 'configuration') {
									//
								} else {
									// if there's a published email after publishing,
									// this represents a published change of some sort (even if it's a published reversion)
									// so raise update event
									// but if there's no published email, then this represented a published deletion
									// so raise delete event
									if(response.publishedEmail) {
										raiseEmailEvent(context, events.emailUpdated, options, response.publishedEmail);
									} else {
										raiseEmailEvent(context, events.emailDeleted, options, null);
									}
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				emails: [
					{ id: '', model: 'configuration|email' }
				]
			*/
			publishEmails: function(options) {
				if(!options.emails)
					return;

				// serialize email requests
				var serializedEmailIds = serializeEmailIds(options.emails, 'email');

				function handleComplete(options) {
					// raise message about a mass change
					context.suppressStagingChange = false;
					messaging.publish(events.emailsChanged, {}, { crossWindow: true });

					// Items whose publication reverted them to the factory default
					if(options && options.revertedEmails) {
						for(var i = 0; i < options.revertedEmails.length; i++) {
							(function(){
								var email = options.revertedEmails[i];
								raiseEmailEvent(context, events.emailUpdated, {
									id: email.Id
								}, email, { reverted: true });
							})();
						}
					}

					// Items whose publication fully deleted them
					if(options && options.deletedEmails) {
						for(var i = 0; i < options.deletedEmails.length; i++) {
							(function(){
								var email = options.deletedEmails[i];
								raiseEmailEvent(context, events.emailDeleted, {
									id: email.Id
								}, null);
							})();
						}
					}
				}

				return context.queue.add(
					('publishEmails:' + serializedEmailIds),
					function(){
						$.telligent.evolution.administration.loading(true);
						return $.Deferred(function(d){
							context.suppressStagingChange = true;
							context.provider.publishEmails({
								emailIds: serializedEmailIds
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
				model: configuration|email
			*/
			revertEmail: function(options) {
				return context.queue.add(
					('revertEmail:' + options.id + ':' + (options.model || [])),
					function(){
						return context.provider.revertEmail(options)
							.then(function(response){
								if (options.model == 'configuration') {
									//
								} else {
									// if there's still an email, then this effectively represented
									// a revert from staged to non-staged version
									if(response.revertedEmail) {
										raiseEmailEvent(context, events.emailUpdated, options, response.revertedEmail, {
											reverted: true
										});
									// if not, then this represented reversion from staged to custom to non-existent (never published) state
									} else {
										raiseEmailEvent(context, events.emailDeleted, options, null);
									}
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				emails: [
					{ id: '', model: 'configuration|email' }
				]
			*/
			revertEmails: function (options) {
				if(!options.emails)
					return;

				// serialize email requests
				var serializedEmailIds = serializeEmailIds(options.emails);

				return context.queue.add(
					('revertEmails:' + serializedEmailIds),
					function(){
						context.suppressStagingChange = true;
						return context.provider.revertEmails($.extend({}, options, {
							emailIds: serializedEmailIds,
						})).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							raiseMessage(events.emailsChanged, {}, { crossWindow: true });
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
			getEmailFile: function(options) {
				// if fallback, get any version it can from top-down
				if(options.fallback) {
					return $.Deferred(function(d){
						// current
						context.provider.getEmailFile(options).then(function(r0){
							if(!r0) {
								// force non-staged
								options.staged = false;
								context.provider.getEmailFile(options).then(function(r1){
									if(!r1) {
										// force factory default
										options.factoryDefault = true;
										context.provider.getEmailFile(options)
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
					return context.provider.getEmailFile(options);
				}
			},
			/*
			options
				id
			*/
			createEmailFile: function(options) {
				return context.provider.createEmailFile(options);
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
			saveEmailFile: function(options) {
				return context.queue.add(
					('saveEmailFile:' + options.id + ':' + (options.queueSalt || '')),
					function(){
						return context.provider.saveEmailFile(options)
							.then(function(response){
								if(response.isNew) {
									raiseEmailFileEvent(context, events.fileCreated, options, response.savedEmailFile);
								} else {
									raiseEmailFileEvent(context, events.fileUpdated, options, response.savedEmailFile);
								}
								raiseEmailEvent(context, events.emailUpdated, options, response.email);
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				id
				name
			*/
			deleteEmailFile: function(options) {
				return context.queue.add(
					('deleteEmailFile:' + options.id + ':' + options.name),
					function(){
						return context.provider.deleteEmailFile(options)
							.then(function(response){
								raiseEmailFileEvent(context, events.fileDeleted, options, null);
								raiseEmailEvent(context, events.emailUpdated, options, response.email);
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				id
				name
			*/
			restoreEmailFile: function(options) {
				return context.queue.add(
					('restoreEmailFile:' + options.id + ':' + options.name),
					function(){
						return context.provider.restoreEmailFile(options)
							.then(function(response){
								raiseEmailFileEvent(context, events.fileCreated, options, response.savedEmailFile);
								raiseEmailEvent(context, events.emailUpdated, options, response.email);
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
			importEmails: function(options) {
				options.importCommands = serializeImportCommands(options.importCommands);
				return context.queue.add(
					('importEmails:' + options.uploadContext + ':' + options.fileName + ':' + options.importCommands),
					function(){
						$.telligent.evolution.administration.loading(true);

						return $.Deferred(function(d){
							// schedule importing
							context.provider.importEmails(options).then(function(response){
								// resolve this model's import() on completion of the scheduled import
								if (scheduledCommitCompleteSubscription) {
									$.telligent.evolution.messaging.unsubscribe(scheduledCommitCompleteSubscription);
								}
								scheduledCommitCompleteSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data) {
									if (data.progressKey == response.progressKey) {
										// ... but first synthesize client messages regarding imported items
										if(data.result.Imported) {
											var emails = [];
											for(var i = 0; i < data.result.updatedEmails.length; i++) {
												var email = {
													id: data.result.updatedEmails[i].Id
												};
												emails.push(email);
												raiseEmailEvent(context, events.emailUpdated, email, data.result.updatedEmails[i], {
													// treat this like a revert as it coudl be undoing other current staged changes
													reverted: true
												});
											}

											messaging.publish(events.emailsUpdated, {
												emails: emails
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
			},
			/*
			options
				id
				language
			*/
			sendSample: function(options) {
				return context.provider.sendSample(options);
			}
		}
	};

	return DataModel;

}, jQuery, window);
