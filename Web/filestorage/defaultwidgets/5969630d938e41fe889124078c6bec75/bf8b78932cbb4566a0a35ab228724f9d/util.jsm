return (function(){

	function extend (target, source) {
		for (var key in source) {
			if (source.hasOwnProperty(key)) {
				target[key] = source[key];
			}
		}
		return target;
	}

	function map (items, func) {
		return (items || []).map(func);
	}

	/*
	options:
		summarize: true|false (default false)
		includeFileDigests: true|false (default false)
	*/
	function projectFragment (fragment, options) {
		if (!fragment)
			return null;

		var includeFileDigests = options && options.includeFileDigests == true;
		var summarize = options && options.summarize == true;

		var projectedFragment = {
			FactoryDefaultProvider: fragment.FactoryDefaultProvider || null,
			ThemeId: fragment.ThemeId || '',
			ThemeTitle: fragment.ThemeTitle || '',
			InstanceIdentifier: fragment.InstanceIdentifier || '',

			Name: fragment.Name || '',
			Description: fragment.Description || '',
			ProcessedName: fragment.ProcessedName || '',
			ProcessedDescription: fragment.ProcessedDescription || '',

			IsFactoryDefault: fragment.IsFactoryDefault,
			IsStaged: fragment.IsStaged,
			IsReverted: fragment.IsReverted,
			IsDeleted: fragment.IsDeleted,
			IsTranslated: fragment.IsTranslated,
			IsThemeable: fragment.IsThemeable,
			IsEditable: fragment.IsEditable,
			HasPluginConfiguration: fragment.HasPluginConfiguration,
			HasHeader: fragment.HasHeader,
			HasWrapperCss: fragment.HasWrapperCss,
			IsExplicitlyOrImplicitlyAccessible: fragment.IsExplicitlyOrImplicitlyAccessible,

			State: fragment.State,

			Attachments: map(fragment.Attachments, function(f) {
				var attachment = {
					Name: f.Name ,
					Url: f.Url
				};

				if (includeFileDigests)
					attachment.Digest = f.ContentHash;

				return attachment;
			}),
			NonMatchingAttachments: map(fragment.NonMatchingAttachments, function(f) {
				var attachment = {
					Name: f.Name,
					Url: f.Url
				};

				if (includeFileDigests)
					attachment.Digest = f.ContentHash;

				return attachment;
			})
		}

		if (!summarize) {
			extend(projectedFragment, {
				FactoryDefaultProviderName: fragment.FactoryDefaultProviderName || null,

				CssClass: fragment.CssClass || null,
				IsCacheable: fragment.IsCacheable,
				VaryCacheByUser: fragment.VaryCacheByUser,

				ContentScript: fragment.ContentScript || '',
				ContentScriptLanguage: fragment.ContentScriptLanguage || '',

				AdditionalCssScript: fragment.AdditionalCssScript || null,
				AdditionalCssScriptLanguage: fragment.AdditionalCssScriptLanguage || null,

				HeaderScript: fragment.HeaderScript || null,
				HeaderScriptLanguage: fragment.HeaderScriptLanguage || null,

				ShowHeaderByDefault: fragment.ShowHeaderByDefault,

				LanguageResourcesXml: fragment.ConfigurationXml || null,
				ConfigurationXml: fragment.ConfigurationXml || null,

				IsScriptedPluginProvided: fragment.IsScriptedPluginProvided,

				FilePath: fragment.FactoryDefaultPath || null,
				AttachmentFilePath: fragment.FactoryDefaultAttachmentsPath || null,

				Resources: map(fragment.LanguageResources, function (r) {
					return {
						Language: r.Language,
						Name: r.Name,
						Value: r.Value
					};
				}),

				ContextItemIds: map(fragment.ContextItemIds, function (contextItemId) {
					return contextItemId;
				}),

				ProcessedContextItems: map(fragment.ContextItemIds, function (contextItemId) {
					var contextItem = context.GetContextItem(contextItemId);
					return {
						Id: contextItemId,
						Name: contextItem.Name
					};
				}),

				RestScopes: map(fragment.RestScopeIds, function (restScopeId) {
					if (!restScopeId)
						return null;

					var restScope = context.GetRestScope(restScopeId);
					if (!restScope)
						return null;

					return {
						Id: restScopeId,
						Name: restScope.Name()
					};
				}).filter(function (s) {
					return s != null;
				}),

				ThemeIds: map(fragment.ThemeIds, function (themeId) {
					return themeId;
				})
			});
		}

		return projectedFragment;
	}

	/*
	options:
		fragment
		includeFileDigests: true|false (default false)
	*/
	function projectFragmentAttachment (attachment, options) {
		if (!attachment)
			return null;

		var fragment = null;
		if (options)
			fragment = options.fragment;

		var includeFileDigests = options && options.includeFileDigests;

		var projectedAttachment = {
			ThemeId: attachment.ThemeId || '',
			ThemeTitle: attachment.ThemeTitle || '',
			FragmentProcessedName: attachment.FragmentProcessedName || null,
			InstanceIdentifier: attachment.InstanceIdentifier || null,
			Name: attachment.Name || null,
			Url: attachment.Url || null,
			Content: attachment.Content || '',
			ContentHash: attachment.ContentHash || '',
			IsEditable: attachment.IsEditable
		};

		if (fragment) {
			extend(projectedAttachment, {
				IsThemeable: fragment.IsThemeable,
				State: fragment.State,
				IsStaged: fragment.IsStaged,
				HasPluginConfiguration: fragment.HasPluginConfiguration,
				HasHeader: fragment.HasHeader,
				HasWrapperCss: fragment.HasWrapperCss,
				IsEditable: fragment.IsEditable,
				IsTranslated: fragment.IsTranslated,
				IsReverted: fragment.IsReverted,
				IsDeleted: fragment.IsDeleted,
				Attachments: map(fragment.Attachments, function(f) {
					var attachment = { Name: f.Name };

					if (includeFileDigests)
						attachment.Digest = f.ContentHash;

					return attachment;
				})
			});
		}

		return projectedAttachment;
	}

	function projectSearchResult (searchResult) {
		if (!searchResult)
			return null;

		return 	{
			LineNumber: searchResult.LineNumber || 0,
			ThemeId: searchResult.ThemeId || '',
			InstanceIdentifier: searchResult.InstanceIdentifier,
			ComponentType: searchResult.ComponentType,
			AttachmentName: searchResult.AttachmentName || '',
			Excerpt: (searchResult.Excerpt ? core_v2_encoding.HtmlEncode(searchResult.Excerpt) : ''),
			ProcessedName: searchResult.ProcessedName || '',
			ThemeTitle: searchResult.ThemeTitle || '',
			State: searchResult.State,
			IsStaged: searchResult.IsStaged,
			IsTranslated: searchResult.IsTranslated
		};
	}

	function loadAndProjectStagedItems(options) {
		var fragments = context.ListFragments({ IsStaged: true });
		var stagedItems = map(fragments, function(a) {
			return util.projectFragment(a, { summarize: true });
		});

		return stagedItems;
	}

	return {
		projectFragment: projectFragment,
		projectFragmentAttachment: projectFragmentAttachment,
		projectSearchResult: projectSearchResult,
		loadAndProjectStagedItems: loadAndProjectStagedItems,
		extend: extend,
		map: map
	};

})();
