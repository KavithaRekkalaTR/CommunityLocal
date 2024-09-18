/*
Theme Studio Data Model

 * High level methods for interacting with staged themes. Intended for direct use by studio UI.
 * Raises/synthesizes events based on server events as well as inferred from client actions
 * Destructive actions are queued
 * Proper cross-tab messages are raised on certain actions

var dataModel = new DataModel(options)
	options:
		provider: provider
		queue: queue

Events/messages:
	mt.model.themes.changed
		raised when a mass-action completes
			as a result of (.deleteThemes() .publishThemes() .revertThemes())
	mt.model.theme.staging.changed
		raised from server side when:
			the current set of staged theme is changed in a way that results in a different unique set of staged themes
			AND this didn't coincide with any other CUD theme/file actions in this model
	mt.model.theme.created
		raised when:
			a theme is saved to staging that results in actions new theme
		id:
			instanceIdentifier
			themeId
		model:
			resulting model or null
	mt.model.theme.updated
		raised when:
			a theme is saved to staging that results in an update to an existing theme
			a customized factory default theme is deleted (reverted) back to the factory default state
			a theme is published from staging to non-staged
			a theme is reverted from staged to no longer staged
			a theme's file is saved in staging (as this affects the theme's own list of file metadata)
			a theme's file is deleted in staging (as this affects the theme's own list of file metadata)
		id:
			instanceIdentifier
			themeId
		model:
			resulting model or null
	mt.model.theme.deleted
		raised when:
			a custom theme is deleted and there's no underlying factory default version to fall back to
		id:
			instanceIdentifier
			themeId
		model:
			resulting model or null
	mt.model.file.created
		raised when:
			a theme file is saved to existing that results in a create
		id:
			instanceIdentifier
			themeId
			name
		model:
			resulting model or null
	mt.model.file.updated
		raised when:
			a theme file is saved to staging that results in an update of an existing (or a delete of an old and create of a new via "rename")
		id:
			instanceIdentifier
			themeId
			name
		model:
			resulting model or null
	mt.model.file.deleted
		raised when:
			a theme file is deleted from staging
		id:
			instanceIdentifier
			themeId
			name
		model:
			resulting model or null

Methods:
	listThemes(options)
		options:
			typeId
			state
			staged
			includeFileDigests (default false)
		returns
			promised array of theme summaries

	getTheme(options)
		options
			id
			typeId
			staged (default true)
			factoryDefault (default false)
			includeFileDigests (default false)
		returns
			promised theme (non summary)

	saveTheme(options)
		options
			id
			typeId
			name
			description
			mediaMaxWidthPixels
			mediaMaxHeightPixels
			headScript
			headScriptLanguage
			bodyScript
			bodyScriptLanguage
			resourcesToSave
			configurationXml
			configurationScript
			paletteTypesXml
			newScriptFiles: []
			newStyleFiles: []
			immediate: false
			uploadContext
			newPreviewFileName

	deleteTheme(options)
		options
			id
			typeId
			revertStagedPages
			revertStagedHeaders
			revertStagedFooters
			revertStagedFragments
		returns
			stagedThemes - promised list of all staged theme summaries
			theme - if null, then was a custom delete. if exists, then is fac default version post revert

	deleteThemes(options)
		options:
			themes: [
				{ id: '', typeId: '' }
			]
			revertStagedPages
			revertStagedHeaders
			revertStagedFooters
			revertStagedFragments
		returns:
			stagedThemes - promised list of all now-staged theme summaries
			revertedThemes - promised list of all reverted theme summaries from deletion
			deletedThemes - promised list of all deleted themes (id/typeId)

	cloneTheme(options)
		options
			id
			typeId
			newId
		returns
			promised
				clonedTheme - theme summary
				stagedThemes - list of all staged themes summaries

	publishTheme(options)
		options
			id
			typeId
		returns
			publishedTheme - published theme
			stagedThemes - promised list of all staged theme summaries

	publishThemes(options, ajaxOptions)
		options:
			themes: [
				{ id: '', typeId: '' }
			]
		ajaxOptions
			error
		returns:
			stagedThemes - promised list of all staged theme summaries

	revertTheme(options)
		options
			id
			typeId
			revertStagedPages
			revertStagedHeaders
			revertStagedFooters
			revertStagedFragments
		returns
			revertedTheme - reverted theme
			stagedThemes - promised list of all staged theme summaries

	revertThemes(options)
		options:
			themes: [
				{ id: '', typeId: '' }
			]
			revertStagedPages
			revertStagedHeaders
			revertStagedFooters
			revertStagedFragments
		returns:
			stagedThemes - promised list of all staged theme summaries

	getThemeFile(options)
		options
			id
			typeId
			name
			type (style|script|file|preview)
			staged (default true)
			factoryDefault (default false)
			fallback (default false) // fallback to lower version (non staged or default) if requrested version not available
		returns
			promised theme file (non summary)

	createThemeFile(options)
		options
			id
			typeId
			type (style|script|file|preview)
		returns:
			promised
				new non-saved theme file

	saveThemeFile(options)
		options
			id
			typeId
			name
			type  (style|script|file|preview)
			content
			newName
			uploadContext
			applyToModals
			applyToNonModals
			internetExplorerMaxVersion
			applyToAuthorizationRequests
			mediaQuery
			isRightToLeft

		returns
			promised
				theme file
				list of all staged theme summaries
				isNew - whether save resulted in create (new) or update
				theme: related theme

	deleteThemeFile(options)
		options
			id
			typeId
			name
			type (style|script|file|preview)
		returns:
			promised
				list of all staged theme summaries
				theme: related theme

	restoreThemeFile(options)
		options
			id
			typeId
			name
			type (style|script|file|preview)
		returns:
			promised
				list of all staged theme summaries
				theme: related theme

	listRestScopes(options)
		options:
			query
		returns
			promised array of rest scopes

	flushPendingTasks()
	dispose()

	search(options)
		options:
			query
			caseSensitive
			regEx
			componentScopes
			id
			typeId
			state
			isStaged
			pageSize
			pageIndex
		retures
			promised array of ThemeSearchResult
			TotalCount
			PageSize
			PageIndex

	listLayouts
		options
			id
			typeId
			staged (default true)
			factoryDefault (default false)
		returns:
			promised array of Layout

	listFragments
		options
			id
			typeId
			staged (default true)
			factoryDefault (default false)
		returns:
			promised array of fragments

	revertThemeOptions
		options
			id
			typeId
			stage
			revertPagesTo: Default|ConfiguredDefault
			revertCustomPages: true|false
			revertHeadersTo: Default|ConfiguredDefault
			revertFootersTo: Default|ConfiguredDefault
			revertScopedProperties: true|false
		returns:
			?

	findApplications
		options
			typeId
			query
		returns:
			promised array of applications

	previewTheme
		options:
			id
			typeId
			applicationId
		returns
			url of previewed theme
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
			// of 'mt.model.theme.staging.changed' which is dependent
			// on other state
			sockets.themeManagement.on('staging-updated', raised);
		},
		onDispose: function() {
			sockets.themeManagement.off('staging-updated');
		}
	};

	// aliases
	var messaging = $.telligent.evolution.messaging,
		sockets = $.telligent.evolution.sockets;

	var scheduledCommitCompleteSubscription;
	var scheduledCommitErrorSubscription;

	// events
	var events = {
		stagingChanged: 'mt.model.theme.staging.changed',
		themeCreated: 'mt.model.theme.created',
		themeUpdated: 'mt.model.theme.updated',
		themeDeleted: 'mt.model.theme.deleted',
		fileCreated: 'mt.model.file.created',
		fileUpdated: 'mt.model.file.updated',
		fileDeleted: 'mt.model.file.deleted',
		themesChanged: 'mt.model.themes.changed', // identifies that there were any kind of changes, just for purposes of updating browse view
		themesUpdated: 'mt.model.themes.updated' // identification that multiple items were updated in order to load more details about those updates for any open items
	};

	function synthesizeIdForTheme(dataOptions) {
		if(!dataOptions) {
			return {
				id: null,
				typeId: null
			};
		};
		return {
			id: dataOptions.id,
			typeId: dataOptions.typeId
		};
	}

	function synthesizeIdForThemeFile(dataOptions) {
		if(!dataOptions) {
			return {
				id: null,
				typeId: null,
				name: null,
				type: null
			};
		}
		return {
			id: dataOptions.id,
			typeId: dataOptions.typeId,
			name: dataOptions.name,
			type: dataOptions.type
		};
	}

	function raiseMessage(name, data, options) {
		messaging.publish(name, data, options);
	}

	function raiseThemeEvent(context, messageName, dataOptions, model, extraMessageData) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);

		raiseMessage(messageName, $.extend({
			id: synthesizeIdForTheme(dataOptions),
			model: model
		}, (extraMessageData || {})), {
			crossWindow: true
		});
	}

	function raiseThemeFileEvent(context, messageName, dataOptions, model) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		suppressStagingChange(context);
		raiseMessage(messageName, {
			id: synthesizeIdForThemeFile(dataOptions),
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

	function publishStagingChanged(context) {
		global.clearTimeout(context.raiseStagingChangedTimeout);
		context.raiseStagingChangedTimeout = global.setTimeout(function(){
			if(!context.suppressStagingChange) {
				raiseMessage(events.stagingChanged);
			}
		}, context.stagingChangedTimeoutDelay);
	}

	function serializeThemeIds(themes) {
		// serialize theme requests
		var themeIds = [];
		for(var i = 0; i < themes.length; i++) {
			themeIds.push(themes[i].id + ':' + themes[i].typeId);
		}
		return themeIds.join(',');
	}

	function serializeImportCommands(commands) {
		var serializedParts = [];
		for(var i = 0; i < (commands || []).length; i++) {
			if(serializedParts.length > 0)
				serializedParts.push(',');
			serializedParts.push(commands[i].id);
			if($.trim(commands[i].typeId)) {
				serializedParts.push(':');
				serializedParts.push(commands[i].typeId);
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
				typeId
				state
				staged
				includeFileDigests (default false)
			*/
			listThemes: function(options) {
				return context.provider.listThemes(options);
			},
			/*
			options
				id
				typeId
				staged (default true)
				factoryDefault (default false)
				includeFileDigests (default false)
			*/
			getTheme: function(options) {
				return context.provider.getTheme(options);
			},
			/*
			options
				id
				typeId
				name
				description
				mediaMaxWidthPixels
				mediaMaxHeightPixels
				headScript
				headScriptLanguage
				bodyScript
				bodyScriptLanguage
				resourcesToSave
				configurationXml
				configurationScript
				paletteTypesXml
				newScriptFiles: []
				newStyleFiles: []
				immediate: false
				uploadContext
				newPreviewFileName
			*/
			saveTheme: function(options) {
				if (options.newStyleFiles)
					options.newStyleFiles = (options.newStyleFiles || []).join('/');
				if (options.newScriptFiles)
					options.newScriptFiles = (options.newScriptFiles || []).join('/');

				return context.queue.add(
					('saveTheme:' + options.id + ':' + options.typeId),
					function(){
						return context.provider.saveTheme(options)
							.then(function(response){
								if(response.isNew) {
									raiseThemeEvent(context, events.themeCreated, options, response.savedTheme);
								} else {
									raiseThemeEvent(context, events.themeUpdated, options, response.savedTheme);
								}
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				id
				typeId
				revertStagedPages
				revertStagedHeaders
				revertStagedFooters
				revertStagedFragments
			*/
			deleteTheme: function(options) {
				return context.queue.add(
					('deleteTheme:' + options.id + ':' + options.typeId),
					function(){
						return context.provider.deleteTheme(options)
							.then(function(response){
								// if there's still a theme, then this effectively represented
								// a staged revert from customized default to a default or a staged deletion, so raise update instead
								if(response.theme) {
									raiseThemeEvent(context, events.themeUpdated, options, response.theme, {
										reverted: true
									});
								} else {
									raiseThemeEvent(context, events.themeDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				id
				typeId
				newId
			*/
			cloneTheme: function(options) {
				return context.queue.add(
					('cloneTheme:' + options.id + ':' + options.typeId + ':' + (options.newId || '')),
					function(){
						return context.provider.cloneTheme(options)
							.then(function(response){
								raiseThemeEvent(context, events.themeCreated, options, response.clonedTheme, {
									cloned: true
								});
								return response;
							});
					});
			},
			/*
			options
				themes: [
					{ id: '', typeId: '' }
				]
				revertStagedPages
				revertStagedHeaders
				revertStagedFooters
				revertStagedFragments
			*/
			deleteThemes: function(options) {
				if(!options.themes)
					return;

				var serializedThemeIds = serializeThemeIds(options.themes);

				return context.queue.add(
					('deleteThemes:' + serializedThemeIds),
					function(){
						context.suppressStagingChange = true;
						return context.provider.deleteThemes($.extend({}, options, {
							themeIds: serializedThemeIds
						})).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							raiseMessage(events.themesChanged, {}, { crossWindow: true });


							// Items in which this delete does not stage a change, but rather
							// Just undoes _staged_ changes to an item which cannot be
							// undone, like a FD
							if(response && response.revertedThemes) {
								for(var i = 0; i < response.revertedThemes.length; i++) {
									(function(){
										var theme = response.revertedThemes[i];
										raiseThemeEvent(context, events.themeUpdated, {
											id: theme.Id,
											typeId: theme.TypeId
										}, theme, { reverted: true });
									})();
								}
							}

							// Fully deleted (staged custom with no saved version, so not staging any reversion, just gone)
							// Items which are being fully deleted without staging
							if(response && response.deletedThemes) {
								for(var i = 0; i < response.deletedThemes.length; i++) {
									(function(){
										var theme = response.deletedThemes[i];
										raiseThemeEvent(context, events.themeDeleted, {
											id: theme.Id,
											typeId: theme.TypeId
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
				typeId
			*/
			publishTheme: function(options) {
				return context.queue.add(
					('publishTheme:' + options.id + ':' + options.typeId),
					function(){
						return context.provider.publishTheme(options)
							.then(function(response){
								// if there's a published theme after publishing,
								// this represents a published change of some sort (even if it's a published reversion)
								// so raise update event
								// but if there's no published theme, then this represented a published deletion
								// so raise delete event
								if(response.publishedTheme) {
									raiseThemeEvent(context, events.themeUpdated, options, response.publishedTheme);
								} else {
									raiseThemeEvent(context, events.themeDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				themes: [
					{ id: '', typeId: '' }
				]
			*/
			publishThemes: function(options) {
				if(!options.themes)
					return;

				var serializedThemeIds = serializeThemeIds(options.themes);

				function handleComplete(options) {
					// raise message about a mass change
					context.suppressStagingChange = false;
					messaging.publish(events.themesChanged, {}, { crossWindow: true });

					// Items whose publication reverted them to the factory default
					if(options && options.revertedThemes) {
						for(var i = 0; i < options.revertedThemes.length; i++) {
							(function(){
								var theme = options.revertedThemes[i];
								raiseThemeEvent(context, events.themeUpdated, {
									id: theme.Id,
									typeId: theme.TypeId
								}, theme, { reverted: true });
							})();
						}
					}

					// Items whose publication fully deleted them
					if(options && options.deletedThemes) {
						for(var i = 0; i < options.deletedThemes.length; i++) {
							(function(){
								var theme = options.deletedThemes[i];
								raiseThemeEvent(context, events.themeDeleted, {
									id: theme.Id,
									typeId: theme.TypeId
								}, null);
							})();
						}
					}
				}

				return context.queue.add(
					('publishThemes:' + serializedThemeIds),
					function(){

						$.telligent.evolution.administration.loading(true);
						return $.Deferred(function(d){
							context.suppressStagingChange = true;
							context.provider.publishThemes({
								themeIds: serializedThemeIds
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
				typeId
				revertStagedPages
				revertStagedHeaders
				revertStagedFooters
				revertStagedFragments
			*/
			revertTheme: function(options) {
				return context.queue.add(
					('revertTheme:' + options.id + ':' + options.typeId),
					function(){
						return context.provider.revertTheme(options)
							.then(function(response){
								// if there's still a theme, then this effectively represented
								// a revert from staged to non-staged version
								if(response.revertedTheme) {
									raiseThemeEvent(context, events.themeUpdated, options, response.revertedTheme, {
										reverted: true
									});
								// if not, then this represented reversion from staged to custom to non-existent (never published) state
								} else {
									raiseThemeEvent(context, events.themeDeleted, options, null);
								}
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				themes: [
					{ id: '', typeId: '' }
				]
				revertStagedPages
				revertStagedHeaders
				revertStagedFooters
				revertStagedFragments
			*/
			revertThemes: function(options) {
				if(!options.themes)
					return;

				var serializedThemeIds = serializeThemeIds(options.themes);

				return context.queue.add(
					('revertThemes:' + serializedThemeIds),
					function(){
						context.suppressStagingChange = true;
						return context.provider.revertThemes($.extend({}, options, {
							themeIds: serializedThemeIds,
						})).then(function(response){
							// raise message about a mass change
							context.suppressStagingChange = false;
							raiseMessage(events.themesChanged, {}, { crossWindow: true });
							return response;
						});
					}, { immediate: true });
			},
			/*
			options
				id
				typeId
				name
				type (style|script|file|preview)
				staged (default true)
				factoryDefault (default false)
				fallback (default false) // fallback to lower version (non staged or default) if requrested version not available
			*/
			getThemeFile: function(options) {
				// if fallback, get any version it can from top-down
				if(options.fallback) {
					return $.Deferred(function(d){
						// current
						context.provider.getThemeFile(options).then(function(r0){
							if(!r0) {
								// force non-staged
								options.staged = false;
								context.provider.getThemeFile(options).then(function(r1){
									if(!r1) {
										// force factory default
										options.factoryDefault = true;
										context.provider.getThemeFile(options)
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
					return context.provider.getThemeFile(options);
				}
			},
			/*
			options
				id
				typeId
				type (style|script|file|preview)
			*/
			createThemeFile: function(options) {
				return context.provider.createThemeFile(options);
			},
			/*
			options
				id
				typeId
				name
				type  (style|script|file|preview)
				content
				newName
				uploadContext
				applyToModals
				applyToNonModals
				internetExplorerMaxVersion
				applyToAuthorizationRequests
				mediaQuery
				isRightToLeft
				immediate: default false
			*/
			saveThemeFile: function(options) {
				return context.queue.add(
					('saveThemeFile:' + options.id + ':' + options.typeId + ':' + (options.queueSalt || '')),
					function(){
						return context.provider.saveThemeFile(options)
							.then(function(response){
								if(response.isNew) {
									raiseThemeFileEvent(context, events.fileCreated, options, response.savedThemeFile);
								} else {
									raiseThemeFileEvent(context, events.fileUpdated, options, response.savedThemeFile);
								}
								raiseThemeEvent(context, events.themeUpdated, options, response.theme);
								return response;
							});
					}, { immediate: (options.immediate === true) });
			},
			/*
			options
				id
				typeId
				name
				type (style|script|file|preview)
			*/
			deleteThemeFile: function(options) {
				return context.queue.add(
					('deleteThemeFile:' + options.id + ':' + options.typeId + ':' + options.name + ':' + options.type),
					function(){
						return context.provider.deleteThemeFile(options)
							.then(function(response){
								raiseThemeFileEvent(context, events.fileDeleted, options, null);
								raiseThemeEvent(context, events.themeUpdated, options, response.theme);
								return response;
							});
					}, { immediate: true });
			},
			/*
			options
				id
				typeId
				name
				type (style|script|file|preview)
			*/
			restoreThemeFile: function(options) {
				return context.queue.add(
					('restoreThemeFile:' + options.id + ':' + options.typeId + ':' + options.name + ':' + options.type),
					function(){
						return context.provider.restoreThemeFile(options)
							.then(function(response){
								raiseThemeFileEvent(context, events.fileCreated, options, response.savedThemeFile);
								raiseThemeEvent(context, events.themeUpdated, options, response.theme);
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
				typeId
				state
				isStaged
			*/
			search: function(options) {
				return context.provider.search(options);
			},
			/*
			options
				uploadContext
				fileName
				importCommands
			*/
			importThemes: function(options) {
				options.importCommands = serializeImportCommands(options.importCommands);
				return context.queue.add(
					('importThemes:' + options.uploadContext + ':' + options.fileName + ':' + options.importCommands),
					function(){
						$.telligent.evolution.administration.loading(true);

						return $.Deferred(function(d){
							// schedule importing
							context.provider.importThemes(options).then(function(response){
								// resolve this model's import() on completion of the scheduled import
								if (scheduledCommitCompleteSubscription) {
									$.telligent.evolution.messaging.unsubscribe(scheduledCommitCompleteSubscription);
								}
								scheduledCommitCompleteSubscription = $.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data) {
									if (data.progressKey == response.progressKey) {
										// ... but first synthesize client messages regarding imported items
										if(data.result.Imported) {
											for(var i = 0; i < data.result.newThemes.length; i++) {
												raiseThemeEvent(context, events.themeCreated, {
													id: data.result.newThemes[i].Id,
													typeId: data.result.newThemes[i].TypeId
												}, data.result.newThemes[i]);
											}
											var themes = [];
											for(var i = 0; i < data.result.updatedThemes.length; i++) {
												var theme = {
													id: data.result.updatedThemes[i].Id,
													typeId: data.result.updatedThemes[i].TypeId
												};
												themes.push(theme);
												raiseThemeEvent(context, events.themeUpdated, theme, data.result.updatedThemes[i], {
													// treat this like a revert as it coudl be undoing other current staged changes
													reverted: true
												});
											}

											messaging.publish(events.themesUpdated, {
												themes: themes
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
				id
				typeId
				staged (default true)
				factoryDefault (default false)
			*/
			listLayouts: function(options) {
				return context.provider.listLayouts(options);
			},
			/*
			options:
				id
				typeId
				staged (default true)
				factoryDefault (default false)
			*/
			listFragments: function(options) {
				return context.provider.listFragments(options);
			},
			/*
			options
				id
				typeId
				stage
				revertPagesTo: Default|ConfiguredDefault
				revertCustomPages: true|false
				revertHeadersTo: Default|ConfiguredDefault
				revertFootersTo: Default|ConfiguredDefault
				revertScopedProperties: true|false
			*/
			revertThemeOptions: function(options) {
				return context.queue.add(
					('revertThemeOptions:' + options.id + ':' + options.typeId),
					function(){
						return context.provider.revertThemeOptions(options)
							.then(function(response){
								return response;
							});
					}, { immediate: true });
			},
			/*
			options:
				typeId
				query
			*/
			findApplications: function(options) {
				return context.provider.findApplications(options);
			},
			/*
			options:
				id
				typeId
				applicationId
			returns
				url of previewed theme
			*/
			previewTheme: function(options) {
				return context.provider.previewTheme(options);
			}
		}
	};

	return DataModel;

}, jQuery, window);
