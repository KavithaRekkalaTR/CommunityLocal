define('HandleState', function($, global, undef) {

	var HandleState = {
		// Not applicable
		Unhandled: 0,
		// Handled
		Handled: 1,
		// Explicitly dened by user confirmation
		UserDenied: 2
	};

	return HandleState;

}, jQuery, window);
