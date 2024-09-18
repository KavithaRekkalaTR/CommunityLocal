(function ($, global) {
	var headerList = null, listWrapper = null;
	var leadersHeader = null;
	var spinner = '<span class="ui-loading" width="48" height="48"></span>'

	function searchRoles(context, textbox, searchText) {
		window.clearTimeout(context.roleLookupTimeout);
		if (searchText && searchText.length >= 2) {
			textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)]);
			context.roleLookupTimeout = window.setTimeout(function () {
				$.telligent.evolution.get({
					url: context.urls.lookupRoles,
					data: { w_SearchText: searchText },
					success: function (response) {
						if (response && response.matches.length > 1) {
							var suggestions = [];
							for (var i = 0; i < response.matches.length; i++) {
								var item = response.matches[i];
								if (item && item.roleId) {
									suggestions.push(textbox.glowLookUpTextBox('createLookUp', item.roleId, item.title, item.title, true));
								}
							}

							textbox.glowLookUpTextBox('updateSuggestions', suggestions);
						}
						else
							textbox.glowLookUpTextBox('updateSuggestions', [textbox.glowLookUpTextBox('createLookUp', '', context.resources.noRolesMatch, context.resources.noRolesMatch, false)]);
					}
				});
			}, 749);
		}
	}

	function loadLeadersPanel(options, leaderboardId, leaderboardName) {
		$.telligent.evolution.administration.open({
			name: options.resources.leadersOf.replace('{0}', leaderboardName),
			content: $.telligent.evolution.get({
				url: options.urls.leaders,
				data: {
					w_leaderboardid: leaderboardId
				}
			}),
			cssClass: 'contextual-leaderboard-leaders'
		});
	}

	var api = {
		register: function (options) {

			options.leaderboardsList = $(options.leaderboardsListId);

			if (options.canCreate) {

				headerList = $('<ul class="field-list"></ul>')
					.append(
						$('<li class="field-item submit"></li>')
							.append(
								$('<span class="field-item-input"></span>')
									.append(
										$('<a href="#"></a>')
											.addClass('button add-leaderboard')
											.text(options.resources.addLeaderboard)
							)
						)
					);
				$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(headerList).wrap('<form></form>').parent());

				$('a.add-leaderboard').on('click', function(){
					$.telligent.evolution.administration.open({
						name: options.resources.addLeaderboard,
						content: $.telligent.evolution.get({
								url: options.urls.editLeaderboard
							}),
						cssClass: 'administration-leaderboards-edit'
					});

					return false;
				});
			}

			$.telligent.evolution.messaging.subscribe('contextual.leaderboard.leaders', function(data){
				var id = $(data.target).data('id');
				var name = $(data.target).data('name');
				loadLeadersPanel(options, id, name);
			});

			$.telligent.evolution.messaging.subscribe('contextual.leaderboard.edit', function (data) {
				var id = $(data.target).data('id');
				var name = $(data.target).data('name');
				$.telligent.evolution.administration.open({
					name: options.resources.editLeaderboard.replace('{0}', name),
					content: $.telligent.evolution.get({
							url: options.urls.editLeaderboard,
							data: {
								w_id: id
							}
						}),
					cssClass: 'administration-leaderboards-edit'
				});

				return false;
			});

			$.telligent.evolution.messaging.subscribe('contextual.leaderboard.delete', function(data){
				if (confirm(options.resources.confirmDelete)) {
					var id = $(data.target).data('id');

					$.telligent.evolution.post({
						url: options.urls.delete,
						data: {
							w_id: id
						}
					})
					.then(function() {
						var elm = $(data.target).closest('li.leaderboard');
						elm.slideUp('fast', function() {
							elm.remove();
						});
					});
				}
			});

			listWrapper = $('ul.content-list', $.telligent.evolution.administration.panelWrapper());

			options.scrollableResults = $.telligent.evolution.administration.scrollable({
				target: listWrapper,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: options.urls.pagedLeaderboards,
							data: {
								w_pageindex: pageIndex,
								w_filter: options.filter
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
						})
						.catch(function () {
							d.reject();
						});
					});
				}
			});
		}
	};

	var editApi = {
		register: function (options) {
			headerList = $('<ul class="field-list"></ul>')
				.append(
					$('<li class="field-item"></li>')
						.append(
							$('<span class="field-item-input"></span>')
								.append(
									$('<a href="#"></a>')
										.addClass('button save')
										.text(options.resources.save)
						)
					)
				);

			$.telligent.evolution.administration.header($('<fieldset></fieldset>').append(headerList).wrap('<form></form>').parent());

			var viewidentifiers = $('a.viewidentifiers', $.telligent.evolution.administration.panelWrapper());
			viewidentifiers.on('click', function () {
				$('li.identifiers', $.telligent.evolution.administration.panelWrapper()).each( function() {
					$(this).toggle();
				});

				return false;
			});

			$(options.inputs.timePeriodTypeId).change(function () {
				if ($(this).val() == "AllTime") {
					$('.field-item.time-startdate', $.telligent.evolution.administration.panelWrapper()).hide();
					$('.field-item.time-enddate', $.telligent.evolution.administration.panelWrapper()).hide();
					$('.field-item.rolling-time', $.telligent.evolution.administration.panelWrapper()).hide();
				} else if ($(this).val() == "Static") {
					$('.field-item.time-startdate', $.telligent.evolution.administration.panelWrapper()).show();
					$('.field-item.time-enddate', $.telligent.evolution.administration.panelWrapper()).show();
					$('.field-item.rolling-time', $.telligent.evolution.administration.panelWrapper()).hide();
				}
				else {
					$('.field-item.time-startdate', $.telligent.evolution.administration.panelWrapper()).hide();
					$('.field-item.time-enddate', $.telligent.evolution.administration.panelWrapper()).hide();
					$('.field-item.rolling-time', $.telligent.evolution.administration.panelWrapper()).show();
				}
			});

			$(options.inputs.startDateId).glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: false,
					})
			);

			$(options.inputs.endDateId).glowDateTimeSelector(
				$.extend(
		  {},
		  $.fn.glowDateTimeSelector.dateTimeDefaults, {
			  showPopup: true,
			  allowBlankvalue: false,
		  })
			);

			$(options.inputs.displayStartDateId).glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: true,
					})
			);

			$(options.inputs.displayEndDateId).glowDateTimeSelector(
				$.extend(
					{},
					$.fn.glowDateTimeSelector.dateTimeDefaults, {
						showPopup: true,
						allowBlankvalue: true,
					})
			);

			window.setTimeout(function() { $(options.inputs.startDateId).glowDateTimeSelector('val', new Date(options.startDate)); } , 15);
			window.setTimeout(function() { $(options.inputs.endDateId).glowDateTimeSelector('val', new Date(options.endDate)); } , 15);

			if (options.displayStartDateValue != '')  {
				window.setTimeout(function() { $(options.inputs.displayStartDateId).glowDateTimeSelector('val', new Date(options.displayStartDateValue)); } , 15);
			}
			if (options.displayEndDateValue != '') {
				window.setTimeout(function() { $(options.inputs.displayEndDateId).glowDateTimeSelector('val', new Date(options.displayEndDateValue)); } , 15);
			}

			options.inputs.includeRoles = $(options.inputs.includeRolesId)
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 20,
					onGetLookUps: function(tb, searchText) {
						searchRoles(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: []});

			if (options.includeRoles.length > 0) {
				options.includeRoles.forEach(function(role)
				{
					var initialLookupValue = options.inputs.includeRoles.glowLookUpTextBox('createLookUp',
						role.id,
						role.name,
						role.name,
						true);
					options.inputs.includeRoles.glowLookUpTextBox('add', initialLookupValue);
				});
			}

			options.inputs.excludeRoles = $(options.inputs.excludeRolesId)
				.glowLookUpTextBox({
					delimiter: ',',
					maxValues: 20,
					onGetLookUps: function(tb, searchText) {
						searchRoles(options, tb, searchText);
					},
					emptyHtml: '',
					selectedLookUpsHtml: []});

			if (options.excludeRoles.length > 0) {
				options.excludeRoles.forEach(function(role)
				{
					var initialLookupValue = options.inputs.excludeRoles.glowLookUpTextBox('createLookUp',
						role.id,
						role.name,
						role.name,
						true);
					options.inputs.excludeRoles.glowLookUpTextBox('add', initialLookupValue);
				});
			}

			var button = $('a.save', headerList);
			button.evolutionValidation({
				validateOnLoad: false,
				onValidated: function(isValid, buttonClicked, c) {
				},
				onSuccessfulClick: function(e) {
					var name = $(options.inputs.nameId).val();

					var data = {
						Name: name,
						Description: options.getDescription(),
						NumberOfLeaders: $(options.inputs.numberOfLeadersId).val(),
						ContainerId: options.containerId
					};

					if (options.leaderboardId != 0) {
						data.Id = options.leaderboardId;

						var appKey =  $(options.inputs.address).val();
						data.ApplicationKey = appKey;
					}

					var timePeriodType = $(options.inputs.timePeriodTypeId).val();
					data.PeriodType = timePeriodType;

					if (timePeriodType == "Static") {
						var startdate = $.telligent.evolution.formatDate($(options.inputs.startDateId).glowDateTimeSelector('val'));
						if (startdate != '')
							data.StartDate = startdate;
						var enddate = $.telligent.evolution.formatDate($(options.inputs.endDateId).glowDateTimeSelector('val'));
						if (enddate != '')
							data.EndDate = enddate;
					}
					else if (timePeriodType == "Rolling") {
						data.TimeSpanLength = $(options.inputs.timeSpanLengthId).val();
						data.TimeSpanType = $(options.inputs.timeSpanTypeId).val();
					}

					var displayStartdate = $.telligent.evolution.formatDate($(options.inputs.displayStartDateId).glowDateTimeSelector('val'));
					data.DisplayStartDate = displayStartdate;
					var displayEnddate = $.telligent.evolution.formatDate($(options.inputs.displayEndDateId).glowDateTimeSelector('val'));
					data.DisplayEndDate = displayEnddate;

					var roleIds = [];
					var count = options.inputs.includeRoles.glowLookUpTextBox('count');
					for (var i = 0; i < count; i++) {
						(function () {
							var item = options.inputs.includeRoles.glowLookUpTextBox('getByIndex', i);
							if (item) {
								roleIds.push(item.Value);
							}
						})();
					}
					data.IncludeRoleIds = roleIds.join();

					roleIds = [];
					count = options.inputs.excludeRoles.glowLookUpTextBox('count');
					for (var i = 0; i < count; i++) {
						(function () {
							var item = options.inputs.excludeRoles.glowLookUpTextBox('getByIndex', i);
							if (item) {
								roleIds.push(item.Value);
							}
						})();
					}
					data.ExcludeRoleIds = roleIds.join();

					$.telligent.evolution.post({
						url: options.urls.save,
						data: data
					})
					.then(function(response) {
						$.telligent.evolution.notifications.show(options.resources.leaderboardUpdated);

						$.telligent.evolution.get({
							url: options.urls.listitem + '&id=' + response.Id
						})
						.then(function(response) {
							if (options.leaderboardId == 0) {
								$(listWrapper).append(response);
								$('div.norecords').remove();
							} else {
								$(listWrapper).find('li[data-id="' + options.leaderboardId + '"]').replaceWith(response);
							}

							$.telligent.evolution.administration.close();
						});
					});

					return false;
				}
			})
			.evolutionValidation('addField', options.inputs.nameId, { required: true,  maxlength: 256 }, '.field-item.name .field-item-validation')
			.evolutionValidation('addField', options.inputs.numberOfLeadersId, { required: true,  digits: true }, '.field-item.number-of-leaders .field-item-validation')
			.evolutionValidation('addField', options.inputs.timeSpanLengthId, { required: false, digits: true }, '.field-item.rolling-time .field-item-validation')
			.evolutionValidation('addCustomValidation', options.inputs.endDateId, function () {
					if ($(options.inputs.timePeriodTypeId).val() == "Static") {
						return $(options.inputs.endDateId).glowDateTimeSelector('val') > $(options.inputs.startDateId).glowDateTimeSelector('val');
					}
					else {
						return true;
					}
				}
				, options.resources.invalidDateRange, '.field-item.time-enddate .field-item-validation', null);

			button.evolutionValidation('addCustomValidation', options.inputs.timeSpanLengthId, function () {
					if ($(options.inputs.timePeriodTypeId).val() == "Rolling") {
						return $(options.inputs.timeSpanLengthId).val() != '';
					}
					else {
						return true;
					}
				}
				, options.resources.fieldRequired, '.field-item.rolling-time .field-item-validation', null);

			if (options.leaderboardId != 0) {
				button.evolutionValidation('addField', $(options.inputs.address), { required: true, maxlength: 256 }, $(options.inputs.address).closest('.field-item').find('.field-item-validation'), null);
				button.evolutionValidation('addField', $(options.inputs.address), {
					required: true,
					pattern: /^[A-Za-z0-9_-]+$/,
					messages: {
						pattern: options.resources.addressPatternMessage
					}
				}, $(options.inputs.address).closest('.field-item').find('.field-item-validation'), null);
			}
		}
	};

	var leadersApi = {
		register: function (options) {

			leadersHeader = $('<fieldset></fieldset>');

			var resultSpan = $('<span></span>');
			if(options.totalLeaders == 1) {
				resultSpan.text(options.resources.recordFormat.replace('{0}', options.totalLeaders));
			}
			else {
				resultSpan.text(options.resources.recordsFormat.replace('{0}', options.totalLeaders));
			}

			var downloadLink = $('<a href="' + options.urls.leaderscsv + '" class="inline-button download-csv"></a>')
				.text(options.resources.downloadCSV);
			if (options.totalLeaders == 0) {
				downloadLink.hide();
			}
			else
				downloadLink.show();

			var resultList = $('<ul class="field-list download-results"></ul>');
			var resultItem = $('<li class="field-item"></li>');
			resultItem.append(resultSpan);
			resultItem.append(downloadLink);
			resultList.append(resultItem);
			leadersHeader.append(resultList);

			$.telligent.evolution.administration.header(leadersHeader.wrap('<form></form>').parent());

			options.leadersList = $(options.inputs.leadersListId, $.telligent.evolution.administration.panelWrapper());

			options.leadersScrollableResults = $.telligent.evolution.administration.scrollable({
				target: options.leadersList,
				load: function (pageIndex) {
					return $.Deferred(function (d) {
						$.telligent.evolution.get({
							url: options.urls.pagedLeaders,
							data: {
								w_pageindex: pageIndex,
							}
						})
						.then(function (response) {
							var r = $(response);
							var items = $('li.content-item', r);

							if (items.length > 0) {
								options.leadersList.append(items);
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
	$.telligent.evolution.widgets.leaderboardPanel = api;
	$.telligent.evolution.widgets.leaderboardEditPanel = editApi;
	$.telligent.evolution.widgets.leaderboardPanelLeaders = leadersApi;

})(jQuery, window);
