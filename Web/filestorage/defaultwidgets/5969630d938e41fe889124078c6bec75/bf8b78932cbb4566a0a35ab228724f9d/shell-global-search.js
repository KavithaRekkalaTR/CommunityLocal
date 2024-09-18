/*
*/
define('GlobalSearch', ['StudioStorageProxy'], function(StudioStorageProxy, $, global, undef) {

	var defaults = {
		container: null,
		globalSearchTemplate: '',
		globalSearchResultTemplate: '',
		globalSearchResultOverviewTemplate: '',
		globalSearchResultLoadingTemplate: '',
		onNavigate: function(request)  {},
		onSearch: function(options) {}
	};

	var messaging = $.telligent.evolution.messaging;
	var scrollEndMessage = 'fragment.search.scrollend';

	function initUi(context) {
		context.wrapper = $(context.globalSearchTemplate({}));
		context.container.append(context.wrapper);

		context.queryInput = context.wrapper.find('.global-search-input-query');
		context.searchSubmit = context.wrapper.find('.global-search-submit');
		context.caseSensitiveInput = context.wrapper.find('.global-search-case-sensitive-input');
		context.regExInput = context.wrapper.find('.global-search-regex-input');
		context.componentScopeInputs = context.wrapper.find('.global-search-component-scopes input[type="checkbox"]');
		context.stagedOnlyInput = context.wrapper.find('.global-search-regex-only-staged');
		context.themeSelect = context.wrapper.find('.theme-select');
		context.providerSelect = context.wrapper.find('.provider-select');
		context.currentWidgetSelectOption = context.providerSelect.find('option[value="current"]');
		context.resultsListWrapper = context.wrapper.find('.global-search-output');
		context.resultsList = context.wrapper.find('.global-search-results');
		removeCurrentWidgetOption(context);
	}

	function removeCurrentWidgetOption(context) {
		context.currentWidgetSelectOption.remove();
	}

	function addCurrentWidgetOption(context) {
		context.currentWidgetSelectOption.prependTo(context.providerSelect);
	}

	function handleEvents(context) {
		context.searchSubmit.on('click', function(e) {
			e.preventDefault();

			runSearch(context);

			return false;
		});

		context.queryInput.on('keydown', function(e){
			if(e.which === 13) {
				runSearch(context);
				return false;
			}
		})

		context.resultsList.on('click', '.search-result-item', function(e){
			context.onNavigate($(this).data('request'));
		});

		$(context.resultsListWrapper).off('scrollend').on('scrollend', function(){
			messaging.publish(scrollEndMessage);
		});
	}

	function runSearch(context) {
		// raw search query
		var queryValue = $.trim(context.queryInput.val());
		if(!queryValue || queryValue.length === 0) {
			return false;
		}

		// determine component scopes
		var componentScopes = [];
		context.componentScopeInputs.filter(':checked').each(function(){
			componentScopes.push($(this).val())
		});

		var queryOptions = {
			query: queryValue,
			pageSize: 50,
			pageIndex: 0,
			caseSensitive: context.caseSensitiveInput.is(':checked'),
			regEx: context.regExInput.is(':checked'),
			componentScopes: componentScopes.join(',')
		};

		// staged only
		if(context.stagedOnlyInput.is(':checked')) {
			queryOptions.isStaged = true;
		}

		var providerSelectVal = context.providerSelect.val();
		// if "current widget" selected, scope to that widget's id/theme
		if (providerSelectVal == 'current' && context.currentWidget) {
			queryOptions.themeId = context.currentWidget.theme;
			queryOptions.instanceIdentifier = context.currentWidget.id;
		// otherwise, search all with filter selections
		} else {
			// theme select
			if(context.themeSelect.val() !== 'all') {
				queryOptions.themeId = context.themeSelect.val();
			}

			// state or provider selection
			if (providerSelectVal == 'all-themepage') {
				queryOptions.scriptable = false;
			} else if (providerSelectVal != 'all-global') {
				if(providerSelectVal.indexOf(':') > 0) {
					var selectType = "Provider";
					queryOptions.factoryDefaultProvider = providerSelectVal.split(':')[1];
				} else {
					queryOptions.state = providerSelectVal;
				}
			}
		}

		context.currentQuery = queryOptions;
		context.resultsList.empty();

		initInfiniteLoading(context, function(pageIndex){
			return $.Deferred(function(d){
				queryOptions.pageIndex = pageIndex;
				context.onSearch(queryOptions).then(function(r){
					// no longer current query, so ignore results
					if($.param(context.currentQuery) != $.param(queryOptions)) {
						return;
					}

					// render overview if first page of results
					if(r.PageIndex == 0) {
						context.resultsList.append(context.globalSearchResultOverviewTemplate(r));
					}
					context.resultsList.append(context.globalSearchResultTemplate(r));
					// continue paging if there are more remaining
					if(((r.PageIndex + 1) * r.PageSize) >= r.TotalCount) {
						d.reject();
					} else {
						d.resolve();
					}
				});
			});
		}, queryOptions.query);
	}

	function initInfiniteLoading(context, onLoad, query) {
		context.resultsList.evolutionScrollable({
			load: function(pageIndex) {
				return onLoad(pageIndex).then(function(){
					return true;
				});
			}
		})
	}

	function renderResults(context, results) {
		context.resultsList.empty().append(context.globalSearchResultTemplate(results));
	}

	function loadInitialState(context) {
	}

	var GlobalSearch = function(options) {
		var context = $.extend({}, defaults, options || {});
		this.context = context;

		context.storageProxy = new StudioStorageProxy($.telligent.evolution.user.accessing);

		initUi(context);
		handleEvents(context);
		loadInitialState(context);
	};
	GlobalSearch.prototype.setCurrentWidget = function(widgetState) {
		if(widgetState && widgetState.id) {
			this.context.currentWidget = widgetState;
			addCurrentWidgetOption(this.context);
		} else {
			this.context.currentWidget = null;
			removeCurrentWidgetOption(this.context);
		}
	};

	return GlobalSearch;

}, jQuery, window);
