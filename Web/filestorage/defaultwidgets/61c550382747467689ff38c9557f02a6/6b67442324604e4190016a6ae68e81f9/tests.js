define('Tests', ['StudioSaveQueue', 'DataModel'], (StudioSaveQueue, DataModel, $, global, undef) => {

	let messaging = $.telligent.evolution.messaging;

	let socialThemeId = "3fc3f824-83d1-4ec4-85ef-92e206116d49";
	let articleCollectionThemeTypeId = "81d59b9a-7fa4-4a7b-98ee-7e3c91067510";
	let blogThemeTypeId = "a3b17ab0-af5f-11dd-a350-1fcf55d89593";
	let groupThemeTypeId = "c6108064-af65-11dd-b074-de1a56d89593";
	let siteThemeTypeId = "0c647246-6735-42f9-875d-c8b991fe739b";
	let testNewId = "930a0ce8-07a6-4ed9-9728-e16e16aa8d7a";
	let defaultArticleCollectionThemeDescription = "'Social' Article Collection Theme";
	let defaultBlogThemeDescription = "'Social' Blog Theme";
	let defaultSiteThemeDescription = "Configurable 'Social' Site Theme";
	let defaultGroupThemeDescription = "'Social' Group Theme";
	let testFileName = 'favicon.png';
	let defaultStyleFilesLength = 8;
	let defaultScriptFilesLength = 2;
	let themeLength = 4;

	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function runDataProviderTests(dataProvider) {
		test.heading('Data Provider Tests');

		test("Listing themes should list all themes", async assert => {
			let themes = (await dataProvider.listThemes()).themes;
			assert(themes.length === themeLength);
		});

		test("Listing themes by type should only return type", async assert => {
			let themes = (await dataProvider.listThemes({ typeid: groupThemeTypeId })).themes;
			assert(themes.length === 1 && themes[0].TypeId == groupThemeTypeId);
		});

		test("Listing themes by staged: true should only return staged themes", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ staged: true })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == 1
				&& themes[0].Description == 'x'
				&& themes[0].State == 'CustomizedDefault'
				&& themes[0].IsFactoryDefault == false
				&& themes[0].IsStaged == true);
		});

		test("Listing themes by staged: false should return non-staged themes as well as the published version of currently-staged themes", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ staged: false })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == themeLength

				&& themes[1].Description == defaultBlogThemeDescription
				&& themes[1].State == 'FactoryDefault'
				&& themes[1].IsFactoryDefault == true
				&& themes[1].IsStaged == false

				&& themes[3].Description == defaultSiteThemeDescription
				&& themes[3].State == 'CustomizedDefault'
				&& themes[3].IsFactoryDefault == true
				&& themes[3].IsStaged == false
				);
		});

		test("Listing themes by state: 'FactoryDefault' should only return themes which are currently in a Factory Default State", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ state: 'FactoryDefault' })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == (themeLength - 1)
				&& themes[0].State == 'FactoryDefault');
		});

		test("Listing themes by state: 'CustomizedDefault' should return only themes which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ state: 'CustomizedDefault' })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == 1
				&& themes[0].State == 'CustomizedDefault');
		});

		test("Listing themes by state: 'Custom' should only return themes which are currently in a Custom State", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ state: 'Custom' })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == 0);
		});

		test("Getting a theme returns theme", async assert => {
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(theme.Id == socialThemeId && theme.TypeId == siteThemeTypeId);
		});

		test("Getting a theme returns latest version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.State == 'CustomizedDefault'
				&& theme.IsFactoryDefault == false
				&& theme.IsStaged == true);
		});

		test("Getting a theme with staged: false should return non-staged version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, staged: false });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == defaultSiteThemeDescription
				&& theme.State == 'CustomizedDefault' // to know that this is a cutomized theme but currently viewing fac default version
				&& theme.IsFactoryDefault == true
				&& theme.IsStaged == false);
		});


		test("Getting a theme with staged: true should return staged version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, staged: true });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == 'x'
				&& theme.State == 'CustomizedDefault' // to know that this is a cutomized theme but currently viewing fac default version
				&& theme.IsFactoryDefault == false
				&& theme.IsStaged == true);
		});

		test("Getting a theme with factoryDefault: true should return factory default version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, factoryDefault: true });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == defaultSiteThemeDescription
				&& theme.State == 'CustomizedDefault' // to know that this is a cutomized theme but currently viewing fac default version
				&& theme.IsFactoryDefault == true
				&& theme.IsStaged == false);
		});

		test("Getting a theme with factoryDefault: false should return non-factory default version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, factoryDefault: false });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == 'x'
				&& theme.State == 'CustomizedDefault' // to know that this is a cutomized theme but currently viewing fac default version
				&& theme.IsFactoryDefault == false
				&& theme.IsStaged == true);
		});

		test("Saving a default theme saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.Description == 'x'
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length);
		});

		test("Saving a default theme multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'y' });
			let saveResult2 = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'z' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.Description == 'z'
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length);
		});

		test("Saving a default theme saves and returns saved theme and list of staged", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedTheme.Id == socialThemeId
				&& saveResult.savedTheme.TypeId == siteThemeTypeId
				&& saveResult.savedTheme.Description == 'x'
				&& saveResult.savedTheme.State == 'CustomizedDefault'
				&& saveResult.savedTheme.IsFactoryDefault == false
				&& saveResult.savedTheme.IsStaged == true

				&& saveResult.savedTheme.Files.length > 0
				&& saveResult.savedTheme.ScriptFiles.length > 0
				&& saveResult.savedTheme.StyleFiles.length > 0

				&& saveResult.savedTheme.Files.length == originalTheme.Files.length
				&& saveResult.savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& saveResult.savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& saveResult.stagedThemes.length == 1

				&& saveResult.stagedThemes[0].Id == socialThemeId
				&& saveResult.stagedThemes[0].TypeId == siteThemeTypeId
				&& saveResult.stagedThemes[0].Description == 'x'
				&& saveResult.stagedThemes[0].State == 'CustomizedDefault'
				&& saveResult.stagedThemes[0].IsFactoryDefault == false
				&& saveResult.stagedThemes[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default theme reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.savedTheme.Id == socialThemeId
				&& saveResult.savedTheme.TypeId == siteThemeTypeId
				&& saveResult.savedTheme.Description == 'x'
				&& saveResult.savedTheme.State == 'CustomizedDefault'
				&& saveResult.savedTheme.IsFactoryDefault == false
				&& saveResult.savedTheme.IsStaged == true

				&& saveResult.savedTheme.Files.length > 0
				&& saveResult.savedTheme.ScriptFiles.length > 0
				&& saveResult.savedTheme.StyleFiles.length > 0

				&& saveResult.savedTheme.Files.length == originalTheme.Files.length
				&& saveResult.savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& saveResult.savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& revertResult.revertedTheme.Id == socialThemeId
				&& revertResult.revertedTheme.TypeId == siteThemeTypeId
				&& revertResult.revertedTheme.Description == defaultSiteThemeDescription
				&& revertResult.revertedTheme.State == 'FactoryDefault'
				&& revertResult.revertedTheme.IsFactoryDefault == true
				&& revertResult.revertedTheme.IsStaged == false

				&& revertResult.revertedTheme.Files.length > 0
				&& revertResult.revertedTheme.ScriptFiles.length > 0
				&& revertResult.revertedTheme.StyleFiles.length > 0

				&& revertResult.revertedTheme.Files.length == originalTheme.Files.length
				&& revertResult.revertedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& revertResult.revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& revertedTheme.Id == socialThemeId
				&& revertedTheme.TypeId == siteThemeTypeId
				&& revertedTheme.Description == defaultSiteThemeDescription
				&& revertedTheme.State == 'FactoryDefault'
				&& revertedTheme.IsFactoryDefault == true
				&& revertedTheme.IsStaged == false

				&& revertedTheme.Files.length > 0
				&& revertedTheme.ScriptFiles.length > 0
				&& revertedTheme.StyleFiles.length > 0

				&& revertedTheme.Files.length == originalTheme.Files.length
				&& revertedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				);
		});

		test("Reverting multiple themes reverts multiple themes", async assert => {
			let originalTheme0 = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalTheme1 = await dataProvider.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let originalTheme2 = await dataProvider.getTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			let saveResult0 = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataProvider.saveTheme({ id: socialThemeId, typeId: groupThemeTypeId, description: 'y' });
			let saveResult2 = await dataProvider.saveTheme({ id: socialThemeId, typeId: blogThemeTypeId, description: 'z' });

			let themeIds = `${socialThemeId}:${siteThemeTypeId},${socialThemeId}:${groupThemeTypeId},${socialThemeId}:${blogThemeTypeId}`;
			let revertResult = await dataProvider.revertThemes({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, themeIds: themeIds });

			let revertedTheme0 = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme1 = await dataProvider.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let revertedTheme2 = await dataProvider.getTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			assert(originalTheme0.Description == defaultSiteThemeDescription
				&& originalTheme0.State == 'FactoryDefault'
				&& originalTheme0.IsFactoryDefault == true
				&& originalTheme0.IsStaged == false

				&& originalTheme1.Description == defaultGroupThemeDescription
				&& originalTheme1.State == 'FactoryDefault'
				&& originalTheme1.IsFactoryDefault == true
				&& originalTheme1.IsStaged == false

				&& originalTheme2.Description == defaultBlogThemeDescription
				&& originalTheme2.State == 'FactoryDefault'
				&& originalTheme2.IsFactoryDefault == true
				&& originalTheme2.IsStaged == false

				&& saveResult0.savedTheme.Description == 'x'
				&& saveResult0.savedTheme.State == 'CustomizedDefault'
				&& saveResult0.savedTheme.IsFactoryDefault == false
				&& saveResult0.savedTheme.IsStaged == true

				&& saveResult1.savedTheme.Description == 'y'
				&& saveResult1.savedTheme.State == 'CustomizedDefault'
				&& saveResult1.savedTheme.IsFactoryDefault == false
				&& saveResult1.savedTheme.IsStaged == true

				&& saveResult2.savedTheme.Description == 'z'
				&& saveResult2.savedTheme.State == 'CustomizedDefault'
				&& saveResult2.savedTheme.IsFactoryDefault == false
				&& saveResult2.savedTheme.IsStaged == true

				&& revertResult.stagedThemes.length == 0

				&& revertedTheme0.Description == defaultSiteThemeDescription
				&& revertedTheme0.State == 'FactoryDefault'
				&& revertedTheme0.IsFactoryDefault == true
				&& revertedTheme0.IsStaged == false

				&& revertedTheme1.Description == defaultGroupThemeDescription
				&& revertedTheme1.State == 'FactoryDefault'
				&& revertedTheme1.IsFactoryDefault == true
				&& revertedTheme1.IsStaged == false

				&& revertedTheme2.Description == defaultBlogThemeDescription
				&& revertedTheme2.State == 'FactoryDefault'
				&& revertedTheme2.IsFactoryDefault == true
				&& revertedTheme2.IsStaged == false
				);
		});

		test("Publishing a saved change to a default theme saves and sets it into a published, customized default, state and saves files too", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let publishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& publishedTheme.Id == socialThemeId
				&& publishedTheme.TypeId == siteThemeTypeId
				&& publishedTheme.Description == 'x'
				&& publishedTheme.State == 'CustomizedDefault'
				&& publishedTheme.IsFactoryDefault == false
				&& publishedTheme.IsStaged == false

				&& publishedTheme.Files.length > 0
				&& publishedTheme.ScriptFiles.length > 0
				&& publishedTheme.StyleFiles.length > 0

				&& publishedTheme.Files.length == originalTheme.Files.length
				&& publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length


				&& publishResult.publishedTheme.Id == socialThemeId
				&& publishResult.publishedTheme.TypeId == siteThemeTypeId
				&& publishResult.publishedTheme.Description == 'x'
				&& publishResult.publishedTheme.State == 'CustomizedDefault'
				&& publishResult.publishedTheme.IsFactoryDefault == false
				&& publishResult.publishedTheme.IsStaged == false

				&& publishResult.publishedTheme.Files.length > 0
				&& publishResult.publishedTheme.ScriptFiles.length > 0
				&& publishResult.publishedTheme.StyleFiles.length > 0

				&& publishResult.publishedTheme.Files.length == originalTheme.Files.length
				&& publishResult.publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& publishResult.publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& publishResult.stagedThemes.length == 0
				);
		});

		test("Publishing multiple themes publishes multiple themes", async assert => {
			let originalTheme0 = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalTheme1 = await dataProvider.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let originalTheme2 = await dataProvider.getTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			let saveResult0 = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataProvider.saveTheme({ id: socialThemeId, typeId: groupThemeTypeId, description: 'y' });
			let saveResult2 = await dataProvider.saveTheme({ id: socialThemeId, typeId: blogThemeTypeId, description: 'z' });

			let themeIds = `${socialThemeId}:${siteThemeTypeId},${socialThemeId}:${groupThemeTypeId},${socialThemeId}:${blogThemeTypeId}`;
			let publishResult = await dataProvider.publishThemes({ themeIds: themeIds });

			let publishedTheme0 = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedTheme1 = await dataProvider.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let publishedTheme2 = await dataProvider.getTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: groupThemeTypeId });
			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: blogThemeTypeId });
			await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataProvider.publishTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			await dataProvider.publishTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			assert(originalTheme0.Description == defaultSiteThemeDescription
				&& originalTheme0.State == 'FactoryDefault'
				&& originalTheme0.IsFactoryDefault == true
				&& originalTheme0.IsStaged == false

				&& originalTheme1.Description == defaultGroupThemeDescription
				&& originalTheme1.State == 'FactoryDefault'
				&& originalTheme1.IsFactoryDefault == true
				&& originalTheme1.IsStaged == false

				&& originalTheme2.Description == defaultBlogThemeDescription
				&& originalTheme2.State == 'FactoryDefault'
				&& originalTheme2.IsFactoryDefault == true
				&& originalTheme2.IsStaged == false

				&& publishResult.stagedThemes.length == 0

				&& publishedTheme0.Description == 'x'
				&& publishedTheme0.State == 'CustomizedDefault'
				&& publishedTheme0.IsFactoryDefault == false
				&& publishedTheme0.IsStaged == false

				&& publishedTheme1.Description == 'y'
				&& publishedTheme1.State == 'CustomizedDefault'
				&& publishedTheme1.IsFactoryDefault == false
				&& publishedTheme1.IsStaged == false

				&& publishedTheme2.Description == 'z'
				&& publishedTheme2.State == 'CustomizedDefault'
				&& publishedTheme2.IsFactoryDefault == false
				&& publishedTheme2.IsStaged == false
				);
		});


		test("Deleting a published, customized default theme reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let publishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deleteResult = await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& deleteResult.theme.Id == socialThemeId
				&& deleteResult.theme.TypeId == siteThemeTypeId
				&& deleteResult.theme.Description == defaultSiteThemeDescription
				&& deleteResult.theme.State == 'FactoryDefault'
				&& deleteResult.theme.IsFactoryDefault == true
				&& deleteResult.theme.IsStaged == true
				&& deleteResult.theme.IsReverted == true
				&& deleteResult.theme.IsDeleted == false

				&& deletePublishResult.publishedTheme.Id == socialThemeId
				&& deletePublishResult.publishedTheme.TypeId == siteThemeTypeId
				&& deletePublishResult.publishedTheme.Description == defaultSiteThemeDescription
				&& deletePublishResult.publishedTheme.State == 'FactoryDefault'
				&& deletePublishResult.publishedTheme.IsFactoryDefault == true
				&& deletePublishResult.publishedTheme.IsStaged == false

				&& deletePublishResult.publishedTheme.Files.length > 0
				&& deletePublishResult.publishedTheme.ScriptFiles.length > 0
				&& deletePublishResult.publishedTheme.StyleFiles.length > 0

				&& deletePublishResult.publishedTheme.Files.length == originalTheme.Files.length
				&& deletePublishResult.publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& deletePublishResult.publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& deletedTheme.Id == socialThemeId
				&& deletedTheme.TypeId == siteThemeTypeId
				&& deletedTheme.Description == defaultSiteThemeDescription
				&& deletedTheme.State == 'FactoryDefault'
				&& deletedTheme.IsFactoryDefault == true
				&& deletedTheme.IsStaged == false

				&& deletedTheme.Files.length > 0
				&& deletedTheme.ScriptFiles.length > 0
				&& deletedTheme.StyleFiles.length > 0

				&& deletedTheme.Files.length == originalTheme.Files.length
				&& deletedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& deletedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				);
		});

		test("Deleting multiple themes at different states deletes and/or reverts multiple themes", async assert => {
			// 3 types of states: staged customized default, published customized default, published custom
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let siteThemeSaveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let groupThemeSaveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: groupThemeTypeId, description: 'y' });
			let groupThemePublishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let blogThemeCloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: blogThemeTypeId, newId: newId });
			let blogThemeClonePublishResult = await dataProvider.publishTheme({ id: newId, typeId: blogThemeTypeId });

			let stagedSiteTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedGroupTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let clonedBlogTheme = await dataProvider.getTheme({ id: newId, typeId: blogThemeTypeId });

			let themeIds = `${socialThemeId}:${siteThemeTypeId},${socialThemeId}:${groupThemeTypeId},${newId}:${blogThemeTypeId}`;
			let deleteResult = await dataProvider.deleteThemes({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, themeIds: themeIds });
			let deletePublishResult = await dataProvider.publishThemes({ themeIds: themeIds });

			let deletedSiteTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedGroupTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let deletedBlogTheme = await dataProvider.getTheme({ id: newId, typeId: blogThemeTypeId });

			assert(stagedSiteTheme.Description == 'x'
				&& stagedSiteTheme.State == 'CustomizedDefault'
				&& stagedSiteTheme.IsFactoryDefault == false
				&& stagedSiteTheme.IsStaged == true

				&& publishedGroupTheme.Description == 'y'
				&& publishedGroupTheme.State == 'CustomizedDefault'
				&& publishedGroupTheme.IsFactoryDefault == false
				&& publishedGroupTheme.IsStaged == false

				&& clonedBlogTheme.State == 'Custom'
				&& clonedBlogTheme.IsFactoryDefault == false
				&& clonedBlogTheme.IsStaged == false

				&& deleteResult.stagedThemes.length == 2
				&& deleteResult.revertedThemes.length == 1
				&& deleteResult.stagedThemes[0].Id == socialThemeId
				&& deleteResult.stagedThemes[0].TypeId == groupThemeTypeId
				&& deleteResult.stagedThemes[0].IsDeleted == false
				&& deleteResult.stagedThemes[0].IsReverted == true
				&& deleteResult.stagedThemes[1].Id == newId
				&& deleteResult.stagedThemes[1].TypeId == blogThemeTypeId
				&& deleteResult.stagedThemes[1].IsDeleted == true
				&& deleteResult.stagedThemes[1].IsReverted == true
				&& deleteResult.revertedThemes[0].Id == socialThemeId
				&& deleteResult.revertedThemes[0].TypeId == siteThemeTypeId

				&& deletePublishResult.deletedThemes.length == 1
				&& deletePublishResult.revertedThemes.length == 1
				&& deletePublishResult.deletedThemes[0].Id == newId
				&& deletePublishResult.deletedThemes[0].TypeId == blogThemeTypeId
				&& deletePublishResult.revertedThemes[0].Id == socialThemeId
				&& deletePublishResult.revertedThemes[0].TypeId == groupThemeTypeId

				&& deletedSiteTheme.Description == defaultSiteThemeDescription
				&& deletedSiteTheme.State == 'FactoryDefault'
				&& deletedSiteTheme.IsFactoryDefault == true
				&& deletedSiteTheme.IsStaged == false

				&& deletedGroupTheme.Description == defaultGroupThemeDescription
				&& deletedGroupTheme.State == 'FactoryDefault'
				&& deletedGroupTheme.IsFactoryDefault == true
				&& deletedGroupTheme.IsStaged == false

				&& deletedBlogTheme == null
			);
		});

		test("Cloning a theme creates a custom, staged, theme with random new theme id and incremented name", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let clonedTheme = await dataProvider.getTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: clonedTheme.Id, typeId: siteThemeTypeId });
			await dataProvider.publishTheme({ id: clonedTheme.Id, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& cloneResult.clonedTheme.Id != socialThemeId
				&& cloneResult.clonedTheme.Name == (originalTheme.Name + ' 1')
				&& cloneResult.clonedTheme.TypeId == siteThemeTypeId
				&& cloneResult.clonedTheme.Description == defaultSiteThemeDescription
				&& cloneResult.clonedTheme.State == 'Custom'
				&& cloneResult.clonedTheme.IsFactoryDefault == false
				&& cloneResult.clonedTheme.IsStaged == true

				&& cloneResult.clonedTheme.Files.length > 0
				&& cloneResult.clonedTheme.ScriptFiles.length > 0
				&& cloneResult.clonedTheme.StyleFiles.length > 0

				&& cloneResult.clonedTheme.Files.length == originalTheme.Files.length
				&& cloneResult.clonedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& cloneResult.clonedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& cloneResult.stagedThemes.length == 1

				&& clonedTheme.Id != socialThemeId
				&& clonedTheme.Name == (originalTheme.Name + ' 1')
				&& clonedTheme.TypeId == siteThemeTypeId
				&& clonedTheme.Description == defaultSiteThemeDescription
				&& clonedTheme.State == 'Custom'
				&& clonedTheme.IsFactoryDefault == false
				&& clonedTheme.IsStaged == true

				&& clonedTheme.Files.length > 0
				&& clonedTheme.ScriptFiles.length > 0
				&& clonedTheme.StyleFiles.length > 0

				&& clonedTheme.Files.length == originalTheme.Files.length
				&& clonedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& clonedTheme.StyleFiles.length == originalTheme.StyleFiles.length
			);
		});



		test("Cloning a theme with specific ID creates a custom, staged, theme with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId, newId: newId });
			let clonedTheme = await dataProvider.getTheme({ id: newId, typeId: siteThemeTypeId });
			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: newId, typeId: siteThemeTypeId });
			await dataProvider.publishTheme({ id: newId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& cloneResult.clonedTheme.Id == newId
				&& cloneResult.clonedTheme.Name == (originalTheme.Name + ' 1')
				&& clonedTheme.Id == newId
				&& clonedTheme.Name == (originalTheme.Name + ' 1')
			);
		});

		test("Publishing a cloned theme publishes", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishResult = await dataProvider.publishTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let clonedTheme = await dataProvider.getTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: clonedTheme.Id, typeId: siteThemeTypeId });
			await dataProvider.publishTheme({ id: clonedTheme.Id, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& publishResult.publishedTheme.Id != socialThemeId
				&& publishResult.publishedTheme.Name == (originalTheme.Name + ' 1')
				&& publishResult.publishedTheme.TypeId == siteThemeTypeId
				&& publishResult.publishedTheme.Description == defaultSiteThemeDescription
				&& publishResult.publishedTheme.State == 'Custom'
				&& publishResult.publishedTheme.IsFactoryDefault == false
				&& publishResult.publishedTheme.IsStaged == false

				&& publishResult.publishedTheme.Files.length > 0
				&& publishResult.publishedTheme.ScriptFiles.length > 0
				&& publishResult.publishedTheme.StyleFiles.length > 0

				&& publishResult.publishedTheme.Files.length == originalTheme.Files.length
				&& publishResult.publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& publishResult.publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& publishResult.stagedThemes.length == 0

				&& clonedTheme.Id != socialThemeId
				&& clonedTheme.Name == (originalTheme.Name + ' 1')
				&& clonedTheme.TypeId == siteThemeTypeId
				&& clonedTheme.Description == defaultSiteThemeDescription
				&& clonedTheme.State == 'Custom'
				&& clonedTheme.IsFactoryDefault == false
				&& clonedTheme.IsStaged == false

				&& clonedTheme.Files.length > 0
				&& clonedTheme.ScriptFiles.length > 0
				&& clonedTheme.StyleFiles.length > 0

				&& clonedTheme.Files.length == originalTheme.Files.length
				&& clonedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& clonedTheme.StyleFiles.length == originalTheme.StyleFiles.length
			);
		});

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishResult = await dataProvider.publishTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let deleteResult = await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let deletePublishResult = await dataProvider.publishTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let theme = await dataProvider.getTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });

			assert(publishResult.publishedTheme !== null
				&& theme == null);
		})

		test("Getting a theme style file gets style file", async assert => {
			let file = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			assert(file.Name == 'handheld.less');
		});

		test("Getting a theme script file gets script file", async assert => {
			let file = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			assert(file.Name == 'theme.js');
		});

		test("Getting an editable theme file gets file", async assert => {
			let file = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File' });
			assert(file.Name == 'mixins.less');
		});

		test("Getting a non-editable theme file gets file", async assert => {
			let file = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			assert(file.Name == testFileName);
		});

		test("Saving a script file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedThemeFile.Content == 'new script'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedThemeFile.Content == 'new file content'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a style file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedThemeFile.Content == 'new content'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a style file multiple times saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content 0' });
			let saveResult1 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content 1' });
			let saveResult2 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content 2' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedThemeFile.Content == 'new content 2'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a script file multiple times saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script 0' });
			let saveResult1 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script 1' });
			let saveResult2 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script 2' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedThemeFile.Content == 'new script 2'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a file multiple times saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content 0' });
			let saveResult1 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content 1' });
			let saveResult2 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content 2' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedThemeFile.Content == 'new file content 2'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Reverting a theme with a saved style file reverts both", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& revertedThemeFile.Content === originalThemeFile.Content

				&& revertedTheme.Id == socialThemeId
				&& revertedTheme.TypeId == siteThemeTypeId
				&& revertedTheme.State == 'FactoryDefault'

				&& revertedTheme.Files.length > 0
				&& revertedTheme.ScriptFiles.length > 0
				&& revertedTheme.StyleFiles.length > 0);
		})


		test("Publishing a theme with saved style file publishes both", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let publishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let publishedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult = await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& publishedThemeFile.Content == 'new content'

				&& publishedTheme.Id == socialThemeId
				&& publishedTheme.TypeId == siteThemeTypeId
				&& publishedTheme.State == 'CustomizedDefault'
				&& publishedTheme.IsFactoryDefault == false
				&& publishedTheme.IsStaged == false

				&& publishedTheme.Files.length > 0
				&& publishedTheme.ScriptFiles.length > 0
				&& publishedTheme.StyleFiles.length > 0
			);
		});

		test("Deleting a published customization of default theme reverts theme and edited file", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let publishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let publishedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult = await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& deletedThemeFile.Content === originalThemeFile.Content

				&& deletedTheme.Id == socialThemeId
				&& deletedTheme.TypeId == siteThemeTypeId
				&& deletedTheme.State == 'FactoryDefault'

				&& deletedTheme.Files.length > 0
				&& deletedTheme.ScriptFiles.length > 0
				&& deletedTheme.StyleFiles.length > 0
			);
		});

		test("Getting non-staged version of otherwise staged theme file gets non-staged version", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let nonStagedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', staged: false });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalThemeFile.Content != 'new content'
				&& savedThemeFile.Content == 'new content'
				&& nonStagedThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default theme file gets fac default version", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let facDefaultThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', factoryDefault: true });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalThemeFile.Content != 'new content'
				&& savedThemeFile.Content == 'new content'
				&& facDefaultThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted style file from non-staging restores it and its metadata", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let restoreResult = await dataProvider.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let restoredTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.StyleFiles.length == originalTheme.StyleFiles.length
				&& restoreResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') != null
				&& restoreResult.savedThemeFile.MediaQuery == originalThemeFile.MediaQuery
				&& restoreResult.savedThemeFile.Content == originalThemeFile.Content
				&& restoredTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& restoredTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null
				&& restoredThemeFile.MediaQuery == originalThemeFile.MediaQuery
				&& restoredThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted style file from fac default restores it and its metadata", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let publishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let restoreResult = await dataProvider.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let restoredTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult2 = await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult2 = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.StyleFiles.length == originalTheme.StyleFiles.length
				&& restoreResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') != null
				&& restoreResult.savedThemeFile.MediaQuery == originalThemeFile.MediaQuery
				&& restoreResult.savedThemeFile.Content == originalThemeFile.Content
				&& restoredTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& restoredTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null
				&& restoredThemeFile.MediaQuery == originalThemeFile.MediaQuery
				&& restoredThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted script file from non-staging restores it", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let restoreResult = await dataProvider.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let restoredTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.length > 0

				&& originalTheme.ScriptFiles.find(s => s.Name == 'theme.js') !== null

				&& originalThemeFile.Name == 'theme.js'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deleteResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& restoreResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') != null
				&& restoreResult.savedThemeFile.Content == originalThemeFile.Content
				&& restoredTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& restoredTheme.ScriptFiles.find(s => s.Name == 'theme.js') != null
				&& restoredThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted script file from fac default restores it", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let publishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let restoreResult = await dataProvider.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let restoredTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let deleteResult2 = await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult2 = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.length > 0

				&& originalTheme.ScriptFiles.find(s => s.Name == 'theme.js') !== null

				&& originalThemeFile.Name == 'theme.js'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deleteResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& restoreResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') != null
				&& restoreResult.savedThemeFile.Content == originalThemeFile.Content
				&& restoredTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& restoredTheme.ScriptFiles.find(s => s.Name == 'theme.js') != null
				&& restoredThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted file from non-staging restores it", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let restoreResult = await dataProvider.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let restoredTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.length > 0

				&& originalTheme.Files.find(s => s.Name == testFileName) !== null

				&& originalThemeFile.Name == testFileName

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.Files.length == originalTheme.Files.length - 1
				&& deleteResult.theme.Files.find(s => s.Name == testFileName) == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.Files.length == originalTheme.Files.length
				&& restoreResult.theme.Files.find(s => s.Name == testFileName) != null
				&& restoredTheme.Files.length == originalTheme.Files.length
				&& restoredTheme.Files.find(s => s.Name == testFileName) != null
			);
		});

		test("Restoring a deleted file from fac default restores it", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let publishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let restoreResult = await dataProvider.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let restoredTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let deleteResult2 = await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult2 = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.length > 0

				&& originalTheme.Files.find(s => s.Name == testFileName) !== null

				&& originalThemeFile.Name == testFileName

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.Files.length == originalTheme.Files.length - 1
				&& deleteResult.theme.Files.find(s => s.Name == testFileName) == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.Files.length == originalTheme.Files.length
				&& restoreResult.theme.Files.find(s => s.Name == testFileName) != null
				&& restoredTheme.Files.length == originalTheme.Files.length
				&& restoredTheme.Files.find(s => s.Name == testFileName) != null
			);
		});

		test("Deleting a style file from a default theme sets theme to staged with removed file", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedTheme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deletedTheme.StyleFiles.find(s => s.Name == 'handheld.less') == null
				&& deletedTheme.State == 'CustomizedDefault'
				&& deletedTheme.IsFactoryDefault == false
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null
			);
		});

		test("Deleting a script file from a default theme sets theme to staged with removed file", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.length > 0

				&& originalTheme.ScriptFiles.find(s => s.Name == 'theme.js') !== null

				&& originalThemeFile.Name == 'theme.js'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deleteResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') == null

				&& deletedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deletedTheme.ScriptFiles.find(s => s.Name == 'theme.js') == null
				&& deletedTheme.State == 'CustomizedDefault'
				&& deletedTheme.IsFactoryDefault == false
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null
			);
		});

		test("Deleting a file from a default theme sets theme to staged with removed file", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.length > 0

				&& originalTheme.Files.find(s => s.Name == testFileName) !== null

				&& originalThemeFile.Name == testFileName

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.Files.length == originalTheme.Files.length - 1
				&& deleteResult.theme.Files.find(s => s.Name == testFileName) == null

				&& deletedTheme.Files.length == originalTheme.Files.length - 1
				&& deletedTheme.Files.find(s => s.Name == testFileName) == null
				&& deletedTheme.State == 'CustomizedDefault'
				&& deletedTheme.IsFactoryDefault == false
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null
			);
		});

		test("Reverting file deletion from staged theme sets theme back to factory default", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedTheme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deletedTheme.StyleFiles.find(s => s.Name == 'handheld.less') == null
				&& deletedTheme.State == 'CustomizedDefault'
				&& deletedTheme.IsFactoryDefault == false
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null

				&& revertResult.stagedThemes.length == 0
				&& revertResult.revertedTheme.IsStaged == false
				&& revertResult.revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& revertResult.revertedTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null

				&& revertedTheme.IsStaged == false
				&& revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& revertedTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null

				&& revertedThemeFile !== null
			);
		});

		test("Re-ordering style files re-orders", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = originalTheme.StyleFiles.map(s => s.Name);
			let i = fileNames.indexOf('handheld.less');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			fileNames.unshift('handheld.less');
			let newStyleFiles = fileNames.join('/');

			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newStyleFiles: newStyleFiles })
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.StyleFiles.length == defaultStyleFilesLength
				&& savedTheme.StyleFiles[0].Name == 'handheld.less'
				&& revertResult.revertedTheme.StyleFiles.length == defaultStyleFilesLength
				&& revertResult.revertedTheme.StyleFiles[0].Name != 'handheld.less'
			);
		});

		test("Re-ordering style files with exclusions deletes", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = originalTheme.StyleFiles.map(s => s.Name);
			let i = fileNames.indexOf('handheld.less');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			let newStyleFiles = fileNames.join('/');

			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newStyleFiles: newStyleFiles })
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.StyleFiles.length == defaultStyleFilesLength - 1
				&& revertResult.revertedTheme.StyleFiles.length == defaultStyleFilesLength
			);
		});

		test("Re-ordering script files re-orders", async assert => {
			let scriptSaveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newscript.js', type: 'Script', content: 'script' });
			let currentTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = currentTheme.ScriptFiles.map(s => s.Name);
			let i = fileNames.indexOf('newscript.js');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			fileNames.unshift('newscript.js');
			let newScriptFiles = fileNames.join('/');

			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newScriptFiles: newScriptFiles })
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.ScriptFiles.length == defaultScriptFilesLength + 1
				&& savedTheme.ScriptFiles[0].Name == 'newscript.js'
				&& revertResult.revertedTheme.ScriptFiles.length == defaultScriptFilesLength
				&& revertResult.revertedTheme.ScriptFiles[0].Name == 'theme.js'
			);
		});

		test("Re-ordering script files with exclusions deletes", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = originalTheme.ScriptFiles.map(s => s.Name);
			let i = fileNames.indexOf('theme.js');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			let newScriptFiles = fileNames.join('/');

			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newScriptFiles: newScriptFiles })
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.ScriptFiles.length == defaultScriptFilesLength - 1
				&& revertResult.revertedTheme.ScriptFiles.length == defaultScriptFilesLength
			);
		});

		test("Renaming a style file renames file and retains order", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content', newName: 'handheld2.less' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld2.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			let styleFileIndex;
			for(let i = 0; i < originalTheme.StyleFiles.length; i++) {
				if(originalTheme.StyleFiles[i].Name == 'handheld.less') {
					styleFileIndex = i;
				}
			}

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.filter(s => s.Name == 'handheld2.less').length == 0
				&& originalTheme.StyleFiles.filter(s => s.Name == 'handheld.less').length == 1
				&& originalTheme.StyleFiles[styleFileIndex].Name == 'handheld.less'

				&& originalTheme.StyleFiles.length == savedTheme.StyleFiles.length

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.StyleFiles.filter(s => s.Name == 'handheld2.less').length == 1
				&& savedTheme.StyleFiles.filter(s => s.Name == 'handheld.less').length == 0
				&& savedTheme.StyleFiles[styleFileIndex].Name == 'handheld2.less'

				&& savedThemeFile.Content == 'new content'
				&& savedThemeFile.Name == 'handheld2.less'
			);
		});

		test("Renaming a script file renames file and retains order", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new content', newName: 'theme2.js' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme2.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			let scriptFileIndex;
			for(let i = 0; i < originalTheme.ScriptFiles.length; i++) {
				if(originalTheme.ScriptFiles[i].Name == 'theme.js') {
					scriptFileIndex = i;
				}
			}

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.filter(s => s.Name == 'theme2.js').length == 0
				&& originalTheme.ScriptFiles.filter(s => s.Name == 'theme.js').length == 1
				&& originalTheme.ScriptFiles[scriptFileIndex].Name == 'theme.js'

				&& originalTheme.ScriptFiles.length == savedTheme.ScriptFiles.length

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.ScriptFiles.filter(s => s.Name == 'theme2.js').length == 1
				&& savedTheme.ScriptFiles.filter(s => s.Name == 'theme.js').length == 0
				&& savedTheme.ScriptFiles[scriptFileIndex].Name == 'theme2.js'

				&& savedThemeFile.Content == 'new content'
				&& savedThemeFile.Name == 'theme2.js'

				&& saveResult.isNew == false
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File', newName: 'favicon2.ico' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'favicon2.ico', type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.filter(s => s.Name == 'favicon2.ico').length == 0
				&& originalTheme.Files.filter(s => s.Name == testFileName).length == 1

				&& originalTheme.Files.length == savedTheme.Files.length

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.Files.filter(s => s.Name == 'favicon2.ico').length == 1
				&& savedTheme.Files.filter(s => s.Name == testFileName).length == 0

				&& savedThemeFile.Name == 'favicon2.ico'

				&& saveResult.isNew == false
			);
		});

		test("Saving a style file with options saves options", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content', mediaQuery: 'new query' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(savedThemeFile.Content == 'new content'
				&& savedThemeFile.MediaQuery == 'new query'
				&& revertedThemeFile.Content != 'new content'
				&& revertedThemeFile.MediaQuery != 'new query'
				&& saveResult.isNew == false
			);
		});

		test("Creating a new style file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.createThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, type: 'Style' });

			assert(saveResult
				&& saveResult.Id == socialThemeId
				&& saveResult.TypeId == siteThemeTypeId
				&& saveResult.Type == 'Style'
				&& saveResult.Name == 'untitled.less'
				&& saveResult.ThemeName == originalTheme.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.StyleFiles.length == originalTheme.StyleFiles.length
			);
		});

		test("Creating a new script file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.createThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, type: 'Script' });

			assert(saveResult
				&& saveResult.Id == socialThemeId
				&& saveResult.TypeId == siteThemeTypeId
				&& saveResult.Type == 'Script'
				&& saveResult.Name == 'untitled.js'
				&& saveResult.ThemeName == originalTheme.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.ScriptFiles.length == originalTheme.ScriptFiles.length
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.createThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, type: 'File' });

			assert(saveResult
				&& saveResult.Id == socialThemeId
				&& saveResult.TypeId == siteThemeTypeId
				&& saveResult.Type == 'File'
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.ThemeName == originalTheme.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalTheme.Files.length
			);
		});

		test("Saving a renamed style file with options saves options", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content', mediaQuery: 'new query' });
			let saveResult2 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', newName: 'handheld2.less' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld2.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(savedThemeFile.Content == 'new content'
				&& savedThemeFile.MediaQuery == 'new query'
				&& revertedThemeFile.Content != 'new content'
				&& revertedThemeFile.MediaQuery != 'new query'
			);
		});

		test("Saving a new style file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newstyle.less', type: 'Style', content: 'content', mediaQuery: 'query' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newstyle.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& savedThemeFile.Content == 'content'
				&& savedThemeFile.MediaQuery == 'query'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Saving a new script file saves script file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newscript.js', type: 'Script', content: 'script' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newscript.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& savedThemeFile.Content == 'script'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Saving a new file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newfile.less', type: 'File', content: 'content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newfile.less', type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& savedThemeFile.Content == 'content'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.Files.length == originalTheme.Files.length + 1

				&& saveResult.isNew == true
			);
		});
	}

	function runDataQueueTests() {

		test.heading('Data Queue Tests');

		function createPromise(id, log, failing, duration) {
			return $.Deferred(d => {
				log.push('promise.start: ' + id);
				setTimeout(() => {
					log.push('promise.done: ' + id);
					if(failing) {
						d.reject();
					} else {
						d.resolve();
					}
				}, (duration || 20));
			}).promise();
		}

		function compareLog(actual, expected) {
			if(!actual || !expected)
				return false;
			if(actual.length !== expected.length)
				return false;
			for(let i = 0; i < actual.length; i++) {
				if(actual[i] !== expected[i]){
					return false;
				}
			}
			return true;
		}

		test("Tasks added to queue are executed in non-overlapping order", assert =>{
			let log = [];

			let queue = new StudioSaveQueue({
				interval: 100,
				onEmpty: () => {
					assert(compareLog(log, [
						'promise.start: a',
						'promise.done: a',
						'promise.start: b',
						'promise.done: b',
						'promise.start: c',
						'promise.done: c'
					]));
				}
			});

			queue.add('a', () => createPromise('a', log))
			queue.add('b', () => createPromise('b', log))
			queue.add('c', () => createPromise('c', log))
		});

		test("Tasks are executed in interval batches", async assert => {

			let log = [];
			let queue = new StudioSaveQueue({
				interval: 100,
				onEmpty: () => {
					log.push('onEmpty')
				}
			});

			queue.add('a', () => createPromise('a', log))
			queue.add('b', () => createPromise('b', log))
			queue.add('c', () => createPromise('c', log))

			setTimeout(() => {
				queue.add('d', () => createPromise('d', log))
				queue.add('e', () => createPromise('e', log))
			}, 200)

			await delay(400);

			assert(compareLog(log, [
				'promise.start: a',
				'promise.done: a',
				'promise.start: b',
				'promise.done: b',
				'promise.start: c',
				'promise.done: c',
				'onEmpty',
				'promise.start: d',
				'promise.done: d',
				'promise.start: e',
				'promise.done: e',
				'onEmpty'
			]));

		});

		test("Queue raises callbacks", async assert => {

			let log = [];
			let queue = new StudioSaveQueue({
				interval: 100,
				onEmpty: () => log.push('onEmpty'),
				onTaskBegin: id => log.push('onTaskBegin: ' + id),
				onTaskDone: id => log.push('onTaskDone: ' + id),
				onTaskFail: id => log.push('onTaskFail: ' + id)
			});

			queue.add('a', () => createPromise('a', log));
			queue.add('b', () => createPromise('b', log, true));
			queue.add('c', () => createPromise('c', log));

			await delay(300);

			assert(compareLog(log, [
				'onTaskBegin: a',
				'promise.start: a',
				'promise.done: a',
				'onTaskDone: a',
				'onTaskBegin: b',
				'promise.start: b',
				'promise.done: b',
				'onTaskFail: b',
				'onTaskBegin: c',
				'promise.start: c',
				'promise.done: c',
				'onTaskDone: c',
				'onEmpty'
			]));
		});

		test("Adds return promises that resolve or reject based on inner promises", async assert => {
			let log = [];
			let queue = new StudioSaveQueue({
				interval: 100
			});

			queue.add('a', () => createPromise('a', log))
				.done(() => log.push('a done'))
				.fail(() => log.push('a failed'));

			queue.add('b', () => createPromise('b', log, true))
				.done(() => log.push('b done'))
				.fail(() => log.push('b failed'));

			queue.add('c', () => createPromise('c', log))
				.done(() => log.push('c done'))
				.fail(() => log.push('c failed'));

			await delay(300);

			assert(compareLog(log, [
				'promise.start: a',
				'promise.done: a',
				'a done',
				'promise.start: b',
				'promise.done: b',
				'b failed',
				'promise.start: c',
				'promise.done: c',
				'c done'
			]));
		});

		test("New tasks reorder existing non-run tasks only when contiguous", async assert => {
			let log = [];
			let queue = new StudioSaveQueue({
				interval: 100,
				globallyMergeDuplicates: false,
				onTaskBegin: id => { /*log.push('onTaskBegin: ' + id);*/ },
				onTaskDone: id => { /*log.push('onTaskDone: ' + id);*/ },
				onTaskFail: id => { /*log.push('onTaskFail: ' + id);*/ }
			});

			queue.add('a', () => createPromise('a', log));
			queue.add('b', () => createPromise('b', log));
			queue.add('c', () => createPromise('c', log));

			setTimeout(() => {
				queue.add('b', () => createPromise('b2', log))
			}, 20);

			setTimeout(() => {
				queue.add('b', () => createPromise('b3', log))
					.catch(d => {
						if(d.canceled)
							log.push('b3 interrupted');
					});
			}, 30);

			setTimeout(() => {
				queue.add('b', () => createPromise('b4', log));
			}, 40);

			await delay(300);

			assert(compareLog(log, [
				'b3 interrupted',
				'promise.start: a',
				'promise.done: a',
				'promise.start: b',
				'promise.done: b',
				'promise.start: c',
				'promise.done: c',
				'promise.start: b4',
				'promise.done: b4'
			]));
		});
	}

	function runDataModelTests(dataProvider) {

		let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';

		test.heading('Data Model Tests');

		// build model
		let saveQueue = new StudioSaveQueue({
			interval: 50,
			onTaskAdd: id => {},
			onTaskBegin: id => {},
			onTaskDone: id => {},
			onTaskFail: id => {},
			onEmpty: () => {},
			coalesce: true
		});

		let dataModel = new DataModel({
			queue: saveQueue,
			provider: dataProvider
		});

		test("Listing themes should list all themes", async assert => {
			let themes = (await dataModel.listThemes()).themes;
			assert(themes.length === themeLength);
		});

		test("Listing themes by type should only return type", async assert => {
			let themes = (await dataModel.listThemes({ typeid: groupThemeTypeId })).themes;
			assert(themes.length === 1 && themes[0].TypeId == groupThemeTypeId);
		});

		test("Listing themes by staged: true should only return staged themes", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataModel.listThemes({ staged: true })).themes;
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == 1
				&& themes[0].Description == 'x'
				&& themes[0].State == 'CustomizedDefault'
				&& themes[0].IsFactoryDefault == false
				&& themes[0].IsStaged == true);
		});

		test("Listing themes by staged: false should return non-staged themes as well as the published version of currently-staged themes", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataModel.listThemes({ staged: false })).themes;
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == themeLength

				&& themes[1].Description == defaultBlogThemeDescription
				&& themes[1].State == 'FactoryDefault'
				&& themes[1].IsFactoryDefault == true
				&& themes[1].IsStaged == false

				&& themes[3].Description == defaultSiteThemeDescription
				&& themes[3].State == 'CustomizedDefault'
				&& themes[3].IsFactoryDefault == true
				&& themes[3].IsStaged == false
				);
		});

		test("Listing themes by state: 'FactoryDefault' should only return themes which are currently in a Factory Default State", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataModel.listThemes({ state: 'FactoryDefault' })).themes;
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == (themeLength - 1)
				&& themes[0].State == 'FactoryDefault');
		});

		test("Listing themes by state: 'CustomizedDefault' should return only themes which are currently in a CustomizedDefault State", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataModel.listThemes({ state: 'CustomizedDefault' })).themes;
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == 1
				&& themes[0].State == 'CustomizedDefault');
		});

		test("Listing themes by state: 'Custom' should only return themes which are currently in a Custom State", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataModel.listThemes({ state: 'Custom' })).themes;
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == 0);
		});

		test("Getting a theme returns theme", async assert => {
			let theme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(theme.Id == socialThemeId && theme.TypeId == siteThemeTypeId);
		});

		test("Getting a theme returns latest version of theme", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.State == 'CustomizedDefault'
				&& theme.IsFactoryDefault == false
				&& theme.IsStaged == true);
		});

		test("Getting a theme with staged: false should return non-staged version of theme", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, staged: false });
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == defaultSiteThemeDescription
				&& theme.State == 'CustomizedDefault' // to know that this is a cutomized theme but currently viewing fac default version
				&& theme.IsFactoryDefault == true
				&& theme.IsStaged == false);
		});


		test("Getting a theme with staged: true should return staged version of theme", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, staged: true });
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == 'x'
				&& theme.State == 'CustomizedDefault' // to know that this is a cutomized theme but currently viewing fac default version
				&& theme.IsFactoryDefault == false
				&& theme.IsStaged == true);
		});

		test("Getting a theme with factoryDefault: true should return factory default version of theme", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, factoryDefault: true });
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == defaultSiteThemeDescription
				&& theme.State == 'CustomizedDefault' // to know that this is a cutomized theme but currently viewing fac default version
				&& theme.IsFactoryDefault == true
				&& theme.IsStaged == false);
		});

		test("Getting a theme with factoryDefault: false should return non-factory default version of theme", async assert => {
			await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, factoryDefault: false });
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == 'x'
				&& theme.State == 'CustomizedDefault' // to know that this is a cutomized theme but currently viewing fac default version
				&& theme.IsFactoryDefault == false
				&& theme.IsStaged == true);
		});

		test("Saving a default theme saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.Description == 'x'
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length);
		});

		test("Saving a default theme multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'y' });
			let saveResult2 = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'z' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.Description == 'z'
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length);
		});

		test("Saving a default theme saves and returns saved theme and list of staged", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedTheme.Id == socialThemeId
				&& saveResult.savedTheme.TypeId == siteThemeTypeId
				&& saveResult.savedTheme.Description == 'x'
				&& saveResult.savedTheme.State == 'CustomizedDefault'
				&& saveResult.savedTheme.IsFactoryDefault == false
				&& saveResult.savedTheme.IsStaged == true

				&& saveResult.savedTheme.Files.length > 0
				&& saveResult.savedTheme.ScriptFiles.length > 0
				&& saveResult.savedTheme.StyleFiles.length > 0

				&& saveResult.savedTheme.Files.length == originalTheme.Files.length
				&& saveResult.savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& saveResult.savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& saveResult.stagedThemes.length == 1

				&& saveResult.stagedThemes[0].Id == socialThemeId
				&& saveResult.stagedThemes[0].TypeId == siteThemeTypeId
				&& saveResult.stagedThemes[0].Description == 'x'
				&& saveResult.stagedThemes[0].State == 'CustomizedDefault'
				&& saveResult.stagedThemes[0].IsFactoryDefault == false
				&& saveResult.stagedThemes[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default theme reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.savedTheme.Id == socialThemeId
				&& saveResult.savedTheme.TypeId == siteThemeTypeId
				&& saveResult.savedTheme.Description == 'x'
				&& saveResult.savedTheme.State == 'CustomizedDefault'
				&& saveResult.savedTheme.IsFactoryDefault == false
				&& saveResult.savedTheme.IsStaged == true

				&& saveResult.savedTheme.Files.length > 0
				&& saveResult.savedTheme.ScriptFiles.length > 0
				&& saveResult.savedTheme.StyleFiles.length > 0

				&& saveResult.savedTheme.Files.length == originalTheme.Files.length
				&& saveResult.savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& saveResult.savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& revertResult.revertedTheme.Id == socialThemeId
				&& revertResult.revertedTheme.TypeId == siteThemeTypeId
				&& revertResult.revertedTheme.Description == defaultSiteThemeDescription
				&& revertResult.revertedTheme.State == 'FactoryDefault'
				&& revertResult.revertedTheme.IsFactoryDefault == true
				&& revertResult.revertedTheme.IsStaged == false

				&& revertResult.revertedTheme.Files.length > 0
				&& revertResult.revertedTheme.ScriptFiles.length > 0
				&& revertResult.revertedTheme.StyleFiles.length > 0

				&& revertResult.revertedTheme.Files.length == originalTheme.Files.length
				&& revertResult.revertedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& revertResult.revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& revertedTheme.Id == socialThemeId
				&& revertedTheme.TypeId == siteThemeTypeId
				&& revertedTheme.Description == defaultSiteThemeDescription
				&& revertedTheme.State == 'FactoryDefault'
				&& revertedTheme.IsFactoryDefault == true
				&& revertedTheme.IsStaged == false

				&& revertedTheme.Files.length > 0
				&& revertedTheme.ScriptFiles.length > 0
				&& revertedTheme.StyleFiles.length > 0

				&& revertedTheme.Files.length == originalTheme.Files.length
				&& revertedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				);
		});

		test("Deleting a published customized default stages reversion to factory default", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let publishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deleteResult = await dataModel.deleteTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let stagedDeletedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.savedTheme.Description == 'x'
				&& saveResult.savedTheme.State == 'CustomizedDefault'
				&& saveResult.savedTheme.IsFactoryDefault == false
				&& saveResult.savedTheme.IsStaged == true

				&& publishResult.publishedTheme.Description == 'x'
				&& publishResult.publishedTheme.State == 'CustomizedDefault'
				&& publishResult.publishedTheme.IsFactoryDefault == false
				&& publishResult.publishedTheme.IsStaged == false

				&& deleteResult.theme.Description == defaultSiteThemeDescription
				&& deleteResult.theme.State == 'FactoryDefault'
				&& deleteResult.theme.IsFactoryDefault == true
				&& deleteResult.theme.IsStaged == true

				&& stagedDeletedTheme.Description == defaultSiteThemeDescription
				&& stagedDeletedTheme.State == 'FactoryDefault'
				&& stagedDeletedTheme.IsFactoryDefault == true
				&& stagedDeletedTheme.IsStaged == true
				);
		});

		test("Reverting a staged deletion of customized default restores customized default", async assert => {

			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let publishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deleteResult = await dataModel.deleteTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataModel.revertTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let realDeleteResult = await dataModel.deleteTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.savedTheme.Description == 'x'
				&& saveResult.savedTheme.State == 'CustomizedDefault'
				&& saveResult.savedTheme.IsFactoryDefault == false
				&& saveResult.savedTheme.IsStaged == true

				&& publishResult.publishedTheme.Description == 'x'
				&& publishResult.publishedTheme.State == 'CustomizedDefault'
				&& publishResult.publishedTheme.IsFactoryDefault == false
				&& publishResult.publishedTheme.IsStaged == false

				&& deleteResult.theme.Description == defaultSiteThemeDescription
				&& deleteResult.theme.State == 'FactoryDefault'
				&& deleteResult.theme.IsFactoryDefault == true
				&& deleteResult.theme.IsStaged == true

				&& revertResult.revertedTheme.Description == 'x'
				&& revertResult.revertedTheme.State == 'CustomizedDefault'
				&& revertResult.revertedTheme.IsFactoryDefault == false
				&& revertResult.revertedTheme.IsStaged == false
				);
		})

		test("Deleting a published custom stages deletion", async assert => {

			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataModel.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId, newId: testNewId });
			let publishResult = await dataModel.publishTheme({ id: testNewId, typeId: siteThemeTypeId });
			let deleteResult = await dataModel.deleteTheme({ id: testNewId, typeId: siteThemeTypeId });
			let stagedDeletedTheme = await dataModel.getTheme({ id: testNewId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataModel.publishTheme({ id: testNewId, typeId: siteThemeTypeId });

			assert(originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.IsDeleted == false

				&& cloneResult.clonedTheme.Description == defaultSiteThemeDescription
				&& cloneResult.clonedTheme.State == 'Custom'
				&& cloneResult.clonedTheme.IsFactoryDefault == false
				&& cloneResult.clonedTheme.IsStaged == true
				&& cloneResult.clonedTheme.IsDeleted == false

				&& publishResult.publishedTheme.Description == defaultSiteThemeDescription
				&& publishResult.publishedTheme.State == 'Custom'
				&& publishResult.publishedTheme.IsFactoryDefault == false
				&& publishResult.publishedTheme.IsStaged == false
				&& publishResult.publishedTheme.IsDeleted == false

				&& deleteResult.theme.Description == defaultSiteThemeDescription
				&& deleteResult.theme.State == 'Custom'
				&& deleteResult.theme.IsFactoryDefault == false
				&& deleteResult.theme.IsDeleted == true
				&& deleteResult.theme.IsStaged == true

				&& stagedDeletedTheme.Description == defaultSiteThemeDescription
				&& stagedDeletedTheme.State == 'Custom'
				&& stagedDeletedTheme.IsFactoryDefault == false
				&& stagedDeletedTheme.IsDeleted == true
				&& stagedDeletedTheme.IsStaged == true
				);

		});

		test("Reverting a staged custom deletion restores custom", async assert => {

			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataModel.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId, newId: testNewId });
			let publishResult = await dataModel.publishTheme({ id: testNewId, typeId: siteThemeTypeId });

			let deleteResult = await dataModel.deleteTheme({ id: testNewId, typeId: siteThemeTypeId });
			let revertResult = await dataModel.revertTheme({ id: testNewId, typeId: siteThemeTypeId });

			let realDeleteResult = await dataModel.deleteTheme({ id: testNewId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataModel.publishTheme({ id: testNewId, typeId: siteThemeTypeId });

			assert(originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.IsDeleted == false

				&& cloneResult.clonedTheme.Description == defaultSiteThemeDescription
				&& cloneResult.clonedTheme.State == 'Custom'
				&& cloneResult.clonedTheme.IsFactoryDefault == false
				&& cloneResult.clonedTheme.IsStaged == true
				&& cloneResult.clonedTheme.IsDeleted == false

				&& publishResult.publishedTheme.Description == defaultSiteThemeDescription
				&& publishResult.publishedTheme.State == 'Custom'
				&& publishResult.publishedTheme.IsFactoryDefault == false
				&& publishResult.publishedTheme.IsStaged == false
				&& publishResult.publishedTheme.IsDeleted == false

				&& deleteResult.theme.Description == defaultSiteThemeDescription
				&& deleteResult.theme.State == 'Custom'
				&& deleteResult.theme.IsFactoryDefault == false
				&& deleteResult.theme.IsDeleted == true
				&& deleteResult.theme.IsStaged == true

				&& revertResult.revertedTheme.Description == defaultSiteThemeDescription
				&& revertResult.revertedTheme.State == 'Custom'
				&& revertResult.revertedTheme.IsFactoryDefault == false
				&& revertResult.revertedTheme.IsStaged == false
				&& revertResult.revertedTheme.IsDeleted == false
				);

		});

		test("Publishing a saved change to a default theme saves and sets it into a published, customized default, state and saves files too", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let publishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& publishedTheme.Id == socialThemeId
				&& publishedTheme.TypeId == siteThemeTypeId
				&& publishedTheme.Description == 'x'
				&& publishedTheme.State == 'CustomizedDefault'
				&& publishedTheme.IsFactoryDefault == false
				&& publishedTheme.IsStaged == false

				&& publishedTheme.Files.length > 0
				&& publishedTheme.ScriptFiles.length > 0
				&& publishedTheme.StyleFiles.length > 0

				&& publishedTheme.Files.length == originalTheme.Files.length
				&& publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length


				&& publishResult.publishedTheme.Id == socialThemeId
				&& publishResult.publishedTheme.TypeId == siteThemeTypeId
				&& publishResult.publishedTheme.Description == 'x'
				&& publishResult.publishedTheme.State == 'CustomizedDefault'
				&& publishResult.publishedTheme.IsFactoryDefault == false
				&& publishResult.publishedTheme.IsStaged == false

				&& publishResult.publishedTheme.Files.length > 0
				&& publishResult.publishedTheme.ScriptFiles.length > 0
				&& publishResult.publishedTheme.StyleFiles.length > 0

				&& publishResult.publishedTheme.Files.length == originalTheme.Files.length
				&& publishResult.publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& publishResult.publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& publishResult.stagedThemes.length == 0
				);
		});

		test("Deleting a published, customized default theme reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let publishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deleteResult = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& deleteResult.theme.Id == socialThemeId
				&& deleteResult.theme.TypeId == siteThemeTypeId
				&& deleteResult.theme.Description == defaultSiteThemeDescription
				&& deleteResult.theme.State == 'FactoryDefault'
				&& deleteResult.theme.IsFactoryDefault == true
				&& deleteResult.theme.IsStaged == true
				&& deleteResult.theme.IsReverted == true
				&& deleteResult.theme.IsDeleted == false

				&& deletePublishResult.publishedTheme.Id == socialThemeId
				&& deletePublishResult.publishedTheme.TypeId == siteThemeTypeId
				&& deletePublishResult.publishedTheme.Description == defaultSiteThemeDescription
				&& deletePublishResult.publishedTheme.State == 'FactoryDefault'
				&& deletePublishResult.publishedTheme.IsFactoryDefault == true
				&& deletePublishResult.publishedTheme.IsStaged == false

				&& deletePublishResult.publishedTheme.Files.length > 0
				&& deletePublishResult.publishedTheme.ScriptFiles.length > 0
				&& deletePublishResult.publishedTheme.StyleFiles.length > 0

				&& deletePublishResult.publishedTheme.Files.length == originalTheme.Files.length
				&& deletePublishResult.publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& deletePublishResult.publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& deletedTheme.Id == socialThemeId
				&& deletedTheme.TypeId == siteThemeTypeId
				&& deletedTheme.Description == defaultSiteThemeDescription
				&& deletedTheme.State == 'FactoryDefault'
				&& deletedTheme.IsFactoryDefault == true
				&& deletedTheme.IsStaged == false

				&& deletedTheme.Files.length > 0
				&& deletedTheme.ScriptFiles.length > 0
				&& deletedTheme.StyleFiles.length > 0

				&& deletedTheme.Files.length == originalTheme.Files.length
				&& deletedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& deletedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				);
		});

		test("Cloning a theme creates a custom, staged, theme with random new theme id and incremented name", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataModel.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let clonedTheme = await dataModel.getTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: clonedTheme.Id, typeId: siteThemeTypeId });
			await dataModel.publishTheme({ id: clonedTheme.Id, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& cloneResult.clonedTheme.Id != socialThemeId
				&& cloneResult.clonedTheme.Name == (originalTheme.Name + ' 1')
				&& cloneResult.clonedTheme.TypeId == siteThemeTypeId
				&& cloneResult.clonedTheme.Description == defaultSiteThemeDescription
				&& cloneResult.clonedTheme.State == 'Custom'
				&& cloneResult.clonedTheme.IsFactoryDefault == false
				&& cloneResult.clonedTheme.IsStaged == true

				&& cloneResult.clonedTheme.Files.length > 0
				&& cloneResult.clonedTheme.ScriptFiles.length > 0
				&& cloneResult.clonedTheme.StyleFiles.length > 0

				&& cloneResult.clonedTheme.Files.length == originalTheme.Files.length
				&& cloneResult.clonedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& cloneResult.clonedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& cloneResult.stagedThemes.length == 1

				&& clonedTheme.Id != socialThemeId
				&& clonedTheme.Name == (originalTheme.Name + ' 1')
				&& clonedTheme.TypeId == siteThemeTypeId
				&& clonedTheme.Description == defaultSiteThemeDescription
				&& clonedTheme.State == 'Custom'
				&& clonedTheme.IsFactoryDefault == false
				&& clonedTheme.IsStaged == true

				&& clonedTheme.Files.length > 0
				&& clonedTheme.ScriptFiles.length > 0
				&& clonedTheme.StyleFiles.length > 0

				&& clonedTheme.Files.length == originalTheme.Files.length
				&& clonedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& clonedTheme.StyleFiles.length == originalTheme.StyleFiles.length
			);
		});



		test("Cloning a theme with specific ID creates a custom, staged, theme with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataModel.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId, newId: newId });
			let clonedTheme = await dataModel.getTheme({ id: newId, typeId: siteThemeTypeId });
			await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: newId, typeId: siteThemeTypeId });
			await dataModel.publishTheme({ id: newId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& cloneResult.clonedTheme.Id == newId
				&& cloneResult.clonedTheme.Name == (originalTheme.Name + ' 1')
				&& clonedTheme.Id == newId
				&& clonedTheme.Name == (originalTheme.Name + ' 1')
			);
		});

		test("Publishing a cloned theme publishes", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataModel.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishResult = await dataModel.publishTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let clonedTheme = await dataModel.getTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: clonedTheme.Id, typeId: siteThemeTypeId });
			await dataModel.publishTheme({ id: clonedTheme.Id, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& publishResult.publishedTheme.Id != socialThemeId
				&& publishResult.publishedTheme.Name == (originalTheme.Name + ' 1')
				&& publishResult.publishedTheme.TypeId == siteThemeTypeId
				&& publishResult.publishedTheme.Description == defaultSiteThemeDescription
				&& publishResult.publishedTheme.State == 'Custom'
				&& publishResult.publishedTheme.IsFactoryDefault == false
				&& publishResult.publishedTheme.IsStaged == false

				&& publishResult.publishedTheme.Files.length > 0
				&& publishResult.publishedTheme.ScriptFiles.length > 0
				&& publishResult.publishedTheme.StyleFiles.length > 0

				&& publishResult.publishedTheme.Files.length == originalTheme.Files.length
				&& publishResult.publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& publishResult.publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& publishResult.stagedThemes.length == 0

				&& clonedTheme.Id != socialThemeId
				&& clonedTheme.Name == (originalTheme.Name + ' 1')
				&& clonedTheme.TypeId == siteThemeTypeId
				&& clonedTheme.Description == defaultSiteThemeDescription
				&& clonedTheme.State == 'Custom'
				&& clonedTheme.IsFactoryDefault == false
				&& clonedTheme.IsStaged == false

				&& clonedTheme.Files.length > 0
				&& clonedTheme.ScriptFiles.length > 0
				&& clonedTheme.StyleFiles.length > 0

				&& clonedTheme.Files.length == originalTheme.Files.length
				&& clonedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& clonedTheme.StyleFiles.length == originalTheme.StyleFiles.length
			);
		});

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataModel.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishResult = await dataModel.publishTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let deleteResult = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let deletePublishResult = await dataModel.publishTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let theme = await dataModel.getTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });

			assert(publishResult.publishedTheme !== null
				&& theme == null);
		})

		test("Getting a theme style file gets style file", async assert => {
			let file = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			assert(file.Name == 'handheld.less');
		});

		test("Getting a theme script file gets script file", async assert => {
			let file = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			assert(file.Name == 'theme.js');
		});

		test("Getting an editable theme file gets file", async assert => {
			let file = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File' });
			assert(file.Name == 'mixins.less');
		});

		test("Getting a non-editable theme file gets file", async assert => {
			let file = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			assert(file.Name == testFileName);
		});

		test("Saving a script file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedThemeFile.Content == 'new script'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedThemeFile.Content == 'new file content'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a style file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedThemeFile.Content == 'new content'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a style file multiple times saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content 0' });
			let saveResult1 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content 1' });
			let saveResult2 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content 2' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedThemeFile.Content == 'new content 2'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a script file multiple times saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script 0' });
			let saveResult1 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script 1' });
			let saveResult2 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script 2' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedThemeFile.Content == 'new script 2'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a file multiple times saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content 0' });
			let saveResult1 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content 1' });
			let saveResult2 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content 2' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedThemeFile.Content == 'new file content 2'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Reverting a theme with a saved style file reverts both", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& revertedThemeFile.Content === originalThemeFile.Content

				&& revertedTheme.Id == socialThemeId
				&& revertedTheme.TypeId == siteThemeTypeId
				&& revertedTheme.State == 'FactoryDefault'

				&& revertedTheme.Files.length > 0
				&& revertedTheme.ScriptFiles.length > 0
				&& revertedTheme.StyleFiles.length > 0);
		})


		test("Publishing a theme with saved style file publishes both", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let publishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let publishedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let deletedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& publishedThemeFile.Content == 'new content'

				&& publishedTheme.Id == socialThemeId
				&& publishedTheme.TypeId == siteThemeTypeId
				&& publishedTheme.State == 'CustomizedDefault'
				&& publishedTheme.IsFactoryDefault == false
				&& publishedTheme.IsStaged == false

				&& publishedTheme.Files.length > 0
				&& publishedTheme.ScriptFiles.length > 0
				&& publishedTheme.StyleFiles.length > 0
			);
		});

		test("Deleting a published customization of default theme reverts theme and edited file", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let publishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let publishedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let deletedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& deletedThemeFile.Content === originalThemeFile.Content

				&& deletedTheme.Id == socialThemeId
				&& deletedTheme.TypeId == siteThemeTypeId
				&& deletedTheme.State == 'FactoryDefault'

				&& deletedTheme.Files.length > 0
				&& deletedTheme.ScriptFiles.length > 0
				&& deletedTheme.StyleFiles.length > 0
			);
		});

		test("Getting non-staged version of otherwise staged theme file gets non-staged version", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let nonStagedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', staged: false });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalThemeFile.Content != 'new content'
				&& savedThemeFile.Content == 'new content'
				&& nonStagedThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default theme file gets fac default version", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let facDefaultThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', factoryDefault: true });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalThemeFile.Content != 'new content'
				&& savedThemeFile.Content == 'new content'
				&& facDefaultThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted style file from non-staging restores it and its metadata", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let restoreResult = await dataModel.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let restoredTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.StyleFiles.length == originalTheme.StyleFiles.length
				&& restoreResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') != null
				&& restoreResult.savedThemeFile.MediaQuery == originalThemeFile.MediaQuery
				&& restoreResult.savedThemeFile.Content == originalThemeFile.Content
				&& restoredTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& restoredTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null
				&& restoredThemeFile.MediaQuery == originalThemeFile.MediaQuery
				&& restoredThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted style file from fac default restores it and its metadata", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let publishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let restoreResult = await dataModel.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let restoredTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			let deleteResult2 = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult2 = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.StyleFiles.length == originalTheme.StyleFiles.length
				&& restoreResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') != null
				&& restoreResult.savedThemeFile.MediaQuery == originalThemeFile.MediaQuery
				&& restoreResult.savedThemeFile.Content == originalThemeFile.Content
				&& restoredTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& restoredTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null
				&& restoredThemeFile.MediaQuery == originalThemeFile.MediaQuery
				&& restoredThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted script file from non-staging restores it", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let restoreResult = await dataModel.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let restoredTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.length > 0

				&& originalTheme.ScriptFiles.find(s => s.Name == 'theme.js') !== null

				&& originalThemeFile.Name == 'theme.js'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deleteResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& restoreResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') != null
				&& restoreResult.savedThemeFile.Content == originalThemeFile.Content
				&& restoredTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& restoredTheme.ScriptFiles.find(s => s.Name == 'theme.js') != null
				&& restoredThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted script file from fac default restores it", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let publishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let restoreResult = await dataModel.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let restoredTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			let deleteResult2 = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult2 = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.length > 0

				&& originalTheme.ScriptFiles.find(s => s.Name == 'theme.js') !== null

				&& originalThemeFile.Name == 'theme.js'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deleteResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& restoreResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') != null
				&& restoreResult.savedThemeFile.Content == originalThemeFile.Content
				&& restoredTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& restoredTheme.ScriptFiles.find(s => s.Name == 'theme.js') != null
				&& restoredThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Restoring a deleted file from non-staging restores it", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let restoreResult = await dataModel.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let restoredTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.length > 0

				&& originalTheme.Files.find(s => s.Name == testFileName) !== null

				&& originalThemeFile.Name == testFileName

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.Files.length == originalTheme.Files.length - 1
				&& deleteResult.theme.Files.find(s => s.Name == testFileName) == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.Files.length == originalTheme.Files.length
				&& restoreResult.theme.Files.find(s => s.Name == testFileName) != null
				&& restoredTheme.Files.length == originalTheme.Files.length
				&& restoredTheme.Files.find(s => s.Name == testFileName) != null
			);
		});

		test("Restoring a deleted file from fac default restores it", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let publishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let restoreResult = await dataModel.restoreThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let restoredTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let restoredThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			let deleteResult2 = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult2 = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.length > 0

				&& originalTheme.Files.find(s => s.Name == testFileName) !== null

				&& originalThemeFile.Name == testFileName

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.Files.length == originalTheme.Files.length - 1
				&& deleteResult.theme.Files.find(s => s.Name == testFileName) == null

				&& deletedThemeFile == null

				&& restoreResult.stagedThemes.length == 1
				&& restoreResult.theme.Files.length == originalTheme.Files.length
				&& restoreResult.theme.Files.find(s => s.Name == testFileName) != null
				&& restoredTheme.Files.length == originalTheme.Files.length
				&& restoredTheme.Files.find(s => s.Name == testFileName) != null
			);
		});

		test("Deleting a style file from a default theme sets theme to staged with removed file", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedTheme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deletedTheme.StyleFiles.find(s => s.Name == 'handheld.less') == null
				&& deletedTheme.State == 'CustomizedDefault'
				&& deletedTheme.IsFactoryDefault == false
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null
			);
		});

		test("Deleting a script file from a default theme sets theme to staged with removed file", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deletedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.length > 0

				&& originalTheme.ScriptFiles.find(s => s.Name == 'theme.js') !== null

				&& originalThemeFile.Name == 'theme.js'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deleteResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') == null

				&& deletedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deletedTheme.ScriptFiles.find(s => s.Name == 'theme.js') == null
				&& deletedTheme.State == 'CustomizedDefault'
				&& deletedTheme.IsFactoryDefault == false
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null
			);
		});

		test("Deleting a file from a default theme sets theme to staged with removed file", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deletedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.length > 0

				&& originalTheme.Files.find(s => s.Name == testFileName) !== null

				&& originalThemeFile.Name == testFileName

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.Files.length == originalTheme.Files.length - 1
				&& deleteResult.theme.Files.find(s => s.Name == testFileName) == null

				&& deletedTheme.Files.length == originalTheme.Files.length - 1
				&& deletedTheme.Files.find(s => s.Name == testFileName) == null
				&& deletedTheme.State == 'CustomizedDefault'
				&& deletedTheme.IsFactoryDefault == false
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null
			);
		});

		test("Reverting file deletion from staged theme sets theme back to factory default", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deleteResult = await dataModel.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedTheme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deletedTheme.StyleFiles.find(s => s.Name == 'handheld.less') == null
				&& deletedTheme.State == 'CustomizedDefault'
				&& deletedTheme.IsFactoryDefault == false
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null

				&& revertResult.stagedThemes.length == 0
				&& revertResult.revertedTheme.IsStaged == false
				&& revertResult.revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& revertResult.revertedTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null

				&& revertedTheme.IsStaged == false
				&& revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& revertedTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null

				&& revertedThemeFile !== null
			);
		});

		test("Re-ordering style files re-orders", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = originalTheme.StyleFiles.map(s => s.Name);
			let i = fileNames.indexOf('handheld.less');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			fileNames.unshift('handheld.less');

			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newStyleFiles: fileNames })
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.StyleFiles.length == defaultStyleFilesLength
				&& savedTheme.StyleFiles[0].Name == 'handheld.less'
				&& revertResult.revertedTheme.StyleFiles.length == defaultStyleFilesLength
				&& revertResult.revertedTheme.StyleFiles[0].Name != 'handheld.less'
			);
		});

		test("Re-ordering style files with exclusions deletes", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = originalTheme.StyleFiles.map(s => s.Name);
			let i = fileNames.indexOf('handheld.less');
			if(i > -1) {
				fileNames.splice(i, 1);
			}

			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newStyleFiles: fileNames })
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.StyleFiles.length == defaultStyleFilesLength - 1
				&& revertResult.revertedTheme.StyleFiles.length == defaultStyleFilesLength
			);
		});

		test("Re-ordering script files re-orders", async assert => {
			let scriptSaveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newscript.js', type: 'Script', content: 'script' });
			let currentTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = currentTheme.ScriptFiles.map(s => s.Name);
			let i = fileNames.indexOf('newscript.js');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			fileNames.unshift('newscript.js');

			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newScriptFiles: fileNames })
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.ScriptFiles.length == defaultScriptFilesLength + 1
				&& savedTheme.ScriptFiles[0].Name == 'newscript.js'
				&& revertResult.revertedTheme.ScriptFiles.length == defaultScriptFilesLength
				&& revertResult.revertedTheme.ScriptFiles[0].Name == 'theme.js'
			);
		});

		test("Re-ordering script files with exclusions deletes", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = originalTheme.ScriptFiles.map(s => s.Name);
			let i = fileNames.indexOf('theme.js');
			if(i > -1) {
				fileNames.splice(i, 1);
			}

			let saveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newScriptFiles: fileNames })
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.ScriptFiles.length == defaultScriptFilesLength - 1
				&& revertResult.revertedTheme.ScriptFiles.length == defaultScriptFilesLength
			);
		});

		test("Renaming a style file renames file and retains order", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content', newName: 'handheld2.less' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld2.less', type: 'Style' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			let styleFileIndex;
			for(let i = 0; i < originalTheme.StyleFiles.length; i++) {
				if(originalTheme.StyleFiles[i].Name == 'handheld.less') {
					styleFileIndex = i;
				}
			}

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.filter(s => s.Name == 'handheld2.less').length == 0
				&& originalTheme.StyleFiles.filter(s => s.Name == 'handheld.less').length == 1
				&& originalTheme.StyleFiles[styleFileIndex].Name == 'handheld.less'

				&& originalTheme.StyleFiles.length == savedTheme.StyleFiles.length

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.StyleFiles.filter(s => s.Name == 'handheld2.less').length == 1
				&& savedTheme.StyleFiles.filter(s => s.Name == 'handheld.less').length == 0
				&& savedTheme.StyleFiles[styleFileIndex].Name == 'handheld2.less'

				&& savedThemeFile.Content == 'new content'
				&& savedThemeFile.Name == 'handheld2.less'
			);
		});

		test("Renaming a script file renames file and retains order", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new content', newName: 'theme2.js' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme2.js', type: 'Script' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			let scriptFileIndex;
			for(let i = 0; i < originalTheme.ScriptFiles.length; i++) {
				if(originalTheme.ScriptFiles[i].Name == 'theme.js') {
					scriptFileIndex = i;
				}
			}

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.filter(s => s.Name == 'theme2.js').length == 0
				&& originalTheme.ScriptFiles.filter(s => s.Name == 'theme.js').length == 1
				&& originalTheme.ScriptFiles[scriptFileIndex].Name == 'theme.js'

				&& originalTheme.ScriptFiles.length == savedTheme.ScriptFiles.length

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.ScriptFiles.filter(s => s.Name == 'theme2.js').length == 1
				&& savedTheme.ScriptFiles.filter(s => s.Name == 'theme.js').length == 0
				&& savedTheme.ScriptFiles[scriptFileIndex].Name == 'theme2.js'

				&& savedThemeFile.Content == 'new content'
				&& savedThemeFile.Name == 'theme2.js'

				&& saveResult.isNew == false
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File', newName: 'favicon2.ico' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'favicon2.ico', type: 'File' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.filter(s => s.Name == 'favicon2.ico').length == 0
				&& originalTheme.Files.filter(s => s.Name == testFileName).length == 1

				&& originalTheme.Files.length == savedTheme.Files.length

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.Files.filter(s => s.Name == 'favicon2.ico').length == 1
				&& savedTheme.Files.filter(s => s.Name == testFileName).length == 0

				&& savedThemeFile.Name == 'favicon2.ico'

				&& saveResult.isNew == false
			);
		});

		test("Saving a style file with options saves options", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content', mediaQuery: 'new query' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(savedThemeFile.Content == 'new content'
				&& savedThemeFile.MediaQuery == 'new query'
				&& revertedThemeFile.Content != 'new content'
				&& revertedThemeFile.MediaQuery != 'new query'
				&& saveResult.isNew == false
			);
		});

		test("Creating a new style file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.createThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, type: 'Style' });

			assert(saveResult
				&& saveResult.Id == socialThemeId
				&& saveResult.TypeId == siteThemeTypeId
				&& saveResult.Type == 'Style'
				&& saveResult.Name == 'untitled.less'
				&& saveResult.ThemeName == originalTheme.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.StyleFiles.length == originalTheme.StyleFiles.length
			);
		});

		test("Creating a new script file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.createThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, type: 'Script' });

			assert(saveResult
				&& saveResult.Id == socialThemeId
				&& saveResult.TypeId == siteThemeTypeId
				&& saveResult.Type == 'Script'
				&& saveResult.Name == 'untitled.js'
				&& saveResult.ThemeName == originalTheme.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.ScriptFiles.length == originalTheme.ScriptFiles.length
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.createThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, type: 'File' });

			assert(saveResult
				&& saveResult.Id == socialThemeId
				&& saveResult.TypeId == siteThemeTypeId
				&& saveResult.Type == 'File'
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.ThemeName == originalTheme.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalTheme.Files.length
			);
		});

		test("Saving a renamed style file with options saves options", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content', mediaQuery: 'new query' });
			let saveResult2 = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', newName: 'handheld2.less' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld2.less', type: 'Style' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(savedThemeFile.Content == 'new content'
				&& savedThemeFile.MediaQuery == 'new query'
				&& revertedThemeFile.Content != 'new content'
				&& revertedThemeFile.MediaQuery != 'new query'
			);
		});

		test("Saving a new style file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newstyle.less', type: 'Style', content: 'content', mediaQuery: 'query' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newstyle.less', type: 'Style' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& savedThemeFile.Content == 'content'
				&& savedThemeFile.MediaQuery == 'query'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Saving a new script file saves script file and sets theme into staged state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newscript.js', type: 'Script', content: 'script' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newscript.js', type: 'Script' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& savedThemeFile.Content == 'script'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Saving a new file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataModel.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newfile.less', type: 'File', content: 'content' });
			let savedTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataModel.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newfile.less', type: 'File' });
			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& savedThemeFile.Content == 'content'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'CustomizedDefault'
				&& savedTheme.IsFactoryDefault == false
				&& savedTheme.IsStaged == true
				&& savedTheme.Files.length == originalTheme.Files.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Reverting multiple themes reverts multiple themes", async assert => {
			let originalTheme0 = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalTheme1 = await dataModel.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let originalTheme2 = await dataModel.getTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			let saveResult0 = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataModel.saveTheme({ id: socialThemeId, typeId: groupThemeTypeId, description: 'y' });
			let saveResult2 = await dataModel.saveTheme({ id: socialThemeId, typeId: blogThemeTypeId, description: 'z' });

			let revertResult = await dataModel.revertThemes({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, themes: [
				{ id: socialThemeId, typeId: siteThemeTypeId },
				{ id: socialThemeId, typeId: groupThemeTypeId },
				{ id: socialThemeId, typeId: blogThemeTypeId },
			]});

			let revertedTheme0 = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme1 = await dataModel.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let revertedTheme2 = await dataModel.getTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			assert(originalTheme0.Description == defaultSiteThemeDescription
				&& originalTheme0.State == 'FactoryDefault'
				&& originalTheme0.IsFactoryDefault == true
				&& originalTheme0.IsStaged == false

				&& originalTheme1.Description == defaultGroupThemeDescription
				&& originalTheme1.State == 'FactoryDefault'
				&& originalTheme1.IsFactoryDefault == true
				&& originalTheme1.IsStaged == false

				&& originalTheme2.Description == defaultBlogThemeDescription
				&& originalTheme2.State == 'FactoryDefault'
				&& originalTheme2.IsFactoryDefault == true
				&& originalTheme2.IsStaged == false

				&& saveResult0.savedTheme.Description == 'x'
				&& saveResult0.savedTheme.State == 'CustomizedDefault'
				&& saveResult0.savedTheme.IsFactoryDefault == false
				&& saveResult0.savedTheme.IsStaged == true

				&& saveResult1.savedTheme.Description == 'y'
				&& saveResult1.savedTheme.State == 'CustomizedDefault'
				&& saveResult1.savedTheme.IsFactoryDefault == false
				&& saveResult1.savedTheme.IsStaged == true

				&& saveResult2.savedTheme.Description == 'z'
				&& saveResult2.savedTheme.State == 'CustomizedDefault'
				&& saveResult2.savedTheme.IsFactoryDefault == false
				&& saveResult2.savedTheme.IsStaged == true

				&& revertResult.stagedThemes.length == 0

				&& revertedTheme0.Description == defaultSiteThemeDescription
				&& revertedTheme0.State == 'FactoryDefault'
				&& revertedTheme0.IsFactoryDefault == true
				&& revertedTheme0.IsStaged == false

				&& revertedTheme1.Description == defaultGroupThemeDescription
				&& revertedTheme1.State == 'FactoryDefault'
				&& revertedTheme1.IsFactoryDefault == true
				&& revertedTheme1.IsStaged == false

				&& revertedTheme2.Description == defaultBlogThemeDescription
				&& revertedTheme2.State == 'FactoryDefault'
				&& revertedTheme2.IsFactoryDefault == true
				&& revertedTheme2.IsStaged == false
				);
		});

		test("Publishing multiple themes publishes multiple themes", async assert => {
			let originalTheme0 = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalTheme1 = await dataModel.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let originalTheme2 = await dataModel.getTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			let saveResult0 = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataModel.saveTheme({ id: socialThemeId, typeId: groupThemeTypeId, description: 'y' });
			let saveResult2 = await dataModel.saveTheme({ id: socialThemeId, typeId: blogThemeTypeId, description: 'z' });

			let publishResult = await dataModel.publishThemes({ themes: [
				{ id: socialThemeId, typeId: siteThemeTypeId },
				{ id: socialThemeId, typeId: groupThemeTypeId },
				{ id: socialThemeId, typeId: blogThemeTypeId },
			]});

			let publishedTheme0 = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedTheme1 = await dataModel.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let publishedTheme2 = await dataModel.getTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: groupThemeTypeId });
			await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: blogThemeTypeId });
			await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataModel.publishTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			await dataModel.publishTheme({ id: socialThemeId, typeId: blogThemeTypeId });

			assert(originalTheme0.Description == defaultSiteThemeDescription
				&& originalTheme0.State == 'FactoryDefault'
				&& originalTheme0.IsFactoryDefault == true
				&& originalTheme0.IsStaged == false

				&& originalTheme1.Description == defaultGroupThemeDescription
				&& originalTheme1.State == 'FactoryDefault'
				&& originalTheme1.IsFactoryDefault == true
				&& originalTheme1.IsStaged == false

				&& originalTheme2.Description == defaultBlogThemeDescription
				&& originalTheme2.State == 'FactoryDefault'
				&& originalTheme2.IsFactoryDefault == true
				&& originalTheme2.IsStaged == false

				&& publishResult.stagedThemes.length == 0

				&& publishedTheme0.Description == 'x'
				&& publishedTheme0.State == 'CustomizedDefault'
				&& publishedTheme0.IsFactoryDefault == false
				&& publishedTheme0.IsStaged == false

				&& publishedTheme1.Description == 'y'
				&& publishedTheme1.State == 'CustomizedDefault'
				&& publishedTheme1.IsFactoryDefault == false
				&& publishedTheme1.IsStaged == false

				&& publishedTheme2.Description == 'z'
				&& publishedTheme2.State == 'CustomizedDefault'
				&& publishedTheme2.IsFactoryDefault == false
				&& publishedTheme2.IsStaged == false
				);
		});

		test("Deleting multiple themes at different states deletes and/or reverts multiple themes", async assert => {
			// 3 types of states: staged customized default, published customized default, published custom
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let siteThemeSaveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let groupThemeSaveResult = await dataModel.saveTheme({ id: socialThemeId, typeId: groupThemeTypeId, description: 'y' });
			let groupThemePublishResult = await dataModel.publishTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let blogThemeCloneResult = await dataModel.cloneTheme({ id: socialThemeId, typeId: blogThemeTypeId, newId: newId });
			let blogThemeClonePublishResult = await dataModel.publishTheme({ id: newId, typeId: blogThemeTypeId });

			let stagedSiteTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedGroupTheme = await dataModel.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let clonedBlogTheme = await dataModel.getTheme({ id: newId, typeId: blogThemeTypeId });

			let deleteResult = await dataModel.deleteThemes({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, themes: [
				{ id: socialThemeId, typeId: siteThemeTypeId },
				{ id: socialThemeId, typeId: groupThemeTypeId },
				{ id: newId, typeId: blogThemeTypeId },
			]});
			let deletePublishResult = await dataModel.publishThemes({ themes: [
				{ id: socialThemeId, typeId: siteThemeTypeId },
				{ id: socialThemeId, typeId: groupThemeTypeId },
				{ id: newId, typeId: blogThemeTypeId },
			]});

			let deletedSiteTheme = await dataModel.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedGroupTheme = await dataModel.getTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let deletedBlogTheme = await dataModel.getTheme({ id: newId, typeId: blogThemeTypeId });

			assert(stagedSiteTheme.Description == 'x'
				&& stagedSiteTheme.State == 'CustomizedDefault'
				&& stagedSiteTheme.IsFactoryDefault == false
				&& stagedSiteTheme.IsStaged == true

				&& publishedGroupTheme.Description == 'y'
				&& publishedGroupTheme.State == 'CustomizedDefault'
				&& publishedGroupTheme.IsFactoryDefault == false
				&& publishedGroupTheme.IsStaged == false

				&& clonedBlogTheme.State == 'Custom'
				&& clonedBlogTheme.IsFactoryDefault == false
				&& clonedBlogTheme.IsStaged == false

				&& deleteResult.stagedThemes.length == 2
				&& deleteResult.revertedThemes.length == 1
				&& deleteResult.stagedThemes[0].Id == socialThemeId
				&& deleteResult.stagedThemes[0].TypeId == groupThemeTypeId
				&& deleteResult.stagedThemes[0].IsDeleted == false
				&& deleteResult.stagedThemes[0].IsReverted == true
				&& deleteResult.stagedThemes[1].Id == newId
				&& deleteResult.stagedThemes[1].TypeId == blogThemeTypeId
				&& deleteResult.stagedThemes[1].IsDeleted == true
				&& deleteResult.stagedThemes[1].IsReverted == true
				&& deleteResult.revertedThemes[0].Id == socialThemeId
				&& deleteResult.revertedThemes[0].TypeId == siteThemeTypeId

				&& deletePublishResult.deletedThemes.length == 1
				&& deletePublishResult.revertedThemes.length == 1
				&& deletePublishResult.deletedThemes[0].Id == newId
				&& deletePublishResult.deletedThemes[0].TypeId == blogThemeTypeId
				&& deletePublishResult.revertedThemes[0].Id == socialThemeId
				&& deletePublishResult.revertedThemes[0].TypeId == groupThemeTypeId

				&& deletedSiteTheme.Description == defaultSiteThemeDescription
				&& deletedSiteTheme.State == 'FactoryDefault'
				&& deletedSiteTheme.IsFactoryDefault == true
				&& deletedSiteTheme.IsStaged == false

				&& deletedGroupTheme.Description == defaultGroupThemeDescription
				&& deletedGroupTheme.State == 'FactoryDefault'
				&& deletedGroupTheme.IsFactoryDefault == true
				&& deletedGroupTheme.IsStaged == false

				&& deletedBlogTheme == null
			);
		});
	}

	function runDataModelEventTests(dataProvider) {

		test.heading('Data Model Event Tests');

		let testMessageNameSpace = '_test_message_name_space';

		// build model
		let saveQueue = new StudioSaveQueue({
			interval: 50,
			onTaskAdd: id => {},
			onTaskBegin: id => {},
			onTaskDone: id => {},
			onTaskFail: id => {},
			onEmpty: () => {},
			coalesce: true
		});

		let dataModel = new DataModel({
			queue: saveQueue,
			provider: dataProvider
		});

		// resets customized default and new custom themes, returns promise
		function testWithReset(name, fn) {
			if(!fn) {
				test(name);
			} else {
				test(name, async assert=> {
					// clear test subscriptions
					messaging.unsubscribe(testMessageNameSpace);

					// reset test targets
					await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
					await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
					await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: testNewId, typeId: siteThemeTypeId });
					await dataProvider.publishTheme({ id: testNewId, typeId: siteThemeTypeId });

					// run test
					await fn(assert);
				});
			}
		}

		testWithReset("Cloning a theme should raise theme.created", async assert => {
			let subData1;
			messaging.subscribe('mt.model.theme.created', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneTheme({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				newId: testNewId
			});

			assert(
				subData1
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.model.Id == testNewId
				&& subData1.model.State == 'Custom'
			);
		});

		testWithReset("Saving an update to a theme should raise theme.updated", async assert => {
			let subData1;
			messaging.subscribe('mt.model.theme.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveTheme({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				description: 'new description'
			});

			assert(
				subData1 !== null
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.model.Description == 'new description'
			);
		});

		testWithReset("Deleting a custom/cloned theme should raise theme.deleted", async assert => {
			let subData1;
			messaging.subscribe('mt.model.theme.deleted', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneTheme({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				newId: testNewId,
				description: 'new description'
			});

			let deleteResult = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true,
				id: testNewId,
				typeId: siteThemeTypeId,
			});
			let deletePublishResult = await dataModel.publishTheme({
				id: testNewId,
				typeId: siteThemeTypeId,
			});

			assert(subData1
				&& subData1.id.id == testNewId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.model === null
			);
		});

		testWithReset("Deleting a customized default theme should revert to fac and raise theme.updated instead of delete", async assert => {
			let subData1;
			messaging.subscribe('mt.model.theme.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveTheme({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				description: 'new-desc'
			});

			let deleteResult = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true,
				id: socialThemeId,
				typeId: siteThemeTypeId
			})
			let deletePublishResult = await dataModel.publishTheme({
				id: socialThemeId,
				typeId: siteThemeTypeId
			});

			assert(
				subData1 !== null
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.model !== null
				&& subData1.model.Description === defaultSiteThemeDescription
			);
		});

		testWithReset("Publishing a theme should raise theme.updated", async assert => {
			let subData1;
			messaging.subscribe('mt.model.theme.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveTheme({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				description: 'new-desc'
			});

			let publishResult = await dataModel.publishTheme({
				id: socialThemeId,
				typeId: siteThemeTypeId
			})

			assert(
				subData1 !== null
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.model.Description == 'new-desc'
				&& subData1.model.IsStaged === false
				&& subData1.model.State === 'CustomizedDefault'
			);
		});

		testWithReset("Reverting a custom theme should raise theme.deleted", async assert => {
			let subData1;
			messaging.subscribe('mt.model.theme.deleted', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneTheme({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				newId: testNewId,
				description: 'new description'
			});

			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true,
				id: testNewId,
				typeId: siteThemeTypeId,
			});

			assert(
				subData1
				&& subData1.id.id == testNewId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.model === null
			);
		});

		testWithReset("Reverting a staged customized default theme should raise theme.updated with default model", async assert => {
			let subData1;
			messaging.subscribe('mt.model.theme.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveTheme({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				description: 'new-desc'
			});

			let revertResult = await dataModel.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true,
				id: socialThemeId,
				typeId: siteThemeTypeId,
			});

			assert(
				subData1
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.model !== null
				&& subData1.model.Id == socialThemeId
				&& subData1.model.Description == defaultSiteThemeDescription
			)
		});

		testWithReset("Saving a theme file should raise theme.updated", async assert => {
			let subData1;
			messaging.subscribe('mt.model.theme.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveThemeFile({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				type: 'File',
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.model !== null
				&& subData1.model.Files.filter(f => f.Name == 'attachment1.vm').length == 1
			);
		});

		testWithReset("Deleting a theme file should raise theme.updated", async assert => {
			let subData1;
			messaging.subscribe('mt.model.theme.updated', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteThemeFile({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				type: 'File',
				name: testFileName,
			});

			assert(
				subData1
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.model !== null
				&& subData1.model.Files.filter(f => f.Name == testFileName).length == 0
			)
		});

		testWithReset("Saving a new theme file should raise file.created", async assert => {
			let subData1;
			messaging.subscribe('mt.model.file.created', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveThemeFile({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				type: 'File',
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.id.name == 'attachment1.vm'
				&& subData1.id.type == 'File'
				&& subData1.model !== null
				&& subData1.model.Id == socialThemeId
				&& subData1.model.TypeId == siteThemeTypeId
				&& subData1.model.Name == 'attachment1.vm'
				&& subData1.model.Content == 'attachment1 content'
			);
		});

		testWithReset("Saving an updated theme file should raise file.updated", async assert => {
			let subData1;
			messaging.subscribe('mt.model.file.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveThemeFile({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				type: 'Style',
				name: 'handheld.less',
				content: 'handheld style'
			});

			assert(
				subData1
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.id.name == 'handheld.less'
				&& subData1.id.type == 'Style'
				&& subData1.model !== null
				&& subData1.model.Id == socialThemeId
				&& subData1.model.TypeId == siteThemeTypeId
				&& subData1.model.Name == 'handheld.less'
				&& subData1.model.Content == 'handheld style'
			);
		});

		testWithReset("Saving a renamed theme file should raise file.updated with original name in id, new name in model", async assert => {
			let subData1;
			messaging.subscribe('mt.model.file.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveThemeFile({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				type: 'Style',
				name: 'handheld.less',
				newName: 'handheld2.less',
				content: 'handheld style'
			});

			assert(
				subData1
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.id.name == 'handheld.less'
				&& subData1.id.type == 'Style'
				&& subData1.model !== null
				&& subData1.model.Id == socialThemeId
				&& subData1.model.TypeId == siteThemeTypeId
				&& subData1.model.Name == 'handheld2.less'
				&& subData1.model.Content == 'handheld style'
			);
		});

		testWithReset("Deleting a theme file should raise file.deleted with no model", async assert => {
			let subData1;
			messaging.subscribe('mt.model.file.deleted', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteThemeFile({
				id: socialThemeId,
				typeId: siteThemeTypeId,
				type: 'Style',
				name: 'handheld.less',
			});

			assert(
				subData1
				&& subData1.id.id == socialThemeId
				&& subData1.id.typeId == siteThemeTypeId
				&& subData1.id.name == 'handheld.less'
				&& subData1.id.type == 'Style'
				&& subData1.model === null
			);
		});

		testWithReset("Delete multiple should raise combination of updated and deleted depending on type of delete", async assert => {
			let log = [];

			let saveResult0 = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataModel.saveTheme({ id: socialThemeId, typeId: groupThemeTypeId, description: 'y' });
			let cloneResult = await dataModel.cloneTheme({ id: socialThemeId, typeId: blogThemeTypeId, newId: testNewId });

			messaging.subscribe('mt.model.themes.changed', testMessageNameSpace, data => log.push({ name: 'changed', data: data }));
			messaging.subscribe('mt.model.theme.updated', testMessageNameSpace, data => log.push({ name: 'updated', data: data }));
			messaging.subscribe('mt.model.theme.deleted', testMessageNameSpace, data => log.push({ name: 'deleted', data: data }));

			let deleteResult = await dataModel.deleteThemes({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, themes: [
				{ id: socialThemeId, typeId: siteThemeTypeId },
				{ id: socialThemeId, typeId: groupThemeTypeId },
				{ id: testNewId, typeId: blogThemeTypeId },
			]});
			let deletePublishResult = await dataModel.publishThemes({ themes: [
				{ id: socialThemeId, typeId: siteThemeTypeId },
				{ id: socialThemeId, typeId: groupThemeTypeId },
				{ id: testNewId, typeId: blogThemeTypeId },
			]});

			assert(log
				&& log.length == 5
				&& log[0].name == 'changed'
				&& log[1].name == 'updated'
				&& log[1].data.id.id == socialThemeId
				&& log[1].data.id.typeId == siteThemeTypeId
				&& log[2].name == 'updated'
				&& log[2].data.id.id == socialThemeId
				&& log[2].data.id.typeId == groupThemeTypeId
				&& log[3].name == 'deleted'
				&& log[3].data.id.id == testNewId
				&& log[3].data.id.typeId == blogThemeTypeId
				&& log[4].name == 'changed'
			);
		});

		testWithReset("Publish multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('mt.model.themes.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataModel.saveTheme({ id: socialThemeId, typeId: groupThemeTypeId, description: 'y' });
			let saveResult2 = await dataModel.saveTheme({ id: socialThemeId, typeId: blogThemeTypeId, description: 'z' });

			let publishResult = await dataModel.publishThemes({ themes: [
				{ id: socialThemeId, typeId: siteThemeTypeId },
				{ id: socialThemeId, typeId: groupThemeTypeId },
				{ id: socialThemeId, typeId: blogThemeTypeId },
			]});

			let deleteResult0 = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let deletePublishResult0 = await dataModel.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deleteResult1 = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: groupThemeTypeId });
			let deletePublishResult1 = await dataModel.publishTheme({ id: socialThemeId, typeId: groupThemeTypeId });
			let deleteResult2 = await dataModel.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: blogThemeTypeId });
			let deletePublishResult2 = await dataModel.publishTheme({  id: socialThemeId, typeId: blogThemeTypeId });


			assert(log && log.length == 1);
		});

		testWithReset("Revert multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('mt.model.themes.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataModel.saveTheme({ id: socialThemeId, typeId: groupThemeTypeId, description: 'y' });
			let saveResult2 = await dataModel.saveTheme({ id: socialThemeId, typeId: blogThemeTypeId, description: 'z' });

			let publishResult = await dataModel.revertThemes({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, themes: [
				{ id: socialThemeId, typeId: siteThemeTypeId },
				{ id: socialThemeId, typeId: groupThemeTypeId },
				{ id: socialThemeId, typeId: blogThemeTypeId },
			]});

			assert(log && log.length == 1);
		});

		testWithReset("Reset Test Data", assert => assert(true));
	}

	function runDevModeDataProviderTests(dataProvider) {
		test.heading('Dev Mode Data Provider Tests');

		let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';

		test("Listing themes should list all themes", async assert => {
			let themes = (await dataProvider.listThemes()).themes;
			assert(themes.length === themeLength);
		});

		test("Listing themes by type should only return type", async assert => {
			let themes = (await dataProvider.listThemes({ typeid: groupThemeTypeId })).themes;
			assert(themes.length === 1 && themes[0].TypeId == groupThemeTypeId);
		});

		test("Listing themes by staged: true should only return staged themes", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ staged: true })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == 1
				&& themes[0].Description == 'x'
				&& themes[0].State == 'FactoryDefault'
				&& themes[0].IsFactoryDefault == true
				&& themes[0].IsStaged == true);
		});

		test("Listing themes by staged: false should return non-staged themes as well as the published version of currently-staged themes", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ staged: false })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == themeLength
				&& themes[1].Description == defaultBlogThemeDescription
				&& themes[1].State == 'FactoryDefault'
				&& themes[1].IsFactoryDefault == true
				&& themes[1].IsStaged == false

				&& themes[3].Description == defaultSiteThemeDescription
				&& themes[3].State == 'FactoryDefault'
				&& themes[3].IsFactoryDefault == true
				&& themes[3].IsStaged == false
				)
		});

		test("Listing themes by state: 'FactoryDefault' should only return themes which are currently in a Factory Default State", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ state: 'FactoryDefault' })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == themeLength
				&& themes[0].State == 'FactoryDefault');
		});

		test("Listing themes by state: 'CustomizedDefault' should return only themes which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ state: 'CustomizedDefault' })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == 0);
		});

		test("Listing themes by state: 'Custom' should only return themes which are currently in a Custom State", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let themes = (await dataProvider.listThemes({ state: 'Custom' })).themes;
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(themes.length == 0);
		});

		test("Getting a theme returns theme", async assert => {
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(theme.Id == socialThemeId && theme.TypeId == siteThemeTypeId);
		});

		test("Getting a theme returns latest version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.State == 'FactoryDefault'
				&& theme.IsFactoryDefault == true
				&& theme.IsStaged == true);
		});

		test("Getting a theme with staged: false should return non-staged version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, staged: false });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == defaultSiteThemeDescription
				&& theme.State == 'FactoryDefault'
				&& theme.IsFactoryDefault == true
				&& theme.IsStaged == false);
		});


		test("Getting a theme with staged: true should return staged version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, staged: true });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == 'x'
				&& theme.State == 'FactoryDefault'
				&& theme.IsFactoryDefault == true
				&& theme.IsStaged == true);
		});

		test("Getting a theme with factoryDefault: true should return factory default version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, factoryDefault: true });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == defaultSiteThemeDescription
				&& theme.State == 'FactoryDefault'
				&& theme.IsFactoryDefault == true
				&& theme.IsStaged == false);
		});

		test("Getting a theme with factoryDefault: false should return non-factory default version of theme", async assert => {
			await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' })
			let theme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId, factoryDefault: false });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(theme.Id == socialThemeId
				&& theme.TypeId == siteThemeTypeId
				&& theme.Description == 'x'
				&& theme.State == 'FactoryDefault'
				&& theme.IsFactoryDefault == true
				&& theme.IsStaged == true);
		});

		test("Saving a default theme saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.Description == 'x'
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length);
		});

		test("Saving a default theme multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let saveResult1 = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'y' });
			let saveResult2 = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'z' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.Description == 'z'
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length);
		});

		test("Saving a default theme saves and returns saved theme and list of staged", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId })
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedTheme.Id == socialThemeId
				&& saveResult.savedTheme.TypeId == siteThemeTypeId
				&& saveResult.savedTheme.Description == 'x'
				&& saveResult.savedTheme.State == 'FactoryDefault'
				&& saveResult.savedTheme.IsFactoryDefault == true
				&& saveResult.savedTheme.IsStaged == true

				&& saveResult.savedTheme.Files.length > 0
				&& saveResult.savedTheme.ScriptFiles.length > 0
				&& saveResult.savedTheme.StyleFiles.length > 0

				&& saveResult.savedTheme.Files.length == originalTheme.Files.length
				&& saveResult.savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& saveResult.savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& saveResult.stagedThemes.length == 1

				&& saveResult.stagedThemes[0].Id == socialThemeId
				&& saveResult.stagedThemes[0].TypeId == siteThemeTypeId
				&& saveResult.stagedThemes[0].Description == 'x'
				&& saveResult.stagedThemes[0].State == 'FactoryDefault'
				&& saveResult.stagedThemes[0].IsFactoryDefault == true
				&& saveResult.stagedThemes[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default theme reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.savedTheme.Id == socialThemeId
				&& saveResult.savedTheme.TypeId == siteThemeTypeId
				&& saveResult.savedTheme.Description == 'x'
				&& saveResult.savedTheme.State == 'FactoryDefault'
				&& saveResult.savedTheme.IsFactoryDefault == true
				&& saveResult.savedTheme.IsStaged == true

				&& saveResult.savedTheme.Files.length > 0
				&& saveResult.savedTheme.ScriptFiles.length > 0
				&& saveResult.savedTheme.StyleFiles.length > 0

				&& saveResult.savedTheme.Files.length == originalTheme.Files.length
				&& saveResult.savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& saveResult.savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& revertResult.revertedTheme.Id == socialThemeId
				&& revertResult.revertedTheme.TypeId == siteThemeTypeId
				&& revertResult.revertedTheme.Description == defaultSiteThemeDescription
				&& revertResult.revertedTheme.State == 'FactoryDefault'
				&& revertResult.revertedTheme.IsFactoryDefault == true
				&& revertResult.revertedTheme.IsStaged == false

				&& revertResult.revertedTheme.Files.length > 0
				&& revertResult.revertedTheme.ScriptFiles.length > 0
				&& revertResult.revertedTheme.StyleFiles.length > 0

				&& revertResult.revertedTheme.Files.length == originalTheme.Files.length
				&& revertResult.revertedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& revertResult.revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& revertedTheme.Id == socialThemeId
				&& revertedTheme.TypeId == siteThemeTypeId
				&& revertedTheme.Description == defaultSiteThemeDescription
				&& revertedTheme.State == 'FactoryDefault'
				&& revertedTheme.IsFactoryDefault == true
				&& revertedTheme.IsStaged == false

				&& revertedTheme.Files.length > 0
				&& revertedTheme.ScriptFiles.length > 0
				&& revertedTheme.StyleFiles.length > 0

				&& revertedTheme.Files.length == originalTheme.Files.length
				&& revertedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				);
		});

		test("Deleting a published fac default stages deletion", async assert => {

			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId, newId: newId });
			let publishResult = await dataProvider.publishTheme({ id: newId, typeId: siteThemeTypeId });
			let deleteResult = await dataProvider.deleteTheme({ id: newId, typeId: siteThemeTypeId });
			let stagedDeletedTheme = await dataProvider.getTheme({ id: newId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataProvider.publishTheme({ id: newId, typeId: siteThemeTypeId });

			assert(originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.IsDeleted == false

				&& cloneResult.clonedTheme.Description == defaultSiteThemeDescription
				&& cloneResult.clonedTheme.State == 'FactoryDefault'
				&& cloneResult.clonedTheme.IsFactoryDefault == true
				&& cloneResult.clonedTheme.IsStaged == true
				&& cloneResult.clonedTheme.IsDeleted == false

				&& publishResult.publishedTheme.Description == defaultSiteThemeDescription
				&& publishResult.publishedTheme.State == 'FactoryDefault'
				&& publishResult.publishedTheme.IsFactoryDefault == true
				&& publishResult.publishedTheme.IsStaged == false
				&& publishResult.publishedTheme.IsDeleted == false

				&& deleteResult.theme.Description == defaultSiteThemeDescription
				&& deleteResult.theme.State == 'FactoryDefault'
				&& deleteResult.theme.IsFactoryDefault == true
				&& deleteResult.theme.IsDeleted == true
				&& deleteResult.theme.IsStaged == true

				&& stagedDeletedTheme.Description == defaultSiteThemeDescription
				&& stagedDeletedTheme.State == 'FactoryDefault'
				&& stagedDeletedTheme.IsFactoryDefault == true
				&& stagedDeletedTheme.IsDeleted == true
				&& stagedDeletedTheme.IsStaged == true
				);

		});

		test("Reverting a staged fac default deletion restores fac default", async assert => {

			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId, newId: newId });
			let publishResult = await dataProvider.publishTheme({ id: newId, typeId: siteThemeTypeId });

			let deleteResult = await dataProvider.deleteTheme({ id: newId, typeId: siteThemeTypeId });
			let revertResult = await dataProvider.revertTheme({ id: newId, typeId: siteThemeTypeId });

			let realDeleteResult = await dataProvider.deleteTheme({ id: newId, typeId: siteThemeTypeId });
			let deletePublishResult = await dataProvider.publishTheme({ id: newId, typeId: siteThemeTypeId });

			assert(originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.IsDeleted == false

				&& cloneResult.clonedTheme.Description == defaultSiteThemeDescription
				&& cloneResult.clonedTheme.State == 'FactoryDefault'
				&& cloneResult.clonedTheme.IsFactoryDefault == true
				&& cloneResult.clonedTheme.IsStaged == true
				&& cloneResult.clonedTheme.IsDeleted == false

				&& publishResult.publishedTheme.Description == defaultSiteThemeDescription
				&& publishResult.publishedTheme.State == 'FactoryDefault'
				&& publishResult.publishedTheme.IsFactoryDefault == true
				&& publishResult.publishedTheme.IsStaged == false
				&& publishResult.publishedTheme.IsDeleted == false

				&& deleteResult.theme.Description == defaultSiteThemeDescription
				&& deleteResult.theme.State == 'FactoryDefault'
				&& deleteResult.theme.IsFactoryDefault == true
				&& deleteResult.theme.IsDeleted == true
				&& deleteResult.theme.IsStaged == true

				&& revertResult.revertedTheme.Description == defaultSiteThemeDescription
				&& revertResult.revertedTheme.State == 'FactoryDefault'
				&& revertResult.revertedTheme.IsFactoryDefault == true
				&& revertResult.revertedTheme.IsStaged == false
				&& revertResult.revertedTheme.IsDeleted == false
				);

		});

		test("Publishing a saved change to a default theme saves and sets it into a published, default, state and saves files too", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: 'x' });
			let publishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			let reverseSaveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, description: defaultSiteThemeDescription });
			let reversePublishResult = await dataProvider.publishTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& publishedTheme.Id == socialThemeId
				&& publishedTheme.TypeId == siteThemeTypeId
				&& publishedTheme.Description == 'x'
				&& publishedTheme.State == 'FactoryDefault'
				&& publishedTheme.IsFactoryDefault == true
				&& publishedTheme.IsStaged == false

				&& publishedTheme.Files.length > 0
				&& publishedTheme.ScriptFiles.length > 0
				&& publishedTheme.StyleFiles.length > 0

				&& publishedTheme.Files.length == originalTheme.Files.length
				&& publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length


				&& publishResult.publishedTheme.Id == socialThemeId
				&& publishResult.publishedTheme.TypeId == siteThemeTypeId
				&& publishResult.publishedTheme.Description == 'x'
				&& publishResult.publishedTheme.State == 'FactoryDefault'
				&& publishResult.publishedTheme.IsFactoryDefault == true
				&& publishResult.publishedTheme.IsStaged == false

				&& publishResult.publishedTheme.Files.length > 0
				&& publishResult.publishedTheme.ScriptFiles.length > 0
				&& publishResult.publishedTheme.StyleFiles.length > 0

				&& publishResult.publishedTheme.Files.length == originalTheme.Files.length
				&& publishResult.publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& publishResult.publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& publishResult.stagedThemes.length == 0
				);
		});

		test("Cloning a theme creates a FactoryDefault, staged, theme with random new theme id and incremented name", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let clonedTheme = await dataProvider.getTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: clonedTheme.Id, typeId: siteThemeTypeId });
			await dataProvider.publishTheme({ id: clonedTheme.Id, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& cloneResult.clonedTheme.Id != socialThemeId
				&& cloneResult.clonedTheme.Name == (originalTheme.Name + ' 1')
				&& cloneResult.clonedTheme.TypeId == siteThemeTypeId
				&& cloneResult.clonedTheme.Description == defaultSiteThemeDescription
				&& cloneResult.clonedTheme.State == 'FactoryDefault'
				&& cloneResult.clonedTheme.IsFactoryDefault == true
				&& cloneResult.clonedTheme.IsStaged == true

				&& cloneResult.clonedTheme.Files.length > 0
				&& cloneResult.clonedTheme.ScriptFiles.length > 0
				&& cloneResult.clonedTheme.StyleFiles.length > 0

				&& cloneResult.clonedTheme.Files.length == originalTheme.Files.length
				&& cloneResult.clonedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& cloneResult.clonedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& cloneResult.stagedThemes.length == 1

				&& clonedTheme.Id != socialThemeId
				&& clonedTheme.Name == (originalTheme.Name + ' 1')
				&& clonedTheme.TypeId == siteThemeTypeId
				&& clonedTheme.Description == defaultSiteThemeDescription
				&& clonedTheme.State == 'FactoryDefault'
				&& clonedTheme.IsFactoryDefault == true
				&& clonedTheme.IsStaged == true

				&& clonedTheme.Files.length > 0
				&& clonedTheme.ScriptFiles.length > 0
				&& clonedTheme.StyleFiles.length > 0

				&& clonedTheme.Files.length == originalTheme.Files.length
				&& clonedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& clonedTheme.StyleFiles.length == originalTheme.StyleFiles.length
			);
		});

		test("Cloning a theme with specific ID creates a fac default, staged, theme with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId, newId: newId });
			let clonedTheme = await dataProvider.getTheme({ id: newId, typeId: siteThemeTypeId });
			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: newId, typeId: siteThemeTypeId });
			await dataProvider.publishTheme({ id: newId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& cloneResult.clonedTheme.Id == newId
				&& cloneResult.clonedTheme.Name == (originalTheme.Name + ' 1')
				&& clonedTheme.Id == newId
				&& clonedTheme.Name == (originalTheme.Name + ' 1')
			);
		});

		test("Publishing a cloned theme publishes", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishResult = await dataProvider.publishTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let clonedTheme = await dataProvider.getTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: clonedTheme.Id, typeId: siteThemeTypeId });
			await dataProvider.publishTheme({ id: clonedTheme.Id, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& publishResult.publishedTheme.Id != socialThemeId
				&& publishResult.publishedTheme.Name == (originalTheme.Name + ' 1')
				&& publishResult.publishedTheme.TypeId == siteThemeTypeId
				&& publishResult.publishedTheme.Description == defaultSiteThemeDescription
				&& publishResult.publishedTheme.State == 'FactoryDefault'
				&& publishResult.publishedTheme.IsFactoryDefault == true
				&& publishResult.publishedTheme.IsStaged == false

				&& publishResult.publishedTheme.Files.length > 0
				&& publishResult.publishedTheme.ScriptFiles.length > 0
				&& publishResult.publishedTheme.StyleFiles.length > 0

				&& publishResult.publishedTheme.Files.length == originalTheme.Files.length
				&& publishResult.publishedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& publishResult.publishedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& publishResult.stagedThemes.length == 0

				&& clonedTheme.Id != socialThemeId
				&& clonedTheme.Name == (originalTheme.Name + ' 1')
				&& clonedTheme.TypeId == siteThemeTypeId
				&& clonedTheme.Description == defaultSiteThemeDescription
				&& clonedTheme.State == 'FactoryDefault'
				&& clonedTheme.IsFactoryDefault == true
				&& clonedTheme.IsStaged == false

				&& clonedTheme.Files.length > 0
				&& clonedTheme.ScriptFiles.length > 0
				&& clonedTheme.StyleFiles.length > 0

				&& clonedTheme.Files.length == originalTheme.Files.length
				&& clonedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& clonedTheme.StyleFiles.length == originalTheme.StyleFiles.length
			);
		})

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataProvider.cloneTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let publishResult = await dataProvider.publishTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let deleteResult = await dataProvider.deleteTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let deletePublishResult = await dataProvider.publishTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });
			let theme = await dataProvider.getTheme({ id: cloneResult.clonedTheme.Id, typeId: siteThemeTypeId });

			assert(publishResult.publishedTheme !== null
				&& theme == null);
		})

		test("Getting a theme style file gets style file", async assert => {
			let file = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			assert(file.Name == 'handheld.less');
		});

		test("Getting a theme script file gets script file", async assert => {
			let file = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			assert(file.Name == 'theme.js');
		});

		test("Getting an editable theme file gets file", async assert => {
			let file = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File' });
			assert(file.Name == 'mixins.less');
		});

		test("Getting a non-editable theme file gets file", async assert => {
			let file = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			assert(file.Name == testFileName);
		});

		test("Saving a script file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedThemeFile.Content == 'new script'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedThemeFile.Content == 'new file content'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a style file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult.isNew == false

				&& savedThemeFile.Content == 'new content'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a style file multiple times saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content 0' });
			let saveResult1 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content 1' });
			let saveResult2 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content 2' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedThemeFile.Content == 'new content 2'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a script file multiple times saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script 0' });
			let saveResult1 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script 1' });
			let saveResult2 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new script 2' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedThemeFile.Content == 'new script 2'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Saving a file multiple times saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult0 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content 0' });
			let saveResult1 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content 1' });
			let saveResult2 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File', content: 'new file content 2' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'mixins.less', type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedThemeFile.Content == 'new file content 2'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true

				&& savedTheme.Files.length == originalTheme.Files.length
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length

				&& savedTheme.Files.length > 0
				&& savedTheme.ScriptFiles.length > 0
				&& savedTheme.StyleFiles.length > 0);
		});

		test("Reverting a theme with a saved style file reverts both", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& revertedThemeFile.Content === originalThemeFile.Content

				&& revertedTheme.Id == socialThemeId
				&& revertedTheme.TypeId == siteThemeTypeId
				&& revertedTheme.State == 'FactoryDefault'

				&& revertedTheme.Files.length > 0
				&& revertedTheme.ScriptFiles.length > 0
				&& revertedTheme.StyleFiles.length > 0);
		})

		test("Getting non-staged version of otherwise staged theme file gets non-staged version", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let nonStagedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', staged: false });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalThemeFile.Content != 'new content'
				&& savedThemeFile.Content == 'new content'
				&& nonStagedThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default theme file gets fac default version", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let facDefaultThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', factoryDefault: true });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalThemeFile.Content != 'new content'
				&& savedThemeFile.Content == 'new content'
				&& facDefaultThemeFile.Content == originalThemeFile.Content
			);
		});

		test("Deleting a style file from a default theme sets theme to staged with removed file", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedTheme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deletedTheme.StyleFiles.find(s => s.Name == 'handheld.less') == null
				&& deletedTheme.State == 'FactoryDefault'
				&& deletedTheme.IsFactoryDefault == true
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null
			);
		});

		test("Deleting a script file from a default theme sets theme to staged with removed file", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.length > 0

				&& originalTheme.ScriptFiles.find(s => s.Name == 'theme.js') !== null

				&& originalThemeFile.Name == 'theme.js'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deleteResult.theme.ScriptFiles.find(s => s.Name == 'theme.js') == null

				&& deletedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length - 1
				&& deletedTheme.ScriptFiles.find(s => s.Name == 'theme.js') == null
				&& deletedTheme.State == 'FactoryDefault'
				&& deletedTheme.IsFactoryDefault == true
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null
			);
		});

		test("Deleting a file from a default theme sets theme to staged with removed file", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.length > 0

				&& originalTheme.Files.find(s => s.Name == testFileName) !== null

				&& originalThemeFile.Name == testFileName

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.Files.length == originalTheme.Files.length - 1
				&& deleteResult.theme.Files.find(s => s.Name == testFileName) == null

				&& deletedTheme.Files.length == originalTheme.Files.length - 1
				&& deletedTheme.Files.find(s => s.Name == testFileName) == null
				&& deletedTheme.State == 'FactoryDefault'
				&& deletedTheme.IsFactoryDefault == true
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null
			);
		});

		test("Reverting file deletion from staged theme sets theme back to factory default", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let originalThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deleteResult = await dataProvider.deleteThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let deletedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let deletedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.length > 0

				&& originalTheme.StyleFiles.find(s => s.Name == 'handheld.less') !== null

				&& originalThemeFile.Name == 'handheld.less'

				&& deleteResult.stagedThemes.length == 1
				&& deleteResult.theme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deleteResult.theme.StyleFiles.find(s => s.Name == 'handheld.less') == null

				&& deletedTheme.StyleFiles.length == originalTheme.StyleFiles.length - 1
				&& deletedTheme.StyleFiles.find(s => s.Name == 'handheld.less') == null
				&& deletedTheme.State == 'FactoryDefault'
				&& deletedTheme.IsFactoryDefault == true
				&& deletedTheme.IsStaged == true

				&& deletedThemeFile == null

				&& revertResult.stagedThemes.length == 0
				&& revertResult.revertedTheme.IsStaged == false
				&& revertResult.revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& revertResult.revertedTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null

				&& revertedTheme.IsStaged == false
				&& revertedTheme.StyleFiles.length == originalTheme.StyleFiles.length
				&& revertedTheme.StyleFiles.find(s => s.Name == 'handheld.less') != null

				&& revertedThemeFile !== null
			);
		});

		test("Re-ordering style files re-orders", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = originalTheme.StyleFiles.map(s => s.Name);
			let i = fileNames.indexOf('handheld.less');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			fileNames.unshift('handheld.less');
			let newStyleFiles = fileNames.join('/');

			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newStyleFiles: newStyleFiles })
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.StyleFiles.length == defaultStyleFilesLength
				&& savedTheme.StyleFiles[0].Name == 'handheld.less'
				&& revertResult.revertedTheme.StyleFiles.length == defaultStyleFilesLength
				&& revertResult.revertedTheme.StyleFiles[0].Name != 'handheld.less'
			);
		});

		test("Re-ordering style files with exclusions deletes", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = originalTheme.StyleFiles.map(s => s.Name);
			let i = fileNames.indexOf('handheld.less');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			let newStyleFiles = fileNames.join('/');

			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newStyleFiles: newStyleFiles })
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.StyleFiles.length == defaultStyleFilesLength - 1
				&& revertResult.revertedTheme.StyleFiles.length == defaultStyleFilesLength
			);
		});

		test("Re-ordering script files re-orders", async assert => {
			let scriptSaveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newscript.js', type: 'Script', content: 'script' });
			let currentTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = currentTheme.ScriptFiles.map(s => s.Name);
			let i = fileNames.indexOf('newscript.js');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			fileNames.unshift('newscript.js');
			let newScriptFiles = fileNames.join('/');

			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newScriptFiles: newScriptFiles })
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.ScriptFiles.length == defaultScriptFilesLength + 1
				&& savedTheme.ScriptFiles[0].Name == 'newscript.js'
				&& revertResult.revertedTheme.ScriptFiles.length == defaultScriptFilesLength
				&& revertResult.revertedTheme.ScriptFiles[0].Name == 'theme.js'
			);
		});

		test("Re-ordering script files with exclusions deletes", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });

			// re-order file names and serialize
			let fileNames = originalTheme.ScriptFiles.map(s => s.Name);
			let i = fileNames.indexOf('theme.js');
			if(i > -1) {
				fileNames.splice(i, 1);
			}
			let newScriptFiles = fileNames.join('/');

			let saveResult = await dataProvider.saveTheme({ id: socialThemeId, typeId: siteThemeTypeId, newScriptFiles: newScriptFiles })
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(savedTheme.ScriptFiles.length == defaultScriptFilesLength - 1
				&& revertResult.revertedTheme.ScriptFiles.length == defaultScriptFilesLength
			);
		});

		test("Renaming a style file renames file and retains order", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content', newName: 'handheld2.less' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld2.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			let styleFileIndex;
			for(let i = 0; i < originalTheme.StyleFiles.length; i++) {
				if(originalTheme.StyleFiles[i].Name == 'handheld.less') {
					styleFileIndex = i;
				}
			}

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.StyleFiles.filter(s => s.Name == 'handheld2.less').length == 0
				&& originalTheme.StyleFiles.filter(s => s.Name == 'handheld.less').length == 1
				&& originalTheme.StyleFiles[styleFileIndex].Name == 'handheld.less'

				&& originalTheme.StyleFiles.length == savedTheme.StyleFiles.length

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true
				&& savedTheme.StyleFiles.filter(s => s.Name == 'handheld2.less').length == 1
				&& savedTheme.StyleFiles.filter(s => s.Name == 'handheld.less').length == 0
				&& savedTheme.StyleFiles[styleFileIndex].Name == 'handheld2.less'

				&& savedThemeFile.Content == 'new content'
				&& savedThemeFile.Name == 'handheld2.less'
			);
		});

		test("Renaming a script file renames file and retains order", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme.js', type: 'Script', content: 'new content', newName: 'theme2.js' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'theme2.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			let scriptFileIndex;
			for(let i = 0; i < originalTheme.ScriptFiles.length; i++) {
				if(originalTheme.ScriptFiles[i].Name == 'theme.js') {
					scriptFileIndex = i;
				}
			}

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.ScriptFiles.filter(s => s.Name == 'theme2.js').length == 0
				&& originalTheme.ScriptFiles.filter(s => s.Name == 'theme.js').length == 1
				&& originalTheme.ScriptFiles[scriptFileIndex].Name == 'theme.js'

				&& originalTheme.ScriptFiles.length == savedTheme.ScriptFiles.length

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true
				&& savedTheme.ScriptFiles.filter(s => s.Name == 'theme2.js').length == 1
				&& savedTheme.ScriptFiles.filter(s => s.Name == 'theme.js').length == 0
				&& savedTheme.ScriptFiles[scriptFileIndex].Name == 'theme2.js'

				&& savedThemeFile.Content == 'new content'
				&& savedThemeFile.Name == 'theme2.js'

				&& saveResult.isNew == false
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: testFileName, type: 'File', newName: 'favicon2.ico' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'favicon2.ico', type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false
				&& originalTheme.Files.filter(s => s.Name == 'favicon2.ico').length == 0
				&& originalTheme.Files.filter(s => s.Name == testFileName).length == 1

				&& originalTheme.Files.length == savedTheme.Files.length

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true
				&& savedTheme.Files.filter(s => s.Name == 'favicon2.ico').length == 1
				&& savedTheme.Files.filter(s => s.Name == testFileName).length == 0

				&& savedThemeFile.Name == 'favicon2.ico'

				&& saveResult.isNew == false
			);
		});

		test("Saving a style file with options saves options", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content', mediaQuery: 'new query' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(savedThemeFile.Content == 'new content'
				&& savedThemeFile.MediaQuery == 'new query'
				&& revertedThemeFile.Content != 'new content'
				&& revertedThemeFile.MediaQuery != 'new query'
				&& saveResult.isNew == false
			);
		});

		test("Creating a new style file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.createThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, type: 'Style' });

			assert(saveResult
				&& saveResult.Id == socialThemeId
				&& saveResult.TypeId == siteThemeTypeId
				&& saveResult.Type == 'Style'
				&& saveResult.Name == 'untitled.less'
				&& saveResult.ThemeName == originalTheme.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.StyleFiles.length == originalTheme.StyleFiles.length
			);
		});

		test("Creating a new script file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.createThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, type: 'Script' });

			assert(saveResult
				&& saveResult.Id == socialThemeId
				&& saveResult.TypeId == siteThemeTypeId
				&& saveResult.Type == 'Script'
				&& saveResult.Name == 'untitled.js'
				&& saveResult.ThemeName == originalTheme.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.ScriptFiles.length == originalTheme.ScriptFiles.length
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.createThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, type: 'File' });

			assert(saveResult
				&& saveResult.Id == socialThemeId
				&& saveResult.TypeId == siteThemeTypeId
				&& saveResult.Type == 'File'
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.ThemeName == originalTheme.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalTheme.Files.length
			);
		});

		test("Saving a renamed style file with options saves options", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', content: 'new content', mediaQuery: 'new query' });
			let saveResult2 = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style', newName: 'handheld2.less' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld2.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });
			let revertedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'handheld.less', type: 'Style' });

			assert(savedThemeFile.Content == 'new content'
				&& savedThemeFile.MediaQuery == 'new query'
				&& revertedThemeFile.Content != 'new content'
				&& revertedThemeFile.MediaQuery != 'new query'
			);
		});

		test("Saving a new style file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newstyle.less', type: 'Style', content: 'content', mediaQuery: 'query' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newstyle.less', type: 'Style' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& savedThemeFile.Content == 'content'
				&& savedThemeFile.MediaQuery == 'query'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true
				&& savedTheme.StyleFiles.length == originalTheme.StyleFiles.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Saving a new script file saves script file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newscript.js', type: 'Script', content: 'script' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newscript.js', type: 'Script' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& savedThemeFile.Content == 'script'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true
				&& savedTheme.ScriptFiles.length == originalTheme.ScriptFiles.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Saving a new file saves file and sets theme into staged state", async assert => {
			let originalTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let saveResult = await dataProvider.saveThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newfile.less', type: 'File', content: 'content' });
			let savedTheme = await dataProvider.getTheme({ id: socialThemeId, typeId: siteThemeTypeId });
			let savedThemeFile = await dataProvider.getThemeFile({ id: socialThemeId, typeId: siteThemeTypeId, name: 'newfile.less', type: 'File' });
			let revertResult = await dataProvider.revertTheme({ revertStagedPages: true, revertStagedHeaders: true, revertStagedFooters: true, revertStagedFragments: true, id: socialThemeId, typeId: siteThemeTypeId });

			assert(originalTheme.Id == socialThemeId
				&& originalTheme.TypeId == siteThemeTypeId
				&& originalTheme.Description == defaultSiteThemeDescription
				&& originalTheme.State == 'FactoryDefault'
				&& originalTheme.IsFactoryDefault == true
				&& originalTheme.IsStaged == false

				&& savedThemeFile.Content == 'content'

				&& savedTheme.Id == socialThemeId
				&& savedTheme.TypeId == siteThemeTypeId
				&& savedTheme.State == 'FactoryDefault'
				&& savedTheme.IsFactoryDefault == true
				&& savedTheme.IsStaged == true
				&& savedTheme.Files.length == originalTheme.Files.length + 1

				&& saveResult.isNew == true
			);
		});
	}



	let tests = {
		run(dataProvider, developerModeEnabled) {
			test.sequential = true;
			test.haltOnFail = false;

			if (developerModeEnabled) {
				runDevModeDataProviderTests(dataProvider);
			} else {
				runDataProviderTests(dataProvider);
				runDataQueueTests();
				runDataModelTests(dataProvider);
				runDataModelEventTests(dataProvider);
			}
		}
	};

	return tests;

}, jQuery, window);
