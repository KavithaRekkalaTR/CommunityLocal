/*
StudioApiDocumentation

Renders API documentation.

Designed to be instantiated within a dock, but is intended to be instantiated
multiple times, for different widgets which potentially expose different
sets of APIs.


*/
define('StudioApiDocumentation', ['StudioUtility'], function(StudioUtility, $, global, undef) {

	var defaults = {
		template: '',
		breadCrumbTemplate: '',
		fragmentId: null,
		container: null,
		getRendered: function(options) {},
		getRenderedType: function(options) {},
		getRenderedIndex: function(options) {},
		getStaticContent: function(options) {},
		includeAutomationEvents: false
	};

	function initUi(context) {
		context.wrapper = $(context.template({
			fragmentId: context.fragmentId
		}));
		context.container.append(context.wrapper);

		context.documentationForm = context.wrapper.find('.documentation-form').first();
		context.documentationIndex = context.wrapper.find('.documentation-index').first();
		context.documentationBreadcrumbs = context.wrapper.find('.documentation-breadcrumbs').first();
		context.documentationDetail = context.wrapper.find('.documentation-detail').first();
		context.documentationContent = context.wrapper.find('.documentation-content').first();
		context.documentationMaster = context.wrapper.find('.documentation-master').first();

		context.getRenderedIndex({
			fragmentId: context.fragmentId,
			includeAutomationEvents: context.includeAutomationEvents
		}).then(function(r){
			context.documentationForm.empty().append(r.select);
			context.documentationIndex.empty().append(r.general);
			initSearch(context);
			// if not already loading a specific item,  pre-load the index
			if(!context.loadingSpecificItem)  {
				renderContent(context, r.index, {
					displayName: 'All',
					type: 'index',
					name: 'index'
				});
			}
		});
	}
	/*
	breadCrumbOptions
		displayName
		type
		name
	*/
	function renderContent(context, content, breadCrumbOptions) {
		// adjust breadcrumbs
		var alreadyInList = false;
		if(breadCrumbOptions) {
			if(!breadCrumbOptions.mode)
				breadCrumbOptions.mode = 'velocity';
			context.documentationBreadcrumbs.find('a.documentation-link').each(function(){
				var link = $(this);
				// remove links that come after a link already in the list
				if(alreadyInList) {
					link.remove();
				}
				if(link.data('type') === breadCrumbOptions.type && link.data('name') === breadCrumbOptions.name) {
					alreadyInList = true;
				}
			});
			if(!alreadyInList) {
				if(breadCrumbOptions.mode != 'velocity') {
					context.documentationBreadcrumbs.find('a.documentation-link').each(function(){
						var link = $(this);
						if(link.data('type') !== 'index') {
							link.remove();
						}
					});
				}

				context.documentationBreadcrumbs.append(context.breadCrumbTemplate(breadCrumbOptions));
			}
		}

		context.documentationContent.empty().append(content);
		scrollContentToTop(context);
	}

	function handleEvents(context) {
		context.wrapper.on('click', '.documentation-link', function(e){
			e.preventDefault();

			loadLink(context, $(e.target));

			return false;
		});

		context.documentationForm.on('change','select.documentation-navigator', function(e){

			// remove all non-index breadcrumbs if navigating to a new member from the navigator
			context.documentationBreadcrumbs.find('a.documentation-link').each(function(){
				var link = $(this);
				if(link.data('type') !== 'index') {
					link.remove();
				}
			});

			var values = $(e.target).val().split(':');
			var mode = values[0];
			var name = values[1];
			var displayName = mode == 'velocity' ? ('$' + name) : name;

			loadDocumentationItem(context, 'extension', name, displayName, null, mode);
		});
	}

	function scrollContentToTarget(context, target) {
		var targetElm = context.documentationContent.find('a[name="' + target + '"],[id="' + target + '"]');
		StudioUtility.scrollContainerToFocusOnSelection(context.documentationDetail, targetElm, 50);
	}

	function scrollIndexToTop(context) {
		context.documentationMaster.animate({
			scrollTop: 0
		}, 150);
	}

	function scrollContentToTop(context) {
		context.documentationDetail.animate({
			scrollTop: 0
		}, 150);
	}

	function initSearch(context) {
		context.documentationForm
			.find('select.documentation-navigator')
			.selectSearch({});
	}

	function loadDocumentationItem(context, type, name, displayName, target, mode) {
		mode = mode || 'velocity';
		context.loadingSpecificItem = true;
		switch(type) {
			case 'index':
				// if not already loaded and rendered...
				if(!context.currentContent ||
					context.currentContent.type != 'index' ||
					context.currentContent.name != 'index')
				{
					context.getRenderedIndex({
						fragmentId: context.fragmentId,
						mode: mode,
						includeAutomationEvents: context.includeAutomationEvents
					}).then(function(r){
						context.currentContent = {
							type: 'index',
							name: 'index'
						};
						renderContent(context, r.index, {
							displayName: 'All',
							type: 'index',
							name: 'index',
							mode: mode
						});
						initSearch(context);
						scrollContentToTarget(context, target);
						context.documentationIndex.empty().append(r.general);
						scrollIndexToTop(context);
					});
				} else if(target) {
					scrollContentToTarget(context, target);
				}
				break;
			case 'extension':
			case 'event':
				// if not already loaded and rendered...
				if(!context.currentContent ||
					context.currentContent.type != 'extension' ||
					context.currentContent.type != 'event' ||
					context.currentContent.name != name)
				{
					context.getRendered({
						name: name,
						fragmentId: context.fragmentId,
						mode: mode
					}).then(function(r){
						context.currentContent = {
							type: type,
							name: name
						};
						// apply extensino content (with appropriately adjusted bread crumb trail)
						renderContent(context, r.member, {
							displayName: name,
							type: type,
							name: name,
							mode: mode
						});
						scrollContentToTarget(context, target);
						// apply index of extension
						context.documentationIndex.empty().append(r.index);
						scrollIndexToTop(context);
					});
				} else if(target) {
					scrollContentToTarget(context, target);
				}
				break;
			case 'type':
				// if not already loaded and rendered...
				if(!context.currentContent ||
					context.currentContent.type != 'type' ||
					context.currentContent.name != name)
				{
					var displayName = displayName || name;
					context.getRenderedType({
						name: name,
						mode: mode
					}).then(function(r){
						context.currentContent = {
							type: 'type',
							name: name
						};
						// apply type content (with appropriately adjusted bread crumb trail)
						renderContent(context, r.type, {
							displayName: displayName,
							type: 'type',
							name: name,
							mode: mode
						});
						scrollContentToTarget(context, target);
						// apply index of type
						context.documentationIndex.empty().append(r.index);
						scrollIndexToTop(context);
					});
				} else if(target) {
					scrollContentToTarget(context, target);
				}
				break;
			case 'static':
				// if not already loaded and rendered...
				if(!context.currentContent ||
					context.currentContent.type != 'static' ||
					context.currentContent.name != name)
				{
					context.getStaticContent({
						resource: name
					}).then(function(r){
						context.currentContent = {
							type: 'static',
							name: name
						};
						// apply extensino content (with appropriately adjusted bread crumb trail)
						renderContent(context, r.content);
						scrollContentToTarget(context, target);
					});
				}
		}
	}

	function loadLink(context, link) {
		loadDocumentationItem(context, link.data('type'), link.data('name'), link.html(), link.data('target'), link.data('mode'));
	}

	var StudioApiDocumentation = function(options) {
		var context = $.extend({}, defaults, options || {});
		this.context = context;
		context.container = options.container;

		initUi(context);
		handleEvents(context);
	};
	StudioApiDocumentation.prototype.hide = function(){
		this.context.wrapper.hide();
	};
	StudioApiDocumentation.prototype.show = function(options) {
		this.context.wrapper.show();
		// if passed options, potentially pre-navigate to specific items
		if(options) {
			if(this.context.documentationBreadcrumbs) {
				// remove all non-index breadcrumbs if navigating to a new member from the navigator
				this.context.documentationBreadcrumbs.find('a.documentation-link').each(function(){
					var link = $(this);
					if(link.data('type') !== 'index') {
						link.remove();
					}
				});
			}
			loadDocumentationItem(this.context,
				options.type,
				options.name,
				options.displayName,
				options.target,
				options.mode);
		}
	};

	return StudioApiDocumentation;

}, jQuery, window);


// Converts Select to a type-ahead, supporting optgroups.
// Legacy module from widget studio v1
(function($, global, undefined){

	var buildContext = function(select, options){
			var context = {
				select: select,
				options: [],
				settings: options
			};

			select.find('option').each(function(){
				var elm = $(this),
					parent = elm.parent(),
					opt = {
						value: elm.attr('value'),
						text: elm.html(),
						group: parent.is('optgroup') ? parent.attr('label') : null
					};
					opt.searchableText = (opt.value + ' ' + opt.text + ' ' + (opt.group || '')).toLowerCase();
				if(opt.value.length > 0)
					context.options.push(opt);
			});

			return context;
		},
		buildUi = function(context) {
			context.input = $('<input type="text" placeholder="' + context.settings.searchText + '" />').css({
				//width: context.select.outerWidth(),
				position: 'relative'
			}).insertBefore(context.select);

			context.selector = new Selector(context.input, function(selection) {
				context.select.val(selection.value);
				context.select.trigger('change');
				context.selector.hide();
				context.input.trigger('blur');
			});

			// set up clear link
			context.input.wrap('<div></div>');
			var wrapper = context.input.parent().css({ position: 'relative' });

			context.select.hide();
		},
		handleEvents = function(context) {
			context.input.on({
				input: function(e) {
					var value = context.input.val(),
						groupedOptions = groupOptions(context, value.length > 0 ? filterOptions(context, value, 20) : []);
					context.selector.show(groupedOptions);
				},
				focus: function(e) {
					var value = context.input.val(),
						groupedOptions = groupOptions(context, value.length > 0 ? filterOptions(context, value, 20) : []);
					context.selector.show(groupedOptions);
				},
				blur: function(e) {
					setTimeout(function(){
						context.selector.hide();
					}, 500);
				}
			});
		},
		filterOptions = function(context, query, limit) {
			var queryWords = (query.toLowerCase() || '').split(' '), i, word;
			var matchedOptions = $.grep(context.options, function(opt) {
				var matches = true;
				for(i = 0; i < queryWords.length; i++) {
					word = queryWords[i];
					if(word === null || word.length === 0)
						continue;
					if(opt.searchableText.indexOf(queryWords[i]) < 0) {
						matches = false;
					}
				}
				return matches;
			});
			if(matchedOptions.length > limit)
				matchedOptions = matchedOptions.slice(0, limit);
			return matchedOptions;
		},
		groupOptions = function(context,options) {
			var groups = [];

			var buildGroup = function(name) {
				var group = {
					name: name,
					options: []
				};
				groups.push(group);
				return group;
			};
			var ungrouped = buildGroup(context.settings.uncategorizedText);
			var currentGroup = buildGroup(null);

			$.each(options, function(i, opt) {
				if(opt.group) {
					if(!currentGroup.name) {
						currentGroup.name = opt.group;
					} else if(currentGroup.name !== opt.group){
						currentGroup = buildGroup(opt.group);
					}
					currentGroup.options.push(opt);
				} else {
					ungrouped.options.push(opt);
				}
			});

			return $.grep(groups, function(g) { return g.options.length > 0; });
		};

	$.fn.selectSearch = function(options) {
		var options = $.extend({}, $.fn.selectSearch.defaults, options || {});
		return this.each(function(){

			if(!$(this).data('_selectSearchInited')) {
				$(this).data('_selectSearchInited', true);

				var context = buildContext($(this), options);
				buildUi(context);
				handleEvents(context);
			}

		});
	};
	$.fn.selectSearch.defaults = {
		searchText: 'Go to...',
		uncategorizedText: 'Uncategorized'
	};

	var Selector = (function(){
		var template = $.telligent.evolution.template.compile('' +
			'<ul class="select_searcher_options">' +
			'  <% foreach(groups, function(group) { %>' +
			'	 <li><h4><%: group.name %></h4><ul>' +
			'	 <% foreach(group.options, function(option) { %>' +
			'	   <li><a href="#" data-option="<%: option.value %>"><%: option.text %></a></li>' +
			'	 <% }); %>' +
			'	 </ul></li>' +
			'  <% }); %>' +
			'</ul>'),
			highlight = function(index, container) {
				var links = container.find('a');
				if(index + 1 > links.length) {
					index = 0;
				} else if(index < 0) {
					index = links.length - 1;
				}

				var highlightableLink = $(links.removeClass('highlight')[index]);
				highlightableLink.addClass('highlight');

				return index;
			};

		function Selector(input, onSelect) {
			this.open = false;
			this.currentSelectionIndex = 0;

			this.container = $('<div class="select_searcher"></div>').css({
				width: input.outerWidth() - 20
			}).insertAfter(input).hide();

			var self = this;

			input.on('keydown', function(e){
				if (e.which === 27) { // esc
					input.val('');
				}

				if(!self.open) { return; }

				if(e.which === 9 || e.which === 13) { // tab or enter selects
					e.preventDefault();
					select(self.container.find('a.highlight'));
					return false;
				} else if (e.which === 38) { // up
					e.preventDefault();
					self.currentSelectionIndex--;
					self.currentSelectionIndex = highlight(self.currentSelectionIndex, self.container);
					return false;
				} else if (e.which === 40) { // down
					e.preventDefault();
					self.currentSelectionIndex++;
					self.currentSelectionIndex = highlight(self.currentSelectionIndex, self.container);
					return false;
				}
			});

			var select = function(link){
				if(link !== null && link.length === 1) {
					var data = { name: link.html(), value: link.data('option') };
					input.val('');
					onSelect(data);
				}
			};

			this.container.on('click', 'a', function(e){
				e.preventDefault();
				select($(e.target));
			});
		};

		Selector.prototype.show = function(groupedOptions) {
			this.open = true;
			if(groupedOptions.length > 0) {
				this.container.html(template({ groups: groupedOptions })).show();
				this.currentSelectionIndex = highlight(this.currentSelectionIndex, this.container);
			} else {
				this.hide();
			}
		};

		Selector.prototype.hide = function() {
			this.open = false;
			this.container.hide().html('');
		};

		return Selector;
	})();


}(jQuery, window))
