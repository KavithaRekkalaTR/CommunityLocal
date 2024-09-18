define('Tests', ['StudioSaveQueue', 'DataModel'], (StudioSaveQueue, DataModel, $, global, undef) => {

	let messaging = $.telligent.evolution.messaging;

	let embeddableAId = "48f4035f-bc3e-44fe-a260-7c37e5d5ea9a";
	let embeddableBId = "2ea054d4-b36d-493e-94c7-ff6c7e11a973";
	let embeddableCId = "7e23b44f-0d2f-472a-86ce-382ea15ff67f";
	let testNewId = "e5bccddb-16e4-4a22-b13b-91a9bba5eaea";
	let coreProviderId = "704e43fa-644b-4a59-881b-4632f0a6d708";
	let testProviderId = "264ec3f0-ac9d-4bd1-af74-8984e58df1cc";
	let defaultEmbeddableADescription = "Test Embeddable A Description";
	let defaultEmbeddableBDescription = "Test Embeddable B Description";
	let defaultEmbeddableCDescription = "Test Embeddable C Description";
	let testFileName = 'file-a.jsm';

	let defaultEmbeddablesLength = 3;
	let testProviderEmbeddablesLength = 3;

	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function runDataProviderTests(dataProvider) {
		test.heading('Data Provider Tests');

		test("Listing embeddables should list all embeddables", async assert => {
			let embeddables = (await dataProvider.listEmbeddables()).embeddables;
			assert(embeddables.length === defaultEmbeddablesLength);
		});

		test("Listing embeddables by staged: true should only return staged embeddables", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ staged: true })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == 1
				&& embeddables[0].Description == 'x'
				&& embeddables[0].State == 'CustomizedDefault'
				&& embeddables[0].IsFactoryDefault == false
				&& embeddables[0].IsStaged == true);
		});

		test("Listing embeddables by staged: false should return non-staged embeddables as well as the published version of currently-staged embeddables", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ staged: false })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == defaultEmbeddablesLength

				&& embeddables[0].Description == defaultEmbeddableADescription
				&& embeddables[0].State == 'CustomizedDefault'
				&& embeddables[0].IsFactoryDefault == true
				&& embeddables[0].IsStaged == false

				&& embeddables[1].Description == defaultEmbeddableBDescription
				&& embeddables[1].State == 'FactoryDefault'
				&& embeddables[1].IsFactoryDefault == true
				&& embeddables[1].IsStaged == false);
		});

		test("Listing embeddables by state: 'FactoryDefault' should only return embeddables which are currently in a Factory Default State", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ state: 'FactoryDefault' })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == defaultEmbeddablesLength - 1
				&& embeddables[0].State == 'FactoryDefault');
		});

		test("Listing embeddables by state: 'CustomizedDefault' should return only embeddables which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ state: 'CustomizedDefault' })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == 1
				&& embeddables[0].State == 'CustomizedDefault');
		});

		test("Listing embeddables by state: 'Custom' should only return embeddables which are currently in a Custom State", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ state: 'Custom' })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == 0);
		});

		test("Listing embeddables by provider should only return embeddables which match", async assert => {
			let testAEmbeddables = (await dataProvider.listEmbeddables({ factoryDefaultProviderId: testProviderId })).embeddables;
			let coreEmbeddables = (await dataProvider.listEmbeddables({ factoryDefaultProviderId: coreProviderId })).embeddables;
			assert(testAEmbeddables.length == testProviderEmbeddablesLength && coreEmbeddables.length == (defaultEmbeddablesLength - testProviderEmbeddablesLength)
				&& testAEmbeddables[0].FactoryDefaultProviderId == testProviderId);
		});

		test("Getting an embeddable returns embeddable", async assert => {
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, });
			assert(embeddable.Id == embeddableAId);
		});

		test("Getting an embeddable returns embeddable with provider", async assert => {
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, });
			assert(embeddable.Id == embeddableAId && embeddable.FactoryDefaultProviderName.length > 0);
		});

		test("Getting an embeddable returns latest version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.State == 'CustomizedDefault'
				&& embeddable.IsFactoryDefault == false
				&& embeddable.IsStaged == true);
		});

		test("Getting an embeddable with staged: false should return non-staged version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, staged: false });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == defaultEmbeddableADescription
				&& embeddable.State == 'CustomizedDefault' // to know that this is a cutomized embeddable but currently viewing fac default version
				&& embeddable.IsFactoryDefault == true
				&& embeddable.IsStaged == false);
		});


		test("Getting an embeddable with staged: true should return staged version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, staged: true });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == 'x'
				&& embeddable.State == 'CustomizedDefault' // to know that this is a cutomized embeddable but currently viewing fac default version
				&& embeddable.IsFactoryDefault == false
				&& embeddable.IsStaged == true);
		});

		test("Getting an embeddable with factoryDefault: true should return factory default version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, factoryDefault: true });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == defaultEmbeddableADescription
				&& embeddable.State == 'CustomizedDefault' // to know that this is a cutomized embeddable but currently viewing fac default version
				&& embeddable.IsFactoryDefault == true
				&& embeddable.IsStaged == false);
		});

		test("Getting an embeddable with factoryDefault: false should return non-factory default version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, factoryDefault: false });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == 'x'
				&& embeddable.State == 'CustomizedDefault' // to know that this is a cutomized embeddable but currently viewing fac default version
				&& embeddable.IsFactoryDefault == false
				&& embeddable.IsStaged == true);
		});

		test("Saving a default embeddable saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.Description == 'x'
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length > 0
				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length);
		});

		test("Saving a default embeddable multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult0 = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'y' });
			let saveResult2 = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'z' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId  });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.Description == 'z'
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length > 0
				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length);
		});

		test("Saving a default embeddable saves and returns saved embeddable and list of staged", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedEmbeddable.Id == embeddableAId
				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == false
				&& saveResult.savedEmbeddable.IsStaged == true

				&& saveResult.savedEmbeddable.Files.length > 0

				&& saveResult.savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& saveResult.stagedEmbeddables.length == 1

				&& saveResult.stagedEmbeddables[0].Id == embeddableAId
				&& saveResult.stagedEmbeddables[0].Description == 'x'
				&& saveResult.stagedEmbeddables[0].State == 'CustomizedDefault'
				&& saveResult.stagedEmbeddables[0].IsFactoryDefault == false
				&& saveResult.stagedEmbeddables[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default embeddable reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.savedEmbeddable.Id == embeddableAId
				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == false
				&& saveResult.savedEmbeddable.IsStaged == true

				&& saveResult.savedEmbeddable.Files.length > 0

				&& saveResult.savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& revertResult.revertedEmbeddable.Id == embeddableAId
				&& revertResult.revertedEmbeddable.Description == defaultEmbeddableADescription
				&& revertResult.revertedEmbeddable.State == 'FactoryDefault'
				&& revertResult.revertedEmbeddable.IsFactoryDefault == true
				&& revertResult.revertedEmbeddable.IsStaged == false

				&& revertResult.revertedEmbeddable.Files.length > 0
				&& revertResult.revertedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& revertedEmbeddable.Id == embeddableAId

				&& revertedEmbeddable.Description == defaultEmbeddableADescription
				&& revertedEmbeddable.State == 'FactoryDefault'
				&& revertedEmbeddable.IsFactoryDefault == true
				&& revertedEmbeddable.IsStaged == false

				&& revertedEmbeddable.Files.length > 0

				&& revertedEmbeddable.Files.length == originalEmbeddable.Files.length
				);
		});

		test("Reverting multiple embeddables reverts multiple embeddables", async assert => {
			let originalEmbeddable0 = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddable1 = await dataProvider.getEmbeddable({ id: embeddableBId });
			let originalEmbeddable2 = await dataProvider.getEmbeddable({ id: embeddableCId });

			let saveResult0 = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataProvider.saveEmbeddable({ id: embeddableBId, description: 'y' });
			let saveResult2 = await dataProvider.saveEmbeddable({ id: embeddableCId, description: 'z' });

			let embeddableIds = `${embeddableAId},${embeddableBId},${embeddableCId}`;
			let revertResult = await dataProvider.revertEmbeddables({ embeddableIds: embeddableIds });

			let revertedEmbeddable0 = await dataProvider.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddable1 = await dataProvider.getEmbeddable({ id: embeddableBId });
			let revertedEmbeddable2 = await dataProvider.getEmbeddable({ id: embeddableCId });

			assert(originalEmbeddable0.Description == defaultEmbeddableADescription
				&& originalEmbeddable0.State == 'FactoryDefault'
				&& originalEmbeddable0.IsFactoryDefault == true
				&& originalEmbeddable0.IsStaged == false

				&& originalEmbeddable1.Description == defaultEmbeddableBDescription
				&& originalEmbeddable1.State == 'FactoryDefault'
				&& originalEmbeddable1.IsFactoryDefault == true
				&& originalEmbeddable1.IsStaged == false

				&& originalEmbeddable2.Description == defaultEmbeddableCDescription
				&& originalEmbeddable2.State == 'FactoryDefault'
				&& originalEmbeddable2.IsFactoryDefault == true
				&& originalEmbeddable2.IsStaged == false

				&& saveResult0.savedEmbeddable.Description == 'x'
				&& saveResult0.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult0.savedEmbeddable.IsFactoryDefault == false
				&& saveResult0.savedEmbeddable.IsStaged == true

				&& saveResult1.savedEmbeddable.Description == 'y'
				&& saveResult1.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult1.savedEmbeddable.IsFactoryDefault == false
				&& saveResult1.savedEmbeddable.IsStaged == true

				&& saveResult2.savedEmbeddable.Description == 'z'
				&& saveResult2.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult2.savedEmbeddable.IsFactoryDefault == false
				&& saveResult2.savedEmbeddable.IsStaged == true

				&& revertResult.stagedEmbeddables.length == 0

				&& revertedEmbeddable0.Description == defaultEmbeddableADescription
				&& revertedEmbeddable0.State == 'FactoryDefault'
				&& revertedEmbeddable0.IsFactoryDefault == true
				&& revertedEmbeddable0.IsStaged == false

				&& revertedEmbeddable1.Description == defaultEmbeddableBDescription
				&& revertedEmbeddable1.State == 'FactoryDefault'
				&& revertedEmbeddable1.IsFactoryDefault == true
				&& revertedEmbeddable1.IsStaged == false

				&& revertedEmbeddable2.Description == defaultEmbeddableCDescription
				&& revertedEmbeddable2.State == 'FactoryDefault'
				&& revertedEmbeddable2.IsFactoryDefault == true
				&& revertedEmbeddable2.IsStaged == false
				);
		});

		test("Deleting a published customized default stages reversion to factory default", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let publishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });
			let deleteResult = await dataProvider.deleteEmbeddable({ id: embeddableAId });
			let stagedDeletedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == false
				&& saveResult.savedEmbeddable.IsStaged == true

				&& publishResult.publishedEmbeddable.Description == 'x'
				&& publishResult.publishedEmbeddable.State == 'CustomizedDefault'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'FactoryDefault'
				&& deleteResult.embeddable.IsFactoryDefault == true
				&& deleteResult.embeddable.IsStaged == true

				&& stagedDeletedEmbeddable.Description == defaultEmbeddableADescription
				&& stagedDeletedEmbeddable.State == 'FactoryDefault'
				&& stagedDeletedEmbeddable.IsFactoryDefault == true
				&& stagedDeletedEmbeddable.IsStaged == true
				);
		});

		test("Reverting a staged deletion of customized default restores customized default", async assert => {

			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let publishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });
			let deleteResult = await dataProvider.deleteEmbeddable({ id: embeddableAId });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			let realDeleteResult = await dataProvider.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == false
				&& saveResult.savedEmbeddable.IsStaged == true

				&& publishResult.publishedEmbeddable.Description == 'x'
				&& publishResult.publishedEmbeddable.State == 'CustomizedDefault'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'FactoryDefault'
				&& deleteResult.embeddable.IsFactoryDefault == true
				&& deleteResult.embeddable.IsStaged == true

				&& revertResult.revertedEmbeddable.Description == 'x'
				&& revertResult.revertedEmbeddable.State == 'CustomizedDefault'
				&& revertResult.revertedEmbeddable.IsFactoryDefault == false
				&& revertResult.revertedEmbeddable.IsStaged == false
				);
		})

		test("Deleting a published custom stages deletion", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId, newId: testNewId });
			let publishResult = await dataProvider.publishEmbeddable({ id: testNewId });
			let deleteResult = await dataProvider.deleteEmbeddable({ id: testNewId });
			let stagedDeletedEmbeddable = await dataProvider.getEmbeddable({ id: testNewId });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: testNewId });

			assert(originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.IsDeleted == false

				&& cloneResult.clonedEmbeddable.Description == defaultEmbeddableADescription
				&& cloneResult.clonedEmbeddable.State == 'Custom'
				&& cloneResult.clonedEmbeddable.IsFactoryDefault == false
				&& cloneResult.clonedEmbeddable.IsStaged == true
				&& cloneResult.clonedEmbeddable.IsDeleted == false

				&& publishResult.publishedEmbeddable.Description == defaultEmbeddableADescription
				&& publishResult.publishedEmbeddable.State == 'Custom'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false
				&& publishResult.publishedEmbeddable.IsDeleted == false

				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'Custom'
				&& deleteResult.embeddable.IsFactoryDefault == false
				&& deleteResult.embeddable.IsDeleted == true
				&& deleteResult.embeddable.IsStaged == true

				&& stagedDeletedEmbeddable.Description == defaultEmbeddableADescription
				&& stagedDeletedEmbeddable.State == 'Custom'
				&& stagedDeletedEmbeddable.IsFactoryDefault == false
				&& stagedDeletedEmbeddable.IsDeleted == true
				&& stagedDeletedEmbeddable.IsStaged == true
				);

		});

		test("Reverting a staged custom deletion restores custom", async assert => {

			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId, newId: testNewId });
			let publishResult = await dataProvider.publishEmbeddable({ id: testNewId });

			let deleteResult = await dataProvider.deleteEmbeddable({ id: testNewId });
			let revertResult = await dataProvider.revertEmbeddable({ id: testNewId });

			let realDeleteResult = await dataProvider.deleteEmbeddable({ id: testNewId });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: testNewId });

			assert(originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.IsDeleted == false

				&& cloneResult.clonedEmbeddable.Description == defaultEmbeddableADescription
				&& cloneResult.clonedEmbeddable.State == 'Custom'
				&& cloneResult.clonedEmbeddable.IsFactoryDefault == false
				&& cloneResult.clonedEmbeddable.IsStaged == true
				&& cloneResult.clonedEmbeddable.IsDeleted == false

				&& publishResult.publishedEmbeddable.Description == defaultEmbeddableADescription
				&& publishResult.publishedEmbeddable.State == 'Custom'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false
				&& publishResult.publishedEmbeddable.IsDeleted == false

				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'Custom'
				&& deleteResult.embeddable.IsFactoryDefault == false
				&& deleteResult.embeddable.IsDeleted == true
				&& deleteResult.embeddable.IsStaged == true

				&& revertResult.revertedEmbeddable.Description == defaultEmbeddableADescription
				&& revertResult.revertedEmbeddable.State == 'Custom'
				&& revertResult.revertedEmbeddable.IsFactoryDefault == false
				&& revertResult.revertedEmbeddable.IsStaged == false
				&& revertResult.revertedEmbeddable.IsDeleted == false
				);

		});

		test("Publishing a saved change to a default embeddable saves and sets it into a published, customized default, state and saves files too", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let publishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });
			let publishedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			await dataProvider.deleteEmbeddable({ id: embeddableAId })
			await dataProvider.publishEmbeddable({ id: embeddableAId });
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& publishedEmbeddable.Id == embeddableAId
				&& publishedEmbeddable.Description == 'x'
				&& publishedEmbeddable.State == 'CustomizedDefault'
				&& publishedEmbeddable.IsFactoryDefault == false
				&& publishedEmbeddable.IsStaged == false

				&& publishedEmbeddable.Files.length > 0

				&& publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& publishResult.publishedEmbeddable.Id == embeddableAId
				&& publishResult.publishedEmbeddable.Description == 'x'
				&& publishResult.publishedEmbeddable.State == 'CustomizedDefault'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& publishResult.publishedEmbeddable.Files.length > 0

				&& publishResult.publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& publishResult.stagedEmbeddables.length == 0
				);
		});

		test("Publishing multiple embeddables publishes multiple embeddables", async assert => {
			let originalEmbeddable0 = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddable1 = await dataProvider.getEmbeddable({ id: embeddableBId });
			let originalEmbeddable2 = await dataProvider.getEmbeddable({ id: embeddableCId });

			let saveResult0 = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataProvider.saveEmbeddable({ id: embeddableBId, description: 'y' });
			let saveResult2 = await dataProvider.saveEmbeddable({ id: embeddableCId, description: 'z' });

			let embeddableIds = `${embeddableAId},${embeddableBId},${embeddableCId}`;
			let publishResult = await dataProvider.publishEmbeddables({ embeddableIds: embeddableIds });

			let publishedEmbeddable0 = await dataProvider.getEmbeddable({ id: embeddableAId });
			let publishedEmbeddable1 = await dataProvider.getEmbeddable({ id: embeddableBId });
			let publishedEmbeddable2 = await dataProvider.getEmbeddable({ id: embeddableCId });

			await dataProvider.deleteEmbeddable({ id: embeddableAId });
			await dataProvider.deleteEmbeddable({ id: embeddableBId });
			await dataProvider.deleteEmbeddable({ id: embeddableCId });
			await dataProvider.publishEmbeddable({ id: embeddableAId });
			await dataProvider.publishEmbeddable({ id: embeddableBId });
			await dataProvider.publishEmbeddable({ id: embeddableCId });

			assert(originalEmbeddable0.Description == defaultEmbeddableADescription
				&& originalEmbeddable0.State == 'FactoryDefault'
				&& originalEmbeddable0.IsFactoryDefault == true
				&& originalEmbeddable0.IsStaged == false

				&& originalEmbeddable1.Description == defaultEmbeddableBDescription
				&& originalEmbeddable1.State == 'FactoryDefault'
				&& originalEmbeddable1.IsFactoryDefault == true
				&& originalEmbeddable1.IsStaged == false

				&& originalEmbeddable2.Description == defaultEmbeddableCDescription
				&& originalEmbeddable2.State == 'FactoryDefault'
				&& originalEmbeddable2.IsFactoryDefault == true
				&& originalEmbeddable2.IsStaged == false

				&& publishResult.stagedEmbeddables.length == 0

				&& publishedEmbeddable0.Description == 'x'
				&& publishedEmbeddable0.State == 'CustomizedDefault'
				&& publishedEmbeddable0.IsFactoryDefault == false
				&& publishedEmbeddable0.IsStaged == false

				&& publishedEmbeddable1.Description == 'y'
				&& publishedEmbeddable1.State == 'CustomizedDefault'
				&& publishedEmbeddable1.IsFactoryDefault == false
				&& publishedEmbeddable1.IsStaged == false

				&& publishedEmbeddable2.Description == 'z'
				&& publishedEmbeddable2.State == 'CustomizedDefault'
				&& publishedEmbeddable2.IsFactoryDefault == false
				&& publishedEmbeddable2.IsStaged == false
				);
		});

		test("Deleting a published, customized default embeddable reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let publishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });
			let deleteResult = await dataProvider.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });
			let deletedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& deleteResult.embeddable.Id == embeddableAId
				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'FactoryDefault'
				&& deleteResult.embeddable.IsFactoryDefault == true
				&& deleteResult.embeddable.IsStaged == true
				&& deleteResult.embeddable.IsReverted == true
				&& deleteResult.embeddable.IsDeleted == false

				&& deletePublishResult.publishedEmbeddable.Id == embeddableAId
				&& deletePublishResult.publishedEmbeddable.Description == defaultEmbeddableADescription
				&& deletePublishResult.publishedEmbeddable.State == 'FactoryDefault'
				&& deletePublishResult.publishedEmbeddable.IsFactoryDefault == true
				&& deletePublishResult.publishedEmbeddable.IsStaged == false

				&& deletePublishResult.publishedEmbeddable.Files.length > 0

				&& deletePublishResult.publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& deletedEmbeddable.Id == embeddableAId
				&& deletedEmbeddable.Description == defaultEmbeddableADescription
				&& deletedEmbeddable.State == 'FactoryDefault'
				&& deletedEmbeddable.IsFactoryDefault == true
				&& deletedEmbeddable.IsStaged == false

				&& deletedEmbeddable.Files.length > 0

				&& deletedEmbeddable.Files.length == originalEmbeddable.Files.length
				);
		});

		test("Deleting multiple embeddables at different states deletes and/or reverts multiple embeddables", async assert => {
			// 3 types of states: staged customized default, published customized default, published custom
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let embeddableASaveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let embeddableBSaveResult = await dataProvider.saveEmbeddable({ id: embeddableBId, description: 'y' });
			let embeddableBPublishResult = await dataProvider.publishEmbeddable({ id: embeddableBId });
			let embeddableCCloneResult = await dataProvider.cloneEmbeddable({ id: embeddableCId, newId: newId });
			let embeddableCClonePublishResult = await dataProvider.publishEmbeddable({ id: newId });

			let stagedXEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let publishedYEmbeddable = await dataProvider.getEmbeddable({ id: embeddableBId });
			let clonedZEmbeddable = await dataProvider.getEmbeddable({ id: newId });

			let embeddableIds = `${embeddableAId},${embeddableBId},${newId}`;
			let deleteResult = await dataProvider.deleteEmbeddables({ embeddableIds: embeddableIds });
			let deletePublishResult = await dataProvider.publishEmbeddables({ embeddableIds: embeddableIds });

			let deletedXEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let deletedYEmbeddable = await dataProvider.getEmbeddable({ id: embeddableBId });
			let deletedZEmbeddable = await dataProvider.getEmbeddable({ id: newId });

			assert(stagedXEmbeddable.Description == 'x'
				&& stagedXEmbeddable.State == 'CustomizedDefault'
				&& stagedXEmbeddable.IsFactoryDefault == false
				&& stagedXEmbeddable.IsStaged == true

				&& publishedYEmbeddable.Description == 'y'
				&& publishedYEmbeddable.State == 'CustomizedDefault'
				&& publishedYEmbeddable.IsFactoryDefault == false
				&& publishedYEmbeddable.IsStaged == false

				&& clonedZEmbeddable.State == 'Custom'
				&& clonedZEmbeddable.IsFactoryDefault == false
				&& clonedZEmbeddable.IsStaged == false

				&& deleteResult.stagedEmbeddables.length == 2
				&& deleteResult.revertedEmbeddables.length == 1
				&& deleteResult.stagedEmbeddables[0].Id == embeddableBId
				&& deleteResult.stagedEmbeddables[0].IsDeleted == false
				&& deleteResult.stagedEmbeddables[0].IsReverted == true
				&& deleteResult.stagedEmbeddables[1].Id == newId
				&& deleteResult.stagedEmbeddables[1].IsDeleted == true
				&& deleteResult.stagedEmbeddables[1].IsReverted == true
				&& deleteResult.revertedEmbeddables[0].Id == embeddableAId

				&& deletePublishResult.deletedEmbeddables.length == 1
				&& deletePublishResult.revertedEmbeddables.length == 1
				&& deletePublishResult.deletedEmbeddables[0].Id == newId
				&& deletePublishResult.revertedEmbeddables[0].Id == embeddableBId

				&& deletedXEmbeddable.Description == defaultEmbeddableADescription
				&& deletedXEmbeddable.State == 'FactoryDefault'
				&& deletedXEmbeddable.IsFactoryDefault == true
				&& deletedXEmbeddable.IsStaged == false

				&& deletedYEmbeddable.Description == defaultEmbeddableBDescription
				&& deletedYEmbeddable.State == 'FactoryDefault'
				&& deletedYEmbeddable.IsFactoryDefault == true
				&& deletedYEmbeddable.IsStaged == false

				&& deletedZEmbeddable == null
			);
		});

		test("Creating a new embeddable without ID creates non-saved, staged, embeddable with random ID", async assert => {
			let newEmbeddable = await dataProvider.createEmbeddable({});
			let newSavedEmbeddable = await dataProvider.getEmbeddable({ id: newEmbeddable.Id });
			let revertResult = await dataProvider.revertEmbeddable({ id: newEmbeddable.Id });

			assert(newEmbeddable.Id.length > 0
				&& newEmbeddable.State == 'NotPersisted'
				&& newEmbeddable.IsStaged == false

				&& newSavedEmbeddable == null

				&& revertResult.reverted == true
				&& revertResult.revertedEmbeddable == null
				&& revertResult.stagedEmbeddables.length == 0
				);
		});

		test("Creating a new embeddable with ID creates non-saved, staged, embeddable with specific ID", async assert => {
			let newEmbeddable = await dataProvider.createEmbeddable({ id: testNewId });
			let newSavedEmbeddable = await dataProvider.getEmbeddable({ id: testNewId });
			let revertResult = await dataProvider.revertEmbeddable({ id: testNewId });

			assert(newEmbeddable.Id.length > 0
				&& newEmbeddable.State == 'NotPersisted'
				&& newEmbeddable.IsStaged == false
				&& newEmbeddable.Id == testNewId

				&& newSavedEmbeddable == null

				&& revertResult.reverted == true
				&& revertResult.revertedEmbeddable == null
				&& revertResult.stagedEmbeddables.length == 0
				);
		});

		test("Creating a new embeddable with provider in non-dev mode creates non-saved, staged, embeddable without provider", async assert => {
			let newEmbeddable = await dataProvider.createEmbeddable({ id: testNewId, factoryDefaultProviderId: testProviderId });
			let newSavedEmbeddable = await dataProvider.getEmbeddable({ id: testNewId });
			let revertResult = await dataProvider.revertEmbeddable({ id: testNewId });

			assert(newEmbeddable.Id.length > 0
				&& newEmbeddable.State == 'NotPersisted'
				&& newEmbeddable.IsStaged == false
				&& newEmbeddable.Id == testNewId
				&& newEmbeddable.FactoryDefaultProviderId === null

				&& newSavedEmbeddable == null

				&& revertResult.reverted == true
				&& revertResult.revertedEmbeddable == null
				&& revertResult.stagedEmbeddables.length == 0
				);
		});

		test("Cloning an embeddable creates a custom, staged, embeddable with random new embeddable id and incremented name", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId });
			let clonedEmbeddable = await dataProvider.getEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			await dataProvider.deleteEmbeddable({ id: clonedEmbeddable.Id });
			await dataProvider.publishEmbeddable({ id: clonedEmbeddable.Id });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& cloneResult.clonedEmbeddable.Id != embeddableAId
				&& cloneResult.clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& cloneResult.clonedEmbeddable.Description == defaultEmbeddableADescription
				&& cloneResult.clonedEmbeddable.State == 'Custom'
				&& cloneResult.clonedEmbeddable.IsFactoryDefault == false
				&& cloneResult.clonedEmbeddable.IsStaged == true

				&& cloneResult.clonedEmbeddable.Files.length > 0

				&& cloneResult.clonedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& cloneResult.stagedEmbeddables.length == 1

				&& clonedEmbeddable.Id != embeddableAId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.Description == defaultEmbeddableADescription
				&& clonedEmbeddable.State == 'Custom'
				&& clonedEmbeddable.IsFactoryDefault == false
				&& clonedEmbeddable.IsStaged == true

				&& clonedEmbeddable.Files.length > 0

				&& clonedEmbeddable.Files.length == originalEmbeddable.Files.length
			);
		});

		test("Cloning an embeddable with specific ID creates a custom, staged, embeddable with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId, newId: newId });
			let clonedEmbeddable = await dataProvider.getEmbeddable({ id: newId });
			await dataProvider.deleteEmbeddable({ id: newId });
			await dataProvider.publishEmbeddable({ id: newId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& cloneResult.clonedEmbeddable.Id == newId
				&& cloneResult.clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.Id == newId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
			);
		});

		test("Publishing a cloned embeddable publishes", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId });
			let publishResult = await dataProvider.publishEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let clonedEmbeddable = await dataProvider.getEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			await dataProvider.deleteEmbeddable({ id: clonedEmbeddable.Id });
			await dataProvider.publishEmbeddable({ id: clonedEmbeddable.Id });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& publishResult.publishedEmbeddable.Id != embeddableAId
				&& publishResult.publishedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& publishResult.publishedEmbeddable.Description == defaultEmbeddableADescription
				&& publishResult.publishedEmbeddable.State == 'Custom'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& publishResult.publishedEmbeddable.Files.length > 0

				&& publishResult.publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& publishResult.stagedEmbeddables.length == 0

				&& clonedEmbeddable.Id != embeddableAId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.Description == defaultEmbeddableADescription
				&& clonedEmbeddable.State == 'Custom'
				&& clonedEmbeddable.IsFactoryDefault == false
				&& clonedEmbeddable.IsStaged == false

				&& clonedEmbeddable.Files.length > 0

				&& clonedEmbeddable.Files.length == originalEmbeddable.Files.length
			);
		});

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId });
			let publishResult = await dataProvider.publishEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let deleteResult = await dataProvider.deleteEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let embeddable = await dataProvider.getEmbeddable({ id: cloneResult.clonedEmbeddable.Id });

			assert(publishResult.publishedEmbeddable !== null
				&& embeddable == null);
		})

		test("Getting an embeddable file gets file", async assert => {
			let file = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			assert(file.Name == testFileName);
		});

		test("Saving a file saves file and sets embeddable into staged state", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmbeddableFile.Content == 'new file content'

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& savedEmbeddable.Files.length > 0);
		});

		test("Saving a file multiple times saves file and sets embeddable into staged state", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult0 = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content 2' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmbeddableFile.Content == 'new file content 2'

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& savedEmbeddable.Files.length > 0);
		});

		test("Reverting an embeddable with a saved file reverts both", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& revertedEmbeddableFile.Content === originalEmbeddableFile.Content

				&& revertedEmbeddable.Id == embeddableAId
				&& revertedEmbeddable.State == 'FactoryDefault'

				&& revertedEmbeddable.Files.length > 0);
		})

		test("Publishing an embeddable with saved file publishes both", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let publishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });

			let publishedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let publishedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });

			let deletedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& publishedEmbeddableFile.Content == 'new content'

				&& publishedEmbeddable.Id == embeddableAId
				&& publishedEmbeddable.State == 'CustomizedDefault'
				&& publishedEmbeddable.IsFactoryDefault == false
				&& publishedEmbeddable.IsStaged == false

				&& publishedEmbeddable.Files.length > 0
			);
		});

		test("Deleting a published customization of default embeddable reverts embeddable and edited file", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let publishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });

			let publishedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let publishedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });

			let deletedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& deletedEmbeddableFile.Content === originalEmbeddableFile.Content

				&& deletedEmbeddable.Id == embeddableAId
				&& deletedEmbeddable.State == 'FactoryDefault'

				&& deletedEmbeddable.Files.length > 0
			);
		});

		test("Getting non-staged version of otherwise staged embeddable file gets non-staged version", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let nonStagedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName, staged: false });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddableFile.Content != 'new content'
				&& savedEmbeddableFile.Content == 'new content'
				&& nonStagedEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default embeddable file gets fac default version", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let facDefaultEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName, factoryDefault: true });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddableFile.Content != 'new content'
				&& savedEmbeddableFile.Content == 'new content'
				&& facDefaultEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Restoring a deleted file from non-staging restores it and its metadata", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let restoreResult = await dataProvider.restoreEmbeddableFile({ id: embeddableAId, name: testFileName });
			let restoredEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let restoredEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddableFile == null

				&& restoreResult.stagedEmbeddables.length == 1
				&& restoreResult.embeddable.Files.length == originalEmbeddable.Files.length
				&& restoreResult.embeddable.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmbeddableFile.Content == originalEmbeddableFile.Content
				&& restoredEmbeddable.Files.length == originalEmbeddable.Files.length
				&& restoredEmbeddable.Files.find(s => s.Name == testFileName) != null
				&& restoredEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Restoring a deleted file from fac default restores it and its metadata", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let publishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });

			let restoreResult = await dataProvider.restoreEmbeddableFile({ id: embeddableAId, name: testFileName });
			let restoredEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let restoredEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult2 = await dataProvider.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult2 = await dataProvider.publishEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddableFile == null

				&& restoreResult.stagedEmbeddables.length == 1
				&& restoreResult.embeddable.Files.length == originalEmbeddable.Files.length
				&& restoreResult.embeddable.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmbeddableFile.Content == originalEmbeddableFile.Content
				&& restoredEmbeddable.Files.length == originalEmbeddable.Files.length
				&& restoredEmbeddable.Files.find(s => s.Name == testFileName) != null
				&& restoredEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Deleting a file from a default embeddable sets embeddable to staged with removed file", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deleteResult = await dataProvider.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deletedEmbeddable.Files.find(s => s.Name == testFileName) == null
				&& deletedEmbeddable.State == 'CustomizedDefault'
				&& deletedEmbeddable.IsFactoryDefault == false
				&& deletedEmbeddable.IsStaged == true

				&& deletedEmbeddableFile == null
			);
		});

		test("Reverting file deletion from staged embeddable sets embeddable back to factory default", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deleteResult = await dataProvider.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deletedEmbeddable.Files.find(s => s.Name == testFileName) == null
				&& deletedEmbeddable.State == 'CustomizedDefault'
				&& deletedEmbeddable.IsFactoryDefault == false
				&& deletedEmbeddable.IsStaged == true

				&& deletedEmbeddableFile == null

				&& revertResult.stagedEmbeddables.length == 0
				&& revertResult.revertedEmbeddable.IsStaged == false
				&& revertResult.revertedEmbeddable.Files.length == originalEmbeddable.Files.length
				&& revertResult.revertedEmbeddable.Files.find(s => s.Name == testFileName) != null

				&& revertedEmbeddable.IsStaged == false
				&& revertedEmbeddable.Files.length == originalEmbeddable.Files.length
				&& revertedEmbeddable.Files.find(s => s.Name == testFileName) != null

				&& revertedEmbeddableFile !== null
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, newName: 'newname.jsm' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: 'newname.jsm' });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalEmbeddable.Files.filter(s => s.Name == testFileName).length == 1

				&& originalEmbeddable.Files.length == savedEmbeddable.Files.length

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true
				&& savedEmbeddable.Files.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedEmbeddable.Files.filter(s => s.Name == testFileName).length == 0

				&& savedEmbeddableFile.Name == 'newname.jsm'
				&& originalEmbeddableFile.Content == savedEmbeddableFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.createEmbeddableFile({ id: embeddableAId });

			assert(saveResult
				&& saveResult.Id == embeddableAId
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.EmbeddableName == originalEmbeddable.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalEmbeddable.Files.length
			);
		});

		test("Saving a new file saves file and sets embeddable into staged state", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: 'newfile.jsm', content: 'content' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: 'newfile.jsm' });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& savedEmbeddableFile.Content == 'content'

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true
				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length + 1

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
				globallyMergeDuplicates: false //,
				//onTaskBegin: id => { log.push('onTaskBegin: ' + id); },
				//onTaskDone: id => { log.push('onTaskDone: ' + id); },
				//onTaskFail: id => { log.push('onTaskFail: ' + id); }
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

		test("Listing embeddables should list all embeddables", async assert => {
			let embeddables = (await dataModel.listEmbeddables()).embeddables;
			assert(embeddables.length === defaultEmbeddablesLength);
		});

		test("Listing embeddables by staged: true should only return staged embeddables", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataModel.listEmbeddables({ staged: true })).embeddables;
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == 1
				&& embeddables[0].Description == 'x'
				&& embeddables[0].State == 'CustomizedDefault'
				&& embeddables[0].IsFactoryDefault == false
				&& embeddables[0].IsStaged == true);
		});

		test("Listing embeddables by staged: false should return non-staged embeddables as well as the published version of currently-staged embeddables", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataModel.listEmbeddables({ staged: false })).embeddables;
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == defaultEmbeddablesLength

				&& embeddables[0].Description == defaultEmbeddableADescription
				&& embeddables[0].State == 'CustomizedDefault'
				&& embeddables[0].IsFactoryDefault == true
				&& embeddables[0].IsStaged == false

				&& embeddables[1].Description == defaultEmbeddableBDescription
				&& embeddables[1].State == 'FactoryDefault'
				&& embeddables[1].IsFactoryDefault == true
				&& embeddables[1].IsStaged == false);
		});

		test("Listing embeddables by state: 'FactoryDefault' should only return embeddables which are currently in a Factory Default State", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataModel.listEmbeddables({ state: 'FactoryDefault' })).embeddables;
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == defaultEmbeddablesLength - 1
				&& embeddables[0].State == 'FactoryDefault');
		});

		test("Listing embeddables by state: 'CustomizedDefault' should return only embeddables which are currently in a CustomizedDefault State", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataModel.listEmbeddables({ state: 'CustomizedDefault' })).embeddables;
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == 1
				&& embeddables[0].State == 'CustomizedDefault');
		});

		test("Listing embeddables by state: 'Custom' should only return embeddables which are currently in a Custom State", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataModel.listEmbeddables({ state: 'Custom' })).embeddables;
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == 0);
		});

		test("Listing embeddables by provider should only return embeddables which match", async assert => {
			let testAEmbeddables = (await dataModel.listEmbeddables({ factoryDefaultProviderId: testProviderId })).embeddables;
			let coreEmbeddables = (await dataModel.listEmbeddables({ factoryDefaultProviderId: coreProviderId })).embeddables;
			assert(testAEmbeddables.length == testProviderEmbeddablesLength && coreEmbeddables.length == (defaultEmbeddablesLength - testProviderEmbeddablesLength)
				&& testAEmbeddables[0].FactoryDefaultProviderId == testProviderId);
		});

		test("Getting an embeddable returns embeddable", async assert => {
			let embeddable = await dataModel.getEmbeddable({ id: embeddableAId, });
			assert(embeddable.Id == embeddableAId);
		});

		test("Getting an embeddable returns embeddable with provider", async assert => {
			let embeddable = await dataModel.getEmbeddable({ id: embeddableAId, });
			assert(embeddable.Id == embeddableAId && embeddable.FactoryDefaultProviderName.length > 0);
		});

		test("Getting an embeddable returns latest version of embeddable", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataModel.getEmbeddable({ id: embeddableAId, });
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.State == 'CustomizedDefault'
				&& embeddable.IsFactoryDefault == false
				&& embeddable.IsStaged == true);
		});

		test("Getting an embeddable with staged: false should return non-staged version of embeddable", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataModel.getEmbeddable({ id: embeddableAId, staged: false });
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == defaultEmbeddableADescription
				&& embeddable.State == 'CustomizedDefault' // to know that this is a cutomized embeddable but currently viewing fac default version
				&& embeddable.IsFactoryDefault == true
				&& embeddable.IsStaged == false);
		});


		test("Getting an embeddable with staged: true should return staged version of embeddable", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataModel.getEmbeddable({ id: embeddableAId, staged: true });
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == 'x'
				&& embeddable.State == 'CustomizedDefault' // to know that this is a cutomized embeddable but currently viewing fac default version
				&& embeddable.IsFactoryDefault == false
				&& embeddable.IsStaged == true);
		});

		test("Getting an embeddable with factoryDefault: true should return factory default version of embeddable", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataModel.getEmbeddable({ id: embeddableAId, factoryDefault: true });
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == defaultEmbeddableADescription
				&& embeddable.State == 'CustomizedDefault' // to know that this is a cutomized embeddable but currently viewing fac default version
				&& embeddable.IsFactoryDefault == true
				&& embeddable.IsStaged == false);
		});

		test("Getting an embeddable with factoryDefault: false should return non-factory default version of embeddable", async assert => {
			await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataModel.getEmbeddable({ id: embeddableAId, factoryDefault: false });
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == 'x'
				&& embeddable.State == 'CustomizedDefault' // to know that this is a cutomized embeddable but currently viewing fac default version
				&& embeddable.IsFactoryDefault == false
				&& embeddable.IsStaged == true);
		});

		test("Saving a default embeddable saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let savedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.Description == 'x'
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length > 0
				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length);
		});

		test("Saving a default embeddable multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult0 = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'y' });
			let saveResult2 = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'z' });
			let savedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId  });
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.Description == 'z'
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length > 0
				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length);
		});

		test("Saving a default embeddable saves and returns saved embeddable and list of staged", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			await dataModel.revertEmbeddable({ id: embeddableAId })
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedEmbeddable.Id == embeddableAId
				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == false
				&& saveResult.savedEmbeddable.IsStaged == true

				&& saveResult.savedEmbeddable.Files.length > 0

				&& saveResult.savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& saveResult.stagedEmbeddables.length == 1

				&& saveResult.stagedEmbeddables[0].Id == embeddableAId
				&& saveResult.stagedEmbeddables[0].Description == 'x'
				&& saveResult.stagedEmbeddables[0].State == 'CustomizedDefault'
				&& saveResult.stagedEmbeddables[0].IsFactoryDefault == false
				&& saveResult.stagedEmbeddables[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default embeddable reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.savedEmbeddable.Id == embeddableAId
				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == false
				&& saveResult.savedEmbeddable.IsStaged == true

				&& saveResult.savedEmbeddable.Files.length > 0

				&& saveResult.savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& revertResult.revertedEmbeddable.Id == embeddableAId
				&& revertResult.revertedEmbeddable.Description == defaultEmbeddableADescription
				&& revertResult.revertedEmbeddable.State == 'FactoryDefault'
				&& revertResult.revertedEmbeddable.IsFactoryDefault == true
				&& revertResult.revertedEmbeddable.IsStaged == false

				&& revertResult.revertedEmbeddable.Files.length > 0
				&& revertResult.revertedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& revertedEmbeddable.Id == embeddableAId

				&& revertedEmbeddable.Description == defaultEmbeddableADescription
				&& revertedEmbeddable.State == 'FactoryDefault'
				&& revertedEmbeddable.IsFactoryDefault == true
				&& revertedEmbeddable.IsStaged == false

				&& revertedEmbeddable.Files.length > 0

				&& revertedEmbeddable.Files.length == originalEmbeddable.Files.length
				);
		});

		test("Reverting multiple embeddables reverts multiple embeddables", async assert => {
			let originalEmbeddable0 = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddable1 = await dataModel.getEmbeddable({ id: embeddableBId });
			let originalEmbeddable2 = await dataModel.getEmbeddable({ id: embeddableCId });

			let saveResult0 = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataModel.saveEmbeddable({ id: embeddableBId, description: 'y' });
			let saveResult2 = await dataModel.saveEmbeddable({ id: embeddableCId, description: 'z' });

			let revertResult = await dataModel.revertEmbeddables({ embeddables: [
				{ id: embeddableAId },
				{ id: embeddableBId },
				{ id: embeddableCId },
			]});

			let revertedEmbeddable0 = await dataModel.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddable1 = await dataModel.getEmbeddable({ id: embeddableBId });
			let revertedEmbeddable2 = await dataModel.getEmbeddable({ id: embeddableCId });

			assert(originalEmbeddable0.Description == defaultEmbeddableADescription
				&& originalEmbeddable0.State == 'FactoryDefault'
				&& originalEmbeddable0.IsFactoryDefault == true
				&& originalEmbeddable0.IsStaged == false

				&& originalEmbeddable1.Description == defaultEmbeddableBDescription
				&& originalEmbeddable1.State == 'FactoryDefault'
				&& originalEmbeddable1.IsFactoryDefault == true
				&& originalEmbeddable1.IsStaged == false

				&& originalEmbeddable2.Description == defaultEmbeddableCDescription
				&& originalEmbeddable2.State == 'FactoryDefault'
				&& originalEmbeddable2.IsFactoryDefault == true
				&& originalEmbeddable2.IsStaged == false

				&& saveResult0.savedEmbeddable.Description == 'x'
				&& saveResult0.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult0.savedEmbeddable.IsFactoryDefault == false
				&& saveResult0.savedEmbeddable.IsStaged == true

				&& saveResult1.savedEmbeddable.Description == 'y'
				&& saveResult1.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult1.savedEmbeddable.IsFactoryDefault == false
				&& saveResult1.savedEmbeddable.IsStaged == true

				&& saveResult2.savedEmbeddable.Description == 'z'
				&& saveResult2.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult2.savedEmbeddable.IsFactoryDefault == false
				&& saveResult2.savedEmbeddable.IsStaged == true

				&& revertResult.stagedEmbeddables.length == 0

				&& revertedEmbeddable0.Description == defaultEmbeddableADescription
				&& revertedEmbeddable0.State == 'FactoryDefault'
				&& revertedEmbeddable0.IsFactoryDefault == true
				&& revertedEmbeddable0.IsStaged == false

				&& revertedEmbeddable1.Description == defaultEmbeddableBDescription
				&& revertedEmbeddable1.State == 'FactoryDefault'
				&& revertedEmbeddable1.IsFactoryDefault == true
				&& revertedEmbeddable1.IsStaged == false

				&& revertedEmbeddable2.Description == defaultEmbeddableCDescription
				&& revertedEmbeddable2.State == 'FactoryDefault'
				&& revertedEmbeddable2.IsFactoryDefault == true
				&& revertedEmbeddable2.IsStaged == false
				);
		});

		test("Deleting a published customized default stages reversion to factory default", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let publishResult = await dataModel.publishEmbeddable({ id: embeddableAId });
			let deleteResult = await dataModel.deleteEmbeddable({ id: embeddableAId });
			let stagedDeletedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataModel.publishEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == false
				&& saveResult.savedEmbeddable.IsStaged == true

				&& publishResult.publishedEmbeddable.Description == 'x'
				&& publishResult.publishedEmbeddable.State == 'CustomizedDefault'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'FactoryDefault'
				&& deleteResult.embeddable.IsFactoryDefault == true
				&& deleteResult.embeddable.IsStaged == true

				&& stagedDeletedEmbeddable.Description == defaultEmbeddableADescription
				&& stagedDeletedEmbeddable.State == 'FactoryDefault'
				&& stagedDeletedEmbeddable.IsFactoryDefault == true
				&& stagedDeletedEmbeddable.IsStaged == true
				);
		});

		test("Reverting a staged deletion of customized default restores customized default", async assert => {

			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let publishResult = await dataModel.publishEmbeddable({ id: embeddableAId });
			let deleteResult = await dataModel.deleteEmbeddable({ id: embeddableAId });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });

			let realDeleteResult = await dataModel.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataModel.publishEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'CustomizedDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == false
				&& saveResult.savedEmbeddable.IsStaged == true

				&& publishResult.publishedEmbeddable.Description == 'x'
				&& publishResult.publishedEmbeddable.State == 'CustomizedDefault'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'FactoryDefault'
				&& deleteResult.embeddable.IsFactoryDefault == true
				&& deleteResult.embeddable.IsStaged == true

				&& revertResult.revertedEmbeddable.Description == 'x'
				&& revertResult.revertedEmbeddable.State == 'CustomizedDefault'
				&& revertResult.revertedEmbeddable.IsFactoryDefault == false
				&& revertResult.revertedEmbeddable.IsStaged == false
				);
		})

		test("Deleting a published custom stages deletion", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataModel.cloneEmbeddable({ id: embeddableAId, newId: testNewId });
			let publishResult = await dataModel.publishEmbeddable({ id: testNewId });
			let deleteResult = await dataModel.deleteEmbeddable({ id: testNewId });
			let stagedDeletedEmbeddable = await dataModel.getEmbeddable({ id: testNewId });
			let deletePublishResult = await dataModel.publishEmbeddable({ id: testNewId });

			assert(originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.IsDeleted == false

				&& cloneResult.clonedEmbeddable.Description == defaultEmbeddableADescription
				&& cloneResult.clonedEmbeddable.State == 'Custom'
				&& cloneResult.clonedEmbeddable.IsFactoryDefault == false
				&& cloneResult.clonedEmbeddable.IsStaged == true
				&& cloneResult.clonedEmbeddable.IsDeleted == false

				&& publishResult.publishedEmbeddable.Description == defaultEmbeddableADescription
				&& publishResult.publishedEmbeddable.State == 'Custom'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false
				&& publishResult.publishedEmbeddable.IsDeleted == false

				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'Custom'
				&& deleteResult.embeddable.IsFactoryDefault == false
				&& deleteResult.embeddable.IsDeleted == true
				&& deleteResult.embeddable.IsStaged == true

				&& stagedDeletedEmbeddable.Description == defaultEmbeddableADescription
				&& stagedDeletedEmbeddable.State == 'Custom'
				&& stagedDeletedEmbeddable.IsFactoryDefault == false
				&& stagedDeletedEmbeddable.IsDeleted == true
				&& stagedDeletedEmbeddable.IsStaged == true
				);

		});

		test("Reverting a staged custom deletion restores custom", async assert => {

			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataModel.cloneEmbeddable({ id: embeddableAId, newId: testNewId });
			let publishResult = await dataModel.publishEmbeddable({ id: testNewId });

			let deleteResult = await dataModel.deleteEmbeddable({ id: testNewId });
			let revertResult = await dataModel.revertEmbeddable({ id: testNewId });

			let realDeleteResult = await dataModel.deleteEmbeddable({ id: testNewId });
			let deletePublishResult = await dataModel.publishEmbeddable({ id: testNewId });

			assert(originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.IsDeleted == false

				&& cloneResult.clonedEmbeddable.Description == defaultEmbeddableADescription
				&& cloneResult.clonedEmbeddable.State == 'Custom'
				&& cloneResult.clonedEmbeddable.IsFactoryDefault == false
				&& cloneResult.clonedEmbeddable.IsStaged == true
				&& cloneResult.clonedEmbeddable.IsDeleted == false

				&& publishResult.publishedEmbeddable.Description == defaultEmbeddableADescription
				&& publishResult.publishedEmbeddable.State == 'Custom'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false
				&& publishResult.publishedEmbeddable.IsDeleted == false

				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'Custom'
				&& deleteResult.embeddable.IsFactoryDefault == false
				&& deleteResult.embeddable.IsDeleted == true
				&& deleteResult.embeddable.IsStaged == true

				&& revertResult.revertedEmbeddable.Description == defaultEmbeddableADescription
				&& revertResult.revertedEmbeddable.State == 'Custom'
				&& revertResult.revertedEmbeddable.IsFactoryDefault == false
				&& revertResult.revertedEmbeddable.IsStaged == false
				&& revertResult.revertedEmbeddable.IsDeleted == false
				);

		});

		test("Publishing a saved change to a default embeddable saves and sets it into a published, customized default, state and saves files too", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let publishResult = await dataModel.publishEmbeddable({ id: embeddableAId });
			let publishedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			await dataModel.deleteEmbeddable({ id: embeddableAId })
			await dataModel.publishEmbeddable({ id: embeddableAId });
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& publishedEmbeddable.Id == embeddableAId
				&& publishedEmbeddable.Description == 'x'
				&& publishedEmbeddable.State == 'CustomizedDefault'
				&& publishedEmbeddable.IsFactoryDefault == false
				&& publishedEmbeddable.IsStaged == false

				&& publishedEmbeddable.Files.length > 0

				&& publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& publishResult.publishedEmbeddable.Id == embeddableAId
				&& publishResult.publishedEmbeddable.Description == 'x'
				&& publishResult.publishedEmbeddable.State == 'CustomizedDefault'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& publishResult.publishedEmbeddable.Files.length > 0

				&& publishResult.publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& publishResult.stagedEmbeddables.length == 0
				);
		});

		test("Publishing multiple embeddables publishes multiple embeddables", async assert => {
			let originalEmbeddable0 = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddable1 = await dataModel.getEmbeddable({ id: embeddableBId });
			let originalEmbeddable2 = await dataModel.getEmbeddable({ id: embeddableCId });

			let saveResult0 = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataModel.saveEmbeddable({ id: embeddableBId, description: 'y' });
			let saveResult2 = await dataModel.saveEmbeddable({ id: embeddableCId, description: 'z' });

			let publishResult = await dataModel.publishEmbeddables({ embeddables: [
				{ id: embeddableAId },
				{ id: embeddableBId },
				{ id: embeddableCId },
			]});

			let publishedEmbeddable0 = await dataModel.getEmbeddable({ id: embeddableAId });
			let publishedEmbeddable1 = await dataModel.getEmbeddable({ id: embeddableBId });
			let publishedEmbeddable2 = await dataModel.getEmbeddable({ id: embeddableCId });

			await dataModel.deleteEmbeddable({ id: embeddableAId });
			await dataModel.deleteEmbeddable({ id: embeddableBId });
			await dataModel.deleteEmbeddable({ id: embeddableCId });
			await dataModel.publishEmbeddable({ id: embeddableAId });
			await dataModel.publishEmbeddable({ id: embeddableBId });
			await dataModel.publishEmbeddable({ id: embeddableCId });

			assert(originalEmbeddable0.Description == defaultEmbeddableADescription
				&& originalEmbeddable0.State == 'FactoryDefault'
				&& originalEmbeddable0.IsFactoryDefault == true
				&& originalEmbeddable0.IsStaged == false

				&& originalEmbeddable1.Description == defaultEmbeddableBDescription
				&& originalEmbeddable1.State == 'FactoryDefault'
				&& originalEmbeddable1.IsFactoryDefault == true
				&& originalEmbeddable1.IsStaged == false

				&& originalEmbeddable2.Description == defaultEmbeddableCDescription
				&& originalEmbeddable2.State == 'FactoryDefault'
				&& originalEmbeddable2.IsFactoryDefault == true
				&& originalEmbeddable2.IsStaged == false

				&& publishResult.stagedEmbeddables.length == 0

				&& publishedEmbeddable0.Description == 'x'
				&& publishedEmbeddable0.State == 'CustomizedDefault'
				&& publishedEmbeddable0.IsFactoryDefault == false
				&& publishedEmbeddable0.IsStaged == false

				&& publishedEmbeddable1.Description == 'y'
				&& publishedEmbeddable1.State == 'CustomizedDefault'
				&& publishedEmbeddable1.IsFactoryDefault == false
				&& publishedEmbeddable1.IsStaged == false

				&& publishedEmbeddable2.Description == 'z'
				&& publishedEmbeddable2.State == 'CustomizedDefault'
				&& publishedEmbeddable2.IsFactoryDefault == false
				&& publishedEmbeddable2.IsStaged == false
				);
		});

		test("Deleting a published, customized default embeddable reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let publishResult = await dataModel.publishEmbeddable({ id: embeddableAId });
			let deleteResult = await dataModel.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataModel.publishEmbeddable({ id: embeddableAId });
			let deletedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& deleteResult.embeddable.Id == embeddableAId
				&& deleteResult.embeddable.Description == defaultEmbeddableADescription
				&& deleteResult.embeddable.State == 'FactoryDefault'
				&& deleteResult.embeddable.IsFactoryDefault == true
				&& deleteResult.embeddable.IsStaged == true
				&& deleteResult.embeddable.IsReverted == true
				&& deleteResult.embeddable.IsDeleted == false

				&& deletePublishResult.publishedEmbeddable.Id == embeddableAId
				&& deletePublishResult.publishedEmbeddable.Description == defaultEmbeddableADescription
				&& deletePublishResult.publishedEmbeddable.State == 'FactoryDefault'
				&& deletePublishResult.publishedEmbeddable.IsFactoryDefault == true
				&& deletePublishResult.publishedEmbeddable.IsStaged == false

				&& deletePublishResult.publishedEmbeddable.Files.length > 0

				&& deletePublishResult.publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& deletedEmbeddable.Id == embeddableAId
				&& deletedEmbeddable.Description == defaultEmbeddableADescription
				&& deletedEmbeddable.State == 'FactoryDefault'
				&& deletedEmbeddable.IsFactoryDefault == true
				&& deletedEmbeddable.IsStaged == false

				&& deletedEmbeddable.Files.length > 0

				&& deletedEmbeddable.Files.length == originalEmbeddable.Files.length
				);
		});

		test("Deleting multiple embeddables at different states deletes and/or reverts multiple embeddables", async assert => {
			// 3 types of states: staged customized default, published customized default, published custom
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let embeddableASaveResult = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let embeddableBSaveResult = await dataModel.saveEmbeddable({ id: embeddableBId, description: 'y' });
			let embeddableBPublishResult = await dataModel.publishEmbeddable({ id: embeddableBId });
			let embeddableCCloneResult = await dataModel.cloneEmbeddable({ id: embeddableCId, newId: newId });
			let embeddableCClonePublishResult = await dataModel.publishEmbeddable({ id: newId });

			let stagedXEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let publishedYEmbeddable = await dataModel.getEmbeddable({ id: embeddableBId });
			let clonedZEmbeddable = await dataModel.getEmbeddable({ id: newId });

			let deleteResult = await dataModel.deleteEmbeddables({ embeddables: [
				{ id: embeddableAId },
				{ id: embeddableBId },
				{ id: newId }
			]});
			let deletePublishResult = await dataModel.publishEmbeddables({ embeddables: [
				{ id: embeddableAId },
				{ id: embeddableBId },
				{ id: newId }
			]});

			let deletedXEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let deletedYEmbeddable = await dataModel.getEmbeddable({ id: embeddableBId });
			let deletedZEmbeddable = await dataModel.getEmbeddable({ id: newId });

			assert(stagedXEmbeddable.Description == 'x'
				&& stagedXEmbeddable.State == 'CustomizedDefault'
				&& stagedXEmbeddable.IsFactoryDefault == false
				&& stagedXEmbeddable.IsStaged == true

				&& publishedYEmbeddable.Description == 'y'
				&& publishedYEmbeddable.State == 'CustomizedDefault'
				&& publishedYEmbeddable.IsFactoryDefault == false
				&& publishedYEmbeddable.IsStaged == false

				&& clonedZEmbeddable.State == 'Custom'
				&& clonedZEmbeddable.IsFactoryDefault == false
				&& clonedZEmbeddable.IsStaged == false

				&& deleteResult.stagedEmbeddables.length == 2
				&& deleteResult.revertedEmbeddables.length == 1
				&& deleteResult.stagedEmbeddables[0].Id == embeddableBId
				&& deleteResult.stagedEmbeddables[0].IsDeleted == false
				&& deleteResult.stagedEmbeddables[0].IsReverted == true
				&& deleteResult.stagedEmbeddables[1].Id == newId
				&& deleteResult.stagedEmbeddables[1].IsDeleted == true
				&& deleteResult.stagedEmbeddables[1].IsReverted == true
				&& deleteResult.revertedEmbeddables[0].Id == embeddableAId

				&& deletePublishResult.deletedEmbeddables.length == 1
				&& deletePublishResult.revertedEmbeddables.length == 1
				&& deletePublishResult.deletedEmbeddables[0].Id == newId
				&& deletePublishResult.revertedEmbeddables[0].Id == embeddableBId

				&& deletedXEmbeddable.Description == defaultEmbeddableADescription
				&& deletedXEmbeddable.State == 'FactoryDefault'
				&& deletedXEmbeddable.IsFactoryDefault == true
				&& deletedXEmbeddable.IsStaged == false

				&& deletedYEmbeddable.Description == defaultEmbeddableBDescription
				&& deletedYEmbeddable.State == 'FactoryDefault'
				&& deletedYEmbeddable.IsFactoryDefault == true
				&& deletedYEmbeddable.IsStaged == false

				&& deletedZEmbeddable == null
			);
		});

		test("Creating a new embeddable without ID creates non-saved, staged, embeddable with random ID", async assert => {
			let newEmbeddable = await dataModel.createEmbeddable({});
			let newSavedEmbeddable = await dataModel.getEmbeddable({ id: newEmbeddable.Id });
			let revertResult = await dataModel.revertEmbeddable({ id: newEmbeddable.Id });

			assert(newEmbeddable.Id.length > 0
				&& newEmbeddable.State == 'NotPersisted'
				&& newEmbeddable.IsStaged == false

				&& newSavedEmbeddable == null

				&& revertResult.reverted == true
				&& revertResult.revertedEmbeddable == null
				&& revertResult.stagedEmbeddables.length == 0
				);
		});

		test("Creating a new embeddable with ID creates non-saved, staged, embeddable with specific ID", async assert => {
			let newEmbeddable = await dataModel.createEmbeddable({ id: testNewId });
			let newSavedEmbeddable = await dataModel.getEmbeddable({ id: testNewId });
			let revertResult = await dataModel.revertEmbeddable({ id: testNewId });

			assert(newEmbeddable.Id.length > 0
				&& newEmbeddable.State == 'NotPersisted'
				&& newEmbeddable.IsStaged == false
				&& newEmbeddable.Id == testNewId

				&& newSavedEmbeddable == null

				&& revertResult.reverted == true
				&& revertResult.revertedEmbeddable == null
				&& revertResult.stagedEmbeddables.length == 0
				);
		});

		test("Creating a new embeddable with provider in non-dev mode creates non-saved, staged, embeddable without provider", async assert => {
			let newEmbeddable = await dataModel.createEmbeddable({ id: testNewId, factoryDefaultProviderId: testProviderId });
			let newSavedEmbeddable = await dataModel.getEmbeddable({ id: testNewId });
			let revertResult = await dataModel.revertEmbeddable({ id: testNewId });

			assert(newEmbeddable.Id.length > 0
				&& newEmbeddable.State == 'NotPersisted'
				&& newEmbeddable.IsStaged == false
				&& newEmbeddable.Id == testNewId
				&& newEmbeddable.FactoryDefaultProviderId === null

				&& newSavedEmbeddable == null

				&& revertResult.reverted == true
				&& revertResult.revertedEmbeddable == null
				&& revertResult.stagedEmbeddables.length == 0
				);
		});

		test("Cloning an embeddable creates a custom, staged, embeddable with random new embeddable id and incremented name", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataModel.cloneEmbeddable({ id: embeddableAId });
			let clonedEmbeddable = await dataModel.getEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			await dataModel.deleteEmbeddable({ id: clonedEmbeddable.Id });
			await dataModel.publishEmbeddable({ id: clonedEmbeddable.Id });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& cloneResult.clonedEmbeddable.Id != embeddableAId
				&& cloneResult.clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& cloneResult.clonedEmbeddable.Description == defaultEmbeddableADescription
				&& cloneResult.clonedEmbeddable.State == 'Custom'
				&& cloneResult.clonedEmbeddable.IsFactoryDefault == false
				&& cloneResult.clonedEmbeddable.IsStaged == true

				&& cloneResult.clonedEmbeddable.Files.length > 0

				&& cloneResult.clonedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& cloneResult.stagedEmbeddables.length == 1

				&& clonedEmbeddable.Id != embeddableAId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.Description == defaultEmbeddableADescription
				&& clonedEmbeddable.State == 'Custom'
				&& clonedEmbeddable.IsFactoryDefault == false
				&& clonedEmbeddable.IsStaged == true

				&& clonedEmbeddable.Files.length > 0

				&& clonedEmbeddable.Files.length == originalEmbeddable.Files.length
			);
		});

		test("Cloning an embeddable with specific ID creates a custom, staged, embeddable with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataModel.cloneEmbeddable({ id: embeddableAId, newId: newId });
			let clonedEmbeddable = await dataModel.getEmbeddable({ id: newId });
			await dataModel.deleteEmbeddable({ id: newId });
			await dataModel.publishEmbeddable({ id: newId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& cloneResult.clonedEmbeddable.Id == newId
				&& cloneResult.clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.Id == newId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
			);
		});

		test("Publishing a cloned embeddable publishes", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataModel.cloneEmbeddable({ id: embeddableAId });
			let publishResult = await dataModel.publishEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let clonedEmbeddable = await dataModel.getEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			await dataModel.deleteEmbeddable({ id: clonedEmbeddable.Id });
			await dataModel.publishEmbeddable({ id: clonedEmbeddable.Id });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& publishResult.publishedEmbeddable.Id != embeddableAId
				&& publishResult.publishedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& publishResult.publishedEmbeddable.Description == defaultEmbeddableADescription
				&& publishResult.publishedEmbeddable.State == 'Custom'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == false
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& publishResult.publishedEmbeddable.Files.length > 0

				&& publishResult.publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& publishResult.stagedEmbeddables.length == 0

				&& clonedEmbeddable.Id != embeddableAId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.Description == defaultEmbeddableADescription
				&& clonedEmbeddable.State == 'Custom'
				&& clonedEmbeddable.IsFactoryDefault == false
				&& clonedEmbeddable.IsStaged == false

				&& clonedEmbeddable.Files.length > 0

				&& clonedEmbeddable.Files.length == originalEmbeddable.Files.length
			);
		});

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataModel.cloneEmbeddable({ id: embeddableAId });
			let publishResult = await dataModel.publishEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let deleteResult = await dataModel.deleteEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let deletePublishResult = await dataModel.publishEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let embeddable = await dataModel.getEmbeddable({ id: cloneResult.clonedEmbeddable.Id });

			assert(publishResult.publishedEmbeddable !== null
				&& embeddable == null);
		})

		test("Getting an embeddable file gets file", async assert => {
			let file = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			assert(file.Name == testFileName);
		});

		test("Saving a file saves file and sets embeddable into staged state", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content' });
			let savedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmbeddableFile.Content == 'new file content'

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& savedEmbeddable.Files.length > 0);
		});

		test("Saving a file multiple times saves file and sets embeddable into staged state", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult0 = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content 2' });
			let savedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmbeddableFile.Content == 'new file content 2'

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& savedEmbeddable.Files.length > 0);
		});

		test("Reverting an embeddable with a saved file reverts both", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& revertedEmbeddableFile.Content === originalEmbeddableFile.Content

				&& revertedEmbeddable.Id == embeddableAId
				&& revertedEmbeddable.State == 'FactoryDefault'

				&& revertedEmbeddable.Files.length > 0);
		})

		test("Publishing an embeddable with saved file publishes both", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let saveResult = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let publishResult = await dataModel.publishEmbeddable({ id: embeddableAId });

			let publishedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let publishedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult = await dataModel.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataModel.publishEmbeddable({ id: embeddableAId });

			let deletedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& publishedEmbeddableFile.Content == 'new content'

				&& publishedEmbeddable.Id == embeddableAId
				&& publishedEmbeddable.State == 'CustomizedDefault'
				&& publishedEmbeddable.IsFactoryDefault == false
				&& publishedEmbeddable.IsStaged == false

				&& publishedEmbeddable.Files.length > 0
			);
		});

		test("Deleting a published customization of default embeddable reverts embeddable and edited file", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let saveResult = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let publishResult = await dataModel.publishEmbeddable({ id: embeddableAId });

			let publishedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let publishedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult = await dataModel.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult = await dataModel.publishEmbeddable({ id: embeddableAId });

			let deletedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& deletedEmbeddableFile.Content === originalEmbeddableFile.Content

				&& deletedEmbeddable.Id == embeddableAId
				&& deletedEmbeddable.State == 'FactoryDefault'

				&& deletedEmbeddable.Files.length > 0
			);
		});

		test("Getting non-staged version of otherwise staged embeddable file gets non-staged version", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let savedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let nonStagedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName, staged: false });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddableFile.Content != 'new content'
				&& savedEmbeddableFile.Content == 'new content'
				&& nonStagedEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default embeddable file gets fac default version", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let savedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let facDefaultEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName, factoryDefault: true });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddableFile.Content != 'new content'
				&& savedEmbeddableFile.Content == 'new content'
				&& facDefaultEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Restoring a deleted file from non-staging restores it and its metadata", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult = await dataModel.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let restoreResult = await dataModel.restoreEmbeddableFile({ id: embeddableAId, name: testFileName });
			let restoredEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let restoredEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddableFile == null

				&& restoreResult.stagedEmbeddables.length == 1
				&& restoreResult.embeddable.Files.length == originalEmbeddable.Files.length
				&& restoreResult.embeddable.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmbeddableFile.Content == originalEmbeddableFile.Content
				&& restoredEmbeddable.Files.length == originalEmbeddable.Files.length
				&& restoredEmbeddable.Files.find(s => s.Name == testFileName) != null
				&& restoredEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Restoring a deleted file from fac default restores it and its metadata", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult = await dataModel.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let publishResult = await dataModel.publishEmbeddable({ id: embeddableAId });

			let restoreResult = await dataModel.restoreEmbeddableFile({ id: embeddableAId, name: testFileName });
			let restoredEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let restoredEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult2 = await dataModel.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult2 = await dataModel.publishEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddableFile == null

				&& restoreResult.stagedEmbeddables.length == 1
				&& restoreResult.embeddable.Files.length == originalEmbeddable.Files.length
				&& restoreResult.embeddable.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmbeddableFile.Content == originalEmbeddableFile.Content
				&& restoredEmbeddable.Files.length == originalEmbeddable.Files.length
				&& restoredEmbeddable.Files.find(s => s.Name == testFileName) != null
				&& restoredEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Deleting a file from a default embeddable sets embeddable to staged with removed file", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deleteResult = await dataModel.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deletedEmbeddable.Files.find(s => s.Name == testFileName) == null
				&& deletedEmbeddable.State == 'CustomizedDefault'
				&& deletedEmbeddable.IsFactoryDefault == false
				&& deletedEmbeddable.IsStaged == true

				&& deletedEmbeddableFile == null
			);
		});

		test("Reverting file deletion from staged embeddable sets embeddable back to factory default", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deleteResult = await dataModel.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deletedEmbeddable.Files.find(s => s.Name == testFileName) == null
				&& deletedEmbeddable.State == 'CustomizedDefault'
				&& deletedEmbeddable.IsFactoryDefault == false
				&& deletedEmbeddable.IsStaged == true

				&& deletedEmbeddableFile == null

				&& revertResult.stagedEmbeddables.length == 0
				&& revertResult.revertedEmbeddable.IsStaged == false
				&& revertResult.revertedEmbeddable.Files.length == originalEmbeddable.Files.length
				&& revertResult.revertedEmbeddable.Files.find(s => s.Name == testFileName) != null

				&& revertedEmbeddable.IsStaged == false
				&& revertedEmbeddable.Files.length == originalEmbeddable.Files.length
				&& revertedEmbeddable.Files.find(s => s.Name == testFileName) != null

				&& revertedEmbeddableFile !== null
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: testFileName, newName: 'newname.jsm' });
			let savedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: 'newname.jsm' });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalEmbeddable.Files.filter(s => s.Name == testFileName).length == 1

				&& originalEmbeddable.Files.length == savedEmbeddable.Files.length

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true
				&& savedEmbeddable.Files.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedEmbeddable.Files.filter(s => s.Name == testFileName).length == 0

				&& savedEmbeddableFile.Name == 'newname.jsm'
				&& originalEmbeddableFile.Content == savedEmbeddableFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.createEmbeddableFile({ id: embeddableAId });

			assert(saveResult
				&& saveResult.Id == embeddableAId
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.EmbeddableName == originalEmbeddable.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalEmbeddable.Files.length
			);
		});

		test("Saving a new file saves file and sets embeddable into staged state", async assert => {
			let originalEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataModel.saveEmbeddableFile({ id: embeddableAId, name: 'newfile.jsm', content: 'content' });
			let savedEmbeddable = await dataModel.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataModel.getEmbeddableFile({ id: embeddableAId, name: 'newfile.jsm' });
			let revertResult = await dataModel.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& savedEmbeddableFile.Content == 'content'

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'CustomizedDefault'
				&& savedEmbeddable.IsFactoryDefault == false
				&& savedEmbeddable.IsStaged == true
				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length + 1

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

		// resets customized default and new custom embeddables, returns promise
		function testWithReset(name, fn) {
			if(!fn) {
				test(name);
			} else {
				test(name, async assert=> {
					// clear test subscriptions
					messaging.unsubscribe(testMessageNameSpace);

					// reset test targets
					await dataProvider.deleteEmbeddable({ id: embeddableAId });
					await dataProvider.publishEmbeddable({ id: embeddableAId });

					await dataProvider.deleteEmbeddable({ id: testNewId });
					await dataProvider.publishEmbeddable({ id: testNewId });

					// run test
					await fn(assert);
				});
			}
		}

		testWithReset("Cloning an embeddable should raise embeddable.created", async assert => {
			let subData1;
			messaging.subscribe('me.model.embeddable.created', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneEmbeddable({
				id: embeddableAId,
				newId: testNewId
			});

			assert(
				subData1
				&& subData1.id.id == embeddableAId
				&& subData1.model.Id == testNewId
				&& subData1.model.State == 'Custom'
			);
		});

		testWithReset("Saving an update to an embeddable should raise embeddable.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.embeddable.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmbeddable({
				id: embeddableAId,
				description: 'new description'
			});

			assert(
				subData1 !== null
				&& subData1.id.id == embeddableAId
				&& subData1.model.Description == 'new description'
			);
		});

		testWithReset("Deleting a custom/cloned embeddable should raise embeddable.deleted", async assert => {
			let subData1;
			messaging.subscribe('me.model.embeddable.deleted', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneEmbeddable({
				id: embeddableAId,
				newId: testNewId,
				description: 'new description'
			});

			let deleteResult = await dataModel.deleteEmbeddable({
				id: testNewId
			});
			let deletePublishResult = await dataModel.publishEmbeddable({
				id: testNewId
			});

			assert(subData1
				&& subData1.id.id == testNewId
				&& subData1.model === null
			);
		});

		testWithReset("Deleting a customized default embeddable should revert to fac and raise embeddable.updated instead of delete", async assert => {
			let subData1;
			messaging.subscribe('me.model.embeddable.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmbeddable({
				id: embeddableAId,
				description: 'new-desc'
			});

			let deleteResult = await dataModel.deleteEmbeddable({
				id: embeddableAId
			})
			let deletePublishResult = await dataModel.publishEmbeddable({
				id: embeddableAId
			});

			assert(
				subData1 !== null
				&& subData1.id.id == embeddableAId
				&& subData1.model !== null
				&& subData1.model.Description === defaultEmbeddableADescription
			);
		});

		testWithReset("Publishing an embeddable should raise embeddable.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.embeddable.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmbeddable({
				id: embeddableAId,
				description: 'new-desc'
			});

			let publishResult = await dataModel.publishEmbeddable({
				id: embeddableAId
			})

			assert(
				subData1 !== null
				&& subData1.id.id == embeddableAId
				&& subData1.model.Description == 'new-desc'
				&& subData1.model.IsStaged === false
				&& subData1.model.State === 'CustomizedDefault'
			);
		});

		testWithReset("Reverting a custom embeddable should raise embeddable.deleted", async assert => {
			let subData1;
			messaging.subscribe('me.model.embeddable.deleted', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneEmbeddable({
				id: embeddableAId,
				newId: testNewId,
				description: 'new description'
			});

			let revertResult = await dataModel.revertEmbeddable({
				id: testNewId
			});

			assert(
				subData1
				&& subData1.id.id == testNewId
				&& subData1.model === null
			);
		});

		testWithReset("Reverting a staged customized default embeddable should raise embeddable.updated with default model", async assert => {
			let subData1;
			messaging.subscribe('me.model.embeddable.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmbeddable({
				id: embeddableAId,
				description: 'new-desc'
			});

			let revertResult = await dataModel.revertEmbeddable({
				id: embeddableAId
			});

			assert(
				subData1
				&& subData1.id.id == embeddableAId
				&& subData1.model !== null
				&& subData1.model.Id == embeddableAId
				&& subData1.model.Description == defaultEmbeddableADescription
			)
		});

		testWithReset("Saving an embeddable file should raise embeddable.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.embeddable.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmbeddableFile({
				id: embeddableAId,
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.id == embeddableAId
				&& subData1.model !== null
				&& subData1.model.Files.filter(f => f.Name == 'attachment1.vm').length == 1
			);
		});


		testWithReset("Deleting an embeddable file should raise embeddable.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.embeddable.updated', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteEmbeddableFile({
				id: embeddableAId,
				name: testFileName,
			});

			assert(
				subData1
				&& subData1.id.id == embeddableAId
				&& subData1.model !== null
				&& subData1.model.Files.filter(f => f.Name == testFileName).length == 0
			)
		});

		testWithReset("Saving a new embeddable file should raise file.created", async assert => {
			let subData1;
			messaging.subscribe('me.model.file.created', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmbeddableFile({
				id: embeddableAId,
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.id == embeddableAId
				&& subData1.id.name == 'attachment1.vm'
				&& subData1.model !== null
				&& subData1.model.Id == embeddableAId
				&& subData1.model.Name == 'attachment1.vm'
				&& subData1.model.Content == 'attachment1 content'
			);
		});

		testWithReset("Saving an updated embeddable file should raise file.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.file.updated', testMessageNameSpace, data => subData1 = data);

			window._dataModel = dataModel;

			let saveResult = await dataModel.saveEmbeddableFile({
				id: embeddableAId,
				name: testFileName,
				content: 'new content'
			});

			assert(
				subData1
				&& subData1.id.id == embeddableAId
				&& subData1.id.name == testFileName
				&& subData1.model !== null
				&& subData1.model.Id == embeddableAId
				&& subData1.model.Name == testFileName
				&& subData1.model.Content == 'new content'
			);
		});

		testWithReset("Saving a renamed embeddable file should raise file.updated with original name in id, new name in model", async assert => {
			let subData1;
			messaging.subscribe('me.model.file.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmbeddableFile({
				id: embeddableAId,
				name: testFileName,
				newName: 'renamed.jsm',
				content: 'new content'
			});

			assert(
				subData1
				&& subData1.id.id == embeddableAId
				&& subData1.id.name == testFileName
				&& subData1.model !== null
				&& subData1.model.Id == embeddableAId
				&& subData1.model.Name == 'renamed.jsm'
				&& subData1.model.Content == 'new content'
			);
		});

		testWithReset("Deleting an embeddable file should raise file.deleted with no model", async assert => {
			let subData1;
			messaging.subscribe('me.model.file.deleted', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteEmbeddableFile({
				id: embeddableAId,
				name: testFileName,
			});

			assert(
				subData1
				&& subData1.id.id == embeddableAId
				&& subData1.id.name == testFileName
				&& subData1.model === null
			);
		});

		testWithReset("Delete multiple should raise combination of updated and deleted depending on type of delete", async assert => {
			let log = [];

			let saveResult0 = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataModel.saveEmbeddable({ id: embeddableBId, description: 'y' });
			let cloneResult = await dataModel.cloneEmbeddable({ id: embeddableCId, newId: testNewId });

			messaging.subscribe('me.model.embeddables.changed', testMessageNameSpace, data => log.push({ name: 'changed', data: data }));
			messaging.subscribe('me.model.embeddable.updated', testMessageNameSpace, data => log.push({ name: 'updated', data: data }));
			messaging.subscribe('me.model.embeddable.deleted', testMessageNameSpace, data => log.push({ name: 'deleted', data: data }));

			let deleteResult = await dataModel.deleteEmbeddables({ embeddables: [
				{ id: embeddableAId },
				{ id: embeddableBId },
				{ id: testNewId },
			]});
			let deletePublishResult = await dataModel.publishEmbeddables({ embeddables: [
				{ id: embeddableAId },
				{ id: embeddableBId },
				{ id: testNewId },
			]});

			assert(log
				&& log.length == 5
				&& log[0].name == 'changed'
				&& log[1].name == 'updated'
				&& log[1].data.id.id == embeddableAId
				&& log[2].name == 'updated'
				&& log[2].data.id.id == embeddableBId
				&& log[3].name == 'deleted'
				&& log[3].data.id.id == testNewId
				&& log[4].name == 'changed'
			);
		});

		testWithReset("Publish multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('me.model.embeddables.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataModel.saveEmbeddable({ id: embeddableBId, description: 'y' });
			let saveResult2 = await dataModel.saveEmbeddable({ id: embeddableCId, description: 'z' });

			let publishResult = await dataModel.publishEmbeddables({ embeddables: [
				{ id: embeddableAId },
				{ id: embeddableBId },
				{ id: embeddableCId },
			]});

			let deleteResult0 = await dataModel.deleteEmbeddable({ id: embeddableAId });
			let deletePublishResult0 = await dataModel.publishEmbeddable({ id: embeddableAId });
			let deleteResult1 = await dataModel.deleteEmbeddable({ id: embeddableBId });
			let deletePublishResult1 = await dataModel.publishEmbeddable({ id: embeddableBId });
			let deleteResult2 = await dataModel.deleteEmbeddable({ id: embeddableCId });
			let deletePublishResult2 = await dataModel.publishEmbeddable({  id: embeddableCId });


			assert(log && log.length == 1);
		});

		testWithReset("Revert multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('me.model.embeddables.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataModel.saveEmbeddable({ id: embeddableBId, description: 'y' });
			let saveResult2 = await dataModel.saveEmbeddable({ id: embeddableCId, description: 'z' });

			let publishResult = await dataModel.revertEmbeddables({ embeddables: [
				{ id: embeddableAId },
				{ id: embeddableBId },
				{ id: embeddableCId },
			]});

			assert(log && log.length == 1);
		});

		testWithReset("Reset Test Data", assert => assert(true));
	}

	function runDevModeDataProviderTests(dataProvider) {
		test.heading('Dev Mode Data Provider Tests');

		test("Listing embeddables should list all embeddables", async assert => {
			let embeddables = (await dataProvider.listEmbeddables()).embeddables;
			assert(embeddables.length === defaultEmbeddablesLength);
		});

		test("Listing embeddables by staged: true should only return staged embeddables", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ staged: true })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == 1
				&& embeddables[0].Description == 'x'
				&& embeddables[0].State == 'FactoryDefault'
				&& embeddables[0].IsFactoryDefault == true
				&& embeddables[0].IsStaged == true);
		});

		test("Listing embeddables by staged: false should return non-staged embeddables as well as the published version of currently-staged embeddables", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ staged: false })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == defaultEmbeddablesLength

				&& embeddables[0].Description == defaultEmbeddableADescription
				&& embeddables[0].State == 'FactoryDefault'
				&& embeddables[0].IsFactoryDefault == true
				&& embeddables[0].IsStaged == false

				&& embeddables[1].Description == defaultEmbeddableBDescription
				&& embeddables[1].State == 'FactoryDefault'
				&& embeddables[1].IsFactoryDefault == true
				&& embeddables[1].IsStaged == false);
		});

		test("Listing embeddables by state: 'FactoryDefault' should only return embeddables which are currently in a Factory Default State", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ state: 'FactoryDefault' })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == defaultEmbeddablesLength
				&& embeddables[0].State == 'FactoryDefault');
		});

		test("Listing embeddables by state: 'CustomizedDefault' should return only embeddables which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ state: 'CustomizedDefault' })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == 0);
		});

		test("Listing embeddables by state: 'Custom' should only return embeddables which are currently in a Custom State", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddables = (await dataProvider.listEmbeddables({ state: 'Custom' })).embeddables;
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddables.length == 0);
		});

		test("Listing embeddables by provider should only return embeddables which match", async assert => {
			let testAEmbeddables = (await dataProvider.listEmbeddables({ factoryDefaultProviderId: testProviderId })).embeddables;
			let coreEmbeddables = (await dataProvider.listEmbeddables({ factoryDefaultProviderId: coreProviderId })).embeddables;
			assert(testAEmbeddables.length == testProviderEmbeddablesLength && coreEmbeddables.length == (defaultEmbeddablesLength - testProviderEmbeddablesLength)
				&& testAEmbeddables[0].FactoryDefaultProviderId == testProviderId);
		});

		test("Getting an embeddable returns embeddable", async assert => {
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			assert(embeddable.Id == embeddableAId);
		});

		test("Getting an embeddable returns embeddable with provider", async assert => {
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, });
			assert(embeddable.Id == embeddableAId && embeddable.FactoryDefaultProviderName.length > 0);
		});

		test("Getting an embeddable returns latest version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			assert(embeddable.Id == embeddableAId
				&& embeddable.State == 'FactoryDefault'
				&& embeddable.IsFactoryDefault == true
				&& embeddable.IsStaged == true);
		});

		test("Getting an embeddable with staged: false should return non-staged version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, staged: false });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == defaultEmbeddableADescription
				&& embeddable.State == 'FactoryDefault'
				&& embeddable.IsFactoryDefault == true
				&& embeddable.IsStaged == false);
		});

		test("Getting an embeddable with staged: true should return staged version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, staged: true });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == 'x'
				&& embeddable.State == 'FactoryDefault'
				&& embeddable.IsFactoryDefault == true
				&& embeddable.IsStaged == true);
		});

		test("Getting an embeddable with factoryDefault: true should return factory default version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, factoryDefault: true });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == defaultEmbeddableADescription
				&& embeddable.State == 'FactoryDefault'
				&& embeddable.IsFactoryDefault == true
				&& embeddable.IsStaged == false);
		});

		test("Getting an embeddable with factoryDefault: false should return non-factory default version of embeddable", async assert => {
			await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' })
			let embeddable = await dataProvider.getEmbeddable({ id: embeddableAId, factoryDefault: false });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(embeddable.Id == embeddableAId
				&& embeddable.Description == 'x'
				&& embeddable.State == 'FactoryDefault'
				&& embeddable.IsFactoryDefault == true
				&& embeddable.IsStaged == true);
		});

		test("Saving a default embeddable saves and sets it into a staged, factory default, state and saves files too", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.Description == 'x'
				&& savedEmbeddable.State == 'FactoryDefault'
				&& savedEmbeddable.IsFactoryDefault == true
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length > 0

				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length);
		});

		test("Saving a default embeddable multiple times saves and sets it into a staged, factory default, state and saves files too", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult0 = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let saveResult1 = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'y' });
			let saveResult2 = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'z' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.Description == 'z'
				&& savedEmbeddable.State == 'FactoryDefault'
				&& savedEmbeddable.IsFactoryDefault == true
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length > 0

				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length);
		});

		test("Saving a default embeddable saves and returns saved embeddable and list of staged", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			await dataProvider.revertEmbeddable({ id: embeddableAId })
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedEmbeddable.Id == embeddableAId
				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'FactoryDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == true
				&& saveResult.savedEmbeddable.IsStaged == true

				&& saveResult.savedEmbeddable.Files.length > 0

				&& saveResult.savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& saveResult.stagedEmbeddables.length == 1

				&& saveResult.stagedEmbeddables[0].Id == embeddableAId
				&& saveResult.stagedEmbeddables[0].Description == 'x'
				&& saveResult.stagedEmbeddables[0].State == 'FactoryDefault'
				&& saveResult.stagedEmbeddables[0].IsFactoryDefault == true
				&& saveResult.stagedEmbeddables[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, fac default embeddable reverts and sets it into a non-staged, fac default, state and saves files too", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.savedEmbeddable.Id == embeddableAId
				&& saveResult.savedEmbeddable.Description == 'x'
				&& saveResult.savedEmbeddable.State == 'FactoryDefault'
				&& saveResult.savedEmbeddable.IsFactoryDefault == true
				&& saveResult.savedEmbeddable.IsStaged == true

				&& saveResult.savedEmbeddable.Files.length > 0

				&& saveResult.savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& revertResult.revertedEmbeddable.Id == embeddableAId
				&& revertResult.revertedEmbeddable.Description == defaultEmbeddableADescription
				&& revertResult.revertedEmbeddable.State == 'FactoryDefault'
				&& revertResult.revertedEmbeddable.IsFactoryDefault == true
				&& revertResult.revertedEmbeddable.IsStaged == false

				&& revertResult.revertedEmbeddable.Files.length > 0

				&& revertResult.revertedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& revertedEmbeddable.Id == embeddableAId
				&& revertedEmbeddable.Description == defaultEmbeddableADescription
				&& revertedEmbeddable.State == 'FactoryDefault'
				&& revertedEmbeddable.IsFactoryDefault == true
				&& revertedEmbeddable.IsStaged == false

				&& revertedEmbeddable.Files.length > 0

				&& revertedEmbeddable.Files.length == originalEmbeddable.Files.length
				);
		});

		test("Publishing a saved change to a default embeddable saves and sets it into a published, default, state and saves files too", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: 'x' });
			let publishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });
			let publishedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });

			let reverseSaveResult = await dataProvider.saveEmbeddable({ id: embeddableAId, description: defaultEmbeddableADescription });
			let reversePublishResult = await dataProvider.publishEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& publishedEmbeddable.Id == embeddableAId
				&& publishedEmbeddable.Description == 'x'
				&& publishedEmbeddable.State == 'FactoryDefault'
				&& publishedEmbeddable.IsFactoryDefault == true
				&& publishedEmbeddable.IsStaged == false

				&& publishedEmbeddable.Files.length > 0

				&& publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& publishResult.publishedEmbeddable.Id == embeddableAId
				&& publishResult.publishedEmbeddable.Description == 'x'
				&& publishResult.publishedEmbeddable.State == 'FactoryDefault'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == true
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& publishResult.publishedEmbeddable.Files.length > 0

				&& publishResult.publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& publishResult.stagedEmbeddables.length == 0
				);
		});

		test("Creating a new embeddable with provider in dev mode creates non-saved, staged, embeddable with provider", async assert => {
			let newEmbeddable = await dataProvider.createEmbeddable({ id: testNewId, factoryDefaultProviderId: testProviderId });
			let newSavedEmbeddable = await dataProvider.getEmbeddable({ id: testNewId });
			let revertResult = await dataProvider.revertEmbeddable({ id: testNewId });

			assert(newEmbeddable.Id.length > 0
				&& newEmbeddable.State == 'NotPersisted'
				&& newEmbeddable.IsStaged == false
				&& newEmbeddable.Id == testNewId
				&& newEmbeddable.IsFactoryDefault == true
				&& newEmbeddable.FactoryDefaultProviderId === testProviderId

				&& newSavedEmbeddable == null

				&& revertResult.reverted == true
				&& revertResult.revertedEmbeddable == null
				&& revertResult.stagedEmbeddables.length == 0
				);
		});

		test("Creating and publishing new embeddable with provider in dev mode creates published embeddable with provider", async assert => {
			let newEmbeddable = await dataProvider.createEmbeddable({ id: testNewId, factoryDefaultProviderId: testProviderId });
			let saveResult = await dataProvider.saveEmbeddable({ id: testNewId, factoryDefaultProviderId: testProviderId, name: 'test-auto' });
			let publishResult = await dataProvider.publishEmbeddable({ id: testNewId });
			let publishedEmbeddable = await dataProvider.getEmbeddable({ id: testNewId });
			let deleteResult = await dataProvider.deleteEmbeddable({ id: testNewId });
			let stagedDeletedEmbeddable = await dataProvider.getEmbeddable({ id: testNewId });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: testNewId });
			let deletedEmbeddable = await dataProvider.getEmbeddable({ id: testNewId });

			assert(newEmbeddable.Id.length > 0
				&& newEmbeddable.State == 'NotPersisted'
				&& newEmbeddable.IsStaged == false
				&& newEmbeddable.Id == testNewId
				&& newEmbeddable.IsFactoryDefault == true
				&& newEmbeddable.FactoryDefaultProviderId === testProviderId

				&& stagedDeletedEmbeddable != null
				&& stagedDeletedEmbeddable.State == 'FactoryDefault'
				&& stagedDeletedEmbeddable.IsStaged == true
				&& stagedDeletedEmbeddable.IsDeleted == true
				&& stagedDeletedEmbeddable.Id == testNewId
				&& stagedDeletedEmbeddable.IsFactoryDefault == true
				&& stagedDeletedEmbeddable.FactoryDefaultProviderId === testProviderId

				&& publishedEmbeddable != null
				&& publishedEmbeddable.State == 'FactoryDefault'
				&& publishedEmbeddable.IsStaged == false
				&& publishedEmbeddable.Id == testNewId
				&& publishedEmbeddable.IsFactoryDefault == true
				&& publishedEmbeddable.FactoryDefaultProviderId === testProviderId

				&& deletedEmbeddable == null
				);
		});

		test("Cloning an embeddable creates a FactoryDefault, staged, embeddable with random new embeddable id and incremented name", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId });
			let clonedEmbeddable = await dataProvider.getEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			await dataProvider.deleteEmbeddable({ id: clonedEmbeddable.Id });
			await dataProvider.publishEmbeddable({ id: clonedEmbeddable.Id });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& cloneResult.clonedEmbeddable.Id != embeddableAId
				&& cloneResult.clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& cloneResult.clonedEmbeddable.Description == defaultEmbeddableADescription
				&& cloneResult.clonedEmbeddable.State == 'FactoryDefault'
				&& cloneResult.clonedEmbeddable.IsFactoryDefault == true
				&& cloneResult.clonedEmbeddable.IsStaged == true

				&& cloneResult.clonedEmbeddable.Files.length > 0

				&& cloneResult.clonedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& cloneResult.stagedEmbeddables.length == 1

				&& clonedEmbeddable.Id != embeddableAId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.Description == defaultEmbeddableADescription
				&& clonedEmbeddable.State == 'FactoryDefault'
				&& clonedEmbeddable.IsFactoryDefault == true
				&& clonedEmbeddable.IsStaged == true

				&& clonedEmbeddable.Files.length > 0

				&& clonedEmbeddable.Files.length == originalEmbeddable.Files.length
			);
		});


		test("Cloning an embeddable with specific ID creates a fac default, staged, embeddable with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId, newId: newId });
			let clonedEmbeddable = await dataProvider.getEmbeddable({ id: newId });
			await dataProvider.deleteEmbeddable({ id: newId });
			await dataProvider.publishEmbeddable({ id: newId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& cloneResult.clonedEmbeddable.Id == newId
				&& cloneResult.clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.Id == newId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
			);
		});

		test("Cloning an embeddable with specific provider ID creates a fac default, staged, embeddable with incremented name and specified provider", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId, newId: newId, factoryDefaultProviderId: testProviderId });
			let clonedEmbeddable = await dataProvider.getEmbeddable({ id: newId });
			await dataProvider.deleteEmbeddable({ id: newId });
			await dataProvider.publishEmbeddable({ id: newId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& cloneResult.clonedEmbeddable.Id == newId
				&& cloneResult.clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& cloneResult.clonedEmbeddable.IsFactoryDefault == true
				&& cloneResult.clonedEmbeddable.FactoryDefaultProviderId == testProviderId
				&& clonedEmbeddable.Id == newId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.IsFactoryDefault == true
				&& clonedEmbeddable.FactoryDefaultProviderId == testProviderId
			);
		});

		test("Publishing a cloned embeddable publishes", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId });
			let publishResult = await dataProvider.publishEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let clonedEmbeddable = await dataProvider.getEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			await dataProvider.deleteEmbeddable({ id: clonedEmbeddable.Id });
			await dataProvider.publishEmbeddable({ id: clonedEmbeddable.Id });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& publishResult.publishedEmbeddable.Id != embeddableAId
				&& publishResult.publishedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& publishResult.publishedEmbeddable.Description == defaultEmbeddableADescription
				&& publishResult.publishedEmbeddable.State == 'FactoryDefault'
				&& publishResult.publishedEmbeddable.IsFactoryDefault == true
				&& publishResult.publishedEmbeddable.IsStaged == false

				&& publishResult.publishedEmbeddable.Files.length > 0

				&& publishResult.publishedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& publishResult.stagedEmbeddables.length == 0

				&& clonedEmbeddable.Id != embeddableAId
				&& clonedEmbeddable.Name == (originalEmbeddable.Name + ' 1')
				&& clonedEmbeddable.Description == defaultEmbeddableADescription
				&& clonedEmbeddable.State == 'FactoryDefault'
				&& clonedEmbeddable.IsFactoryDefault == true
				&& clonedEmbeddable.IsStaged == false

				&& clonedEmbeddable.Files.length > 0

				&& clonedEmbeddable.Files.length == originalEmbeddable.Files.length
			);
		})

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataProvider.cloneEmbeddable({ id: embeddableAId });
			let publishResult = await dataProvider.publishEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let deleteResult = await dataProvider.deleteEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let deletePublishResult = await dataProvider.publishEmbeddable({ id: cloneResult.clonedEmbeddable.Id });
			let embeddable = await dataProvider.getEmbeddable({ id: cloneResult.clonedEmbeddable.Id });

			assert(publishResult.publishedEmbeddable !== null
				&& embeddable == null);
		})

		test("Getting an embeddable file gets file", async assert => {
			let file = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			assert(file.Name == testFileName);
		});

		test("Saving a file saves file and sets embeddable into staged state", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmbeddableFile.Content == 'new file content'

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'FactoryDefault'
				&& savedEmbeddable.IsFactoryDefault == true
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& savedEmbeddable.Files.length > 0);
		});

		test("Saving a file multiple times saves file and sets embeddable into staged state", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult0 = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new file content 2' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmbeddableFile.Content == 'new file content 2'

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'FactoryDefault'
				&& savedEmbeddable.IsFactoryDefault == true
				&& savedEmbeddable.IsStaged == true

				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length

				&& savedEmbeddable.Files.length > 0);
		});

		test("Reverting an embeddable with a saved file reverts both", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& revertedEmbeddableFile.Content === originalEmbeddableFile.Content

				&& revertedEmbeddable.Id == embeddableAId
				&& revertedEmbeddable.State == 'FactoryDefault'

				&& revertedEmbeddable.Files.length > 0);
		})

		test("Getting non-staged version of otherwise staged embeddable file gets non-staged version", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let nonStagedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName, staged: false });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddableFile.Content != 'new content'
				&& savedEmbeddableFile.Content == 'new content'
				&& nonStagedEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default embeddable file gets fac default version", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, content: 'new content' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let facDefaultEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName, factoryDefault: true });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddableFile.Content != 'new content'
				&& savedEmbeddableFile.Content == 'new content'
				&& facDefaultEmbeddableFile.Content == originalEmbeddableFile.Content
			);
		});

		test("Deleting a file from a default embeddable sets embeddable to staged with removed file", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deleteResult = await dataProvider.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deletedEmbeddable.Files.find(s => s.Name == testFileName) == null
				&& deletedEmbeddable.State == 'FactoryDefault'
				&& deletedEmbeddable.IsFactoryDefault == true
				&& deletedEmbeddable.IsStaged == true

				&& deletedEmbeddableFile == null
			);
		});

		test("Reverting file deletion from staged embeddable sets embeddable back to factory default", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmbeddableFile({ id: embeddableAId, name: testFileName });
			let deletedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let deletedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });
			let revertedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let revertedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.length > 0

				&& originalEmbeddable.Files.find(s => s.Name == testFileName) !== null

				&& originalEmbeddableFile.Name == testFileName

				&& deleteResult.stagedEmbeddables.length == 1
				&& deleteResult.embeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deleteResult.embeddable.Files.find(s => s.Name == testFileName) == null

				&& deletedEmbeddable.Files.length == originalEmbeddable.Files.length - 1
				&& deletedEmbeddable.Files.find(s => s.Name == testFileName) == null
				&& deletedEmbeddable.State == 'FactoryDefault'
				&& deletedEmbeddable.IsFactoryDefault == true
				&& deletedEmbeddable.IsStaged == true

				&& deletedEmbeddableFile == null

				&& revertResult.stagedEmbeddables.length == 0
				&& revertResult.revertedEmbeddable.IsStaged == false
				&& revertResult.revertedEmbeddable.Files.length == originalEmbeddable.Files.length
				&& revertResult.revertedEmbeddable.Files.find(s => s.Name == testFileName) != null

				&& revertedEmbeddable.IsStaged == false
				&& revertedEmbeddable.Files.length == originalEmbeddable.Files.length
				&& revertedEmbeddable.Files.find(s => s.Name == testFileName) != null

				&& revertedEmbeddableFile !== null
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let originalEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: testFileName });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: testFileName, newName: 'renamed.jsm' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: 'renamed.jsm' });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false
				&& originalEmbeddable.Files.filter(s => s.Name == 'renamed.jsm').length == 0
				&& originalEmbeddable.Files.filter(s => s.Name == testFileName).length == 1

				&& originalEmbeddable.Files.length == savedEmbeddable.Files.length

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'FactoryDefault'
				&& savedEmbeddable.IsFactoryDefault == true
				&& savedEmbeddable.IsStaged == true
				&& savedEmbeddable.Files.filter(s => s.Name == 'renamed.jsm').length == 1
				&& savedEmbeddable.Files.filter(s => s.Name == testFileName).length == 0

				&& savedEmbeddableFile.Name == 'renamed.jsm'
				&& originalEmbeddableFile.Content == savedEmbeddableFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.createEmbeddableFile({ id: embeddableAId });

			assert(saveResult
				&& saveResult.Id == embeddableAId
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.EmbeddableName == originalEmbeddable.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalEmbeddable.Files.length
			);
		});

		test("Saving a new file saves file and sets embeddable into staged state", async assert => {
			let originalEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let saveResult = await dataProvider.saveEmbeddableFile({ id: embeddableAId, name: 'newfile.jsm', content: 'content' });
			let savedEmbeddable = await dataProvider.getEmbeddable({ id: embeddableAId });
			let savedEmbeddableFile = await dataProvider.getEmbeddableFile({ id: embeddableAId, name: 'newfile.jsm' });
			let revertResult = await dataProvider.revertEmbeddable({ id: embeddableAId });

			assert(originalEmbeddable.Id == embeddableAId
				&& originalEmbeddable.Description == defaultEmbeddableADescription
				&& originalEmbeddable.State == 'FactoryDefault'
				&& originalEmbeddable.IsFactoryDefault == true
				&& originalEmbeddable.IsStaged == false

				&& savedEmbeddableFile.Content == 'content'

				&& savedEmbeddable.Id == embeddableAId
				&& savedEmbeddable.State == 'FactoryDefault'
				&& savedEmbeddable.IsFactoryDefault == true
				&& savedEmbeddable.IsStaged == true
				&& savedEmbeddable.Files.length == originalEmbeddable.Files.length + 1

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
