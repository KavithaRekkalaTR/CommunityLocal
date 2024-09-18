(function($, global, undef) {

	var uploadClass = 'upload-attachment prepend-icon camera';
	var changeClass = 'change prepend-icon camera';


	var pageSize = 5;

	// Data Models

	// custom JSON storage which stores all items
	// scoped to the current user and in different
	// backends depending on anonymous or registered
	var contextStorage = (function(){

		var store = $.telligent.evolution.user.accessing.isSystemAccount
			? global.sessionStorage
			: global.localStorage;

		function addUserToKey(key) {
			return $.telligent.evolution.user.accessing.id + ':' + key;
		}

		function addNameSpaceToKey(key) {
			return 'qi_' + ':' + key;
		}

		return {
			get: function(key) {
				return $.Deferred(function(d){
					global.setTimeout(function(){
						if (!store) { d.reject(); }
						d.resolve(JSON.parse(store.getItem(addNameSpaceToKey(addUserToKey(key)))));
					}, 1);
				}).promise();
			},
			set: function(key, data) {
				return $.Deferred(function(d){
					global.setTimeout(function(){
						if (!store) { d.reject(); }
						store.setItem(addNameSpaceToKey(addUserToKey(key)), JSON.stringify(data));
						d.resolve();
					}, 1);
				}).promise();
			},
			remove: function(key) {
				return $.Deferred(function(d){
					global.setTimeout(function(){
						if (!store) { d.reject(); }
						store.removeItem(addNameSpaceToKey(addUserToKey(key)));
						d.resolve();
					}, 1);
				}).promise();
			}
		};

	})();

	// App client-side Api Interaction
	var apiModel = {
		// options
		//   message
		//   containerId
		//   uploadContextId
		//   attachedFileName
		createStatus: function(context, options) {
			var data = {
				message: options.message,
				containerId: options.containerId,
				contextId: options.uploadContextId
			};
			if(options.attachedFileName) {
				data.fileName = options.attachedFileName
			};
			return $.telligent.evolution.post({
				url: context.addUrl,
				data: data
			});
		},
		// options
		//   messageBody
		//   groupId
		//   uploadContextId
		//   attachedFileName
		getPreview: function(context, options) {
			var data = {
				w_messageBody: options.messageBody,
				w_groupId: options.groupId
			};
			if(options.attachedFileName && options.uploadContextId) {
				data['w_attachedFileContext'] = options.uploadContextId,
				data['w_attachedFileName'] = options.attachedFileName
			};
			return $.telligent.evolution.post({
				url: context.previewAttachmentUrl,
				data: data
			});
		},
		// options
		//   pageIndex
		getBookmarkedAndUserGroups: function(context, options) {
			return $.telligent.evolution.get({
				url: context.groupBookmarkAndMembershipUrl,
				data: {
					pageIndex: 0,
					pageSize: pageSize
				}
			}).then(function(r){
				r.memberships = $.map(r.memberships, function(g) {
					g.date = $.telligent.evolution.parseDate(g.date).getTime()
					return g;
				});
				r.bookmarks = $.map(r.bookmarks, function(g) {
					g.date = $.telligent.evolution.parseDate(g.date).getTime()
					return g;
				});
				return r;
			});
		},
		// options
		//   query
		searchGroups: function(context, options) {
			return $.telligent.evolution.get({
				url: context.groupSearchUrl,
				data: {
					pageIndex: 0,
					pageSize: pageSize,
					query: options.query
				}
			}).then(function(r){
				return $.map(r.groups, function(g) {
					g.date = $.telligent.evolution.parseDate(g.date).getTime()
					return g;
				});
			});
		},
		// options
		//   containerId
		loadGroupFields: function(context, options) {
			return $.telligent.evolution.get({
				url: context.loadFormUrl,
				data: {
					ContainerId: options.containerid
				}
			});
		},
		// options
		//   body
		//   filename
		//   filecontextid
		//   fileurl
		storeTemporaryData: function(context, options) {
			return $.telligent.evolution.post({
				url: context.storeUrl,
				data: {
					body: options.body,
					filename: options.filename,
					filecontextid: options.filecontextid,
					fileurl: options.fileurl
				}
			});
		}
	};

	// Encapsulates Logic around group suggestions and selections
	var groupModel = (function(){

		function loadSelectedGroups() {
			return contextStorage.get('g').then(function(r){
				if(r && r.groups)
					return r.groups;
				return [];
			});
		}

		function storeSelectedGroups(groups) {
			return contextStorage.set('g', { groups: groups });
		}

		// adds a group (group) to an array of groups (selection)
		// positioned according to its 'date' field, ascending,
		// if matches an existing group in the selection (according to id)
		// then it replaces the existing with new, and positions according to new date
		// if limit is reached, truncates oldest group in selection
		function mergeGroupIntoSelection(selection, group, limit) {
			selection = selection || [];
			if(!group)
				return selection;

			// first remove matching items from selection
			selection = $.grep(selection, function(g) {
				return g.id !== group.id;
			});

			// then add it to the list
			selection.push(group);

			// then sort the list by date
			selection = selection.sort(function(a, b){
				return b.date - a.date;
			});

			// then truncate over the limit
			selection = selection.slice(0, limit)

			return selection;
		}

		function mergeGroupList(existingItems, newItems) {
			var merged = existingItems;
			for(var i = 0; i < newItems.length; i++) {
				merged = mergeGroupIntoSelection(merged, newItems[i], pageSize);
			}
			return merged;
		}

		return {
			// Returns a unique list of group selections including, in priority order of use:
			// previously selected groups
			// bookmarked groups
			// membership groups
			listSuggestions: function(context) {
				var groupList = [];

				return $.Deferred(function(d){
					// load previously selected items
					loadSelectedGroups().then(function(previouslySelected){
						// if there's less then the page size in previous selections
						if(previouslySelected.length < pageSize) {
							// then build up a new list based on bookmarks and memberships
							apiModel.getBookmarkedAndUserGroups(context).then(function(g){
								// and add them to the list in priority, ascending:
								// lowest ordering priority is memberships
								groupList = mergeGroupList(groupList, g.memberships);
								// then bookmarks
								groupList = mergeGroupList(groupList, g.bookmarks);
								// then previous selections
								groupList = mergeGroupList(groupList, previouslySelected || []);
								// return list
								d.resolve(groupList);
							});
						} else {
							// otherwise, just set the group list to previously selected
							// and truncate if necessary
							groupList = (previouslySelected || []).slice(0, pageSize);
							// return list
							d.resolve(groupList);
						}
					});
				}).promise();
			},
			// identifies a group as previously selected
			select: function(group) {
				return $.Deferred(function(d){
					// load previously selected groups
					loadSelectedGroups().then(function(previouslySelected){
						// using current time as selected group's sort date
						// (selected groups' dates are their selection times)
						group.date = (new Date().getTime());
						// merge selected group into previous selections
						previouslySelected = mergeGroupIntoSelection(previouslySelected || [], group, pageSize);
						// persist selections
						storeSelectedGroups(previouslySelected).then(d.resolve);
					});
				}).promise();
			}
		};
	})();


	// Group Selector UI:
	var GroupSelector = (function(){
		var defaults = {
			wrapper: '',
			selectorTemplate: '',
			resultsTemplate: '',
			initialName: null,
			initialContainerId: null,
			initialAvatarHtml: null,
			onPreFill: function() {},
			onSearch: function(query) {},
			onSelect: function(group) {}
		};

		function init(context) {
			if(context.inited) { return; }
			context.inited = true;

			buildUi(context);
			handleEvents(context);
		}

		function buildUi(context) {
			// build templates
			context.selectorTemplate = $.telligent.evolution.template.compile(context.selectorTemplate);
			context.resultsTemplate = $.telligent.evolution.template.compile(context.resultsTemplate);

			// create elements
			context.groupLink = $(context.wrapper).find('a.internal-link');
			context.groupAvatar = $(context.wrapper).find('.group-avatar');
			context.cancelSelectionWrapper = $(context.wrapper).find('.cancel-selection');
			context.cancelSelectionLink = context.cancelSelectionWrapper.find('a');

			context.popup = $('<div></div>').glowPopUpPanel({
				cssClass: 'group-selector-wrapper',
				hideOnDocumentClick: false,
				position: 'updown',
				zIndex: 1000
			}).on('glowPopUpPanelShowing', function(e, data) {
				context.wrapper.addClass('links-expanded').attr('data-position', data.position);
			}).on('glowPopUpPanelHiding', function(e, data){
				context.wrapper.removeClass('links-expanded').attr('data-position', '');
			});

			context.groupsSelectorElement = $(context.selectorTemplate({

			}));

			// collect element references
			context.groupsElement = context.groupsSelectorElement.find('.groups');
			context.groupSearchInput = context.groupsSelectorElement.find('input.search');
		}

		function handleSelectionAndRaiseEvent(context, name, containerId, avatarHtml) {
			var group = {
				name: name,
				id: containerId,
				avatarHtml: avatarHtml
			};
			context.groupAvatar.html(group.avatarHtml);
			context.groupLink.html(group.name);
			context.cancelSelectionWrapper.show();
			context.onSelect(group);

		}

		function handleEvents(context) {
			// clicks outside of popup close the popup
			$(document).on('click', function(){
				close(context);
			});
			context.groupsSelectorElement.on('click', function(e){
				e.stopPropagation();
			});
			context.cancelSelectionLink.on('click', function(e){
				e.preventDefault();
				context.groupAvatar.html('');
				context.groupLink.html(context.cancelSelectionLink.attr('data-tip'));
				context.cancelSelectionWrapper.hide();
				context.onCancel();
				return false;
			});

			// clicks of groups select groups and close
			context.groupsSelectorElement.on('click', 'li a', function(e){
				e.preventDefault();
				var link = $(e.target);

				handleSelectionAndRaiseEvent(context,
					link.data('name'),
					link.data('containerid'),
					link.closest('li.navigation-list-item').find('.group-avatar').html());

				close(context);
				return false;
			});
			context.groupsSelectorElement.on('click','li', function(e){
				e.preventDefault();
				$(this).find('.internal-link').trigger('click');
				return false;
			});

			// search
			context.searchTimeout;
			context.groupSearchInput.on('keyup', function(e){
				global.clearTimeout(context.searchTimeout);
				context.searchTimeout = global.setTimeout(function(){
					var currentQuery = $(e.target).val();
					context.currentQuery = currentQuery;
					context.onSearch(currentQuery).then(function(groups){
						if(currentQuery != context.currentQuery)
							return;
						context.groupsElement.html(context.resultsTemplate({
							groups: groups
						}));
						context.popup.glowPopUpPanel('refresh');
						context.groupSearchInput.trigger('focus');
					})
				}, 100);
			}).on('keydown', function(e){
				if(e.which === 38) {
					var currentSelected = context.groupsElement.find('li.selected').removeClass('selected');
					var prev = currentSelected.length > 0 ? currentSelected.prev('li') : null;
					if(currentSelected.length > 0 && prev.length > 0) {
						prev.addClass('selected');
					} else {
						context.groupsElement.find('li:last-child').addClass('selected');
					}
				} else if(e.which === 40) {
					var currentSelected = context.groupsElement.find('li.selected').removeClass('selected');
					var next = currentSelected.length > 0 ? currentSelected.next('li') : null;
					if(currentSelected.length > 0 && next.length > 0) {
						next.addClass('selected');
					} else {
						context.groupsElement.find('li:first-child').addClass('selected');
					}
				} else if(e.which === 13) {
					context.groupsElement.find('li.selected').find('a.internal-link').trigger('click');
				}
			});
		}

		function open(context) {
			context.onPreFill().then(function(groups){

				context.groupsElement.html(context.resultsTemplate({
					groups: groups
				}));

				context.popup.glowPopUpPanel('html', context.groupsSelectorElement)
						.glowPopUpPanel('show', context.wrapper);

				context.groupSearchInput.val('').trigger('focus');
			});
		}

		function close(context) {
			context.groupsSelectorElement.detach();
			context.popup.glowPopUpPanel('hide');
		}

		return function(options) {
			var context = $.extend({}, defaults, options || {});

			$(context.wrapper).find('a.internal-link').on('click', function(e){
				e.preventDefault();

				init(context);

				if(context.popup.glowPopUpPanel('isShown'))
					close(context);
				else
					open(context);

				return false;
			});

			if(context.initialContainerId && context.initialName && context.initialAvatarHtml) {
				init(context);
				handleSelectionAndRaiseEvent(context,
					context.initialName,
					context.initialContainerId,
					context.initialAvatarHtml);
			}

			return {
				close: function() {
					close(context);
				}
			};
		}
	})();

	function validate(context) {
		return context.uploading !== true;
	}

	function add(context, value, attachedFileName) {
		if (!validate(context))
			return;

		if(context.adding)
			return;
		context.adding = true;

		apiModel.createStatus(context, {
			message: context.editor.getContent(),
			containerId: context.containerId,
			uploadContextId: context.uploadContextId,
			attachedFileName: context.attachedFileName
		}).then(function(response){
			$.telligent.evolution.notifications.show(context.successMessage, { type: 'success' });
			$(document).trigger('telligent_messaging_activitymessageupdated', [response.body]);
			$(document).trigger('telligent_core_usersstatusupdated', [response.body]);
			context.editor.setContent('');
			removeFile(context);
			clearPreview(context);
			validate(context);
			context.adding = false;
		})
		.catch(function(xhr, desc, ex){
			validate(context);
			context.adding = false;
		});
	}

	function removeFile(context) {
		if(context.fileRemove) {
			context.fileRemove.hide();
			loadPreview(context);
			context.fileUpload.html(context.uploadFileMessage).addClass(uploadClass).removeClass(changeClass);
		}
		context.attachedFileName = null;
		context.uploading = false;
	}

	function reloadPage() {
		window.location = window.location;
	}

	function loadPreview(context, fileName) {
		if(fileName)  {
			context.attachedFileName = fileName;
		}
		clearTimeout(context.previewTimeout);
		context.previewTimeout = setTimeout(function(){

			apiModel.getPreview(context, {
				messageBody: context.editor.getContent(),
				groupId: context.groupId,
				uploadContextId: context.uploadContextId,
				attachedFileName: context.attachedFileName
			}).then(function(response){
				response = $.trim(response);
				if(response && response.length > 0) {
					if (response !== context.previewContent) {
						context.previewContent = response;
						context.previewContainer.html(context.previewContent);
						context.previewContainer.css({ display: 'block' }).slideDown(100);
					}
				} else {
					context.previewContent = '';
					context.previewContainer.html('');
					context.previewContainer.slideUp(100, function(){
						context.previewContainer.css({ display: 'none' });
					});
				}
			});

		}, 150);
	}

	function clearPreview(context) {
		context.previewContainer.slideUp(100, function(){
			context.previewContainer.css({ display: 'none' });
		});
		clearTimeout(context.previewTimeout);
		context.attachedFileName = null;
		context.previewContent = null;
		context.previewContainer.empty();
	}

	function initializeFileUpload(context, destroy) {
		if (context.fileUploadInitialized) {
			try {
				context.fileUpload.off('.attachment').glowUpload('destroy');
			} catch (e) { }
			context.fileUploadInitialized = false;
		}

		context.fileUpload
			.glowUpload({
				uploadUrl: context.uploadFileUrl,
				renderMode: 'link',
				contentTypeId: context.statusMessageContentTypeId
			})
			.on('glowUploadBegun.attachment', function(e) {
				context.uploading = true;
				validate(context);
				context.fileUpload.html(context.progressMessage.replace('{0}', 0));
			})
			.on('glowUploadComplete.attachment', function(e, file) {
				loadPreview(context, file.name);
				context.uploading = false;
				context.fileUpload.html(context.changeFileMessage).removeClass(uploadClass).addClass(changeClass);
				context.fileRemove.show();
				validate(context);
			})
			.on('glowUploadFileProgress.attachment', function(e, details) {
				context.fileUpload.html(context.progressMessage.replace('{0}', details.percent));
			})
			.on('glowUploadError', function(e) {
				context.uploading = false;
				removeFile(context);
			});

		context.fileUploadInitialized = true;
	}

	function initializeGroupSelector(context) {
		context.groupSelector = new GroupSelector({
			selectorTemplate: context.groupSelectorTemplateId,
			resultsTemplate: context.groupSelectorGroupsTemplateId,
			initialName: context.initialName,
			initialContainerId: context.initialContainerId,
			initialAvatarHtml: context.initialAvatarHtml,
			onPreFill: function() {
				return groupModel.listSuggestions(context);
			},
			onSearch: function(query) {
				return apiModel.searchGroups(context, {
					query: query
				});
			},
			onSelect: function(group) {
				groupModel.select(group);
				$(context.groupSelectorId).addClass('with-avatar');
				loadFormFields(context, group.id).then(function(){
					if(context.links)
						context.links.uilinks('resize');
				});
			},
			onCancel: function() {
				$(context.groupSelectorId).removeClass('with-avatar');
				loadFormFields(context, context.rootContainerId).then(function(){
					if(context.links)
						context.links.uilinks('resize')
				});
			},
			wrapper: $(context.groupSelectorId)
		});
	}

	function initializeCurrentFormFields(context) {
		context.status = $('.field-item.status', context.wrapper);
		context.previewContainer = $('.preview', context.wrapper);
		context.postContainer = $('.post-container', context.wrapper);
		context.links = $('.navigation-list.links', context.wrapper);
		context.previewTimeout = null;
		context.attachedFileName = null;
		context.previewContent = null;
		context.uploading = false;

		context.status.data('context', context);

        context.editor.onReady(function() {
			context.fileUpload = $('.upload-attachment', context.wrapper);
			context.fileRemove = $('.remove', context.wrapper);
			context.fileUpload.show();
			context.editor.onChange(function(e){
				loadPreview(context);
			});

			initializeFileUpload(context);

			context.fileRemove.on('click', function() {
				removeFile(context);
				return false;
			});
		});

		if(context.links) {
			if(context.links.length > 0) {
				$.fn.uilinks.forceRender();
			}
		}

		removeFile(context);
		validate(context);
	}

	function handleApplicationRedirects(context) {
		// handle clicks of app links
		$.telligent.evolution.messaging.subscribe(context.applicationLinkMessageName, function(data){
			// if it would effectively link to an app
			var link = $(data.target);
			var url = link.attr('href');
			if(url.length > 1) {
				// store any post data was already being authored there was any
				var body = $.trim(context.editor.getContent() || '');
				apiModel.storeTemporaryData(context, {
					body: body,
					filename: context.attachedFileName,
					filecontextid: context.uploadContextId
				}).then(function(r){
					// add the temp data id to the target url
					url = $.telligent.evolution.url.modify({
						url: url,
						query: {
							tsid: r.temporaryData
						}
					});
					global.location = url;
				})
			}
		});
	}

	function loadFormFields(context, containerId) {
		return $.Deferred(function(d){
						if (containerId == context.containerId) {
								d.resolve();
								return;
						}

						apiModel.loadGroupFields(context, {
								containerid: containerId
						}).then(function(response){
								// replace form with new form
								context.wrapper.find('.field-item.post-type').html(response.newPostLinks);

								if (response.statusEnabled) {
										context.wrapper.find('.field-item.status').show();
								} else {
										context.wrapper.find('.field-item.status').hide();
								}

								// intialize state using different group's form
								context.containerId = containerId;
								d.resolve();
						});
		}).promise();
	 }

	var api = {
		register: function (context) {
			context.wrapper = $(context.wrapperSelector);
			initializeGroupSelector(context);
			initializeCurrentFormFields(context);
			handleApplicationRedirects(context);
		},
		submit: function(wrapperId) {
			var context = $('.field-item.status', $('#' + wrapperId)).data('context');
			if (context && validate(context)) {
				 add(context);
			}
		}
	};


	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.quickPost = api;

})(jQuery, window);