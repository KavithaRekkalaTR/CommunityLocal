/*
Automation Studio Data Provider

 * Low-level REST/JSON methods for interacting with staged automations
 * Actions are all non-queued/immediate
 * No event handling

var dataProvider = new DataProvider(options)
	options:
		listConfiguredAutomationsUrl: '',
		listAutomationsUrl: '',
		getAutomationUrl: '',
		saveAutomationUrl: '',
		deleteAutomationUrl: '',
		deleteAutomationsUrl: '',
		cloneAutomationUrl: '',
		createAutomationUrl: '',
		publishAutomationUrl: '',
		publishAutomationsUrl: '',
		revertAutomationUrl: '',
		revertAutomationsUrl: '',
		getAutomationFileUrl: '',
		createAutomationFileUrl: '',
		saveAutomationFileUrl: '',
		deleteAutomationFileUrl: '',
		restoreAutomationFileUrl: '',
		searchUrl: '',
		importAutomationsUrl: '',
		listEventsUrl: ''

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
			events
			triggerTypes
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
			automationIds
		returns:
			stagedAutomations - promised list of all now-staged automation summaries
			revertedAutomations - promised list of all reverted automation summaries from deletion
			deletedAutomations - promised list of all deleted automations (id)

	cloneAutomation(options)
		options
			id
			newId
			hostId
			factoryDefaultProviderId
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

	publishAutomations(options)
		options:
			automationIds
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
			automationIds
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
				list of all staged automations summaries
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

	listEvents(options)
		options:
			query
		returns:
			promised array of ManagedAutomationEvent

	importAutomations
		options
			uploadContext
			fileName
			importCommands
			factoryDefaultProviderId

 */
define('DataProvider', function($, global, undef) {

	var defaults = {
		listConfiguredAutomationsUrl: '',
		listAutomationsUrl: '',
		getAutomationUrl: '',
		saveAutomationUrl: '',
		deleteAutomationUrl: '',
		deleteAutomationsUrl: '',
		cloneAutomationUrl: '',
		createAutomationUrl: '',
		publishAutomationUrl: '',
		publishAutomationsUrl: '',
		revertAutomationUrl: '',
		revertAutomationsUrl: '',
		getAutomationFileUrl: '',
		createAutomationFileUrl: '',
		saveAutomationFileUrl: '',
		deleteAutomationFileUrl: '',
		restoreAutomationFileUrl: '',
		searchUrl: '',
		importAutomationsUrl: '',
		listEventsUrl: ''
	};

	function prefix(options) {
		var data = {};
		$.each(options, function(k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	var DataProvider = function(options){
		var context = $.extend({}, defaults, options || {});

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
				return $.telligent.evolution.get({
					url: context.listConfiguredAutomationsUrl,
					data: prefix(options)
				});
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
				return $.telligent.evolution.get({
					url: context.listAutomationsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				staged (default true)
				factoryDefault (default false)
				includeFileDigests (default false)
			*/
			getAutomation: function(options) {
				return $.telligent.evolution.get({
					url: context.getAutomationUrl,
					data: prefix(options)
				});
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
				events
				triggerTypes
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
			*/
			saveAutomation: function(options) {
				return $.telligent.evolution.post({
					url: context.saveAutomationUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
			*/
			deleteAutomation: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteAutomationUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				newId
				hostId
				factoryDefaultProviderId
			*/
			cloneAutomation: function(options) {
				return $.telligent.evolution.post({
					url: context.cloneAutomationUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				hostId
				factoryDefaultProviderId
			*/
			createAutomation: function(options) {
				return $.telligent.evolution.post({
					url: context.createAutomationUrl,
					data: prefix(options)
				});
			},
			/*
			options
				automationIds
			*/
			deleteAutomations: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteAutomationsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
			*/
			publishAutomation: function(options) {
				return $.telligent.evolution.post({
					url: context.publishAutomationUrl,
					data: prefix(options)
				});
			},
			/*
			options
				automationIds
			*/
			publishAutomations: function(options) {
				return $.telligent.evolution.post($.extend({}, {
					url: context.publishAutomationsUrl,
					data: prefix(options)
				}));
			},
			/*
			options
				id
			*/
			revertAutomation: function(options) {
				return $.telligent.evolution.post({
					url: context.revertAutomationUrl,
					data: prefix(options)
				});
			},
			/*
			options
				automationIds
			*/
			revertAutomations: function(options) {
				return $.telligent.evolution.post({
					url: context.revertAutomationsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				name
				staged (default true)
				factoryDefault (default false)
			*/
			getAutomationFile: function(options) {
				return $.telligent.evolution.get({
					url: context.getAutomationFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
			*/
			createAutomationFile: function(options) {
				return $.telligent.evolution.post({
					url: context.createAutomationFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				name
				content
				newName
				uploadContext
			*/
			saveAutomationFile: function(options) {
				return $.telligent.evolution.post({
					url: context.saveAutomationFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				name
			*/
			deleteAutomationFile: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteAutomationFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				name
			*/
			restoreAutomationFile: function(options) {
				return $.telligent.evolution.post({
					url: context.restoreAutomationFileUrl,
					data: prefix(options)
				});
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
				return $.telligent.evolution.get({
					url: context.searchUrl,
					data: prefix(options)
				});
			},
			/*
			options:
				query
			*/
			listEvents: function(options) {
				return $.telligent.evolution.get({
					url: context.listEventsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				uploadContext
				fileName
				importCommands
				factoryDefaultProviderId
			*/
			importAutomations: function(options) {
				return $.telligent.evolution.post({
					url: context.importAutomationsUrl,
					data: prefix(options)
				});
			}
		}
	};

	return DataProvider;

}, jQuery, window);
