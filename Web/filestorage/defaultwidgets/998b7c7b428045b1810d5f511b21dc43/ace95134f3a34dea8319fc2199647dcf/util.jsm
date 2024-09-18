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
	function projectEmail (email, options) {
		if (!email)
			return null;

		var includeFileDigests = options && options.includeFileDigests == true;
		var summarize = options && options.summarize == true;

		var projectedEmail = {
			Type: email.ElementType,
			Id: email.Id,
			Name: email.Name || '',
			Description: email.Description || '',
			ProcessedName: email.ProcessedName || '',
			ProcessedDescription: email.ProcessedDescription || '',

			IsFactoryDefault: email.IsFactoryDefault,
			IsStaged: email.IsStaged,
			IsReverted: email.IsReverted,
			IsTranslated: email.IsTranslated,
			IsEditable: email.IsEditable,

			State: email.State,

			Files: map(email.Files, function(f) {
				var file = { Name: f.Name };

				if (includeFileDigests)
					file.Digest = f.ContentHash;

				return file;
			})
		}

		if (options && options.type) {
			projectedEmail.Type = options.type;
		}

		// in test mode, include more data, even on summaries
		if (context.RunTests) {
			extend(projectedEmail, {
				SubjectScript: email.SubjectScript || '',
				SubjectScriptLanguage: email.SubjectScriptLanguage || '',
				TemplateScript: email.TemplateScript || '',
				TemplateScriptLanguage: email.TemplateScriptLanguage || ''
			});
		}

		if (!summarize) {
			extend(projectedEmail, {
				SubjectScript: email.SubjectScript || '',
				SubjectScriptLanguage: email.SubjectScriptLanguage || '',
				HeaderScript: email.HeaderScript || '',
				HeaderScriptLanguage: email.HeaderScriptLanguage || '',
				FooterScript: email.FooterScript || '',
				FooterScriptLanguage: email.FooterScriptLanguage || '',
				BodyScript: email.BodyScript || '',
				BodyScriptLanguage: email.BodyScriptLanguage || '',
				TemplateScript: email.TemplateScript || '',
				TemplateScriptLanguage: email.TemplateScriptLanguage || '',

				ConfigurationXml: email.ConfigurationXml || '',

				LastModified: email.LastModified != null ? core_v2_language.FormatDateAndTime(email.LastModified) : null,
				LastModifiedAgo: email.LastModified != null ? core_v2_language.FormatAgoDate(email.LastModified) : null,

				FilePath: email.FactoryDefaultPath || null,
				AttachmentFilePath: email.FactoryDefaultAttachmentsPath || null,

				ConfigureUrl: (email.ElementType == 'Email' ? context.ConfigureEmailUrl(email.Id) : null),
				IsEnabled: (email.ElementType == 'Email' ? context.IsEmailEnabled(email.Id) : true),

				Resources: map(email.LanguageResources, function(r){
					return {
						Language: r.Language,
						Name: r.Name,
						Value: r.Value
					};
				})
			});
		}

		return projectedEmail;
	}

	/*
	options:
		email
		includeFileDigests: true|false (default false)
	*/
	function projectEmailFile (emailFile, options) {
		if (!emailFile)
			return null;

		var email = null;
		if (options)
			email = options.email;

		var includeFileDigests = options && options.includeFileDigests

		var projectedEmailFile = {
			Type: email.ElementType,
			Id: emailFile.Id,
			EmailName: emailFile.EmailName || '',
			EmailProcessedName: emailFile.EmailProcessedName || null,

			Name: emailFile.Name || null,
			Url: emailFile.Url || '',

			Content: emailFile.Content || '',
			ContentHash: emailFile.ContentHash || ''
		};

		if (email) {
			extend(projectedEmailFile, {
				State: email.State,
				IsStaged: email.IsStaged,
				IsEditable: email.IsEditable,
				IsTranslated: email.IsTranslated,
				IsReverted: email.IsReverted,
				Files: map(email.Files, function(f) {
					var file = { Name: f.Name };

					if (includeFileDigests)
						file.Digest = f.ContentHash;

					return file;
				})
			});
		}

		return projectedEmailFile;
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

	function loadAndProjectStagedItems() {
		var emails = context.List({ Staged: true });
		var configs = context.ListConfigurations({ Staged: true });

		var stagedItems = map(emails, function (e) {
			return projectEmail(e, { summarize: true });
		}).concat(map(configs, function (ce) {
			return projectEmail(ce.ScriptedEmail, { summarize: true, type: 'EmailConfiguration' });
		}));

		return stagedItems;
	}

	return {
		projectEmail: projectEmail,
		projectEmailFile: projectEmailFile,
		projectSearchResult: projectSearchResult,
		loadAndProjectStagedItems: loadAndProjectStagedItems,
		extend: extend,
		map: map
	};

})();
