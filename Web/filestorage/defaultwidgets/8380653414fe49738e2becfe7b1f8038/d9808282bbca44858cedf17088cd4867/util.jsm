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
		includeEnabledContentTypes: true|false (default false on summary, true on full)
	*/
	function projectEmbeddable (embeddable, options) {
		if (!embeddable)
			return null;

		var includeFileDigests = options && options.includeFileDigests == true;
		var summarize = options && options.summarize == true;
		var includeEnabledContentTypes = !summarize || (options && options.includeEnabledContentTypes == true);

		var projectedEmbeddable = {
			FactoryDefaultProviderId: embeddable.FactoryDefaultProviderId || null,
			Id: embeddable.Id || '',
			Version: embeddable.Version || '',
			Name: embeddable.Name || '',
			Description: embeddable.Description || '',
			Category: embeddable.Category || '',
			ProcessedName: embeddable.ProcessedName || '',
			ProcessedDescription: embeddable.ProcessedDescription || '',
			ProcessedCategory: embeddable.ProcessedCategory || '',

			IsFactoryDefault: embeddable.IsFactoryDefault,
			IsStaged: embeddable.IsStaged,
			IsReverted: embeddable.IsReverted,
			IsDeleted: embeddable.IsDeleted,
			IsTranslated: embeddable.IsTranslated,
			IsEditable: embeddable.IsEditable,

			State: embeddable.State,

			Files: map(embeddable.Files, function(f) {
				var file = { Name: f.Name };

				if (includeFileDigests)
					file.Digest = f.ContentHash;

				return file;
			}),
		}

		if (embeddable.PreviewImage) {
			projectedEmbeddable.PreviewImageUrl = embeddable.PreviewImage.Url;
			if (includeFileDigests)
				projectedEmbeddable.PreviewImageDigest = embeddable.PreviewImage.ContentHash;
		} else {
			projectedEmbeddable.PreviewImageUrl = null;
		}

		if (embeddable.IconImage) {
			projectedEmbeddable.IconImageUrl = embeddable.IconImage.Url;
			if (includeFileDigests)
				projectedEmbeddable.IconImageDigest = embeddable.IconImage.ContentHash;
		} else {
			projectedEmbeddable.IconImageUrl = null;
		}

		if (!summarize) {
			extend(projectedEmbeddable, {
				FactoryDefaultProviderName: embeddable.FactoryDefaultProviderName || null,

				IsCacheable: embeddable.IsCacheable,
				VaryCacheByUser: embeddable.VaryCacheByUser,

				ContentScript: embeddable.ContentScript || '',
				ContentScriptLanguage: embeddable.ContentScriptLanguage || '',
				ConfigurationXml: embeddable.ConfigurationXml || '',

				LastModified: embeddable.LastModified != null ? core_v2_language.FormatDateAndTime(embeddable.LastModified) : null,
				LastModifiedAgo: embeddable.LastModified != null ? core_v2_language.FormatAgoDate(embeddable.LastModified) : null,

				FilePath: embeddable.FactoryDefaultPath || null,
				AttachmentFilePath: embeddable.FactoryDefaultAttachmentsPath || null,
				SupportableContentTypes: embeddable.SupportableContentTypes,
				SupportedContentTypes: embeddable.SupportedContentTypes,

				Resources: map(embeddable.LanguageResources, function(r){
					return {
						Language: r.Language,
						Name: r.Name,
						Value: r.Value
					};
				}),

				RestScopes: map(embeddable.RestScopeIds, function (restScopeId) {
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
				})
			});
		}

		if (includeEnabledContentTypes) {
			projectedEmbeddable.EnabledContentTypes = embeddable.EnabledContentTypes;
		}

		return projectedEmbeddable;
	}

	/*
	options:
		embeddable
		includeFileDigests: true|false (default false)
	*/
	function projectEmbeddableFile (embeddableFile, options) {
		if (!embeddableFile)
			return null;

		var embeddable = null;
		if (options)
			embeddable = options.embeddable;

		var includeFileDigests = options && options.includeFileDigests

		var projectedEmbeddableFile = {
			Id: embeddableFile.Id || '',
			EmbeddableName: embeddableFile.EmbeddableName || '',
			EmbeddableProcessedName: embeddableFile.EmbeddableProcessedName || null,

			Name: embeddableFile.Name || null,
			Url: embeddableFile.Url || '',

			Content: embeddableFile.Content || '',
			ContentHash: embeddableFile.ContentHash || ''
		};

		if (embeddable) {
			extend(projectedEmbeddableFile, {
				State: embeddable.State,
				IsStaged: embeddable.IsStaged,
				IsEditable: embeddable.IsEditable,
				IsTranslated: embeddable.IsTranslated,
				IsReverted: embeddable.IsReverted,
				IsDeleted: embeddable.IsDeleted,
				Files: map(embeddable.Files, function(f) {
					var file = { Name: f.Name };

					if (includeFileDigests)
						file.Digest = f.ContentHash;

					return file;
				})
			});
		}

		return projectedEmbeddableFile;
	}

	function projectSearchResult (searchResult) {
		if (!searchResult)
			return null;

		return 	{
			LineNumber: searchResult.LineNumber || 0,
			Id: searchResult.Id,
			ComponentType: searchResult.ComponentType,
			FileName: searchResult.FileName || '',
			Excerpt: (searchResult.Excerpt ? core_v2_encoding.HtmlEncode(searchResult.Excerpt) : ''),
			Name: searchResult.Name || '',
			ProcessedName: searchResult.ProcessedName || '',
			State: searchResult.State,
			IsStaged: searchResult.IsStaged,
			IsTranslated: searchResult.IsTranslated
		};
	}

	function loadAndProjectStagedItems(options) {
		var embeddables = context.ListEmbeddables({ Staged: true });
		var stagedItems = map(embeddables, function(a) {
			return util.projectEmbeddable(a, { summarize: true });
		});

		return stagedItems;
	}

	return {
		projectEmbeddable: projectEmbeddable,
		projectEmbeddableFile: projectEmbeddableFile,
		projectSearchResult: projectSearchResult,
		loadAndProjectStagedItems: loadAndProjectStagedItems,
		extend: extend,
		map: map
	};

})();
