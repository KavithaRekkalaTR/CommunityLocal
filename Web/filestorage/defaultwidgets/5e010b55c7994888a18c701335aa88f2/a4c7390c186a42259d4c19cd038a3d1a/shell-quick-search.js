define('QuickSearch', function($, global, undef) {

	var defaults = {
		searchInput: '',
		resultContainer: '',
		template: '',
		overClassName: 'selected',
		activeClassName: '',//'active',
		itemSelector: 'li',
		onSearch: function(query){
			return $.Deferred(function(d){
				d.resolve({
					items: [
						{ type: '', name: '', description: '', url: '' }
					]
				});
			});
		},
		noResultsMessage: 'No Results',
		onResultsShown: function() { },
		onNoResultsShown: function() { },
		onEnter: function() { },
		onSelect: function(item) { },
		onExit: function() { },
		onKeyboardNavigation: function(direction, item) { }
	};

	function debounce(fn, limit) {
		var bounceTimout;
		return function(){
			var scope = this,
				args = arguments;
			clearTimeout(bounceTimout);
			bounceTimout = setTimeout(function(){
				fn.apply(scope, args);
			}, limit || 10);
		}
	};

	function emptyAndHideResults(context) {
		context.resultContainer.empty().hide();
	}

	function init(context) {
		if(context.inited) {
			return false;
		}
		context.inited = true;

		context.resultContainer = $(context.resultContainer);
		context.searchInput = $(context.searchInput).trigger('focus');
		context.template = $.telligent.evolution.template(context.template);

		if(context.onEnter) {
			context.onEnter();
		}

		var selectedIndex = -1;
		var searchTimeout;

		var throttleSearch = debounce(function(){
			var query = context.searchInput.val();
			if(query.length === 0) {
				emptyAndHideResults(context);
				if(context.onNoResultsShown) {
					context.onNoResultsShown(query);
				}
			} else if(query.length >= 2) {
				context.onSearch(query).then(function(r){
					selectedIndex = -1;
					if(context.searchInput.val() == query) {
						if(r.results.length > 0) {
							context.resultContainer.show().html(context.template(r));
							if(context.onResultsShown) {
								context.onResultsShown();
							}
						} else {
							if(context.onNoResultsShown) {
								context.onNoResultsShown(query);
							}
							if(context.noResultsMessage) {
								context.resultContainer.empty().append('<div class="message">' + context.noResultsMessage + '</div>').show();
							}
						}
					}
				});
			}
		}, 100);

		context.resultContainer.on('click', context.itemSelector, function(){
			$(this).addClass(context.activeClassName);
			if(context.onSelect) {
				context.onSelect.call(this);
			}
		});

		context.searchInput.on('focus', function(e){
			$(this).select();
		});

		context.searchInput.on('keydown.search', function(e){
			var currentItems = context.resultContainer.find(context.itemSelector)
			// escape
			if(e.which === 27) {
				emptyAndHideResults(context);
				if(context.onExit) {
					context.onExit();
				}
			// up
			} else if(e.which === 38) {
				if(selectedIndex >= 0) {
					$(currentItems.get(selectedIndex)).removeClass(context.overClassName);
				}
				selectedIndex--;
				if(selectedIndex < 0) {
					selectedIndex = currentItems.length - 1;
				}
				var selectedItem = $(currentItems.get(selectedIndex));
				selectedItem.addClass(context.overClassName);
				if(context.onKeyboardNavigation)
					context.onKeyboardNavigation('up', selectedItem);
			// down
			} else if(e.which === 40) {
				if(selectedIndex >= 0) {
					$(currentItems.get(selectedIndex)).removeClass(context.overClassName);
				}
				selectedIndex++;
				if(selectedIndex >= currentItems.length) {
					selectedIndex = 0;
				}
				var selectedItem = $(currentItems.get(selectedIndex));
				selectedItem.addClass(context.overClassName);
				if(context.onKeyboardNavigation)
					context.onKeyboardNavigation('down', selectedItem);
			// enter
			} else if(e.which === 13) {
				if(selectedIndex >= 0) {
					var currentItem = $(currentItems.get(selectedIndex));
					currentItem.addClass(context.activeClassName);
					if(context.onSelect) {
						context.onSelect.call(currentItem.get(0));
					}
				}
			} else {
				throttleSearch();
			}
		});
	}

	var QuickSearch = function(options) {
		var context = $.extend({}, defaults, options);
		init(context);
	}

	return QuickSearch;

}, jQuery, window);
