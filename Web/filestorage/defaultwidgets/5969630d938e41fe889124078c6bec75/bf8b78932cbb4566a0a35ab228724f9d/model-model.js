/*
var dataModel = new DataModel(options)
	options:
		provider: provider
		queue: queue

high level methods for interacting with staged fragments.
destructive actions are queued
proper cross-tab messages are raised on certain actions

Events/messages:
	mfw.model.fragments.changed
		raised when a mass-action completes
			as a result of (.deleteFragments() .publishFragments() .revertFragments())
	mfw.model.fragment.staging.changed
		raised from server side when:
			the current set of staged fragment is changed in a way that results in a different unique set of staged fragments
			AND this didn't coincide with any other CUD fragment/attachment actions in this model
	mfw.model.fragment.created
		raised when:
			a fragment is saved to staging that results in a new fragment
		id:
			instanceIdentifier
			themeId
		model:
			resulting model or null
	mfw.model.fragment.updated
		raised when:
			a fragment is saved to staging that results in an update to an existing fragment
			a customized factory default fragment is deleted (reverted) back to the factory default state
			a fragment is published from staging to non-staged
			a fragment is reverted from staged to no longer staged
			a fragment's attachment is saved in staging (as this affects the fragment's own list of attachment metadata)
			a fragment's attachment is deleted in staging (as this affects the fragment's own list of attachment metadata)
		id:
			instanceIdentifier
			themeId
		model:
			resulting model or null
	mfw.model.fragment.deleted
		raised when:
			a custom fragment is deleted and there's no underlying factory default version to fall back to
		id:
			instanceIdentifier
			themeId
		model:
			resulting model or null
	mfw.model.attachment.created
		raised when:
			a fragment attachment is saved to existing that results in a create
		id:
			instanceIdentifier
			themeId
			name
		model:
			resulting model or null
	mfw.model.attachment.updated
		raised when:
			a fragment attachment is saved to staging that results in an update of an existing (or a delete of an old and create of a new via "rename")
		id:
			instanceIdentifier
			themeId
			name
		model:
			resulting model or null
	mfw.model.attachment.deleted
		raised when:
			a fragment attachment is deleted from staging
		id:
			instanceIdentifier
			themeId
			name
		model:
			resulting model or null


Methods:
	listFragments(options)
		options:
			themeId
			factoryDefaultProvider
			state
			isStaged
			scriptable
			query
			includeFileDigests (default false)
		returns
			promised array of fragment summaries

	getFragment(options)
		options
			instanceIdentifier
			themeId
			staged (default true)
			factoryDefault (default false)
			includeFileDigests (default false)
		returns
			promised fragment (non summary)

	createFragment(options)
		options
			instanceIdentifier
			factoryDefaultProvider
			themeId
		returns
			promised non-saved/staged fragment

	saveFragment(options)
		options
			 instanceIdentifier
			 name
			 description
			 cssClass
			 isCacheable
			 varyCacheByUser
			 contentScript
			 contentScriptLanguage
			 additionalCssScript
			 additionalCssScriptLanguage
			 headerScript
			 headerScriptLanguage
			 showHeaderByDefault
			 themeId
			 resourcesToSave
			 contextItemIds
			 configurationXml
			 factoryDefaultProvider
		returns
			promised
				savedFragment - fragment summary
				stagedFragments - list of all staged fragments summaries
				isNew - whether save resulted in create (new) or update

	deleteFragment(options)
		options
			instanceIdentifier
			themeId
		returns
			stagedFragments - promised list of all staged widgets summaries
			fragment - if null, then was a custom delete. if exists, then is fac default version post revert

	deleteFragments(options)
		options:
			fragments
		returns:
			stagedFragments - promised list of all staged widgets summaries

	cloneFragment(options)
		options
			instanceIdentifier
			themeId
		returns
			clonedFragment - fragment summary
			stagedFragments - list of all staged fragments summaries

	createFragmentVariant(options)
		options
			instanceIdentifier
			themeId
			variantThemeId
		returns
			savedFragment - fragment summary
			stagedFragments - list of all staged fragments summaries

	publishFragment(options)
		options
			instanceIdentifier
			themeId
		returns
			publishedFragment - published fragment
			stagedFragments - promised list of all staged widgets summaries

	publishFragments(options)
		options:
			fragments
		returns:
			stagedFragments - promised list of all staged widgets summaries

	revertFragment(options)
		options
			instanceIdentifier
			themeId
		returns
			revertedFragment - reverted fragment
			stagedFragments - promised list of all staged widgets summaries

	revertFragments(options)
		options:
			fragments
		returns:
			stagedFragments - promised list of all staged widgets summaries

	getFragmentAttachment(options)
		options
			instanceIdentifier
			themeId
			name
			staged (default true)
			factoryDefault (default false)
			fallback (default false) // fallback to lower version (non staged or default) if requrested version not available
		returns
			promised fragment attachment (non summary)

	saveFragmentAttachment(options)
		options
			instanceIdentifier
			themeId
			name
			content
			newName
			uploadContext
		returns
			promised
				fragment attachment
				list of all staged fragments summaries
				isNew - whether save resulted in create (new) or update
				fragment: related fragment

	deleteFragmentAttachment(options)
		options
			instanceIdentifier
			themeId
			name
		returns:
			promised
				list of all staged fragment summaries
				fragment: related fragment

	restoreFragmentAttachment(options)
		options
			instanceIdentifier
			themeId
			name
		returns:
			promised
				list of all staged theme summaries
				theme: related theme

	createFragmentAttachment(options)
		options
			instanceIdentifier
			themeId
		returns:
			promised
				new non-saved fragment attachment

	getFragmentExampleInstance(options)
		options
			instanceIdentifier
			themeId
		returns
			promised
				url

	listContexts(options)
		options:
			query
		returns
			promised array of context items

	listRestScopes(options)
		options:
			query
		returns
			promised array of rest scopes

	flushPendingTasks(options)
		options
	dispose()

	search(options)
		options:
			query
			caseSensitive
			regEx
			componentScopes
			instanceIdentifier
			themeId
			factoryDefaultProvider
			state
			isStaged
			scriptable
			pageSize
			pageIndex
		retures
			promised array of FragmentSearchResult
			TotalCount
			PageSize
			PageIndex
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
			// of 'mfw.model.fragment.staging.changed' which is dependent
			// on other state
			sockets.fragmentManagement.on('staging-updated', raised);
		},
		onDispose: function() {
			sockets.fragmentManagement.off('staging-updated');
		}
	};

	// aliases
	var messaging = $.telligent.evolution.messaging,
		sockets = $.telligent.evolution.sockets;

	var scheduledCommitCompleteSubscription;
	var scheduledCommitErrorSubscription;

	// events
	var events = {
		stagingChanged: 'mfw.model.fragment.staging.changed',
		fragmentCreated: 'mfw.model.fragment.created',
		fragmentUpdated: 'mfw.model.fragment.updated',
		fragmentDeleted: 'mfw.model.fragment.deleted',
		attachmentCreated: 'mfw.model.attachment.created',
		attachmentUpdated: 'mfw.model.attachment.updated',
		attachmentDeleted: 'mfw.model.attachment.deleted',
		fragmentsChanged: 'mfw.model.fragments.changed', // identifies that there were any kind of changes, just for purposes of updating browse view
		fragmentsUpdated: 'mfw.model.fragments.updated' // identification that multiple items were updated in order to load more details about those updates for any open items
	};

	function synthesizeIdForFragment(dataOptions) {
		if(!dataOptions) {
			return {
				instanceIdentifier: null,
				themeId: null
			};
		};
		return {
			instanceIdentifier: dataOptions.instanceIdentifier,
			themeId: dataOptions.themeId
		};
	}

	function synthesizeIdForFragmentAttachment(dataOptions) {
		if(!dataOptions) {
			return {
				instanceIdentifier: null,
				themeId: null,
				name: null
			};
		}
		return {
			instanceIdentifier: dataOptions.instanceIdentifier,
			themeId: dataOptions.themeId,
			name: dataOptions.name
		};
	}

	function raiseFragmentEvent(context, messageName, dataOptions, model, extraMessageData) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);
		messaging.publish(messageName, $.extend({
			id: synthesizeIdForFragment(dataOptions),
			model: model
		}, (extraMessageData || {})), {
			crossWindow: true
		});
	}

	function raiseFragmentAttachmentEvent(context, messageName, dataOptions, model) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);
		messaging.publish(messageName, {
			id: synthesizeIdForFragmentAttachment(dataOptions),
			model: model
		}, {
			crossWindow: true
		});
	}

	function serializeImportCommands(commands) {
		var serializedParts = [];
		for(var i = 0; i < (commands || []).length; i++) {
			if(serializedParts.length > 0)
				serializedParts.push(',');
			serializedParts.push(commands[i].id);
			if($.trim(commands[i].theme)) {
				serializedParts.push(':');
				serializedParts.push(commands[i].theme);
			}
			serializedParts.push('`');
			if(commands[i].import) {
				serializedParts.push('1');
			} else {
				serializedParts.push('0');
			}
		}
		return serializedParts.join('');
	}

	// temporarily suppresses any change events received
	function suppressStagingChange(context) {
		context.suppressStagingChange = true;
		global.clearTimeout(context.suppressTimeout);
		context.suppressTimeout = global.setTimeout(function(){
			context.suppressStagingChange = false;
		}, context.stagingChangedTimeoutDelay);
	}

	function publishStagingChanged(context) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		context.raiseStagingChangedTimeout = global.setTimeout(function(){
			if(!context.suppressStagingChange) {
				messaging.publish(events.stagingChanged);
			}
		}, context.stagingChangedTimeoutDelay);
	}

	function serializeFragmentIds(fragments) {
		// serialize fragment requests
		var fragmentIds = [];
		for(var i = 0; i < fragments.length; i++) {
			fragmentIds.push(fragments[i].instanceIdentifier + ':' + (fragments[i].themeId || ''));
		}
		return fragmentIds.join(',');
	}

	var DataModel = function(options){
		var context = $.extend({}, defaults, options || {
			suppressStagingChange: false
		});

		context.onRaiseStagingChange(function(){
			publishStagingChanged(context);
		});

		return {
			/*
			options:
				themeId
				factoryDefaultProvider
				state
				isStaged
				scriptable
				query
				includeFileDigests (default false)
			*/
			listFragments: function(options) {
				return context.provider.listFragments(options);
			},
			/*
			options
				instanceIdentifier
				themeId
				factoryDefault
				includeFileDigests (default false)
			*/
			getFragment: function(options) {
				return context.provider.getFragment(options);
			},
			/*
			options
				instanceIdentifier
				factoryDefaultProvider
				themeId
			*/
			createFragment: function(options) {
				return context.provider.createFragment(options);
			},
			/*
			options
				 instanceIdentifier
				 name
				 description
				 cssClass
				 isCacheable
				 varyCacheByUser
				 contentScript
				 contentScriptLanguage
				 additionalCssScript
				 additionalCssScriptLanguage
				 headerScript
				 headerScriptLanguage
				 showHeaderByDefault
				 themeId
				 resourcesToSave
				 contextItemIds
				 configurationXml
				 factoryDefaultProvider
				 immediate: false
			*/
			saveFragment: function(options) {
				return context.queue.add(
					('saveFragment:' + options.instanceIdentifier + ':' + options.themeId),
					function(){
						return context.provider.saveFragment(options)
							.then(function(response){
								if(response.isNew) {
									raiseFragmentEvent(context, events.fragmentCreated, options, response.savedFragment);
								} else {
									raiseFragmentEvent(context, events.fragmentUpdated, options, response.savedFragment);
								}
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				instanceIdentifier
				themeId
				newInstanceIdentifier
				newFactoryDefaultProvider
			*/
			cloneFragment: function(options) {
				return context.queue.add(
					('cloneFragment:' + options.instanceIdentifier + ':' + options.themeId + ':' + (options.newInstanceIdentifier || '') + ':' + (options.newFactoryDefaultProvider || '')),
					function(){
						return context.provider.cloneFragment(options)
							.then(function(response){
								raiseFragmentEvent(context, events.fragmentCreated, options, response.clonedFragment, {
									cloned: true
								});
								return response;
							});
					});
			},
			/*
			options
				instanceIdentifier
				themeId
				variantThemeId
			*/
			createFragmentVariant: function(options) {
				return context.queue.add(
					('createVariant:' + options.instanceIdentifier + ':' + options.themeId + ':' + options.variantThemeId),
					function(){
						return context.provider.createFragmentVariant(options)
							.then(function(response){
								raiseFragmentEvent(context, events.fragmentCreated, options, response.savedFragment, {
									cloned: true
								});
								return response;
							});
					});
			},
			/*
			options
				instanceIdentifier
				themeId
			*/
			deleteFragment: function(options) {
				return context.queue.add(
					('deleteFragment:' + options.instanceIdentifier + ':' + options.themeId),
					function(){
						return context.provider.deleteFragment(options)
							.then(function(response){
								// if there's still a fragment, then this effectively represented
								// a staged revert from customized default to a default, so raise update instead
								if(response.fragment) {
									raiseFragmentEvent(context, events.fragmentUpdated, options, response.fragment, {
										reverted: true
									});
								} else {
									raiseFragmentEvent(context, events.fragmentDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				fragments: [
					{ themeId: '', instanceIdentifier: '' }
				]
			*/
			deleteFragments: function(options) {
				if(!options.fragments)
					return;

				// serialize fragment requests
				var serializedFragments = serializeFragmentIds(options.fragments);

				return context.queue.add(
					('revertFragments:' + serializedFragments),
					function(){
						context.suppressStagingChange = true;
						return context.provider.deleteFragments({
							fragmentIds: serializedFragments
						}).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							messaging.publish(events.fragmentsChanged, {}, { crossWindow: true });

							// Items in which this delete does not stage a change, but rather
							// Just undoes _staged_ changes to an item which cannot be
							// undone, like a FD
							if(response && response.revertedFragments) {
								for(var i = 0; i < response.revertedFragments.length; i++) {
									(function(){
										var fragment = response.revertedFragments[i];
										raiseFragmentEvent(context, events.fragmentUpdated, {
											instanceIdentifier: fragment.InstanceIdentifier,
											themeId: fragment.ThemeId
										}, fragment, { reverted: true });
									})();
								}
							}

							// Fully deleted (staged custom with no saved version, so not staging any reversion, just gone)
							// Items which are being fully deleted without staging
							if(response && response.deletedFragments) {
								for(var i = 0; i < response.deletedFragments.length; i++) {
									(function(){
										var fragment = response.deletedFragments[i];
										raiseFragmentEvent(context, events.fragmentDeleted, {
											instanceIdentifier: fragment.InstanceIdentifier,
											themeId: fragment.ThemeId
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
				instanceIdentifier
				themeId
			*/
			publishFragment: function(options) {
				return context.queue.add(
					('publishFragment:' + options.instanceIdentifier + ':' + options.themeId),
					function(){
						return context.provider.publishFragment(options)
							.then(function(response){
								// if there's a published fragment after publishing,
								// this represents a published change of some sort (even if it's a published reversion)
								// so raise update event
								// but if there's no published fragment, then this represented a published deletion
								// so raise delete event
								if (response.publishedFragment) {
									raiseFragmentEvent(context, events.fragmentUpdated, options, response.publishedFragment);
								} else {
									raiseFragmentEvent(context, events.fragmentDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				fragments: [
					{ themeId: '', instanceIdentifier: '' }
				]
			*/
			publishFragments: function(options) {
				if(!options.fragments)
					return;

				// serialize fragment requests
				var serializedFragments = serializeFragmentIds(options.fragments);

				function handleComplete(options) {
					// raise message about a mass change
					context.suppressStagingChange = false;
					messaging.publish(events.fragmentsChanged, {}, { crossWindow: true });

					// Items whose publication reverted them to the factory default
					if(options && options.revertedFragments) {
						for(var i = 0; i < options.revertedFragments.length; i++) {
							(function(){
								var fragment = options.revertedFragments[i];
								raiseFragmentEvent(context, events.fragmentUpdated, {
									instanceIdentifier: fragment.InstanceIdentifier,
									themeId: fragment.ThemeId
								}, fragment, { reverted: true });
							})();
						}
					}

					// Items whose publication fully deleted them
					if(options && options.deletedFragments) {
						for(var i = 0; i < options.deletedFragments.length; i++) {
							(function(){
								var fragment = options.deletedFragments[i];
								raiseFragmentEvent(context, events.fragmentDeleted, {
									instanceIdentifier: fragment.InstanceIdentifier,
									themeId: fragment.ThemeId
								}, null);
							})();
						}
					}
				}

				return context.queue.add(
					('publishFragments:' + serializedFragments),
					function(){
						$.telligent.evolution.administration.loading(true);
						return $.Deferred(function(d){
							context.suppressStagingChange = true;
							context.provider.publishFragments({
								fragmentIds: serializedFragments
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
				instanceIdentifier
				themeId
			*/
			revertFragment: function(options) {
				return context.queue.add(
					('revertFragment:' + options.instanceIdentifier + ':' + options.themeId),
					function(){
						return context.provider.revertFragment(options)
							.then(function(response){
								// if there's still a fragment, then this effectively represented
								// a revert from staged to non-staged version
								if(response.revertedFragment) {
									raiseFragmentEvent(context, events.fragmentUpdated, options, response.revertedFragment, {
										reverted: true
									});
								// if not, then this represented reversion from staged to custom to non-existent (never published) state
								} else {
									raiseFragmentEvent(context, events.fragmentDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				fragments: [
					{ themeId: '', instanceIdentifier: '' }
				]
			*/
			revertFragments: function(options) {
				if(!options.fragments)
					return;

				// serialize fragment requests
				var serializedFragments = serializeFragmentIds(options.fragments);

				return context.queue.add(
					('revertFragments:' + serializedFragments),
					function(){
						context.suppressStagingChange = true;
						return context.provider.revertFragments({
							fragmentIds: serializedFragments
						}).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							messaging.publish(events.fragmentsChanged, {}, { crossWindow: true });
							return response;
						});
					}, { immediate: true });
			},
			/*
			options
				instanceIdentifier
				themeId
				name
				staged
				factoryDefault (default false)
				fallback (default false) // fallback to lower version (non staged or default) if requrested version not available
			*/
			getFragmentAttachment: function(options) {
				// if fallback, get any version it can from top-down
				if(options.fallback) {
					return $.Deferred(function(d){
						// current
						context.provider.getFragmentAttachment(options).then(function(r0){
							if(!r0) {
								// force non-staged
								options.staged = false;
								context.provider.getFragmentAttachment(options).then(function(r1){
									if(!r1) {
										// force factory default
										options.factoryDefault = true;
										context.provider.getFragmentAttachment(options)
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
					return context.provider.getFragmentAttachment(options);
				}
			},
			/*
			options
				instanceIdentifier
				themeId
				name
				content
				newName
				uploadContext
				immediate
			*/
			saveFragmentAttachment: function(options) {
				var queueKey = ('saveFragmentAttachment:' + options.instanceIdentifier + ':' + options.themeId + ':' + (options.queueSalt || ''));
				return context.queue.add(queueKey,
					function(){
						return context.provider.saveFragmentAttachment(options)
							.then(function(response){
								if(response.isNew) {
									raiseFragmentAttachmentEvent(context, events.attachmentCreated, options, response.savedAttachment);
								} else {
									raiseFragmentAttachmentEvent(context, events.attachmentUpdated, options, response.savedAttachment);
								}
								raiseFragmentEvent(context, events.fragmentUpdated, options, response.fragment);
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				instanceIdentifier
				themeId
				name
			*/
			deleteFragmentAttachment: function(options) {
				return context.queue.add(
					('deleteFragmentAttachment:' + options.instanceIdentifier + ':' + options.themeId + ':' + options.name),
					function(){
						return context.provider.deleteFragmentAttachment(options)
							.then(function(response){
								raiseFragmentAttachmentEvent(context, events.attachmentDeleted, options, null);
								raiseFragmentEvent(context, events.fragmentUpdated, options, response.fragment);
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				instanceIdentifier
				themeId
				name
			*/
			restoreFragmentAttachment: function(options) {
				return context.queue.add(
					('restoreFragmentAttachment:' + options.instanceIdentifier + ':' + options.themeId + ':' + options.name),
					function(){
						return context.provider.restoreFragmentAttachment(options)
							.then(function(response){
								raiseFragmentAttachmentEvent(context, events.attachmentCreated, options, response.savedAttachment);
								raiseFragmentEvent(context, events.fragmentUpdated, options, response.fragment);
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				instanceIdentifier
				themeId
			*/
			createFragmentAttachment: function(options) {
				return context.provider.createFragmentAttachment(options);
			},
			/*
			options
				instanceIdentifier
				themeId
			*/
			getFragmentExampleInstance: function(options) {
				return $.Deferred(function(d){
					context.provider.getFragmentExampleInstance(options).then(function(resp){
						if(resp && resp.ExampleUrl) {
							$.telligent.evolution.themePreview.enabled(true).then(function(){
								d.resolve(resp);
							}).catch(function(){
								d.reject();
							});
						} else {
							d.resolve(resp);
						}
					}).catch(function(){
						d.reject();
					});
				}).promise();
			},
			/*
			options
				uploadContext
				fileName
				importCommands
			*/
			importFragments: function(options) {
				options.importCommands = serializeImportCommands(options.importCommands);
				return context.queue.add(
					('importFragments:' + options.uploadContext + ':' + options.fileName + ':' + options.importCommands + ':' + options.provider),
					function(){
						$.telligent.evolution.administration.loading(true);

						return $.Deferred(function(d){
							// schedule importing
							context.provider.importFragments(options).then(function(response){
								// resolve this model's import() on completion of the scheduled import
								if (scheduledCommitCompleteSubscription) {
									$.telligent.evolution.messaging.unsubscribe(scheduledCommitCompleteSubscription);
								}
								scheduledCommitCompleteSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data) {
									if (data.progressKey == response.progressKey) {
										// ... but first synthesize client messages regarding imported items
										if(data.result.Imported) {
											for(var i = 0; i < data.result.newFragments.length; i++) {
												raiseFragmentEvent(context, events.fragmentCreated, {
													instanceIdentifier: data.result.newFragments[i].InstanceIdentifier,
													themeId: data.result.newFragments[i].ThemeId
												}, data.result.newFragments[i]);
											}
											var fragments = [];
											for(var i = 0; i < data.result.updatedFragments.length; i++) {
												var fragment = {
													instanceIdentifier: data.result.updatedFragments[i].InstanceIdentifier,
													themeId: data.result.updatedFragments[i].ThemeId
												};
												fragments.push(fragment);
												raiseFragmentEvent(context, events.fragmentUpdated, fragment, data.result.updatedFragments[i], {
													// treat this like a revert as it coudl be undoing other current staged changes
													reverted: true
												});
											}


											messaging.publish(events.fragmentsUpdated, {
												fragments: fragments
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
			options:
				filter
			*/
			listContexts: function(options) {
				return context.provider.listContexts(options);
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
				options
			*/
			flushPendingTasks: function(options) {
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
				instanceIdentifier
				themeId
				factoryDefaultProvider
				state
				isStaged
				scriptable
			*/
			search: function(options) {
				return context.provider.search(options);
			}
		}
	};

	return DataModel;

}, jQuery, window);
