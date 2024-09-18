/*
Embeddable Studio Data Provider

 * Low-level REST/JSON methods for interacting with staged embeddables
 * Actions are all non-queued/immediate
 * No event handling

var dataProvider = new DataProvider(options)
	options:
		listEmbeddablesUrl: '',
		getEmbeddableUrl: '',
		saveEmbeddableUrl: '',
		deleteEmbeddableUrl: '',
		deleteEmbeddablesUrl: '',
		cloneEmbeddableUrl: '',
		createEmbeddableUrl: '',
		publishEmbeddableUrl: '',
		publishEmbeddablesUrl: '',
		revertEmbeddableUrl: '',
		revertEmbeddablesUrl: '',
		getEmbeddableFileUrl: '',
		createEmbeddableFileUrl: '',
		saveEmbeddableFileUrl: '',
		deleteEmbeddableFileUrl: '',
		restoreEmbeddableFileUrl: '',
		listRestScopesUrl: '',
		searchUrl: '',
		importEmbeddablesUrl: '',

Methods:

x	listEmbeddables(options)
		options:
			state
			staged
			includeFileDigests (default false)
			factoryDefaultProviderId
		returns
			promised array of embeddable summaries

x	getEmbeddable(options)
		options
			id
			staged (default true)
			factoryDefault (default false)
			includeFileDigests (default false)
		returns
			promised embeddable (non summary)

x	saveEmbeddable(options)
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

x	deleteEmbeddable(options)
		options
			id

		returns
			stagedEmbeddables - promised list of all staged embeddable summaries
			embeddable - if null, then was a custom delete. if exists, then is fac default version post revert

x	deleteEmbeddables(options)
		options:
			embeddableIds
		returns:
			stagedEmbeddables - promised list of all now-staged embeddable summaries
			revertedEmbeddables - promised list of all reverted embeddable summaries from deletion
			deletedEmbeddables - promised list of all deleted embeddables (id)

x	cloneEmbeddable(options)
		options
			id
			newId
			factoryDefaultProviderId
		returns
			promised
				clonedEmbeddable - embeddable summary
				stagedEmbeddables - list of all staged embeddables summaries

x	createEmbeddable(options)
		options
			id
			factoryDefaultProviderId
		returns
			promised non-saved/staged embeddable

x	publishEmbeddable(options)
		options
			id
		returns
			publishedEmbeddable - published embeddable
			stagedEmbeddables - promised list of all staged embeddable summaries

x	publishEmbeddables(options)
		options:
			embeddableIds
		returns:
			stagedEmbeddables - promised list of all staged embeddable summaries

x	revertEmbeddable(options)
		options
			id

		returns
			revertedEmbeddable - reverted embeddable
			stagedEmbeddables - promised list of all staged embeddable summaries

x	revertEmbeddables(options)
		options:
			embeddableIds
		returns:
			stagedEmbeddables - promised list of all staged embeddable summaries

x	getEmbeddableFile(options)
		options
			id
			name
			staged (default true)
			factoryDefault (default false)
		returns
			promised embeddable file (non summary)

x	createEmbeddableFile(options)
		options
			id
		returns:
			promised
				new non-saved embeddable file

x	saveEmbeddableFile(options)
		options
			id
			name
			content
			newName
			uploadContext

		returns
			promised
				embeddable file
				list of all staged embeddables summaries
				isNew - whether save resulted in create (new) or update
				embeddable: related embeddable

x	deleteEmbeddableFile(options)
		options
			id
			name
		returns:
			promised
				list of all staged embeddable summaries
				embeddable: related embeddable

x	restoreEmbeddableFile(options)
		options
			id
			name
		returns:
			promised
				list of all staged embeddable summaries
				embeddable: related embeddable

	listRestScopes(options)
		options:
			query
		returns
			promised array of rest scopes

x	search(options)
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
		options
			uploadContext
			fileName
			importCommands
			factoryDefaultProviderId

 */
define('DataProvider', function($, global, undef) {

	var defaults = {
		listEmbeddablesUrl: '',
		getEmbeddableUrl: '',
		saveEmbeddableUrl: '',
		deleteEmbeddableUrl: '',
		deleteEmbeddablesUrl: '',
		cloneEmbeddableUrl: '',
		createEmbeddableUrl: '',
		publishEmbeddableUrl: '',
		publishEmbeddablesUrl: '',
		revertEmbeddableUrl: '',
		revertEmbeddablesUrl: '',
		getEmbeddableFileUrl: '',
		createEmbeddableFileUrl: '',
		saveEmbeddableFileUrl: '',
		deleteEmbeddableFileUrl: '',
		restoreEmbeddableFileUrl: '',
		searchUrl: '',
		importEmbeddablesUrl: ''
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
				factoryDefaultProviderId
			*/
			listEmbeddables: function(options) {
				return $.telligent.evolution.get({
					url: context.listEmbeddablesUrl,
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
			getEmbeddable: function(options) {
				return $.telligent.evolution.get({
					url: context.getEmbeddableUrl,
					data: prefix(options)
				});
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
				supportedContentTypesScopeToSave
				supportedContentTypesToSave
			*/
			saveEmbeddable: function(options) {
				return $.telligent.evolution.post({
					url: context.saveEmbeddableUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
			*/
			deleteEmbeddable: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteEmbeddableUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				newId
				factoryDefaultProviderId
			*/
			cloneEmbeddable: function(options) {
				return $.telligent.evolution.post({
					url: context.cloneEmbeddableUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				factoryDefaultProviderId
			*/
			createEmbeddable: function(options) {
				return $.telligent.evolution.post({
					url: context.createEmbeddableUrl,
					data: prefix(options)
				});
			},
			/*
			options
				embeddableIds
			*/
			deleteEmbeddables: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteEmbeddablesUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
			*/
			publishEmbeddable: function(options) {
				return $.telligent.evolution.post({
					url: context.publishEmbeddableUrl,
					data: prefix(options)
				});
			},
			/*
			options
				embeddableIds
			*/
			publishEmbeddables: function(options) {
				return $.telligent.evolution.post($.extend({}, {
					url: context.publishEmbeddablesUrl,
					data: prefix(options)
				}));
			},
			/*
			options
				id
			*/
			revertEmbeddable: function(options) {
				return $.telligent.evolution.post({
					url: context.revertEmbeddableUrl,
					data: prefix(options)
				});
			},
			/*
			options
				embeddableIds
			*/
			revertEmbeddables: function(options) {
				return $.telligent.evolution.post({
					url: context.revertEmbeddablesUrl,
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
			getEmbeddableFile: function(options) {
				return $.telligent.evolution.get({
					url: context.getEmbeddableFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
			*/
			createEmbeddableFile: function(options) {
				return $.telligent.evolution.post({
					url: context.createEmbeddableFileUrl,
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
			saveEmbeddableFile: function(options) {
				return $.telligent.evolution.post({
					url: context.saveEmbeddableFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				name
			*/
			deleteEmbeddableFile: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteEmbeddableFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				name
			*/
			restoreEmbeddableFile: function(options) {
				return $.telligent.evolution.post({
					url: context.restoreEmbeddableFileUrl,
					data: prefix(options)
				});
			},
			/*
			options:
				filter
			*/
			listRestScopes: function (options) {
				return $.telligent.evolution.get({
					url: context.listRestScopesUrl,
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
			options
				uploadContext
				fileName
				importCommands
				factoryDefaultProviderId
			*/
			importEmbeddables: function(options) {
				return $.telligent.evolution.post({
					url: context.importEmbeddablesUrl,
					data: prefix(options)
				});
			}
		}
	};

	return DataProvider;

}, jQuery, window);
