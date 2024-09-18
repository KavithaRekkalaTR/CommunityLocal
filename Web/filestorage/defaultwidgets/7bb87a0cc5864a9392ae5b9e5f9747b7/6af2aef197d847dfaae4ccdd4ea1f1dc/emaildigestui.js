(function($)
{
	if (typeof $.telligent === 'undefined')
	        $.telligent = {};

	if (typeof $.telligent.evolution === 'undefined')
	    $.telligent.evolution = {};

	if (typeof $.telligent.evolution.widgets === 'undefined')
	    $.telligent.evolution.widgets = {};

	if (typeof $.telligent.evolution.widgets.editUser === 'undefined')
	    $.telligent.evolution.widgets.editUser = {};

	var _more = function(context) {
		$.telligent.evolution.get({
			url: context.moreUrl,
			data: {
				w_pageIndex: context.pageIndex,
				w_pageSize: context.pageSize,
				w_userId: context.userId
			},
			success: function(response)
			{
				$('#' + context.tableBodyId).append(response);
				context.groupCountAdded += context.pageSize;
				if(context.groupCountAdded >= context.totalCount)
					$('#' + context.moreId).hide();
				context.pageIndex++;
			}
		});
	};

	$.telligent.evolution.widgets.editUser.emailDigest = {
		register: function(context) {
			var w = $('#' + context.wrapperId);
			context.pageIndex = 0;
			context.groupCountAdded = 0;
			context.joinlessGroupCountAdded = 0;

			_more(context);
			$('#' + context.moreId, w).on('click', function() {
				_more(context);
			});

			$('#' + context.wrapperId).on('change', 'select.email-digest', function() {
				var e = $(this);
				$.telligent.evolution.post({
					url: context.updateUrl,
					data: {
						subscriptionId: e.data('subscriptionid'),
						frequency: e.val(),
						context: e.data('context'),
						contextId: e.data('contextid')
					},
					success: function(d) {
						if (d.warnings && d.warnings.length > 0) {
							$.telligent.evolution.notifications.show(d.warnings[0], {type: 'warning', duration: 5000});
						}
					}
				});
			});
		}
	};
})(jQuery);
