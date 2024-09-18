(function ($, global) {
	var headerList = null, currentSearchText = null;
	var listWrapper = null, searchTimeout = null;
	var changes = [];

	function loadScoreForm(options, scoreId, scoreName, scoreDescription) {
		listWrapper = $.telligent.evolution.administration.panelWrapper();

		headerList = $('<ul class="field-list"></ul>');

		headerList.append(
			$('<li class="field-item"></li>')
				.append(
					$('<span class="field-item-input"></span>')
						.append(
							$('<a href="#"></a>')
								.addClass('button save disabled')
								.text(options.resources.save)
				)
			)
		);

		$.telligent.evolution.administration.open({
			name: scoreName,
			header: $('<fieldset></fieldset>').append(headerList),
			content: $.telligent.evolution.get({
				url: options.urls.configureScore,
				data: {
						w_scoreId: scoreId,
						w_scoreName: scoreName
					}
				}),
			cssClass: 'contextual-group-score-configuration-subpanel'
		});
	}

	function filterApplications(options, searchText, scoreId) {
		global.clearTimeout(searchTimeout);
		searchTimeout = global.setTimeout(function() {
			searchText = $.trim(searchText || '').toLowerCase();
			currentSearchText = searchText;
			if (searchText.length == 0) {
				$(options.searchResultListId).hide();
				$(options.listId).show();
			} else {
				$.telligent.evolution.get({
					url: options.urls.search,
					data: {
						w_searchtext: searchText,
						w_scoreId: scoreId
					}
				})
					.then(function(result) {
						if (currentSearchText == searchText) {
							$(options.searchResultListId).html(result);
							$(options.searchResultListId).show();
							$(options.listId).hide();
						}
					});
			}
		}, 125);
	}

	function saveChanges(options) {
		var index;
		for	(index = 0; index < changes.length; index++) {
			if (changes[index].Action == 'revert')
			{
				$.telligent.evolution.post({
					url: options.urls.removeDecay,
					data: {
						ScoreId: changes[index].ScoreId,
						ApplicationId: changes[index].ApplicationId,
						ApplicationName: changes[index].ApplicationName
					}
				})
				.then(function(r) {
					$.telligent.evolution.notifications.show(options.resources.halfLifeResetToDefault + ' ' + r.applicationName);
				});
			}
			else
			{
				$.telligent.evolution.post({
					url: options.urls.setDecay,
					data: {
						ScoreId: changes[index].ScoreId,
						ApplicationId: changes[index].ApplicationId,
						ApplicationName: changes[index].ApplicationName,
						Halflife: changes[index].HalfLife,
					}
				})
				.then(function(r) {
					$.telligent.evolution.notifications.show(options.resources.halfLifeUpdated + ' ' + r.applicationName);
				});
			}
		}

		changes = [];
	}

	function confirmChanges(options) {
		if(changes.length == 1) {
			if (confirm(options.resources.confirmSaveSingular))
				saveChanges(options);
		}
		else if (changes.length > 1) {
			if (confirm(options.resources.confirmSavePlural.replace('{0}', changes.length)))
				saveChanges(options);
		}

		changes = [];
		$("a.save", $.telligent.evolution.administration.header()).addClass('disabled');
	}

	var api = {
		register: function (options) {
			$.telligent.evolution.messaging.subscribe('contextual-configure-score', function (data) {
				var scoreId = $(data.target).data('scoreid');
				var scoreName = $(data.target).data('scorename');
				var scoreDescription = $(data.target).find('span.description').text();

				loadScoreForm(options, scoreId, scoreName, scoreDescription);
			});
		}
	};

	var api2 = {
		register: function (options) {
			$("input[name='search']").on('keyup paste click', function() {
				filterApplications(options, $(this).val(), options.scoreId);
			});

			$("a.save", $.telligent.evolution.administration.header()).on('click', function() {
				if ($(this).hasClass('disabled') || changes.length == 0)
					return false;

				saveChanges(options);

				return false;
			});

			$.telligent.evolution.messaging.subscribe('contextual-default-override', function(data){
				var container = $(data.target).closest("span.field-item-input");
				container.children("span[name='override']").hide();
				container.children("span[name='reset']").show();
				container.children("input[type='text']").prop('disabled', false);
			});

			$.telligent.evolution.messaging.subscribe('contextual-default-reset', function(data){
				var applicationId = $(data.target).data('applicationid');
				var applicationName = $(data.target).data('applicationname');
				var scoreId = $(data.target).data('scoreid');

				var change = {
						ScoreId: scoreId,
						ApplicationId: applicationId,
						ApplicationName: applicationName,
						HalfLife: options.defaultHalfLife,
						Action: 'revert'
				};

				var index;
				var existingChange = false;

				for	(index = 0; index < changes.length; index++) {
				    if (changes[index].ApplicationId == applicationId) {
						changes[index] = change;
						existingChange = true;
					}
				}

				if (!existingChange)
					changes.push(change);

				var container = $(data.target).closest("span.field-item-input");
				container.children("span[name='override']").show();
				container.children("span[name='reset']").hide();
				container.children("input[type='text']").val(options.defaultHalfLife);
				container.children("input[type='text']").prop('disabled', true);

				if (changes.length > 0)
					$("a.save", $.telligent.evolution.administration.header()).removeClass('disabled');
			});

			$('input.halflifeOverride').on('change', function(e){
				var applicationId = $(this).attr('data-applicationId');
				var applicationName = $(this).attr('data-applicationname');
				var scoreId = $(this).attr('data-scoreId');
				var halflife = parseInt($(this).val());

				if (halflife != $(this).val())
				{
					$(this).val(halflife);
				}

				if (isNaN(halflife) || halflife < 0)
				{
					alert(options.resources.halflifeWarning);
				}
				else
				{

					var change = {
						ScoreId: scoreId,
						ApplicationId: applicationId,
						ApplicationName: applicationName,
						HalfLife: halflife,
						Action: 'override'
					};

					var index;
					var existingChange = false;

					for	(index = 0; index < changes.length; index++) {
					    if (changes[index].ApplicationId == applicationId) {
							changes[index] = change;
							existingChange = true;
						}
					}

					if (!existingChange)
						changes.push(change);

					if (changes.length > 0)
						$("a.save", $.telligent.evolution.administration.header()).removeClass('disabled');
				}
			});

			$.telligent.evolution.administration.on('shell.closed', function(){
				confirmChanges(options);
			});

			$.telligent.evolution.administration.on('panel.hidden', function(){
				confirmChanges(options);
			});
		}
	};

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};
	$.telligent.evolution.widgets.groupScoreConfiguration = api;
	$.telligent.evolution.widgets.applicationScoreConfiguration = api2;

})(jQuery, window);
