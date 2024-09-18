/*
StudioTabSwitchView

UI for rendering a switcher for tabs by last used

options
	wrapperTemplate

Methods
	show(tabs)
		where are array of objects, each with `key` and `content`
		if not currently shown, renders
	shown() // returns whether visible
	next() // moves to next item in list
	current() // returns currently selected tab key, if any
	close()
*/
define('StudioTabSwitchView', ['StudioClientResources'], function(clientResources, $, global, undef) {

	var messaging = $.telligent.evolution.messaging;

	var defaults = {
		wrapperTemplate: 'studioShell-tabSwitch',
	};

	function getFirstTabNode(content) {
		return content.find('.recent-tab').first();
	}

	function getNextTabNode(content) {
		return content.next('.recent-tab');
	}

	function select(tabNode) {
		tabNode.addClass('selected');
	}

	function deSelect(tabNode) {
		tabNode.removeClass('selected');
	}

	var StudioTabSwitchView = function(options){
		var context = $.extend({
			shown: false
		}, defaults, options || {});

		context.wrapperTemplate = $.telligent.evolution.template(context.wrapperTemplate);

		return {
			show: function(tabs) {
				context.content = $(context.wrapperTemplate({
					tabs: tabs,
					tabTemplate: context.tabTemplate
				}));
				context.currentTab = getFirstTabNode(context.content);

				$.glowModal({
					title: clientResources.tabSwitchTitle,
					html: context.content,
					width: 350,
					height: '100%'
				});

				context.shown = true;
				this.next();
			},
			shown: function() {
				return context.shown;
			},
			next: function() {
				if(context.currentTab) {
					deSelect(context.currentTab);

					var nextTab = getNextTabNode(context.currentTab);
					if(nextTab == null || nextTab.length == 0) {
						nextTab = getFirstTabNode(context.content);
					}

					select(nextTab);
					context.currentTab = nextTab;
				}
				context.currentTab.next()
				context.content.find('.recent-tab')
			},
			current: function() {
				if(context.currentTab == null || context.currentTab.length == 0) {
					return null;
				} else {
					return context.currentTab.data('key');
				}
			},
			close: function() {
				if(context.shown) {
					$.glowModal.close();
					context.shown = false;
				}
			}
		};
	};

	return StudioTabSwitchView;

}, jQuery, window);
