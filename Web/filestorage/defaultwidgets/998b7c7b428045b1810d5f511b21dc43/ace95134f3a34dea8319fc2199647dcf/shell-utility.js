define('Utility', function($, global, undef) {

	var Utility = {
		isFileRequest: function (request) {
			return (request && request.type == 'file');
		}
	};

	return Utility;

}, jQuery, window);
