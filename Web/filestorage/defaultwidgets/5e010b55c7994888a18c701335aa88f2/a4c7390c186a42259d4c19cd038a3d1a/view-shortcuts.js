/*
Shortcuts View

options:
	template
	titleText: 'Keyboard Shortcuts',
	listShortcutsText: 'List available shortcuts'
	shortcut

methods:
	show()

Automatically opens in esponse to shortcut or shortcuts.list message recipt

*/
define('ShortcutsView', function($, global, undef) {

	var defaults = {
		template: 'studioShell-shortcuts',
		notificationsTemplate: 'studioShell-shortcutsNotification',
		titleText: 'Keyboard Shortcuts',
		listShortcutsText: 'List available shortcuts',
		shortcuts: ['alt + k']
	};

	var userAgent = global.navigator.userAgent;
	var isVisible;
	var notificationId = '__keyboard_tip';
	var notificationHandle = null;

	var env = {
		os: {
			ios: /(iphone|ipad|ipod)/i.test(userAgent),
			android: /android/i.test(userAgent),
			mac: /macintosh/i.test(userAgent),
			windows: /windows/i.test(userAgent),
			linux: /linux/i.test(userAgent)
		},
		browser: {
			firefox: /firefox/i.test(userAgent),
			safari: /safari/i.test(userAgent) && !(/chrome/i.test(userAgent)),
			chrome: /chrome/i.test(userAgent) && !(/edge/i.test(userAgent)),
			ie: /msie|trident/i.test(userAgent),
			edge: /edge/i.test(userAgent)
		}
	};

	function show(context) {
		if (isVisible)
			return;
		isVisible = true;

		var visibleShortcuts = ($.telligent.evolution.shortcuts.list({ scoped: true }) || []).filter(function(s) {
			return s.description && s.description.length > 0
		});

		if (!visibleShortcuts || visibleShortcuts.length <= 1)
			return;

		var renderedShortcuts = context.template($.extend({}, env, {
			shortcuts: visibleShortcuts
		}));

		var modal = $.glowModal({
			title: context.titleText,
			html: renderedShortcuts,
			width: 550,
			height: '100%',
			onClose: function() {
				isVisible = false;
			}
		});
	}

	function hideNotification(context) {
		global.clearTimeout(notificationHandle);
		$.telligent.evolution.notifications.hide(notificationId);
	}

	function showNotification(context) {
		$.telligent.evolution.notifications.show(context.notificationsTemplate(env), {
			id: notificationId,
			transient: true
		});
	}

	var ShortcutsView = function(options) {
		var context = $.extend({}, defaults, options || {});

		context.template = $.telligent.evolution.template(context.template);
		context.notificationsTemplate = $.telligent.evolution.template(context.notificationsTemplate);

		var render = function(e) {
			if (!e.isInput || e.combination === 'alt + k') {
				show(context);
				return false;
			}
		};

		// show keyboard shortcuts on keyboard combination
		$.telligent.evolution.shortcuts.register(context.shortcuts, render, {
			description: context.listShortcutsText
		});

		// show notification/tip when a control key is pressed without an immediate secondary key
		$(document).on('keydown', function(e) {
			if (e.key == 'Meta' || e.key == 'Alt' || e.key == 'Control') {
				notificationHandle = global.setTimeout(function() {
					showNotification(context);
				}, 100);
			} else {
				hideNotification();
			}
		});

		$(document).on('keyup', function(e) {
			if (e.key == 'Meta' || e.key == 'Alt' || e.key == 'Control') {
				hideNotification(context);
			}
		});

		$(window).on('blur', function(){
			hideNotification(context);
		});

		// support showing keyboard shortcuts on message
		$.telligent.evolution.messaging.subscribe('shortcuts.list', render, { excludeAutoNameSpaces: true });

		return {
			show: function() {
				return show(context);
			}
		}
	};

	return ShortcutsView;

}, jQuery, window);