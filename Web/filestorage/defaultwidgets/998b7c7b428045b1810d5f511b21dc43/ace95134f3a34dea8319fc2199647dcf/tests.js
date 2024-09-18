define('Tests', ['StudioSaveQueue', 'DataModel'], (StudioSaveQueue, DataModel, $, global, undef) => {

	let messaging = $.telligent.evolution.messaging;

	let defaultEmailsLength = 3;
	let defaultTemplateLength = 1;
	let defaultEmailComponentsLength = defaultEmailsLength + defaultTemplateLength;

	let emailAId = "722e18de-8533-4d03-a206-f9a688935811";
	let emailBId = "089428c0-2c3e-47d7-ba85-020bb645e3a1";
	let emailCId = "cb95910f-4ebc-45f0-b529-78193e75d506";
	let testNewId = "bdd207b5-dfe0-4a5b-8fd4-c48406a921a2";
	let defaultEmailASubjectScript = "Test Email A Subject";
	let defaultEmailBSubjectScript = "Test Email B Subject";
	let defaultEmailCSubjectScript = "Test Email C Subject";
	let testFileName = 'file-a.jsm';

	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function runDataProviderTests(dataProvider) {
		test.heading('Data Provider Tests');

		test("Listing emails should list all emails", async assert => {
			let emails = (await dataProvider.listEmails()).emails;
			assert(emails.length === defaultEmailComponentsLength);
		});

		test("Listing emails should include both emails and template", async assert => {
			let emails = (await dataProvider.listEmails()).emails;
			assert(emails.length === defaultEmailComponentsLength
				&& emails[0].Type == 'Template'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].Type == 'Email'
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false

				&& emails[2].Type == 'Email'
				&& emails[2].State == 'FactoryDefault'
				&& emails[2].IsFactoryDefault == true
				&& emails[2].IsStaged == false

				&& emails[3].Type == 'Email'
				&& emails[3].State == 'FactoryDefault'
				&& emails[3].IsFactoryDefault == true
				&& emails[3].IsStaged == false
			);
		});

		test("Listing only emails should include only emails", async assert => {
			let emails = (await dataProvider.listEmails({ includeEmails: true, includeTemplate: false })).emails;
			assert(emails.length === defaultEmailsLength
				&& emails[0].Type == 'Email'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].Type == 'Email'
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false

				&& emails[2].Type == 'Email'
				&& emails[2].State == 'FactoryDefault'
				&& emails[2].IsFactoryDefault == true
				&& emails[2].IsStaged == false
			);
		});

		test("Listing only template should include only template", async assert => {
			let emails = (await dataProvider.listEmails({ includeEmails: false, includeTemplate: true })).emails;
			assert(emails.length === defaultTemplateLength
				&& emails[0].Type == 'Template'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false
			);
		});

		test("Listing emails by staged: true should only return staged emails", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataProvider.listEmails({ staged: true })).emails;
			await dataProvider.revertEmail({ id: emailAId })
			assert(emails.length == 1
				&& emails[0].SubjectScript == 'x'
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == false
				&& emails[0].IsStaged == true);
		});

		test("Listing template by staged: true should only return staged templates", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let emails = (await dataProvider.listEmails({ staged: true })).emails;
			await dataProvider.revertEmail({ })
			assert(emails.length == 1
				&& emails[0].TemplateScript == 'x'
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == false
				&& emails[0].IsStaged == true);
		});

		test("Listing both by staged: true should only return staged emails and templates", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })

			let emails = (await dataProvider.listEmails({ staged: true })).emails;

			await dataProvider.revertEmail({})
			await dataProvider.revertEmail({ id: emailAId })

			assert(emails.length == 2
				&& emails[0].Type == 'Template'
				&& emails[0].TemplateScript == 'x'
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == false
				&& emails[0].IsStaged == true

				&& emails[1].Type == 'Email'
				&& emails[1].SubjectScript == 'x'
				&& emails[1].State == 'CustomizedDefault'
				&& emails[1].IsFactoryDefault == false
				&& emails[1].IsStaged == true
			);
		});

		test("Listing emails by staged: false should return non-staged emails as well as the published version of currently-staged emails", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataProvider.listEmails({ staged: false, includeEmails: true, includeTemplate: false })).emails;
			await dataProvider.revertEmail({ id: emailAId })
			assert(emails.length == defaultEmailsLength

				&& emails[0].SubjectScript == defaultEmailASubjectScript
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].SubjectScript == defaultEmailBSubjectScript
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false);
		});

		test("Listing emails by staged: false should return non-staged emails as well as the published version of currently-staged templates", async assert => {
			await dataProvider.saveEmail({ TemplateScript: 'x' })
			let emails = (await dataProvider.listEmails({ staged: false, includeEmails: true, includeTemplate: true })).emails;
			await dataProvider.revertEmail({})
			assert(emails.length == defaultEmailComponentsLength

				&& emails[0].TemplateScript != 'x'
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].SubjectScript == defaultEmailASubjectScript
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false);
		});

		test("Listing emails by state: 'FactoryDefault' should only return emails which are currently in a Factory Default State", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataProvider.listEmails({ state: 'FactoryDefault', includeTemplate: false })).emails;
			await dataProvider.revertEmail({ id: emailAId })
			assert(emails.length == defaultEmailsLength - 1
				&& emails[0].State == 'FactoryDefault');
		});

		test("Listing emails by state: 'FactoryDefault' should only return templates which are currently in a Factory Default State", async assert => {
			await dataProvider.saveEmail({ TemplateScript: 'x' })
			let emails = (await dataProvider.listEmails({ state: 'FactoryDefault', includeTemplate: true, includeEmails: false })).emails;
			await dataProvider.revertEmail({ })
			assert(emails.length == defaultTemplateLength - 1);
		});

		test("Listing emails by state: 'CustomizedDefault' should return only emails which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataProvider.listEmails({ state: 'CustomizedDefault', includeTemplate: false })).emails;
			await dataProvider.revertEmail({ id: emailAId })
			assert(emails.length == 1
				&& emails[0].State == 'CustomizedDefault');
		});

		test("Listing templates by state: 'CustomizedDefault' should return only templates which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveEmail({ TemplateScript: 'x' })
			let emails = (await dataProvider.listEmails({ state: 'CustomizedDefault', includeEmails: false })).emails;
			await dataProvider.revertEmail({ })
			assert(emails.length == 1
				&& emails[0].Type == 'Template'
				&& emails[0].State == 'CustomizedDefault');
		});

		test("Getting an email returns email", async assert => {
			let email = await dataProvider.getEmail({ id: emailAId, });
			assert(email.Id == emailAId);
		});

		test("Getting template returns template", async assert => {
			let email = await dataProvider.getEmail({ });
			assert(email.Id == null
				&& email.Type == 'Template');
		});

		test("Getting an email returns latest version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId, });
			await dataProvider.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.State == 'CustomizedDefault'
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting a template returns latest version of template", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let email = await dataProvider.getEmail({ });
			await dataProvider.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.State == 'CustomizedDefault'
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting an email with staged: false should return non-staged version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId, staged: false });
			await dataProvider.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == defaultEmailASubjectScript
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting a template with staged: false should return non-staged version of template", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let email = await dataProvider.getEmail({ staged: false });
			await dataProvider.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript != 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting an email with staged: true should return staged version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId, staged: true });
			await dataProvider.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting a template with staged: true should return staged version of template", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let email = await dataProvider.getEmail({ staged: true });
			await dataProvider.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript == 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting an email with factoryDefault: true should return factory default version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId, factoryDefault: true });
			await dataProvider.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == defaultEmailASubjectScript
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting a template with factoryDefault: true should return factory default version of template", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let email = await dataProvider.getEmail({ factoryDefault: true });
			await dataProvider.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript != 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting an email with factoryDefault: false should return non-factory default version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId, factoryDefault: false });
			await dataProvider.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting a template with factoryDefault: false should return non-factory default version of template", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let email = await dataProvider.getEmail({ factoryDefault: false });
			await dataProvider.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript == 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Saving a default email saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			await dataProvider.revertEmail({ id: emailAId })
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmail.Id == emailAId
				&& savedEmail.SubjectScript == 'x'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length > 0
				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default email multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult0 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'y' });
			let saveResult2 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'z' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId  });
			await dataProvider.revertEmail({ id: emailAId })
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmail.Id == emailAId
				&& savedEmail.SubjectScript == 'z'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length > 0
				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default template multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult0 = await dataProvider.saveEmail({ templateScript: 'x' });
			let saveResult1 = await dataProvider.saveEmail({ templateScript: 'y' });
			let saveResult2 = await dataProvider.saveEmail({ templateScript: 'z' });
			let savedEmail = await dataProvider.getEmail({ });
			await dataProvider.revertEmail({ })
			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmail.Type == 'Template'
				&& savedEmail.TemplateScript == 'z'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default email saves and returns saved email and list of staged", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			await dataProvider.revertEmail({ id: emailAId })
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedEmail.Id == emailAId
				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length > 0

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& saveResult.stagedEmails.length == 1

				&& saveResult.stagedEmails[0].Id == emailAId
				&& saveResult.stagedEmails[0].SubjectScript == 'x'
				&& saveResult.stagedEmails[0].State == 'CustomizedDefault'
				&& saveResult.stagedEmails[0].IsFactoryDefault == false
				&& saveResult.stagedEmails[0].IsStaged == true
				);
		});

		test("Saving a default template saves and returns saved template and list of staged", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmail({ templateScript: 'x' });
			await dataProvider.revertEmail({ })
			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedEmail.Type == 'Template'
				&& saveResult.savedEmail.TemplateScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& saveResult.stagedEmails.length == 1

				&& saveResult.stagedEmails[0].Type == 'Template'
				&& saveResult.stagedEmails[0].TemplateScript == 'x'
				&& saveResult.stagedEmails[0].State == 'CustomizedDefault'
				&& saveResult.stagedEmails[0].IsFactoryDefault == false
				&& saveResult.stagedEmails[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default email reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });
			let revertedEmail = await dataProvider.getEmail({ id: emailAId });
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.Id == emailAId
				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length > 0

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& revertResult.revertedEmail.Id == emailAId
				&& revertResult.revertedEmail.SubjectScript == defaultEmailASubjectScript
				&& revertResult.revertedEmail.State == 'FactoryDefault'
				&& revertResult.revertedEmail.IsFactoryDefault == true
				&& revertResult.revertedEmail.IsStaged == false

				&& revertResult.revertedEmail.Files.length > 0
				&& revertResult.revertedEmail.Files.length == originalEmail.Files.length

				&& revertedEmail.Id == emailAId

				&& revertedEmail.SubjectScript == defaultEmailASubjectScript
				&& revertedEmail.State == 'FactoryDefault'
				&& revertedEmail.IsFactoryDefault == true
				&& revertedEmail.IsStaged == false

				&& revertedEmail.Files.length > 0

				&& revertedEmail.Files.length == originalEmail.Files.length
				);
		});

		test("Reverting a saved, staged, customized default template reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmail({ templateScript: 'x' });
			let revertResult = await dataProvider.revertEmail({ });
			let revertedEmail = await dataProvider.getEmail({ });
			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.Type == 'Template'
				&& saveResult.savedEmail.TemplateScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& revertResult.revertedEmail.Type == 'Template'
				&& revertResult.revertedEmail.TemplateScript != 'x'
				&& revertResult.revertedEmail.State == 'FactoryDefault'
				&& revertResult.revertedEmail.IsFactoryDefault == true
				&& revertResult.revertedEmail.IsStaged == false

				&& revertResult.revertedEmail.Files.length == originalEmail.Files.length

				&& revertedEmail.Type == 'Template'

				&& revertedEmail.TemplateScript != 'x'
				&& revertedEmail.State == 'FactoryDefault'
				&& revertedEmail.IsFactoryDefault == true
				&& revertedEmail.IsStaged == false

				&& revertedEmail.Files.length == originalEmail.Files.length
				);
		});

		test("Reverting multiple emails reverts multiple emails", async assert => {
			let originalEmail0 = await dataProvider.getEmail({ id: emailAId });
			let originalEmail1 = await dataProvider.getEmail({ id: emailBId });
			let originalEmail2 = await dataProvider.getEmail({ id: emailCId });

			let saveResult0 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataProvider.saveEmail({ id: emailBId, subjectScript: 'y' });
			let saveResult2 = await dataProvider.saveEmail({ id: emailCId, subjectScript: 'z' });

			let emailIds = `${emailAId},${emailBId},${emailCId}`;
			let revertResult = await dataProvider.revertEmails({ emailIds: emailIds });

			let revertedEmail0 = await dataProvider.getEmail({ id: emailAId });
			let revertedEmail1 = await dataProvider.getEmail({ id: emailBId });
			let revertedEmail2 = await dataProvider.getEmail({ id: emailCId });

			assert(originalEmail0.SubjectScript == defaultEmailASubjectScript
				&& originalEmail0.State == 'FactoryDefault'
				&& originalEmail0.IsFactoryDefault == true
				&& originalEmail0.IsStaged == false

				&& originalEmail1.SubjectScript == defaultEmailBSubjectScript
				&& originalEmail1.State == 'FactoryDefault'
				&& originalEmail1.IsFactoryDefault == true
				&& originalEmail1.IsStaged == false

				&& originalEmail2.SubjectScript == defaultEmailCSubjectScript
				&& originalEmail2.State == 'FactoryDefault'
				&& originalEmail2.IsFactoryDefault == true
				&& originalEmail2.IsStaged == false

				&& saveResult0.savedEmail.SubjectScript == 'x'
				&& saveResult0.savedEmail.State == 'CustomizedDefault'
				&& saveResult0.savedEmail.IsFactoryDefault == false
				&& saveResult0.savedEmail.IsStaged == true

				&& saveResult1.savedEmail.SubjectScript == 'y'
				&& saveResult1.savedEmail.State == 'CustomizedDefault'
				&& saveResult1.savedEmail.IsFactoryDefault == false
				&& saveResult1.savedEmail.IsStaged == true

				&& saveResult2.savedEmail.SubjectScript == 'z'
				&& saveResult2.savedEmail.State == 'CustomizedDefault'
				&& saveResult2.savedEmail.IsFactoryDefault == false
				&& saveResult2.savedEmail.IsStaged == true

				&& revertResult.stagedEmails.length == 0

				&& revertedEmail0.SubjectScript == defaultEmailASubjectScript
				&& revertedEmail0.State == 'FactoryDefault'
				&& revertedEmail0.IsFactoryDefault == true
				&& revertedEmail0.IsStaged == false

				&& revertedEmail1.SubjectScript == defaultEmailBSubjectScript
				&& revertedEmail1.State == 'FactoryDefault'
				&& revertedEmail1.IsFactoryDefault == true
				&& revertedEmail1.IsStaged == false

				&& revertedEmail2.SubjectScript == defaultEmailCSubjectScript
				&& revertedEmail2.State == 'FactoryDefault'
				&& revertedEmail2.IsFactoryDefault == true
				&& revertedEmail2.IsStaged == false
				);
		});

		test("Reverting email and template reverts both", async assert => {
			let originalEmail0 = await dataProvider.getEmail({ id: emailAId });
			let originalEmail1 = await dataProvider.getEmail({ });

			let saveResult0 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataProvider.saveEmail({ templateScript: 'y' });

			let emailIds = `${emailAId},}`;
			let revertResult = await dataProvider.revertEmails({ emailIds: emailIds });

			let revertedEmail0 = await dataProvider.getEmail({ id: emailAId });
			let revertedEmail1 = await dataProvider.getEmail({ });

			assert(originalEmail0.SubjectScript == defaultEmailASubjectScript
				&& originalEmail0.State == 'FactoryDefault'
				&& originalEmail0.IsFactoryDefault == true
				&& originalEmail0.IsStaged == false

				&& originalEmail1.TemplateScript != 'y'
				&& originalEmail1.State == 'FactoryDefault'
				&& originalEmail1.IsFactoryDefault == true
				&& originalEmail1.IsStaged == false

				&& saveResult0.savedEmail.SubjectScript == 'x'
				&& saveResult0.savedEmail.State == 'CustomizedDefault'
				&& saveResult0.savedEmail.IsFactoryDefault == false
				&& saveResult0.savedEmail.IsStaged == true

				&& saveResult1.savedEmail.TemplateScript == 'y'
				&& saveResult1.savedEmail.State == 'CustomizedDefault'
				&& saveResult1.savedEmail.IsFactoryDefault == false
				&& saveResult1.savedEmail.IsStaged == true

				&& revertResult.stagedEmails.length == 0

				&& revertedEmail0.SubjectScript == defaultEmailASubjectScript
				&& revertedEmail0.State == 'FactoryDefault'
				&& revertedEmail0.IsFactoryDefault == true
				&& revertedEmail0.IsStaged == false

				&& revertedEmail1.TemplateScript != 'y'
				&& revertedEmail1.State == 'FactoryDefault'
				&& revertedEmail1.IsFactoryDefault == true
				&& revertedEmail1.IsStaged == false
				);
		});

		test("Deleting a published customized default stages reversion to factory default", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let publishResult = await dataProvider.publishEmail({ id: emailAId });
			let deleteResult = await dataProvider.deleteEmail({ id: emailAId });
			let stagedDeletedEmail = await dataProvider.getEmail({ id: emailAId });
			let deletePublishResult = await dataProvider.publishEmail({ id: emailAId });

			assert(originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& publishResult.publishedEmail.SubjectScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& deleteResult.email.SubjectScript == defaultEmailASubjectScript
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true

				&& stagedDeletedEmail.SubjectScript == defaultEmailASubjectScript
				&& stagedDeletedEmail.State == 'FactoryDefault'
				&& stagedDeletedEmail.IsFactoryDefault == true
				&& stagedDeletedEmail.IsStaged == true
				);
		});

		test("Deleting a published customized default template stages reversion to factory default", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmail({ templateScript: 'x' });
			let publishResult = await dataProvider.publishEmail({  });
			let deleteResult = await dataProvider.deleteEmail({  });
			let stagedDeletedEmail = await dataProvider.getEmail({ });
			let deletePublishResult = await dataProvider.publishEmail({  });

			assert(originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.TemplateScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& publishResult.publishedEmail.TemplateScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& deleteResult.email.TemplateScript != 'x'
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true

				&& stagedDeletedEmail.TemplateScript != 'x'
				&& stagedDeletedEmail.State == 'FactoryDefault'
				&& stagedDeletedEmail.IsFactoryDefault == true
				&& stagedDeletedEmail.IsStaged == true
				);
		});

		test("Reverting a staged deletion of customized default restores customized default", async assert => {

			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let publishResult = await dataProvider.publishEmail({ id: emailAId });
			let deleteResult = await dataProvider.deleteEmail({ id: emailAId });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			let realDeleteResult = await dataProvider.deleteEmail({ id: emailAId });
			let deletePublishResult = await dataProvider.publishEmail({ id: emailAId });

			assert(originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& publishResult.publishedEmail.SubjectScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& deleteResult.email.SubjectScript == defaultEmailASubjectScript
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true

				&& revertResult.revertedEmail.SubjectScript == 'x'
				&& revertResult.revertedEmail.State == 'CustomizedDefault'
				&& revertResult.revertedEmail.IsFactoryDefault == false
				&& revertResult.revertedEmail.IsStaged == false
				);
		})

		test("Reverting a staged deletion of customized default template restores customized default template", async assert => {

			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmail({ templateScript: 'x' });
			let publishResult = await dataProvider.publishEmail({ });
			let deleteResult = await dataProvider.deleteEmail({ });
			let revertResult = await dataProvider.revertEmail({ });

			let realDeleteResult = await dataProvider.deleteEmail({ });
			let deletePublishResult = await dataProvider.publishEmail({ });

			assert(originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.TemplateScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& publishResult.publishedEmail.TemplateScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& deleteResult.email.TemplateScript != 'x'
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true

				&& revertResult.revertedEmail.TemplateScript == 'x'
				&& revertResult.revertedEmail.State == 'CustomizedDefault'
				&& revertResult.revertedEmail.IsFactoryDefault == false
				&& revertResult.revertedEmail.IsStaged == false
				);
		})

		test("Publishing a saved change to a default email saves and sets it into a published, customized default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let publishResult = await dataProvider.publishEmail({ id: emailAId });
			let publishedEmail = await dataProvider.getEmail({ id: emailAId });
			await dataProvider.deleteEmail({ id: emailAId })
			await dataProvider.publishEmail({ id: emailAId });
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& publishedEmail.Id == emailAId
				&& publishedEmail.SubjectScript == 'x'
				&& publishedEmail.State == 'CustomizedDefault'
				&& publishedEmail.IsFactoryDefault == false
				&& publishedEmail.IsStaged == false

				&& publishedEmail.Files.length > 0

				&& publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.publishedEmail.Id == emailAId
				&& publishResult.publishedEmail.SubjectScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& publishResult.publishedEmail.Files.length > 0

				&& publishResult.publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.stagedEmails.length == 0
				);
		});

		test("Publishing a saved change to a default template saves and sets it into a published, customized default template, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmail({ templateScript: 'x' });
			let publishResult = await dataProvider.publishEmail({ });
			let publishedEmail = await dataProvider.getEmail({ });
			await dataProvider.deleteEmail({ })
			await dataProvider.publishEmail({ });
			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& publishedEmail.Type == 'Template'
				&& publishedEmail.TemplateScript == 'x'
				&& publishedEmail.State == 'CustomizedDefault'
				&& publishedEmail.IsFactoryDefault == false
				&& publishedEmail.IsStaged == false

				&& publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.publishedEmail.Type == 'Template'
				&& publishResult.publishedEmail.TemplateScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& publishResult.publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.stagedEmails.length == 0
				);
		});

		test("Publishing multiple emails publishes multiple emails", async assert => {
			let originalEmail0 = await dataProvider.getEmail({ id: emailAId });
			let originalEmail1 = await dataProvider.getEmail({ id: emailBId });
			let originalEmail2 = await dataProvider.getEmail({ id: emailCId });

			let saveResult0 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataProvider.saveEmail({ id: emailBId, subjectScript: 'y' });
			let saveResult2 = await dataProvider.saveEmail({ id: emailCId, subjectScript: 'z' });

			let emailIds = `${emailAId}|email,${emailBId}|email,${emailCId}|email`;
			let publishResult = await dataProvider.publishEmails({ emailIds: emailIds });

			let publishedEmail0 = await dataProvider.getEmail({ id: emailAId });
			let publishedEmail1 = await dataProvider.getEmail({ id: emailBId });
			let publishedEmail2 = await dataProvider.getEmail({ id: emailCId });

			await dataProvider.deleteEmail({ id: emailAId });
			await dataProvider.deleteEmail({ id: emailBId });
			await dataProvider.deleteEmail({ id: emailCId });
			await dataProvider.publishEmail({ id: emailAId });
			await dataProvider.publishEmail({ id: emailBId });
			await dataProvider.publishEmail({ id: emailCId });

			assert(originalEmail0.SubjectScript == defaultEmailASubjectScript
				&& originalEmail0.State == 'FactoryDefault'
				&& originalEmail0.IsFactoryDefault == true
				&& originalEmail0.IsStaged == false

				&& originalEmail1.SubjectScript == defaultEmailBSubjectScript
				&& originalEmail1.State == 'FactoryDefault'
				&& originalEmail1.IsFactoryDefault == true
				&& originalEmail1.IsStaged == false

				&& originalEmail2.SubjectScript == defaultEmailCSubjectScript
				&& originalEmail2.State == 'FactoryDefault'
				&& originalEmail2.IsFactoryDefault == true
				&& originalEmail2.IsStaged == false

				&& publishResult.stagedEmails.length == 0

				&& publishedEmail0.SubjectScript == 'x'
				&& publishedEmail0.State == 'CustomizedDefault'
				&& publishedEmail0.IsFactoryDefault == false
				&& publishedEmail0.IsStaged == false

				&& publishedEmail1.SubjectScript == 'y'
				&& publishedEmail1.State == 'CustomizedDefault'
				&& publishedEmail1.IsFactoryDefault == false
				&& publishedEmail1.IsStaged == false

				&& publishedEmail2.SubjectScript == 'z'
				&& publishedEmail2.State == 'CustomizedDefault'
				&& publishedEmail2.IsFactoryDefault == false
				&& publishedEmail2.IsStaged == false
				);
		});

		test("Publishing email and template publishes both", async assert => {
			let originalEmail0 = await dataProvider.getEmail({ id: emailAId });
			let originalEmail1 = await dataProvider.getEmail({ });

			let saveResult0 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataProvider.saveEmail({ templateScript: 'y' });

			let emailIds = `${emailAId}|email,|email`;
			let publishResult = await dataProvider.publishEmails({ emailIds: emailIds });

			let publishedEmail0 = await dataProvider.getEmail({ id: emailAId });
			let publishedEmail1 = await dataProvider.getEmail({ });

			await dataProvider.deleteEmail({ id: emailAId });
			await dataProvider.deleteEmail({ });
			await dataProvider.publishEmail({ id: emailAId });
			await dataProvider.publishEmail({ });

			assert(originalEmail0.SubjectScript == defaultEmailASubjectScript
				&& originalEmail0.State == 'FactoryDefault'
				&& originalEmail0.IsFactoryDefault == true
				&& originalEmail0.IsStaged == false

				&& originalEmail1.TemplateScript != 'y'
				&& originalEmail1.State == 'FactoryDefault'
				&& originalEmail1.IsFactoryDefault == true
				&& originalEmail1.IsStaged == false

				&& publishResult.stagedEmails.length == 0

				&& publishedEmail0.SubjectScript == 'x'
				&& publishedEmail0.State == 'CustomizedDefault'
				&& publishedEmail0.IsFactoryDefault == false
				&& publishedEmail0.IsStaged == false

				&& publishedEmail1.TemplateScript == 'y'
				&& publishedEmail1.State == 'CustomizedDefault'
				&& publishedEmail1.IsFactoryDefault == false
				&& publishedEmail1.IsStaged == false
				);
		});

		test("Deleting a published, customized default email reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let publishResult = await dataProvider.publishEmail({ id: emailAId });
			let deleteResult = await dataProvider.deleteEmail({ id: emailAId });
			let deletePublishResult = await dataProvider.publishEmail({ id: emailAId });
			let deletedEmail = await dataProvider.getEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& deleteResult.email.Id == emailAId
				&& deleteResult.email.SubjectScript == defaultEmailASubjectScript
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true
				&& deleteResult.email.IsReverted == true

				&& deletePublishResult.publishedEmail.Id == emailAId
				&& deletePublishResult.publishedEmail.SubjectScript == defaultEmailASubjectScript
				&& deletePublishResult.publishedEmail.State == 'FactoryDefault'
				&& deletePublishResult.publishedEmail.IsFactoryDefault == true
				&& deletePublishResult.publishedEmail.IsStaged == false

				&& deletePublishResult.publishedEmail.Files.length > 0

				&& deletePublishResult.publishedEmail.Files.length == originalEmail.Files.length

				&& deletedEmail.Id == emailAId
				&& deletedEmail.SubjectScript == defaultEmailASubjectScript
				&& deletedEmail.State == 'FactoryDefault'
				&& deletedEmail.IsFactoryDefault == true
				&& deletedEmail.IsStaged == false

				&& deletedEmail.Files.length > 0

				&& deletedEmail.Files.length == originalEmail.Files.length
				);
		});

		test("Deleting a published, customized default template reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmail({ templateScript: 'x' });
			let publishResult = await dataProvider.publishEmail({ });
			let deleteResult = await dataProvider.deleteEmail({ });
			let deletePublishResult = await dataProvider.publishEmail({ });
			let deletedEmail = await dataProvider.getEmail({ });

			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& deleteResult.email.Type == 'Template'
				&& deleteResult.email.TemplateScript != 'x'
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true
				&& deleteResult.email.IsReverted == true

				&& deletePublishResult.publishedEmail.Type == 'Template'
				&& deletePublishResult.publishedEmail.TemplateScript != 'x'
				&& deletePublishResult.publishedEmail.State == 'FactoryDefault'
				&& deletePublishResult.publishedEmail.IsFactoryDefault == true
				&& deletePublishResult.publishedEmail.IsStaged == false

				&& deletePublishResult.publishedEmail.Files.length == originalEmail.Files.length

				&& deletedEmail.Type == 'Template'
				&& deletedEmail.TemplateScript != 'x'
				&& deletedEmail.State == 'FactoryDefault'
				&& deletedEmail.IsFactoryDefault == true
				&& deletedEmail.IsStaged == false

				&& deletedEmail.Files.length == originalEmail.Files.length
				);
		});

		test("Deleting multiple emails at different states deletes and/or reverts multiple emails", async assert => {
			// 2 types of states: staged customized default, published customized default
			let emailASaveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let emailBSaveResult = await dataProvider.saveEmail({ id: emailBId, subjectScript: 'y' });
			let emailBPublishResult = await dataProvider.publishEmail({ id: emailBId });

			let stagedSiteEmail = await dataProvider.getEmail({ id: emailAId });
			let publishedGroupEmail = await dataProvider.getEmail({ id: emailBId });

			let deleteResult = await dataProvider.deleteEmails({ emailIds: `${emailAId},${emailBId}` });
			let deletePublishResult = await dataProvider.publishEmails({ emailIds: `${emailAId}|email,${emailBId}|email` });

			let deletedSiteEmail = await dataProvider.getEmail({ id: emailAId });
			let deletedGroupEmail = await dataProvider.getEmail({ id: emailBId });

			assert(stagedSiteEmail.SubjectScript == 'x'
				&& stagedSiteEmail.State == 'CustomizedDefault'
				&& stagedSiteEmail.IsFactoryDefault == false
				&& stagedSiteEmail.IsStaged == true

				&& publishedGroupEmail.SubjectScript == 'y'
				&& publishedGroupEmail.State == 'CustomizedDefault'
				&& publishedGroupEmail.IsFactoryDefault == false
				&& publishedGroupEmail.IsStaged == false

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.revertedEmails.length == 1
				&& deleteResult.stagedEmails[0].Id == emailBId
				&& deleteResult.stagedEmails[0].IsReverted == true
				&& deleteResult.revertedEmails[0].Id == emailAId

				&& deletePublishResult.revertedEmails.length == 1
				&& deletePublishResult.revertedEmails[0].Id == emailBId

				&& deletedSiteEmail.SubjectScript == defaultEmailASubjectScript
				&& deletedSiteEmail.State == 'FactoryDefault'
				&& deletedSiteEmail.IsFactoryDefault == true
				&& deletedSiteEmail.IsStaged == false

				&& deletedGroupEmail.SubjectScript == defaultEmailBSubjectScript
				&& deletedGroupEmail.State == 'FactoryDefault'
				&& deletedGroupEmail.IsFactoryDefault == true
				&& deletedGroupEmail.IsStaged == false
			);
		});

		test("Deleting multiple emails and template at different states deletes and/or reverts multiple emails and template", async assert => {
			// 2 types of states: staged customized default, published customized default
			let emailASaveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let emailBSaveResult = await dataProvider.saveEmail({ templateScript: 'y' });
			let emailBPublishResult = await dataProvider.publishEmail({ });

			let stagedSiteEmail = await dataProvider.getEmail({ id: emailAId });
			let publishedGroupEmail = await dataProvider.getEmail({});

			let deleteResult = await dataProvider.deleteEmails({ emailIds: `${emailAId},` });
			let deletePublishResult = await dataProvider.publishEmails({ emailIds: `${emailAId}|email,|email` });
			let deletedSiteEmail = await dataProvider.getEmail({ id: emailAId });
			let deletedGroupEmail = await dataProvider.getEmail({ });

			assert(stagedSiteEmail.SubjectScript == 'x'
				&& stagedSiteEmail.State == 'CustomizedDefault'
				&& stagedSiteEmail.IsFactoryDefault == false
				&& stagedSiteEmail.IsStaged == true

				&& publishedGroupEmail.TemplateScript == 'y'
				&& publishedGroupEmail.State == 'CustomizedDefault'
				&& publishedGroupEmail.IsFactoryDefault == false
				&& publishedGroupEmail.IsStaged == false

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.revertedEmails.length == 1
				&& deleteResult.stagedEmails[0].Type == 'Template'
				&& deleteResult.stagedEmails[0].IsReverted == true
				&& deleteResult.revertedEmails[0].Id == emailAId

				&& deletePublishResult.revertedEmails.length == 1
				&& deletePublishResult.revertedEmails[0].Type == 'Template'

				&& deletedSiteEmail.SubjectScript == defaultEmailASubjectScript
				&& deletedSiteEmail.State == 'FactoryDefault'
				&& deletedSiteEmail.IsFactoryDefault == true
				&& deletedSiteEmail.IsStaged == false

				&& deletedGroupEmail.SubjectScript != 'y'
				&& deletedGroupEmail.State == 'FactoryDefault'
				&& deletedGroupEmail.IsFactoryDefault == true
				&& deletedGroupEmail.IsStaged == false
			);
		});

		test("Getting an email file gets file", async assert => {
			let file = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			assert(file.Name == testFileName);
		});

		test("Saving a file saves file and sets email into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmailFile.Content == 'new file content'

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length

				&& savedEmail.Files.length > 0);
		});

		test("Saving a file saves file and sets template into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmailFile({ name: testFileName, content: 'new file content' });
			let savedEmail = await dataProvider.getEmail({ });
			let savedEmailFile = await dataProvider.getEmailFile({ name: testFileName });
			let revertResult = await dataProvider.revertEmail({});

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == true

				&& savedEmailFile.Content == 'new file content'

				&& savedEmail.Type == 'Template'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length + 1
			);
		});

		test("Saving a file multiple times saves file and sets email into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult0 = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content 2' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmailFile.Content == 'new file content 2'

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length

				&& savedEmail.Files.length > 0);
		});

		test("Saving a file multiple times saves file and sets template into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult0 = await dataProvider.saveEmailFile({ name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataProvider.saveEmailFile({ name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataProvider.saveEmailFile({ name: testFileName, content: 'new file content 2' });
			let savedEmail = await dataProvider.getEmail({ });
			let savedEmailFile = await dataProvider.getEmailFile({ name: testFileName });
			let revertResult = await dataProvider.revertEmail({});

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == true
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmailFile.Content == 'new file content 2'

				&& savedEmail.Type == 'Template'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length + 1);
		});

		test("Reverting an email with a saved file reverts both", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });
			let revertedEmail = await dataProvider.getEmail({ id: emailAId });
			let revertedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& revertedEmailFile.Content === originalEmailFile.Content

				&& revertedEmail.Id == emailAId
				&& revertedEmail.State == 'FactoryDefault'

				&& revertedEmail.Files.length > 0);
		})

		test("Reverting a template with a saved file reverts both", async assert => {

			let originalEmail = await dataProvider.getEmail({});
			let preSaveResult = await dataProvider.saveEmailFile({ name: testFileName, content: 'content 0' });
			let prePublishResult = await dataProvider.publishEmail({ });

			let originalEmailFile = await dataProvider.getEmailFile({ name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ name: testFileName, content: 'content 1' });
			let revertResult = await dataProvider.revertEmail({ });
			let revertedEmail = await dataProvider.getEmail({ });
			let revertedEmailFile = await dataProvider.getEmailFile({ name: testFileName });

			let deleteEmail = await dataProvider.deleteEmail({});
			let deletePublishEmail = await dataProvider.publishEmail({});

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& revertedEmailFile.Content === originalEmailFile.Content

				&& revertedEmail.Type == 'Template'
				&& revertedEmail.State == 'CustomizedDefault'

				&& revertedEmail.Files.length > 0);
		})

		test("Publishing an email with saved file publishes both", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let publishResult = await dataProvider.publishEmail({ id: emailAId });

			let publishedEmail = await dataProvider.getEmail({ id: emailAId });
			let publishedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmail({ id: emailAId });
			let deletePublishResult = await dataProvider.publishEmail({ id: emailAId });

			let deletedEmail = await dataProvider.getEmail({ id: emailAId });
			let deletedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& publishedEmailFile.Content == 'new content'

				&& publishedEmail.Id == emailAId
				&& publishedEmail.State == 'CustomizedDefault'
				&& publishedEmail.IsFactoryDefault == false
				&& publishedEmail.IsStaged == false

				&& publishedEmail.Files.length > 0
			);
		});

		test("Publishing a template with saved file publishes both", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let originalEmailFile = await dataProvider.getEmailFile({ name: testFileName });

			let saveResult = await dataProvider.saveEmailFile({ name: testFileName, content: 'new content' });
			let publishResult = await dataProvider.publishEmail({ });

			let publishedEmail = await dataProvider.getEmail({ });
			let publishedEmailFile = await dataProvider.getEmailFile({ name: testFileName });

			let deleteResult = await dataProvider.deleteEmail({ });
			let deletePublishResult = await dataProvider.publishEmail({ });

			let deletedEmail = await dataProvider.getEmail({ });
			let deletedEmailFile = await dataProvider.getEmailFile({ name: testFileName });

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& publishedEmailFile.Content == 'new content'

				&& publishedEmail.Type == 'Template'
				&& publishedEmail.State == 'CustomizedDefault'
				&& publishedEmail.IsFactoryDefault == false
				&& publishedEmail.IsStaged == false

				&& publishedEmail.Files.length > 0
			);
		});

		test("Deleting a published customization of default email reverts email and edited file", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let publishResult = await dataProvider.publishEmail({ id: emailAId });

			let publishedEmail = await dataProvider.getEmail({ id: emailAId });
			let publishedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmail({ id: emailAId });
			let deletePublishResult = await dataProvider.publishEmail({ id: emailAId });

			let deletedEmail = await dataProvider.getEmail({ id: emailAId });
			let deletedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& deletedEmailFile.Content === originalEmailFile.Content

				&& deletedEmail.Id == emailAId
				&& deletedEmail.State == 'FactoryDefault'

				&& deletedEmail.Files.length > 0
			);
		});

		test("Deleting a published customization of default template reverts email and edited file", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let originalEmailFile = await dataProvider.getEmailFile({ name: testFileName });

			let saveResult = await dataProvider.saveEmailFile({ name: testFileName, content: 'new content' });
			let publishResult = await dataProvider.publishEmail({ });

			let publishedEmail = await dataProvider.getEmail({ });
			let publishedEmailFile = await dataProvider.getEmailFile({ name: testFileName });

			let deleteResult = await dataProvider.deleteEmail({ });
			let deletePublishResult = await dataProvider.publishEmail({ });

			let deletedEmail = await dataProvider.getEmail({ });
			let deletedEmailFile = await dataProvider.getEmailFile({ name: testFileName });

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& deletedEmailFile == null && deletedEmailFile == originalEmailFile

				&& deletedEmail.Type == 'Template'
				&& deletedEmail.State == 'FactoryDefault'

				&& deletedEmail.Files.length == 0
			);
		});

		test("Getting non-staged version of otherwise staged email file gets non-staged version", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let nonStagedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName, staged: false });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmailFile.Content != 'new content'
				&& savedEmailFile.Content == 'new content'
				&& nonStagedEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Getting non-staged version of otherwise staged email file gets non-staged version", async assert => {
			let originalEmail = await dataProvider.getEmail({});

			let setupEmailFile = await dataProvider.saveEmailFile({ name: testFileName, content: 'content 0' });
			let setupEmailFilePublish = await dataProvider.publishEmail({ });

			let originalEmailFile = await dataProvider.getEmailFile({ name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ name: testFileName, content: 'new content' });
			let savedEmail = await dataProvider.getEmail({ });
			let savedEmailFile = await dataProvider.getEmailFile({ name: testFileName });
			let nonStagedEmailFile = await dataProvider.getEmailFile({ name: testFileName, staged: false });
			let revertResult = await dataProvider.revertEmail({});

			let deleteResult = await dataProvider.deleteEmail({ });
			let deletePublishResult = await dataProvider.publishEmail({ });

			assert(originalEmailFile.Content != 'new content'
				&& savedEmailFile.Content == 'new content'
				&& nonStagedEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default email file gets fac default version", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let facDefaultEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName, factoryDefault: true });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmailFile.Content != 'new content'
				&& savedEmailFile.Content == 'new content'
				&& facDefaultEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Restoring a deleted email file from non-staging restores it and its metadata", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let restoreResult = await dataProvider.restoreEmailFile({ id: emailAId, name: testFileName });
			let restoredEmail = await dataProvider.getEmail({ id: emailAId });
			let restoredEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmailFile == null

				&& restoreResult.stagedEmails.length == 1
				&& restoreResult.email.Files.length == originalEmail.Files.length
				&& restoreResult.email.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmailFile.Content == originalEmailFile.Content
				&& restoredEmail.Files.length == originalEmail.Files.length
				&& restoredEmail.Files.find(s => s.Name == testFileName) != null
				&& restoredEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Restoring a deleted template file from non-staging restores it and its metadata", async assert => {

			let setupEmailFile = await dataProvider.saveEmailFile({ name: testFileName, content: 'content 0' });
			let setupEmailFilePublish = await dataProvider.publishEmail({ });

			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let restoreResult = await dataProvider.restoreEmailFile({ id: emailAId, name: testFileName });
			let restoredEmail = await dataProvider.getEmail({ id: emailAId });
			let restoredEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			let resetResult = await dataProvider.deleteEmail({ });
			let resetPublishResult = await dataProvider.publishEmail({ });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmailFile == null

				&& restoreResult.stagedEmails.length == 1
				&& restoreResult.email.Files.length == originalEmail.Files.length
				&& restoreResult.email.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmailFile.Content == originalEmailFile.Content
				&& restoredEmail.Files.length == originalEmail.Files.length
				&& restoredEmail.Files.find(s => s.Name == testFileName) != null
				&& restoredEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Restoring a deleted file from fac default restores it and its metadata", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let publishResult = await dataProvider.publishEmail({ id: emailAId });

			let restoreResult = await dataProvider.restoreEmailFile({ id: emailAId, name: testFileName });
			let restoredEmail = await dataProvider.getEmail({ id: emailAId });
			let restoredEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult2 = await dataProvider.deleteEmail({ id: emailAId });
			let deletePublishResult2 = await dataProvider.publishEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmailFile == null

				&& restoreResult.stagedEmails.length == 1
				&& restoreResult.email.Files.length == originalEmail.Files.length
				&& restoreResult.email.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmailFile.Content == originalEmailFile.Content
				&& restoredEmail.Files.length == originalEmail.Files.length
				&& restoredEmail.Files.find(s => s.Name == testFileName) != null
				&& restoredEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Deleting a file from a default email sets email to staged with removed file", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let deleteResult = await dataProvider.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmail = await dataProvider.getEmail({ id: emailAId });
			let deletedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });
			let revertedEmail = await dataProvider.getEmail({ id: emailAId });
			let revertedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmail.Files.length == originalEmail.Files.length - 1
				&& deletedEmail.Files.find(s => s.Name == testFileName) == null
				&& deletedEmail.State == 'CustomizedDefault'
				&& deletedEmail.IsFactoryDefault == false
				&& deletedEmail.IsStaged == true

				&& deletedEmailFile == null
			);
		});

		test("Reverting file deletion from staged email sets email back to factory default", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let deleteResult = await dataProvider.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmail = await dataProvider.getEmail({ id: emailAId });
			let deletedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });
			let revertedEmail = await dataProvider.getEmail({ id: emailAId });
			let revertedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmail.Files.length == originalEmail.Files.length - 1
				&& deletedEmail.Files.find(s => s.Name == testFileName) == null
				&& deletedEmail.State == 'CustomizedDefault'
				&& deletedEmail.IsFactoryDefault == false
				&& deletedEmail.IsStaged == true

				&& deletedEmailFile == null

				&& revertResult.stagedEmails.length == 0
				&& revertResult.revertedEmail.IsStaged == false
				&& revertResult.revertedEmail.Files.length == originalEmail.Files.length
				&& revertResult.revertedEmail.Files.find(s => s.Name == testFileName) != null

				&& revertedEmail.IsStaged == false
				&& revertedEmail.Files.length == originalEmail.Files.length
				&& revertedEmail.Files.find(s => s.Name == testFileName) != null

				&& revertedEmailFile !== null
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, newName: 'newname.jsm' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: 'newname.jsm' });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalEmail.Files.filter(s => s.Name == testFileName).length == 1

				&& originalEmail.Files.length == savedEmail.Files.length

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedEmail.Files.filter(s => s.Name == testFileName).length == 0

				&& savedEmailFile.Name == 'newname.jsm'
				&& originalEmailFile.Content == savedEmailFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Renaming a template file renames file even without new content", async assert => {
			let setupEmailFile = await dataProvider.saveEmailFile({ name: testFileName, content: 'content 0' });
			let setupEmailFilePublish = await dataProvider.publishEmail({ });

			let originalEmail = await dataProvider.getEmail({ });
			let originalEmailFile = await dataProvider.getEmailFile({ name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ name: testFileName, newName: 'newname.jsm' });
			let savedEmail = await dataProvider.getEmail({ });
			let savedEmailFile = await dataProvider.getEmailFile({ name: 'newname.jsm' });
			let revertResult = await dataProvider.revertEmail({});

			let resetResult = await dataProvider.deleteEmail({ });
			let resetPublishResult = await dataProvider.publishEmail({ });


			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'CustomizedDefault'
				&& originalEmail.IsFactoryDefault == false
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalEmail.Files.filter(s => s.Name == testFileName).length == 1

				&& originalEmail.Files.length == savedEmail.Files.length

				&& savedEmail.Type == 'Template'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedEmail.Files.filter(s => s.Name == testFileName).length == 0

				&& savedEmailFile.Name == 'newname.jsm'
				&& originalEmailFile.Content == savedEmailFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new file creates a non-saved email file stub with pre-defined name and metadata", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.createEmailFile({ id: emailAId });

			assert(saveResult
				&& saveResult.Id == emailAId
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.EmailName == originalEmail.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalEmail.Files.length
			);
		});

		test("Creating a new file creates a non-saved template file stub with pre-defined name and metadata", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.createEmailFile({});

			assert(saveResult
				&& saveResult.Type == 'Template'
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.EmailName == originalEmail.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalEmail.Files.length
			);
		});

		test("Saving a new file saves file and sets email into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: 'newfile.jsm', content: 'content' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: 'newfile.jsm' });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& savedEmailFile.Content == 'content'

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.length == originalEmail.Files.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Saving a new file saves file and sets template into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmailFile({ name: 'newfile.jsm', content: 'content' });
			let savedEmail = await dataProvider.getEmail({ });
			let savedEmailFile = await dataProvider.getEmailFile({ name: 'newfile.jsm' });
			let revertResult = await dataProvider.revertEmail({ });

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& savedEmailFile.Content == 'content'

				&& savedEmail.Type == 'Template'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.length == originalEmail.Files.length + 1

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

		test("Listing emails should list all emails", async assert => {
			let emails = (await dataModel.listEmails()).emails;
			assert(emails.length === defaultEmailComponentsLength);
		});

		test("Listing emails should include both emails and template", async assert => {
			let emails = (await dataModel.listEmails()).emails;
			assert(emails.length === defaultEmailComponentsLength
				&& emails[0].Type == 'Template'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].Type == 'Email'
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false

				&& emails[2].Type == 'Email'
				&& emails[2].State == 'FactoryDefault'
				&& emails[2].IsFactoryDefault == true
				&& emails[2].IsStaged == false

				&& emails[3].Type == 'Email'
				&& emails[3].State == 'FactoryDefault'
				&& emails[3].IsFactoryDefault == true
				&& emails[3].IsStaged == false
			);
		});

		test("Listing only emails should include only emails", async assert => {
			let emails = (await dataModel.listEmails({ includeEmails: true, includeTemplate: false })).emails;
			assert(emails.length === defaultEmailsLength
				&& emails[0].Type == 'Email'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].Type == 'Email'
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false

				&& emails[2].Type == 'Email'
				&& emails[2].State == 'FactoryDefault'
				&& emails[2].IsFactoryDefault == true
				&& emails[2].IsStaged == false
			);
		});

		test("Listing only template should include only template", async assert => {
			let emails = (await dataModel.listEmails({ includeEmails: false, includeTemplate: true })).emails;
			assert(emails.length === defaultTemplateLength
				&& emails[0].Type == 'Template'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false
			);
		});

		test("Listing emails by staged: true should only return staged emails", async assert => {
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataModel.listEmails({ staged: true })).emails;
			await dataModel.revertEmail({ id: emailAId })
			assert(emails.length == 1
				&& emails[0].SubjectScript == 'x'
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == false
				&& emails[0].IsStaged == true);
		});

		test("Listing template by staged: true should only return staged templates", async assert => {
			await dataModel.saveEmail({ templateScript: 'x' })
			let emails = (await dataModel.listEmails({ staged: true })).emails;
			await dataModel.revertEmail({ })
			assert(emails.length == 1
				&& emails[0].TemplateScript == 'x'
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == false
				&& emails[0].IsStaged == true);
		});

		test("Listing both by staged: true should only return staged emails and templates", async assert => {
			await dataModel.saveEmail({ templateScript: 'x' })
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })

			let emails = (await dataModel.listEmails({ staged: true })).emails;

			await dataModel.revertEmail({})
			await dataModel.revertEmail({ id: emailAId })

			assert(emails.length == 2
				&& emails[0].Type == 'Template'
				&& emails[0].TemplateScript == 'x'
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == false
				&& emails[0].IsStaged == true

				&& emails[1].Type == 'Email'
				&& emails[1].SubjectScript == 'x'
				&& emails[1].State == 'CustomizedDefault'
				&& emails[1].IsFactoryDefault == false
				&& emails[1].IsStaged == true
			);
		});

		test("Listing emails by staged: false should return non-staged emails as well as the published version of currently-staged emails", async assert => {
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataModel.listEmails({ staged: false, includeEmails: true, includeTemplate: false })).emails;
			await dataModel.revertEmail({ id: emailAId })
			assert(emails.length == defaultEmailsLength

				&& emails[0].SubjectScript == defaultEmailASubjectScript
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].SubjectScript == defaultEmailBSubjectScript
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false);
		});

		test("Listing emails by staged: false should return non-staged emails as well as the published version of currently-staged templates", async assert => {
			await dataModel.saveEmail({ TemplateScript: 'x' })
			let emails = (await dataModel.listEmails({ staged: false, includeEmails: true, includeTemplate: true })).emails;
			await dataModel.revertEmail({})
			assert(emails.length == defaultEmailComponentsLength

				&& emails[0].TemplateScript != 'x'
				&& emails[0].State == 'CustomizedDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].SubjectScript == defaultEmailASubjectScript
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false);
		});

		test("Listing emails by state: 'FactoryDefault' should only return emails which are currently in a Factory Default State", async assert => {
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataModel.listEmails({ state: 'FactoryDefault', includeTemplate: false })).emails;
			await dataModel.revertEmail({ id: emailAId })
			assert(emails.length == defaultEmailsLength - 1
				&& emails[0].State == 'FactoryDefault');
		});

		test("Listing emails by state: 'FactoryDefault' should only return templates which are currently in a Factory Default State", async assert => {
			await dataModel.saveEmail({ TemplateScript: 'x' })
			let emails = (await dataModel.listEmails({ state: 'FactoryDefault', includeTemplate: true, includeEmails: false })).emails;
			await dataModel.revertEmail({ })
			assert(emails.length == defaultTemplateLength - 1);
		});

		test("Listing emails by state: 'CustomizedDefault' should return only emails which are currently in a CustomizedDefault State", async assert => {
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataModel.listEmails({ state: 'CustomizedDefault', includeTemplate: false })).emails;
			await dataModel.revertEmail({ id: emailAId })
			assert(emails.length == 1
				&& emails[0].State == 'CustomizedDefault');
		});

		test("Listing templates by state: 'CustomizedDefault' should return only templates which are currently in a CustomizedDefault State", async assert => {
			await dataModel.saveEmail({ TemplateScript: 'x' })
			let emails = (await dataModel.listEmails({ state: 'CustomizedDefault', includeEmails: false })).emails;
			await dataModel.revertEmail({ })
			assert(emails.length == 1
				&& emails[0].Type == 'Template'
				&& emails[0].State == 'CustomizedDefault');
		});

		test("Getting an email returns email", async assert => {
			let email = await dataModel.getEmail({ id: emailAId, });
			assert(email.Id == emailAId);
		});

		test("Getting template returns template", async assert => {
			let email = await dataModel.getEmail({ });
			assert(email.Id == null
				&& email.Type == 'Template');
		});

		test("Getting an email returns latest version of email", async assert => {
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataModel.getEmail({ id: emailAId, });
			await dataModel.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.State == 'CustomizedDefault'
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting a template returns latest version of template", async assert => {
			await dataModel.saveEmail({ templateScript: 'x' })
			let email = await dataModel.getEmail({ });
			await dataModel.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.State == 'CustomizedDefault'
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting an email with staged: false should return non-staged version of email", async assert => {
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataModel.getEmail({ id: emailAId, staged: false });
			await dataModel.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == defaultEmailASubjectScript
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting a template with staged: false should return non-staged version of template", async assert => {
			await dataModel.saveEmail({ templateScript: 'x' })
			let email = await dataModel.getEmail({ staged: false });
			await dataModel.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript != 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting an email with staged: true should return staged version of email", async assert => {
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataModel.getEmail({ id: emailAId, staged: true });
			await dataModel.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting a template with staged: true should return staged version of template", async assert => {
			await dataModel.saveEmail({ templateScript: 'x' })
			let email = await dataModel.getEmail({ staged: true });
			await dataModel.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript == 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting an email with factoryDefault: true should return factory default version of email", async assert => {
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataModel.getEmail({ id: emailAId, factoryDefault: true });
			await dataModel.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == defaultEmailASubjectScript
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting a template with factoryDefault: true should return factory default version of template", async assert => {
			await dataModel.saveEmail({ templateScript: 'x' })
			let email = await dataModel.getEmail({ factoryDefault: true });
			await dataModel.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript != 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting an email with factoryDefault: false should return non-factory default version of email", async assert => {
			await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataModel.getEmail({ id: emailAId, factoryDefault: false });
			await dataModel.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Getting a template with factoryDefault: false should return non-factory default version of template", async assert => {
			await dataModel.saveEmail({ templateScript: 'x' })
			let email = await dataModel.getEmail({ factoryDefault: false });
			await dataModel.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript == 'x'
				&& email.State == 'CustomizedDefault' // to know that this is a cutomized email but currently viewing fac default version
				&& email.IsFactoryDefault == false
				&& email.IsStaged == true);
		});

		test("Saving a default email saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let savedEmail = await dataModel.getEmail({ id: emailAId });
			await dataModel.revertEmail({ id: emailAId })
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmail.Id == emailAId
				&& savedEmail.SubjectScript == 'x'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length > 0
				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default email multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'y' });
			let saveResult2 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'z' });
			let savedEmail = await dataModel.getEmail({ id: emailAId  });
			await dataModel.revertEmail({ id: emailAId })
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmail.Id == emailAId
				&& savedEmail.SubjectScript == 'z'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length > 0
				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default template multiple times saves and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult0 = await dataModel.saveEmail({ templateScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ templateScript: 'y' });
			let saveResult2 = await dataModel.saveEmail({ templateScript: 'z' });
			let savedEmail = await dataModel.getEmail({ });
			await dataModel.revertEmail({ })
			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmail.Type == 'Template'
				&& savedEmail.TemplateScript == 'z'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default email saves and returns saved email and list of staged", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			await dataModel.revertEmail({ id: emailAId })
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedEmail.Id == emailAId
				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length > 0

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& saveResult.stagedEmails.length == 1

				&& saveResult.stagedEmails[0].Id == emailAId
				&& saveResult.stagedEmails[0].SubjectScript == 'x'
				&& saveResult.stagedEmails[0].State == 'CustomizedDefault'
				&& saveResult.stagedEmails[0].IsFactoryDefault == false
				&& saveResult.stagedEmails[0].IsStaged == true
				);
		});

		test("Saving a default template saves and returns saved template and list of staged", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult = await dataModel.saveEmail({ templateScript: 'x' });
			await dataModel.revertEmail({ })
			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedEmail.Type == 'Template'
				&& saveResult.savedEmail.TemplateScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& saveResult.stagedEmails.length == 1

				&& saveResult.stagedEmails[0].Type == 'Template'
				&& saveResult.stagedEmails[0].TemplateScript == 'x'
				&& saveResult.stagedEmails[0].State == 'CustomizedDefault'
				&& saveResult.stagedEmails[0].IsFactoryDefault == false
				&& saveResult.stagedEmails[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, customized default email reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let revertResult = await dataModel.revertEmail({ id: emailAId });
			let revertedEmail = await dataModel.getEmail({ id: emailAId });
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.Id == emailAId
				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length > 0

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& revertResult.revertedEmail.Id == emailAId
				&& revertResult.revertedEmail.SubjectScript == defaultEmailASubjectScript
				&& revertResult.revertedEmail.State == 'FactoryDefault'
				&& revertResult.revertedEmail.IsFactoryDefault == true
				&& revertResult.revertedEmail.IsStaged == false

				&& revertResult.revertedEmail.Files.length > 0
				&& revertResult.revertedEmail.Files.length == originalEmail.Files.length

				&& revertedEmail.Id == emailAId

				&& revertedEmail.SubjectScript == defaultEmailASubjectScript
				&& revertedEmail.State == 'FactoryDefault'
				&& revertedEmail.IsFactoryDefault == true
				&& revertedEmail.IsStaged == false

				&& revertedEmail.Files.length > 0

				&& revertedEmail.Files.length == originalEmail.Files.length
				);
		});

		test("Reverting a saved, staged, customized default template reverts and sets it into a staged, customized default, state and saves files too", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult = await dataModel.saveEmail({ templateScript: 'x' });
			let revertResult = await dataModel.revertEmail({ });
			let revertedEmail = await dataModel.getEmail({ });
			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.Type == 'Template'
				&& saveResult.savedEmail.TemplateScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& revertResult.revertedEmail.Type == 'Template'
				&& revertResult.revertedEmail.TemplateScript != 'x'
				&& revertResult.revertedEmail.State == 'FactoryDefault'
				&& revertResult.revertedEmail.IsFactoryDefault == true
				&& revertResult.revertedEmail.IsStaged == false

				&& revertResult.revertedEmail.Files.length == originalEmail.Files.length

				&& revertedEmail.Type == 'Template'

				&& revertedEmail.TemplateScript != 'x'
				&& revertedEmail.State == 'FactoryDefault'
				&& revertedEmail.IsFactoryDefault == true
				&& revertedEmail.IsStaged == false

				&& revertedEmail.Files.length == originalEmail.Files.length
				);
		});

		test("Reverting multiple emails reverts multiple emails", async assert => {
			let originalEmail0 = await dataModel.getEmail({ id: emailAId });
			let originalEmail1 = await dataModel.getEmail({ id: emailBId });
			let originalEmail2 = await dataModel.getEmail({ id: emailCId });

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ id: emailBId, subjectScript: 'y' });
			let saveResult2 = await dataModel.saveEmail({ id: emailCId, subjectScript: 'z' });

			let revertResult = await dataModel.revertEmails({ emails: [
				{ id: emailAId, model: 'email' },
				{ id: emailBId, model: 'email' },
				{ id: emailCId, model: 'email' }
			]});

			let revertedEmail0 = await dataModel.getEmail({ id: emailAId });
			let revertedEmail1 = await dataModel.getEmail({ id: emailBId });
			let revertedEmail2 = await dataModel.getEmail({ id: emailCId });

			assert(originalEmail0.SubjectScript == defaultEmailASubjectScript
				&& originalEmail0.State == 'FactoryDefault'
				&& originalEmail0.IsFactoryDefault == true
				&& originalEmail0.IsStaged == false

				&& originalEmail1.SubjectScript == defaultEmailBSubjectScript
				&& originalEmail1.State == 'FactoryDefault'
				&& originalEmail1.IsFactoryDefault == true
				&& originalEmail1.IsStaged == false

				&& originalEmail2.SubjectScript == defaultEmailCSubjectScript
				&& originalEmail2.State == 'FactoryDefault'
				&& originalEmail2.IsFactoryDefault == true
				&& originalEmail2.IsStaged == false

				&& saveResult0.savedEmail.SubjectScript == 'x'
				&& saveResult0.savedEmail.State == 'CustomizedDefault'
				&& saveResult0.savedEmail.IsFactoryDefault == false
				&& saveResult0.savedEmail.IsStaged == true

				&& saveResult1.savedEmail.SubjectScript == 'y'
				&& saveResult1.savedEmail.State == 'CustomizedDefault'
				&& saveResult1.savedEmail.IsFactoryDefault == false
				&& saveResult1.savedEmail.IsStaged == true

				&& saveResult2.savedEmail.SubjectScript == 'z'
				&& saveResult2.savedEmail.State == 'CustomizedDefault'
				&& saveResult2.savedEmail.IsFactoryDefault == false
				&& saveResult2.savedEmail.IsStaged == true

				&& revertResult.stagedEmails.length == 0

				&& revertedEmail0.SubjectScript == defaultEmailASubjectScript
				&& revertedEmail0.State == 'FactoryDefault'
				&& revertedEmail0.IsFactoryDefault == true
				&& revertedEmail0.IsStaged == false

				&& revertedEmail1.SubjectScript == defaultEmailBSubjectScript
				&& revertedEmail1.State == 'FactoryDefault'
				&& revertedEmail1.IsFactoryDefault == true
				&& revertedEmail1.IsStaged == false

				&& revertedEmail2.SubjectScript == defaultEmailCSubjectScript
				&& revertedEmail2.State == 'FactoryDefault'
				&& revertedEmail2.IsFactoryDefault == true
				&& revertedEmail2.IsStaged == false
			);
		});

		test("Reverting email and template reverts both", async assert => {
			let originalEmail0 = await dataModel.getEmail({ id: emailAId });
			let originalEmail1 = await dataModel.getEmail({ });

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ templateScript: 'y' });

			let revertResult = await dataModel.revertEmails({ emails: [
				{ id: emailAId, model: 'email' },
				{ model: 'email' }
			]});

			let revertedEmail0 = await dataModel.getEmail({ id: emailAId });
			let revertedEmail1 = await dataModel.getEmail({ });

			assert(originalEmail0.SubjectScript == defaultEmailASubjectScript
				&& originalEmail0.State == 'FactoryDefault'
				&& originalEmail0.IsFactoryDefault == true
				&& originalEmail0.IsStaged == false

				&& originalEmail1.TemplateScript != 'y'
				&& originalEmail1.State == 'FactoryDefault'
				&& originalEmail1.IsFactoryDefault == true
				&& originalEmail1.IsStaged == false

				&& saveResult0.savedEmail.SubjectScript == 'x'
				&& saveResult0.savedEmail.State == 'CustomizedDefault'
				&& saveResult0.savedEmail.IsFactoryDefault == false
				&& saveResult0.savedEmail.IsStaged == true

				&& saveResult1.savedEmail.TemplateScript == 'y'
				&& saveResult1.savedEmail.State == 'CustomizedDefault'
				&& saveResult1.savedEmail.IsFactoryDefault == false
				&& saveResult1.savedEmail.IsStaged == true

				&& revertResult.stagedEmails.length == 0

				&& revertedEmail0.SubjectScript == defaultEmailASubjectScript
				&& revertedEmail0.State == 'FactoryDefault'
				&& revertedEmail0.IsFactoryDefault == true
				&& revertedEmail0.IsStaged == false

				&& revertedEmail1.TemplateScript != 'y'
				&& revertedEmail1.State == 'FactoryDefault'
				&& revertedEmail1.IsFactoryDefault == true
				&& revertedEmail1.IsStaged == false
				);
		});

		test("Deleting a published customized default stages reversion to factory default", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let publishResult = await dataModel.publishEmail({ id: emailAId });
			let deleteResult = await dataModel.deleteEmail({ id: emailAId });
			let stagedDeletedEmail = await dataModel.getEmail({ id: emailAId });
			let deletePublishResult = await dataModel.publishEmail({ id: emailAId });

			assert(originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& publishResult.publishedEmail.SubjectScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& deleteResult.email.SubjectScript == defaultEmailASubjectScript
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true

				&& stagedDeletedEmail.SubjectScript == defaultEmailASubjectScript
				&& stagedDeletedEmail.State == 'FactoryDefault'
				&& stagedDeletedEmail.IsFactoryDefault == true
				&& stagedDeletedEmail.IsStaged == true
				);
		});

		test("Deleting a published customized default template stages reversion to factory default", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult = await dataModel.saveEmail({ templateScript: 'x' });
			let publishResult = await dataModel.publishEmail({  });
			let deleteResult = await dataModel.deleteEmail({  });
			let stagedDeletedEmail = await dataModel.getEmail({ });
			let deletePublishResult = await dataModel.publishEmail({  });

			assert(originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.TemplateScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& publishResult.publishedEmail.TemplateScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& deleteResult.email.TemplateScript != 'x'
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true

				&& stagedDeletedEmail.TemplateScript != 'x'
				&& stagedDeletedEmail.State == 'FactoryDefault'
				&& stagedDeletedEmail.IsFactoryDefault == true
				&& stagedDeletedEmail.IsStaged == true
				);
		});

		test("Reverting a staged deletion of customized default restores customized default", async assert => {

			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let publishResult = await dataModel.publishEmail({ id: emailAId });
			let deleteResult = await dataModel.deleteEmail({ id: emailAId });
			let revertResult = await dataModel.revertEmail({ id: emailAId });

			let realDeleteResult = await dataModel.deleteEmail({ id: emailAId });
			let deletePublishResult = await dataModel.publishEmail({ id: emailAId });

			assert(originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& publishResult.publishedEmail.SubjectScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& deleteResult.email.SubjectScript == defaultEmailASubjectScript
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true

				&& revertResult.revertedEmail.SubjectScript == 'x'
				&& revertResult.revertedEmail.State == 'CustomizedDefault'
				&& revertResult.revertedEmail.IsFactoryDefault == false
				&& revertResult.revertedEmail.IsStaged == false
				);
		})

		test("Reverting a staged deletion of customized default template restores customized default template", async assert => {

			let originalEmail = await dataModel.getEmail({ });
			let saveResult = await dataModel.saveEmail({ templateScript: 'x' });
			let publishResult = await dataModel.publishEmail({ });
			let deleteResult = await dataModel.deleteEmail({ });
			let revertResult = await dataModel.revertEmail({ });

			let realDeleteResult = await dataModel.deleteEmail({ });
			let deletePublishResult = await dataModel.publishEmail({ });

			assert(originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.TemplateScript == 'x'
				&& saveResult.savedEmail.State == 'CustomizedDefault'
				&& saveResult.savedEmail.IsFactoryDefault == false
				&& saveResult.savedEmail.IsStaged == true

				&& publishResult.publishedEmail.TemplateScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& deleteResult.email.TemplateScript != 'x'
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true

				&& revertResult.revertedEmail.TemplateScript == 'x'
				&& revertResult.revertedEmail.State == 'CustomizedDefault'
				&& revertResult.revertedEmail.IsFactoryDefault == false
				&& revertResult.revertedEmail.IsStaged == false
				);
		})

		test("Publishing a saved change to a default email saves and sets it into a published, customized default, state and saves files too", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let publishResult = await dataModel.publishEmail({ id: emailAId });
			let publishedEmail = await dataModel.getEmail({ id: emailAId });
			await dataModel.deleteEmail({ id: emailAId })
			await dataModel.publishEmail({ id: emailAId });
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& publishedEmail.Id == emailAId
				&& publishedEmail.SubjectScript == 'x'
				&& publishedEmail.State == 'CustomizedDefault'
				&& publishedEmail.IsFactoryDefault == false
				&& publishedEmail.IsStaged == false

				&& publishedEmail.Files.length > 0

				&& publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.publishedEmail.Id == emailAId
				&& publishResult.publishedEmail.SubjectScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& publishResult.publishedEmail.Files.length > 0

				&& publishResult.publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.stagedEmails.length == 0
				);
		});

		test("Publishing a saved change to a default template saves and sets it into a published, customized default template, state and saves files too", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult = await dataModel.saveEmail({ templateScript: 'x' });
			let publishResult = await dataModel.publishEmail({ });
			let publishedEmail = await dataModel.getEmail({ });
			await dataModel.deleteEmail({ })
			await dataModel.publishEmail({ });
			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& publishedEmail.Type == 'Template'
				&& publishedEmail.TemplateScript == 'x'
				&& publishedEmail.State == 'CustomizedDefault'
				&& publishedEmail.IsFactoryDefault == false
				&& publishedEmail.IsStaged == false

				&& publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.publishedEmail.Type == 'Template'
				&& publishResult.publishedEmail.TemplateScript == 'x'
				&& publishResult.publishedEmail.State == 'CustomizedDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == false
				&& publishResult.publishedEmail.IsStaged == false

				&& publishResult.publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.stagedEmails.length == 0
				);
		});

		test("Publishing multiple emails publishes multiple emails", async assert => {
			let originalEmail0 = await dataModel.getEmail({ id: emailAId });
			let originalEmail1 = await dataModel.getEmail({ id: emailBId });
			let originalEmail2 = await dataModel.getEmail({ id: emailCId });

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ id: emailBId, subjectScript: 'y' });
			let saveResult2 = await dataModel.saveEmail({ id: emailCId, subjectScript: 'z' });

			let publishResult = await dataModel.publishEmails({
				emails: [
					{ id: emailAId, model: 'email' },
					{ id: emailBId, model: 'email' },
					{ id: emailCId, model: 'email' }
				]
			});

			let publishedEmail0 = await dataModel.getEmail({ id: emailAId });
			let publishedEmail1 = await dataModel.getEmail({ id: emailBId });
			let publishedEmail2 = await dataModel.getEmail({ id: emailCId });

			await dataModel.deleteEmail({ id: emailAId });
			await dataModel.deleteEmail({ id: emailBId });
			await dataModel.deleteEmail({ id: emailCId });
			await dataModel.publishEmail({ id: emailAId });
			await dataModel.publishEmail({ id: emailBId });
			await dataModel.publishEmail({ id: emailCId });

			assert(originalEmail0.SubjectScript == defaultEmailASubjectScript
				&& originalEmail0.State == 'FactoryDefault'
				&& originalEmail0.IsFactoryDefault == true
				&& originalEmail0.IsStaged == false

				&& originalEmail1.SubjectScript == defaultEmailBSubjectScript
				&& originalEmail1.State == 'FactoryDefault'
				&& originalEmail1.IsFactoryDefault == true
				&& originalEmail1.IsStaged == false

				&& originalEmail2.SubjectScript == defaultEmailCSubjectScript
				&& originalEmail2.State == 'FactoryDefault'
				&& originalEmail2.IsFactoryDefault == true
				&& originalEmail2.IsStaged == false

				&& publishResult.stagedEmails.length == 0

				&& publishedEmail0.SubjectScript == 'x'
				&& publishedEmail0.State == 'CustomizedDefault'
				&& publishedEmail0.IsFactoryDefault == false
				&& publishedEmail0.IsStaged == false

				&& publishedEmail1.SubjectScript == 'y'
				&& publishedEmail1.State == 'CustomizedDefault'
				&& publishedEmail1.IsFactoryDefault == false
				&& publishedEmail1.IsStaged == false

				&& publishedEmail2.SubjectScript == 'z'
				&& publishedEmail2.State == 'CustomizedDefault'
				&& publishedEmail2.IsFactoryDefault == false
				&& publishedEmail2.IsStaged == false
				);
		});

		test("Publishing email and template publishes both", async assert => {
			let originalEmail0 = await dataModel.getEmail({ id: emailAId });
			let originalEmail1 = await dataModel.getEmail({ });

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ templateScript: 'y' });

			let publishResult = await dataModel.publishEmails({
				emails: [
					{ id: emailAId, model: 'email' },
					{ model: 'email' }
				]
			});

			let publishedEmail0 = await dataModel.getEmail({ id: emailAId });
			let publishedEmail1 = await dataModel.getEmail({ });

			await dataModel.deleteEmail({ id: emailAId });
			await dataModel.deleteEmail({ });
			await dataModel.publishEmail({ id: emailAId });
			await dataModel.publishEmail({ });

			assert(originalEmail0.SubjectScript == defaultEmailASubjectScript
				&& originalEmail0.State == 'FactoryDefault'
				&& originalEmail0.IsFactoryDefault == true
				&& originalEmail0.IsStaged == false

				&& originalEmail1.TemplateScript != 'y'
				&& originalEmail1.State == 'FactoryDefault'
				&& originalEmail1.IsFactoryDefault == true
				&& originalEmail1.IsStaged == false

				&& publishResult.stagedEmails.length == 0

				&& publishedEmail0.SubjectScript == 'x'
				&& publishedEmail0.State == 'CustomizedDefault'
				&& publishedEmail0.IsFactoryDefault == false
				&& publishedEmail0.IsStaged == false

				&& publishedEmail1.TemplateScript == 'y'
				&& publishedEmail1.State == 'CustomizedDefault'
				&& publishedEmail1.IsFactoryDefault == false
				&& publishedEmail1.IsStaged == false
				);
		});

		test("Deleting a published, customized default email reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let publishResult = await dataModel.publishEmail({ id: emailAId });
			let deleteResult = await dataModel.deleteEmail({ id: emailAId });
			let deletePublishResult = await dataModel.publishEmail({ id: emailAId });
			let deletedEmail = await dataModel.getEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& deleteResult.email.Id == emailAId
				&& deleteResult.email.SubjectScript == defaultEmailASubjectScript
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true
				&& deleteResult.email.IsReverted == true

				&& deletePublishResult.publishedEmail.Id == emailAId
				&& deletePublishResult.publishedEmail.SubjectScript == defaultEmailASubjectScript
				&& deletePublishResult.publishedEmail.State == 'FactoryDefault'
				&& deletePublishResult.publishedEmail.IsFactoryDefault == true
				&& deletePublishResult.publishedEmail.IsStaged == false

				&& deletePublishResult.publishedEmail.Files.length > 0

				&& deletePublishResult.publishedEmail.Files.length == originalEmail.Files.length

				&& deletedEmail.Id == emailAId
				&& deletedEmail.SubjectScript == defaultEmailASubjectScript
				&& deletedEmail.State == 'FactoryDefault'
				&& deletedEmail.IsFactoryDefault == true
				&& deletedEmail.IsStaged == false

				&& deletedEmail.Files.length > 0

				&& deletedEmail.Files.length == originalEmail.Files.length
				);
		});

		test("Deleting a published, customized default template reverts and sets it into a non-staged, fac default, state", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult = await dataModel.saveEmail({ templateScript: 'x' });
			let publishResult = await dataModel.publishEmail({ });
			let deleteResult = await dataModel.deleteEmail({ });
			let deletePublishResult = await dataModel.publishEmail({ });
			let deletedEmail = await dataModel.getEmail({ });

			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& deleteResult.email.Type == 'Template'
				&& deleteResult.email.TemplateScript != 'x'
				&& deleteResult.email.State == 'FactoryDefault'
				&& deleteResult.email.IsFactoryDefault == true
				&& deleteResult.email.IsStaged == true
				&& deleteResult.email.IsReverted == true

				&& deletePublishResult.publishedEmail.Type == 'Template'
				&& deletePublishResult.publishedEmail.TemplateScript != 'x'
				&& deletePublishResult.publishedEmail.State == 'FactoryDefault'
				&& deletePublishResult.publishedEmail.IsFactoryDefault == true
				&& deletePublishResult.publishedEmail.IsStaged == false

				&& deletePublishResult.publishedEmail.Files.length == originalEmail.Files.length

				&& deletedEmail.Type == 'Template'
				&& deletedEmail.TemplateScript != 'x'
				&& deletedEmail.State == 'FactoryDefault'
				&& deletedEmail.IsFactoryDefault == true
				&& deletedEmail.IsStaged == false

				&& deletedEmail.Files.length == originalEmail.Files.length
				);
		});

		test("Deleting multiple emails at different states deletes and/or reverts multiple emails", async assert => {
			// 2 types of states: staged customized default, published customized default
			let emailASaveResult = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let emailBSaveResult = await dataModel.saveEmail({ id: emailBId, subjectScript: 'y' });
			let emailBPublishResult = await dataModel.publishEmail({ id: emailBId });

			let stagedSiteEmail = await dataModel.getEmail({ id: emailAId });
			let publishedGroupEmail = await dataModel.getEmail({ id: emailBId });

			let deleteResult = await dataModel.deleteEmails({
				emails: [
					{ id: emailAId },
					{ id: emailBId }
				]
			});
			let deletePublishResult = await dataModel.publishEmails({
				emails: [
					{ id: emailAId, model: 'email' },
					{ id: emailBId, model: 'email' }
				]
			});

			let deletedSiteEmail = await dataModel.getEmail({ id: emailAId });
			let deletedGroupEmail = await dataModel.getEmail({ id: emailBId });

			assert(stagedSiteEmail.SubjectScript == 'x'
				&& stagedSiteEmail.State == 'CustomizedDefault'
				&& stagedSiteEmail.IsFactoryDefault == false
				&& stagedSiteEmail.IsStaged == true

				&& publishedGroupEmail.SubjectScript == 'y'
				&& publishedGroupEmail.State == 'CustomizedDefault'
				&& publishedGroupEmail.IsFactoryDefault == false
				&& publishedGroupEmail.IsStaged == false

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.revertedEmails.length == 1
				&& deleteResult.stagedEmails[0].Id == emailBId
				&& deleteResult.stagedEmails[0].IsReverted == true
				&& deleteResult.revertedEmails[0].Id == emailAId

				&& deletePublishResult.revertedEmails.length == 1
				&& deletePublishResult.revertedEmails[0].Id == emailBId

				&& deletedSiteEmail.SubjectScript == defaultEmailASubjectScript
				&& deletedSiteEmail.State == 'FactoryDefault'
				&& deletedSiteEmail.IsFactoryDefault == true
				&& deletedSiteEmail.IsStaged == false

				&& deletedGroupEmail.SubjectScript == defaultEmailBSubjectScript
				&& deletedGroupEmail.State == 'FactoryDefault'
				&& deletedGroupEmail.IsFactoryDefault == true
				&& deletedGroupEmail.IsStaged == false
			);
		});

		test("Deleting multiple emails and template at different states deletes and/or reverts multiple emails and template", async assert => {
			// 2 types of states: staged customized default, published customized default
			let emailASaveResult = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let emailBSaveResult = await dataModel.saveEmail({ templateScript: 'y' });
			let emailBPublishResult = await dataModel.publishEmail({ });

			let stagedSiteEmail = await dataModel.getEmail({ id: emailAId });
			let publishedGroupEmail = await dataModel.getEmail({});

			let deleteResult = await dataModel.deleteEmails({
				emails: [
					{ id: emailAId },
					{ }
				]
			});
			let deletePublishResult = await dataModel.publishEmails({
				emails: [
					{ id: emailAId, model: 'email' },
					{ model: 'email' }
				]
			});
			let deletedSiteEmail = await dataModel.getEmail({ id: emailAId });
			let deletedGroupEmail = await dataModel.getEmail({ });

			assert(stagedSiteEmail.SubjectScript == 'x'
				&& stagedSiteEmail.State == 'CustomizedDefault'
				&& stagedSiteEmail.IsFactoryDefault == false
				&& stagedSiteEmail.IsStaged == true

				&& publishedGroupEmail.TemplateScript == 'y'
				&& publishedGroupEmail.State == 'CustomizedDefault'
				&& publishedGroupEmail.IsFactoryDefault == false
				&& publishedGroupEmail.IsStaged == false

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.revertedEmails.length == 1
				&& deleteResult.stagedEmails[0].Type == 'Template'
				&& deleteResult.stagedEmails[0].IsReverted == true
				&& deleteResult.revertedEmails[0].Id == emailAId

				&& deletePublishResult.revertedEmails.length == 1
				&& deletePublishResult.revertedEmails[0].Type == 'Template'

				&& deletedSiteEmail.SubjectScript == defaultEmailASubjectScript
				&& deletedSiteEmail.State == 'FactoryDefault'
				&& deletedSiteEmail.IsFactoryDefault == true
				&& deletedSiteEmail.IsStaged == false

				&& deletedGroupEmail.SubjectScript != 'y'
				&& deletedGroupEmail.State == 'FactoryDefault'
				&& deletedGroupEmail.IsFactoryDefault == true
				&& deletedGroupEmail.IsStaged == false
			);
		});

		test("Getting an email file gets file", async assert => {
			let file = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			assert(file.Name == testFileName);
		});

		test("Saving a file saves file and sets email into staged state", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content' });
			let savedEmail = await dataModel.getEmail({ id: emailAId });
			let savedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataModel.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmailFile.Content == 'new file content'

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length

				&& savedEmail.Files.length > 0);
		});

		test("Saving a file saves file and sets template into staged state", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult = await dataModel.saveEmailFile({ name: testFileName, content: 'new file content' });
			let savedEmail = await dataModel.getEmail({ });
			let savedEmailFile = await dataModel.getEmailFile({ name: testFileName });
			let revertResult = await dataModel.revertEmail({});

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == true

				&& savedEmailFile.Content == 'new file content'

				&& savedEmail.Type == 'Template'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length + 1
			);
		});

		test("Saving a file multiple times saves file and sets email into staged state", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult0 = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content 2' });
			let savedEmail = await dataModel.getEmail({ id: emailAId });
			let savedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataModel.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmailFile.Content == 'new file content 2'

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length

				&& savedEmail.Files.length > 0);
		});

		test("Saving a file multiple times saves file and sets template into staged state", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult0 = await dataModel.saveEmailFile({ name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataModel.saveEmailFile({ name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataModel.saveEmailFile({ name: testFileName, content: 'new file content 2' });
			let savedEmail = await dataModel.getEmail({ });
			let savedEmailFile = await dataModel.getEmailFile({ name: testFileName });
			let revertResult = await dataModel.revertEmail({});

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == true
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmailFile.Content == 'new file content 2'

				&& savedEmail.Type == 'Template'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length + 1);
		});

		test("Reverting an email with a saved file reverts both", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let revertResult = await dataModel.revertEmail({ id: emailAId });
			let revertedEmail = await dataModel.getEmail({ id: emailAId });
			let revertedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& revertedEmailFile.Content === originalEmailFile.Content

				&& revertedEmail.Id == emailAId
				&& revertedEmail.State == 'FactoryDefault'

				&& revertedEmail.Files.length > 0);
		})

		test("Reverting a template with a saved file reverts both", async assert => {

			let originalEmail = await dataModel.getEmail({});
			let preSaveResult = await dataModel.saveEmailFile({ name: testFileName, content: 'content 0' });
			let prePublishResult = await dataModel.publishEmail({ });

			let originalEmailFile = await dataModel.getEmailFile({ name: testFileName });
			let saveResult = await dataModel.saveEmailFile({ name: testFileName, content: 'content 1' });
			let revertResult = await dataModel.revertEmail({ });
			let revertedEmail = await dataModel.getEmail({ });
			let revertedEmailFile = await dataModel.getEmailFile({ name: testFileName });

			let deleteEmail = await dataModel.deleteEmail({});
			let deletePublishEmail = await dataModel.publishEmail({});

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& revertedEmailFile.Content === originalEmailFile.Content

				&& revertedEmail.Type == 'Template'
				&& revertedEmail.State == 'CustomizedDefault'

				&& revertedEmail.Files.length > 0);
		})

		test("Publishing an email with saved file publishes both", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let saveResult = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let publishResult = await dataModel.publishEmail({ id: emailAId });

			let publishedEmail = await dataModel.getEmail({ id: emailAId });
			let publishedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataModel.deleteEmail({ id: emailAId });
			let deletePublishResult = await dataModel.publishEmail({ id: emailAId });

			let deletedEmail = await dataModel.getEmail({ id: emailAId });
			let deletedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& publishedEmailFile.Content == 'new content'

				&& publishedEmail.Id == emailAId
				&& publishedEmail.State == 'CustomizedDefault'
				&& publishedEmail.IsFactoryDefault == false
				&& publishedEmail.IsStaged == false

				&& publishedEmail.Files.length > 0
			);
		});

		test("Publishing a template with saved file publishes both", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let originalEmailFile = await dataModel.getEmailFile({ name: testFileName });

			let saveResult = await dataModel.saveEmailFile({ name: testFileName, content: 'new content' });
			let publishResult = await dataModel.publishEmail({ });

			let publishedEmail = await dataModel.getEmail({ });
			let publishedEmailFile = await dataModel.getEmailFile({ name: testFileName });

			let deleteResult = await dataModel.deleteEmail({ });
			let deletePublishResult = await dataModel.publishEmail({ });

			let deletedEmail = await dataModel.getEmail({ });
			let deletedEmailFile = await dataModel.getEmailFile({ name: testFileName });

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& publishedEmailFile.Content == 'new content'

				&& publishedEmail.Type == 'Template'
				&& publishedEmail.State == 'CustomizedDefault'
				&& publishedEmail.IsFactoryDefault == false
				&& publishedEmail.IsStaged == false

				&& publishedEmail.Files.length > 0
			);
		});

		test("Deleting a published customization of default email reverts email and edited file", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let saveResult = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let publishResult = await dataModel.publishEmail({ id: emailAId });

			let publishedEmail = await dataModel.getEmail({ id: emailAId });
			let publishedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataModel.deleteEmail({ id: emailAId });
			let deletePublishResult = await dataModel.publishEmail({ id: emailAId });

			let deletedEmail = await dataModel.getEmail({ id: emailAId });
			let deletedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& deletedEmailFile.Content === originalEmailFile.Content

				&& deletedEmail.Id == emailAId
				&& deletedEmail.State == 'FactoryDefault'

				&& deletedEmail.Files.length > 0
			);
		});

		test("Deleting a published customization of default template reverts email and edited file", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let originalEmailFile = await dataModel.getEmailFile({ name: testFileName });

			let saveResult = await dataModel.saveEmailFile({ name: testFileName, content: 'new content' });
			let publishResult = await dataModel.publishEmail({ });

			let publishedEmail = await dataModel.getEmail({ });
			let publishedEmailFile = await dataModel.getEmailFile({ name: testFileName });

			let deleteResult = await dataModel.deleteEmail({ });
			let deletePublishResult = await dataModel.publishEmail({ });

			let deletedEmail = await dataModel.getEmail({ });
			let deletedEmailFile = await dataModel.getEmailFile({ name: testFileName });

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& deletedEmailFile == null && deletedEmailFile == originalEmailFile

				&& deletedEmail.Type == 'Template'
				&& deletedEmail.State == 'FactoryDefault'

				&& deletedEmail.Files.length == 0
			);
		});

		test("Getting non-staged version of otherwise staged email file gets non-staged version", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let savedEmail = await dataModel.getEmail({ id: emailAId });
			let savedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let nonStagedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName, staged: false });
			let revertResult = await dataModel.revertEmail({ id: emailAId });

			assert(originalEmailFile.Content != 'new content'
				&& savedEmailFile.Content == 'new content'
				&& nonStagedEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Getting non-staged version of otherwise staged email file gets non-staged version", async assert => {
			let originalEmail = await dataModel.getEmail({});

			let setupEmailFile = await dataModel.saveEmailFile({ name: testFileName, content: 'content 0' });
			let setupEmailFilePublish = await dataModel.publishEmail({ });

			let originalEmailFile = await dataModel.getEmailFile({ name: testFileName });
			let saveResult = await dataModel.saveEmailFile({ name: testFileName, content: 'new content' });
			let savedEmail = await dataModel.getEmail({ });
			let savedEmailFile = await dataModel.getEmailFile({ name: testFileName });
			let nonStagedEmailFile = await dataModel.getEmailFile({ name: testFileName, staged: false });
			let revertResult = await dataModel.revertEmail({});

			let deleteResult = await dataModel.deleteEmail({ });
			let deletePublishResult = await dataModel.publishEmail({ });

			assert(originalEmailFile.Content != 'new content'
				&& savedEmailFile.Content == 'new content'
				&& nonStagedEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default email file gets fac default version", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let savedEmail = await dataModel.getEmail({ id: emailAId });
			let savedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let facDefaultEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName, factoryDefault: true });
			let revertResult = await dataModel.revertEmail({ id: emailAId });

			assert(originalEmailFile.Content != 'new content'
				&& savedEmailFile.Content == 'new content'
				&& facDefaultEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Restoring a deleted email file from non-staging restores it and its metadata", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataModel.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let restoreResult = await dataModel.restoreEmailFile({ id: emailAId, name: testFileName });
			let restoredEmail = await dataModel.getEmail({ id: emailAId });
			let restoredEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let revertResult = await dataModel.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmailFile == null

				&& restoreResult.stagedEmails.length == 1
				&& restoreResult.email.Files.length == originalEmail.Files.length
				&& restoreResult.email.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmailFile.Content == originalEmailFile.Content
				&& restoredEmail.Files.length == originalEmail.Files.length
				&& restoredEmail.Files.find(s => s.Name == testFileName) != null
				&& restoredEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Restoring a deleted template file from non-staging restores it and its metadata", async assert => {

			let setupEmailFile = await dataModel.saveEmailFile({ name: testFileName, content: 'content 0' });
			let setupEmailFilePublish = await dataModel.publishEmail({ });

			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataModel.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let restoreResult = await dataModel.restoreEmailFile({ id: emailAId, name: testFileName });
			let restoredEmail = await dataModel.getEmail({ id: emailAId });
			let restoredEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let revertResult = await dataModel.revertEmail({ id: emailAId });

			let resetResult = await dataModel.deleteEmail({ });
			let resetPublishResult = await dataModel.publishEmail({ });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmailFile == null

				&& restoreResult.stagedEmails.length == 1
				&& restoreResult.email.Files.length == originalEmail.Files.length
				&& restoreResult.email.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmailFile.Content == originalEmailFile.Content
				&& restoredEmail.Files.length == originalEmail.Files.length
				&& restoredEmail.Files.find(s => s.Name == testFileName) != null
				&& restoredEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Restoring a deleted file from fac default restores it and its metadata", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataModel.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let publishResult = await dataModel.publishEmail({ id: emailAId });

			let restoreResult = await dataModel.restoreEmailFile({ id: emailAId, name: testFileName });
			let restoredEmail = await dataModel.getEmail({ id: emailAId });
			let restoredEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult2 = await dataModel.deleteEmail({ id: emailAId });
			let deletePublishResult2 = await dataModel.publishEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmailFile == null

				&& restoreResult.stagedEmails.length == 1
				&& restoreResult.email.Files.length == originalEmail.Files.length
				&& restoreResult.email.Files.find(s => s.Name == testFileName) != null
				&& restoreResult.savedEmailFile.Content == originalEmailFile.Content
				&& restoredEmail.Files.length == originalEmail.Files.length
				&& restoredEmail.Files.find(s => s.Name == testFileName) != null
				&& restoredEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Deleting a file from a default email sets email to staged with removed file", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let deleteResult = await dataModel.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmail = await dataModel.getEmail({ id: emailAId });
			let deletedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataModel.revertEmail({ id: emailAId });
			let revertedEmail = await dataModel.getEmail({ id: emailAId });
			let revertedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmail.Files.length == originalEmail.Files.length - 1
				&& deletedEmail.Files.find(s => s.Name == testFileName) == null
				&& deletedEmail.State == 'CustomizedDefault'
				&& deletedEmail.IsFactoryDefault == false
				&& deletedEmail.IsStaged == true

				&& deletedEmailFile == null
			);
		});

		test("Reverting file deletion from staged email sets email back to factory default", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let deleteResult = await dataModel.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmail = await dataModel.getEmail({ id: emailAId });
			let deletedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataModel.revertEmail({ id: emailAId });
			let revertedEmail = await dataModel.getEmail({ id: emailAId });
			let revertedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmail.Files.length == originalEmail.Files.length - 1
				&& deletedEmail.Files.find(s => s.Name == testFileName) == null
				&& deletedEmail.State == 'CustomizedDefault'
				&& deletedEmail.IsFactoryDefault == false
				&& deletedEmail.IsStaged == true

				&& deletedEmailFile == null

				&& revertResult.stagedEmails.length == 0
				&& revertResult.revertedEmail.IsStaged == false
				&& revertResult.revertedEmail.Files.length == originalEmail.Files.length
				&& revertResult.revertedEmail.Files.find(s => s.Name == testFileName) != null

				&& revertedEmail.IsStaged == false
				&& revertedEmail.Files.length == originalEmail.Files.length
				&& revertedEmail.Files.find(s => s.Name == testFileName) != null

				&& revertedEmailFile !== null
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let originalEmailFile = await dataModel.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataModel.saveEmailFile({ id: emailAId, name: testFileName, newName: 'newname.jsm' });
			let savedEmail = await dataModel.getEmail({ id: emailAId });
			let savedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: 'newname.jsm' });
			let revertResult = await dataModel.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalEmail.Files.filter(s => s.Name == testFileName).length == 1

				&& originalEmail.Files.length == savedEmail.Files.length

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedEmail.Files.filter(s => s.Name == testFileName).length == 0

				&& savedEmailFile.Name == 'newname.jsm'
				&& originalEmailFile.Content == savedEmailFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Renaming a template file renames file even without new content", async assert => {
			let setupEmailFile = await dataModel.saveEmailFile({ name: testFileName, content: 'content 0' });
			let setupEmailFilePublish = await dataModel.publishEmail({ });

			let originalEmail = await dataModel.getEmail({ });
			let originalEmailFile = await dataModel.getEmailFile({ name: testFileName });
			let saveResult = await dataModel.saveEmailFile({ name: testFileName, newName: 'newname.jsm' });
			let savedEmail = await dataModel.getEmail({ });
			let savedEmailFile = await dataModel.getEmailFile({ name: 'newname.jsm' });
			let revertResult = await dataModel.revertEmail({});

			let resetResult = await dataModel.deleteEmail({ });
			let resetPublishResult = await dataModel.publishEmail({ });


			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'CustomizedDefault'
				&& originalEmail.IsFactoryDefault == false
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.filter(s => s.Name == 'newname.jsm').length == 0
				&& originalEmail.Files.filter(s => s.Name == testFileName).length == 1

				&& originalEmail.Files.length == savedEmail.Files.length

				&& savedEmail.Type == 'Template'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.filter(s => s.Name == 'newname.jsm').length == 1
				&& savedEmail.Files.filter(s => s.Name == testFileName).length == 0

				&& savedEmailFile.Name == 'newname.jsm'
				&& originalEmailFile.Content == savedEmailFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new file creates a non-saved email file stub with pre-defined name and metadata", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.createEmailFile({ id: emailAId });

			assert(saveResult
				&& saveResult.Id == emailAId
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.EmailName == originalEmail.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalEmail.Files.length
			);
		});

		test("Creating a new file creates a non-saved template file stub with pre-defined name and metadata", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult = await dataModel.createEmailFile({});

			assert(saveResult
				&& saveResult.Type == 'Template'
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.EmailName == originalEmail.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalEmail.Files.length
			);
		});

		test("Saving a new file saves file and sets email into staged state", async assert => {
			let originalEmail = await dataModel.getEmail({ id: emailAId });
			let saveResult = await dataModel.saveEmailFile({ id: emailAId, name: 'newfile.jsm', content: 'content' });
			let savedEmail = await dataModel.getEmail({ id: emailAId });
			let savedEmailFile = await dataModel.getEmailFile({ id: emailAId, name: 'newfile.jsm' });
			let revertResult = await dataModel.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& savedEmailFile.Content == 'content'

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.length == originalEmail.Files.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Saving a new file saves file and sets template into staged state", async assert => {
			let originalEmail = await dataModel.getEmail({ });
			let saveResult = await dataModel.saveEmailFile({ name: 'newfile.jsm', content: 'content' });
			let savedEmail = await dataModel.getEmail({ });
			let savedEmailFile = await dataModel.getEmailFile({ name: 'newfile.jsm' });
			let revertResult = await dataModel.revertEmail({ });

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& savedEmailFile.Content == 'content'

				&& savedEmail.Type == 'Template'
				&& savedEmail.State == 'CustomizedDefault'
				&& savedEmail.IsFactoryDefault == false
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.length == originalEmail.Files.length + 1

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

		// resets customized default and new custom emails, returns promise
		function testWithReset(name, fn) {
			if(!fn) {
				test(name);
			} else {
				test(name, async assert=> {
					// clear test subscriptions
					messaging.unsubscribe(testMessageNameSpace);

					// reset test targets
					await dataProvider.deleteEmail({ id: emailAId });
					await dataProvider.publishEmail({ id: emailAId });

					await dataProvider.deleteEmail({ id: testNewId });
					await dataProvider.publishEmail({ id: testNewId });

					await dataProvider.deleteEmail({  });
					await dataProvider.publishEmail({  });

					// run test
					await fn(assert);
				});
			}
		}

		testWithReset("Saving an update to an email should raise email.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmail({
				id: emailAId,
				subjectScript: 'new subjectScript'
			});

			assert(
				subData1 !== null
				&& subData1.id.id == emailAId
				&& subData1.model.SubjectScript == 'new subjectScript'
			);
		});

		testWithReset("Saving an update to a template should raise email.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmail({
				templateScript: 'new templateScript'
			});

			assert(
				subData1 !== null
				&& !subData1.id.id
				&& subData1.model.TemplateScript == 'new templateScript'
			);
		});

		testWithReset("Deleting a customized default email should revert to fac and raise email.updated instead of delete", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmail({
				id: emailAId,
				subjectScript: 'new-subj'
			});

			let deleteResult = await dataModel.deleteEmail({
				id: emailAId
			})
			let deletePublishResult = await dataModel.publishEmail({
				id: emailAId
			});

			assert(
				subData1 !== null
				&& subData1.id.id == emailAId
				&& subData1.model !== null
				&& subData1.model.SubjectScript === defaultEmailASubjectScript
			);
		});

		testWithReset("Deleting a customized default template should revert to fac and raise email.updated instead of delete", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmail({
				templateScript: 'x'
			});

			let deleteResult = await dataModel.deleteEmail({
			})
			let deletePublishResult = await dataModel.publishEmail({
			});

			assert(
				subData1 !== null
				&& !subData1.id.id
				&& subData1.model !== null
				&& subData1.model.TemplateScript != 'x'
			);
		});

		testWithReset("Publishing an email should raise email.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmail({
				id: emailAId,
				subjectScript: 'new-subj'
			});

			let publishResult = await dataModel.publishEmail({
				id: emailAId
			})

			assert(
				subData1 !== null
				&& subData1.id.id == emailAId
				&& subData1.model.SubjectScript == 'new-subj'
				&& subData1.model.IsStaged === false
				&& subData1.model.State === 'CustomizedDefault'
			);
		});

		testWithReset("Publishing a template should raise email.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmail({
				templateScript: 'new-template'
			});

			let publishResult = await dataModel.publishEmail({
			})

			assert(
				subData1 !== null
				&& !subData1.id.id
				&& subData1.model.TemplateScript == 'new-template'
				&& subData1.model.IsStaged === false
				&& subData1.model.State === 'CustomizedDefault'
			);
		});

		testWithReset("Reverting a staged customized default email should raise email.updated with default model", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmail({
				id: emailAId,
				subjectScript: 'new-subj'
			});

			let revertResult = await dataModel.revertEmail({
				id: emailAId
			});

			assert(
				subData1
				&& subData1.id.id == emailAId
				&& subData1.model !== null
				&& subData1.model.Id == emailAId
				&& subData1.model.SubjectScript == defaultEmailASubjectScript
			)
		});

		testWithReset("Reverting a staged customized default template should raise email.updated with default model", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmail({
				templateScript: 'x'
			});

			let revertResult = await dataModel.revertEmail({
			});

			assert(
				subData1
				&& !subData1.id.id
				&& subData1.model !== null
				&& subData1.model.TemplateScript != 'x'
			)
		});

		testWithReset("Saving an email file should raise email.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmailFile({
				id: emailAId,
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.id == emailAId
				&& subData1.model !== null
				&& subData1.model.Files.filter(f => f.Name == 'attachment1.vm').length == 1
			);
		});

		testWithReset("Saving a template file should raise email.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmailFile({
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& !subData1.id.id
				&& subData1.model !== null
				&& subData1.model.Files.filter(f => f.Name == 'attachment1.vm').length == 1
			);
		});

		testWithReset("Deleting an email file should raise email.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteEmailFile({
				id: emailAId,
				name: testFileName,
			});

			assert(
				subData1
				&& subData1.id.id == emailAId
				&& subData1.model !== null
				&& subData1.model.Files.filter(f => f.Name == testFileName).length == 0
			)
		});

		testWithReset("Saving a new email file should raise file.created", async assert => {
			let subData1;
			messaging.subscribe('me.model.file.created', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmailFile({
				id: emailAId,
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& subData1.id.id == emailAId
				&& subData1.id.name == 'attachment1.vm'
				&& subData1.model !== null
				&& subData1.model.Id == emailAId
				&& subData1.model.Name == 'attachment1.vm'
				&& subData1.model.Content == 'attachment1 content'
			);
		});

		testWithReset("Saving a new template file should raise file.created", async assert => {
			let subData1;
			messaging.subscribe('me.model.file.created', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmailFile({
				name: 'attachment1.vm',
				content: 'attachment1 content'
			});

			assert(
				subData1
				&& !subData1.id.id
				&& subData1.id.name == 'attachment1.vm'
				&& subData1.model !== null
				&& subData1.model.Name == 'attachment1.vm'
				&& subData1.model.Content == 'attachment1 content'
			);
		});

		testWithReset("Saving an updated email file should raise file.updated", async assert => {
			let subData1;
			messaging.subscribe('me.model.file.updated', testMessageNameSpace, data => subData1 = data);

			window._dataModel = dataModel;

			let saveResult = await dataModel.saveEmailFile({
				id: emailAId,
				name: testFileName,
				content: 'new content'
			});

			assert(
				subData1
				&& subData1.id.id == emailAId
				&& subData1.id.name == testFileName
				&& subData1.model !== null
				&& subData1.model.Id == emailAId
				&& subData1.model.Name == testFileName
				&& subData1.model.Content == 'new content'
			);
		});

		testWithReset("Saving a renamed email file should raise file.updated with original name in id, new name in model", async assert => {
			let subData1;
			messaging.subscribe('me.model.file.updated', testMessageNameSpace, data => subData1 = data);

			let saveResult = await dataModel.saveEmailFile({
				id: emailAId,
				name: testFileName,
				newName: 'renamed.jsm',
				content: 'new content'
			});

			assert(
				subData1
				&& subData1.id.id == emailAId
				&& subData1.id.name == testFileName
				&& subData1.model !== null
				&& subData1.model.Id == emailAId
				&& subData1.model.Name == 'renamed.jsm'
				&& subData1.model.Content == 'new content'
			);
		});

		testWithReset("Deleting an email file should raise file.deleted with no model", async assert => {
			let subData1;
			messaging.subscribe('me.model.file.deleted', testMessageNameSpace, data => subData1 = data);

			let deleteResult = await dataModel.deleteEmailFile({
				id: emailAId,
				name: testFileName,
			});

			assert(
				subData1
				&& subData1.id.id == emailAId
				&& subData1.id.name == testFileName
				&& subData1.model === null
			);
		});

		testWithReset("Delete multiple should raise combination of updated and deleted depending on type of delete", async assert => {
			let log = [];

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ id: emailBId, subjectScript: 'y' });

			messaging.subscribe('me.model.emails.changed', testMessageNameSpace, data => log.push({ name: 'changed', data: data }));
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => log.push({ name: 'updated', data: data }));
			messaging.subscribe('me.model.email.deleted', testMessageNameSpace, data => log.push({ name: 'deleted', data: data }));

			let deleteResult = await dataModel.deleteEmails({ emails: [
				{ id: emailAId },
				{ id: emailBId }
			]});
			let deletePublishResult = await dataModel.publishEmails({ emails: [
				{ id: emailAId },
				{ id: emailBId }
			]});

			assert(log
				&& log.length == 4
				&& log[0].name == 'changed'
				&& log[1].name == 'updated'
				&& log[1].data.id.id == emailAId
				&& log[2].name == 'updated'
				&& log[2].data.id.id == emailBId
			);
		});

		testWithReset("Delete multiple of different types should raise combination of updated and deleted depending on type of delete", async assert => {
			let log = [];

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ templteScript: 'y' });

			messaging.subscribe('me.model.emails.changed', testMessageNameSpace, data => log.push({ name: 'changed', data: data }));
			messaging.subscribe('me.model.email.updated', testMessageNameSpace, data => log.push({ name: 'updated', data: data }));
			messaging.subscribe('me.model.email.deleted', testMessageNameSpace, data => log.push({ name: 'deleted', data: data }));

			let deleteResult = await dataModel.deleteEmails({ emails: [
				{ id: emailAId },
				{  }
			]});
			let deletePublishResult = await dataModel.publishEmails({ emails: [
				{ id: emailAId },
				{ }
			]});

			assert(log
				&& log.length == 4
				&& log[0].name == 'changed'
				&& log[1].name == 'updated'
				&& log[1].data.id.id == emailAId
				&& log[2].name == 'updated'
				&& !log[2].data.id.id
			);
		});

		testWithReset("Publish multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('me.model.emails.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ id: emailBId, subjectScript: 'y' });
			let saveResult2 = await dataModel.saveEmail({ id: emailCId, subjectScript: 'z' });

			let publishResult = await dataModel.publishEmails({ emails: [
				{ id: emailAId },
				{ id: emailBId },
				{ id: emailCId },
			]});

			let deleteResult0 = await dataModel.deleteEmail({ id: emailAId });
			let deletePublishResult0 = await dataModel.publishEmail({ id: emailAId });
			let deleteResult1 = await dataModel.deleteEmail({ id: emailBId });
			let deletePublishResult1 = await dataModel.publishEmail({ id: emailBId });
			let deleteResult2 = await dataModel.deleteEmail({ id: emailCId });
			let deletePublishResult2 = await dataModel.publishEmail({  id: emailCId });

			assert(log && log.length == 1);
		});

		testWithReset("Publish multiple of different types should raise events", async assert => {
			let log = [];
			messaging.subscribe('me.model.emails.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ id: emailBId, subjectScript: 'y' });
			let saveResult2 = await dataModel.saveEmail({ templateScript: 'z' });

			let publishResult = await dataModel.publishEmails({ emails: [
				{ id: emailAId },
				{ id: emailBId },
				{ }
			]});

			let deleteResult0 = await dataModel.deleteEmail({ id: emailAId });
			let deletePublishResult0 = await dataModel.publishEmail({ id: emailAId });
			let deleteResult1 = await dataModel.deleteEmail({ id: emailBId });
			let deletePublishResult1 = await dataModel.publishEmail({ id: emailBId });
			let deleteResult2 = await dataModel.deleteEmail({ });
			let deletePublishResult2 = await dataModel.publishEmail({  });

			assert(log && log.length == 1);
		});

		testWithReset("Revert multiple should raise events", async assert => {
			let log = [];
			messaging.subscribe('me.model.emails.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ id: emailBId, subjectScript: 'y' });
			let saveResult2 = await dataModel.saveEmail({ id: emailCId, subjectScript: 'z' });

			let publishResult = await dataModel.revertEmails({ emails: [
				{ id: emailAId },
				{ id: emailBId },
				{ id: emailCId },
			]});

			assert(log && log.length == 1);
		});

		testWithReset("Revert multiple with different types should raise events", async assert => {
			let log = [];
			messaging.subscribe('me.model.emails.changed', testMessageNameSpace, data => log.push(data));

			let saveResult0 = await dataModel.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataModel.saveEmail({ id: emailBId, subjectScript: 'y' });
			let saveResult2 = await dataModel.saveEmail({ templateScript: 'z' });

			let publishResult = await dataModel.revertEmails({ emails: [
				{ id: emailAId },
				{ id: emailBId },
				{ },
			]});

			assert(log && log.length == 1);
		});

		testWithReset("Reset Test Data", assert => assert(true));
	}

	function runDevModeDataProviderTests(dataProvider) {
		test.heading('Dev Mode Data Provider Tests');

		test("Listing emails should list all emails", async assert => {
			let emails = (await dataProvider.listEmails()).emails;
			assert(emails.length === defaultEmailComponentsLength);
		});

		test("Listing emails should include both emails and template", async assert => {
			let emails = (await dataProvider.listEmails()).emails;
			assert(emails.length === defaultEmailComponentsLength
				&& emails[0].Type == 'Template'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].Type == 'Email'
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false

				&& emails[2].Type == 'Email'
				&& emails[2].State == 'FactoryDefault'
				&& emails[2].IsFactoryDefault == true
				&& emails[2].IsStaged == false

				&& emails[3].Type == 'Email'
				&& emails[3].State == 'FactoryDefault'
				&& emails[3].IsFactoryDefault == true
				&& emails[3].IsStaged == false
			);
		});

		test("Listing only emails should include only emails", async assert => {
			let emails = (await dataProvider.listEmails({ includeEmails: true, includeTemplate: false })).emails;
			assert(emails.length === defaultEmailsLength
				&& emails[0].Type == 'Email'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].Type == 'Email'
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false

				&& emails[2].Type == 'Email'
				&& emails[2].State == 'FactoryDefault'
				&& emails[2].IsFactoryDefault == true
				&& emails[2].IsStaged == false
			);
		});

		test("Listing only template should include only template", async assert => {
			let emails = (await dataProvider.listEmails({ includeEmails: false, includeTemplate: true })).emails;
			assert(emails.length === defaultTemplateLength
				&& emails[0].Type == 'Template'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false
			);
		});

		test("Listing emails by staged: true should only return staged emails", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataProvider.listEmails({ staged: true })).emails;
			await dataProvider.revertEmail({ id: emailAId })
			assert(emails.length == 1
				&& emails[0].SubjectScript == 'x'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == true);
		});

		test("Listing template by staged: true should only return staged templates", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let emails = (await dataProvider.listEmails({ staged: true })).emails;
			await dataProvider.revertEmail({ })
			assert(emails.length == 1
				&& emails[0].TemplateScript == 'x'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == true);
		});

		test("Listing both by staged: true should only return staged emails and templates", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })

			let emails = (await dataProvider.listEmails({ staged: true })).emails;

			await dataProvider.revertEmail({})
			await dataProvider.revertEmail({ id: emailAId })

			assert(emails.length == 2
				&& emails[0].Type == 'Template'
				&& emails[0].TemplateScript == 'x'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == true

				&& emails[1].Type == 'Email'
				&& emails[1].SubjectScript == 'x'
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == true
			);
		});

		test("Listing emails by staged: true should only return staged emails", async assert => {
			let saveResponse = (await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' }));
			let emails = (await dataProvider.listEmails({ staged: true })).emails;
			let revertResponse = (await dataProvider.revertEmail({ id: emailAId }));
			assert(emails.length == 1
				&& emails[0].SubjectScript == 'x'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == true);
		});

		test("Listing templates by staged: true should only return staged templates", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let emails = (await dataProvider.listEmails({ staged: true })).emails;
			await dataProvider.revertEmail({ })
			assert(emails.length == 1
				&& emails[0].TemplateScript == 'x'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == true);
		});

		test("Listing emails by staged: false should return non-staged emails as well as the published version of currently-staged emails", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataProvider.listEmails({ staged: false, includeEmails: true, includeTemplate: false })).emails;
			await dataProvider.revertEmail({ id: emailAId })
			assert(emails.length == defaultEmailsLength

				&& emails[0].SubjectScript != 'x'
				&& emails[0].State == 'FactoryDefault'
				&& emails[0].IsFactoryDefault == true
				&& emails[0].IsStaged == false

				&& emails[1].SubjectScript != 'x'
				&& emails[1].State == 'FactoryDefault'
				&& emails[1].IsFactoryDefault == true
				&& emails[1].IsStaged == false);
		});

		test("Listing emails by state: 'FactoryDefault' should only return emails which are currently in a Factory Default State", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataProvider.listEmails({ state: 'FactoryDefault', includeTemplate: false })).emails;
			await dataProvider.revertEmail({ id: emailAId })
			assert(emails.length == defaultEmailsLength
				&& emails[0].State == 'FactoryDefault');
		});

		test("Listing emails by state: 'CustomizedDefault' should return only emails which are currently in a CustomizedDefault State", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let emails = (await dataProvider.listEmails({ state: 'CustomizedDefault' })).emails;
			await dataProvider.revertEmail({ id: emailAId })
			assert(emails.length == 0);
		});

		test("Getting an email returns email", async assert => {
			let email = await dataProvider.getEmail({ id: emailAId });
			assert(email.Id == emailAId);
		});

		test("Getting a template returns template", async assert => {
			let email = await dataProvider.getEmail({ });
			assert(email.Type == 'Template');
		});

		test("Getting an email returns latest version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId });
			assert(email.Id == emailAId
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == true);
		});

		test("Getting a template returns latest version of template", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let email = await dataProvider.getEmail({});
			await dataProvider.revertEmail({  });
			assert(email.Type == 'Template'
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == true);
		});

		test("Getting an email with staged: false should return non-staged version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId, staged: false });
			await dataProvider.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript != 'x'
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting a template with staged: false should return non-staged version of template", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let email = await dataProvider.getEmail({ staged: false });
			await dataProvider.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript != 'x'
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting an email with staged: true should return staged version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId, staged: true });
			await dataProvider.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == 'x'
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == true);
		});

		test("Getting a template with staged: true should return staged version of template", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let email = await dataProvider.getEmail({ staged: true });
			await dataProvider.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript == 'x'
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == true);
		});

		test("Getting an email with factoryDefault: true should return factory default version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId, factoryDefault: true });
			await dataProvider.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript != 'x'
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting a template with factoryDefault: true should return factory default version of template", async assert => {
			await dataProvider.saveEmail({ templateScriptsubjectScript: 'x' })
			let email = await dataProvider.getEmail({ factoryDefault: true });
			await dataProvider.revertEmail({ })
			assert(email.Type == 'Template'
				&& email.TemplateScript != 'x'
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == false);
		});

		test("Getting an email with factoryDefault: false should return non-factory default version of email", async assert => {
			await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' })
			let email = await dataProvider.getEmail({ id: emailAId, factoryDefault: false });
			await dataProvider.revertEmail({ id: emailAId })
			assert(email.Id == emailAId
				&& email.SubjectScript == 'x'
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == true);
		});

		test("Getting a template with factoryDefault: false should return non-factory default version of template", async assert => {
			await dataProvider.saveEmail({ templateScript: 'x' })
			let email = await dataProvider.getEmail({ factoryDefault: false });
			await dataProvider.revertEmail({  })
			assert(email.Type == 'Template'
				&& email.TemplateScript == 'x'
				&& email.State == 'FactoryDefault'
				&& email.IsFactoryDefault == true
				&& email.IsStaged == true);
		});

		test("Saving a default email saves and sets it into a staged, factory default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			await dataProvider.revertEmail({ id: emailAId })
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmail.Id == emailAId
				&& savedEmail.SubjectScript == 'x'
				&& savedEmail.State == 'FactoryDefault'
				&& savedEmail.IsFactoryDefault == true
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length > 0

				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default template saves and sets it into a staged, factory default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmail({ templateScript: 'x' });
			let savedEmail = await dataProvider.getEmail({ });
			await dataProvider.revertEmail({ })
			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmail.Type == 'Template'
				&& savedEmail.TemplateScript == 'x'
				&& savedEmail.State == 'FactoryDefault'
				&& savedEmail.IsFactoryDefault == true
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default email multiple times saves and sets it into a staged, factory default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult0 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let saveResult1 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'y' });
			let saveResult2 = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'z' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			await dataProvider.revertEmail({ id: emailAId })
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmail.Id == emailAId
				&& savedEmail.SubjectScript == 'z'
				&& savedEmail.State == 'FactoryDefault'
				&& savedEmail.IsFactoryDefault == true
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length > 0

				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default template multiple times saves and sets it into a staged, factory default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult0 = await dataProvider.saveEmail({ templateScript: 'x' });
			let saveResult1 = await dataProvider.saveEmail({ templateScript: 'y' });
			let saveResult2 = await dataProvider.saveEmail({ templateScript: 'z' });
			let savedEmail = await dataProvider.getEmail({ });
			await dataProvider.revertEmail({ })
			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmail.Type == 'Template'
				&& savedEmail.TemplateScript == 'z'
				&& savedEmail.State == 'FactoryDefault'
				&& savedEmail.IsFactoryDefault == true
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length);
		});

		test("Saving a default email saves and returns saved email and list of staged", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			await dataProvider.revertEmail({ id: emailAId })
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedEmail.Id == emailAId
				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'FactoryDefault'
				&& saveResult.savedEmail.IsFactoryDefault == true
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length > 0

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& saveResult.stagedEmails.length == 1

				&& saveResult.stagedEmails[0].Id == emailAId
				&& saveResult.stagedEmails[0].SubjectScript == 'x'
				&& saveResult.stagedEmails[0].State == 'FactoryDefault'
				&& saveResult.stagedEmails[0].IsFactoryDefault == true
				&& saveResult.stagedEmails[0].IsStaged == true
				);
		});

		test("Saving a template saves and returns saved template and list of staged", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmail({ templateScript: 'x' });
			await dataProvider.revertEmail({ })
			assert(originalEmail.Type == 'Template'
				&& originalEmail.TemplateScript != 'x'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& saveResult.savedEmail.Type == 'Template'
				&& saveResult.savedEmail.TemplateScript == 'x'
				&& saveResult.savedEmail.State == 'FactoryDefault'
				&& saveResult.savedEmail.IsFactoryDefault == true
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& saveResult.stagedEmails.length == 1

				&& saveResult.stagedEmails[0].Type == 'Template'
				&& saveResult.stagedEmails[0].TemplateScript == 'x'
				&& saveResult.stagedEmails[0].State == 'FactoryDefault'
				&& saveResult.stagedEmails[0].IsFactoryDefault == true
				&& saveResult.stagedEmails[0].IsStaged == true
				);
		});

		test("Reverting a saved, staged, fac default email reverts and sets it into a non-staged, fac default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });
			let revertedEmail = await dataProvider.getEmail({ id: emailAId });
			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.savedEmail.Id == emailAId
				&& saveResult.savedEmail.SubjectScript == 'x'
				&& saveResult.savedEmail.State == 'FactoryDefault'
				&& saveResult.savedEmail.IsFactoryDefault == true
				&& saveResult.savedEmail.IsStaged == true

				&& saveResult.savedEmail.Files.length > 0

				&& saveResult.savedEmail.Files.length == originalEmail.Files.length

				&& revertResult.revertedEmail.Id == emailAId
				&& revertResult.revertedEmail.SubjectScript == defaultEmailASubjectScript
				&& revertResult.revertedEmail.State == 'FactoryDefault'
				&& revertResult.revertedEmail.IsFactoryDefault == true
				&& revertResult.revertedEmail.IsStaged == false

				&& revertResult.revertedEmail.Files.length > 0

				&& revertResult.revertedEmail.Files.length == originalEmail.Files.length

				&& revertedEmail.Id == emailAId
				&& revertedEmail.SubjectScript == defaultEmailASubjectScript
				&& revertedEmail.State == 'FactoryDefault'
				&& revertedEmail.IsFactoryDefault == true
				&& revertedEmail.IsStaged == false

				&& revertedEmail.Files.length > 0

				&& revertedEmail.Files.length == originalEmail.Files.length
				);
		});

		test("Publishing a saved change to a default email saves and sets it into a published, default, state and saves files too", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: 'x' });
			let publishResult = await dataProvider.publishEmail({ id: emailAId });
			let publishedEmail = await dataProvider.getEmail({ id: emailAId });

			let reverseSaveResult = await dataProvider.saveEmail({ id: emailAId, subjectScript: defaultEmailASubjectScript });
			let reversePublishResult = await dataProvider.publishEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& publishedEmail.Id == emailAId
				&& publishedEmail.SubjectScript == 'x'
				&& publishedEmail.State == 'FactoryDefault'
				&& publishedEmail.IsFactoryDefault == true
				&& publishedEmail.IsStaged == false

				&& publishedEmail.Files.length > 0

				&& publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.publishedEmail.Id == emailAId
				&& publishResult.publishedEmail.SubjectScript == 'x'
				&& publishResult.publishedEmail.State == 'FactoryDefault'
				&& publishResult.publishedEmail.IsFactoryDefault == true
				&& publishResult.publishedEmail.IsStaged == false

				&& publishResult.publishedEmail.Files.length > 0

				&& publishResult.publishedEmail.Files.length == originalEmail.Files.length

				&& publishResult.stagedEmails.length == 0
				);
		});

		test("Getting an email file gets file", async assert => {
			let file = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			assert(file.Name == testFileName);
		});

		test("Saving a file saves file and sets email into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult.isNew == false

				&& savedEmailFile.Content == 'new file content'

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'FactoryDefault'
				&& savedEmail.IsFactoryDefault == true
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length

				&& savedEmail.Files.length > 0);
		});

		test("Saving a file multiple times saves file and sets email into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult0 = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content 0' });
			let saveResult1 = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content 1' });
			let saveResult2 = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new file content 2' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& saveResult0.isNew == false
				&& saveResult1.isNew == false
				&& saveResult2.isNew == false

				&& savedEmailFile.Content == 'new file content 2'

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'FactoryDefault'
				&& savedEmail.IsFactoryDefault == true
				&& savedEmail.IsStaged == true

				&& savedEmail.Files.length == originalEmail.Files.length

				&& savedEmail.Files.length > 0);
		});

		test("Reverting an email with a saved file reverts both", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });
			let revertedEmail = await dataProvider.getEmail({ id: emailAId });
			let revertedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& revertedEmailFile.Content === originalEmailFile.Content

				&& revertedEmail.Id == emailAId
				&& revertedEmail.State == 'FactoryDefault'

				&& revertedEmail.Files.length > 0);
		})

		test("Getting non-staged version of otherwise staged email file gets non-staged version", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let nonStagedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName, staged: false });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmailFile.Content != 'new content'
				&& savedEmailFile.Content == 'new content'
				&& nonStagedEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Getting fac default version version of otherwise non-factory default email file gets fac default version", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, content: 'new content' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let facDefaultEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName, factoryDefault: true });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmailFile.Content != 'new content'
				&& savedEmailFile.Content == 'new content'
				&& facDefaultEmailFile.Content == originalEmailFile.Content
			);
		});

		test("Deleting a file from a default email sets email to staged with removed file", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let deleteResult = await dataProvider.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmail = await dataProvider.getEmail({ id: emailAId });
			let deletedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });
			let revertedEmail = await dataProvider.getEmail({ id: emailAId });
			let revertedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmail.Files.length == originalEmail.Files.length - 1
				&& deletedEmail.Files.find(s => s.Name == testFileName) == null
				&& deletedEmail.State == 'FactoryDefault'
				&& deletedEmail.IsFactoryDefault == true
				&& deletedEmail.IsStaged == true

				&& deletedEmailFile == null
			);
		});

		test("Reverting file deletion from staged email sets email back to factory default", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let deleteResult = await dataProvider.deleteEmailFile({ id: emailAId, name: testFileName });
			let deletedEmail = await dataProvider.getEmail({ id: emailAId });
			let deletedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			let revertResult = await dataProvider.revertEmail({ id: emailAId });
			let revertedEmail = await dataProvider.getEmail({ id: emailAId });
			let revertedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.length > 0

				&& originalEmail.Files.find(s => s.Name == testFileName) !== null

				&& originalEmailFile.Name == testFileName

				&& deleteResult.stagedEmails.length == 1
				&& deleteResult.email.Files.length == originalEmail.Files.length - 1
				&& deleteResult.email.Files.find(s => s.Name == testFileName) == null

				&& deletedEmail.Files.length == originalEmail.Files.length - 1
				&& deletedEmail.Files.find(s => s.Name == testFileName) == null
				&& deletedEmail.State == 'FactoryDefault'
				&& deletedEmail.IsFactoryDefault == true
				&& deletedEmail.IsStaged == true

				&& deletedEmailFile == null

				&& revertResult.stagedEmails.length == 0
				&& revertResult.revertedEmail.IsStaged == false
				&& revertResult.revertedEmail.Files.length == originalEmail.Files.length
				&& revertResult.revertedEmail.Files.find(s => s.Name == testFileName) != null

				&& revertedEmail.IsStaged == false
				&& revertedEmail.Files.length == originalEmail.Files.length
				&& revertedEmail.Files.find(s => s.Name == testFileName) != null

				&& revertedEmailFile !== null
			);
		});

		test("Renaming a file renames file even without new content", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let originalEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: testFileName });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: testFileName, newName: 'renamed.jsm' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: 'renamed.jsm' });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false
				&& originalEmail.Files.filter(s => s.Name == 'renamed.jsm').length == 0
				&& originalEmail.Files.filter(s => s.Name == testFileName).length == 1

				&& originalEmail.Files.length == savedEmail.Files.length

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'FactoryDefault'
				&& savedEmail.IsFactoryDefault == true
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.filter(s => s.Name == 'renamed.jsm').length == 1
				&& savedEmail.Files.filter(s => s.Name == testFileName).length == 0

				&& savedEmailFile.Name == 'renamed.jsm'
				&& originalEmailFile.Content == savedEmailFile.Content

				&& saveResult.isNew == false
			);
		});

		test("Creating a new file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.createEmailFile({ id: emailAId });

			assert(saveResult
				&& saveResult.Id == emailAId
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.EmailName == originalEmail.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalEmail.Files.length
			);
		});

		test("Creating a new template file creates a non-saved stub with pre-defined name and metadata", async assert => {
			let originalEmail = await dataProvider.getEmail({  });
			let saveResult = await dataProvider.createEmailFile({  });

			assert(saveResult
				&& !saveResult.Id
				&& saveResult.Name == 'untitled.vm'
				&& saveResult.EmailName == originalEmail.Name
				&& saveResult.State == 'FactoryDefault'
				&& saveResult.IsStaged == false
				&& saveResult.Files.length == originalEmail.Files.length
			);
		});

		test("Saving a new file saves file and sets email into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ id: emailAId });
			let saveResult = await dataProvider.saveEmailFile({ id: emailAId, name: 'newfile.jsm', content: 'content' });
			let savedEmail = await dataProvider.getEmail({ id: emailAId });
			let savedEmailFile = await dataProvider.getEmailFile({ id: emailAId, name: 'newfile.jsm' });
			let revertResult = await dataProvider.revertEmail({ id: emailAId });

			assert(originalEmail.Id == emailAId
				&& originalEmail.SubjectScript == defaultEmailASubjectScript
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& savedEmailFile.Content == 'content'

				&& savedEmail.Id == emailAId
				&& savedEmail.State == 'FactoryDefault'
				&& savedEmail.IsFactoryDefault == true
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.length == originalEmail.Files.length + 1

				&& saveResult.isNew == true
			);
		});

		test("Saving a new file saves file and sets template into staged state", async assert => {
			let originalEmail = await dataProvider.getEmail({ });
			let saveResult = await dataProvider.saveEmailFile({ name: 'newfile.jsm', content: 'content' });
			let savedEmail = await dataProvider.getEmail({ });
			let savedEmailFile = await dataProvider.getEmailFile({ name: 'newfile.jsm' });
			let revertResult = await dataProvider.revertEmail({ });

			assert(originalEmail.Type == 'Template'
				&& originalEmail.State == 'FactoryDefault'
				&& originalEmail.IsFactoryDefault == true
				&& originalEmail.IsStaged == false

				&& savedEmailFile.Content == 'content'

				&& savedEmail.Type == 'Template'
				&& savedEmail.State == 'FactoryDefault'
				&& savedEmail.IsFactoryDefault == true
				&& savedEmail.IsStaged == true
				&& savedEmail.Files.length == originalEmail.Files.length + 1

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
