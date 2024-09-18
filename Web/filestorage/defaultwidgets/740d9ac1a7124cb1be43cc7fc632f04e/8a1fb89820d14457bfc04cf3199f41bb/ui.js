(function ($, global) {
	var api = {
		register: function (options) {
			$.telligent.evolution.administration.header(
				$('<fieldset><ul class="field-list"></ul></fieldset>')
					.append(
						options.showCsvDownloadsLink ?
							$('<a href="' + options.urls.csvDownload + '" class="button download-csv"></a>')
								.html(options.text.downloadCSV)
							:
							null
					)
					.append(
						$('<span></span>').html(options.text.voteCount)
					)
			);

			$.telligent.evolution.administration.scrollable({
				target: options.votesList,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: options.urls.pagedVotes,
							data: {
								w_pageindex: pageIndex
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (items.length > 0) {
								options.votesList.append(items);
								if (r.data('hasmore') === true) {
									d.resolve();
								} else {
									d.reject();
								}
							} else {
								d.reject();
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.pollVotes = api;

})(jQuery, window);
