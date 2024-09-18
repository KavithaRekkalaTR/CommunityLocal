define('Utility', function($, global, undef) {

	var Utility = {
		isFileRequest: function (request) {
			return (request && (
				request.type == 'file' ||
				request.type == 'script' ||
				request.type == 'style'));
		}
	};

	return Utility;

}, jQuery, window);
