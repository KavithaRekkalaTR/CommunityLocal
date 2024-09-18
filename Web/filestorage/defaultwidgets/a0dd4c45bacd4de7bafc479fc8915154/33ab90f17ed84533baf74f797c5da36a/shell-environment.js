/*
StudioEnvironment

Environment Detection. Currently only detects browser and OS, but will detect more as needed.

This is necessary for cases like keyboard shortcuts that must work around specifics of browser/OS.

API:

*Each is a boolean property*

	StudioEnvironment.os.ios
	StudioEnvironment.os.android
	StudioEnvironment.os.mac
	StudioEnvironment.os.windows
	StudioEnvironment.os.linux
	StudioEnvironment.browser.firefox
	StudioEnvironment.browser.safari
	StudioEnvironment.browser.chrome
	StudioEnvironment.browser.ie
	StudioEnvironment.browser.edge

*/
define('StudioEnvironment', function($, global, undef) {

	var userAgent = global && global.navigator && global.navigator.userAgent
		? global.navigator.userAgent
		: '';

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
	}

	return env;

}, jQuery, window);
