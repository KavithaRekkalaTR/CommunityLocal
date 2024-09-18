/*
var dataProvider = new DataProvider(options)
	options:
		listFragmentsUrl: '',
		getFragmentUrl: '',
		createFragmentUrl: '',
		saveFragmentUrl: '',
		deleteFragmentUrl: '',
		publishFragmentUrl: '',
		revertFragmentUrl: '',
		getFragmentAttachmentUrl: '',
		saveFragmentAttachmentUrl: '',
		deleteFragmentAttachmentUrl: '',
		listContextsUrl: '',
		listRestScopesUrl: '',
		revertFragmentsUrl: '',
		publishFragmentsUrl: '',
		deleteFragmentsUrl: ''
		restoreFragmentAttachmentUrl: ''

low-level REST/JSON methods for interacting with staged fragments

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
			fragmentIds
		returns:
			stagedFragments - promised list of all staged widgets summaries

	cloneFragment(options)
		options
			instanceIdentifier
			themeId
			newInstanceIdentifier
			newFactoryDefaultProvider
		returns
			promised
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

	publishFragments(options, ajaxOptions)
		options:
			fragmentIds
		ajaxOptions
			error
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
			fragmentIds
		returns:
			stagedFragments - promised list of all staged widgets summaries

	getFragmentAttachment(options)
		options
			instanceIdentifier
			themeId
			name
			staged (default true)
			factoryDefault (default false)
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
				list of all staged fragment summaries
				fragment: related fragment

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

	importFragments
		options
			uploadContext
			fileName
			importCommands

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
define('DataProvider', function($, global, undef) {

	var defaults = {
		listFragmentsUrl: '',
		getFragmentUrl: '',
		createFragmentUrl: '',
		saveFragmentUrl: '',
		deleteFragmentUrl: '',
		publishFragmentUrl: '',
		revertFragmentUrl: '',
		getFragmentAttachmentUrl: '',
		saveFragmentAttachmentUrl: '',
		deleteFragmentAttachmentUrl: '',
		getFragmentExampleInstanceUrl: '',
		revertFragmentsUrl: '',
		publishFragmentsUrl: '',
		deleteFragmentsUrl: '',
		restoreFragmentAttachmentUrl: ''
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
				themeId
				factoryDefaultProvider
				state
				isStaged
				scriptable
				query
				includeFileDigests (default false)
			*/
			listFragments: function(options) {
				return $.telligent.evolution.get({
					url: context.listFragmentsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				instanceIdentifier
				themeId
				staged (default true)
				factoryDefault (default false)
				includeFileDigests (default false)
			*/
			getFragment: function (options) {
				return $.telligent.evolution.get({
					url: context.getFragmentUrl,
					data: prefix(options)
				});
			},
			/*
			options:
				instanceIdentifier
				factoryDefaultProvider
				themeId
			*/
			createFragment: function(options) {
				return $.telligent.evolution.post({
					url: context.createFragmentUrl,
					data: prefix(options)
				});
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
			*/
			saveFragment: function (options) {
				return $.telligent.evolution.post({
					url: context.saveFragmentUrl,
					data: prefix(options)
				});
			},
			/*
			options
				instanceIdentifier
				themeId
			*/
			deleteFragment: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteFragmentUrl,
					data: prefix(options)
				});
			},
			/*
			options
				fragmentIds
			*/
			deleteFragments: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteFragmentsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				instanceIdentifier
				themeId
			*/
			publishFragment: function(options) {
				return $.telligent.evolution.post({
					url: context.publishFragmentUrl,
					data: prefix(options)
				});
			},
			/*
			options
				fragmentIds
			ajaxOptions
				error
			*/
			publishFragments: function(options, ajaxOptions) {
				ajaxOptions = ajaxOptions || {};
				return $.telligent.evolution.post($.extend({}, {
					url: context.publishFragmentsUrl,
					data: prefix(options)
				}, ajaxOptions));
			},
			/*
			options
				instanceIdentifier
				themeId
			*/
			revertFragment: function(options) {
				return $.telligent.evolution.post({
					url: context.revertFragmentUrl,
					data: prefix(options)
				});
			},
			/*
			options
				fragmentIds
			*/
			revertFragments: function(options) {
				return $.telligent.evolution.post({
					url: context.revertFragmentsUrl,
					data: prefix(options)
				});
			},
			/*
			options
				instanceIdentifier
				themeId
				name
				staged (default true)
				factoryDefault (default false)
			*/
			getFragmentAttachment: function(options) {
				return $.telligent.evolution.get({
					url: context.getFragmentAttachmentUrl,
					data: prefix(options)
				});
			},
			/*
			options
				instanceIdentifier
				themeId
				name
				content
				newName
				uploadContext
			*/
			saveFragmentAttachment: function(options) {
				return $.telligent.evolution.post({
					url: context.saveFragmentAttachmentUrl,
					data: prefix(options)
				});
			},
			/*
			options
				instanceIdentifier
				themeId
				name
			*/
			deleteFragmentAttachment: function(options) {
				return $.telligent.evolution.post({
					url: context.deleteFragmentAttachmentUrl,
					data: prefix(options)
				});
			},
			/*
			options
				instanceIdentifier
				themeId
				name
			*/
			restoreFragmentAttachment: function(options) {
				return $.telligent.evolution.post({
					url: context.restoreFragmentAttachmentUrl,
					data: prefix(options)
				});
			},
			/*
			cloneFragment(options)
				options
					instanceIdentifier
					themeId
					newInstanceIdentifier
					newFactoryDefaultProvider
				returns
					promised
						clonedFragment - fragment summary
						stagedFragments - list of all staged fragments summaries
			*/
			cloneFragment: function(options) {
				return $.telligent.evolution.post({
					url: context.cloneFragmentAttachmentUrl,
					data: prefix(options)
				});
			},
			/*
				options
					instanceIdentifier
					themeId
					variantThemeId
			*/
			createFragmentVariant: function(options) {
				return $.telligent.evolution.post({
					url: context.createFragmentVariantUrl,
					data: prefix(options)
				});
			},
			/*
			options
				instanceIdentifier
				themeId
			*/
			getFragmentExampleInstance: function(options) {
				return $.telligent.evolution.get({
					url: context.getFragmentExampleInstanceUrl,
					data: prefix(options)
				});
			},
			/*
			options
				instanceIdentifier
				themeId
			*/
			createFragmentAttachment: function(options) {
				return $.telligent.evolution.post({
					url: context.createFragmentAttachmentUrl,
					data: prefix(options)
				});
			},
			/*
			options
				uploadContext
				fileName
				importCommands
			*/
			importFragments: function(options) {
				return $.telligent.evolution.post({
					url: context.importFragmentsUrl,
					data: prefix(options)
				});
			},
			/*
			options:
				filter
			*/
			listContexts: function(options) {
				return $.telligent.evolution.get({
					url: context.listContextsUrl,
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
				instanceIdentifier
				themeId
				factoryDefaultProvider
				state
				isStaged
				scriptable
			*/
			search: function(options) {
				return $.telligent.evolution.get({
					url: context.searchUrl,
					data: prefix(options)
				});
			}
		}
	};

	return DataProvider;

}, jQuery, window);
