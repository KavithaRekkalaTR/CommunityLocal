(function($, global) {
	function prefix(options) {
		var data = {};
		$.each(options, function(k, v) {
			data['_w_' + k] = v;
		});
		return data;
	}

	function refreshIfValid(context, delay) {
		global.clearTimeout(context.refreshTimeout);
		if (delay === true) {
			context.refreshTimeout = global.setTimeout(function() {
				refreshList(context);
			}, 250);
		} else {
			refreshList(context);
		}
	}

	function refreshList(context) {
		context.lastRenderedQuery = null;
		context.wikisList.empty();
		context.selections = [];
		handleMultiSelectionUi(context);
		context.noResultsWrapper.hide();
		context.scrollable.reset();
	}

	function queriesMatch(queryA, queryB) {
		return (queryA && queryB &&
			queryA.type == queryB.type &&
			queryA.query == queryB.query);
	}

	function listWikis(context, pageIndex) {
		var listQuery = $.extend({}, context.listQueryContext, {
			pageIndex: pageIndex
		});

		return $.telligent.evolution.get({
			url: context.listCallbackUrl,
			data: listQuery
		}).then(function(r){
			return queriesMatch(listQuery, context.listQueryContext) ? r : null;
		});
	}

	function handleMultiSelectionUi(context) {
		if(context.selections.length > 0) {
			context.migrateSelectedButton.html(context.migrateSelectedText + ' (' + context.selections.length + ')');
			context.migrateSelectedButton.show();
			context.deSelectAllButton.show();
			context.migrateAllButton.hide();
		} else {
			context.migrateSelectedButton.hide();
			context.deSelectAllButton.hide();
			context.migrateAllButton.show();
		}
	}

	var Model = {
		listWikis: function(context, options) {
			return $.telligent.evolution.get({
				url: context.getWikisUrl,
				data: prefix(options)
			});
		},
		migrateWikis: function(context, options) {
			var data = {
				progressKey: context.progressKey,
				wikiIds: (options.wikiIds || []).join()
			};

			return $.telligent.evolution.post({
				url: context.migrateWikisUrl,
				data: prefix(data)
			});
		},
		migrateAllWikis: function(context, options) {
			var data = {
				progressKey: context.progressKey
			};

			return $.telligent.evolution.post({
				url: context.migrateAllWikisUrl,
				data: prefix(data)
			});
		}
	};

	function renderProgressIndicator(options, response) {
			$.telligent.evolution.administration.loading(false);
			if (response.progressIndicator) {
				options.wikisWrapper.hide();
				options.showProgressWrapper.empty().show().append('<p>' + options.migrationInProgress + '</p>').append(response.progressIndicator);
			}
	}

	var api = {
		register: function(options) {
			// header

			// init
			var context = $.extend(options, {
				wikisList: $(options.wikisListId),
				wikiCount: $(options.wikiCountId),
				filter: $(options.filter),
				wikisWrapper: $(options.wikisWrapper),
				showProgressWrapper: $(options.showProgressWrapper),
				getProgressWrapper: $(options.getProgressWrapper),
				noResultsWrapper: $(options.noResultsWrapper),
				selections: [],
				migrateSelectedButton: $(options.migrateSelectedButton),
				migrateAllButton: $(options.migrateAllButton),
				deSelectAllButton: $(options.deSelectAllButton),
				migrationInProgress: options.migrationInProgressText,
				refreshButton: $(options.refreshButton),
				nameQuery: $(options.nameQueryId),
				noResults: $(options.noResults),
				listQueryContext: {}
			});

			context.listQueryContext.pageIndex = 0;
			context.listQueryContext.pageSize = 20;
			handleMultiSelectionUi(context);

			context.startScrollable = function() {
				if (context.scrollable) {
					context.wikisList.empty();
					context.scrollable.reset();
				} else {
					context.scrollable = $.telligent.evolution.administration.scrollable({
						target: context.wikisList,
						load: function(pageIndex) {
							return $.Deferred(function(d) {
								listWikis(context, pageIndex).then(function(r){
									if (!r.list)
										d.reject();
									context.wikiCount.empty().append(r.count);
									if($.trim(r.list).length > 0) {
										context.wikisList.append(r.list);
										d.resolve();
									} else {
										d.reject();
										if (pageIndex === 0) {
											context.wikisList.append('<div class="message norecords">' + context.noResults + '</div>');
										}
									}
								}).catch(function(){
									d.reject();
								});
							});
						}
					});
				}
			};

			// searching
			var searchTimeout;
			context.nameQuery.on('input', function(){
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(function() {
					context.listQueryContext.nameQuery = context.nameQuery.val();
					context.wikisList.empty();
					context.scrollable.reset();
				}, 150);
			});

			// multi-selection
			context.wikisList.on('change','input[type="checkbox"]', function(){
				context.selections = [];
				context.wikisList.find('input[type="checkbox"]:checked').each(function(){
					context.selections.push($(this).val());
				});
				handleMultiSelectionUi(context);
			});

			// migrate selected
			context.migrateSelectedButton.on('click', function(e){
				e.preventDefault();
				if(confirm(context.migrateSelectedConfirmText)) {
					$.telligent.evolution.administration.loading(true);
					Model.migrateWikis(context, {
							wikiIds: context.selections
						})
						.then(function(response){
							renderProgressIndicator(context, response);
						})
						.catch(function(){
							$.telligent.evolution.administration.loading(false);
						});
				}
				return false;
			});

			// migrate all
			context.migrateAllButton.on('click', function(e){
				e.preventDefault();
				if(confirm(context.migrateAllConfirmText)) {
					$.telligent.evolution.administration.loading(true);
					Model.migrateAllWikis(context)
						.then(function(response){
							renderProgressIndicator(context, response);
						})
						.catch(function(){
							$.telligent.evolution.administration.loading(false);
						});
				}
				return false;
			});

			// deselect
			context.deSelectAllButton.on('click', function(e){
				e.preventDefault();
				context.selections = [];
				context.wikisList.find('input[type="checkbox"]').prop('checked', false);
				handleMultiSelectionUi(context);
				return false;
			});

			// refresh
			context.refreshButton.on('click', function(e){
				refreshList(context);
				return false;
			});

			$.telligent.evolution.messaging.subscribe('scheduledFile.complete', function (data) {
			if (data.progressKey == options.progressKey) {
					$.telligent.evolution.notifications.show(options.migrationSuccessfulText, { type: 'success' });
					$.telligent.evolution.administration.loading(false);
					refreshList(options);
					options.showProgressWrapper.hide();
					options.getProgressWrapper.hide();
					options.wikisWrapper.show();
				}
			});

			$.telligent.evolution.messaging.subscribe('scheduledFile.error', function (data) {
			if (data.progressKey == options.progressKey) {
					$.telligent.evolution.administration.loading(false);
					refreshList(options);
					options.showProgressWrapper.hide();
					options.getProgressWrapper.hide();
					options.wikisWrapper.show();
				}
			});
		}
	};


	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.pluginWikiMigrations = api;

})(jQuery, window);