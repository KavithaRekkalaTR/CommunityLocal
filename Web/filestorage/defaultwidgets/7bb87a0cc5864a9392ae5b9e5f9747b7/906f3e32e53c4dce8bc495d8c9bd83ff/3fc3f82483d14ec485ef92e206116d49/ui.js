(function($, global)
{
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var TaskManager = function(settings) {
		var taskQueue = [];
		var taskIndex = -1;
		var settings = $.extend({
			success: function() { },
			error: function() { }
		}, settings);

		return {
			add: function(taskSettings) {
				if (taskIndex == -1) {
					taskQueue.push(taskSettings);
				} else {
					taskQueue.splice(taskIndex + 1, 0, taskSettings);
				}
			},
			success: function() {
				taskIndex++;
				if (taskIndex == taskQueue.length) {
					if (settings.success) {
						settings.success();
					}
				} else {
					taskQueue[taskIndex]();
				}
			},
			error: function(xhr, desc, ex) {
				taskIndex = -1;
				if (settings.error) {
					settings.error(xhr, desc, ex);
				}
			},
			start: function() {
				taskIndex = -1;
				this.success();
			}
		}
	};

	var SetupTasks = function() {

		var group = function(settings, config, parentContext) {
			var o = $.extend({}, config);

			settings.tasks.add(function() {
				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{parentGroupId}/groups.json',
					data: {
						parentGroupId: parentContext.groupId,
						GroupNameFilter: o.name
					},
					cache: false,
					success: function(response) {
						if (response.Groups.length == 0) {
							settings.progress.text(settings.groupCreationProgress.replace('{0}', o.name));

							settings.tasks.add(function() {
								// create the group
								$.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups.json',
									data: {
										ParentGroupId: parentContext.groupId,
										Name: o.name,
										Description: o.description === undefined ? '' : o.description,
										GroupType: o.type === undefined ? 'Joinless' : o.type,
										EnableGroupMessages: o.enableMessages === undefined ? 'True' : o.enableMessages,
										AutoCreateApplications: 'False'
									},
									success: function(response) {
										if (o.created) { o.created(response.Group.Id); }
										groupChildren(settings, o, { groupId: response.Group.Id });
										settings.tasks.success();
									},
									error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
								});
							});
						} else {
							// group already exists
							if (o.created) { o.created(response.Groups[0].Id); }
							groupChildren(settings, o, { groupId: response.Groups[0].Id });
						}

						settings.tasks.success();
					},
					error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
				});
			});
		},
		groupChildren = function(settings, config, context) {
			var tasks = [], t;

			settings.progress.text(settings.groupConfigurationProgress.replace('{0}', config.name));

			if (config.groups) {
				$.each(config.groups, function(i, g) {
					group(settings, g, context);
				});
			}

			if (config.applications) {
				$.each(config.applications, function(i, a) {
					application(settings, a, context);
				});
			}

			// invite owner
			if (config.ownerEmail) {
				settings.tasks.add(function() {
					$.telligent.evolution.post({
						url: settings.inviteToGroupUrl,
						data: {
							GroupId: context.groupId,
							Email: config.ownerEmail,
							MembershipType: 'Owner',
							Message: ''
						},
						success: function() { settings.tasks.success(); },
						error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
					});
				});
			}

			// header template
			if (config.headerTemplate) {
				settings.tasks.add(function() {
					$.telligent.evolution.post({
						url: settings.importHeaderTemplateUrl,
						data: {
							GroupId: context.groupId,
							Template: config.headerTemplate.template,
							Parameters: jQuery.param($.extend({}, config.headerTemplate.parameters, config.headerTemplate.dynamicParameters == null ? {} : config.headerTemplate.dynamicParameters())),
							UploadContextId: settings.uploadContextId
						},
						success: function() { settings.tasks.success(); },
						error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
					});
				});
			}

			// footer template
			if (config.footerTemplate) {
				settings.tasks.add(function() {
					$.telligent.evolution.post({
						url: settings.importFooterTemplateUrl,
						data: {
							GroupId: context.groupId,
							Template: config.footerTemplate.template,
							Parameters: jQuery.param($.extend({}, config.footerTemplate.parameters, config.footerTemplate.dynamicParameters == null ? {} : config.footerTemplate.dynamicParameters())),
							UploadContextId: settings.uploadContextId
						},
						success: function() { settings.tasks.success(); },
						error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
					});
				});
			}

			// set avatar
			if (config.avatarFileName) {
				settings.tasks.add(function() {
					$.telligent.evolution.put({
						url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/avatar.json',
						data: {
							GroupId: context.groupId,
							FileName: config.avatarFileName,
							FileUploadContext: settings.uploadContextId
						},
						success: function() { settings.tasks.success(); },
						error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
					});
				});
			}

			// page templates
			if (config.pageTemplates) {
				$.each(config.pageTemplates, function(i, pt) {
					settings.tasks.add(function() {
						$.telligent.evolution.post({
							url: settings.importPageTemplateUrl,
							data: {
								GroupId: context.groupId,
								Template: pt.template,
								Parameters: jQuery.param($.extend({}, pt.parameters, pt.dynamicParameters == null ? {} : config.dynamicParameters())),
								UploadContextId: settings.uploadContextId,
								ThemeTypeId: pt.themeTypeId == null ? null : pt.themeTypeId,
								ThemeContextId: pt.themeContextId == null ? null : pt.themeContextId
							},
							success: function() { settings.tasks.success(); },
							error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
						});
					});
				});
			}

			return t;
		},
		application = function(settings, config, context) {
			var o = $.extend({}, config);

			if (o.type == 'blog') {
				return blog(settings, config, context);
			} else if (o.type == 'forum') {
				return forum(settings, config, context);
			} else if (o.type == 'collection') {
				return collection(settings, config, context);
			} else if (o.type == 'wiki') {
				return wiki(settings, config, context);
			} else if (o.type == 'gallery') {
				return gallery(settings, config, context);
			} else if (o.type == 'ideation') {
				return ideation(settings, config, context);
			} else if (o.type == 'calendar') {
				return calendar(settings, config, context);
			}
		},
		blog = function(settings, config, context) {
			settings.tasks.add(function() {
				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{groupId}/blogs.json',
					data: {
						groupId: context.groupId
					},
					cache: false,
					success: function(response) {
						var blog = $.grep(response.Blogs, function(b) { return b.Name == config.name })[0];
						if (!blog) {
							settings.progress.text(settings.blogCreationProgress.replace('{0}', config.name));

							settings.tasks.add(function() {
								$.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs.json',
									data: {
										GroupId: context.groupId,
										Name: config.name
									},
									success: function(r) {
										if (config.created) { config.created(r.Blog.Id); }
										settings.tasks.success();
									},
									error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
								});
							});
						} else {
							if (config.created) { config.created(blog.Id); }
						}

						settings.tasks.success();
					},
					error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
				});
			});
		},
		forum = function(settings, config, context) {
			settings.tasks.add(function() {
				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{groupId}/forums.json',
					data: {
						groupId: context.groupId
					},
					cache: false,
					success: function(response) {
						var forum = $.grep(response.Forums, function(f) { return f.Name == config.name })[0];
						if (!forum) {
							settings.progress.text(settings.forumCreationProgress.replace('{0}', config.name));

							settings.tasks.add(function() {
								$.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/forums.json',
									data: {
										GroupId: context.groupId,
										Name: config.name,
										AllowedThreadTypes: config.threadType === undefined ? 'Discussion' : config.threadType,
										DefaultThreadType: config.threadType === undefined ? 'Discussion' : config.threadType
									},
									success: function(r) {
										if (config.created) { config.created(r.Forum.Id); }
										settings.tasks.success();
									},
									error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
								});
							});
						} else {
							if (config.created) { config.created(forum.Id); }
						}

						settings.tasks.success();
					},
					error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
				});
			});
        },
		collection = function(settings, config, context) {
			settings.tasks.add(function() {
				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/collections.json',
					data: {
						GroupId: context.groupId
					},
					cache: false,
					success: function(response) {
						var collection = $.grep(response.ArticleCollections, function(c) { return c.Name == config.name })[0];
						if (!collection) {
							settings.progress.text(settings.collectionCreationProgress.replace('{0}', config.name));

							settings.tasks.add(function() {
								$.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/articles/collections.json',
									data: {
										GroupId: context.groupId,
										Name: config.name
									},
									success: function(r) {
										if (config.created) { config.created(r.ArticleCollection.Id); }
										settings.tasks.success();
									},
									error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
								});
							});
						} else {
							if (config.created) { config.created(collection.Id); }
						}

						settings.tasks.success();
					},
					error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
				});
			});
		},
		wiki = function(settings, config, context) {
			settings.tasks.add(function() {
				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{groupId}/wikis.json',
					data: {
						groupId: context.groupId
					},
					cache: false,
					success: function(response) {
						var wiki = $.grep(response.Wikis, function(w) { return w.Name == config.name })[0];
						if (!wiki) {
							settings.progress.text(settings.wikiCreationProgress.replace('{0}', config.name));

							settings.tasks.add(function() {
								$.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/wikis.json',
									data: {
										GroupId: context.groupId,
										Name: config.name
									},
									success: function(r) {
										if (config.created) { config.created(r.Wiki.Id); }
										settings.tasks.success();
									},
									error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
								});
							});
						} else {
							if (config.created) { config.created(wiki.Id); }
						}

						settings.tasks.success();
					},
					error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
				});
			});
		},
		gallery = function(settings, config, context) {
			settings.tasks.add(function() {
				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{groupId}/galleries.json',
					data: {
						groupId: context.groupId
					},
					cache: false,
					success: function(response) {
						var gallery = $.grep(response.Galleries, function(g) { return g.Name == config.name })[0];
						if (!gallery) {
							settings.progress.text(settings.galleryCreationProgress.replace('{0}', config.name));

							settings.tasks.add(function() {
								$.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/galleries.json',
									data: {
										GroupId: context.groupId,
										Name: config.name
									},
									success: function(r) {
										if (config.created) { config.created(r.Gallery.Id); }
										settings.tasks.success();
									},
									error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
								});
							});
						} else {
							if (config.created) { config.created(gallery.Id); }
						}

						settings.tasks.success();
					},
					error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
				});
			});
		},
		ideation = function(settings, config, context) {
			settings.tasks.add(function() {
				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/challenges.json',
					data: {
						GroupId: context.groupId
					},
					cache: false,
					success: function(response) {
						var ideation = $.grep(response.Challenges, function(c) { return c.Name == config.name })[0];
						if (!ideation) {
							settings.progress.text(settings.ideationCreationProgress.replace('{0}', config.name));

							settings.tasks.add(function() {
								$.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/challenge.json',
									data: {
										GroupId: context.groupId,
										Name: config.name
									},
									success: function(r) {
										if (config.created) { config.created(r.Challenge.Id); }
										settings.tasks.success();
									},
									error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
								});
							});
						} else {
							if (config.created) { config.created(ideation.Id); }
						}

						settings.tasks.success();
					},
					error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
				});
			});
		},
		calendar = function(settings, config, context) {
			settings.tasks.add(function() {
				$.telligent.evolution.get({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/groups/{GroupId}/calendars.json',
					data: {
						GroupId: context.groupId
					},
					cache: false,
					success: function(response) {
						var calendar = $.grep(response.Calendars, function(c) { return c.Name == config.name })[0];
						if (!calendar) {
							settings.progress.text(settings.calendarCreationProgress.replace('{0}', config.name));

							settings.tasks.add(function() {
								$.telligent.evolution.post({
									url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/calendars.json',
									data: {
										GroupId: context.groupId,
										Name: config.name
									},
									success: function(r) {
										if (config.created) { config.created(r.Calendar.Id); }
										settings.tasks.success();
									},
									error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
								});
							});
						} else {
							if (config.created) { config.created(calendar.Id); }
						}

						settings.tasks.success();
					},
					error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
				});
			});
		};

		return {
			addTasks: function(settings, config) {
				var o = $.extend({}, config);

				if (o.groupId) {
					groupChildren(settings, config, { groupId: config.groupId });
				} else {
					settings.progress.text(settings.siteConfigurationProgress);

					if (o.siteName || o.siteDescription || o.logoFileName) {
						var data = {};
						if (o.siteName) { data.SiteName = o.siteName }
						if (o.siteDescription) { data.SiteDescription = o.siteDescription }
						if (o.logoFileName) {
							data.LogoFileName = o.logoFileName;
							data.LogoFileContext = o.uploadContextId;
						}

						settings.tasks.add(function() {
							$.telligent.evolution.post({
								url: settings.setSiteConfigurationUrl,
								data: data,
								success: function() { settings.tasks.success(); },
								error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
							});
						});
					}

					if (o.groups) {
						$.each(o.groups, function(i, g) {
							group(settings, g, { groupId: settings.rootGroupId });
						});
					}

					// header template
					if (config.headerTemplate) {
						settings.tasks.add(function() {
							$.telligent.evolution.post({
								url: settings.importHeaderTemplateUrl,
								data: {
									Template: config.headerTemplate.template,
									Parameters: jQuery.param($.extend({}, config.headerTemplate.parameters, config.headerTemplate.dynamicParameters == null ? {} : config.headerTemplate.dynamicParameters())),
									UploadContextId: settings.uploadContextId
								},
								success: function() { settings.tasks.success(); },
								error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
							});
						});
					}

					// footer template
					if (config.footerTemplate) {
						settings.tasks.add(function() {
							$.telligent.evolution.post({
								url: settings.importFooterTemplateUrl,
								data: {
									Template: config.footerTemplate.template,
									Parameters: jQuery.param($.extend({}, config.footerTemplate.parameters, config.footerTemplate.dynamicParameters == null ? {} : config.footerTemplate.dynamicParameters())),
									UploadContextId: settings.uploadContextId
								},
								success: function() { settings.tasks.success(); },
								error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
							});
						});
					}

					// page templates
					if (config.pageTemplates) {
						$.each(config.pageTemplates, function(i, pt) {
							settings.tasks.add(function() {
								$.telligent.evolution.post({
									url: settings.importPageTemplateUrl,
									data: {
										Template: pt.template,
										Parameters: jQuery.param($.extend({}, pt.parameters, pt.dynamicParameters == null ? {} : pt.dynamicParameters())),
										UploadContextId: settings.uploadContextId,
										ThemeTypeId: pt.themeTypeId == null ? null : pt.themeTypeId,
										ThemeContextId: pt.themeContextId == null ? null : pt.themeContextId
									},
									success: function() { settings.tasks.success(); },
									error: function(xhr, desc, ex) { settings.tasks.error(xhr, desc, ex); }
								});
							});
						});
					}
				}
			}
		};
	}();

	/*
	var config = {
		siteName: 'name',
		siteDescription: 'description',
		logoFileName: 'filename', // honored for site setup
		groupId: 123, (if configuring a single group)
		groups: [
			{
				name: 'Departments',
				description: '',
				type: 'Joinless',
				enableMessages: 'True',
				ownerEmail: 'blah@blah.com',
				avatarFileName: 'filename',
				headerTemplate: {
					template: 'template-name',
					parameters: {},
					dynamicParameters: function() { return {}; }
				},
				pageTemplates: [
					template: 'template-name',
					parameters: {},
					dynamicParameters: function() { return {}; },
					themeTypeId: '', (defaults to current theme type)
					themeContextId: '' (defaults to current theme context)
				],
				footerTemplate: {
					template: 'template-name',
					parameters: {},
					dynamicParameters: function() { return {}; }
				},
				groups: [
					// ...
				],
				applications: [
					{
						type: 'blog',
						name: 'Announcements',
						created: function(applicationId) { }
					},
					{
						type: 'forum',
						name: 'Blah',
						threadType: 'QuestionAndAnswer',
						created: function(applicationId) { }
					}
				]
			}
		],
		headerTemplate: { (if a groupId is specified, this is applied to the group, otherwise site)
			template: 'template-name',
			parameters: {},
			dynamicParameters: function() { return {}; }
		},
		pageTemplates: [
			template: 'template-name', (if a groupId is specified, this is applied to the group, otherwise site)
			parameters: {},
			dynamicParameters: function() { return {}; },
			themeTypeId: '', (defaults to current theme type)
			themeContextId: '' (defaults to current theme context)
		],
		footerTemplate: { (if a groupId is specified, this is applied to the group, otherwise site)
			template: 'template-name',
			parameters: {},
			dynamicParameters: function() { return {}; }
		},
		submit: JQuery submit button,
		progress: JQuery progress span,
		success: function() { },
		error: function() { },
		(the following options only apply when a groupId is specified)
		name: 'group name',
		ownerEmail: 'blah@blah.com',
		avatarFileName: 'filename',
		created: function(groupId) { },
		applications: [
			{
				type: 'blog',
				name: 'Announcements',
				created: function(applicationId) { }
			},
			{
				type: 'forum',
				name: 'Blah',
				threadType: 'QuestionAndAnswer',
				created: function(applicationId) { }
			}
		]
	}
	*/

	function estimateApplicationLicenseUsage(applications, usage) {
		if (applications && applications.length > 0) {
			for (var i = 0; i < applications.length; i++) {
				usage.applications[applications[i].type] = (usage.applications[applications[i].type] || 0) + 1;
			}
		}
	}

	function estimateGroupLicenseUsage(group, usage) {
		usage.group++;
		estimateApplicationLicenseUsage(group.applications, usage);
		if (group.groups && group.groups.length > 0) {
			for (var i = 0; i < group.groups.length; i++) {
				estimateGroupLicenseUsage(group.groups[i], usage);
			}
		}
	}

	$.telligent.evolution.widgets.siteAndGroupSetup = {
		register: function(settings) {
			var licenseCheck = null;
			function checkLicense() {
				global.clearTimeout(licenseCheck);

				$.telligent.evolution.get({
					url: settings.updateLicenseDataUrl,
					cache: false,
					success: function(data) {
						if (data && data.licensesRemaining) {
							settings.licensesRemaining = data.licensesRemaining;
							if (settings.licensesRemaining.isLimited) {
								$('.message.license-check').show();
							} else {
								$('.message.license-check').slideUp('fast');
							}
						}
					},
					error: function(xhr, desc, ex) { /*ignore*/ }
				});

				global.licenseCheck = global.setTimeout(function() {
					checkLicense();
				}, 2500);
			}
			checkLicense();

			$.telligent.evolution.messaging.subscribe('telligent.evolution.widgets.siteAndGroupSetup.licenseCheck', function(data) {
				if (!settings.licensesRemaining) {
					return;
				}

				var usage = {
					group: 0,
					applications: {
					}
				}

				if (data.groups) {
					for (var i = 0; i < data.groups.length; i++) {
						estimateGroupLicenseUsage(data.groups[i], usage);
					}
				}

				if (data.applications) {
					estimateApplicationLicenseUsage(data.applications, usage);
				}

				data.valid = true;
				data.message = '';
				if (usage.group > 0 && usage.group > settings.licensesRemaining.group) {
					if (data.message.length > 0) {
						data.message += settings.overLicensedSeperator;
					}
					data.message += settings.overLicenseNames.group.replace(/\{0\}/g, (usage.group - settings.licensesRemaining.group));
					data.valid = false;
				}

				$.each(usage.applications, function(n, v) {
					if (v > 0 && !isNaN(parseInt(settings.licensesRemaining.applications[n])) && v > settings.licensesRemaining.applications[n]) {
						if (data.message.length > 0) {
							data.message += settings.overLicensedSeperator;
						}
						data.message += settings.overLicenseNames.applications[n].replace(/\{0\}/g, (v - settings.licensesRemaining.applications[n]));
						data.valid = false;
					}
				});

				if (data.message.length > 0) {
					data.message = settings.overLicensedMessage.replace(/\{0\}/g, data.message);
				}
			});

			$.telligent.evolution.messaging.subscribe('telligent.evolution.widgets.siteAndGroupSetup.setup', function(data) {
				data.submit.addClass('disabled').prop('disabled', true);
				data.progress.show();

				var s = $.extend({}, settings, data);
				s.tasks = new TaskManager({
					success: function() {
						data.submit.removeClass('disabled').prop('disabled', false);
						data.progress.hide();
						data.success();
					},
					error: function(xhr, desc, ex) {
						data.submit.removeClass('disabled').prop('disabled', false);
						data.progress.hide();

						if (desc) {
							$.telligent.evolution.notifications.show(desc, { type: 'error' });
						}

						data.error();
					}
				});

				SetupTasks.addTasks(s, data);

				s.tasks.start();
			});
		},
		configureDefault: function(settings) {
			if ($('.content-fragment-page .content-fragment').length == 0) {
				// this is the only widget on the page, process the configuration
				$.telligent.evolution.post({
					url: settings.url,
					data:  { },
					success: function(response) {
						global.location.href = global.location.href;
					}
				});
			}
		},
		setupFileUpload: function(settings) {
			settings.upload = settings.field.find('a.upload');
			settings.remove = settings.field.find('a.remove');
			settings.preview = settings.field.find('.preview');

			function loadPreview() {
				if (settings.file && settings.file.fileName) {
					clearTimeout(settings.previewTimeout);
					settings.previewTimeout = setTimeout(function(){
						$.telligent.evolution.post({
							url: settings.previewUrl,
							data:  {
								uploadContextId: settings.uploadContextId,
								filename: settings.file.fileName
							},
							success: function(response) {
								response = $.trim(response);
								if(response && response.length > 0 && response !== settings.previewContent) {
									settings.previewContent = response;
									settings.preview.html(settings.previewContent).slideDown('fast');
								}
							}
						});
					}, 150);
				} else {
					settings.previewContent = '';
					settings.preview.html('').hide();
				}
			}

			settings.remove.hide();
			loadPreview();

			settings.remove.on('click', function() {
				settings.file = null;
				settings.upload.html(settings.addText).removeClass('change').addClass('add')
				settings.remove.hide();
				loadPreview();
				return false;
			});

			settings.upload.glowUpload({
				fileFilter: null,
				uploadUrl: settings.uploadFileUrl,
				renderMode: 'link',
				type: 'image'
			})
			.on('glowUploadBegun', function(e) {
				settings.uploading = true;
				settings.upload.html(settings.progressText.replace('{0}', 0));
			})
			.on('glowUploadComplete', function(e, file) {
				if (file && file.name.length > 0) {
					settings.file = {
						fileName: file.name
					}
					loadPreview();
					settings.uploading = false;
					settings.upload.html(settings.changeText).removeClass('add').addClass('change');
					settings.remove.show();
				}
			})
			.on('glowUploadFileProgress', function(e, details) {
				settings.upload.html(settings.progressText.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				loadPreview();
				settings.uploading = false;
				settings.upload.html(settings.changeText).removeClass('change').addClass('add');
			});
		}
	};
}(jQuery, window));