(function($, global, undef) {
	function updateVisibleTab(context) {
		var e = context.headerWrapper.find('.filter-option.selected a[data-tab]');
		var tab = context.wrapper.find('.tab.' + e.data('tab'));
		tab.siblings('.tab').css({
				visibility: 'hidden',
				height: '100px',
				width: '800px',
				left: '-1000px',
				position: 'absolute',
					overflow: 'hidden',
					top: '-1000px'
		});
		tab.css({
			visibility: 'visible',
				height: 'auto',
				width: 'auto',
				left: '0',
				position: 'static',
					overflow: 'visible',
					top: '0'
		});

		$.telligent.evolution.administration.header();
		$.fn.uilinks.forceRender();
	}


	var spinner = '<span class="ui-loading" width="48" height="48"></span>';
	function searchUsers(context, textbox, searchText) {
		if(searchText && searchText.length >= 2) {

			textbox.glowLookUpTextBox('updateSuggestions', [
				textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
			]);

			var selected = {};
			var count = textbox.glowLookUpTextBox('count');
			for (var i = 0; i < count; i++) {
				var item = textbox.glowLookUpTextBox('getByIndex', i);
				if (item) {
					selected[item.Value] = true;
				}
			}

			$.telligent.evolution.get({
				url: context.findUsersUrl,
				data: {
					w_query: searchText
				},
				success: function(response) {
					if (response && response.matches.length > 1) {
						var suggestions = [];
						for (var i = 0; i < response.matches.length; i++) {
							var item = response.matches[i];
							if (item && item.userId) {
								var selectable = !item.alreadySelected && !selected[item.userId];
								suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.userId, item.title, selectable ? item.preview : '<div class="glowlookuptextbox-alreadyselected">' + item.preview + '<span class="glowlookuptextbox-identifier">' + context.text.alreadySelected + '</span></div>', selectable));
							}
						}

						textbox.glowLookUpTextBox('updateSuggestions', suggestions);
					} else {
						textbox.glowLookUpTextBox('updateSuggestions', [
							textbox.glowLookUpTextBox('createLookUp', '', context.text.noUsersMatchText, context.text.noUsersMatchText, false)
						]);
					}
				},
			});
		}
	}

	function prefix(options) {
		var data = {};
		$.each(options, function(k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	function buildExportUrl(context, options) {
		return $.telligent.evolution.url.modify({
			url: context.exportCallbackUrl,
			query: prefix(options || {})
		});
	}

	function buildExportAllUrl(context, options) {
		return $.telligent.evolution.url.modify({
			url: context.exportAllCallbackUrl,
			query: prefix(options || {})
		});
	}

	function queriesMatch(queryA, queryB) {
		return (queryA && queryB &&
			queryA.type == queryB.type &&
			queryA.query == queryB.query);
	}

	function listActions(context, pageIndex) {
		var listQuery = $.extend({}, context.listQueryContext, {
			pageIndex: pageIndex
		});

		return $.telligent.evolution.get({
			url: context.listCallbackUrl,
			data: listQuery,
			cache: false
		}).then(function(r){
			return queriesMatch(listQuery, context.listQueryContext) ? r : null;
		});
	}

	var api = {
		register: function(options) {

			var context = $.extend(options, {
				auditList: $(options.auditListId),
				auditCount: $(options.auditCountId),
				machineNamesSelector: $(options.machineNamesId),
				auditActionsSelector: $(options.auditActionsId),
				auditSourcesSelector: $(options.auditSourcesId),
				searchInput: $(options.searchInputId),
				memberSearchInput: $(options.memberSearchInputId),
				listQueryContext: {}
			});

			context.headerWrapper = $('<div></div>');
			$.telligent.evolution.administration.header(context.headerWrapper);
			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			var headingTemplate = $.telligent.evolution.template.compile(context.headerTemplateId);
			context.headerWrapper.html(headingTemplate());
			$.telligent.evolution.administration.header();

			context.headerWrapper.on('click', '.filter-option a', function() {
				var e = $(this);
				e.parent().siblings('.filter-option').removeClass('selected');
				e.parent().addClass('selected');

				updateVisibleTab(context);

				return false;
			});
			updateVisibleTab(context);

			context.listQueryContext.pageIndex = 0;
			context.listQueryContext.pageSize = 20;
			context.listQueryContext.startDate  = context.startDate;
			context.listQueryContext.endDate = context.endDate;

			// paging
			context.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: context.auditList,
				load: function(pageIndex) {
					return $.Deferred(function(d){
						listActions(context, pageIndex).then(function(r){
							if (!r.list)
								d.reject();

							context.auditCount.empty().append(r.count);
							// if there was more content, resolve it as true to continue loading
							if($.trim(r.list).length > 0) {
								context.auditList.append(r.list);
								d.resolve();
							} else {
								d.reject();
								// if still the first page, then show the 'no content message'
								if(pageIndex === 0) {
									context.auditList.append('<div class="message norecords">' + context.noActionsText + '</div>');
								}
							}
						}).catch(function(){
							d.reject();
						})
					});
				}
			});

			$(context.startDateId).val(new Date(context.startDate).toISOString()).glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: false,
					})
			)
				.on('glowDateTimeSelectorChange', function() {
					var startDate = $.telligent.evolution.formatDate($(context.startDateId).glowDateTimeSelector('val'));
					if (startDate != '') {
						context.listQueryContext.startDate = startDate;
						context.scrollableResults.reset();
						context.auditList.empty();
					}
				}
			);

			$(context.endDateId).glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: true,
					})
			)
				 .on('glowDateTimeSelectorChange', function() {
					var endDate = $.telligent.evolution.formatDate($(context.endDateId).glowDateTimeSelector('val'));
					context.listQueryContext.endDate = endDate;
					context.scrollableResults.reset();
					context.auditList.empty();
				}
			);

			// filtering
			context.auditActionsSelector.on('change', function() {
				var action = context.auditActionsSelector.val();
				context.listQueryContext.action = action == '' ? null : action;
				context.scrollableResults.reset();
				context.auditList.empty();
			});

			context.machineNamesSelector.on('change', function() {
				context.listQueryContext.machineName = context.machineNamesSelector.val();
				context.scrollableResults.reset();
				context.auditList.empty();
			});

			context.auditSourcesSelector.on('change', function() {
				var sourceValue = context.auditSourcesSelector.val();
				if(sourceValue.includes(":")) {
					var parts = sourceValue.split(":");
					sourceValue = parts[0];
					context.listQueryContext.sourceId = parts[1];
				}
				else {
					context.listQueryContext.sourceId = null;
				}
				context.listQueryContext.sourceType = sourceValue;
				context.scrollableResults.reset();
				context.auditList.empty();
			});

			// searching
			var searchTimeout;
			context.searchInput.on('input', function(){
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(function() {
					context.listQueryContext.query = context.searchInput.val();
					context.auditList.empty();
					context.scrollableResults.reset();
				}, 150);
			});

			context.userToAdd = $(context.memberSearchInputId)
				.glowLookUpTextBox({
					delimiter: ',',
					allowDuplicates: false,
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchUsers(context, tb, searchText);
					},
					emptyHtml: context.userLookupPlaceholder,
					selectedLookUpsHtml: [],
					deleteImageUrl: ''})
					.on('glowLookUpTextBoxChange', function(){
						if (context.userToAdd.val() != '')
							context.listQueryContext.userId = context.userToAdd.val();
						else
						context.listQueryContext.userId = null;

						context.auditList.empty();
						context.scrollableResults.reset();

					});

			// events + handlers
			var messageHandlers = {
				'audit-export': function(data){
					var exportUrl = buildExportUrl(context, { Id: $(data.target).data('id') } );
					if(exportUrl) {
						window.location = exportUrl;
						return false;
					}
				},
				'audit-export-all': function(data){
					var exportUrl = buildExportAllUrl(context, context.listQueryContext);
					if(exportUrl) {
						window.location = exportUrl;
						return false;
					}
				},
				'audits-refresh': function(data){
					context.auditList.empty();
					context.scrollableResults.reset();
				}
			};
			for(var messageName in messageHandlers) {
				$.telligent.evolution.messaging.subscribe(messageName, messageHandlers[messageName]);
			}
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.auditPanel = api;

})(jQuery, window);