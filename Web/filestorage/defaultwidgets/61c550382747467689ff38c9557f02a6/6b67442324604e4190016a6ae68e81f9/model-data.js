/*
Theme Studio Data Provider

 * Low-level REST/JSON methods for interacting with staged themes
 * Actions are all non-queued/immediate
 * No event handling

var dataProvider = new DataProvider(options)
	options:
		listThemesUrl: '',
		getThemeUrl: '',
		saveThemeUrl: '',
		deleteThemeUrl: '',
		deleteThemesUrl: '',
		cloneThemeUrl: '',
		publishThemeUrl: '',
		publishThemesUrl: '',
		revertThemeUrl: '',
		revertThemesUrl: '',
		getThemeFileUrl: '',
		createThemeFileUrl: '',
		saveThemeFileUrl: '',
		deleteThemeFileUrl: '',
		restoreThemeFileUrl: '',
		searchUrl: '',
		listLayoutsUrl: '',
		listFragmentsUrl: '',
		revertThemeOptionsUrl: '',
		findApplicationsUrl: '',
		previewThemeUrl: '',
		listRestScopesUrl: ''

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
			newScriptFiles
			newStyleFiles
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
			themeIds
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
			themeIds
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
			themeIds
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
				fragment attachment
				list of all staged fragments summaries
				isNew - whether save resulted in create (new) or update
				fragment: related fragment

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

	importThemes
		options
			uploadContext
			fileName
			importCommands

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
define('DataProvider', function($, global, undef) {

	var defaults = {
		listThemesUrl: '',
		getThemeUrl: '',
		saveThemeUrl: '',
		deleteThemeUrl: '',
		deleteThemesUrl: '',
		cloneThemeUrl: '',
		publishThemeUrl: '',
		publishThemesUrl: '',
		revertThemeUrl: '',
		revertThemesUrl: '',
		getThemeFileUrl: '',
		createThemeFileUrl: '',
		saveThemeFileUrl: '',
		deleteThemeFileUrl: '',
		restoreThemeFileUrl: ''
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
				typeId
				state
				staged
				includeFileDigests (default false)
			*/
			listThemes: function(options) {
				return $.telligent.evolution.get({
					url: context.listThemesUrl,
					data: prefix(options)
				});
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
				return $.telligent.evolution.get({
					url: context.getThemeUrl,
					data: prefix(options)
				});
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
				newScriptFiles
				newStyleFiles
				uploadContext
				newPreviewFileName
			*/
			saveTheme: function(options) {
				return $.telligent.evolution.post({
					url: context.saveThemeUrl,
					data: prefix(options)
				});
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
				return $.telligent.evolution.post({
					url: context.deleteThemeUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				typeId
				newId
			*/
			cloneTheme: function(options) {
				return $.telligent.evolution.post({
					url: context.cloneThemeUrl,
					data: prefix(options)
				});
			},
			/*
			options
				themeIds
				revertStagedPages
				revertStagedHeaders
				revertStagedFooters
				revertStagedFragments
			*/
			deleteThemes: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteThemesUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				typeId
			*/
			publishTheme: function(options) {
				return $.telligent.evolution.post({
					url: context.publishThemeUrl,
					data: prefix(options)
				});
			},
			/*
			options
				themeIds
			ajaxOptions
				error
			*/
			publishThemes: function(options, ajaxOptions) {
				ajaxOptions = ajaxOptions || {};
				return $.telligent.evolution.post($.extend({}, {
					url: context.publishThemesUrl,
					data: prefix(options)
				}, ajaxOptions));
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
				return $.telligent.evolution.post({
					url: context.revertThemeUrl,
					data: prefix(options)
				});
			},
			/*
			options
				themeIds
				revertStagedPages
				revertStagedHeaders
				revertStagedFooters
				revertStagedFragments
			*/
			revertThemes: function(options) {
				return $.telligent.evolution.post({
					url: context.revertThemesUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				typeId
				name
				type (style|script|file|preview)
				staged (default true)
				factoryDefault (default false)
			*/
			getThemeFile: function(options) {
				return $.telligent.evolution.get({
					url: context.getThemeFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				typeId
				type (style|script|file|preview)
			*/
			createThemeFile: function(options) {
				return $.telligent.evolution.post({
					url: context.createThemeFileUrl,
					data: prefix(options)
				});
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
			*/
			saveThemeFile: function(options) {
				return $.telligent.evolution.post({
					url: context.saveThemeFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				typeId
				name
				type (style|script|file|preview)
			*/
			deleteThemeFile: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteThemeFileUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				typeId
				name
				type (style|script|file|preview)
			*/
			restoreThemeFile: function(options) {
				return $.telligent.evolution.post({
					url: context.restoreThemeFileUrl,
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
				typeId
				state
				isStaged
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
			*/
			importThemes: function(options) {
				return $.telligent.evolution.post({
					url: context.importThemesUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				typeId
				staged (default true)
				factoryDefault (default false)
			*/
			listLayouts: function(options) {
				return $.telligent.evolution.get({
					url: context.listLayoutsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				id
				typeId
				staged (default true)
				factoryDefault (default false)
			*/
			listFragments: function(options) {
				return $.telligent.evolution.get({
					url: context.listFragmentsUrl,
					data: prefix(options)
				});
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
				revertThemeConfigurations: true|false
				revertScopedProperties: true|false
			*/
			revertThemeOptions: function(options) {
				return $.telligent.evolution.post({
					url: context.revertThemeOptionsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				typeId
				query
			returns:
				promised array of applications
			*/
			findApplications: function(options) {
				return $.telligent.evolution.get({
					url: context.findApplicationsUrl,
					data: prefix(options)
				});
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
				return $.telligent.evolution.post({
					url: context.previewThemeUrl,
					data: prefix(options)
				});
			}
		}
	};

	return DataProvider;

}, jQuery, window);