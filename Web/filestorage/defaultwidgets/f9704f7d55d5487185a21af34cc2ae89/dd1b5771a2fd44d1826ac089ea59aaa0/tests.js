define('Tests', ['StudioSaveQueue', 'DataModel'], (StudioSaveQueue, DataModel, $, global, undef) => {

	let messaging = $.telligent.evolution.messaging;

	let automationAId = "06862557-2b16-4fe9-875f-698c06dfb6d8";
	let automationBId = "577a57c8-fe09-474e-85c6-8973275a48f2";
	let automationCId = "9a6feb81-243f-42ea-9ed1-cc81f48cfc5e";
	let hostAId = "b0f0aa66-12ae-4e1b-89df-f85497c822d6";
	let testNewId = "bdd207b5-dfe0-4a5b-8fd4-c48406a921a2";
	let testProviderAId = "fc9fc1a0-e544-4ed3-b9fa-c6eb2e2d5d9d";
	let testProviderBId = "963691fa-c1cd-4d53-8223-b41227585f04";
	let defaultAutomationADescription = "Test Automation A Description";
	let defaultAutomationBDescription = "Test Automation B Description";
	let defaultAutomationCDescription = "Test Automation C Description";
	let testFileName = 'file-a.jsm';
	let defaultHostAAutomationsLength = 1;
	let testProviderAAutomationsLength = 3;
	let testProviderBAutomationsLength = 1;
	let totalAutomationsLength = testProviderAAutomationsLength + testProviderBAutomationsLength;

	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function runDataProviderTests(dataProvider) {
		test.heading('Data Provider Tests');

		test("Listing automations should list all automations", async assert => {
			let automations = (await dataProvider.listAutomations()).automations;
			assert(automations.length === totalAutomationsLength);
		});

		test("Listing automations by host should only return host", async assert => {
			let automations = (await dataProvider.listAutomations({ hostId: hostAId })).automations;
			assert(automations.length === defaultHostAAutomationsLength && automations[0].HostId == hostAId);
		});

		test("Listing automations by staged: true should only return staged automations", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ staged: true })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == 1
				&& automations[0].Description == 'x'
				&& automations[0].State == 'CustomizedDefault'
				&& automations[0].IsFactoryDefault == false
				&& automations[0].IsStaged == true);
		});

		test("Listing automations by staged: false should return non-staged automations as well as the published version of currently-staged automations", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ staged: false })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == totalAutomationsLength

				&& automations[0].Description == defaultAutomationADescription
				&& automations[0].State == 'CustomizedDefault'
				&& automations[0].IsFactoryDefault == true
				&& automations[0].IsStaged == false

				&& automations[1].Description == defaultAutomationBDescription
				&& automations[1].State == 'FactoryDefault'
				&& automations[1].IsFactoryDefault == true
				&& automations[1].IsStaged == false);
		});

		test("Listing automations by state: 'FactoryDefault' should only return automations which are currently in a Factory Default State", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ state: 'FactoryDefault' })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == totalAutomationsLength - 1
				&& automations[0].State == 'FactoryDefault');
		});

		test("Listing automations by state: 'CustomizedDefault' should return only automations which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ state: 'CustomizedDefault' })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == 1
				&& automations[0].State == 'CustomizedDefault');
		});

		test("Listing automations by state: 'Custom' should only return automations which are currently in a Custom State", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ state: 'Custom' })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == 0);
		});

		test("Listing automations by provider should only return automations which match", async assert => {
			let providerAAutomations = (await dataProvider.listAutomations({ factoryDefaultProviderId: testProviderAId })).automations;
			let providerBAutomations = (await dataProvider.listAutomations({ factoryDefaultProviderId: testProviderBId })).automations;
			assert(providerBAutomations.length == testProviderBAutomationsLength
				&& providerAAutomations.length == testProviderAAutomationsLength
				&& providerBAutomations[0].FactoryDefaultProviderId == testProviderBId
				&& providerAAutomations[0].FactoryDefaultProviderId == testProviderAId);
		});

		test("Getting an automation returns automation", async assert => {
			let automation = await dataProvider.getAutomation({ id: automationAId, });
			assert(automation.Id == automationAId);
		});

		test("Getting an automation returns automation with provider", async assert => {
			let automation = await dataProvider.getAutomation({ id: automationAId, });
			assert(automation.Id == automationAId && automation.FactoryDefaultProviderName.length > 0);
		});

		test("Getting an automation returns latest version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId, });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.State == 'CustomizedDefault'
				&& automation.IsFactoryDefault == false
				&& automation.IsStaged == true);
		});


		test("Getting an automation with staged: false should return non-staged version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId, staged: false });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == defaultAutomationADescription
				&& automation.State == 'CustomizedDefault' // to know that this is a cutomized automation but currently viewing fac default version
				&& automation.IsFactoryDefault == true
				&& automation.IsStaged == false);
		});


		test("Getting an automation with staged: true should return staged version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId, staged: true });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == 'x'
				&& automation.State == 'CustomizedDefault' // to know that this is a cutomized automation but currently viewing fac default version
				&& automation.IsFactoryDefault == false
				&& automation.IsStaged == true);
		});

		test("Getting an automation with factoryDefault: true should return factory default version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId, factoryDefault: true });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == defaultAutomationADescription
				&& automation.State == 'CustomizedDefault' // to know that this is a cutomized automation but currently viewing fac default version
				&& automation.IsFactoryDefault == true
				&& automation.IsStaged == false);
		});

		test("Getting an automation with factoryDefault: false should return non-factory default version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId, factoryDefault: false });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == 'x'
				&& automation.State == 'CustomizedDefault' // to know that this is a cutomized automation but currently viewing fac default version
				&& automation.IsFactoryDefault == false
				&& automation.IsStaged == true);
		});

		test("Saving a default automation saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.isNew == false

				&& savedAutomation.Id == automationAId
				&& savedAutomation.Description == 'x'
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length > 0
				&& savedAutomation.Files.length == originalAutomation.Files.length);
		});

		test("Saving a default automation multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult0 = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataProvider.saveAutomation({ id: automationAId, description: 'y' });
			let saveResult2 = await dataProvider.saveAutomation({ id: automationAId, description: 'z' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId  });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedAutomation.Id == automationAId
				&& savedAutomation.Description == 'z'
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length > 0
				&& savedAutomation.Files.length == originalAutomation.Files.length);
		});

		test("Saving a default automation saves and returns saved automation and list of staged", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedAutomation.Id == automationAId
				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'CustomizedDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == false
				&& saveResult.savedAutomation.IsStaged == true

				&& saveResult.savedAutomation.Files.length > 0

				&& saveResult.savedAutomation.Files.length == originalAutomation.Files.length

				&& saveResult.stagedAutomations.length == 1

				&& saveResult.stagedAutomations[0].Id == automationAId
				&& saveResult.stagedAutomations[0].Description == 'x'
				&& saveResult.stagedAutomations[0].State == 'CustomizedDefault'
				&& saveResult.stagedAutomations[0].IsFactoryDefault == false
				&& saveResult.stagedAutomations[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default automation reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataProvider.getAutomation({ id: automationAId });
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.savedAutomation.Id == automationAId
				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'CustomizedDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == false
				&& saveResult.savedAutomation.IsStaged == true

				&& saveResult.savedAutomation.Files.length > 0

				&& saveResult.savedAutomation.Files.length == originalAutomation.Files.length

				&& revertResult.revertedAutomation.Id == automationAId
				&& revertResult.revertedAutomation.Description == defaultAutomationADescription
				&& revertResult.revertedAutomation.State == 'FactoryDefault'
				&& revertResult.revertedAutomation.IsFactoryDefault == true
				&& revertResult.revertedAutomation.IsStaged == false

				&& revertResult.revertedAutomation.Files.length > 0
				&& revertResult.revertedAutomation.Files.length == originalAutomation.Files.length

				&& revertedAutomation.Id == automationAId

				&& revertedAutomation.Description == defaultAutomationADescription
				&& revertedAutomation.State == 'FactoryDefault'
				&& revertedAutomation.IsFactoryDefault == true
				&& revertedAutomation.IsStaged == false

				&& revertedAutomation.Files.length > 0

				&& revertedAutomation.Files.length == originalAutomation.Files.length
				);
		});

		test("Reverting multiple automations reverts multiple automations", async assert => {
			let originalAutomation0 = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomation1 = await dataProvider.getAutomation({ id: automationBId });
			let originalAutomation2 = await dataProvider.getAutomation({ id: automationCId });

			let saveResult0 = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataProvider.saveAutomation({ id: automationBId, description: 'y' });
			let saveResult2 = await dataProvider.saveAutomation({ id: automationCId, description: 'z' });

			let automationIds = `${automationAId},${automationBId},${automationCId}`;
			let revertResult = await dataProvider.revertAutomations({ automationIds: automationIds });

			let revertedAutomation0 = await dataProvider.getAutomation({ id: automationAId });
			let revertedAutomation1 = await dataProvider.getAutomation({ id: automationBId });
			let revertedAutomation2 = await dataProvider.getAutomation({ id: automationCId });

			assert(originalAutomation0.Description == defaultAutomationADescription
				&& originalAutomation0.State == 'FactoryDefault'
				&& originalAutomation0.IsFactoryDefault == true
				&& originalAutomation0.IsStaged == false

				&& originalAutomation1.Description == defaultAutomationBDescription
				&& originalAutomation1.State == 'FactoryDefault'
				&& originalAutomation1.IsFactoryDefault == true
				&& originalAutomation1.IsStaged == false

				&& originalAutomation2.Description == defaultAutomationCDescription
				&& originalAutomation2.State == 'FactoryDefault'
				&& originalAutomation2.IsFactoryDefault == true
				&& originalAutomation2.IsStaged == false

				&& saveResult0.savedAutomation.Description == 'x'
				&& saveResult0.savedAutomation.State == 'CustomizedDefault'
				&& saveResult0.savedAutomation.IsFactoryDefault == false
				&& saveResult0.savedAutomation.IsStaged == true

				&& saveResult1.savedAutomation.Description == 'y'
				&& saveResult1.savedAutomation.State == 'CustomizedDefault'
				&& saveResult1.savedAutomation.IsFactoryDefault == false
				&& saveResult1.savedAutomation.IsStaged == true

				&& saveResult2.savedAutomation.Description == 'z'
				&& saveResult2.savedAutomation.State == 'CustomizedDefault'
				&& saveResult2.savedAutomation.IsFactoryDefault == false
				&& saveResult2.savedAutomation.IsStaged == true

				&& revertResult.stagedAutomations.length == 0

				&& revertedAutomation0.Description == defaultAutomationADescription
				&& revertedAutomation0.State == 'FactoryDefault'
				&& revertedAutomation0.IsFactoryDefault == true
				&& revertedAutomation0.IsStaged == false

				&& revertedAutomation1.Description == defaultAutomationBDescription
				&& revertedAutomation1.State == 'FactoryDefault'
				&& revertedAutomation1.IsFactoryDefault == true
				&& revertedAutomation1.IsStaged == false

				&& revertedAutomation2.Description == defaultAutomationCDescription
				&& revertedAutomation2.State == 'FactoryDefault'
				&& revertedAutomation2.IsFactoryDefault == true
				&& revertedAutomation2.IsStaged == false
				);
		});

		test("Deleting a published customized default stages reversion to factory default", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let publishResult = await dataProvider.publishAutomation({ id: automationAId });
			let deleteResult = await dataProvider.deleteAutomation({ id: automationAId });
			let stagedDeletedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let deletePublishResult = await dataProvider.publishAutomation({ id: automationAId });

			assert(originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'CustomizedDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == false
				&& saveResult.savedAutomation.IsStaged == true

				&& publishResult.publishedAutomation.Description == 'x'
				&& publishResult.publishedAutomation.State == 'CustomizedDefault'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false

				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'FactoryDefault'
				&& deleteResult.automation.IsFactoryDefault == true
				&& deleteResult.automation.IsStaged == true

				&& stagedDeletedAutomation.Description == defaultAutomationADescription
				&& stagedDeletedAutomation.State == 'FactoryDefault'
				&& stagedDeletedAutomation.IsFactoryDefault == true
				&& stagedDeletedAutomation.IsStaged == true
				);
		});

		test("Reverting a staged deletion of customized default restores customized default", async assert => {

			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let publishResult = await dataProvider.publishAutomation({ id: automationAId });
			let deleteResult = await dataProvider.deleteAutomation({ id: automationAId });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			let realDeleteResult = await dataProvider.deleteAutomation({ id: automationAId });
			let deletePublishResult = await dataProvider.publishAutomation({ id: automationAId });

			assert(originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'CustomizedDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == false
				&& saveResult.savedAutomation.IsStaged == true

				&& publishResult.publishedAutomation.Description == 'x'
				&& publishResult.publishedAutomation.State == 'CustomizedDefault'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false

				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'FactoryDefault'
				&& deleteResult.automation.IsFactoryDefault == true
				&& deleteResult.automation.IsStaged == true

				&& revertResult.revertedAutomation.Description == 'x'
				&& revertResult.revertedAutomation.State == 'CustomizedDefault'
				&& revertResult.revertedAutomation.IsFactoryDefault == false
				&& revertResult.revertedAutomation.IsStaged == false
				);
		})

		test("Deleting a published custom stages deletion", async assert => {

			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId, newId: testNewId });
			let publishResult = await dataProvider.publishAutomation({ id: testNewId });
			let deleteResult = await dataProvider.deleteAutomation({ id: testNewId });
			let stagedDeletedAutomation = await dataProvider.getAutomation({ id: testNewId });
			let deletePublishResult = await dataProvider.publishAutomation({ id: testNewId });

			assert(originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.IsDeleted == false

				&& cloneResult.clonedAutomation.Description == defaultAutomationADescription
				&& cloneResult.clonedAutomation.State == 'Custom'
				&& cloneResult.clonedAutomation.IsFactoryDefault == false
				&& cloneResult.clonedAutomation.IsStaged == true
				&& cloneResult.clonedAutomation.IsDeleted == false

				&& publishResult.publishedAutomation.Description == defaultAutomationADescription
				&& publishResult.publishedAutomation.State == 'Custom'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false
				&& publishResult.publishedAutomation.IsDeleted == false

				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'Custom'
				&& deleteResult.automation.IsFactoryDefault == false
				&& deleteResult.automation.IsDeleted == true
				&& deleteResult.automation.IsStaged == true

				&& stagedDeletedAutomation.Description == defaultAutomationADescription
				&& stagedDeletedAutomation.State == 'Custom'
				&& stagedDeletedAutomation.IsFactoryDefault == false
				&& stagedDeletedAutomation.IsDeleted == true
				&& stagedDeletedAutomation.IsStaged == true
				);

		});

		test("Reverting a staged custom deletion restores custom", async assert => {

			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId, newId: testNewId });
			let publishResult = await dataProvider.publishAutomation({ id: testNewId });

			let deleteResult = await dataProvider.deleteAutomation({ id: testNewId });
			let revertResult = await dataProvider.revertAutomation({ id: testNewId });

			let realDeleteResult = await dataProvider.deleteAutomation({ id: testNewId });
			let deletePublishResult = await dataProvider.publishAutomation({ id: testNewId });

			assert(originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.IsDeleted == false

				&& cloneResult.clonedAutomation.Description == defaultAutomationADescription
				&& cloneResult.clonedAutomation.State == 'Custom'
				&& cloneResult.clonedAutomation.IsFactoryDefault == false
				&& cloneResult.clonedAutomation.IsStaged == true
				&& cloneResult.clonedAutomation.IsDeleted == false

				&& publishResult.publishedAutomation.Description == defaultAutomationADescription
				&& publishResult.publishedAutomation.State == 'Custom'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false
				&& publishResult.publishedAutomation.IsDeleted == false

				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'Custom'
				&& deleteResult.automation.IsFactoryDefault == false
				&& deleteResult.automation.IsDeleted == true
				&& deleteResult.automation.IsStaged == true

				&& revertResult.revertedAutomation.Description == defaultAutomationADescription
				&& revertResult.revertedAutomation.State == 'Custom'
				&& revertResult.revertedAutomation.IsFactoryDefault == false
				&& revertResult.revertedAutomation.IsStaged == false
				&& revertResult.revertedAutomation.IsDeleted == false
				);

		});

		test("Publishing a saved change to a default automation saves and sets it into a published, customized default, state and saves files too", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let publishResult = await dataProvider.publishAutomation({ id: automationAId });
			let publishedAutomation = await dataProvider.getAutomation({ id: automationAId });
			await dataProvider.deleteAutomation({ id: automationAId })
			await dataProvider.publishAutomation({ id: automationAId });
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& publishedAutomation.Id == automationAId
				&& publishedAutomation.Description == 'x'
				&& publishedAutomation.State == 'CustomizedDefault'
				&& publishedAutomation.IsFactoryDefault == false
				&& publishedAutomation.IsStaged == false

				&& publishedAutomation.Files.length > 0

				&& publishedAutomation.Files.length == originalAutomation.Files.length

				&& publishResult.publishedAutomation.Id == automationAId
				&& publishResult.publishedAutomation.Description == 'x'
				&& publishResult.publishedAutomation.State == 'CustomizedDefault'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false

				&& publishResult.publishedAutomation.Files.length > 0

				&& publishResult.publishedAutomation.Files.length == originalAutomation.Files.length

				&& publishResult.stagedAutomations.length == 0
				);
		});

		test("Publishing multiple automations publishes multiple automations", async assert => {
			let originalAutomation0 = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomation1 = await dataProvider.getAutomation({ id: automationBId });
			let originalAutomation2 = await dataProvider.getAutomation({ id: automationCId });

			let saveResult0 = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataProvider.saveAutomation({ id: automationBId, description: 'y' });
			let saveResult2 = await dataProvider.saveAutomation({ id: automationCId, description: 'z' });

			let automationIds = `${automationAId}|automation,${automationBId}|automation,${automationCId}|automation`;
			let publishResult = await dataProvider.publishAutomations({ automationIds: automationIds });

			let publishedAutomation0 = await dataProvider.getAutomation({ id: automationAId });
			let publishedAutomation1 = await dataProvider.getAutomation({ id: automationBId });
			let publishedAutomation2 = await dataProvider.getAutomation({ id: automationCId });

			await dataProvider.deleteAutomation({ id: automationAId });
			await dataProvider.deleteAutomation({ id: automationBId });
			await dataProvider.deleteAutomation({ id: automationCId });
			await dataProvider.publishAutomation({ id: automationAId });
			await dataProvider.publishAutomation({ id: automationBId });
			await dataProvider.publishAutomation({ id: automationCId });

			assert(originalAutomation0.Description == defaultAutomationADescription
				&& originalAutomation0.State == 'FactoryDefault'
				&& originalAutomation0.IsFactoryDefault == true
				&& originalAutomation0.IsStaged == false

				&& originalAutomation1.Description == defaultAutomationBDescription
				&& originalAutomation1.State == 'FactoryDefault'
				&& originalAutomation1.IsFactoryDefault == true
				&& originalAutomation1.IsStaged == false

				&& originalAutomation2.Description == defaultAutomationCDescription
				&& originalAutomation2.State == 'FactoryDefault'
				&& originalAutomation2.IsFactoryDefault == true
				&& originalAutomation2.IsStaged == false

				&& publishResult.stagedAutomations.length == 0

				&& publishedAutomation0.Description == 'x'
				&& publishedAutomation0.State == 'CustomizedDefault'
				&& publishedAutomation0.IsFactoryDefault == false
				&& publishedAutomation0.IsStaged == false

				&& publishedAutomation1.Description == 'y'
				&& publishedAutomation1.State == 'CustomizedDefault'
				&& publishedAutomation1.IsFactoryDefault == false
				&& publishedAutomation1.IsStaged == false

				&& publishedAutomation2.Description == 'z'
				&& publishedAutomation2.State == 'CustomizedDefault'
				&& publishedAutomation2.IsFactoryDefault == false
				&& publishedAutomation2.IsStaged == false
				);
		});

		test("Deleting a published, customized default automation reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let publishResult = await dataProvider.publishAutomation({ id: automationAId });
			let deleteResult = await dataProvider.deleteAutomation({ id: automationAId });
			let deletePublishResult = await dataProvider.publishAutomation({ id: automationAId });
			let deletedAutomation = await dataProvider.getAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& deleteResult.automation.Id == automationAId
				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'FactoryDefault'
				&& deleteResult.automation.IsFactoryDefault == true
				&& deleteResult.automation.IsStaged == true
				&& deleteResult.automation.IsReverted == true
				&& deleteResult.automation.IsDeleted == false

				&& deletePublishResult.publishedAutomation.Id == automationAId
				&& deletePublishResult.publishedAutomation.Description == defaultAutomationADescription
				&& deletePublishResult.publishedAutomation.State == 'FactoryDefault'
				&& deletePublishResult.publishedAutomation.IsFactoryDefault == true
				&& deletePublishResult.publishedAutomation.IsStaged == false

				&& deletePublishResult.publishedAutomation.Files.length > 0

				&& deletePublishResult.publishedAutomation.Files.length == originalAutomation.Files.length

				&& deletedAutomation.Id == automationAId
				&& deletedAutomation.Description == defaultAutomationADescription
				&& deletedAutomation.State == 'FactoryDefault'
				&& deletedAutomation.IsFactoryDefault == true
				&& deletedAutomation.IsStaged == false

				&& deletedAutomation.Files.length > 0

				&& deletedAutomation.Files.length == originalAutomation.Files.length
				);
		});

		test("Deleting multiple automations at different states deletes and/or reverts multiple automations", async assert => {
			// 3 types of states: staged customized default, published customized default, published custom
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let automationASaveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let automationBSaveResult = await dataProvider.saveAutomation({ id: automationBId, description: 'y' });
			let automationBPublishResult = await dataProvider.publishAutomation({ id: automationBId });
			let automationCCloneResult = await dataProvider.cloneAutomation({ id: automationCId, newId: newId });
			let automationCClonePublishResult = await dataProvider.publishAutomation({ id: newId });

			let stagedSiteAutomation = await dataProvider.getAutomation({ id: automationAId });
			let publishedGroupAutomation = await dataProvider.getAutomation({ id: automationBId });
			let clonedBlogAutomation = await dataProvider.getAutomation({ id: newId });

			let deleteResult = await dataProvider.deleteAutomations({ automationIds: `${automationAId},${automationBId},${newId}` });
			let deletePublishResult = await dataProvider.publishAutomations({ automationIds: `${automationAId}|automation,${automationBId}|automation,${newId}|automation` });

			let deletedSiteAutomation = await dataProvider.getAutomation({ id: automationAId });
			let deletedGroupAutomation = await dataProvider.getAutomation({ id: automationBId });
			let deletedBlogAutomation = await dataProvider.getAutomation({ id: newId });

			assert(stagedSiteAutomation.Description == 'x'
				&& stagedSiteAutomation.State == 'CustomizedDefault'
				&& stagedSiteAutomation.IsFactoryDefault == false
				&& stagedSiteAutomation.IsStaged == true

				&& publishedGroupAutomation.Description == 'y'
				&& publishedGroupAutomation.State == 'CustomizedDefault'
				&& publishedGroupAutomation.IsFactoryDefault == false
				&& publishedGroupAutomation.IsStaged == false

				&& clonedBlogAutomation.State == 'Custom'
				&& clonedBlogAutomation.IsFactoryDefault == false
				&& clonedBlogAutomation.IsStaged == false

				&& deleteResult.stagedAutomations.length == 2
				&& deleteResult.revertedAutomations.length == 1
				&& deleteResult.stagedAutomations[0].Id == automationBId
				&& deleteResult.stagedAutomations[0].IsDeleted == false
				&& deleteResult.stagedAutomations[0].IsReverted == true
				&& deleteResult.stagedAutomations[1].Id == newId
				&& deleteResult.stagedAutomations[1].IsDeleted == true
				&& deleteResult.stagedAutomations[1].IsReverted == true
				&& deleteResult.revertedAutomations[0].Id == automationAId

				&& deletePublishResult.deletedAutomations.length == 1
				&& deletePublishResult.revertedAutomations.length == 1
				&& deletePublishResult.deletedAutomations[0].Id == newId
				&& deletePublishResult.revertedAutomations[0].Id == automationBId

				&& deletedSiteAutomation.Description == defaultAutomationADescription
				&& deletedSiteAutomation.State == 'FactoryDefault'
				&& deletedSiteAutomation.IsFactoryDefault == true
				&& deletedSiteAutomation.IsStaged == false

				&& deletedGroupAutomation.Description == defaultAutomationBDescription
				&& deletedGroupAutomation.State == 'FactoryDefault'
				&& deletedGroupAutomation.IsFactoryDefault == true
				&& deletedGroupAutomation.IsStaged == false

				&& deletedBlogAutomation == null
			);
		});

		test("Creating a new automation without ID creates non-saved, staged, automation with random ID", async assert => {
			let newAutomation = await dataProvider.createAutomation({});
			let newSavedAutomation = await dataProvider.getAutomation({ id: newAutomation.Id });
			let revertResult = await dataProvider.revertAutomation({ id: newAutomation.Id });

			assert(newAutomation.Id.length > 0
				&& newAutomation.State == 'NotPersisted'
				&& newAutomation.IsStaged == false
				&& newAutomation.HostId == null

				&& newSavedAutomation == null

				&& revertResult.reverted == true
				&& revertResult.revertedAutomation == null
				&& revertResult.stagedAutomations.length == 0
				);
		});

		test("Creating a new automation with ID creates non-saved, staged, automation with specific ID", async assert => {
			let newAutomation = await dataProvider.createAutomation({ id: testNewId, hostId: hostAId });
			let newSavedAutomation = await dataProvider.getAutomation({ id: testNewId });
			let revertResult = await dataProvider.revertAutomation({ id: testNewId });

			assert(newAutomation.Id.length > 0
				&& newAutomation.State == 'NotPersisted'
				&& newAutomation.IsStaged == false
				&& newAutomation.Id == testNewId
				&& newAutomation.HostId == hostAId

				&& newSavedAutomation == null

				&& revertResult.reverted == true
				&& revertResult.revertedAutomation == null
				&& revertResult.stagedAutomations.length == 0
				);
		});

		test("Creating a new automation with provider in non-dev mode creates non-saved, staged, automation without provider", async assert => {
			let newAutomation = await dataProvider.createAutomation({ id: testNewId, hostId: hostAId, factoryDefaultProviderId: testProviderBId });
			let newSavedAutomation = await dataProvider.getAutomation({ id: testNewId });
			let revertResult = await dataProvider.revertAutomation({ id: testNewId });

			assert(newAutomation.Id.length > 0
				&& newAutomation.State == 'NotPersisted'
				&& newAutomation.IsStaged == false
				&& newAutomation.Id == testNewId
				&& newAutomation.HostId == hostAId
				&& newAutomation.FactoryDefaultProviderId === null

				&& newSavedAutomation == null

				&& revertResult.reverted == true
				&& revertResult.revertedAutomation == null
				&& revertResult.stagedAutomations.length == 0
				);
		});

		test("Cloning an automation creates a custom, staged, automation with random new automation id and incremented name", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId });
			let clonedAutomation = await dataProvider.getAutomation({ id: cloneResult.clonedAutomation.Id });
			await dataProvider.deleteAutomation({ id: clonedAutomation.Id });
			await dataProvider.publishAutomation({ id: clonedAutomation.Id });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& cloneResult.clonedAutomation.Id != automationAId
				&& cloneResult.clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& cloneResult.clonedAutomation.Description == defaultAutomationADescription
				&& cloneResult.clonedAutomation.State == 'Custom'
				&& cloneResult.clonedAutomation.IsFactoryDefault == false
				&& cloneResult.clonedAutomation.IsStaged == true

				&& cloneResult.clonedAutomation.Files.length > 0

				&& cloneResult.clonedAutomation.Files.length == originalAutomation.Files.length

				&& cloneResult.stagedAutomations.length == 1

				&& clonedAutomation.Id != automationAId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.Description == defaultAutomationADescription
				&& clonedAutomation.State == 'Custom'
				&& clonedAutomation.IsFactoryDefault == false
				&& clonedAutomation.IsStaged == true

				&& clonedAutomation.Files.length > 0

				&& clonedAutomation.Files.length == originalAutomation.Files.length
			);
		});



		test("Cloning an automation with specific ID creates a custom, staged, automation with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId, newId: newId });
			let clonedAutomation = await dataProvider.getAutomation({ id: newId });
			await dataProvider.deleteAutomation({ id: newId });
			await dataProvider.publishAutomation({ id: newId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& cloneResult.clonedAutomation.Id == newId
				&& cloneResult.clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.Id == newId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
			);
		});

		test("Publishing a cloned automation publishes", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId });
			let publishResult = await dataProvider.publishAutomation({ id: cloneResult.clonedAutomation.Id });
			let clonedAutomation = await dataProvider.getAutomation({ id: cloneResult.clonedAutomation.Id });
			await dataProvider.deleteAutomation({ id: clonedAutomation.Id });
			await dataProvider.publishAutomation({ id: clonedAutomation.Id });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& publishResult.publishedAutomation.Id != automationAId
				&& publishResult.publishedAutomation.Name == (originalAutomation.Name + ' 1')
				&& publishResult.publishedAutomation.Description == defaultAutomationADescription
				&& publishResult.publishedAutomation.State == 'Custom'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false

				&& publishResult.publishedAutomation.Files.length > 0

				&& publishResult.publishedAutomation.Files.length == originalAutomation.Files.length

				&& publishResult.stagedAutomations.length == 0

				&& clonedAutomation.Id != automationAId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.Description == defaultAutomationADescription
				&& clonedAutomation.State == 'Custom'
				&& clonedAutomation.IsFactoryDefault == false
				&& clonedAutomation.IsStaged == false

				&& clonedAutomation.Files.length > 0

				&& clonedAutomation.Files.length == originalAutomation.Files.length
			);
		});

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId });
			let publishResult = await dataProvider.publishAutomation({ id: cloneResult.clonedAutomation.Id });
			let deleteResult = await dataProvider.deleteAutomation({ id: cloneResult.clonedAutomation.Id });
			let deletePublishResult = await dataProvider.publishAutomation({ id: cloneResult.clonedAutomation.Id });
			let automation = await dataProvider.getAutomation({ id: cloneResult.clonedAutomation.Id });

			assert(publishResult.publishedAutomation !== null
				&& automation == null);
		})

		test("Getting an automation file gets file", async assert => {
			let file = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			assert(file.Name == testFileName);
		});

		test("Saving a file saves file and sets automation into staged state", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.isNew == false

				&& savedAutomationFile.Content == 'new file content'

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length == originalAutomation.Files.length

				&& savedAutomation.Files.length > 0);
		});

		test("Saving a file multiple times saves file and sets automation into staged state", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult0 = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content 2' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedAutomationFile.Content == 'new file content 2'

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length == originalAutomation.Files.length

				&& savedAutomation.Files.length > 0);
		});

		test("Reverting an automation with a saved file reverts both", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let revertedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& revertedAutomationFile.Content === originalAutomationFile.Content

				&& revertedAutomation.Id == automationAId
				&& revertedAutomation.State == 'FactoryDefault'

				&& revertedAutomation.Files.length > 0);
		})


		test("Publishing an automation with saved file publishes both", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let publishResult = await dataProvider.publishAutomation({ id: automationAId });

			let publishedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let publishedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult = await dataProvider.deleteAutomation({ id: automationAId });
			let deletePublishResult = await dataProvider.publishAutomation({ id: automationAId });

			let deletedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& publishedAutomationFile.Content == 'new content'

				&& publishedAutomation.Id == automationAId
				&& publishedAutomation.State == 'CustomizedDefault'
				&& publishedAutomation.IsFactoryDefault == false
				&& publishedAutomation.IsStaged == false

				&& publishedAutomation.Files.length > 0
			);
		});

		test("Deleting a published customization of default automation reverts automation and edited file", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let publishResult = await dataProvider.publishAutomation({ id: automationAId });

			let publishedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let publishedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult = await dataProvider.deleteAutomation({ id: automationAId });
			let deletePublishResult = await dataProvider.publishAutomation({ id: automationAId });

			let deletedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& deletedAutomationFile.Content === originalAutomationFile.Content

				&& deletedAutomation.Id == automationAId
				&& deletedAutomation.State == 'FactoryDefault'

				&& deletedAutomation.Files.length > 0
			);
		});

		test("Getting non-staged version of otherwise staged automation file gets non-staged version", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let nonStagedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName, staged: false });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomationFile.Content != 'new content'
				&& savedAutomationFile.Content == 'new content'
				&& nonStagedAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default automation file gets fac default version", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let facDefaultAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName, factoryDefault: true });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomationFile.Content != 'new content'
				&& savedAutomationFile.Content == 'new content'
				&& facDefaultAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Restoring a deleted file from non-staging restores it and its metadata", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult = await dataProvider.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let restoreResult = await dataProvider.restoreAutomationFile({ id: automationAId, name: testFileName });
			let restoredAutomation = await dataProvider.getAutomation({ id: automationAId });
			let restoredAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomationFile == null

				&& restoreResult.stagedAutomations.length == 1
				&& restoreResult.automation.Files.length == originalAutomation.Files.length
				&& restoreResult.automation.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedAutomationFile.Content == originalAutomationFile.Content
				&& restoredAutomation.Files.length == originalAutomation.Files.length
				&& restoredAutomation.Files.find(s => s.Name == testFileName) != null
				&& restoredAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Restoring a deleted file from fac default restores it and its metadata", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult = await dataProvider.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let publishResult = await dataProvider.publishAutomation({ id: automationAId });

			let restoreResult = await dataProvider.restoreAutomationFile({ id: automationAId, name: testFileName });
			let restoredAutomation = await dataProvider.getAutomation({ id: automationAId });
			let restoredAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult2 = await dataProvider.deleteAutomation({ id: automationAId });
			let deletePublishResult2 = await dataProvider.publishAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomationFile == null

				&& restoreResult.stagedAutomations.length == 1
				&& restoreResult.automation.Files.length == originalAutomation.Files.length
				&& restoreResult.automation.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedAutomationFile.Content == originalAutomationFile.Content
				&& restoredAutomation.Files.length == originalAutomation.Files.length
				&& restoredAutomation.Files.find(s => s.Name == testFileName) != null
				&& restoredAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Deleting a file from a default automation sets automation to staged with removed file", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let deleteResult = await dataProvider.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let revertedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomation.Files.length == originalAutomation.Files.length - 1
				&& deletedAutomation.Files.find(s => s.Name == testFileName) == null
				&& deletedAutomation.State == 'CustomizedDefault'
				&& deletedAutomation.IsFactoryDefault == false
				&& deletedAutomation.IsStaged == true

				&& deletedAutomationFile == null
			);
		});

		test("Reverting file deletion from staged automation sets automation back to factory default", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let deleteResult = await dataProvider.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let revertedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomation.Files.length == originalAutomation.Files.length - 1
				&& deletedAutomation.Files.find(s => s.Name == testFileName) == null
				&& deletedAutomation.State == 'CustomizedDefault'
				&& deletedAutomation.IsFactoryDefault == false
				&& deletedAutomation.IsStaged == true

				&& deletedAutomationFile == null

				&& revertResult.stagedAutomations.length == 0
				&& revertResult.revertedAutomation.IsStaged == false
				&& revertResult.revertedAutomation.Files.length == originalAutomation.Files.length
				&& revertResult.revertedAutomation.Files.find(s => s.Name == testFileName) != null

				&& revertedAutomation.IsStaged == false
				&& revertedAutomation.Files.length == originalAutomation.Files.length
				&& revertedAutomation.Files.find(s => s.Name == testFileName) != null

				&& revertedAutomationFile !== null
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, newName: 'newname.jsm' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: 'newname.jsm' });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalAutomation.Files.filter(s => s.Name == testFileName).length == 1

				&& originalAutomation.Files.length == savedAutomation.Files.length

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true
				&& savedAutomation.Files.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedAutomation.Files.filter(s => s.Name == testFileName).length == 0

				&& savedAutomationFile.Name == 'newname.jsm'
				&& originalAutomationFile.Content == savedAutomationFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.createAutomationFile({ id: automationAId });

			assert(saveResult
				&& saveResult.Id == automationAId
				&& saveResult.Name == 'untitled.jsm'
				&& saveResult.AutomationName == originalAutomation.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalAutomation.Files.length
			);
		});

		test("Saving a new file saves file and sets automation into staged state", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: 'newfile.jsm', content: 'content' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: 'newfile.jsm' });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& savedAutomationFile.Content == 'content'

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true
				&& savedAutomation.Files.length == originalAutomation.Files.length + 1

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

		test("Listing automations should list all automations", async assert => {
			let automations = (await dataModel.listAutomations()).automations;
			assert(automations.length === totalAutomationsLength);
		});

		test("Listing automations by host should only return host", async assert => {
			let automations = (await dataModel.listAutomations({ hostId: hostAId })).automations;
			assert(automations.length === defaultHostAAutomationsLength && automations[0].HostId == hostAId);
		});

		test("Listing automations by staged: true should only return staged automations", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataModel.listAutomations({ staged: true })).automations;
			await dataModel.revertAutomation({ id: automationAId })
			assert(automations.length == 1
				&& automations[0].Description == 'x'
				&& automations[0].State == 'CustomizedDefault'
				&& automations[0].IsFactoryDefault == false
				&& automations[0].IsStaged == true);
		});

		test("Listing automations by staged: false should return non-staged automations as well as the published version of currently-staged automations", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataModel.listAutomations({ staged: false })).automations;
			await dataModel.revertAutomation({ id: automationAId })
			assert(automations.length == totalAutomationsLength

				&& automations[0].Description == defaultAutomationADescription
				&& automations[0].State == 'CustomizedDefault'
				&& automations[0].IsFactoryDefault == true
				&& automations[0].IsStaged == false

				&& automations[1].Description == defaultAutomationBDescription
				&& automations[1].State == 'FactoryDefault'
				&& automations[1].IsFactoryDefault == true
				&& automations[1].IsStaged == false);
		});

		test("Listing automations by state: 'FactoryDefault' should only return automations which are currently in a Factory Default State", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataModel.listAutomations({ state: 'FactoryDefault' })).automations;
			await dataModel.revertAutomation({ id: automationAId })
			assert(automations.length == totalAutomationsLength - 1
				&& automations[0].State == 'FactoryDefault');
		});

		test("Listing automations by state: 'CustomizedDefault' should return only automations which are currently in a CustomizedDefault State", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataModel.listAutomations({ state: 'CustomizedDefault' })).automations;
			await dataModel.revertAutomation({ id: automationAId })
			assert(automations.length == 1
				&& automations[0].State == 'CustomizedDefault');
		});

		test("Listing automations by state: 'Custom' should only return automations which are currently in a Custom State", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataModel.listAutomations({ state: 'Custom' })).automations;
			await dataModel.revertAutomation({ id: automationAId })
			assert(automations.length == 0);
		});

		test("Listing automations by provider should only return automations which match", async assert => {
			let providerAAutomations = (await dataModel.listAutomations({ factoryDefaultProviderId: testProviderAId })).automations;
			let providerBAutomations = (await dataModel.listAutomations({ factoryDefaultProviderId: testProviderBId })).automations;
			assert(providerBAutomations.length == testProviderBAutomationsLength
				&& providerAAutomations.length == testProviderAAutomationsLength
				&& providerBAutomations[0].FactoryDefaultProviderId == testProviderBId
				&& providerAAutomations[0].FactoryDefaultProviderId == testProviderAId);
		});

		test("Getting an automation returns automation", async assert => {
			let automation = await dataModel.getAutomation({ id: automationAId, });
			assert(automation.Id == automationAId);
		});

		test("Getting an automation returns automation with provider", async assert => {
			let automation = await dataModel.getAutomation({ id: automationAId, });
			assert(automation.Id == automationAId && automation.FactoryDefaultProviderName.length > 0);
		});

		test("Getting an automation returns latest version of automation", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataModel.getAutomation({ id: automationAId, });
			await dataModel.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.State == 'CustomizedDefault'
				&& automation.IsFactoryDefault == false
				&& automation.IsStaged == true);
		});


		test("Getting an automation with staged: false should return non-staged version of automation", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataModel.getAutomation({ id: automationAId, staged: false });
			await dataModel.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == defaultAutomationADescription
				&& automation.State == 'CustomizedDefault' // to know that this is a cutomized automation but currently viewing fac default version
				&& automation.IsFactoryDefault == true
				&& automation.IsStaged == false);
		});


		test("Getting an automation with staged: true should return staged version of automation", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataModel.getAutomation({ id: automationAId, staged: true });
			await dataModel.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == 'x'
				&& automation.State == 'CustomizedDefault' // to know that this is a cutomized automation but currently viewing fac default version
				&& automation.IsFactoryDefault == false
				&& automation.IsStaged == true);
		});

		test("Getting an automation with factoryDefault: true should return factory default version of automation", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataModel.getAutomation({ id: automationAId, factoryDefault: true });
			await dataModel.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == defaultAutomationADescription
				&& automation.State == 'CustomizedDefault' // to know that this is a cutomized automation but currently viewing fac default version
				&& automation.IsFactoryDefault == true
				&& automation.IsStaged == false);
		});

		test("Getting an automation with factoryDefault: false should return non-factory default version of automation", async assert => {
			await dataModel.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataModel.getAutomation({ id: automationAId, factoryDefault: false });
			await dataModel.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == 'x'
				&& automation.State == 'CustomizedDefault' // to know that this is a cutomized automation but currently viewing fac default version
				&& automation.IsFactoryDefault == false
				&& automation.IsStaged == true);
		});

		test("Saving a default automation saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let savedAutomation = await dataModel.getAutomation({ id: automationAId });
			await dataModel.revertAutomation({ id: automationAId })
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.isNew == false

				&& savedAutomation.Id == automationAId
				&& savedAutomation.Description == 'x'
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length > 0
				&& savedAutomation.Files.length == originalAutomation.Files.length);
		});

		test("Saving a default automation multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult0 = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataModel.saveAutomation({ id: automationAId, description: 'y' });
			let saveResult2 = await dataModel.saveAutomation({ id: automationAId, description: 'z' });
			let savedAutomation = await dataModel.getAutomation({ id: automationAId  });
			await dataModel.revertAutomation({ id: automationAId })
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedAutomation.Id == automationAId
				&& savedAutomation.Description == 'z'
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length > 0
				&& savedAutomation.Files.length == originalAutomation.Files.length);
		});

		test("Saving a default automation saves and returns saved automation and list of staged", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			await dataModel.revertAutomation({ id: automationAId })
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedAutomation.Id == automationAId
				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'CustomizedDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == false
				&& saveResult.savedAutomation.IsStaged == true

				&& saveResult.savedAutomation.Files.length > 0

				&& saveResult.savedAutomation.Files.length == originalAutomation.Files.length

				&& saveResult.stagedAutomations.length == 1

				&& saveResult.stagedAutomations[0].Id == automationAId
				&& saveResult.stagedAutomations[0].Description == 'x'
				&& saveResult.stagedAutomations[0].State == 'CustomizedDefault'
				&& saveResult.stagedAutomations[0].IsFactoryDefault == false
				&& saveResult.stagedAutomations[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default automation reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataModel.getAutomation({ id: automationAId });
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.savedAutomation.Id == automationAId
				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'CustomizedDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == false
				&& saveResult.savedAutomation.IsStaged == true

				&& saveResult.savedAutomation.Files.length > 0

				&& saveResult.savedAutomation.Files.length == originalAutomation.Files.length

				&& revertResult.revertedAutomation.Id == automationAId
				&& revertResult.revertedAutomation.Description == defaultAutomationADescription
				&& revertResult.revertedAutomation.State == 'FactoryDefault'
				&& revertResult.revertedAutomation.IsFactoryDefault == true
				&& revertResult.revertedAutomation.IsStaged == false

				&& revertResult.revertedAutomation.Files.length > 0
				&& revertResult.revertedAutomation.Files.length == originalAutomation.Files.length

				&& revertedAutomation.Id == automationAId

				&& revertedAutomation.Description == defaultAutomationADescription
				&& revertedAutomation.State == 'FactoryDefault'
				&& revertedAutomation.IsFactoryDefault == true
				&& revertedAutomation.IsStaged == false

				&& revertedAutomation.Files.length > 0

				&& revertedAutomation.Files.length == originalAutomation.Files.length
				);
		});

		test("Reverting multiple automations reverts multiple automations", async assert => {
			let originalAutomation0 = await dataModel.getAutomation({ id: automationAId });
			let originalAutomation1 = await dataModel.getAutomation({ id: automationBId });
			let originalAutomation2 = await dataModel.getAutomation({ id: automationCId });

			let saveResult0 = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataModel.saveAutomation({ id: automationBId, description: 'y' });
			let saveResult2 = await dataModel.saveAutomation({ id: automationCId, description: 'z' });

			let revertResult = await dataModel.revertAutomations({ automations: [
				{ id: automationAId },
				{ id: automationBId },
				{ id: automationCId }
			]});

			let revertedAutomation0 = await dataModel.getAutomation({ id: automationAId });
			let revertedAutomation1 = await dataModel.getAutomation({ id: automationBId });
			let revertedAutomation2 = await dataModel.getAutomation({ id: automationCId });

			assert(originalAutomation0.Description == defaultAutomationADescription
				&& originalAutomation0.State == 'FactoryDefault'
				&& originalAutomation0.IsFactoryDefault == true
				&& originalAutomation0.IsStaged == false

				&& originalAutomation1.Description == defaultAutomationBDescription
				&& originalAutomation1.State == 'FactoryDefault'
				&& originalAutomation1.IsFactoryDefault == true
				&& originalAutomation1.IsStaged == false

				&& originalAutomation2.Description == defaultAutomationCDescription
				&& originalAutomation2.State == 'FactoryDefault'
				&& originalAutomation2.IsFactoryDefault == true
				&& originalAutomation2.IsStaged == false

				&& saveResult0.savedAutomation.Description == 'x'
				&& saveResult0.savedAutomation.State == 'CustomizedDefault'
				&& saveResult0.savedAutomation.IsFactoryDefault == false
				&& saveResult0.savedAutomation.IsStaged == true

				&& saveResult1.savedAutomation.Description == 'y'
				&& saveResult1.savedAutomation.State == 'CustomizedDefault'
				&& saveResult1.savedAutomation.IsFactoryDefault == false
				&& saveResult1.savedAutomation.IsStaged == true

				&& saveResult2.savedAutomation.Description == 'z'
				&& saveResult2.savedAutomation.State == 'CustomizedDefault'
				&& saveResult2.savedAutomation.IsFactoryDefault == false
				&& saveResult2.savedAutomation.IsStaged == true

				&& revertResult.stagedAutomations.length == 0

				&& revertedAutomation0.Description == defaultAutomationADescription
				&& revertedAutomation0.State == 'FactoryDefault'
				&& revertedAutomation0.IsFactoryDefault == true
				&& revertedAutomation0.IsStaged == false

				&& revertedAutomation1.Description == defaultAutomationBDescription
				&& revertedAutomation1.State == 'FactoryDefault'
				&& revertedAutomation1.IsFactoryDefault == true
				&& revertedAutomation1.IsStaged == false

				&& revertedAutomation2.Description == defaultAutomationCDescription
				&& revertedAutomation2.State == 'FactoryDefault'
				&& revertedAutomation2.IsFactoryDefault == true
				&& revertedAutomation2.IsStaged == false
				);
		});

		test("Deleting a published customized default stages reversion to factory default", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let publishResult = await dataModel.publishAutomation({ id: automationAId });
			let deleteResult = await dataModel.deleteAutomation({ id: automationAId });
			let stagedDeletedAutomation = await dataModel.getAutomation({ id: automationAId });
			let deletePublishResult = await dataModel.publishAutomation({ id: automationAId });

			assert(originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'CustomizedDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == false
				&& saveResult.savedAutomation.IsStaged == true

				&& publishResult.publishedAutomation.Description == 'x'
				&& publishResult.publishedAutomation.State == 'CustomizedDefault'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false

				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'FactoryDefault'
				&& deleteResult.automation.IsFactoryDefault == true
				&& deleteResult.automation.IsStaged == true

				&& stagedDeletedAutomation.Description == defaultAutomationADescription
				&& stagedDeletedAutomation.State == 'FactoryDefault'
				&& stagedDeletedAutomation.IsFactoryDefault == true
				&& stagedDeletedAutomation.IsStaged == true
				);
		});

		test("Reverting a staged deletion of customized default restores customized default", async assert => {

			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let publishResult = await dataModel.publishAutomation({ id: automationAId });
			let deleteResult = await dataModel.deleteAutomation({ id: automationAId });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });

			let realDeleteResult = await dataModel.deleteAutomation({ id: automationAId });
			let deletePublishResult = await dataModel.publishAutomation({ id: automationAId });

			assert(originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'CustomizedDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == false
				&& saveResult.savedAutomation.IsStaged == true

				&& publishResult.publishedAutomation.Description == 'x'
				&& publishResult.publishedAutomation.State == 'CustomizedDefault'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false

				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'FactoryDefault'
				&& deleteResult.automation.IsFactoryDefault == true
				&& deleteResult.automation.IsStaged == true

				&& revertResult.revertedAutomation.Description == 'x'
				&& revertResult.revertedAutomation.State == 'CustomizedDefault'
				&& revertResult.revertedAutomation.IsFactoryDefault == false
				&& revertResult.revertedAutomation.IsStaged == false
				);
		})

		test("Deleting a published custom stages deletion", async assert => {

			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let cloneResult = await dataModel.cloneAutomation({ id: automationAId, newId: testNewId });
			let publishResult = await dataModel.publishAutomation({ id: testNewId });
			let deleteResult = await dataModel.deleteAutomation({ id: testNewId });
			let stagedDeletedAutomation = await dataModel.getAutomation({ id: testNewId });
			let deletePublishResult = await dataModel.publishAutomation({ id: testNewId });

			assert(originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.IsDeleted == false

				&& cloneResult.clonedAutomation.Description == defaultAutomationADescription
				&& cloneResult.clonedAutomation.State == 'Custom'
				&& cloneResult.clonedAutomation.IsFactoryDefault == false
				&& cloneResult.clonedAutomation.IsStaged == true
				&& cloneResult.clonedAutomation.IsDeleted == false

				&& publishResult.publishedAutomation.Description == defaultAutomationADescription
				&& publishResult.publishedAutomation.State == 'Custom'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false
				&& publishResult.publishedAutomation.IsDeleted == false

				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'Custom'
				&& deleteResult.automation.IsFactoryDefault == false
				&& deleteResult.automation.IsDeleted == true
				&& deleteResult.automation.IsStaged == true

				&& stagedDeletedAutomation.Description == defaultAutomationADescription
				&& stagedDeletedAutomation.State == 'Custom'
				&& stagedDeletedAutomation.IsFactoryDefault == false
				&& stagedDeletedAutomation.IsDeleted == true
				&& stagedDeletedAutomation.IsStaged == true
				);

		});

		test("Reverting a staged custom deletion restores custom", async assert => {

			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let cloneResult = await dataModel.cloneAutomation({ id: automationAId, newId: testNewId });
			let publishResult = await dataModel.publishAutomation({ id: testNewId });

			let deleteResult = await dataModel.deleteAutomation({ id: testNewId });
			let revertResult = await dataModel.revertAutomation({ id: testNewId });

			let realDeleteResult = await dataModel.deleteAutomation({ id: testNewId });
			let deletePublishResult = await dataModel.publishAutomation({ id: testNewId });

			assert(originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.IsDeleted == false

				&& cloneResult.clonedAutomation.Description == defaultAutomationADescription
				&& cloneResult.clonedAutomation.State == 'Custom'
				&& cloneResult.clonedAutomation.IsFactoryDefault == false
				&& cloneResult.clonedAutomation.IsStaged == true
				&& cloneResult.clonedAutomation.IsDeleted == false

				&& publishResult.publishedAutomation.Description == defaultAutomationADescription
				&& publishResult.publishedAutomation.State == 'Custom'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false
				&& publishResult.publishedAutomation.IsDeleted == false

				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'Custom'
				&& deleteResult.automation.IsFactoryDefault == false
				&& deleteResult.automation.IsDeleted == true
				&& deleteResult.automation.IsStaged == true

				&& revertResult.revertedAutomation.Description == defaultAutomationADescription
				&& revertResult.revertedAutomation.State == 'Custom'
				&& revertResult.revertedAutomation.IsFactoryDefault == false
				&& revertResult.revertedAutomation.IsStaged == false
				&& revertResult.revertedAutomation.IsDeleted == false
				);

		});

		test("Publishing a saved change to a default automation saves and sets it into a published, customized default, state and saves files too", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let publishResult = await dataModel.publishAutomation({ id: automationAId });
			let publishedAutomation = await dataModel.getAutomation({ id: automationAId });
			await dataModel.deleteAutomation({ id: automationAId })
			await dataModel.publishAutomation({ id: automationAId });
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& publishedAutomation.Id == automationAId
				&& publishedAutomation.Description == 'x'
				&& publishedAutomation.State == 'CustomizedDefault'
				&& publishedAutomation.IsFactoryDefault == false
				&& publishedAutomation.IsStaged == false

				&& publishedAutomation.Files.length > 0

				&& publishedAutomation.Files.length == originalAutomation.Files.length

				&& publishResult.publishedAutomation.Id == automationAId
				&& publishResult.publishedAutomation.Description == 'x'
				&& publishResult.publishedAutomation.State == 'CustomizedDefault'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false

				&& publishResult.publishedAutomation.Files.length > 0

				&& publishResult.publishedAutomation.Files.length == originalAutomation.Files.length

				&& publishResult.stagedAutomations.length == 0
				);
		});

		test("Publishing multiple automations publishes multiple automations", async assert => {
			let originalAutomation0 = await dataModel.getAutomation({ id: automationAId });
			let originalAutomation1 = await dataModel.getAutomation({ id: automationBId });
			let originalAutomation2 = await dataModel.getAutomation({ id: automationCId });

			let saveResult0 = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataModel.saveAutomation({ id: automationBId, description: 'y' });
			let saveResult2 = await dataModel.saveAutomation({ id: automationCId, description: 'z' });

			let publishResult = await dataModel.publishAutomations({ automations: [
				{ id: automationAId },
				{ id: automationBId },
				{ id: automationCId }
			]});

			let publishedAutomation0 = await dataModel.getAutomation({ id: automationAId });
			let publishedAutomation1 = await dataModel.getAutomation({ id: automationBId });
			let publishedAutomation2 = await dataModel.getAutomation({ id: automationCId });

			await dataModel.deleteAutomation({ id: automationAId });
			await dataModel.deleteAutomation({ id: automationBId });
			await dataModel.deleteAutomation({ id: automationCId });
			await dataModel.publishAutomation({ id: automationAId });
			await dataModel.publishAutomation({ id: automationBId });
			await dataModel.publishAutomation({ id: automationCId });

			assert(originalAutomation0.Description == defaultAutomationADescription
				&& originalAutomation0.State == 'FactoryDefault'
				&& originalAutomation0.IsFactoryDefault == true
				&& originalAutomation0.IsStaged == false

				&& originalAutomation1.Description == defaultAutomationBDescription
				&& originalAutomation1.State == 'FactoryDefault'
				&& originalAutomation1.IsFactoryDefault == true
				&& originalAutomation1.IsStaged == false

				&& originalAutomation2.Description == defaultAutomationCDescription
				&& originalAutomation2.State == 'FactoryDefault'
				&& originalAutomation2.IsFactoryDefault == true
				&& originalAutomation2.IsStaged == false

				&& publishResult.stagedAutomations.length == 0

				&& publishedAutomation0.Description == 'x'
				&& publishedAutomation0.State == 'CustomizedDefault'
				&& publishedAutomation0.IsFactoryDefault == false
				&& publishedAutomation0.IsStaged == false

				&& publishedAutomation1.Description == 'y'
				&& publishedAutomation1.State == 'CustomizedDefault'
				&& publishedAutomation1.IsFactoryDefault == false
				&& publishedAutomation1.IsStaged == false

				&& publishedAutomation2.Description == 'z'
				&& publishedAutomation2.State == 'CustomizedDefault'
				&& publishedAutomation2.IsFactoryDefault == false
				&& publishedAutomation2.IsStaged == false
				);
		});

		test("Deleting a published, customized default automation reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let publishResult = await dataModel.publishAutomation({ id: automationAId });
			let deleteResult = await dataModel.deleteAutomation({ id: automationAId });
			let deletePublishResult = await dataModel.publishAutomation({ id: automationAId });
			let deletedAutomation = await dataModel.getAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& deleteResult.automation.Id == automationAId
				&& deleteResult.automation.Description == defaultAutomationADescription
				&& deleteResult.automation.State == 'FactoryDefault'
				&& deleteResult.automation.IsFactoryDefault == true
				&& deleteResult.automation.IsStaged == true
				&& deleteResult.automation.IsReverted == true
				&& deleteResult.automation.IsDeleted == false

				&& deletePublishResult.publishedAutomation.Id == automationAId
				&& deletePublishResult.publishedAutomation.Description == defaultAutomationADescription
				&& deletePublishResult.publishedAutomation.State == 'FactoryDefault'
				&& deletePublishResult.publishedAutomation.IsFactoryDefault == true
				&& deletePublishResult.publishedAutomation.IsStaged == false

				&& deletePublishResult.publishedAutomation.Files.length > 0

				&& deletePublishResult.publishedAutomation.Files.length == originalAutomation.Files.length

				&& deletedAutomation.Id == automationAId
				&& deletedAutomation.Description == defaultAutomationADescription
				&& deletedAutomation.State == 'FactoryDefault'
				&& deletedAutomation.IsFactoryDefault == true
				&& deletedAutomation.IsStaged == false

				&& deletedAutomation.Files.length > 0

				&& deletedAutomation.Files.length == originalAutomation.Files.length
				);
		});

		test("Deleting multiple automations at different states deletes and/or reverts multiple automations", async assert => {
			// 3 types of states: staged customized default, published customized default, published custom
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let automationASaveResult = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let automationBSaveResult = await dataModel.saveAutomation({ id: automationBId, description: 'y' });
			let automationBPublishResult = await dataModel.publishAutomation({ id: automationBId });
			let automationCCloneResult = await dataModel.cloneAutomation({ id: automationCId, newId: newId });
			let automationCClonePublishResult = await dataModel.publishAutomation({ id: newId });

			let stagedSiteAutomation = await dataModel.getAutomation({ id: automationAId });
			let publishedGroupAutomation = await dataModel.getAutomation({ id: automationBId });
			let clonedBlogAutomation = await dataModel.getAutomation({ id: newId });

			let deleteResult = await dataModel.deleteAutomations({ automations: [
				{ id: automationAId },
				{ id: automationBId },
				{ id: newId }
			]});
			let deletePublishResult = await dataModel.publishAutomations({ automations: [
				{ id: automationAId },
				{ id: automationBId },
				{ id: newId }
			]});

			let deletedSiteAutomation = await dataModel.getAutomation({ id: automationAId });
			let deletedGroupAutomation = await dataModel.getAutomation({ id: automationBId });
			let deletedBlogAutomation = await dataModel.getAutomation({ id: newId });

			assert(stagedSiteAutomation.Description == 'x'
				&& stagedSiteAutomation.State == 'CustomizedDefault'
				&& stagedSiteAutomation.IsFactoryDefault == false
				&& stagedSiteAutomation.IsStaged == true

				&& publishedGroupAutomation.Description == 'y'
				&& publishedGroupAutomation.State == 'CustomizedDefault'
				&& publishedGroupAutomation.IsFactoryDefault == false
				&& publishedGroupAutomation.IsStaged == false

				&& clonedBlogAutomation.State == 'Custom'
				&& clonedBlogAutomation.IsFactoryDefault == false
				&& clonedBlogAutomation.IsStaged == false

				&& deleteResult.stagedAutomations.length == 2
				&& deleteResult.revertedAutomations.length == 1
				&& deleteResult.stagedAutomations[0].Id == automationBId
				&& deleteResult.stagedAutomations[0].IsDeleted == false
				&& deleteResult.stagedAutomations[0].IsReverted == true
				&& deleteResult.stagedAutomations[1].Id == newId
				&& deleteResult.stagedAutomations[1].IsDeleted == true
				&& deleteResult.stagedAutomations[1].IsReverted == true
				&& deleteResult.revertedAutomations[0].Id == automationAId

				&& deletePublishResult.deletedAutomations.length == 1
				&& deletePublishResult.revertedAutomations.length == 1
				&& deletePublishResult.deletedAutomations[0].Id == newId
				&& deletePublishResult.revertedAutomations[0].Id == automationBId

				&& deletedSiteAutomation.Description == defaultAutomationADescription
				&& deletedSiteAutomation.State == 'FactoryDefault'
				&& deletedSiteAutomation.IsFactoryDefault == true
				&& deletedSiteAutomation.IsStaged == false

				&& deletedGroupAutomation.Description == defaultAutomationBDescription
				&& deletedGroupAutomation.State == 'FactoryDefault'
				&& deletedGroupAutomation.IsFactoryDefault == true
				&& deletedGroupAutomation.IsStaged == false

				&& deletedBlogAutomation == null
			);
		});

		test("Creating a new automation without ID creates non-saved, staged, automation with random ID", async assert => {
			let newAutomation = await dataModel.createAutomation({});
			let newSavedAutomation = await dataModel.getAutomation({ id: newAutomation.Id });
			let revertResult = await dataModel.revertAutomation({ id: newAutomation.Id });

			assert(newAutomation.Id.length > 0
				&& newAutomation.State == 'NotPersisted'
				&& newAutomation.IsStaged == false
				&& newAutomation.HostId == null

				&& newSavedAutomation == null

				&& revertResult.reverted == true
				&& revertResult.revertedAutomation == null
				&& revertResult.stagedAutomations.length == 0
				);
		});

		test("Creating a new automation with ID creates non-saved, staged, automation with specific ID", async assert => {
			let newAutomation = await dataModel.createAutomation({ id: testNewId, hostId: hostAId });
			let newSavedAutomation = await dataModel.getAutomation({ id: testNewId });
			let revertResult = await dataModel.revertAutomation({ id: testNewId });

			assert(newAutomation.Id.length > 0
				&& newAutomation.State == 'NotPersisted'
				&& newAutomation.IsStaged == false
				&& newAutomation.Id == testNewId
				&& newAutomation.HostId == hostAId

				&& newSavedAutomation == null

				&& revertResult.reverted == true
				&& revertResult.revertedAutomation == null
				&& revertResult.stagedAutomations.length == 0
				);
		});

		test("Creating a new automation with provider in non-dev mode creates non-saved, staged, automation without provider", async assert => {
			let newAutomation = await dataModel.createAutomation({ id: testNewId, hostId: hostAId, factoryDefaultProviderId: testProviderBId });
			let newSavedAutomation = await dataModel.getAutomation({ id: testNewId });
			let revertResult = await dataModel.revertAutomation({ id: testNewId });

			assert(newAutomation.Id.length > 0
				&& newAutomation.State == 'NotPersisted'
				&& newAutomation.IsStaged == false
				&& newAutomation.Id == testNewId
				&& newAutomation.HostId == hostAId
				&& newAutomation.FactoryDefaultProviderId === null

				&& newSavedAutomation == null

				&& revertResult.reverted == true
				&& revertResult.revertedAutomation == null
				&& revertResult.stagedAutomations.length == 0
				);
		});


		test("Cloning an automation creates a custom, staged, automation with random new automation id and incremented name", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let cloneResult = await dataModel.cloneAutomation({ id: automationAId });
			let clonedAutomation = await dataModel.getAutomation({ id: cloneResult.clonedAutomation.Id });
			await dataModel.deleteAutomation({ id: clonedAutomation.Id });
			await dataModel.publishAutomation({ id: clonedAutomation.Id });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& cloneResult.clonedAutomation.Id != automationAId
				&& cloneResult.clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& cloneResult.clonedAutomation.Description == defaultAutomationADescription
				&& cloneResult.clonedAutomation.State == 'Custom'
				&& cloneResult.clonedAutomation.IsFactoryDefault == false
				&& cloneResult.clonedAutomation.IsStaged == true

				&& cloneResult.clonedAutomation.Files.length > 0

				&& cloneResult.clonedAutomation.Files.length == originalAutomation.Files.length

				&& cloneResult.stagedAutomations.length == 1

				&& clonedAutomation.Id != automationAId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.Description == defaultAutomationADescription
				&& clonedAutomation.State == 'Custom'
				&& clonedAutomation.IsFactoryDefault == false
				&& clonedAutomation.IsStaged == true

				&& clonedAutomation.Files.length > 0

				&& clonedAutomation.Files.length == originalAutomation.Files.length
			);
		});



		test("Cloning an automation with specific ID creates a custom, staged, automation with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let cloneResult = await dataModel.cloneAutomation({ id: automationAId, newId: newId });
			let clonedAutomation = await dataModel.getAutomation({ id: newId });
			await dataModel.deleteAutomation({ id: newId });
			await dataModel.publishAutomation({ id: newId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& cloneResult.clonedAutomation.Id == newId
				&& cloneResult.clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.Id == newId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
			);
		});

		test("Publishing a cloned automation publishes", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let cloneResult = await dataModel.cloneAutomation({ id: automationAId });
			let publishResult = await dataModel.publishAutomation({ id: cloneResult.clonedAutomation.Id });
			let clonedAutomation = await dataModel.getAutomation({ id: cloneResult.clonedAutomation.Id });
			await dataModel.deleteAutomation({ id: clonedAutomation.Id });
			await dataModel.publishAutomation({ id: clonedAutomation.Id });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& publishResult.publishedAutomation.Id != automationAId
				&& publishResult.publishedAutomation.Name == (originalAutomation.Name + ' 1')
				&& publishResult.publishedAutomation.Description == defaultAutomationADescription
				&& publishResult.publishedAutomation.State == 'Custom'
				&& publishResult.publishedAutomation.IsFactoryDefault == false
				&& publishResult.publishedAutomation.IsStaged == false

				&& publishResult.publishedAutomation.Files.length > 0

				&& publishResult.publishedAutomation.Files.length == originalAutomation.Files.length

				&& publishResult.stagedAutomations.length == 0

				&& clonedAutomation.Id != automationAId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.Description == defaultAutomationADescription
				&& clonedAutomation.State == 'Custom'
				&& clonedAutomation.IsFactoryDefault == false
				&& clonedAutomation.IsStaged == false

				&& clonedAutomation.Files.length > 0

				&& clonedAutomation.Files.length == originalAutomation.Files.length
			);
		});

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataModel.cloneAutomation({ id: automationAId });
			let publishResult = await dataModel.publishAutomation({ id: cloneResult.clonedAutomation.Id });
			let deleteResult = await dataModel.deleteAutomation({ id: cloneResult.clonedAutomation.Id });
			let deletePublishResult = await dataModel.publishAutomation({ id: cloneResult.clonedAutomation.Id });
			let automation = await dataModel.getAutomation({ id: cloneResult.clonedAutomation.Id });

			assert(publishResult.publishedAutomation !== null
				&& automation == null);
		})

		test("Getting an automation file gets file", async assert => {
			let file = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			assert(file.Name == testFileName);
		});

		test("Saving a file saves file and sets automation into staged state", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content' });
			let savedAutomation = await dataModel.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.isNew == false

				&& savedAutomationFile.Content == 'new file content'

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length == originalAutomation.Files.length

				&& savedAutomation.Files.length > 0);
		});

		test("Saving a file multiple times saves file and sets automation into staged state", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult0 = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content 2' });
			let savedAutomation = await dataModel.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedAutomationFile.Content == 'new file content 2'

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length == originalAutomation.Files.length

				&& savedAutomation.Files.length > 0);
		});

		test("Reverting an automation with a saved file reverts both", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataModel.getAutomation({ id: automationAId });
			let revertedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& revertedAutomationFile.Content === originalAutomationFile.Content

				&& revertedAutomation.Id == automationAId
				&& revertedAutomation.State == 'FactoryDefault'

				&& revertedAutomation.Files.length > 0);
		})


		test("Publishing an automation with saved file publishes both", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let saveResult = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let publishResult = await dataModel.publishAutomation({ id: automationAId });

			let publishedAutomation = await dataModel.getAutomation({ id: automationAId });
			let publishedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult = await dataModel.deleteAutomation({ id: automationAId });
			let deletePublishResult = await dataModel.publishAutomation({ id: automationAId });

			let deletedAutomation = await dataModel.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& publishedAutomationFile.Content == 'new content'

				&& publishedAutomation.Id == automationAId
				&& publishedAutomation.State == 'CustomizedDefault'
				&& publishedAutomation.IsFactoryDefault == false
				&& publishedAutomation.IsStaged == false

				&& publishedAutomation.Files.length > 0
			);
		});

		test("Deleting a published customization of default automation reverts automation and edited file", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let saveResult = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let publishResult = await dataModel.publishAutomation({ id: automationAId });

			let publishedAutomation = await dataModel.getAutomation({ id: automationAId });
			let publishedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult = await dataModel.deleteAutomation({ id: automationAId });
			let deletePublishResult = await dataModel.publishAutomation({ id: automationAId });

			let deletedAutomation = await dataModel.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& deletedAutomationFile.Content === originalAutomationFile.Content

				&& deletedAutomation.Id == automationAId
				&& deletedAutomation.State == 'FactoryDefault'

				&& deletedAutomation.Files.length > 0
			);
		});

		test("Getting non-staged version of otherwise staged automation file gets non-staged version", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let savedAutomation = await dataModel.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let nonStagedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName, staged: false });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });

			assert(originalAutomationFile.Content != 'new content'
				&& savedAutomationFile.Content == 'new content'
				&& nonStagedAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default automation file gets fac default version", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let savedAutomation = await dataModel.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let facDefaultAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName, factoryDefault: true });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });

			assert(originalAutomationFile.Content != 'new content'
				&& savedAutomationFile.Content == 'new content'
				&& facDefaultAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Restoring a deleted file from non-staging restores it and its metadata", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult = await dataModel.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let restoreResult = await dataModel.restoreAutomationFile({ id: automationAId, name: testFileName });
			let restoredAutomation = await dataModel.getAutomation({ id: automationAId });
			let restoredAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let revertResult = await dataModel.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomationFile == null

				&& restoreResult.stagedAutomations.length == 1
				&& restoreResult.automation.Files.length == originalAutomation.Files.length
				&& restoreResult.automation.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedAutomationFile.Content == originalAutomationFile.Content
				&& restoredAutomation.Files.length == originalAutomation.Files.length
				&& restoredAutomation.Files.find(s => s.Name == testFileName) != null
				&& restoredAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Restoring a deleted file from fac default restores it and its metadata", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult = await dataModel.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let publishResult = await dataModel.publishAutomation({ id: automationAId });

			let restoreResult = await dataModel.restoreAutomationFile({ id: automationAId, name: testFileName });
			let restoredAutomation = await dataModel.getAutomation({ id: automationAId });
			let restoredAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult2 = await dataModel.deleteAutomation({ id: automationAId });
			let deletePublishResult2 = await dataModel.publishAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomationFile == null

				&& restoreResult.stagedAutomations.length == 1
				&& restoreResult.automation.Files.length == originalAutomation.Files.length
				&& restoreResult.automation.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedAutomationFile.Content == originalAutomationFile.Content
				&& restoredAutomation.Files.length == originalAutomation.Files.length
				&& restoredAutomation.Files.find(s => s.Name == testFileName) != null
				&& restoredAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Deleting a file from a default automation sets automation to staged with removed file", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let deleteResult = await dataModel.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomation = await dataModel.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataModel.getAutomation({ id: automationAId });
			let revertedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomation.Files.length == originalAutomation.Files.length - 1
				&& deletedAutomation.Files.find(s => s.Name == testFileName) == null
				&& deletedAutomation.State == 'CustomizedDefault'
				&& deletedAutomation.IsFactoryDefault == false
				&& deletedAutomation.IsStaged == true

				&& deletedAutomationFile == null
			);
		});

		test("Reverting file deletion from staged automation sets automation back to factory default", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let deleteResult = await dataModel.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomation = await dataModel.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataModel.getAutomation({ id: automationAId });
			let revertedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomation.Files.length == originalAutomation.Files.length - 1
				&& deletedAutomation.Files.find(s => s.Name == testFileName) == null
				&& deletedAutomation.State == 'CustomizedDefault'
				&& deletedAutomation.IsFactoryDefault == false
				&& deletedAutomation.IsStaged == true

				&& deletedAutomationFile == null

				&& revertResult.stagedAutomations.length == 0
				&& revertResult.revertedAutomation.IsStaged == false
				&& revertResult.revertedAutomation.Files.length == originalAutomation.Files.length
				&& revertResult.revertedAutomation.Files.find(s => s.Name == testFileName) != null

				&& revertedAutomation.IsStaged == false
				&& revertedAutomation.Files.length == originalAutomation.Files.length
				&& revertedAutomation.Files.find(s => s.Name == testFileName) != null

				&& revertedAutomationFile !== null
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataModel.saveAutomationFile({ id: automationAId, name: testFileName, newName: 'newname.jsm' });
			let savedAutomation = await dataModel.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: 'newname.jsm' });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalAutomation.Files.filter(s => s.Name == testFileName).length == 1

				&& originalAutomation.Files.length == savedAutomation.Files.length

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true
				&& savedAutomation.Files.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedAutomation.Files.filter(s => s.Name == testFileName).length == 0

				&& savedAutomationFile.Name == 'newname.jsm'
				&& originalAutomationFile.Content == savedAutomationFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.createAutomationFile({ id: automationAId });

			assert(saveResult
				&& saveResult.Id == automationAId
				&& saveResult.Name == 'untitled.jsm'
				&& saveResult.AutomationName == originalAutomation.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalAutomation.Files.length
			);
		});

		test("Saving a new file saves file and sets automation into staged state", async assert => {
			let originalAutomation = await dataModel.getAutomation({ id: automationAId });
			let saveResult = await dataModel.saveAutomationFile({ id: automationAId, name: 'newfile.jsm', content: 'content' });
			let savedAutomation = await dataModel.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataModel.getAutomationFile({ id: automationAId, name: 'newfile.jsm' });
			let revertResult = await dataModel.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& savedAutomationFile.Content == 'content'

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'CustomizedDefault'
				&& savedAutomation.IsFactoryDefault == false
				&& savedAutomation.IsStaged == true
				&& savedAutomation.Files.length == originalAutomation.Files.length + 1

				&& saveResult.isNew == true
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

		// resets customized default and new custom automations, returns promise
		function testWithReset(name, fn) {
			if(!fn) {
				test(name);
			} else {
				test(name, async assert=> {
					// clear test subscriptions
					messaging.unsubscribe(testMessageNameSpace);

					// reset test targets
					await dataProvider.deleteAutomation({ id: automationAId });
					await dataProvider.publishAutomation({ id: automationAId });

					await dataProvider.deleteAutomation({ id: testNewId });
					await dataProvider.publishAutomation({ id: testNewId });

					// run test
					await fn(assert);
				});
			}
		}

		testWithReset("Cloning an automation should raise automation.created", async assert => {
			let subData1;
			messaging.subscribe('ma.model.automation.created', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneAutomation({
				id: automationAId,
				newId: testNewId
			});

			assert(
				subData1
				&& subData1.id.id == automationAId
				&& subData1.model.Id == testNewId
				&& subData1.model.State == 'Custom'
			);
		});

		testWithReset("Saving an update to an automation should raise automation.updated", async assert => {
			let subData1;
			messaging.subscribe('ma.model.automation.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveAutomation({
				id: automationAId,
				description: 'new description'
			});

			assert(
				subData1 !== null
				&& subData1.id.id == automationAId
				&& subData1.model.Description == 'new description'
			);
		});

		testWithReset("Deleting a custom/cloned automation should raise automation.deleted", async assert => {
			let subData1;
			messaging.subscribe('ma.model.automation.deleted', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneAutomation({
				id: automationAId,
				newId: testNewId,
				description: 'new description'
			});

			let deleteResult = await dataModel.deleteAutomation({
				id: testNewId
			});
			let deletePublishResult = await dataModel.publishAutomation({
				id: testNewId
			});

			assert(subData1
				&& subData1.id.id == testNewId
				&& subData1.model === null
			);
		});

		testWithReset("Deleting a customized default automation should revert to fac and raise automation.updated instead of delete", async assert => {
			let subData1;
			messaging.subscribe('ma.model.automation.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveAutomation({
				id: automationAId,
				description: 'new-desc'
			});

			let deleteResult = await dataModel.deleteAutomation({
				id: automationAId
			})
			let deletePublishResult = await dataModel.publishAutomation({
				id: automationAId
			});

			assert(
				subData1 !== null
				&& subData1.id.id == automationAId
				&& subData1.model !== null
				&& subData1.model.Description === defaultAutomationADescription
			);
		});

		testWithReset("Publishing an automation should raise automation.updated", async assert => {
			let subData1;
			messaging.subscribe('ma.model.automation.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveAutomation({
				id: automationAId,
				description: 'new-desc'
			});

			let publishResult = await dataModel.publishAutomation({
				id: automationAId
			})

			assert(
				subData1 !== null
				&& subData1.id.id == automationAId
				&& subData1.model.Description == 'new-desc'
				&& subData1.model.IsStaged === false
				&& subData1.model.State === 'CustomizedDefault'
			);
		});


		testWithReset("Reverting a custom automation should raise automation.deleted", async assert => {
			let subData1;
			messaging.subscribe('ma.model.automation.deleted', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneAutomation({
				id: automationAId,
				newId: testNewId,
				description: 'new description'
			});

			let revertResult = await dataModel.revertAutomation({
				id: testNewId
			});

			assert(
				subData1
				&& subData1.id.id == testNewId
				&& subData1.model === null
			);
		});

		testWithReset("Reverting a staged customized default automation should raise automation.updated with default model", async assert => {
			let subData1;
			messaging.subscribe('ma.model.automation.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveAutomation({
				id: automationAId,
				description: 'new-desc'
			});

			let revertResult = await dataModel.revertAutomation({
				id: automationAId
			});

			assert(
				subData1
				&& subData1.id.id == automationAId
				&& subData1.model !== null
				&& subData1.model.Id == automationAId
				&& subData1.model.Description == defaultAutomationADescription
			)
		});

		testWithReset("Saving an automation file should raise automation.updated", async assert => {
			let subData1;
			messaging.subscribe('ma.model.automation.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveAutomationFile({
				id: automationAId,
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.id == automationAId
				&& subData1.model !== null
				&& subData1.model.Files.filter(f => f.Name == 'attachment1.vm').length == 1
			);
		});


		testWithReset("Deleting an automation file should raise automation.updated", async assert => {
			let subData1;
			messaging.subscribe('ma.model.automation.updated', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteAutomationFile({
				id: automationAId,
				name: testFileName,
			});

			assert(
				subData1
				&& subData1.id.id == automationAId
				&& subData1.model !== null
				&& subData1.model.Files.filter(f => f.Name == testFileName).length == 0
			)
		});

		testWithReset("Saving a new automation file should raise file.created", async assert => {
			let subData1;
			messaging.subscribe('ma.model.file.created', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveAutomationFile({
				id: automationAId,
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.id == automationAId
				&& subData1.id.name == 'attachment1.vm'
				&& subData1.model !== null
				&& subData1.model.Id == automationAId
				&& subData1.model.Name == 'attachment1.vm'
				&& subData1.model.Content == 'attachment1 content'
			);
		});

		testWithReset("Saving an updated automation file should raise file.updated", async assert => {
			let subData1;
			messaging.subscribe('ma.model.file.updated', testMessageNameSpace, data => subData1 = data);

			window._dataModel = dataModel;

			let saveResult = await dataModel.saveAutomationFile({
				id: automationAId,
				name: testFileName,
				content: 'new content'
			});

			assert(
				subData1
				&& subData1.id.id == automationAId
				&& subData1.id.name == testFileName
				&& subData1.model !== null
				&& subData1.model.Id == automationAId
				&& subData1.model.Name == testFileName
				&& subData1.model.Content == 'new content'
			);
		});

		testWithReset("Saving a renamed automation file should raise file.updated with original name in id, new name in model", async assert => {
			let subData1;
			messaging.subscribe('ma.model.file.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveAutomationFile({
				id: automationAId,
				name: testFileName,
				newName: 'renamed.jsm',
				content: 'new content'
			});

			assert(
				subData1
				&& subData1.id.id == automationAId
				&& subData1.id.name == testFileName
				&& subData1.model !== null
				&& subData1.model.Id == automationAId
				&& subData1.model.Name == 'renamed.jsm'
				&& subData1.model.Content == 'new content'
			);
		});

		testWithReset("Deleting an automation file should raise file.deleted with no model", async assert => {
			let subData1;
			messaging.subscribe('ma.model.file.deleted', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteAutomationFile({
				id: automationAId,
				name: testFileName,
			});

			assert(
				subData1
				&& subData1.id.id == automationAId
				&& subData1.id.name == testFileName
				&& subData1.model === null
			);
		});

		testWithReset("Delete multiple should raise combination of updated and deleted depending on type of delete", async assert => {
			let log = [];

			let saveResult0 = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataModel.saveAutomation({ id: automationBId, description: 'y' });
			let cloneResult = await dataModel.cloneAutomation({ id: automationCId, newId: testNewId });

			messaging.subscribe('ma.model.automations.changed', testMessageNameSpace, data => log.push({ name: 'changed', data: data }));
			messaging.subscribe('ma.model.automation.updated', testMessageNameSpace, data => log.push({ name: 'updated', data: data }));
			messaging.subscribe('ma.model.automation.deleted', testMessageNameSpace, data => log.push({ name: 'deleted', data: data }));

			let deleteResult = await dataModel.deleteAutomations({ automations: [
				{ id: automationAId },
				{ id: automationBId },
				{ id: testNewId },
			]});
			let deletePublishResult = await dataModel.publishAutomations({ automations: [
				{ id: automationAId },
				{ id: automationBId },
				{ id: testNewId },
			]});

			assert(log
				&& log.length == 5
				&& log[0].name == 'changed'
				&& log[1].name == 'updated'
				&& log[1].data.id.id == automationAId
				&& log[2].name == 'updated'
				&& log[2].data.id.id == automationBId
				&& log[3].name == 'deleted'
				&& log[3].data.id.id == testNewId
				&& log[4].name == 'changed'
			);
		});

		testWithReset("Publish multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('ma.model.automations.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataModel.saveAutomation({ id: automationBId, description: 'y' });
			let saveResult2 = await dataModel.saveAutomation({ id: automationCId, description: 'z' });

			let publishResult = await dataModel.publishAutomations({ automations: [
				{ id: automationAId },
				{ id: automationBId },
				{ id: automationCId },
			]});

			let deleteResult0 = await dataModel.deleteAutomation({ id: automationAId });
			let deletePublishResult0 = await dataModel.publishAutomation({ id: automationAId });
			let deleteResult1 = await dataModel.deleteAutomation({ id: automationBId });
			let deletePublishResult1 = await dataModel.publishAutomation({ id: automationBId });
			let deleteResult2 = await dataModel.deleteAutomation({ id: automationCId });
			let deletePublishResult2 = await dataModel.publishAutomation({  id: automationCId });


			assert(log && log.length == 1);
		});

		testWithReset("Revert multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('ma.model.automations.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataModel.saveAutomation({ id: automationBId, description: 'y' });
			let saveResult2 = await dataModel.saveAutomation({ id: automationCId, description: 'z' });

			let publishResult = await dataModel.revertAutomations({ automations: [
				{ id: automationAId },
				{ id: automationBId },
				{ id: automationCId },
			]});

			assert(log && log.length == 1);
		});

		testWithReset("Reset Test Data", assert => assert(true));
	}

	function runDevModeDataProviderTests(dataProvider) {
		test.heading('Dev Mode Data Provider Tests');

		test("Listing automations should list all automations", async assert => {
			let automations = (await dataProvider.listAutomations()).automations;
			assert(automations.length === totalAutomationsLength);
		});

		test("Listing automations by type should only return type", async assert => {
			let automations = (await dataProvider.listAutomations({ hostId: hostAId })).automations;
			assert(automations.length === 1 && automations[0].HostId == hostAId);
		});

		test("Listing automations by staged: true should only return staged automations", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ staged: true })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == 1
				&& automations[0].Description == 'x'
				&& automations[0].State == 'FactoryDefault'
				&& automations[0].IsFactoryDefault == true
				&& automations[0].IsStaged == true);
		});

		test("Listing automations by staged: false should return non-staged automations as well as the published version of currently-staged automations", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ staged: false })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == totalAutomationsLength

				&& automations[0].Description == defaultAutomationADescription
				&& automations[0].State == 'FactoryDefault'
				&& automations[0].IsFactoryDefault == true
				&& automations[0].IsStaged == false

				&& automations[1].Description == defaultAutomationBDescription
				&& automations[1].State == 'FactoryDefault'
				&& automations[1].IsFactoryDefault == true
				&& automations[1].IsStaged == false);
		});

		test("Listing automations by state: 'FactoryDefault' should only return automations which are currently in a Factory Default State", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ state: 'FactoryDefault' })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == totalAutomationsLength
				&& automations[0].State == 'FactoryDefault');
		});

		test("Listing automations by state: 'CustomizedDefault' should return only automations which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ state: 'CustomizedDefault' })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == 0);
		});

		test("Listing automations by state: 'Custom' should only return automations which are currently in a Custom State", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automations = (await dataProvider.listAutomations({ state: 'Custom' })).automations;
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automations.length == 0);
		});

		test("Listing automations by provider should only return automations which match", async assert => {
			let providerBAutomations = (await dataProvider.listAutomations({ factoryDefaultProviderId: testProviderBId })).automations;
			let providerAAutomations = (await dataProvider.listAutomations({ factoryDefaultProviderId: testProviderAId })).automations;
			assert(providerBAutomations.length == testProviderBAutomationsLength
				&& providerAAutomations.length == testProviderAAutomationsLength
				&& providerBAutomations[0].FactoryDefaultProviderId == testProviderBId
				&& providerAAutomations[0].FactoryDefaultProviderId == testProviderAId);
		});

		test("Getting an automation returns automation", async assert => {
			let automation = await dataProvider.getAutomation({ id: automationAId });
			assert(automation.Id == automationAId);
		});

		test("Getting an automation returns automation with provider", async assert => {
			let automation = await dataProvider.getAutomation({ id: automationAId, });
			assert(automation.Id == automationAId && automation.FactoryDefaultProviderName.length > 0);
		});

		test("Getting an automation returns latest version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId });
			assert(automation.Id == automationAId
				&& automation.State == 'FactoryDefault'
				&& automation.IsFactoryDefault == true
				&& automation.IsStaged == true);
		});

		test("Getting an automation with staged: false should return non-staged version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId, staged: false });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == defaultAutomationADescription
				&& automation.State == 'FactoryDefault'
				&& automation.IsFactoryDefault == true
				&& automation.IsStaged == false);
		});

		test("Getting an automation with staged: true should return staged version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId, staged: true });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == 'x'
				&& automation.State == 'FactoryDefault'
				&& automation.IsFactoryDefault == true
				&& automation.IsStaged == true);
		});

		test("Getting an automation with factoryDefault: true should return factory default version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId, factoryDefault: true });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == defaultAutomationADescription
				&& automation.State == 'FactoryDefault'
				&& automation.IsFactoryDefault == true
				&& automation.IsStaged == false);
		});

		test("Getting an automation with factoryDefault: false should return non-factory default version of automation", async assert => {
			await dataProvider.saveAutomation({ id: automationAId, description: 'x' })
			let automation = await dataProvider.getAutomation({ id: automationAId, factoryDefault: false });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(automation.Id == automationAId
				&& automation.Description == 'x'
				&& automation.State == 'FactoryDefault'
				&& automation.IsFactoryDefault == true
				&& automation.IsStaged == true);
		});

		test("Saving a default automation saves and sets it into a staged, factory default, state and saves files too", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.isNew == false

				&& savedAutomation.Id == automationAId
				&& savedAutomation.Description == 'x'
				&& savedAutomation.State == 'FactoryDefault'
				&& savedAutomation.IsFactoryDefault == true
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length > 0

				&& savedAutomation.Files.length == originalAutomation.Files.length);
		});

		test("Saving a default automation multiple times saves and sets it into a staged, factory default, state and saves files too", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult0 = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let saveResult1 = await dataProvider.saveAutomation({ id: automationAId, description: 'y' });
			let saveResult2 = await dataProvider.saveAutomation({ id: automationAId, description: 'z' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedAutomation.Id == automationAId
				&& savedAutomation.Description == 'z'
				&& savedAutomation.State == 'FactoryDefault'
				&& savedAutomation.IsFactoryDefault == true
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length > 0

				&& savedAutomation.Files.length == originalAutomation.Files.length);
		});

		test("Saving a default automation saves and returns saved automation and list of staged", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			await dataProvider.revertAutomation({ id: automationAId })
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedAutomation.Id == automationAId
				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'FactoryDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == true
				&& saveResult.savedAutomation.IsStaged == true

				&& saveResult.savedAutomation.Files.length > 0

				&& saveResult.savedAutomation.Files.length == originalAutomation.Files.length

				&& saveResult.stagedAutomations.length == 1

				&& saveResult.stagedAutomations[0].Id == automationAId
				&& saveResult.stagedAutomations[0].Description == 'x'
				&& saveResult.stagedAutomations[0].State == 'FactoryDefault'
				&& saveResult.stagedAutomations[0].IsFactoryDefault == true
				&& saveResult.stagedAutomations[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, fac default automation reverts and sets it into a non-staged, fac default, state and saves files too", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataProvider.getAutomation({ id: automationAId });
			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.savedAutomation.Id == automationAId
				&& saveResult.savedAutomation.Description == 'x'
				&& saveResult.savedAutomation.State == 'FactoryDefault'
				&& saveResult.savedAutomation.IsFactoryDefault == true
				&& saveResult.savedAutomation.IsStaged == true

				&& saveResult.savedAutomation.Files.length > 0

				&& saveResult.savedAutomation.Files.length == originalAutomation.Files.length

				&& revertResult.revertedAutomation.Id == automationAId
				&& revertResult.revertedAutomation.Description == defaultAutomationADescription
				&& revertResult.revertedAutomation.State == 'FactoryDefault'
				&& revertResult.revertedAutomation.IsFactoryDefault == true
				&& revertResult.revertedAutomation.IsStaged == false

				&& revertResult.revertedAutomation.Files.length > 0

				&& revertResult.revertedAutomation.Files.length == originalAutomation.Files.length

				&& revertedAutomation.Id == automationAId
				&& revertedAutomation.Description == defaultAutomationADescription
				&& revertedAutomation.State == 'FactoryDefault'
				&& revertedAutomation.IsFactoryDefault == true
				&& revertedAutomation.IsStaged == false

				&& revertedAutomation.Files.length > 0

				&& revertedAutomation.Files.length == originalAutomation.Files.length
				);
		});

		test("Publishing a saved change to a default automation saves and sets it into a published, default, state and saves files too", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomation({ id: automationAId, description: 'x' });
			let publishResult = await dataProvider.publishAutomation({ id: automationAId });
			let publishedAutomation = await dataProvider.getAutomation({ id: automationAId });

			let reverseSaveResult = await dataProvider.saveAutomation({ id: automationAId, description: defaultAutomationADescription });
			let reversePublishResult = await dataProvider.publishAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& publishedAutomation.Id == automationAId
				&& publishedAutomation.Description == 'x'
				&& publishedAutomation.State == 'FactoryDefault'
				&& publishedAutomation.IsFactoryDefault == true
				&& publishedAutomation.IsStaged == false

				&& publishedAutomation.Files.length > 0

				&& publishedAutomation.Files.length == originalAutomation.Files.length

				&& publishResult.publishedAutomation.Id == automationAId
				&& publishResult.publishedAutomation.Description == 'x'
				&& publishResult.publishedAutomation.State == 'FactoryDefault'
				&& publishResult.publishedAutomation.IsFactoryDefault == true
				&& publishResult.publishedAutomation.IsStaged == false

				&& publishResult.publishedAutomation.Files.length > 0

				&& publishResult.publishedAutomation.Files.length == originalAutomation.Files.length

				&& publishResult.stagedAutomations.length == 0
				);
		});

		test("Creating a new automation with provider in dev mode creates non-saved, staged, automation with provider", async assert => {
			let newAutomation = await dataProvider.createAutomation({ id: testNewId, hostId: hostAId, factoryDefaultProviderId: testProviderBId });
			let newSavedAutomation = await dataProvider.getAutomation({ id: testNewId });
			let revertResult = await dataProvider.revertAutomation({ id: testNewId });

			assert(newAutomation.Id.length > 0
				&& newAutomation.State == 'NotPersisted'
				&& newAutomation.IsStaged == false
				&& newAutomation.Id == testNewId
				&& newAutomation.HostId == hostAId
				&& newAutomation.IsFactoryDefault == true
				&& newAutomation.FactoryDefaultProviderId === testProviderBId

				&& newSavedAutomation == null

				&& revertResult.reverted == true
				&& revertResult.revertedAutomation == null
				&& revertResult.stagedAutomations.length == 0
				);
		});

		test("Creating and publishing new automation with provider in dev mode creates published automation with provider", async assert => {
			let newAutomation = await dataProvider.createAutomation({ id: testNewId, hostId: hostAId, factoryDefaultProviderId: testProviderBId });
			let saveResult = await dataProvider.saveAutomation({ id: testNewId, hostId: hostAId, factoryDefaultProviderId: testProviderBId, name: 'test-auto' });
			let publishResult = await dataProvider.publishAutomation({ id: testNewId });
			let publishedAutomation = await dataProvider.getAutomation({ id: testNewId });
			let deleteResult = await dataProvider.deleteAutomation({ id: testNewId });
			let stagedDeletedAutomation = await dataProvider.getAutomation({ id: testNewId });
			let deletePublishResult = await dataProvider.publishAutomation({ id: testNewId });
			let deletedAutomation = await dataProvider.getAutomation({ id: testNewId });

			assert(newAutomation.Id.length > 0
				&& newAutomation.State == 'NotPersisted'
				&& newAutomation.IsStaged == false
				&& newAutomation.Id == testNewId
				&& newAutomation.HostId == hostAId
				&& newAutomation.IsFactoryDefault == true
				&& newAutomation.FactoryDefaultProviderId === testProviderBId

				&& stagedDeletedAutomation != null
				&& stagedDeletedAutomation.State == 'FactoryDefault'
				&& stagedDeletedAutomation.IsStaged == true
				&& stagedDeletedAutomation.IsDeleted == true
				&& stagedDeletedAutomation.Id == testNewId
				&& stagedDeletedAutomation.HostId == hostAId
				&& stagedDeletedAutomation.IsFactoryDefault == true
				&& stagedDeletedAutomation.FactoryDefaultProviderId === testProviderBId

				&& publishedAutomation != null
				&& publishedAutomation.State == 'FactoryDefault'
				&& publishedAutomation.IsStaged == false
				&& publishedAutomation.Id == testNewId
				&& publishedAutomation.HostId == hostAId
				&& publishedAutomation.IsFactoryDefault == true
				&& publishedAutomation.FactoryDefaultProviderId === testProviderBId

				&& deletedAutomation == null
				);
		});

		test("Cloning an automation creates a FactoryDefault, staged, automation with random new automation id and incremented name", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId });
			let clonedAutomation = await dataProvider.getAutomation({ id: cloneResult.clonedAutomation.Id });
			await dataProvider.deleteAutomation({ id: clonedAutomation.Id });
			await dataProvider.publishAutomation({ id: clonedAutomation.Id });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& cloneResult.clonedAutomation.Id != automationAId
				&& cloneResult.clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& cloneResult.clonedAutomation.Description == defaultAutomationADescription
				&& cloneResult.clonedAutomation.State == 'FactoryDefault'
				&& cloneResult.clonedAutomation.IsFactoryDefault == true
				&& cloneResult.clonedAutomation.IsStaged == true

				&& cloneResult.clonedAutomation.Files.length > 0

				&& cloneResult.clonedAutomation.Files.length == originalAutomation.Files.length

				&& cloneResult.stagedAutomations.length == 1

				&& clonedAutomation.Id != automationAId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.Description == defaultAutomationADescription
				&& clonedAutomation.State == 'FactoryDefault'
				&& clonedAutomation.IsFactoryDefault == true
				&& clonedAutomation.IsStaged == true

				&& clonedAutomation.Files.length > 0

				&& clonedAutomation.Files.length == originalAutomation.Files.length
			);
		});


		test("Cloning an automation with specific ID creates a fac default, staged, automation with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId, newId: newId });
			let clonedAutomation = await dataProvider.getAutomation({ id: newId });
			await dataProvider.deleteAutomation({ id: newId });
			await dataProvider.publishAutomation({ id: newId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& cloneResult.clonedAutomation.Id == newId
				&& cloneResult.clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.Id == newId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
			);
		});

		test("Cloning an automation with specific provider ID creates a fac default, staged, automation with incremented name and specified provider", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId, newId: newId, factoryDefaultProviderId: testProviderBId });
			let clonedAutomation = await dataProvider.getAutomation({ id: newId });
			await dataProvider.deleteAutomation({ id: newId });
			await dataProvider.publishAutomation({ id: newId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& cloneResult.clonedAutomation.Id == newId
				&& cloneResult.clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& cloneResult.clonedAutomation.IsFactoryDefault == true
				&& cloneResult.clonedAutomation.FactoryDefaultProviderId == testProviderBId
				&& clonedAutomation.Id == newId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.IsFactoryDefault == true
				&& clonedAutomation.FactoryDefaultProviderId == testProviderBId
			);
		});

		test("Publishing a cloned automation publishes", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId });
			let publishResult = await dataProvider.publishAutomation({ id: cloneResult.clonedAutomation.Id });
			let clonedAutomation = await dataProvider.getAutomation({ id: cloneResult.clonedAutomation.Id });
			await dataProvider.deleteAutomation({ id: clonedAutomation.Id });
			await dataProvider.publishAutomation({ id: clonedAutomation.Id });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& publishResult.publishedAutomation.Id != automationAId
				&& publishResult.publishedAutomation.Name == (originalAutomation.Name + ' 1')
				&& publishResult.publishedAutomation.Description == defaultAutomationADescription
				&& publishResult.publishedAutomation.State == 'FactoryDefault'
				&& publishResult.publishedAutomation.IsFactoryDefault == true
				&& publishResult.publishedAutomation.IsStaged == false

				&& publishResult.publishedAutomation.Files.length > 0

				&& publishResult.publishedAutomation.Files.length == originalAutomation.Files.length

				&& publishResult.stagedAutomations.length == 0

				&& clonedAutomation.Id != automationAId
				&& clonedAutomation.Name == (originalAutomation.Name + ' 1')
				&& clonedAutomation.Description == defaultAutomationADescription
				&& clonedAutomation.State == 'FactoryDefault'
				&& clonedAutomation.IsFactoryDefault == true
				&& clonedAutomation.IsStaged == false

				&& clonedAutomation.Files.length > 0

				&& clonedAutomation.Files.length == originalAutomation.Files.length
			);
		})

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataProvider.cloneAutomation({ id: automationAId });
			let publishResult = await dataProvider.publishAutomation({ id: cloneResult.clonedAutomation.Id });
			let deleteResult = await dataProvider.deleteAutomation({ id: cloneResult.clonedAutomation.Id });
			let deletePublishResult = await dataProvider.publishAutomation({ id: cloneResult.clonedAutomation.Id });
			let automation = await dataProvider.getAutomation({ id: cloneResult.clonedAutomation.Id });

			assert(publishResult.publishedAutomation !== null
				&& automation == null);
		})

		test("Getting an automation file gets file", async assert => {
			let file = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			assert(file.Name == testFileName);
		});

		test("Saving a file saves file and sets automation into staged state", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult.isNew == false

				&& savedAutomationFile.Content == 'new file content'

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'FactoryDefault'
				&& savedAutomation.IsFactoryDefault == true
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length == originalAutomation.Files.length

				&& savedAutomation.Files.length > 0);
		});

		test("Saving a file multiple times saves file and sets automation into staged state", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult0 = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new file content 2' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedAutomationFile.Content == 'new file content 2'

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'FactoryDefault'
				&& savedAutomation.IsFactoryDefault == true
				&& savedAutomation.IsStaged == true

				&& savedAutomation.Files.length == originalAutomation.Files.length

				&& savedAutomation.Files.length > 0);
		});

		test("Reverting an automation with a saved file reverts both", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let revertedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& revertedAutomationFile.Content === originalAutomationFile.Content

				&& revertedAutomation.Id == automationAId
				&& revertedAutomation.State == 'FactoryDefault'

				&& revertedAutomation.Files.length > 0);
		})

		test("Getting non-staged version of otherwise staged automation file gets non-staged version", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let nonStagedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName, staged: false });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomationFile.Content != 'new content'
				&& savedAutomationFile.Content == 'new content'
				&& nonStagedAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default automation file gets fac default version", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, content: 'new content' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let facDefaultAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName, factoryDefault: true });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomationFile.Content != 'new content'
				&& savedAutomationFile.Content == 'new content'
				&& facDefaultAutomationFile.Content == originalAutomationFile.Content
			);
		});

		test("Deleting a file from a default automation sets automation to staged with removed file", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let deleteResult = await dataProvider.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let revertedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomation.Files.length == originalAutomation.Files.length - 1
				&& deletedAutomation.Files.find(s => s.Name == testFileName) == null
				&& deletedAutomation.State == 'FactoryDefault'
				&& deletedAutomation.IsFactoryDefault == true
				&& deletedAutomation.IsStaged == true

				&& deletedAutomationFile == null
			);
		});

		test("Reverting file deletion from staged automation sets automation back to factory default", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let deleteResult = await dataProvider.deleteAutomationFile({ id: automationAId, name: testFileName });
			let deletedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let deletedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			let revertResult = await dataProvider.revertAutomation({ id: automationAId });
			let revertedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let revertedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.length > 0

				&& originalAutomation.Files.find(s => s.Name == testFileName) !== null

				&& originalAutomationFile.Name == testFileName

				&& deleteResult.stagedAutomations.length == 1
				&& deleteResult.automation.Files.length == originalAutomation.Files.length - 1
				&& deleteResult.automation.Files.find(s => s.Name == testFileName) == null

				&& deletedAutomation.Files.length == originalAutomation.Files.length - 1
				&& deletedAutomation.Files.find(s => s.Name == testFileName) == null
				&& deletedAutomation.State == 'FactoryDefault'
				&& deletedAutomation.IsFactoryDefault == true
				&& deletedAutomation.IsStaged == true

				&& deletedAutomationFile == null

				&& revertResult.stagedAutomations.length == 0
				&& revertResult.revertedAutomation.IsStaged == false
				&& revertResult.revertedAutomation.Files.length == originalAutomation.Files.length
				&& revertResult.revertedAutomation.Files.find(s => s.Name == testFileName) != null

				&& revertedAutomation.IsStaged == false
				&& revertedAutomation.Files.length == originalAutomation.Files.length
				&& revertedAutomation.Files.find(s => s.Name == testFileName) != null

				&& revertedAutomationFile !== null
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let originalAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: testFileName });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: testFileName, newName: 'renamed.jsm' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: 'renamed.jsm' });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false
				&& originalAutomation.Files.filter(s => s.Name == 'renamed.jsm').length == 0
				&& originalAutomation.Files.filter(s => s.Name == testFileName).length == 1

				&& originalAutomation.Files.length == savedAutomation.Files.length

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'FactoryDefault'
				&& savedAutomation.IsFactoryDefault == true
				&& savedAutomation.IsStaged == true
				&& savedAutomation.Files.filter(s => s.Name == 'renamed.jsm').length == 1
				&& savedAutomation.Files.filter(s => s.Name == testFileName).length == 0

				&& savedAutomationFile.Name == 'renamed.jsm'
				&& originalAutomationFile.Content == savedAutomationFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.createAutomationFile({ id: automationAId });

			assert(saveResult
				&& saveResult.Id == automationAId
				&& saveResult.Name == 'untitled.jsm'
				&& saveResult.AutomationName == originalAutomation.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalAutomation.Files.length
			);
		});

		test("Saving a new file saves file and sets automation into staged state", async assert => {
			let originalAutomation = await dataProvider.getAutomation({ id: automationAId });
			let saveResult = await dataProvider.saveAutomationFile({ id: automationAId, name: 'newfile.jsm', content: 'content' });
			let savedAutomation = await dataProvider.getAutomation({ id: automationAId });
			let savedAutomationFile = await dataProvider.getAutomationFile({ id: automationAId, name: 'newfile.jsm' });
			let revertResult = await dataProvider.revertAutomation({ id: automationAId });

			assert(originalAutomation.Id == automationAId
				&& originalAutomation.Description == defaultAutomationADescription
				&& originalAutomation.State == 'FactoryDefault'
				&& originalAutomation.IsFactoryDefault == true
				&& originalAutomation.IsStaged == false

				&& savedAutomationFile.Content == 'content'

				&& savedAutomation.Id == automationAId
				&& savedAutomation.State == 'FactoryDefault'
				&& savedAutomation.IsFactoryDefault == true
				&& savedAutomation.IsStaged == true
				&& savedAutomation.Files.length == originalAutomation.Files.length + 1

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
