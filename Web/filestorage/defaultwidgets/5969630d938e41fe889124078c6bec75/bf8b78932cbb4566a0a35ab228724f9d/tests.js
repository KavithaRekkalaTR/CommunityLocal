define('Tests', ['StudioSaveQueue', 'DataModel'], (StudioSaveQueue, DataModel, $, global, undef) => {

	let messaging = $.telligent.evolution.messaging;

	let testAttachmentName = 'file-a.jsm';
	let testProviderFragmentsLength = 3;

	let fragmentAId = "cd25b3a9-49d0-402c-a1c0-56694cbfd2d4";
	let fragmentBId = "6ba4514d-0d8a-470a-8390-8b6accb1216e";
	let fragmentCId = "8e892988-ea84-40c3-8381-1ed1de007291";
	let defaultFragmentADescription = "Test Fragment A Description";
	let defaultFragmentBDescription = "Test Fragment B Description";
	let defaultFragmentCDescription = "Test Fragment C Description";
	let defaultFragmentsLength = 6;
	let themeId = '3fc3f824-83d1-4ec4-85ef-92e206116d49';
	let testNewId = "20fd4480-e3f9-4d12-b452-7b2fe73a6e88";
	let testProviderAId = "d34eff55-3c9a-45be-8ee8-6b947a9b755c";
	let testProviderBId = "19ca07b5-ea06-4e3a-b253-dc1feda6de3f";
	let testBProviderFragmentsLength = 2;

	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function runDataProviderTests(dataProvider) {

		test.heading('Data Provider Tests');

		test("Listing fragments should list all fragments", async assert => {
			let fragments = (await dataProvider.listFragments({ scriptable: false })).fragments;
			assert(fragments.length === defaultFragmentsLength);
		});

		test("Listing fragments by isStaged: true should only return staged fragments", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataProvider.listFragments({ isStaged: true })).fragments;
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == 1
				&& fragments[0].Description == 'x'
				&& fragments[0].State == 'CustomizedDefault'
				&& fragments[0].IsFactoryDefault == false
				&& fragments[0].IsStaged == true);
		});

		test("Listing fragments by state: 'FactoryDefault' should only return fragments which are currently in a Factory Default State", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataProvider.listFragments({ scriptable: false, state: 'FactoryDefault' })).fragments;
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == defaultFragmentsLength - 1
				&& fragments[0].State == 'FactoryDefault');
		});

		test("Listing fragments by state: 'CustomizedDefault' should return only fragments which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataProvider.listFragments({ state: 'CustomizedDefault' })).fragments;
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == 1
				&& fragments[0].State == 'CustomizedDefault');
		});

		test("Listing fragments by state: 'Custom' should only return fragments which are currently in a Custom State", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataProvider.listFragments({ state: 'Custom' })).fragments;
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == 0);
		});

		test("Listing fragments by provider should only return fragments which match", async assert => {
			let testAFragments = (await dataProvider.listFragments({ factoryDefaultProvider: testProviderAId })).fragments;
			let testBFragments = (await dataProvider.listFragments({ factoryDefaultProvider: testProviderBId })).fragments;
			assert(testAFragments.length == testProviderFragmentsLength && testBFragments.length == testBProviderFragmentsLength
				&& testAFragments[0].FactoryDefaultProvider == testProviderAId
				&& testBFragments[0].FactoryDefaultProvider == testProviderBId);
		});

		test("Getting a fragment returns fragment", async assert => {
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, });
			assert(fragment.InstanceIdentifier == fragmentAId);
		});

		test("Getting a fragment returns fragment with provider", async assert => {
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, });
			assert(fragment.InstanceIdentifier == fragmentAId && fragment.FactoryDefaultProviderName && fragment.FactoryDefaultProviderName.length > 0);
		});

		test("Getting a fragment returns latest version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.State == 'CustomizedDefault'
				&& fragment.IsFactoryDefault == false
				&& fragment.IsStaged == true);
		});

		test("Getting a fragment with staged: false should return non-staged version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, staged: false });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == defaultFragmentADescription
				&& fragment.State == 'CustomizedDefault' // to know that this is a cutomized fragment but currently viewing fac default version
				&& fragment.IsFactoryDefault == true
				&& fragment.IsStaged == false);
		});

		test("Getting a fragment with staged: true should return staged version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, staged: true });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == 'x'
				&& fragment.State == 'CustomizedDefault' // to know that this is a cutomized fragment but currently viewing fac default version
				&& fragment.IsFactoryDefault == false
				&& fragment.IsStaged == true);
		});

		test("Getting a fragment with factoryDefault: true should return factory default version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, factoryDefault: true });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == defaultFragmentADescription
				&& fragment.State == 'CustomizedDefault' // to know that this is a cutomized fragment but currently viewing fac default version
				&& fragment.IsFactoryDefault == true
				&& fragment.IsStaged == false);
		});

		test("Getting a fragment with factoryDefault: false should return non-factory default version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, factoryDefault: false });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == 'x'
				&& fragment.State == 'CustomizedDefault' // to know that this is a cutomized fragment but currently viewing fac default version
				&& fragment.IsFactoryDefault == false
				&& fragment.IsStaged == true);
		});

		test("Saving a default fragment saves and sets it into a staged, customized default, state and saves attachments too", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.isNew == false

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.Description == 'x'
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length > 0
				&& savedFragment.Attachments.length == originalFragment.Attachments.length);
		});

		test("Saving a default fragment multiple times saves and sets it into a staged, customized default, state and saves attachments too", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult0 = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'y' });
			let saveResult2 = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'z' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId  });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.Description == 'z'
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length > 0
				&& savedFragment.Attachments.length == originalFragment.Attachments.length);
		});

		test("Saving a default fragment saves and returns saved fragment and list of staged", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedFragment.InstanceIdentifier == fragmentAId
				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'CustomizedDefault'
				&& saveResult.savedFragment.IsFactoryDefault == false
				&& saveResult.savedFragment.IsStaged == true

				&& saveResult.savedFragment.Attachments.length > 0

				&& saveResult.savedFragment.Attachments.length == originalFragment.Attachments.length

				&& saveResult.stagedFragments.length == 1

				&& saveResult.stagedFragments[0].InstanceIdentifier == fragmentAId
				&& saveResult.stagedFragments[0].Description == 'x'
				&& saveResult.stagedFragments[0].State == 'CustomizedDefault'
				&& saveResult.stagedFragments[0].IsFactoryDefault == false
				&& saveResult.stagedFragments[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default fragment reverts and sets it into a staged, customized default, state and saves attachments too", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.savedFragment.InstanceIdentifier == fragmentAId
				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'CustomizedDefault'
				&& saveResult.savedFragment.IsFactoryDefault == false
				&& saveResult.savedFragment.IsStaged == true

				&& saveResult.savedFragment.Attachments.length > 0

				&& saveResult.savedFragment.Attachments.length == originalFragment.Attachments.length

				&& revertResult.revertedFragment.InstanceIdentifier == fragmentAId
				&& revertResult.revertedFragment.Description == defaultFragmentADescription
				&& revertResult.revertedFragment.State == 'FactoryDefault'
				&& revertResult.revertedFragment.IsFactoryDefault == true
				&& revertResult.revertedFragment.IsStaged == false

				&& revertResult.revertedFragment.Attachments.length > 0
				&& revertResult.revertedFragment.Attachments.length == originalFragment.Attachments.length

				&& revertedFragment.InstanceIdentifier == fragmentAId

				&& revertedFragment.Description == defaultFragmentADescription
				&& revertedFragment.State == 'FactoryDefault'
				&& revertedFragment.IsFactoryDefault == true
				&& revertedFragment.IsStaged == false

				&& revertedFragment.Attachments.length > 0

				&& revertedFragment.Attachments.length == originalFragment.Attachments.length
				);
		});

		test("Reverting multiple fragments reverts multiple fragments", async assert => {
			let originalFragment0 = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragment1 = await dataProvider.getFragment({ instanceIdentifier: fragmentBId });
			let originalFragment2 = await dataProvider.getFragment({ instanceIdentifier: fragmentCId });

			let saveResult0 = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataProvider.saveFragment({ instanceIdentifier: fragmentBId, description: 'y' });
			let saveResult2 = await dataProvider.saveFragment({ instanceIdentifier: fragmentCId, description: 'z' });

			let fragmentIds = `${fragmentAId},${fragmentBId},${fragmentCId}`;
			let revertResult = await dataProvider.revertFragments({ fragmentIds: fragmentIds });

			let revertedFragment0 = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment1 = await dataProvider.getFragment({ instanceIdentifier: fragmentBId });
			let revertedFragment2 = await dataProvider.getFragment({ instanceIdentifier: fragmentCId });

			assert(originalFragment0.Description == defaultFragmentADescription
				&& originalFragment0.State == 'FactoryDefault'
				&& originalFragment0.IsFactoryDefault == true
				&& originalFragment0.IsStaged == false

				&& originalFragment1.Description == defaultFragmentBDescription
				&& originalFragment1.State == 'FactoryDefault'
				&& originalFragment1.IsFactoryDefault == true
				&& originalFragment1.IsStaged == false

				&& originalFragment2.Description == defaultFragmentCDescription
				&& originalFragment2.State == 'FactoryDefault'
				&& originalFragment2.IsFactoryDefault == true
				&& originalFragment2.IsStaged == false

				&& saveResult0.savedFragment.Description == 'x'
				&& saveResult0.savedFragment.State == 'CustomizedDefault'
				&& saveResult0.savedFragment.IsFactoryDefault == false
				&& saveResult0.savedFragment.IsStaged == true

				&& saveResult1.savedFragment.Description == 'y'
				&& saveResult1.savedFragment.State == 'CustomizedDefault'
				&& saveResult1.savedFragment.IsFactoryDefault == false
				&& saveResult1.savedFragment.IsStaged == true

				&& saveResult2.savedFragment.Description == 'z'
				&& saveResult2.savedFragment.State == 'CustomizedDefault'
				&& saveResult2.savedFragment.IsFactoryDefault == false
				&& saveResult2.savedFragment.IsStaged == true

				&& revertResult.stagedFragments.length == 0

				&& revertedFragment0.Description == defaultFragmentADescription
				&& revertedFragment0.State == 'FactoryDefault'
				&& revertedFragment0.IsFactoryDefault == true
				&& revertedFragment0.IsStaged == false

				&& revertedFragment1.Description == defaultFragmentBDescription
				&& revertedFragment1.State == 'FactoryDefault'
				&& revertedFragment1.IsFactoryDefault == true
				&& revertedFragment1.IsStaged == false

				&& revertedFragment2.Description == defaultFragmentCDescription
				&& revertedFragment2.State == 'FactoryDefault'
				&& revertedFragment2.IsFactoryDefault == true
				&& revertedFragment2.IsStaged == false
				);
		});

		test("Deleting a published customized default stages reversion to factory default", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });
			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId });
			let stagedDeletedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'CustomizedDefault'
				&& saveResult.savedFragment.IsFactoryDefault == false
				&& saveResult.savedFragment.IsStaged == true

				&& publishResult.publishedFragment.Description == 'x'
				&& publishResult.publishedFragment.State == 'CustomizedDefault'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false

				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'FactoryDefault'
				&& deleteResult.fragment.IsFactoryDefault == true
				&& deleteResult.fragment.IsStaged == true

				&& stagedDeletedFragment.Description == defaultFragmentADescription
				&& stagedDeletedFragment.State == 'FactoryDefault'
				&& stagedDeletedFragment.IsFactoryDefault == true
				&& stagedDeletedFragment.IsStaged == true
				);
		});

		test("Reverting a staged deletion of customized default restores customized default", async assert => {

			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });
			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			let realDeleteResult = await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'CustomizedDefault'
				&& saveResult.savedFragment.IsFactoryDefault == false
				&& saveResult.savedFragment.IsStaged == true

				&& publishResult.publishedFragment.Description == 'x'
				&& publishResult.publishedFragment.State == 'CustomizedDefault'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false

				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'FactoryDefault'
				&& deleteResult.fragment.IsFactoryDefault == true
				&& deleteResult.fragment.IsStaged == true

				&& revertResult.revertedFragment.Description == 'x'
				&& revertResult.revertedFragment.State == 'CustomizedDefault'
				&& revertResult.revertedFragment.IsFactoryDefault == false
				&& revertResult.revertedFragment.IsStaged == false
				);
		})

		test("Deleting a published custom stages deletion", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId, newInstanceIdentifier: testNewId });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: testNewId });
			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: testNewId });
			let stagedDeletedFragment = await dataProvider.getFragment({ instanceIdentifier: testNewId });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: testNewId });

			assert(originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.IsDeleted == false

				&& cloneResult.clonedFragment.Description == defaultFragmentADescription
				&& cloneResult.clonedFragment.State == 'Custom'
				&& cloneResult.clonedFragment.IsFactoryDefault == false
				&& cloneResult.clonedFragment.IsStaged == true
				&& cloneResult.clonedFragment.IsDeleted == false

				&& publishResult.publishedFragment.Description == defaultFragmentADescription
				&& publishResult.publishedFragment.State == 'Custom'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false
				&& publishResult.publishedFragment.IsDeleted == false

				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'Custom'
				&& deleteResult.fragment.IsFactoryDefault == false
				&& deleteResult.fragment.IsDeleted == true
				&& deleteResult.fragment.IsStaged == true

				&& stagedDeletedFragment.Description == defaultFragmentADescription
				&& stagedDeletedFragment.State == 'Custom'
				&& stagedDeletedFragment.IsFactoryDefault == false
				&& stagedDeletedFragment.IsDeleted == true
				&& stagedDeletedFragment.IsStaged == true
				);

		});

		test("Reverting a staged custom deletion restores custom", async assert => {

			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId, newInstanceIdentifier: testNewId });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: testNewId });

			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: testNewId });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: testNewId });

			let realDeleteResult = await dataProvider.deleteFragment({ instanceIdentifier: testNewId });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: testNewId });

			assert(originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.IsDeleted == false

				&& cloneResult.clonedFragment.Description == defaultFragmentADescription
				&& cloneResult.clonedFragment.State == 'Custom'
				&& cloneResult.clonedFragment.IsFactoryDefault == false
				&& cloneResult.clonedFragment.IsStaged == true
				&& cloneResult.clonedFragment.IsDeleted == false

				&& publishResult.publishedFragment.Description == defaultFragmentADescription
				&& publishResult.publishedFragment.State == 'Custom'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false
				&& publishResult.publishedFragment.IsDeleted == false

				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'Custom'
				&& deleteResult.fragment.IsFactoryDefault == false
				&& deleteResult.fragment.IsDeleted == true
				&& deleteResult.fragment.IsStaged == true

				&& revertResult.revertedFragment.Description == defaultFragmentADescription
				&& revertResult.revertedFragment.State == 'Custom'
				&& revertResult.revertedFragment.IsFactoryDefault == false
				&& revertResult.revertedFragment.IsStaged == false
				&& revertResult.revertedFragment.IsDeleted == false
				);

		});

		test("Publishing a saved change to a default fragment saves and sets it into a published, customized default, state and saves attachments too", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });
			let publishedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId })
			await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& publishedFragment.InstanceIdentifier == fragmentAId
				&& publishedFragment.Description == 'x'
				&& publishedFragment.State == 'CustomizedDefault'
				&& publishedFragment.IsFactoryDefault == false
				&& publishedFragment.IsStaged == false

				&& publishedFragment.Attachments.length > 0

				&& publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& publishResult.publishedFragment.InstanceIdentifier == fragmentAId
				&& publishResult.publishedFragment.Description == 'x'
				&& publishResult.publishedFragment.State == 'CustomizedDefault'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false

				&& publishResult.publishedFragment.Attachments.length > 0

				&& publishResult.publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& publishResult.stagedFragments.length == 0
				);
		});

		test("Publishing multiple fragments publishes multiple fragments", async assert => {
			let originalFragment0 = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragment1 = await dataProvider.getFragment({ instanceIdentifier: fragmentBId });
			let originalFragment2 = await dataProvider.getFragment({ instanceIdentifier: fragmentCId });

			let saveResult0 = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataProvider.saveFragment({ instanceIdentifier: fragmentBId, description: 'y' });
			let saveResult2 = await dataProvider.saveFragment({ instanceIdentifier: fragmentCId, description: 'z' });

			let fragmentIds = `${fragmentAId},${fragmentBId},${fragmentCId}`;
			let publishResult = await dataProvider.publishFragments({ fragmentIds: fragmentIds });

			let publishedFragment0 = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let publishedFragment1 = await dataProvider.getFragment({ instanceIdentifier: fragmentBId });
			let publishedFragment2 = await dataProvider.getFragment({ instanceIdentifier: fragmentCId });

			await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId });
			await dataProvider.deleteFragment({ instanceIdentifier: fragmentBId });
			await dataProvider.deleteFragment({ instanceIdentifier: fragmentCId });
			await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });
			await dataProvider.publishFragment({ instanceIdentifier: fragmentBId });
			await dataProvider.publishFragment({ instanceIdentifier: fragmentCId });

			assert(originalFragment0.Description == defaultFragmentADescription
				&& originalFragment0.State == 'FactoryDefault'
				&& originalFragment0.IsFactoryDefault == true
				&& originalFragment0.IsStaged == false

				&& originalFragment1.Description == defaultFragmentBDescription
				&& originalFragment1.State == 'FactoryDefault'
				&& originalFragment1.IsFactoryDefault == true
				&& originalFragment1.IsStaged == false

				&& originalFragment2.Description == defaultFragmentCDescription
				&& originalFragment2.State == 'FactoryDefault'
				&& originalFragment2.IsFactoryDefault == true
				&& originalFragment2.IsStaged == false

				&& publishResult.stagedFragments.length == 0

				&& publishedFragment0.Description == 'x'
				&& publishedFragment0.State == 'CustomizedDefault'
				&& publishedFragment0.IsFactoryDefault == false
				&& publishedFragment0.IsStaged == false

				&& publishedFragment1.Description == 'y'
				&& publishedFragment1.State == 'CustomizedDefault'
				&& publishedFragment1.IsFactoryDefault == false
				&& publishedFragment1.IsStaged == false

				&& publishedFragment2.Description == 'z'
				&& publishedFragment2.State == 'CustomizedDefault'
				&& publishedFragment2.IsFactoryDefault == false
				&& publishedFragment2.IsStaged == false
				);
		});

		test("Deleting a published, customized default fragment reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });
			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });
			let deletedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& deleteResult.fragment.InstanceIdentifier == fragmentAId
				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'FactoryDefault'
				&& deleteResult.fragment.IsFactoryDefault == true
				&& deleteResult.fragment.IsStaged == true
				&& deleteResult.fragment.IsReverted == true
				&& deleteResult.fragment.IsDeleted == false

				&& deletePublishResult.publishedFragment.InstanceIdentifier == fragmentAId
				&& deletePublishResult.publishedFragment.Description == defaultFragmentADescription
				&& deletePublishResult.publishedFragment.State == 'FactoryDefault'
				&& deletePublishResult.publishedFragment.IsFactoryDefault == true
				&& deletePublishResult.publishedFragment.IsStaged == false

				&& deletePublishResult.publishedFragment.Attachments.length > 0

				&& deletePublishResult.publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& deletedFragment.InstanceIdentifier == fragmentAId
				&& deletedFragment.Description == defaultFragmentADescription
				&& deletedFragment.State == 'FactoryDefault'
				&& deletedFragment.IsFactoryDefault == true
				&& deletedFragment.IsStaged == false

				&& deletedFragment.Attachments.length > 0

				&& deletedFragment.Attachments.length == originalFragment.Attachments.length
				);
		});

		test("Deleting multiple fragments at different states deletes and/or reverts multiple fragments", async assert => {
			// 3 types of states: staged customized default, published customized default, published custom
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let fragmentASaveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let fragmentBSaveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentBId, description: 'y' });
			let fragmentBPublishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentBId });
			let fragmentCCloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentCId, newInstanceIdentifier: newId });
			let fragmentCClonePublishResult = await dataProvider.publishFragment({ instanceIdentifier: newId });

			let stagedXFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let publishedYFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentBId });
			let clonedZFragment = await dataProvider.getFragment({ instanceIdentifier: newId });

			let fragmentIds = `${fragmentAId},${fragmentBId},${newId}`;
			let deleteResult = await dataProvider.deleteFragments({ fragmentIds: fragmentIds });
			let deletePublishResult = await dataProvider.publishFragments({ fragmentIds: fragmentIds });

			let deletedXFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let deletedYFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentBId });
			let deletedZFragment = await dataProvider.getFragment({ instanceIdentifier: newId });

			assert(stagedXFragment.Description == 'x'
				&& stagedXFragment.State == 'CustomizedDefault'
				&& stagedXFragment.IsFactoryDefault == false
				&& stagedXFragment.IsStaged == true

				&& publishedYFragment.Description == 'y'
				&& publishedYFragment.State == 'CustomizedDefault'
				&& publishedYFragment.IsFactoryDefault == false
				&& publishedYFragment.IsStaged == false

				&& clonedZFragment.State == 'Custom'
				&& clonedZFragment.IsFactoryDefault == false
				&& clonedZFragment.IsStaged == false

				&& deleteResult.stagedFragments.length == 2
				&& deleteResult.revertedFragments.length == 1
				&& deleteResult.stagedFragments[0].InstanceIdentifier == fragmentBId
				&& deleteResult.stagedFragments[0].IsDeleted == false
				&& deleteResult.stagedFragments[0].IsReverted == true
				&& deleteResult.stagedFragments[1].InstanceIdentifier == newId
				&& deleteResult.stagedFragments[1].IsDeleted == true
				&& deleteResult.stagedFragments[1].IsReverted == true
				&& deleteResult.revertedFragments[0].InstanceIdentifier == fragmentAId

				&& deletePublishResult.deletedFragments.length == 1
				&& deletePublishResult.revertedFragments.length == 1
				&& deletePublishResult.deletedFragments[0].InstanceIdentifier == newId
				&& deletePublishResult.revertedFragments[0].InstanceIdentifier == fragmentBId

				&& deletedXFragment.Description == defaultFragmentADescription
				&& deletedXFragment.State == 'FactoryDefault'
				&& deletedXFragment.IsFactoryDefault == true
				&& deletedXFragment.IsStaged == false

				&& deletedYFragment.Description == defaultFragmentBDescription
				&& deletedYFragment.State == 'FactoryDefault'
				&& deletedYFragment.IsFactoryDefault == true
				&& deletedYFragment.IsStaged == false

				&& deletedZFragment == null
			);
		});

		test("Creating a new fragment without ID creates non-saved, staged, fragment with random ID", async assert => {
			let newFragment = await dataProvider.createFragment({});
			let newSavedFragment = await dataProvider.getFragment({ instanceIdentifier: newFragment.InstanceIdentifier });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: newFragment.InstanceIdentifier });

			assert(newFragment.InstanceIdentifier.length > 0
				&& newFragment.State == 'NotPersisted'
				&& newFragment.IsStaged == false

				&& newSavedFragment == null

				&& revertResult.reverted == true
				&& revertResult.revertedFragment == null
				&& revertResult.stagedFragments.length == 0
				);
		});

		test("Creating a new fragment with ID creates non-saved, staged, fragment with specific ID", async assert => {
			let newFragment = await dataProvider.createFragment({ instanceIdentifier: testNewId });
			let newSavedFragment = await dataProvider.getFragment({ instanceIdentifier: testNewId });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: testNewId });

			assert(newFragment.InstanceIdentifier.length > 0
				&& newFragment.State == 'NotPersisted'
				&& newFragment.IsStaged == false
				&& newFragment.InstanceIdentifier == testNewId

				&& newSavedFragment == null

				&& revertResult.reverted == true
				&& revertResult.revertedFragment == null
				&& revertResult.stagedFragments.length == 0
				);
		});

		test("Creating a new fragment with provider in non-dev mode creates non-saved, staged, fragment without provider", async assert => {
			let newFragment = await dataProvider.createFragment({ instanceIdentifier: testNewId, factoryDefaultProvider: testProviderAId });
			let newSavedFragment = await dataProvider.getFragment({ instanceIdentifier: testNewId });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: testNewId });

			assert(newFragment.InstanceIdentifier.length > 0
				&& newFragment.State == 'NotPersisted'
				&& newFragment.IsStaged == false
				&& newFragment.InstanceIdentifier == testNewId
				&& newFragment.FactoryDefaultProvider === null

				&& newSavedFragment == null

				&& revertResult.reverted == true
				&& revertResult.revertedFragment == null
				&& revertResult.stagedFragments.length == 0
				);
		});

		test("Cloning a fragment creates a custom, staged, fragment with random new fragment id and incremented name", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId });
			let clonedFragment = await dataProvider.getFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			await dataProvider.deleteFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });
			await dataProvider.publishFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& cloneResult.clonedFragment.InstanceIdentifier != fragmentAId
				&& cloneResult.clonedFragment.Name == (originalFragment.Name + ' 1')
				&& cloneResult.clonedFragment.Description == defaultFragmentADescription
				&& cloneResult.clonedFragment.State == 'Custom'
				&& cloneResult.clonedFragment.IsFactoryDefault == false
				&& cloneResult.clonedFragment.IsStaged == true

				&& cloneResult.clonedFragment.Attachments.length > 0

				&& cloneResult.clonedFragment.Attachments.length == originalFragment.Attachments.length

				&& cloneResult.stagedFragments.length == 1

				&& clonedFragment.InstanceIdentifier != fragmentAId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.Description == defaultFragmentADescription
				&& clonedFragment.State == 'Custom'
				&& clonedFragment.IsFactoryDefault == false
				&& clonedFragment.IsStaged == true

				&& clonedFragment.Attachments.length > 0

				&& clonedFragment.Attachments.length == originalFragment.Attachments.length
			);
		});

		test("Cloning a fragment with specific ID creates a custom, staged, fragment with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId, newInstanceIdentifier: newId });
			let clonedFragment = await dataProvider.getFragment({ instanceIdentifier: newId });
			await dataProvider.deleteFragment({ instanceIdentifier: newId });
			await dataProvider.publishFragment({ instanceIdentifier: newId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& cloneResult.clonedFragment.InstanceIdentifier == newId
				&& cloneResult.clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.InstanceIdentifier == newId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
			);
		});

		test("Publishing a cloned fragment publishes", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let clonedFragment = await dataProvider.getFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			await dataProvider.deleteFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });
			await dataProvider.publishFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& publishResult.publishedFragment.InstanceIdentifier != fragmentAId
				&& publishResult.publishedFragment.Name == (originalFragment.Name + ' 1')
				&& publishResult.publishedFragment.Description == defaultFragmentADescription
				&& publishResult.publishedFragment.State == 'Custom'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false

				&& publishResult.publishedFragment.Attachments.length > 0

				&& publishResult.publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& publishResult.stagedFragments.length == 0

				&& clonedFragment.InstanceIdentifier != fragmentAId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.Description == defaultFragmentADescription
				&& clonedFragment.State == 'Custom'
				&& clonedFragment.IsFactoryDefault == false
				&& clonedFragment.IsStaged == false

				&& clonedFragment.Attachments.length > 0

				&& clonedFragment.Attachments.length == originalFragment.Attachments.length
			);
		});

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let fragment = await dataProvider.getFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });

			assert(publishResult.publishedFragment !== null
				&& fragment == null);
		})

		test("Getting a fragment attachment gets attachment", async assert => {
			let attachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			assert(attachment.Name == testAttachmentName);
		});

		test("Saving a attachment saves attachment and sets fragment into staged state", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.isNew == false

				&& savedAttachment.Content == 'new attachment content'

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length == originalFragment.Attachments.length

				&& savedFragment.Attachments.length > 0);
		});

		test("Saving a attachment multiple times saves attachment and sets fragment into staged state", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult0 = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content 0' });
			let saveResult1 = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content 1' });
			let saveResult2 = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content 2' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedAttachment.Content == 'new attachment content 2'

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length == originalFragment.Attachments.length

				&& savedFragment.Attachments.length > 0);
		});

		test("Reverting a fragment with a saved attachment reverts both", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& revertedFragmentAttachment.Content === originalFragmentAttachment.Content

				&& revertedFragment.InstanceIdentifier == fragmentAId
				&& revertedFragment.State == 'FactoryDefault'

				&& revertedFragment.Attachments.length > 0);
		})

		test("Publishing a fragment with saved attachment publishes both", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

			let publishedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let publishedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

			let deletedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& publishedFragmentAttachment.Content == 'new content'

				&& publishedFragment.InstanceIdentifier == fragmentAId
				&& publishedFragment.State == 'CustomizedDefault'
				&& publishedFragment.IsFactoryDefault == false
				&& publishedFragment.IsStaged == false

				&& publishedFragment.Attachments.length > 0
			);
		});

		test("Deleting a published customization of default fragment reverts fragment and edited attachment", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

			let publishedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let publishedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

			let deletedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& deletedFragmentAttachment.Content === originalFragmentAttachment.Content

				&& deletedFragment.InstanceIdentifier == fragmentAId
				&& deletedFragment.State == 'FactoryDefault'

				&& deletedFragment.Attachments.length > 0
			);
		});

		test("Getting non-staged version of otherwise staged fragment attachment gets non-staged version", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let nonStagedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, staged: false });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragmentAttachment.Content != 'new content'
				&& savedAttachment.Content == 'new content'
				&& nonStagedFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default fragment attachment gets fac default version", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let facDefaultFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, factoryDefault: true });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragmentAttachment.Content != 'new content'
				&& savedAttachment.Content == 'new content'
				&& facDefaultFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Restoring a deleted attachment from non-staging restores it and its metadata", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult = await dataProvider.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let restoreResult = await dataProvider.restoreFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let restoredFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let restoredFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragmentAttachment == null

				&& restoreResult.stagedFragments.length == 1
				&& restoreResult.fragment.Attachments.length == originalFragment.Attachments.length
				&& restoreResult.fragment.Attachments.find(s => s.Name == testAttachmentName) != null
				&& restoreResult.savedAttachment.Content == originalFragmentAttachment.Content
				&& restoredFragment.Attachments.length == originalFragment.Attachments.length
				&& restoredFragment.Attachments.find(s => s.Name == testAttachmentName) != null
				&& restoredFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Restoring a deleted attachment from fac default restores it and its metadata", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult = await dataProvider.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

			let restoreResult = await dataProvider.restoreFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let restoredFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let restoredFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult2 = await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult2 = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragmentAttachment == null

				&& restoreResult.stagedFragments.length == 1
				&& restoreResult.fragment.Attachments.length == originalFragment.Attachments.length
				&& restoreResult.fragment.Attachments.find(s => s.Name == testAttachmentName) != null
				&& restoreResult.savedAttachment.Content == originalFragmentAttachment.Content
				&& restoredFragment.Attachments.length == originalFragment.Attachments.length
				&& restoredFragment.Attachments.find(s => s.Name == testAttachmentName) != null
				&& restoredFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Deleting a attachment from a default fragment sets fragment to staged with removed attachment", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deleteResult = await dataProvider.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deletedFragment.Attachments.find(s => s.Name == testAttachmentName) == null
				&& deletedFragment.State == 'CustomizedDefault'
				&& deletedFragment.IsFactoryDefault == false
				&& deletedFragment.IsStaged == true

				&& deletedFragmentAttachment == null
			);
		});

		test("Reverting attachment deletion from staged fragment sets fragment back to factory default", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deleteResult = await dataProvider.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deletedFragment.Attachments.find(s => s.Name == testAttachmentName) == null
				&& deletedFragment.State == 'CustomizedDefault'
				&& deletedFragment.IsFactoryDefault == false
				&& deletedFragment.IsStaged == true

				&& deletedFragmentAttachment == null

				&& revertResult.stagedFragments.length == 0
				&& revertResult.revertedFragment.IsStaged == false
				&& revertResult.revertedFragment.Attachments.length == originalFragment.Attachments.length
				&& revertResult.revertedFragment.Attachments.find(s => s.Name == testAttachmentName) != null

				&& revertedFragment.IsStaged == false
				&& revertedFragment.Attachments.length == originalFragment.Attachments.length
				&& revertedFragment.Attachments.find(s => s.Name == testAttachmentName) != null

				&& revertedFragmentAttachment !== null
			);
		});

		test("Renaming a attachment renames attachment even without new content", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, newName: 'newname.jsm' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: 'newname.jsm' });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalFragment.Attachments.filter(s => s.Name == testAttachmentName).length == 1

				&& originalFragment.Attachments.length == savedFragment.Attachments.length

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true
				&& savedFragment.Attachments.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedFragment.Attachments.filter(s => s.Name == testAttachmentName).length == 0

				&& savedAttachment.Name == 'newname.jsm'
				&& originalFragmentAttachment.Content == savedAttachment.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new attachment creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.createFragmentAttachment({ instanceIdentifier: fragmentAId });

			assert(saveResult
				&& saveResult.InstanceIdentifier == fragmentAId
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.FragmentProcessedName == originalFragment.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Attachments.length == originalFragment.Attachments.length
			);
		});

		test("Saving a new attachment saves attachment and sets fragment into staged state", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: 'newattachment.jsm', content: 'content' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: 'newattachment.jsm' });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& savedAttachment.Content == 'content'

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true
				&& savedFragment.Attachments.length == originalFragment.Attachments.length + 1

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
				globallyMergeDuplicates: false
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

		test("Listing fragments should list all fragments", async assert => {
			let fragments = (await dataModel.listFragments({ scriptable: false })).fragments;
			assert(fragments.length === defaultFragmentsLength);
		});

		test("Listing fragments by isStaged: true should only return staged fragments", async assert => {
			await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataModel.listFragments({ isStaged: true })).fragments;
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == 1
				&& fragments[0].Description == 'x'
				&& fragments[0].State == 'CustomizedDefault'
				&& fragments[0].IsFactoryDefault == false
				&& fragments[0].IsStaged == true);
		});

		test("Listing fragments by state: 'FactoryDefault' should only return fragments which are currently in a Factory Default State", async assert => {
			await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataModel.listFragments({ scriptable: false, state: 'FactoryDefault' })).fragments;
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == defaultFragmentsLength - 1
				&& fragments[0].State == 'FactoryDefault');
		});

		test("Listing fragments by state: 'CustomizedDefault' should return only fragments which are currently in a CustomizedDefault State", async assert => {
			await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataModel.listFragments({ state: 'CustomizedDefault' })).fragments;
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == 1
				&& fragments[0].State == 'CustomizedDefault');
		});

		test("Listing fragments by state: 'Custom' should only return fragments which are currently in a Custom State", async assert => {
			await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataModel.listFragments({ state: 'Custom' })).fragments;
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == 0);
		});

		test("Listing fragments by provider should only return fragments which match", async assert => {
			let testAFragments = (await dataModel.listFragments({ factoryDefaultProvider: testProviderAId })).fragments;
			let testBFragments = (await dataModel.listFragments({ factoryDefaultProvider: testProviderBId })).fragments;
			assert(testAFragments.length == testProviderFragmentsLength && testBFragments.length == testBProviderFragmentsLength
				&& testAFragments[0].FactoryDefaultProvider == testProviderAId
				&& testBFragments[0].FactoryDefaultProvider == testProviderBId);
		});

		test("Getting a fragment returns fragment", async assert => {
			let fragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId, });
			assert(fragment.InstanceIdentifier == fragmentAId);
		});

		test("Getting a fragment returns fragment with provider", async assert => {
			let fragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId, });
			assert(fragment.InstanceIdentifier == fragmentAId && fragment.FactoryDefaultProviderName && fragment.FactoryDefaultProviderName.length > 0);
		});

		test("Getting a fragment returns latest version of fragment", async assert => {
			await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId, });
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.State == 'CustomizedDefault'
				&& fragment.IsFactoryDefault == false
				&& fragment.IsStaged == true);
		});

		test("Getting a fragment with staged: false should return non-staged version of fragment", async assert => {
			await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId, staged: false });
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == defaultFragmentADescription
				&& fragment.State == 'CustomizedDefault' // to know that this is a cutomized fragment but currently viewing fac default version
				&& fragment.IsFactoryDefault == true
				&& fragment.IsStaged == false);
		});


		test("Getting a fragment with staged: true should return staged version of fragment", async assert => {
			await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId, staged: true });
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == 'x'
				&& fragment.State == 'CustomizedDefault' // to know that this is a cutomized fragment but currently viewing fac default version
				&& fragment.IsFactoryDefault == false
				&& fragment.IsStaged == true);
		});

		test("Getting a fragment with factoryDefault: true should return factory default version of fragment", async assert => {
			await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId, factoryDefault: true });
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == defaultFragmentADescription
				&& fragment.State == 'CustomizedDefault' // to know that this is a cutomized fragment but currently viewing fac default version
				&& fragment.IsFactoryDefault == true
				&& fragment.IsStaged == false);
		});

		test("Getting a fragment with factoryDefault: false should return non-factory default version of fragment", async assert => {
			await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId, factoryDefault: false });
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == 'x'
				&& fragment.State == 'CustomizedDefault' // to know that this is a cutomized fragment but currently viewing fac default version
				&& fragment.IsFactoryDefault == false
				&& fragment.IsStaged == true);
		});

		test("Saving a default fragment saves and sets it into a staged, customized default, state and saves attachments too", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let savedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.isNew == false

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.Description == 'x'
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length > 0
				&& savedFragment.Attachments.length == originalFragment.Attachments.length);
		});

		test("Saving a default fragment multiple times saves and sets it into a staged, customized default, state and saves attachments too", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult0 = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'y' });
			let saveResult2 = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'z' });
			let savedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId  });
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.Description == 'z'
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length > 0
				&& savedFragment.Attachments.length == originalFragment.Attachments.length);
		});

		test("Saving a default fragment saves and returns saved fragment and list of staged", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			await dataModel.revertFragment({ instanceIdentifier: fragmentAId })
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedFragment.InstanceIdentifier == fragmentAId
				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'CustomizedDefault'
				&& saveResult.savedFragment.IsFactoryDefault == false
				&& saveResult.savedFragment.IsStaged == true

				&& saveResult.savedFragment.Attachments.length > 0

				&& saveResult.savedFragment.Attachments.length == originalFragment.Attachments.length

				&& saveResult.stagedFragments.length == 1

				&& saveResult.stagedFragments[0].InstanceIdentifier == fragmentAId
				&& saveResult.stagedFragments[0].Description == 'x'
				&& saveResult.stagedFragments[0].State == 'CustomizedDefault'
				&& saveResult.stagedFragments[0].IsFactoryDefault == false
				&& saveResult.stagedFragments[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default fragment reverts and sets it into a staged, customized default, state and saves attachments too", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.savedFragment.InstanceIdentifier == fragmentAId
				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'CustomizedDefault'
				&& saveResult.savedFragment.IsFactoryDefault == false
				&& saveResult.savedFragment.IsStaged == true

				&& saveResult.savedFragment.Attachments.length > 0

				&& saveResult.savedFragment.Attachments.length == originalFragment.Attachments.length

				&& revertResult.revertedFragment.InstanceIdentifier == fragmentAId
				&& revertResult.revertedFragment.Description == defaultFragmentADescription
				&& revertResult.revertedFragment.State == 'FactoryDefault'
				&& revertResult.revertedFragment.IsFactoryDefault == true
				&& revertResult.revertedFragment.IsStaged == false

				&& revertResult.revertedFragment.Attachments.length > 0
				&& revertResult.revertedFragment.Attachments.length == originalFragment.Attachments.length

				&& revertedFragment.InstanceIdentifier == fragmentAId

				&& revertedFragment.Description == defaultFragmentADescription
				&& revertedFragment.State == 'FactoryDefault'
				&& revertedFragment.IsFactoryDefault == true
				&& revertedFragment.IsStaged == false

				&& revertedFragment.Attachments.length > 0

				&& revertedFragment.Attachments.length == originalFragment.Attachments.length
				);
		});

		test("Reverting multiple fragments reverts multiple fragments", async assert => {
			let originalFragment0 = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragment1 = await dataModel.getFragment({ instanceIdentifier: fragmentBId });
			let originalFragment2 = await dataModel.getFragment({ instanceIdentifier: fragmentCId });

			let saveResult0 = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataModel.saveFragment({ instanceIdentifier: fragmentBId, description: 'y' });
			let saveResult2 = await dataModel.saveFragment({ instanceIdentifier: fragmentCId, description: 'z' });

			let revertResult = await dataModel.revertFragments({ fragments: [
				{ instanceIdentifier: fragmentAId },
				{ instanceIdentifier: fragmentBId },
				{ instanceIdentifier: fragmentCId }
			]});

			let revertedFragment0 = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment1 = await dataModel.getFragment({ instanceIdentifier: fragmentBId });
			let revertedFragment2 = await dataModel.getFragment({ instanceIdentifier: fragmentCId });

			assert(originalFragment0.Description == defaultFragmentADescription
				&& originalFragment0.State == 'FactoryDefault'
				&& originalFragment0.IsFactoryDefault == true
				&& originalFragment0.IsStaged == false

				&& originalFragment1.Description == defaultFragmentBDescription
				&& originalFragment1.State == 'FactoryDefault'
				&& originalFragment1.IsFactoryDefault == true
				&& originalFragment1.IsStaged == false

				&& originalFragment2.Description == defaultFragmentCDescription
				&& originalFragment2.State == 'FactoryDefault'
				&& originalFragment2.IsFactoryDefault == true
				&& originalFragment2.IsStaged == false

				&& saveResult0.savedFragment.Description == 'x'
				&& saveResult0.savedFragment.State == 'CustomizedDefault'
				&& saveResult0.savedFragment.IsFactoryDefault == false
				&& saveResult0.savedFragment.IsStaged == true

				&& saveResult1.savedFragment.Description == 'y'
				&& saveResult1.savedFragment.State == 'CustomizedDefault'
				&& saveResult1.savedFragment.IsFactoryDefault == false
				&& saveResult1.savedFragment.IsStaged == true

				&& saveResult2.savedFragment.Description == 'z'
				&& saveResult2.savedFragment.State == 'CustomizedDefault'
				&& saveResult2.savedFragment.IsFactoryDefault == false
				&& saveResult2.savedFragment.IsStaged == true

				&& revertResult.stagedFragments.length == 0

				&& revertedFragment0.Description == defaultFragmentADescription
				&& revertedFragment0.State == 'FactoryDefault'
				&& revertedFragment0.IsFactoryDefault == true
				&& revertedFragment0.IsStaged == false

				&& revertedFragment1.Description == defaultFragmentBDescription
				&& revertedFragment1.State == 'FactoryDefault'
				&& revertedFragment1.IsFactoryDefault == true
				&& revertedFragment1.IsStaged == false

				&& revertedFragment2.Description == defaultFragmentCDescription
				&& revertedFragment2.State == 'FactoryDefault'
				&& revertedFragment2.IsFactoryDefault == true
				&& revertedFragment2.IsStaged == false
				);
		});

		test("Deleting a published customized default stages reversion to factory default", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });
			let deleteResult = await dataModel.deleteFragment({ instanceIdentifier: fragmentAId });
			let stagedDeletedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'CustomizedDefault'
				&& saveResult.savedFragment.IsFactoryDefault == false
				&& saveResult.savedFragment.IsStaged == true

				&& publishResult.publishedFragment.Description == 'x'
				&& publishResult.publishedFragment.State == 'CustomizedDefault'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false

				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'FactoryDefault'
				&& deleteResult.fragment.IsFactoryDefault == true
				&& deleteResult.fragment.IsStaged == true

				&& stagedDeletedFragment.Description == defaultFragmentADescription
				&& stagedDeletedFragment.State == 'FactoryDefault'
				&& stagedDeletedFragment.IsFactoryDefault == true
				&& stagedDeletedFragment.IsStaged == true
				);
		});

		test("Reverting a staged deletion of customized default restores customized default", async assert => {

			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });
			let deleteResult = await dataModel.deleteFragment({ instanceIdentifier: fragmentAId });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });

			let realDeleteResult = await dataModel.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'CustomizedDefault'
				&& saveResult.savedFragment.IsFactoryDefault == false
				&& saveResult.savedFragment.IsStaged == true

				&& publishResult.publishedFragment.Description == 'x'
				&& publishResult.publishedFragment.State == 'CustomizedDefault'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false

				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'FactoryDefault'
				&& deleteResult.fragment.IsFactoryDefault == true
				&& deleteResult.fragment.IsStaged == true

				&& revertResult.revertedFragment.Description == 'x'
				&& revertResult.revertedFragment.State == 'CustomizedDefault'
				&& revertResult.revertedFragment.IsFactoryDefault == false
				&& revertResult.revertedFragment.IsStaged == false
				);
		})

		test("Deleting a published custom stages deletion", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataModel.cloneFragment({ instanceIdentifier: fragmentAId, newInstanceIdentifier: testNewId });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: testNewId });
			let deleteResult = await dataModel.deleteFragment({ instanceIdentifier: testNewId });
			let stagedDeletedFragment = await dataModel.getFragment({ instanceIdentifier: testNewId });
			let deletePublishResult = await dataModel.publishFragment({ instanceIdentifier: testNewId });

			assert(originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.IsDeleted == false

				&& cloneResult.clonedFragment.Description == defaultFragmentADescription
				&& cloneResult.clonedFragment.State == 'Custom'
				&& cloneResult.clonedFragment.IsFactoryDefault == false
				&& cloneResult.clonedFragment.IsStaged == true
				&& cloneResult.clonedFragment.IsDeleted == false

				&& publishResult.publishedFragment.Description == defaultFragmentADescription
				&& publishResult.publishedFragment.State == 'Custom'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false
				&& publishResult.publishedFragment.IsDeleted == false

				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'Custom'
				&& deleteResult.fragment.IsFactoryDefault == false
				&& deleteResult.fragment.IsDeleted == true
				&& deleteResult.fragment.IsStaged == true

				&& stagedDeletedFragment.Description == defaultFragmentADescription
				&& stagedDeletedFragment.State == 'Custom'
				&& stagedDeletedFragment.IsFactoryDefault == false
				&& stagedDeletedFragment.IsDeleted == true
				&& stagedDeletedFragment.IsStaged == true
				);

		});

		test("Reverting a staged custom deletion restores custom", async assert => {

			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataModel.cloneFragment({ instanceIdentifier: fragmentAId, newInstanceIdentifier: testNewId });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: testNewId });

			let deleteResult = await dataModel.deleteFragment({ instanceIdentifier: testNewId });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: testNewId });

			let realDeleteResult = await dataModel.deleteFragment({ instanceIdentifier: testNewId });
			let deletePublishResult = await dataModel.publishFragment({ instanceIdentifier: testNewId });

			assert(originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.IsDeleted == false

				&& cloneResult.clonedFragment.Description == defaultFragmentADescription
				&& cloneResult.clonedFragment.State == 'Custom'
				&& cloneResult.clonedFragment.IsFactoryDefault == false
				&& cloneResult.clonedFragment.IsStaged == true
				&& cloneResult.clonedFragment.IsDeleted == false

				&& publishResult.publishedFragment.Description == defaultFragmentADescription
				&& publishResult.publishedFragment.State == 'Custom'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false
				&& publishResult.publishedFragment.IsDeleted == false

				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'Custom'
				&& deleteResult.fragment.IsFactoryDefault == false
				&& deleteResult.fragment.IsDeleted == true
				&& deleteResult.fragment.IsStaged == true

				&& revertResult.revertedFragment.Description == defaultFragmentADescription
				&& revertResult.revertedFragment.State == 'Custom'
				&& revertResult.revertedFragment.IsFactoryDefault == false
				&& revertResult.revertedFragment.IsStaged == false
				&& revertResult.revertedFragment.IsDeleted == false
				);

		});

		test("Publishing a saved change to a default fragment saves and sets it into a published, customized default, state and saves attachments too", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });
			let publishedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			await dataModel.deleteFragment({ instanceIdentifier: fragmentAId })
			await dataModel.publishFragment({ instanceIdentifier: fragmentAId });
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& publishedFragment.InstanceIdentifier == fragmentAId
				&& publishedFragment.Description == 'x'
				&& publishedFragment.State == 'CustomizedDefault'
				&& publishedFragment.IsFactoryDefault == false
				&& publishedFragment.IsStaged == false

				&& publishedFragment.Attachments.length > 0

				&& publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& publishResult.publishedFragment.InstanceIdentifier == fragmentAId
				&& publishResult.publishedFragment.Description == 'x'
				&& publishResult.publishedFragment.State == 'CustomizedDefault'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false

				&& publishResult.publishedFragment.Attachments.length > 0

				&& publishResult.publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& publishResult.stagedFragments.length == 0
				);
		});

		test("Publishing multiple fragments publishes multiple fragments", async assert => {
			let originalFragment0 = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragment1 = await dataModel.getFragment({ instanceIdentifier: fragmentBId });
			let originalFragment2 = await dataModel.getFragment({ instanceIdentifier: fragmentCId });

			let saveResult0 = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataModel.saveFragment({ instanceIdentifier: fragmentBId, description: 'y' });
			let saveResult2 = await dataModel.saveFragment({ instanceIdentifier: fragmentCId, description: 'z' });

			let publishResult = await dataModel.publishFragments({ fragments: [
				{ instanceIdentifier: fragmentAId },
				{ instanceIdentifier: fragmentBId },
				{ instanceIdentifier: fragmentCId }
			]});

			let publishedFragment0 = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let publishedFragment1 = await dataModel.getFragment({ instanceIdentifier: fragmentBId });
			let publishedFragment2 = await dataModel.getFragment({ instanceIdentifier: fragmentCId });

			await dataModel.deleteFragment({ instanceIdentifier: fragmentAId });
			await dataModel.deleteFragment({ instanceIdentifier: fragmentBId });
			await dataModel.deleteFragment({ instanceIdentifier: fragmentCId });
			await dataModel.publishFragment({ instanceIdentifier: fragmentAId });
			await dataModel.publishFragment({ instanceIdentifier: fragmentBId });
			await dataModel.publishFragment({ instanceIdentifier: fragmentCId });

			assert(originalFragment0.Description == defaultFragmentADescription
				&& originalFragment0.State == 'FactoryDefault'
				&& originalFragment0.IsFactoryDefault == true
				&& originalFragment0.IsStaged == false

				&& originalFragment1.Description == defaultFragmentBDescription
				&& originalFragment1.State == 'FactoryDefault'
				&& originalFragment1.IsFactoryDefault == true
				&& originalFragment1.IsStaged == false

				&& originalFragment2.Description == defaultFragmentCDescription
				&& originalFragment2.State == 'FactoryDefault'
				&& originalFragment2.IsFactoryDefault == true
				&& originalFragment2.IsStaged == false

				&& publishResult.stagedFragments.length == 0

				&& publishedFragment0.Description == 'x'
				&& publishedFragment0.State == 'CustomizedDefault'
				&& publishedFragment0.IsFactoryDefault == false
				&& publishedFragment0.IsStaged == false

				&& publishedFragment1.Description == 'y'
				&& publishedFragment1.State == 'CustomizedDefault'
				&& publishedFragment1.IsFactoryDefault == false
				&& publishedFragment1.IsStaged == false

				&& publishedFragment2.Description == 'z'
				&& publishedFragment2.State == 'CustomizedDefault'
				&& publishedFragment2.IsFactoryDefault == false
				&& publishedFragment2.IsStaged == false
				);
		});

		test("Deleting a published, customized default fragment reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });
			let deleteResult = await dataModel.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });
			let deletedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& deleteResult.fragment.InstanceIdentifier == fragmentAId
				&& deleteResult.fragment.Description == defaultFragmentADescription
				&& deleteResult.fragment.State == 'FactoryDefault'
				&& deleteResult.fragment.IsFactoryDefault == true
				&& deleteResult.fragment.IsStaged == true
				&& deleteResult.fragment.IsReverted == true
				&& deleteResult.fragment.IsDeleted == false

				&& deletePublishResult.publishedFragment.InstanceIdentifier == fragmentAId
				&& deletePublishResult.publishedFragment.Description == defaultFragmentADescription
				&& deletePublishResult.publishedFragment.State == 'FactoryDefault'
				&& deletePublishResult.publishedFragment.IsFactoryDefault == true
				&& deletePublishResult.publishedFragment.IsStaged == false

				&& deletePublishResult.publishedFragment.Attachments.length > 0

				&& deletePublishResult.publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& deletedFragment.InstanceIdentifier == fragmentAId
				&& deletedFragment.Description == defaultFragmentADescription
				&& deletedFragment.State == 'FactoryDefault'
				&& deletedFragment.IsFactoryDefault == true
				&& deletedFragment.IsStaged == false

				&& deletedFragment.Attachments.length > 0

				&& deletedFragment.Attachments.length == originalFragment.Attachments.length
				);
		});

		test("Deleting multiple fragments at different states deletes and/or reverts multiple fragments", async assert => {
			// 3 types of states: staged customized default, published customized default, published custom
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let fragmentASaveResult = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let fragmentBSaveResult = await dataModel.saveFragment({ instanceIdentifier: fragmentBId, description: 'y' });
			let fragmentBPublishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentBId });
			let fragmentCCloneResult = await dataModel.cloneFragment({ instanceIdentifier: fragmentCId, newInstanceIdentifier: newId });
			let fragmentCClonePublishResult = await dataModel.publishFragment({ instanceIdentifier: newId });

			let stagedXFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let publishedYFragment = await dataModel.getFragment({ instanceIdentifier: fragmentBId });
			let clonedZFragment = await dataModel.getFragment({ instanceIdentifier: newId });

			let deleteResult = await dataModel.deleteFragments({ fragments: [
				{ instanceIdentifier: fragmentAId },
				{ instanceIdentifier: fragmentBId },
				{ instanceIdentifier: newId }
			]});
			let deletePublishResult = await dataModel.publishFragments({ fragments: [
				{ instanceIdentifier: fragmentAId },
				{ instanceIdentifier: fragmentBId },
				{ instanceIdentifier: newId }
			]});

			let deletedXFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let deletedYFragment = await dataModel.getFragment({ instanceIdentifier: fragmentBId });
			let deletedZFragment = await dataModel.getFragment({ instanceIdentifier: newId });

			assert(stagedXFragment.Description == 'x'
				&& stagedXFragment.State == 'CustomizedDefault'
				&& stagedXFragment.IsFactoryDefault == false
				&& stagedXFragment.IsStaged == true

				&& publishedYFragment.Description == 'y'
				&& publishedYFragment.State == 'CustomizedDefault'
				&& publishedYFragment.IsFactoryDefault == false
				&& publishedYFragment.IsStaged == false

				&& clonedZFragment.State == 'Custom'
				&& clonedZFragment.IsFactoryDefault == false
				&& clonedZFragment.IsStaged == false

				&& deleteResult.stagedFragments.length == 2
				&& deleteResult.revertedFragments.length == 1
				&& deleteResult.stagedFragments[0].InstanceIdentifier == fragmentBId
				&& deleteResult.stagedFragments[0].IsDeleted == false
				&& deleteResult.stagedFragments[0].IsReverted == true
				&& deleteResult.stagedFragments[1].InstanceIdentifier == newId
				&& deleteResult.stagedFragments[1].IsDeleted == true
				&& deleteResult.stagedFragments[1].IsReverted == true
				&& deleteResult.revertedFragments[0].InstanceIdentifier == fragmentAId

				&& deletePublishResult.deletedFragments.length == 1
				&& deletePublishResult.revertedFragments.length == 1
				&& deletePublishResult.deletedFragments[0].InstanceIdentifier == newId
				&& deletePublishResult.revertedFragments[0].InstanceIdentifier == fragmentBId

				&& deletedXFragment.Description == defaultFragmentADescription
				&& deletedXFragment.State == 'FactoryDefault'
				&& deletedXFragment.IsFactoryDefault == true
				&& deletedXFragment.IsStaged == false

				&& deletedYFragment.Description == defaultFragmentBDescription
				&& deletedYFragment.State == 'FactoryDefault'
				&& deletedYFragment.IsFactoryDefault == true
				&& deletedYFragment.IsStaged == false

				&& deletedZFragment == null
			);
		});

		test("Creating a new fragment without ID creates non-saved, staged, fragment with random ID", async assert => {
			let newFragment = await dataModel.createFragment({});
			let newSavedFragment = await dataModel.getFragment({ instanceIdentifier: newFragment.InstanceIdentifier });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: newFragment.InstanceIdentifier });

			assert(newFragment.InstanceIdentifier.length > 0
				&& newFragment.State == 'NotPersisted'
				&& newFragment.IsStaged == false

				&& newSavedFragment == null

				&& revertResult.reverted == true
				&& revertResult.revertedFragment == null
				&& revertResult.stagedFragments.length == 0
				);
		});

		test("Creating a new fragment with ID creates non-saved, staged, fragment with specific ID", async assert => {
			let newFragment = await dataModel.createFragment({ instanceIdentifier: testNewId });
			let newSavedFragment = await dataModel.getFragment({ instanceIdentifier: testNewId });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: testNewId });

			assert(newFragment.InstanceIdentifier.length > 0
				&& newFragment.State == 'NotPersisted'
				&& newFragment.IsStaged == false
				&& newFragment.InstanceIdentifier == testNewId

				&& newSavedFragment == null

				&& revertResult.reverted == true
				&& revertResult.revertedFragment == null
				&& revertResult.stagedFragments.length == 0
				);
		});

		test("Creating a new fragment with provider in non-dev mode creates non-saved, staged, fragment without provider", async assert => {
			let newFragment = await dataModel.createFragment({ instanceIdentifier: testNewId, factoryDefaultProvider: testProviderAId });
			let newSavedFragment = await dataModel.getFragment({ instanceIdentifier: testNewId });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: testNewId });

			assert(newFragment.InstanceIdentifier.length > 0
				&& newFragment.State == 'NotPersisted'
				&& newFragment.IsStaged == false
				&& newFragment.InstanceIdentifier == testNewId
				&& newFragment.FactoryDefaultProvider === null

				&& newSavedFragment == null

				&& revertResult.reverted == true
				&& revertResult.revertedFragment == null
				&& revertResult.stagedFragments.length == 0
				);
		});

		test("Cloning a fragment creates a custom, staged, fragment with random new fragment id and incremented name", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataModel.cloneFragment({ instanceIdentifier: fragmentAId });
			let clonedFragment = await dataModel.getFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			await dataModel.deleteFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });
			await dataModel.publishFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& cloneResult.clonedFragment.InstanceIdentifier != fragmentAId
				&& cloneResult.clonedFragment.Name == (originalFragment.Name + ' 1')
				&& cloneResult.clonedFragment.Description == defaultFragmentADescription
				&& cloneResult.clonedFragment.State == 'Custom'
				&& cloneResult.clonedFragment.IsFactoryDefault == false
				&& cloneResult.clonedFragment.IsStaged == true

				&& cloneResult.clonedFragment.Attachments.length > 0

				&& cloneResult.clonedFragment.Attachments.length == originalFragment.Attachments.length

				&& cloneResult.stagedFragments.length == 1

				&& clonedFragment.InstanceIdentifier != fragmentAId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.Description == defaultFragmentADescription
				&& clonedFragment.State == 'Custom'
				&& clonedFragment.IsFactoryDefault == false
				&& clonedFragment.IsStaged == true

				&& clonedFragment.Attachments.length > 0

				&& clonedFragment.Attachments.length == originalFragment.Attachments.length
			);
		});

		test("Cloning a fragment with specific ID creates a custom, staged, fragment with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataModel.cloneFragment({ instanceIdentifier: fragmentAId, newInstanceIdentifier: newId });
			let clonedFragment = await dataModel.getFragment({ instanceIdentifier: newId });
			await dataModel.deleteFragment({ instanceIdentifier: newId });
			await dataModel.publishFragment({ instanceIdentifier: newId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& cloneResult.clonedFragment.InstanceIdentifier == newId
				&& cloneResult.clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.InstanceIdentifier == newId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
			);
		});

		test("Publishing a cloned fragment publishes", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataModel.cloneFragment({ instanceIdentifier: fragmentAId });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let clonedFragment = await dataModel.getFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			await dataModel.deleteFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });
			await dataModel.publishFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& publishResult.publishedFragment.InstanceIdentifier != fragmentAId
				&& publishResult.publishedFragment.Name == (originalFragment.Name + ' 1')
				&& publishResult.publishedFragment.Description == defaultFragmentADescription
				&& publishResult.publishedFragment.State == 'Custom'
				&& publishResult.publishedFragment.IsFactoryDefault == false
				&& publishResult.publishedFragment.IsStaged == false

				&& publishResult.publishedFragment.Attachments.length > 0

				&& publishResult.publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& publishResult.stagedFragments.length == 0

				&& clonedFragment.InstanceIdentifier != fragmentAId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.Description == defaultFragmentADescription
				&& clonedFragment.State == 'Custom'
				&& clonedFragment.IsFactoryDefault == false
				&& clonedFragment.IsStaged == false

				&& clonedFragment.Attachments.length > 0

				&& clonedFragment.Attachments.length == originalFragment.Attachments.length
			);
		});

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataModel.cloneFragment({ instanceIdentifier: fragmentAId });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let deleteResult = await dataModel.deleteFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let deletePublishResult = await dataModel.publishFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let fragment = await dataModel.getFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });

			assert(publishResult.publishedFragment !== null
				&& fragment == null);
		})

		test("Getting a fragment attachment gets attachment", async assert => {
			let attachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			assert(attachment.Name == testAttachmentName);
		});

		test("Saving a attachment saves attachment and sets fragment into staged state", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content' });
			let savedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.isNew == false

				&& savedAttachment.Content == 'new attachment content'

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length == originalFragment.Attachments.length

				&& savedFragment.Attachments.length > 0);
		});

		test("Saving a attachment multiple times saves attachment and sets fragment into staged state", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult0 = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content 0' });
			let saveResult1 = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content 1' });
			let saveResult2 = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content 2' });
			let savedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedAttachment.Content == 'new attachment content 2'

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length == originalFragment.Attachments.length

				&& savedFragment.Attachments.length > 0);
		});

		test("Reverting a fragment with a saved attachment reverts both", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& revertedFragmentAttachment.Content === originalFragmentAttachment.Content

				&& revertedFragment.InstanceIdentifier == fragmentAId
				&& revertedFragment.State == 'FactoryDefault'

				&& revertedFragment.Attachments.length > 0);
		})

		test("Publishing a fragment with saved attachment publishes both", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let saveResult = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });

			let publishedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let publishedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult = await dataModel.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });

			let deletedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& publishedFragmentAttachment.Content == 'new content'

				&& publishedFragment.InstanceIdentifier == fragmentAId
				&& publishedFragment.State == 'CustomizedDefault'
				&& publishedFragment.IsFactoryDefault == false
				&& publishedFragment.IsStaged == false

				&& publishedFragment.Attachments.length > 0
			);
		});

		test("Deleting a published customization of default fragment reverts fragment and edited attachment", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let saveResult = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let publishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });

			let publishedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let publishedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult = await dataModel.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });

			let deletedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& deletedFragmentAttachment.Content === originalFragmentAttachment.Content

				&& deletedFragment.InstanceIdentifier == fragmentAId
				&& deletedFragment.State == 'FactoryDefault'

				&& deletedFragment.Attachments.length > 0
			);
		});

		test("Getting non-staged version of otherwise staged fragment attachment gets non-staged version", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let savedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let nonStagedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, staged: false });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragmentAttachment.Content != 'new content'
				&& savedAttachment.Content == 'new content'
				&& nonStagedFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default fragment attachment gets fac default version", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let savedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let facDefaultFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, factoryDefault: true });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragmentAttachment.Content != 'new content'
				&& savedAttachment.Content == 'new content'
				&& facDefaultFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Restoring a deleted attachment from non-staging restores it and its metadata", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult = await dataModel.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let restoreResult = await dataModel.restoreFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let restoredFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let restoredFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragmentAttachment == null

				&& restoreResult.stagedFragments.length == 1
				&& restoreResult.fragment.Attachments.length == originalFragment.Attachments.length
				&& restoreResult.fragment.Attachments.find(s => s.Name == testAttachmentName) != null
				&& restoreResult.savedAttachment.Content == originalFragmentAttachment.Content
				&& restoredFragment.Attachments.length == originalFragment.Attachments.length
				&& restoredFragment.Attachments.find(s => s.Name == testAttachmentName) != null
				&& restoredFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Restoring a deleted attachment from fac default restores it and its metadata", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult = await dataModel.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let publishResult = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });

			let restoreResult = await dataModel.restoreFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let restoredFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let restoredFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult2 = await dataModel.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult2 = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragmentAttachment == null

				&& restoreResult.stagedFragments.length == 1
				&& restoreResult.fragment.Attachments.length == originalFragment.Attachments.length
				&& restoreResult.fragment.Attachments.find(s => s.Name == testAttachmentName) != null
				&& restoreResult.savedAttachment.Content == originalFragmentAttachment.Content
				&& restoredFragment.Attachments.length == originalFragment.Attachments.length
				&& restoredFragment.Attachments.find(s => s.Name == testAttachmentName) != null
				&& restoredFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Deleting a attachment from a default fragment sets fragment to staged with removed attachment", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deleteResult = await dataModel.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deletedFragment.Attachments.find(s => s.Name == testAttachmentName) == null
				&& deletedFragment.State == 'CustomizedDefault'
				&& deletedFragment.IsFactoryDefault == false
				&& deletedFragment.IsStaged == true

				&& deletedFragmentAttachment == null
			);
		});

		test("Reverting attachment deletion from staged fragment sets fragment back to factory default", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deleteResult = await dataModel.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deletedFragment.Attachments.find(s => s.Name == testAttachmentName) == null
				&& deletedFragment.State == 'CustomizedDefault'
				&& deletedFragment.IsFactoryDefault == false
				&& deletedFragment.IsStaged == true

				&& deletedFragmentAttachment == null

				&& revertResult.stagedFragments.length == 0
				&& revertResult.revertedFragment.IsStaged == false
				&& revertResult.revertedFragment.Attachments.length == originalFragment.Attachments.length
				&& revertResult.revertedFragment.Attachments.find(s => s.Name == testAttachmentName) != null

				&& revertedFragment.IsStaged == false
				&& revertedFragment.Attachments.length == originalFragment.Attachments.length
				&& revertedFragment.Attachments.find(s => s.Name == testAttachmentName) != null

				&& revertedFragmentAttachment !== null
			);
		});

		test("Renaming a attachment renames attachment even without new content", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, newName: 'newname.jsm' });
			let savedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: 'newname.jsm' });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalFragment.Attachments.filter(s => s.Name == testAttachmentName).length == 1

				&& originalFragment.Attachments.length == savedFragment.Attachments.length

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true
				&& savedFragment.Attachments.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedFragment.Attachments.filter(s => s.Name == testAttachmentName).length == 0

				&& savedAttachment.Name == 'newname.jsm'
				&& originalFragmentAttachment.Content == savedAttachment.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new attachment creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.createFragmentAttachment({ instanceIdentifier: fragmentAId });

			assert(saveResult
				&& saveResult.InstanceIdentifier == fragmentAId
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.FragmentProcessedName == originalFragment.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Attachments.length == originalFragment.Attachments.length
			);
		});

		test("Saving a new attachment saves attachment and sets fragment into staged state", async assert => {
			let originalFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataModel.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: 'newattachment.jsm', content: 'content' });
			let savedFragment = await dataModel.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataModel.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: 'newattachment.jsm' });
			let revertResult = await dataModel.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& savedAttachment.Content == 'content'

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'CustomizedDefault'
				&& savedFragment.IsFactoryDefault == false
				&& savedFragment.IsStaged == true
				&& savedFragment.Attachments.length == originalFragment.Attachments.length + 1

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

		// resets customized default and new custom fragments, returns promise
		function testWithReset(name, fn) {
			if(!fn) {
				test(name);
			} else {
				test(name, async assert=> {
					// clear test subscriptions
					messaging.unsubscribe(testMessageNameSpace);

					// reset test targets
					await dataProvider.deleteFragment({ instanceIdentifier: fragmentAId });
					await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

					await dataProvider.deleteFragment({ instanceIdentifier: testNewId });
					await dataProvider.publishFragment({ instanceIdentifier: testNewId });

					// run test
					await fn(assert);
				});
			}
		}

		testWithReset("Cloning a fragment should raise fragment.created", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.fragment.created', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneFragment({
				instanceIdentifier: fragmentAId,
				newInstanceIdentifier: testNewId
			});

			assert(
				subData1
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.model.InstanceIdentifier == testNewId
				&& subData1.model.State == 'Custom'
			);
		});

		testWithReset("Saving an update to a fragment should raise fragment.updated", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.fragment.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveFragment({
				instanceIdentifier: fragmentAId,
				description: 'new description'
			});

			assert(
				subData1 !== null
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.model.Description == 'new description'
			);
		});

		testWithReset("Deleting a custom/cloned fragment should raise fragment.deleted", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.fragment.deleted', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneFragment({
				instanceIdentifier: fragmentAId,
				newInstanceIdentifier: testNewId,
				description: 'new description'
			});

			let deleteResult = await dataModel.deleteFragment({
				instanceIdentifier: testNewId
			});
			let deletePublishResult = await dataModel.publishFragment({
				instanceIdentifier: testNewId
			});

			assert(subData1
				&& subData1.id.instanceIdentifier == testNewId
				&& subData1.model === null
			);
		});

		testWithReset("Deleting a customized default fragment should revert to fac and raise fragment.updated instead of delete", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.fragment.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveFragment({
				instanceIdentifier: fragmentAId,
				description: 'new-desc'
			});

			let deleteResult = await dataModel.deleteFragment({
				instanceIdentifier: fragmentAId
			})
			let deletePublishResult = await dataModel.publishFragment({
				instanceIdentifier: fragmentAId
			});

			assert(
				subData1 !== null
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.model !== null
				&& subData1.model.Description === defaultFragmentADescription
			);
		});

		testWithReset("Publishing a fragment should raise fragment.updated", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.fragment.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveFragment({
				instanceIdentifier: fragmentAId,
				description: 'new-desc'
			});

			let publishResult = await dataModel.publishFragment({
				instanceIdentifier: fragmentAId
			})

			assert(
				subData1 !== null
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.model.Description == 'new-desc'
				&& subData1.model.IsStaged === false
				&& subData1.model.State === 'CustomizedDefault'
			);
		});


		testWithReset("Reverting a custom fragment should raise fragment.deleted", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.fragment.deleted', testMessageNameSpace, data => subData1 = data);

			let cloneResult = await dataModel.cloneFragment({
				instanceIdentifier: fragmentAId,
				newInstanceIdentifier: testNewId,
				description: 'new description'
			});

			let revertResult = await dataModel.revertFragment({
				instanceIdentifier: testNewId
			});

			assert(
				subData1
				&& subData1.id.instanceIdentifier == testNewId
				&& subData1.model === null
			);
		});

		testWithReset("Reverting a staged customized default fragment should raise fragment.updated with default model", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.fragment.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveFragment({
				instanceIdentifier: fragmentAId,
				description: 'new-desc'
			});

			let revertResult = await dataModel.revertFragment({
				instanceIdentifier: fragmentAId
			});

			assert(
				subData1
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.model !== null
				&& subData1.model.InstanceIdentifier == fragmentAId
				&& subData1.model.Description == defaultFragmentADescription
			)
		});

		testWithReset("Saving a fragment attachment should raise fragment.updated", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.fragment.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveFragmentAttachment({
				instanceIdentifier: fragmentAId,
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.model !== null
				&& subData1.model.Attachments.filter(f => f.Name == 'attachment1.vm').length == 1
			);
		});


		testWithReset("Deleting a fragment attachment should raise fragment.updated", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.fragment.updated', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteFragmentAttachment({
				instanceIdentifier: fragmentAId,
				name: testAttachmentName,
			});

			assert(
				subData1
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.model !== null
				&& subData1.model.Attachments.filter(f => f.Name == testAttachmentName).length == 0
			)
		});

		testWithReset("Saving a new fragment attachment should raise attachment.created", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.attachment.created', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveFragmentAttachment({
				instanceIdentifier: fragmentAId,
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.id.name == 'attachment1.vm'
				&& subData1.model !== null
				&& subData1.model.InstanceIdentifier == fragmentAId
				&& subData1.model.Name == 'attachment1.vm'
				&& subData1.model.Content == 'attachment1 content'
			);
		});

		testWithReset("Saving an updated fragment attachment should raise attachment.updated", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.attachment.updated', testMessageNameSpace, data => subData1 = data);

			window._dataModel = dataModel;

			let saveResult = await dataModel.saveFragmentAttachment({
				instanceIdentifier: fragmentAId,
				name: testAttachmentName,
				content: 'new content'
			});

			assert(
				subData1
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.id.name == testAttachmentName
				&& subData1.model !== null
				&& subData1.model.InstanceIdentifier == fragmentAId
				&& subData1.model.Name == testAttachmentName
				&& subData1.model.Content == 'new content'
			);
		});

		testWithReset("Saving a renamed fragment attachment should raise attachment.updated with original name in id, new name in model", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.attachment.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveFragmentAttachment({
				instanceIdentifier: fragmentAId,
				name: testAttachmentName,
				newName: 'renamed.jsm',
				content: 'new content'
			});

			assert(
				subData1
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.id.name == testAttachmentName
				&& subData1.model !== null
				&& subData1.model.InstanceIdentifier == fragmentAId
				&& subData1.model.Name == 'renamed.jsm'
				&& subData1.model.Content == 'new content'
			);
		});

		testWithReset("Deleting a fragment attachment should raise attachment.deleted with no model", async assert => {
			let subData1;
			messaging.subscribe('mfw.model.attachment.deleted', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteFragmentAttachment({
				instanceIdentifier: fragmentAId,
				name: testAttachmentName,
			});

			assert(
				subData1
				&& subData1.id.instanceIdentifier == fragmentAId
				&& subData1.id.name == testAttachmentName
				&& subData1.model === null
			);
		});

		testWithReset("Delete multiple should raise combination of updated and deleted depending on type of delete", async assert => {
			let log = [];

			let saveResult0 = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataModel.saveFragment({ instanceIdentifier: fragmentBId, description: 'y' });
			let cloneResult = await dataModel.cloneFragment({ instanceIdentifier: fragmentCId, newInstanceIdentifier: testNewId });

			messaging.subscribe('mfw.model.fragments.changed', testMessageNameSpace, data => log.push({ name: 'changed', data: data }));
			messaging.subscribe('mfw.model.fragment.updated', testMessageNameSpace, data => log.push({ name: 'updated', data: data }));
			messaging.subscribe('mfw.model.fragment.deleted', testMessageNameSpace, data => log.push({ name: 'deleted', data: data }));

			let deleteResult = await dataModel.deleteFragments({ fragments: [
				{ instanceIdentifier: fragmentAId },
				{ instanceIdentifier: fragmentBId },
				{ instanceIdentifier: testNewId }
			]});
			let deletePublishResult = await dataModel.publishFragments({ fragments: [
				{ instanceIdentifier: fragmentAId },
				{ instanceIdentifier: fragmentBId },
				{ instanceIdentifier: testNewId }
			]});

			assert(log
				&& log.length == 5
				&& log[0].name == 'changed'
				&& log[1].name == 'updated'
				&& log[1].data.id.instanceIdentifier == fragmentAId
				&& log[2].name == 'updated'
				&& log[2].data.id.instanceIdentifier == fragmentBId
				&& log[3].name == 'deleted'
				&& log[3].data.id.instanceIdentifier == testNewId
				&& log[4].name == 'changed'
			);
		});

		testWithReset("Publish multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('mfw.model.fragments.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataModel.saveFragment({ instanceIdentifier: fragmentBId, description: 'y' });
			let saveResult2 = await dataModel.saveFragment({ instanceIdentifier: fragmentCId, description: 'z' });

			let publishResult = await dataModel.publishFragments({ fragments: [
				{ instanceIdentifier: fragmentAId },
				{ instanceIdentifier: fragmentBId },
				{ instanceIdentifier: fragmentCId }
			]});

			let deleteResult0 = await dataModel.deleteFragment({ instanceIdentifier: fragmentAId });
			let deletePublishResult0 = await dataModel.publishFragment({ instanceIdentifier: fragmentAId });
			let deleteResult1 = await dataModel.deleteFragment({ instanceIdentifier: fragmentBId });
			let deletePublishResult1 = await dataModel.publishFragment({ instanceIdentifier: fragmentBId });
			let deleteResult2 = await dataModel.deleteFragment({ instanceIdentifier: fragmentCId });
			let deletePublishResult2 = await dataModel.publishFragment({  instanceIdentifier: fragmentCId });


			assert(log && log.length == 1);
		});

		testWithReset("Revert multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('mfw.model.fragments.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataModel.saveFragment({ instanceIdentifier: fragmentBId, description: 'y' });
			let saveResult2 = await dataModel.saveFragment({ instanceIdentifier: fragmentCId, description: 'z' });

			let publishResult = await dataModel.revertFragments({ fragments: [
				{ instanceIdentifier: fragmentAId },
				{ instanceIdentifier: fragmentBId },
				{ instanceIdentifier: fragmentCId },
			]});

			assert(log && log.length == 1);
		});

		testWithReset("Reset Test Data", assert => assert(true));
	}

	function runDevModeDataProviderTests(dataProvider) {
		test.heading('Dev Mode Data Provider Tests');

		test("Listing fragments should list all fragments", async assert => {
			let fragments = (await dataProvider.listFragments({ scriptable: false })).fragments;
			assert(fragments.length === defaultFragmentsLength);
		});

		test("Listing fragments by isStaged: true should only return staged fragments", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataProvider.listFragments({ isStaged: true })).fragments;
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == 1
				&& fragments[0].Description == 'x'
				&& fragments[0].State == 'FactoryDefault'
				&& fragments[0].IsFactoryDefault == true
				&& fragments[0].IsStaged == true);
		});

		test("Listing fragments by state: 'FactoryDefault' should only return fragments which are currently in a Factory Default State", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataProvider.listFragments({ scriptable: false, state: 'FactoryDefault' })).fragments;
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == defaultFragmentsLength
				&& fragments[0].State == 'FactoryDefault');
		});

		test("Listing fragments by state: 'CustomizedDefault' should return only fragments which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataProvider.listFragments({ state: 'CustomizedDefault' })).fragments;
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == 0);
		});

		test("Listing fragments by state: 'Custom' should only return fragments which are currently in a Custom State", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragments = (await dataProvider.listFragments({ state: 'Custom' })).fragments;
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragments.length == 0);
		});

		test("Listing fragments by provider should only return fragments which match", async assert => {
			let testAFragments = (await dataProvider.listFragments({ factoryDefaultProvider: testProviderAId })).fragments;
			let testBFragments = (await dataProvider.listFragments({ factoryDefaultProvider: testProviderBId })).fragments;
			assert(testAFragments.length == testProviderFragmentsLength && testBFragments.length == testBProviderFragmentsLength
				&& testAFragments[0].FactoryDefaultProvider == testProviderAId
				&& testBFragments[0].FactoryDefaultProvider == testProviderBId);
		});

		test("Getting a fragment returns fragment", async assert => {
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			assert(fragment.InstanceIdentifier == fragmentAId);
		});

		test("Getting a fragment returns fragment with provider", async assert => {
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, });
			assert(fragment.InstanceIdentifier == fragmentAId && fragment.FactoryDefaultProviderName && fragment.FactoryDefaultProviderName.length > 0);
		});

		test("Getting a fragment returns latest version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.State == 'FactoryDefault'
				&& fragment.IsFactoryDefault == true
				&& fragment.IsStaged == true);
		});

		test("Getting a fragment with staged: false should return non-staged version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, staged: false });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == defaultFragmentADescription
				&& fragment.State == 'FactoryDefault'
				&& fragment.IsFactoryDefault == true
				&& fragment.IsStaged == false);
		});

		test("Getting a fragment with staged: true should return staged version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, staged: true });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == 'x'
				&& fragment.State == 'FactoryDefault'
				&& fragment.IsFactoryDefault == true
				&& fragment.IsStaged == true);
		});

		test("Getting a fragment with factoryDefault: true should return factory default version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, factoryDefault: true });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == defaultFragmentADescription
				&& fragment.State == 'FactoryDefault'
				&& fragment.IsFactoryDefault == true
				&& fragment.IsStaged == false);
		});

		test("Getting a fragment with factoryDefault: false should return non-factory default version of fragment", async assert => {
			await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' })
			let fragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId, factoryDefault: false });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(fragment.InstanceIdentifier == fragmentAId
				&& fragment.Description == 'x'
				&& fragment.State == 'FactoryDefault'
				&& fragment.IsFactoryDefault == true
				&& fragment.IsStaged == true);
		});

		test("Saving a default fragment saves and sets it into a staged, factory default, state and saves attachments too", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.isNew == false

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.Description == 'x'
				&& savedFragment.State == 'FactoryDefault'
				&& savedFragment.IsFactoryDefault == true
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length > 0

				&& savedFragment.Attachments.length == originalFragment.Attachments.length);
		});

		test("Saving a default fragment multiple times saves and sets it into a staged, factory default, state and saves attachments too", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult0 = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let saveResult1 = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'y' });
			let saveResult2 = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'z' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.Description == 'z'
				&& savedFragment.State == 'FactoryDefault'
				&& savedFragment.IsFactoryDefault == true
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length > 0

				&& savedFragment.Attachments.length == originalFragment.Attachments.length);
		});

		test("Saving a default fragment saves and returns saved fragment and list of staged", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			await dataProvider.revertFragment({ instanceIdentifier: fragmentAId })
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedFragment.InstanceIdentifier == fragmentAId
				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'FactoryDefault'
				&& saveResult.savedFragment.IsFactoryDefault == true
				&& saveResult.savedFragment.IsStaged == true

				&& saveResult.savedFragment.Attachments.length > 0

				&& saveResult.savedFragment.Attachments.length == originalFragment.Attachments.length

				&& saveResult.stagedFragments.length == 1

				&& saveResult.stagedFragments[0].InstanceIdentifier == fragmentAId
				&& saveResult.stagedFragments[0].Description == 'x'
				&& saveResult.stagedFragments[0].State == 'FactoryDefault'
				&& saveResult.stagedFragments[0].IsFactoryDefault == true
				&& saveResult.stagedFragments[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, fac default fragment reverts and sets it into a non-staged, fac default, state and saves attachments too", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.savedFragment.InstanceIdentifier == fragmentAId
				&& saveResult.savedFragment.Description == 'x'
				&& saveResult.savedFragment.State == 'FactoryDefault'
				&& saveResult.savedFragment.IsFactoryDefault == true
				&& saveResult.savedFragment.IsStaged == true

				&& saveResult.savedFragment.Attachments.length > 0

				&& saveResult.savedFragment.Attachments.length == originalFragment.Attachments.length

				&& revertResult.revertedFragment.InstanceIdentifier == fragmentAId
				&& revertResult.revertedFragment.Description == defaultFragmentADescription
				&& revertResult.revertedFragment.State == 'FactoryDefault'
				&& revertResult.revertedFragment.IsFactoryDefault == true
				&& revertResult.revertedFragment.IsStaged == false

				&& revertResult.revertedFragment.Attachments.length > 0

				&& revertResult.revertedFragment.Attachments.length == originalFragment.Attachments.length

				&& revertedFragment.InstanceIdentifier == fragmentAId
				&& revertedFragment.Description == defaultFragmentADescription
				&& revertedFragment.State == 'FactoryDefault'
				&& revertedFragment.IsFactoryDefault == true
				&& revertedFragment.IsStaged == false

				&& revertedFragment.Attachments.length > 0

				&& revertedFragment.Attachments.length == originalFragment.Attachments.length
				);
		});

		test("Publishing a saved change to a default fragment saves and sets it into a published, default, state and saves attachments too", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: 'x' });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });
			let publishedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });

			let reverseSaveResult = await dataProvider.saveFragment({ instanceIdentifier: fragmentAId, description: defaultFragmentADescription });
			let reversePublishResult = await dataProvider.publishFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& publishedFragment.InstanceIdentifier == fragmentAId
				&& publishedFragment.Description == 'x'
				&& publishedFragment.State == 'FactoryDefault'
				&& publishedFragment.IsFactoryDefault == true
				&& publishedFragment.IsStaged == false

				&& publishedFragment.Attachments.length > 0

				&& publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& publishResult.publishedFragment.InstanceIdentifier == fragmentAId
				&& publishResult.publishedFragment.Description == 'x'
				&& publishResult.publishedFragment.State == 'FactoryDefault'
				&& publishResult.publishedFragment.IsFactoryDefault == true
				&& publishResult.publishedFragment.IsStaged == false

				&& publishResult.publishedFragment.Attachments.length > 0

				&& publishResult.publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& publishResult.stagedFragments.length == 0
				);
		});

		test("Creating a new fragment with provider in dev mode creates non-saved, staged, fragment with provider", async assert => {
			let newFragment = await dataProvider.createFragment({ instanceIdentifier: testNewId, themeId: themeId, factoryDefaultProvider: testProviderAId });
			let newSavedFragment = await dataProvider.getFragment({ instanceIdentifier: testNewId });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: testNewId });

			assert(newFragment.InstanceIdentifier.length > 0
				&& newFragment.State == 'NotPersisted'
				&& newFragment.IsStaged == false
				&& newFragment.InstanceIdentifier == testNewId
				&& newFragment.ThemeId == themeId
				&& newFragment.IsFactoryDefault == true
				&& newFragment.FactoryDefaultProvider === testProviderAId

				&& newSavedFragment == null

				&& revertResult.reverted == true
				&& revertResult.revertedFragment == null
				&& revertResult.stagedFragments.length == 0
				);
		});

		test("Creating and publishing new fragment with provider in dev mode creates published fragment with provider", async assert => {
			let newFragment = await dataProvider.createFragment({ instanceIdentifier: testNewId, themeId: themeId, factoryDefaultProvider: testProviderAId });
			let saveResult = await dataProvider.saveFragment({ instanceIdentifier: testNewId, themeId: themeId, factoryDefaultProvider: testProviderAId, name: 'test-auto' });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: testNewId, themeId: themeId });
			let publishedFragment = await dataProvider.getFragment({ instanceIdentifier: testNewId, themeId: themeId });
			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: testNewId, themeId: themeId });
			let stagedDeletedFragment = await dataProvider.getFragment({ instanceIdentifier: testNewId, themeId: themeId });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: testNewId, themeId: themeId });
			let deletedFragment = await dataProvider.getFragment({ instanceIdentifier: testNewId, themeId: themeId });

			assert(newFragment.InstanceIdentifier.length > 0
				&& newFragment.State == 'NotPersisted'
				&& newFragment.IsStaged == false
				&& newFragment.InstanceIdentifier == testNewId
				&& newFragment.ThemeId == themeId
				&& newFragment.IsFactoryDefault == true
				&& newFragment.FactoryDefaultProvider === testProviderAId

				&& stagedDeletedFragment != null
				&& stagedDeletedFragment.State == 'FactoryDefault'
				&& stagedDeletedFragment.IsStaged == true
				&& stagedDeletedFragment.IsDeleted == true
				&& stagedDeletedFragment.InstanceIdentifier == testNewId
				&& stagedDeletedFragment.ThemeId == themeId
				&& stagedDeletedFragment.IsFactoryDefault == true
				&& stagedDeletedFragment.FactoryDefaultProvider === testProviderAId

				&& publishedFragment != null
				&& publishedFragment.State == 'FactoryDefault'
				&& publishedFragment.IsStaged == false
				&& publishedFragment.InstanceIdentifier == testNewId
				&& publishedFragment.ThemeId == themeId
				&& publishedFragment.IsFactoryDefault == true
				&& publishedFragment.FactoryDefaultProvider === testProviderAId

				&& deletedFragment == null
				);
		});

		test("Cloning a fragment creates a FactoryDefault, staged, fragment with random new fragment id and incremented name", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId });
			let clonedFragment = await dataProvider.getFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			await dataProvider.deleteFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });
			await dataProvider.publishFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& cloneResult.clonedFragment.InstanceIdentifier != fragmentAId
				&& cloneResult.clonedFragment.Name == (originalFragment.Name + ' 1')
				&& cloneResult.clonedFragment.Description == defaultFragmentADescription
				&& cloneResult.clonedFragment.State == 'FactoryDefault'
				&& cloneResult.clonedFragment.IsFactoryDefault == true
				&& cloneResult.clonedFragment.IsStaged == true

				&& cloneResult.clonedFragment.Attachments.length > 0

				&& cloneResult.clonedFragment.Attachments.length == originalFragment.Attachments.length

				&& cloneResult.stagedFragments.length == 1

				&& clonedFragment.InstanceIdentifier != fragmentAId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.Description == defaultFragmentADescription
				&& clonedFragment.State == 'FactoryDefault'
				&& clonedFragment.IsFactoryDefault == true
				&& clonedFragment.IsStaged == true

				&& clonedFragment.Attachments.length > 0

				&& clonedFragment.Attachments.length == originalFragment.Attachments.length
			);
		});

		test("Cloning a fragment with specific ID creates a fac default, staged, fragment with incremented name", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId, newInstanceIdentifier: newId });
			let clonedFragment = await dataProvider.getFragment({ instanceIdentifier: newId });
			await dataProvider.deleteFragment({ instanceIdentifier: newId });
			await dataProvider.publishFragment({ instanceIdentifier: newId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& cloneResult.clonedFragment.InstanceIdentifier == newId
				&& cloneResult.clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.InstanceIdentifier == newId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
			);
		});

		test("Cloning a fragment with specific provider ID creates a fac default, staged, fragment with incremented name and specified provider", async assert => {
			let newId = 'dd4fc178-0eac-4bc3-b929-e12c60aa98a3';
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId, newInstanceIdentifier: newId, factoryDefaultProvider: testProviderAId });
			let clonedFragment = await dataProvider.getFragment({ instanceIdentifier: newId });
			await dataProvider.deleteFragment({ instanceIdentifier: newId });
			await dataProvider.publishFragment({ instanceIdentifier: newId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& cloneResult.clonedFragment.InstanceIdentifier == newId
				&& cloneResult.clonedFragment.Name == (originalFragment.Name + ' 1')
				&& cloneResult.clonedFragment.IsFactoryDefault == true
				&& cloneResult.clonedFragment.FactoryDefaultProvider == testProviderAId
				&& clonedFragment.InstanceIdentifier == newId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.IsFactoryDefault == true
				&& clonedFragment.FactoryDefaultProvider == testProviderAId
			);
		});

		test("Publishing a cloned fragment publishes", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let clonedFragment = await dataProvider.getFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			await dataProvider.deleteFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });
			await dataProvider.publishFragment({ instanceIdentifier: clonedFragment.InstanceIdentifier });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& publishResult.publishedFragment.InstanceIdentifier != fragmentAId
				&& publishResult.publishedFragment.Name == (originalFragment.Name + ' 1')
				&& publishResult.publishedFragment.Description == defaultFragmentADescription
				&& publishResult.publishedFragment.State == 'FactoryDefault'
				&& publishResult.publishedFragment.IsFactoryDefault == true
				&& publishResult.publishedFragment.IsStaged == false

				&& publishResult.publishedFragment.Attachments.length > 0

				&& publishResult.publishedFragment.Attachments.length == originalFragment.Attachments.length

				&& publishResult.stagedFragments.length == 0

				&& clonedFragment.InstanceIdentifier != fragmentAId
				&& clonedFragment.Name == (originalFragment.Name + ' 1')
				&& clonedFragment.Description == defaultFragmentADescription
				&& clonedFragment.State == 'FactoryDefault'
				&& clonedFragment.IsFactoryDefault == true
				&& clonedFragment.IsStaged == false

				&& clonedFragment.Attachments.length > 0

				&& clonedFragment.Attachments.length == originalFragment.Attachments.length
			);
		})

		test("Deleting a published clone really deletes", async assert => {
			let cloneResult = await dataProvider.cloneFragment({ instanceIdentifier: fragmentAId });
			let publishResult = await dataProvider.publishFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let deleteResult = await dataProvider.deleteFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let deletePublishResult = await dataProvider.publishFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });
			let fragment = await dataProvider.getFragment({ instanceIdentifier: cloneResult.clonedFragment.InstanceIdentifier });

			assert(publishResult.publishedFragment !== null
				&& fragment == null);
		})

		test("Getting a fragment attachment gets attachment", async assert => {
			let attachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			assert(attachment.Name == testAttachmentName);
		});

		test("Saving a attachment saves attachment and sets fragment into staged state", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult.isNew == false

				&& savedAttachment.Content == 'new attachment content'

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'FactoryDefault'
				&& savedFragment.IsFactoryDefault == true
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length == originalFragment.Attachments.length

				&& savedFragment.Attachments.length > 0);
		});

		test("Saving a attachment multiple times saves attachment and sets fragment into staged state", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult0 = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content 0' });
			let saveResult1 = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content 1' });
			let saveResult2 = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new attachment content 2' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedAttachment.Content == 'new attachment content 2'

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'FactoryDefault'
				&& savedFragment.IsFactoryDefault == true
				&& savedFragment.IsStaged == true

				&& savedFragment.Attachments.length == originalFragment.Attachments.length

				&& savedFragment.Attachments.length > 0);
		});

		test("Reverting a fragment with a saved attachment reverts both", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& revertedFragmentAttachment.Content === originalFragmentAttachment.Content

				&& revertedFragment.InstanceIdentifier == fragmentAId
				&& revertedFragment.State == 'FactoryDefault'

				&& revertedFragment.Attachments.length > 0);
		})

		test("Getting non-staged version of otherwise staged fragment attachment gets non-staged version", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let nonStagedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, staged: false });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragmentAttachment.Content != 'new content'
				&& savedAttachment.Content == 'new content'
				&& nonStagedFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default fragment attachment gets fac default version", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, content: 'new content' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let facDefaultFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, factoryDefault: true });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragmentAttachment.Content != 'new content'
				&& savedAttachment.Content == 'new content'
				&& facDefaultFragmentAttachment.Content == originalFragmentAttachment.Content
			);
		});

		test("Deleting a attachment from a default fragment sets fragment to staged with removed attachment", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deleteResult = await dataProvider.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deletedFragment.Attachments.find(s => s.Name == testAttachmentName) == null
				&& deletedFragment.State == 'FactoryDefault'
				&& deletedFragment.IsFactoryDefault == true
				&& deletedFragment.IsStaged == true

				&& deletedFragmentAttachment == null
			);
		});

		test("Reverting attachment deletion from staged fragment sets fragment back to factory default", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let deleteResult = await dataProvider.deleteFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let deletedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let deletedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });
			let revertedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let revertedFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.length > 0

				&& originalFragment.Attachments.find(s => s.Name == testAttachmentName) !== null

				&& originalFragmentAttachment.Name == testAttachmentName

				&& deleteResult.stagedFragments.length == 1
				&& deleteResult.fragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deleteResult.fragment.Attachments.find(s => s.Name == testAttachmentName) == null

				&& deletedFragment.Attachments.length == originalFragment.Attachments.length - 1
				&& deletedFragment.Attachments.find(s => s.Name == testAttachmentName) == null
				&& deletedFragment.State == 'FactoryDefault'
				&& deletedFragment.IsFactoryDefault == true
				&& deletedFragment.IsStaged == true

				&& deletedFragmentAttachment == null

				&& revertResult.stagedFragments.length == 0
				&& revertResult.revertedFragment.IsStaged == false
				&& revertResult.revertedFragment.Attachments.length == originalFragment.Attachments.length
				&& revertResult.revertedFragment.Attachments.find(s => s.Name == testAttachmentName) != null

				&& revertedFragment.IsStaged == false
				&& revertedFragment.Attachments.length == originalFragment.Attachments.length
				&& revertedFragment.Attachments.find(s => s.Name == testAttachmentName) != null

				&& revertedFragmentAttachment !== null
			);
		});

		test("Renaming a attachment renames attachment even without new content", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let originalFragmentAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: testAttachmentName, newName: 'renamed.jsm' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: 'renamed.jsm' });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false
				&& originalFragment.Attachments.filter(s => s.Name == 'renamed.jsm').length == 0
				&& originalFragment.Attachments.filter(s => s.Name == testAttachmentName).length == 1

				&& originalFragment.Attachments.length == savedFragment.Attachments.length

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'FactoryDefault'
				&& savedFragment.IsFactoryDefault == true
				&& savedFragment.IsStaged == true
				&& savedFragment.Attachments.filter(s => s.Name == 'renamed.jsm').length == 1
				&& savedFragment.Attachments.filter(s => s.Name == testAttachmentName).length == 0

				&& savedAttachment.Name == 'renamed.jsm'
				&& originalFragmentAttachment.Content == savedAttachment.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new attachment creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.createFragmentAttachment({ instanceIdentifier: fragmentAId });

			assert(saveResult
				&& saveResult.InstanceIdentifier == fragmentAId
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.FragmentProcessedName == originalFragment.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Attachments.length == originalFragment.Attachments.length
			);
		});

		test("Saving a new attachment saves attachment and sets fragment into staged state", async assert => {
			let originalFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let saveResult = await dataProvider.saveFragmentAttachment({ instanceIdentifier: fragmentAId, name: 'newattachment.jsm', content: 'content' });
			let savedFragment = await dataProvider.getFragment({ instanceIdentifier: fragmentAId });
			let savedAttachment = await dataProvider.getFragmentAttachment({ instanceIdentifier: fragmentAId, name: 'newattachment.jsm' });
			let revertResult = await dataProvider.revertFragment({ instanceIdentifier: fragmentAId });

			assert(originalFragment.InstanceIdentifier == fragmentAId
				&& originalFragment.Description == defaultFragmentADescription
				&& originalFragment.State == 'FactoryDefault'
				&& originalFragment.IsFactoryDefault == true
				&& originalFragment.IsStaged == false

				&& savedAttachment.Content == 'content'

				&& savedFragment.InstanceIdentifier == fragmentAId
				&& savedFragment.State == 'FactoryDefault'
				&& savedFragment.IsFactoryDefault == true
				&& savedFragment.IsStaged == true
				&& savedFragment.Attachments.length == originalFragment.Attachments.length + 1

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
