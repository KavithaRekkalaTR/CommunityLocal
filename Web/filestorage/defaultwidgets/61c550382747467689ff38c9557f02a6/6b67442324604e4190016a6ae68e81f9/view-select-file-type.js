/*
SelectFileTypeView

options:
	template

methods:
	render
*/
define('SelectFileTypeView', function($, global, undef) {

	var defaults = {
		template: ''
	};

	var SelectFileTypeView = function(options) {
		var context = $.extend({}, defaults, options || {});

		return {
			prompt: function(onSelect) {
				var content = $(context.template({}));

				content.on('click','a', function(e){
					e.preventDefault();
					$.glowModal.close();

					if(onSelect) {
						onSelect({
							type: $(e.target).data('type')
						});
					}

					return false;
				});

				var modal = $.glowModal({
					title: 'Select File Type',
					html: content,
					width: 450,
					height: '100%'
				});
			}
		}
	};

	return SelectFileTypeView;

}, jQuery, window);
