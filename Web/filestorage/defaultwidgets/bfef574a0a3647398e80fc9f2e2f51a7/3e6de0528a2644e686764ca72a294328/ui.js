(function($, global) {

	$.telligent = $.telligent || {};
	$.telligent.evolution = $.telligent.evolution || {};
	$.telligent.evolution.widgets = $.telligent.evolution.widgets || {};

	var internal = {

		headerList 	 : null,
		statusTab 	 : null,
		createButton : null,

		createButtonClick : function(){},

		loadEditForm : function (options, statusKey, title, action) {
			var self = this;
			self.headerList = $('<ul class="field-list"></ul>').append($('<li class="field-item submit"></li>')
			.append($('<span class="field-item-input"></span>')
			.append($('<a href="#"></a>')
			.addClass('button action-status')
			.text(action == 'create-update' ? options.text.actionSaveButton :	options.text.actionDeleteButton))));

			$.telligent.evolution.administration.open({
				name: title,
				header: $('<fieldset></fieldset>').append(self.headerList),
				content: $.telligent.evolution.get({
					url: options.urls.edit,
					data: {
						w_statuskey: statusKey,
						action: action
					}
				}),
				cssClass: 'administration-status-edit'
			});

			return false;
		},

		saveConfiguration : function (options, saveOptions){
			var self = this;

			$.telligent.evolution.post({
				url: options.urls.saveOptions,
				data: {
					IndexPerRun : $(options.inputs.indexPerRun).val()
				}
			}).then(function(response) {
				saveOptions.success();
				options.isEnabled = $('#plugin-enabled').is(':checked');

				$.telligent.evolution.messaging.subscribe('plugins.initialized', function() {
					$(self.statusTab).trigger('reload', {closePanel: false});
					$.telligent.evolution.messaging.unsubscribe('plugins.initialized');
				});
			}).
			fail(function() {
				saveOptions.error();
			});

			return false;
		},

		reorder : function (options, key, direction){

			var self = this,
			move = {
				up : function(status, statuses){
					if (status instanceof jQuery){
						$before = status.prev();
					status.insertBefore($before);
						return true;
					}

					var pos = statuses.indexOf(status), limit = 0;
					if (pos <= limit) return statuses;
					statuses.splice(pos--, 1);
					statuses.splice(pos, 0, status);
					return statuses;
				},
				down : function(status, statuses){
					if (status instanceof jQuery){
						$after = status.next();
					status.insertAfter($after);
						return true;
					}

					var pos = statuses.indexOf(status), limit = statuses.length - 1;
					if (pos === -1 || pos >= limit) return statuses;
					statuses.splice(pos++, 1);
					statuses.splice(pos, 0, status);
					return statuses;
				}
			};

			var sortOrder = 1,
			orderedStatuses = move[direction](key, options.statusList),
			update = function(data, refresh){
				$.telligent.evolution.post({
					url: options.urls.save,
					data: data
				})
				.then(function(response) {
					if (refresh) move[direction]($('.content-item.expanded'));
				})
				.catch(function() { $.telligent.evolution.notifications.show(options.text.editError); });
			};

			$.each(orderedStatuses, function(index, status) {
				var refresh = index === orderedStatuses.length - 1;
				update({ StatusKey : status, SortOrder : sortOrder }, refresh);
				sortOrder += 1;
			});

			return false;
		},

		sortHandlers : function(options){
			var sortOrder = $('.sortOrder'),
			sortButtons = {
				up : {
					size : 24,
					background : 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDaGV2cm9uX3RoaW5fdXAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjAgMjAiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDIwIDIwIiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIGZpbGw9IiMwMDAwMDAiIGQ9Ik0yLjU4MiwxMy44OTFjLTAuMjcyLDAuMjY4LTAuNzA5LDAuMjY4LTAuOTc5LDBzLTAuMjcxLTAuNzAxLDAtMC45NjlsNy45MDgtNy44MyAgYzAuMjctMC4yNjgsMC43MDctMC4yNjgsMC45NzksMGw3LjkwOCw3LjgzYzAuMjcsMC4yNjgsMC4yNywwLjcwMSwwLDAuOTY5Yy0wLjI3MSwwLjI2OC0wLjcwOSwwLjI2OC0wLjk3OCwwTDEwLDYuNzVMMi41ODIsMTMuODkxeiAgIi8+DQo8L3N2Zz4=") no-repeat'
				},
				down : {
					size : 24,
					background : 'url("data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDaGV2cm9uX3RoaW5fZG93biIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMjAgMjAiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHBhdGggZmlsbD0iIzAwMDAwMCIgZD0iTTE3LjQxOCw2LjEwOWMwLjI3Mi0wLjI2OCwwLjcwOS0wLjI2OCwwLjk3OSwwczAuMjcxLDAuNzAxLDAsMC45NjlsLTcuOTA4LDcuODMgIGMtMC4yNywwLjI2OC0wLjcwNywwLjI2OC0wLjk3OSwwbC03LjkwOC03LjgzYy0wLjI3LTAuMjY4LTAuMjctMC43MDEsMC0wLjk2OWMwLjI3MS0wLjI2OCwwLjcwOS0wLjI2OCwwLjk3OSwwTDEwLDEzLjI1ICBMMTcuNDE4LDYuMTA5eiIvPg0KPC9zdmc+DQo=") no-repeat'
				},
				style : { position : 'absolute', top : '10px', display : 'none' }
			};

			var setStyle = function(orderButton, direction){
				orderButton
				.css('display', 'block')
				.css('background', direction.background)
				.css('height', direction.size + 'px')
				.css('width', direction.size + 'px');
			};

			sortOrder.css(sortButtons.style);
			setStyle($('.up', sortOrder), sortButtons.up);
			setStyle($('.down', sortOrder), sortButtons.down);

			$('.content-item').on('click', function(){
				var selected = $('.sortOrder', this);
				if (selected.is(':visible')) return;

				$('.sortOrder').hide();
				selected.fadeIn('fast');
			});

			$('.sortOrder').css('cursor', 'pointer');
		},

		tabHandlers : function(options){
			var self = this,
			adminTabs = [],
			tabs = $('.tab'),
			showHeaderButton = function(headerButton){
				headerButton.show();
				self.spacer.show();
				self.validateStatusTab(options);
			};


			$.each(options.tabs, function(index, tab) {
				adminTabs.push({
					name: tab.name,
					selected: function() {
						tab.element.show();
						if (tab.button) self.tabButton(tab, options, showHeaderButton);
						$.telligent.evolution.administration.header();
					},
					unselected: function() {
						tab.element.hide();
						if (self.createButton) {
							self.createButton.hide();
						}
						if (self.spacer) {
							self.spacer.hide();
						}
						$.telligent.evolution.administration.header();
					}
				});
			});

			tabs.hide();
			options.configApi.registerContent(adminTabs);

			options.configApi.registerSave(function(saveOptions){
				self.saveConfiguration(options, saveOptions);
			});
		},

		editHandlers : function (options) {
			var self = this,
			saveButton = $('a.action-status', self.headerList);
			saveButton.evolutionValidation({
				validateOnLoad: options.statusKey.length > 0,
				onValidated: function(isValid, buttonClicked, c) {},
				onSuccessfulClick: function(e) {
					var data = {
						StatusKey: options.statusKey,
						Name: $(options.inputs.nameId).val(),
						Score: $(options.inputs.scoreValue).val()
					};

					if ($(options.inputs.defaultCheckbox).prop("checked")) { data.IsDefault = true; }

					data.IsClosed = $(options.inputs.closed).prop("checked");
					data.ReleasesVotes = $(options.inputs.releasesVotes).prop('checked');

					$.telligent.evolution.post({ url: options.urls.save, data: data })
					.then(function(response) {
						$.telligent.evolution.notifications.show((options.statusKey.length == 0)
							? options.text.statusCreated
							: options.text.statusUpdated);

							$(self.statusTab).trigger('reload', {closePanel: true});
					})
					.catch(function() { $.telligent.evolution.notifications.show(options.text.editError); });

					return false;
				}
			});

			options.details.on('click', function(e){
				e.preventDefault();
				options.details.hide();
				options.keyItem.show();
				return false;
			});

			var nameField = options.inputs.nameId, nameOptions = { required: true, maxlength: 256};
			saveButton.evolutionValidation('addField', nameField, nameOptions, '.field-item.name .field-item-validation' );

			$(options.inputs.scoreValue).glowPatternedTextBox({ pattern: '<0-10>' });

			return false;
		},

		deleteHandlers : function (options) {
			var self = this,
			deleteButton = $('a.action-status', self.headerList),
			deleteStatus = function () {
				$.telligent.evolution.post({
					url: options.urls.delete,
					data: {
						StatusKey: options.statusKey,
						ReassignKey: $('input:radio[name=' + options.inputs.reassign + ']:checked').val()
					}
				})
				.then(function(response) {
					$.telligent.evolution.notifications.show(options.text.statusDeleted);
					$(self.statusTab).trigger('reload', {closePanel: true});
				})
				.catch(function() {
					$.telligent.evolution.notifications.show(options.text.deleteError);
				});
			};

			$('input:radio[name=' + options.inputs.reassign + ']').first().prop('checked', true);

			deleteButton.evolutionValidation({
				validateOnLoad: options.statusKey.length > 0,
				onValidated: function(isValid, buttonClicked, c) {},
				onSuccessfulClick: function(e) { deleteStatus(); return false; }
			});

			return false;
		},

		tabButton : function(tab, options, showCallback){

			var self = this,
			header = $.telligent.evolution.administration.header();

			self.createButton = $('a.create-status', header);

			if (self.createButton.length == 0) {
				global.setTimeout(function() {
					var instructions = $('.field-item.panel-instructions', header).parent(),
					createButtonHeader = instructions.append(internal.spacer.render().add($('<li class="field-item create-submit"></li>')
					.append($('<span class="field-item-input"></span>')
					.append($('<a href="javascript:void(0)"></a>').addClass('button create-status').text(tab.button.text)))));

					$('ui.field-list', header).html(createButtonHeader);

					self.createButton = $('a.create-status', header);
					self.createButton.on('click', function() { return self.loadEditForm(options, null, tab.button.text, 'create-update'); });

					$.telligent.evolution.administration.header();

					showCallback(self.createButton);
				}, 250);
			} else {
				showCallback(self.createButton);
			}
		},

		validateStatusTab : function(e){

			var fieldset = $(this.statusTab + " fieldset");
			var disabledMessage = $(this.statusTab + " .message");

			if (e.isEnabled){
				disabledMessage.hide();
				fieldset.show();
				if (this.createButton) this.createButton.removeClass('disabled').on('click', this.createButtonClick);
			}
			else{
				disabledMessage.show();
				fieldset.hide();
				if (this.createButton) this.createButton.addClass('disabled').off('click', this.createButtonClick);
			}
		},

		reloadStatusKeys : function(options){
		  $.telligent.evolution.get({
			url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/ideas/statuses.json'
		  })
			.then(function(results){
			if (results && results.Statuses){
				options.statusList = results.Statuses.map(function(status){ return status.Key; });
				}
		  });
		},

		spacer : {
			id : '-spacer',
			render : function() {
				return $('<li class="field-item"><span style="float: left; height: 35.75px; width: 1px; margin-right: 35px; border-left: 1px solid rgba(34, 34, 34, 0.4);"></span></li>').attr('id', this.id);
			},
			hide : function() { $('#' + this.id).hide(); },
			show : function() { $('#' + this.id).show(); }
		}
	};

	$.telligent.evolution.widgets.administrationIdea = {
		status : {
			register : function(options) {
				internal.statusTab = options.statusTab;
				internal.spacer.id = options.widgetId + internal.spacer.id;

				internal.sortHandlers(options);
				internal.tabHandlers(options);

				$.telligent.evolution.messaging.subscribe('administration.idea.status.edit', function(data) {
					var statusKey = $(data.target).data('statuskey');
					var title = $(data.target).data('title');
					internal.loadEditForm(options, statusKey, title, 'create-update');
				});

				$.telligent.evolution.messaging.subscribe('administration.idea.status.delete', function(data) {
					var statusKey = $(data.target).data('statuskey');
					var title = $(data.target).data('title');
					internal.loadEditForm(options, statusKey, title, 'delete');
				});

				$.telligent.evolution.messaging.subscribe('administration.idea.status.up', function(data) {
					var statusKey = $(data.target).data('statuskey');
					internal.reorder(options, statusKey, 'up');
				});

				$.telligent.evolution.messaging.subscribe('administration.idea.status.down', function(data) {
					var statusKey = $(data.target).data('statuskey');
					internal.reorder(options, statusKey, 'down');
				});

				$(internal.statusTab).on('reload', function(e, args){

					$.telligent.evolution.get({ url: options.urls.statuseslistitem })
						.then(function(response) {
							$(internal.statusTab).html(response);
							if (args.closePanel) $.telligent.evolution.administration.close();
							else $.telligent.evolution.administration.refresh();

							internal.sortHandlers(options);
							internal.validateStatusTab(options);

							if (options.isEnabled) internal.reloadStatusKeys(options);
						}
					);
				});
			},

			edit : {
				register : function(options) { internal.editHandlers(options); }
			},

			delete : {
				register : function(options) { internal.deleteHandlers(options); }
			}
		}
	};

})(jQuery, window);