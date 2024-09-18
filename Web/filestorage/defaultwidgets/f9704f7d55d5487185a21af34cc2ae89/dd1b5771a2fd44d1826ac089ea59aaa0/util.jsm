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
	function projectAutomation (automation, options) {
		if (!automation)
			return null;

		var includeFileDigests = options && options.includeFileDigests == true;
		var summarize = options && options.summarize == true;

		var projectedAutomation = {
			Type: 'Automation',
			FactoryDefaultProviderId: automation.FactoryDefaultProviderId || null,
			Id: automation.Id || '',
			HostId: automation.HostId || null,
			HostName: automation.HostName || null,
			Name: automation.Name || '',
			Description: automation.Description || '',
			ProcessedName: automation.ProcessedName || '',
			ProcessedDescription: automation.ProcessedDescription || '',

			IsFactoryDefault: automation.IsFactoryDefault,
			IsStaged: automation.IsStaged,
			IsReverted: automation.IsReverted,
			IsDeleted: automation.IsDeleted,
			IsTranslated: automation.IsTranslated,
			IsEditable: automation.IsEditable,

			State: automation.State,

			Files: map(automation.Files, function(f) {
				var file = { Name: f.Name };

				if (includeFileDigests)
					file.Digest = f.ContentHash;

				return file;
			})
		}

		if (!summarize) {
			extend(projectedAutomation, {
				FactoryDefaultProviderName: automation.FactoryDefaultProviderName || null,

				ExecutionScript: automation.ExecutionScript || '',
				ExecutionScriptLanguage: automation.ExecutionScriptLanguage || '',
				ConfigurationXml: automation.ConfigurationXml || '',

				LastModified: automation.LastModified != null ? core_v2_language.FormatDateAndTime(automation.LastModified) : null,
				LastModifiedAgo: automation.LastModified != null ? core_v2_language.FormatAgoDate(automation.LastModified) : null,

				HttpAuthentication: automation.HttpAuthentication || null,

				ScheduleType: automation.ScheduleType || null,
				ScheduleSeconds: automation.ScheduleSeconds || null,
				ScheduleMinutes: automation.ScheduleMinutes || null,
				ScheduleHours: automation.ScheduleHours || null,
				ScheduleDailyTime: automation.ScheduleDailyTime || null,
				ScheduleDailySunday: automation.ScheduleDailySunday,
				ScheduleDailyMonday: automation.ScheduleDailyMonday,
				ScheduleDailyTuesday: automation.ScheduleDailyTuesday,
				ScheduleDailyWednesday: automation.ScheduleDailyWednesday,
				ScheduleDailyThursday: automation.ScheduleDailyThursday,
				ScheduleDailyFriday: automation.ScheduleDailyFriday,
				ScheduleDailySaturday: automation.ScheduleDailySaturday,

				ExecuteAsServiceUser: automation.ExecuteAsServiceUser,
				IsSingleton: automation.IsSingleton,

				FilePath: automation.FactoryDefaultPath || null,
				AttachmentFilePath: automation.FactoryDefaultAttachmentsPath || null,

				TriggerTypes: automation.TriggerTypes,
				Resources: map(automation.LanguageResources, function(r){
					return {
						Language: r.Language,
						Name: r.Name,
						Value: r.Value
					};
				}),
				EventKeys: automation.EventKeys,
				Events: automation.Events,
				EnabledConfigurations: automation.EnabledConfigurations,
				RestScopeId: automation.RestScopeId,
				RestScopeName: automation.RestScopeName || core_v2_language.GetResource('NotPublishedRestScopeName').replace('{0}',  projectedAutomation.ProcessedName)
			});
		}

		return projectedAutomation;
	}

	/*
	options:
		automation
		includeFileDigests: true|false (default false)
	*/
	function projectAutomationFile (automationFile, options) {
		if (!automationFile)
			return null;

		var automation = null;
		if (options)
			automation = options.automation;

		var includeFileDigests = options && options.includeFileDigests

		var projectedAutomationFile = {
			Id: automationFile.Id || '',
			HostId: automationFile.HostId || null,
			HostName: automationFile.HostName || null,
			AutomationName: automationFile.AutomationName || '',
			AutomationProcessedName: automationFile.AutomationProcessedName || null,

			Name: automationFile.Name || null,
			Url: automationFile.Url || '',

			Content: automationFile.Content || '',
			ContentHash: automationFile.ContentHash || ''
		};

		if (automation) {
			extend(projectedAutomationFile, {
				State: automation.State,
				IsStaged: automation.IsStaged,
				IsEditable: automation.IsEditable,
				IsTranslated: automation.IsTranslated,
				IsReverted: automation.IsReverted,
				IsDeleted: automation.IsDeleted,
				Files: map(automation.Files, function(f) {
					var file = { Name: f.Name };

					if (includeFileDigests)
						file.Digest = f.ContentHash;

					return file;
				})
			});
		}

		return projectedAutomationFile;
	}

	function projectConfiguredAutomation (configuredAutomation) {
		if (!configuredAutomation)
			return null;

		return {
			Type: 'ConfiguredAutomation',
			Id: configuredAutomation.Id || '',
			AutomationId: configuredAutomation.AutomationId || '',
			Name: configuredAutomation.Name || '',
			Description: configuredAutomation.Description || ''
		};
	}

	function projectSearchResult (searchResult) {
		if (!searchResult)
			return null;

		return 	{
			LineNumber: searchResult.LineNumber || 0,
			HostId: searchResult.HostId || null,
			Id: searchResult.Id,
			ComponentType: searchResult.ComponentType,
			FileName: searchResult.FileName || '',
			Excerpt: (searchResult.Excerpt ? core_v2_encoding.HtmlEncode(searchResult.Excerpt) : ''),
			Name: searchResult.Name || '',
			ProcessedName: searchResult.ProcessedName || '',
			HostName: searchResult.HostName || null,
			State: searchResult.State,
			IsStaged: searchResult.IsStaged,
			IsTranslated: searchResult.IsTranslated
		};
	}

	/*
		options:
			excludeConfiguredAutomations
	*/
	function loadAndProjectStagedItems(options) {
		var excludeConfiguredAutomations = options && options.excludeConfiguredAutomations == true;
		var automations = context.ListAutomations({ Staged: true });
		var stagedItems = map(automations, function(a) {
			return util.projectAutomation(a, { summarize: true });
		});

		if (excludeConfiguredAutomations) {
			return stagedItems;
		} else {
			var configuredAutomations = context.ListConfiguredAutomations({ Staged: true });
			return stagedItems.concat(map(configuredAutomations, function(ca) {
				return util.projectConfiguredAutomation(ca);
			}))
		}
	}

	return {
		projectAutomation: projectAutomation,
		projectAutomationFile: projectAutomationFile,
		projectConfiguredAutomation: projectConfiguredAutomation,
		projectSearchResult: projectSearchResult,
		loadAndProjectStagedItems: loadAndProjectStagedItems,
		extend: extend,
		map: map
	};

})();
