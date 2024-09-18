(function($, window, undefined){

	var detectors = {
		'ttf': function() { return true; },
		'otf': function() { return true; },
		'woff': function() { return true; },
		'woff2': function() { return true; },
		'woff2': function() {
			if(!("FontFace" in window)) {
				return false;
			}

			var font = new FontFace('t', 'url( "data:font/woff2;base64,d09GMgABAAAAAADwAAoAAAAAAiQAAACoAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmAALAogOAE2AiQDBgsGAAQgBSAHIBuDAciO1EZ3I/mL5/+5/rfPnTt9/9Qa8H4cUUZxaRbh36LiKJoVh61XGzw6ufkpoeZBW4KphwFYIJGHB4LAY4hby++gW+6N1EN94I49v86yCpUdYgqeZrOWN34CMQg2tAmthdli0eePIwAKNIIRS4AGZFzdX9lbBUAQlm//f262/61o8PlYO/D1/X4FrWFFgdCQD9DpGJSxmFyjOAGUU4P0qigcNb82GAAA" ) format( "woff2" )', {});
			font.load().catch(function(){});

			return font.status == 'loading' || font.status == 'loaded';
		},
		'eot': function() {
			return (!!window.MSInputMethodContext && !!document.documentMode);
		}
	};
	var results = {};

	var api = {
		supports: function(fontFileType) {
			if(!detectors[fontFileType])
				return false;

			var result = results[fontFileType];
			if(result !== undefined) {
				return result;
			}

			result = detectors[fontFileType]();
			results[fontFileType] = result;

			return result;
		}
	}

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.fileViewers = $.telligent.evolution.fileViewers || {};
	$.telligent.evolution.fileViewers.fontSupport = api;

})(jQuery, window)