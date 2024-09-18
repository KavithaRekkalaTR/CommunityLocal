/*
Email Studio Data Provider

 * Low-level REST/JSON methods for interacting with staged emails
 * Actions are all non-queued/immediate
 * No event handling

var dataProvider = new DataProvider(options)
	options:
		listEmailsUrl: '',
		listConfigurationsUrl: '',
		getEmailUrl: '',
		saveEmailUrl: '',
		deleteEmailUrl: '',
		deleteEmailsUrl: '',
		publishEmailUrl: '',
		publishEmailsUrl: '',
		revertEmailUrl: '',
		revertEmailsUrl: '',
		getEmailFileUrl: '',
		createEmailFileUrl: '',
		saveEmailFileUrl: '',
		deleteEmailFileUrl: '',
		restoreEmailFileUrl: '',
		searchUrl: '',
		importEmailsUrl: '',
		listEventsUrl: '',
		sendSampleUrl: ''

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
			emailIds
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

	publishEmails(options)
		options:
			emailIds
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
			emailIds
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
				list of all staged emails summaries
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

	listEvents(options)
		options:
			query
		returns:
			promised array of ManagedEmailEvent

	importEmails
		options
			uploadContext
			fileName
			importCommands
			factoryDefaultProviderId

	sendSample
		options
			id
			language
 */
define('DataProvider', function($, global, undef) {

	var defaults = {
		listEmailsUrl: '',
		listConfigurationsUrl: '',
		getEmailUrl: '',
		saveEmailUrl: '',
		deleteEmailUrl: '',
		deleteEmailsUrl: '',
		publishEmailUrl: '',
		publishEmailsUrl: '',
		revertEmailUrl: '',
		revertEmailsUrl: '',
		getEmailFileUrl: '',
		createEmailFileUrl: '',
		saveEmailFileUrl: '',
		deleteEmailFileUrl: '',
		restoreEmailFileUrl: '',
		searchUrl: '',
		importEmailsUrl: '',
		listEventsUrl: '',
		sendSampleUrl: ''
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
				state
				staged
				includeFileDigests (default false)
				includeTemplate
				includeEmails
			*/
			listEmails: function(options) {
				return $.telligent.evolution.get({
					url: context.listEmailsUrl,
					data: prefix(options)
				});
			},
			/*
			options:
				staged
				pageSize
				pageIndex
			*/
			listConfigurations: function (options) {
				return $.telligent.evolution.get({
					url: context.listConfigurationsUrl,
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
			getEmail: function(options) {
				return $.telligent.evolution.get({
					url: context.getEmailUrl,
					data: prefix(options)
				});
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
			saveEmail: function (options) {
				return $.telligent.evolution.post({
					url: context.saveEmailUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
			*/
			deleteEmail: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteEmailUrl,
					data: prefix(options)
				});
			},
			/*
			options
				emailIds
			*/
			deleteEmails: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteEmailsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
			*/
			publishEmail: function(options) {
				return $.telligent.evolution.post({
					url: context.publishEmailUrl,
					data: prefix(options)
				});
			},
			/*
			options
				emailIds
			*/
			publishEmails: function(options) {
				return $.telligent.evolution.post($.extend({}, {
					url: context.publishEmailsUrl,
					data: prefix(options)
				}));
			},
			/*
			options
				id
			*/
			revertEmail: function(options) {
				return $.telligent.evolution.post({
					url: context.revertEmailUrl,
					data: prefix(options)
				});
			},
			/*
			options
				emailIds
			*/
			revertEmails: function(options) {
				return $.telligent.evolution.post({
					url: context.revertEmailsUrl,
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
			getEmailFile: function(options) {
				return $.telligent.evolution.get({
					url: context.getEmailFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
			*/
			createEmailFile: function(options) {
				return $.telligent.evolution.post({
					url: context.createEmailFileUrl,
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
			saveEmailFile: function(options) {
				return $.telligent.evolution.post({
					url: context.saveEmailFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				name
			*/
			deleteEmailFile: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteEmailFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				name
			*/
			restoreEmailFile: function(options) {
				return $.telligent.evolution.post({
					url: context.restoreEmailFileUrl,
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
			importEmails: function(options) {
				return $.telligent.evolution.post({
					url: context.importEmailsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				language
			*/
			sendSample: function (options) {
				return $.telligent.evolution.post({
					url: context.sendSampleUrl,
					data: prefix(options)
				});
			}
		}
	};

	return DataProvider;

}, jQuery, window);
