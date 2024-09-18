(function ($, global) {
	var downloadsHeader;

	function loadDownloadsPanel(options, fileId, fileName) {
		$.telligent.evolution.administration.open({
			name: options.resources.downloadsOf.replace('{0}', fileName),
			content: $.telligent.evolution.get({
				url: options.urls.downloads,
				data: {
					w_fileid: fileId
				}
			}),
			cssClass: 'contextual-file-downloads'
		});
	}

	function checkNoPosts(options) {
		var list = $('ul.content-list', $.telligent.evolution.administration.panelWrapper());
		if (list.find('li').length == 0) {
			list.append('<div class="message norecords">' + options.resources.noPosts + '</div>');
		}
	}

	var api = {
		register: function (options) {
			options.filesList = $(options.filesListId);
			options.queryText = '';

			$.telligent.evolution.messaging.subscribe('mediafile.filter', function(data){
				var filter = $(data.target).data('filter');
				options.filter = filter;
				options.filesList.empty();
				$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
				options.scrollableResults.reset();
				$(data.target).closest('ul').children('li').removeClass('selected');
				$(data.target).parent().addClass('selected');
				$.telligent.evolution.administration.header();
			});

			$.telligent.evolution.messaging.subscribe('mediafile.downloads', function(data){
				var fileId = $(data.target).data('fileid');
				var filename = $(data.target).data('filename');
				loadDownloadsPanel(options, fileId, filename);
			});

			$.telligent.evolution.messaging.subscribe('mediafile.publish', function(data){
				var fileId = $(data.target).data('fileid');
				var publish = $(data.target).data('publish');

				$.telligent.evolution.post({
					url: options.urls.publishFile,
					data: {
						FileId: fileId,
						Publish: publish
					}
				})
				.then(function() {

					if (publish == "True") {
						$(data.target).data('publish', 'False');
						$(data.target).text(options.resources.unpublish);

						$(data.target).closest('li.file').find('li.attribute-item.status').children('span.value').text(options.resources.published);
						$(data.target).closest('li.file').find('li.attribute-item.status').children('span.value').removeClass('highlight');
					}
					else {
						$(data.target).data("publish", "True");
						$(data.target).text(options.resources.publish);
						$(data.target).closest('li.file').find('li.attribute-item.status').children('span.value').text(options.resources.unpublished);
						$(data.target).closest('li.file').find('li.attribute-item.status').children('span.value').addClass('highlight');
					}
				});
			});

			$.telligent.evolution.messaging.subscribe('mediafile.delete', function(data){
				if (confirm(options.resources.confirmDelete)) {
					var fileId = $(data.target).data('fileid');
					var mediaGalleryId = $(data.target).data('mediagalleryid');
					var redirect = $(data.target).data('redirect');

					$.telligent.evolution.post({
						url: options.urls.deleteFile,
						data: {
							MediaGalleryId: mediaGalleryId,
							FileId: fileId
						}
					})
					.then(function() {
						$.telligent.evolution.notifications.show(options.resources.fileDeleted);

						var elm = $(data.target).closest('li.file');
						elm.slideUp('fast', function() {
							elm.remove();
						});

						if (redirect == 'True') {
							window.location.href = options.urls.mediaGallery;
						}
					});
				}
			});

			var listWrapper = $('ul.content-list', $.telligent.evolution.administration.panelWrapper());

			options.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: listWrapper,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: options.urls.pagedFiles,
							data: {
								w_pageindex: pageIndex,
								w_filter: options.filter,
								w_queryText: options.queryText
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (items.length > 0) {
								listWrapper.append(items);
								if (r.data('hasmore') === true) {
									d.resolve();
								} else {
									d.reject();
								}
							} else {
								d.reject();
							}
							if(pageIndex === 0) {
								checkNoPosts(options);
							}
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});

			var header = $('<div></div>');

			if (options.urls.addFile != '') {
				header.append('<fieldset><ul class="field-list"><li class="field-item"><span class="field-item-input"><a href="' + options.urls.addFile + '" class="button save">' + options.resources.addFile + '</a></span></li></ul></fieldset>');
			}

			var filters = $('<ul class="filter"></ul>');
			filters.append($('<li class="filter-option selected"><a href="#" data-messagename="mediafile.filter" data-filter="">' + options.resources.showAll + '</a></li>'));
			filters.append($('<li class="filter-option"><a href="#" data-messagename="mediafile.filter" data-filter="notpublished">' + options.resources.showUnpublished + '</a></li>'));
			header.append(filters);

			$.telligent.evolution.administration.header(header);

			$('input[type="text"]', $.telligent.evolution.administration.panelWrapper())
				.on('input', function() {
					var queryText = $(this).val();
					global.clearTimeout(options.searchTimeout);
					options.searchTimeout = global.setTimeout(function() {
						if (queryText != options.queryText) {
							options.queryText = queryText;
							options.filesList.empty();
							$('.message.norecords', $.telligent.evolution.administration.panelWrapper()).remove();
							options.scrollableResults.reset();
						}
					}, 125);
				});

			checkNoPosts(options);
		}
	};

	var downloadsApi = {
		register: function (options) {

			downloadsHeader = $('<form><fieldset></fieldset></form>');
			var fieldList = $('<ul class="field-list"></ul>');

			var startDateItem = $('<li class="field-item required startdate"></li>');
			startDateItem.append(
				$('<label class="field-item-header" for="' +  options.inputs.startDateId + '"></label>')
					.text(options.resources.startDate)
			);

			startDateItem.append(
				$('<span class="field-item-input"></span>')
					.append(
						$('<input type="text" id="' + options.inputs.startDateId + '"></a>')
							.attr("style", "width: 90%")
						)
					);

			fieldList.append(startDateItem);

			var endDateItem = $('<li class="field-item required enddate"></li>');
			endDateItem.append(
				$('<label class="field-item-header" for="' +  options.inputs.endDateId + '"></label>')
					.text(options.resources.endDate)
			);

			endDateItem.append(
				$('<span class="field-item-input"></span>')
					.append(
						$('<input type="text" id="' + options.inputs.endDateId + '"></a>')
							.attr("style", "width: 90%")
					)
			);

			fieldList.append(endDateItem);
			downloadsHeader.children().append(fieldList);

			var resultSpan = $('<span></span>');
			if(options.userDownloads == 1) {
				resultSpan.text(options.resources.recordFormat.replace('{0}', options.userDownloads));
			}
			else {
				resultSpan.text(options.resources.recordsFormat.replace('{0}', options.userDownloads));
			}

			var downloadLink = $('<a href="' + options.urls.defaultUrl + '" class="inline-button download-csv"></a>')
				.text(options.resources.downloadCSV);
			if (options.userDownloads == 0) {
				downloadLink.hide();
			}
			else
				downloadLink.show();

			var resultList = $('<ul class="field-list download-results"></ul>');
			var resultItem = $('<li class="field-item"></li>');
			resultItem.append(resultSpan);
			resultItem.append(downloadLink);
			resultList.append(resultItem);
			downloadsHeader.children().append(resultList);

			$.telligent.evolution.administration.header(downloadsHeader);
			var startDate = $('li.startdate input', downloadsHeader);
			var endDate = $('li.enddate input', downloadsHeader);

			startDate.glowDateTimeSelector({
				showPopup: true,
				allowBlankvalue: false,
				pattern: '<1000-3000>-<01-12>-<01-31>',
				yearIndex: 0,
				monthIndex: 1,
				dayIndex: 2
			});

			endDate.glowDateTimeSelector({
				showPopup: true,
				allowBlankvalue: false,
				pattern: '<1000-3000>-<01-12>-<01-31>',
				yearIndex: 0,
				monthIndex: 1,
				dayIndex: 2
			});

			window.setTimeout(function() { startDate.glowDateTimeSelector('val', new Date(options.startDate)); } , 15);
			window.setTimeout(function() { endDate.glowDateTimeSelector('val', new Date(options.endDate)); } , 15);

			startDate.on('glowDateTimeSelectorChange', function () {
				updateDownloadList(options);
			});
			endDate.on('glowDateTimeSelectorChange', function () {
				updateDownloadList(options);
			});

			function updateDownloadList(options) {
				options.startDate = $.telligent.evolution.formatDate(startDate.glowDateTimeSelector('val'));
				options.endDate = $.telligent.evolution.formatDate(endDate.glowDateTimeSelector('val'));

				options.downloadsList.empty();
				options.downloadsScrollableResults.reset();

				$('a.download-csv').attr('href', options.urls.downloadCsvFile + '?fileid=' + options.fileId + '&startdate=' + options.startDate + '&enddate=' + options.endDate);
			};

			options.downloadsList = $(options.inputs.downloadsListId, $.telligent.evolution.administration.panelWrapper());

			options.downloadsScrollableResults = $.telligent.evolution.administration.scrollable({
				target: options.downloadsList,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: options.urls.pagedDownloads,
							data: {
								w_pageindex: pageIndex,
								w_startdate: options.startDate,
								w_enddate: options.endDate
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);
							if (pageIndex == 0) {
								if (items.length == 0) {
									$('a.download-csv').hide();
									$('ul.download-results').find('li.field-item').find('span').text(options.resources.recordsFormat.replace(/\{0\}/g, 0));
								}
								else {
									$('a.download-csv').show();
									if (items.length != 1)
										$('ul.download-results').find('li.field-item').find('span').text(options.resources.recordsFormat.replace(/\{0\}/g, r.data('totalitems')));
									else
										$('ul.download-results').find('li.field-item').find('span').text(options.resources.recordFormat.replace(/\{0\}/g, r.data('totalitems')));
								}
							}

							if (items.length > 0) {
								options.downloadsList.append(items);
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
	$.telligent.evolution.widgets.galleryFileManagement = api;
	$.telligent.evolution.widgets.galleryFileDownloads = downloadsApi;

})(jQuery, window);
