/*

# StudioTabContentView:

Low-level UI-only management of multiple content views

Provides:

 * Rendering new content
 * Switching between rendered contents
 * Updating of content
 * Closing content
 * Exposing a helper API to hosted content for message scoping and DOM element scoping

Provides helper API for tab-specific wrapper and message namespaces, automatically muted when hidden and cleared when closed.

## Constructor

	var tabContentView = new StudioTabContentView(options)

*options:*

 * `container`: required Host container
 * `onCreateContentContainer`: optional function called to generate the wrapper for newly rendered content. When provided, enables StudioTabContentView to ensure all rendered content is wrapped with the same wrapper. When not provided, all content is wrapped in a simple new <div>

## Methods:

### render(key, content)

Adds and/or shows tab content. If key already exists, just shows (and hides others)

	tabContentView.render(key, content);

	tabContentView.render(key);

 * `key`: String key of tabbed content
 * `content`: String content of tab

### updateKey

Replaces the key for a given tabbed content key

	tabContentView.updateKey(oldKey, newKey);

### close

Closes content

	tabContentView.close(key);

## Tabbed Content Helper API

The StudioTabContentView provides a helper API for hosted content to assist with message scoping and DOM element scoping.

### tabNameSpace

Returns an array of namespaces including `$.telligent.evolution.administration.panelNameSpace()` as well as a tab-secific namespace.

	var tabNameSpace = $.telligent.evolution.administration.studioShell.tabNameSpace()

	$.telligent.evolution.messaging.subscribe('my-message', tabNameSpace, function(){
		// handle
	});

Handlers registered with the tabNameSpace will be suppressed while the tab is not visible and unsubscribed when the tab is closed.

### tabWrapper

Returns the wrapper element for the current tab. This is useful is performing selections within the current tab.

	var wrapper = $.telligent.evolution.administration.studioShell.tabWrapper();

### current

Returns the key of currently-rendered content

	tabContentView.current();

*/
define('StudioTabContentView', function($, global, undef) {

	var messaging = $.telligent.evolution.messaging;

	var defaults = {
		container: null,
		onCreateContentContainer: function() {
			return $('<div></div>');
		}
	};

	var StudioTabContentView = function(options){
		var context = $.extend({}, defaults, options || {});
		var currentTabKey = null;

		context.contents = {};

		function renderAndAppend(key, content) {
			var contentContainer = context.onCreateContentContainer()
				.appendTo(context.container);

			context.contents[key] = contentContainer;

			contentContainer.append(content || '').show();

			return context.contents[key];
		}

		function nameSpaceForTab(key) {
			return 'studiotab:' + key;
		}

		$.telligent.evolution.administration.studioShell = {
			tabNameSpace: function(key) {
				var ns = $.telligent.evolution.administration.panelNameSpace();
				ns.push(nameSpaceForTab(key || currentTabKey));
				return ns;
			},
			tabWrapper: function(key) {
				return context.contents[key || currentTabKey];
			}
		};

		return {
			render: function(key, content) {
				currentTabKey = key;

				$.each(context.contents, function(k, v) {
					if(k !== key) {
						messaging.suppress(nameSpaceForTab(k));
						$(v).hide();
					}
				})

				messaging.unsuppress(nameSpaceForTab(key));

				// key already exits
				if(context.contents[key]) {
					// re-render new content
					if(content) {
						$(context.contents[key]).remove();
						return renderAndAppend(key, content);
					// or just show existing content
					} else {
						return $(context.contents[key]).show();
					}
				// show new key/content
				} else {
					return renderAndAppend(key, content);
				}
			},
			updateKey: function(oldKey, newKey) {
				var content = context.contents[oldKey];
				if(content) {
					delete context.contents[oldKey];
					context.contents[newKey] = content;
				}
			},
			close: function(key) {
				if(context.contents[key]) {
					messaging.unsubscribe(nameSpaceForTab(key));
					context.contents[key].remove();
					delete context.contents[key];
				}
			},
			get: function(key) {
				return context.contents[key];
			},
			current: function() {
				return (currentTabKey && context.contents[currentTabKey]) ? currentTabKey : null;
			}
		}
	};

	return StudioTabContentView;

}, jQuery, window);
