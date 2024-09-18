(function($, global, undef) {

	function getSearchResults(context, query, pageIndex) {
		var profileFieldNames = [];
		$.each(query.profileFields, function(key) {
			profileFieldNames.push(getSearchNameForFieldName(context, key));
		});

		$.each(query.profileFields, function(k,v) {
			var searchName = getSearchNameForFieldName(context, k);
			if(searchName !== k) {
				query.profileFields[searchName] = v;
				delete query.profileFields[k];
			}
			query.profileFields[searchName + '_name'] = k;
		});

		var searchQueryData = $.extend({}, query.profileFields, {
			profileFieldNames: profileFieldNames.join(';'),
			query: query.query,
			pageIndex: pageIndex || 0
		});

		return $.telligent.evolution.post({
			url: context.searchUrl,
			data: searchQueryData
		});
	}

	function parseQuery(context) {
		// parse query string, overriding it with current hash
		var urlData = $.telligent.evolution.url.parseQuery(global.location.href);

		$.extend(urlData, $.telligent.evolution.url.hashData());

		var query = {
			query: '',
			profileFields: {}
		};

		$.each(urlData, function(key, val){
			// profile field
			var profileFieldName = getFieldNameForSearchName(context, key);
			if(profileFieldName) {
				query.profileFields[profileFieldName] = urlData[key];
			// search query
			} else if((key == context.queryKey) && (urlData[key] != context.ignoreQuery)) {
				query.query = urlData[key];
			}
		});

		return query;
	}

	function getSearchNameForFieldName(context, name) {
		for(var i = 0; i < context.fields.length; i++) {
			if (context.fields[i].fieldName == name) {
				return context.fields[i].searchFieldName;
			}
		}
		return null;
	}

	function getFieldNameForSearchName(context, name) {
		for(var i = 0; i< context.fields.length; i++) {
			if (context.fields[i].searchFieldName == name) {
				return context.fields[i].fieldName;
			}
		}
		return null;
	}

	function adjustUrl(context, searchQuery, profileFields) {
		// get current query, and combine with new adjustments
		var query = parseQuery(context);
		if(profileFields)
			$.extend(query.profileFields, profileFields);
		if(searchQuery !== null)
			query.query = searchQuery;

		// map to a query-string-serialiable object of the query
		var serializableQuery = {};
		$.each(query.profileFields, function(key, val){
			var searchField = getSearchNameForFieldName(context, key);
			if (searchField) {
				var v = query.profileFields[key];
				if (v && v.toISOString) {
					v = v.toISOString();
				}
				serializableQuery[searchField] = v;
			}
		});
		serializableQuery[context.queryKey] = query.query;

		// affect URL or hashdata, preferring replaceState if available
		if(global.history && global.history.replaceState) {
			var searchUrl = $.telligent.evolution.url.modify({
				query: serializableQuery
			});

			global.history.replaceState({}, 'title', searchUrl);
			searchAndRenderResults(context, true);
		} else {
			$.telligent.evolution.url.hashData(serializableQuery);
		}
	}

	function searchAndRenderResults(context, reset) {
		if(context.loading)
			return;

		context.loading = true;
		context.pageIndex = reset ? 0 : ((context.pageIndex || 0) + 1);

		var query = parseQuery(context);

		getSearchResults(context, query, context.pageIndex).then(function(response) {
			// split out filter form from results before appending, as it contains script and shouldn't be evaluated,
			// but rather raised in a message for the sidebar to render
			var responseParts = response.split('<!--' + context.formId + '-->');
			if(reset) {
				context.resultContainer.empty();
				// raise form content for sidebar to render
				if(responseParts.length > 1) {
					$.telligent.evolution.messaging.publish('telligent.evolution.widgets.peopleSearch.optionsUpdated', {
						filterForm: responseParts[1]
					});
				}
			}

			var items = $(response).find('div.content-item');
			context.hasMore = items.data('hasmore') == 'True';

			if(reset) {
				context.resultContainer.append(responseParts[0]);
				global.scrollTo(0,0);
			} else {
				$(context.thumbnailsContainer).evolutionMasonry('append', items);
			}
			context.loading = false;
		});
	}

	function handleEvents(context) {
		context.resultContainer.on('click', '.content-item', function(e){
			window.location = $(this).data('url');
		});

		$(global).on('hashchange', function(){
			searchAndRenderResults(context, true);
		});

		$(document).on('scrollend', function(){
			if(context.hasMore)
				searchAndRenderResults(context, false);
		});

		$.telligent.evolution.messaging.subscribe('search.ready', function(ctx) {
			ctx.init({
				initialQuery: parseQuery(context).query,
				customResultRendering: true
			});
		});

		$.telligent.evolution.messaging.subscribe('search.query', function(ctx) {
			adjustUrl(context, ctx.value, null);
		});

		$.telligent.evolution.messaging.subscribe('telligent.evolution.widgets.peopleSearch.profileFilter', function(data){
			adjustUrl(context, null, data);
		});
	}

	var api = {
		register: function(context) {
			context.resultContainer = $(context.resultContainer);

			handleEvents(context);
			if(context.initialProfileSearchName) {
				var initialAdjustment = {};
				var fieldName = getFieldNameForSearchName(context, context.initialProfileSearchName);
				if (fieldName) {
					initialAdjustment[fieldName] = context.initialProfileSearchValue;
					adjustUrl(context, '', initialAdjustment);
				}
			} else {
				searchAndRenderResults(context, true);
			}
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.peopleSearch = $.telligent.evolution.widgets.peopleSearch || api;

})(jQuery, window);
