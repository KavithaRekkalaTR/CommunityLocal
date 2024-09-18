(function($, global, undef) {

	function prefix(options) {
		var data = {};
		$.each(options, function(k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	var spinner = '<span class="ui-loading" width="48" height="48"></span>',
	searchExceptionTypes = function(context, textbox, searchText) {
		textbox.glowLookUpTextBox('updateSuggestions', [
			textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
		]);

		if (context.exceptionTypesList == null) {
			$.telligent.evolution.get({
				url: context.urls.lookupTypes,
				data: context.currentFilter,
				success: function(response) {
					if (response && response.ExceptionTypes && response.ExceptionTypes.length >= 1) {
						context.exceptionTypesList = response.ExceptionTypes;
						handleExceptionTypesSearch(context, textbox, searchText);
					}
				}
			});
		}
		else {
			handleExceptionTypesSearch(context, textbox, searchText);
		}
	};	

	function handleExceptionTypesSearch(context, textbox, searchText) {
		if (context && context.exceptionTypesList && context.exceptionTypesList.length >= 1) {
			var hasMatches = false;

			textbox.glowLookUpTextBox('updateSuggestions',
			$.map(context.exceptionTypesList, function(type, i) {
				if (type.Name.includes(searchText)) {
					hasMatches = true;
					return textbox.glowLookUpTextBox('createLookUp', type.Id, type.Name, type.Preview, true);
				}
			}));

			if (hasMatches == false) {
				textbox.glowLookUpTextBox('updateSuggestions', [
					textbox.glowLookUpTextBox('createLookUp', '', context.resources.noTypesMatch, context.resources.noTypesMatch, false)
				]);
			}
		} else {
			textbox.glowLookUpTextBox('updateSuggestions', [
				textbox.glowLookUpTextBox('createLookUp', '', context.resources.noTypesMatch, context.resources.noTypesMatch, false)
			]);
		}
	}

	function parseFilter(context) {
		var startDate;
		if ($.telligent.evolution.formatDate($(context.startDateId).glowDateTimeSelector('val')) != '') {
			startDate = $.telligent.evolution.formatDate($(context.startDateId).glowDateTimeSelector('val'));
		}
		else
			startDate = context.startDate;

		var categoryId = null;
		if (context.exceptionType.glowLookUpTextBox('count') > 0) {
			categoryId = context.exceptionType.glowLookUpTextBox('getByIndex', 0).Value;
		}

		return {
			categoryId: categoryId,
			startDate: startDate,
			endDate: $.telligent.evolution.formatDate($(context.endDateId).glowDateTimeSelector('val')),
			minFrequency: context.filter.find('.minFrequency').val(),
			pageIndex: 0,
			sortBy: context.filter.find('.sortBy').val(),
			query: context.searchInput.val(),
			machineName: context.machineNamesSelector.val()
		};
	}

	function buildExportUrl(context, options, selections) {
		if(selections) {
			options.selections = selections.join();
		}
		return $.telligent.evolution.url.modify({
			url: context.exportUrl,
			query: prefix(options || {})
		});
	}

	function handleMultiSelectionUi(context) {
		if(context.selections.length > 0) {
			context.deleteSelectedButton.html(context.deleteSelectedText + ' (' + context.selections.length + ')');
			context.deleteSelectedButton.show();
			context.deSelectAllButton.show();
			context.exportButton.html(context.exportSelectedText + ' (' + context.selections.length + ')');
			context.deleteAllButton.hide();
		} else {
			context.deleteSelectedButton.hide();
			context.deSelectAllButton.hide();
			context.exportButton.html(context.exportAllText);
			context.deleteAllButton.show();
		}
	}

	function filterChange(context) {
		// adjust filter
		context.selections = [];
		context.deleteSelectedButton.html(context.deleteSelectedText);
		context.currentFilter = parseFilter(context);
		context.list.empty();
		context.scrollable.reset();

		context.exceptionTypesList = null;

		handleMultiSelectionUi(context);
	}

	function updateCount(context, deletedItems) {
		context.totalExceptions = context.totalExceptions - deletedItems;
		renderCount(context);
	}

	function renderCount(context) {
		var countHtml = '';

		if (context.totalExceptions == 1) {
			countHtml = context.exceptionsSingularText.replace('{0}', context.totalExceptions);
		}
		else if (context.totalExceptions > 1) {
			countHtml = context.exceptionsPluralText.replace('{0}', context.totalExceptions);
		}
		else {
			countHtml = '<div style="display:hidden"></div>';
		}
		context.exceptionCount.empty().append(countHtml);
	}

	var Model = {
		listExceptions: function(context, options) {
			options.affectedType = context.pluginType;
			return $.telligent.evolution.get({
				url: context.getExceptionsUrl,
				data: prefix(options)
			});
		},
		deleteExceptions: function(context, options) {
			options.affectedType = context.pluginType;
			var data = {
				affectedType: options.affectedType || '',
				exceptionIds: (options.exceptionIds || []).join()
			};

			return $.telligent.evolution.post({
				url: context.deleteExceptionsUrl,
				data: prefix(data)
			});
		}
	};

	var api = {
		register: function(context) {
			// header

			var headerTemplate = $.telligent.evolution.template.compile(context.headerContentTemplateId);
			var headerContent = headerTemplate({});
			$.telligent.evolution.administration.header(headerContent);

			// init
			context.list = $(context.list);
			context.filter = $(context.filter);
			context.selections = [];
			context.deleteSelectedButton = $(context.deleteSelectedButton);
			context.deleteAllButton = $(context.deleteAllButton);
			context.exportButton = $(context.exportButton);
			context.deSelectAllButton = $(context.deSelectAllButton);
			context.searchInput = $(context.searchInputId);
			context.machineNamesSelector = $(context.machineNamesId);
			context.exceptionCount = $(context.exceptionCountId);
			
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
						filterChange(context);
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
					filterChange(context);
				}
			);

			context.exceptionType = $(context.exceptionTypeId)
				.glowLookUpTextBox({
					maxValues: 1,
					onGetLookUps: function(tb, searchText) {
						searchExceptionTypes(context, tb, searchText);
					},
					minimumLookUpLength: 0,
					emptyHtml: '<span>' + context.allExceptionsText + '</span>',
				})			
				.on('glowLookUpTextBoxChange', function() {
					filterChange(context);
				});

				handleMultiSelectionUi(context);

			var searchTimeout;
			context.searchInput.on('input', function(){
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(function() {
					filterChange(context);
				}, 150);
			});

			// filtering
			context.currentFilter = parseFilter(context);
			context.filter.on('change', function(e){
				filterChange(context);
			});

			// paging
			context.scrollable = $.telligent.evolution.administration.scrollable({
				target: context.list,
				load: function(pageIndex) {
					return $.Deferred(function(d) {
						var filter = $.extend({}, context.currentFilter, {
							pageIndex: pageIndex
						});

						Model.listExceptions(context, filter).then(function(r){
							if (!r.list)
								d.reject();

							context.totalExceptions = r.count;
							renderCount(context);

							// if there was more content, resolve it as true to continue loading
							if($.trim(r.list).length > 0) {
								context.list.append(r.list);
								d.resolve();
							} else {
								d.reject();
								// if still the first page, then show the 'no content message'
								if(pageIndex === 0) {
									context.list.append('<div class="message norecords">' + context.noExceptionsText + '</div>');
								}
							}
						}).catch(function(){
							d.reject();
						})
					});
				}
			});

			// multi-selection
			context.list.on('click','input[type="checkbox"]', function(e){
				e.stopPropagation();
			});
			context.list.on('change','input[type="checkbox"]', function(){
				context.selections = [];
				context.list.find('input[type="checkbox"]:checked').each(function(){
					context.selections.push($(this).attr('id'));
				});
				handleMultiSelectionUi(context);
			});

			// delete selected
			context.deleteSelectedButton.on('click', function(e){
				e.preventDefault();
				if(confirm(context.deleteSelectedConfirmText)) {
					$.telligent.evolution.administration.loading(true);
					Model.deleteExceptions(context, {
							exceptionIds: context.selections
						})
						.then(function(){
							$.telligent.evolution.administration.loading(false);
							$.each(context.selections, function(i, id){
								context.list.find('[data-exceptionid="' + id + '"]').remove();
							});
							updateCount(context, context.selections.length);
							context.selections = [];
						})
						.catch(function(){
							$.telligent.evolution.administration.loading(false);
						});
				}
				return false;
			});

			// delete all
			context.deleteAllButton.on('click', function(e){
				e.preventDefault();
				if(confirm(context.deleteAllConfirmText)) {
					$.telligent.evolution.administration.loading(true);
					Model.deleteExceptions(context, {
							affectedType: context.pluginType
						})
						.then(function(){
							$.telligent.evolution.administration.loading(false);
							context.list.empty();
						})
						.catch(function(){
							$.telligent.evolution.administration.loading(false);
						});
				}
				return false;
			});

			// export
			context.exportButton.on('click', function(e){
				e.preventDefault();
				var exportUrl = buildExportUrl(context, context.currentFilter, context.selections);
				if(exportUrl) {
					window.location = exportUrl;
					return false;
				}
			});

			// deselect
			context.deSelectAllButton.on('click', function(e){
				e.preventDefault();
				context.selections = [];
				context.list.find('input[type="checkbox"]').prop('checked', false);
				handleMultiSelectionUi(context);
				return false;
			});


			$.telligent.evolution.messaging.subscribe('export-exception', function(data)
				{
					var exportUrl = buildExportUrl(context, context.currentFilter, [ $(data.target).data('exceptionid') ]);
					if(exportUrl) {
						window.location = exportUrl;
						return false;
					}
				});
			$.telligent.evolution.messaging.subscribe('delete-exception', function(data)
				{
					if(confirm(context.deleteConfirmText)) {
						var selections = [ $(data.target).data('exceptionid') ];
						Model.deleteExceptions(context, {
							exceptionIds: selections
						})
						.then(function(){
							$.telligent.evolution.administration.loading(false);
							$.each(selections, function(i, id){
								context.list.find('[data-exceptionid="' + id + '"]').remove();
							});
							updateCount(context, selections.length);
						})
						.catch(function(){
							$.telligent.evolution.administration.loading(false);
						});
					}
				});

			$.telligent.evolution.messaging.subscribe('exceptions-refresh', function()
				{
					context.list.empty();
					context.scrollable.reset();
				});

			renderCount(context);
			
			
			var categoryId = $.telligent.evolution.url.hashData()['categoryId'];
			if (categoryId) {
			    $.telligent.evolution.get({
    				url: context.urls.lookupTypes,
    				data: context.currentFilter,
    				success: function(response) {
    					if (response && response.ExceptionTypes && response.ExceptionTypes.length >= 1) {
    						context.exceptionTypesList = response.ExceptionTypes;
    						
    						var type = null;
    						for (var i = 0; i < context.exceptionTypesList.length; i++) {
    						    if (context.exceptionTypesList[i].Id == categoryId) {
    						        type = context.exceptionTypesList[i];
    						    }
    						}
    						
    						if (type) {
        						while (context.exceptionType.glowLookUpTextBox('count') > 0) {
        						    context.exceptionType.glowLookUpTextbox('removeByIndex', 0);
        						}
        						
        						context.exceptionType.glowLookUpTextBox('add',
                    		        context.exceptionType.glowLookUpTextBox('createLookUp', type.Id, type.Name, type.Preview, true)
                    		        );
                    		        
                    		    filterChange(context);
    						}
    					}
    				}
    			});
			}
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.exceptionsPanel = api;

})(jQuery, window);