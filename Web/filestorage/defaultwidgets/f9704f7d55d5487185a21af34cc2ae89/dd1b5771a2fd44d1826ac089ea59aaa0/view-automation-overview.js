/*
AutomationOverviewView

Raises Messages:

	studio.view.staging.publish
	studio.view.staging.revert

Methods
	// constructor
	// 		onSearchContexts

	// options:
	// 		request
	// 		container
	// 		model
	//		changed(model)
	//		willSave: function() {
	// 		serializeRequest: function(request, options) {}
	render: function(options)

	unrender: function()

	// options
	// 		model
	update: function(options)
	hide: function()
	show: function()

	onSearchEvents: function(query)
*/
define('AutomationOverviewView', ['StudioUtility'], function(util, $, global, undef) {

	var defaults = {
		container: null,
		template: null,
		headerTemplate: null,
		actionsTemplate: null,
		stateTemplate: null,
		componentsTemplate: null,
		versionsTemplate: null,
		filesViewTemplate: null,
		eventsViewTemplate: null,
		detailsTemplate: null,
		triggerSummaryTemplate: null,
		fragmentEditorComponentsTemplate: null,
		onSearchContexts: function(filter) {},
		serializeRequest: function(request, options) {},
		description: 'test description',

	};

	var spinner = '<span class="ui-loading" width="48" height="48"></span>';

	function parseUnit(input, min) {
		if(!input)
			return min;
		var parsed = parseInt(input.val(), 10);
		if (!parsed || parsed < min)
			return min;
		return parsed;
	}

	function raiseChange(context, immediately) {
		if(context.willSave) {
			context.willSave();
		}

		context.model.Name = context.name.val();
		context.model.Description = context.description.val();
		context.model.TriggerTypes = context.triggerTypes.filter(':checked').map(function() {
			return this.value;
		}).toArray();
		var selectedTriggerEvents = $.grep(context.eventLookup.val().split(','), function(c){
			return c && $.trim(c);
		});
		context.model.EventKeys = selectedTriggerEvents;

		context.model.ScheduleType = context.scheduleType.val();
		context.model.ScheduleSeconds = parseUnit(context.scheduleSeconds, 1);
		context.model.ScheduleMinutes = parseUnit(context.scheduleMinutes, 1);
		context.model.ScheduleHours = parseUnit(context.scheduleHours, 1);
		context.model.ScheduleDailyTime = $.telligent.evolution.formatDate(context.scheduleDailyTime.glowDateTimeSelector('val'));
		context.model.ScheduleDailySunday = context.scheduleDailySunday.is(':checked');
		context.model.ScheduleDailyMonday = context.scheduleDailyMonday.is(':checked');
		context.model.ScheduleDailyTuesday = context.scheduleDailyTuesday.is(':checked');
		context.model.ScheduleDailyWednesday = context.scheduleDailyWednesday.is(':checked');
		context.model.ScheduleDailyThursday = context.scheduleDailyThursday.is(':checked');
		context.model.ScheduleDailyFriday = context.scheduleDailyFriday.is(':checked');
		context.model.ScheduleDailySaturday = context.scheduleDailySaturday.is(':checked');
		context.model.ExecuteAsServiceUser = context.executionUserInput.is(':checked');
		context.model.IsSingleton = context.isSingletonInput.is(':checked');
		context.model.HttpAuthentication = context.httpAuthentication.val();

		context.changed(context.model, immediately).then(function(){

		});
	}

	function handleChanges(context) {
		var raiseImmediateChange = function() {
			setTriggerFormVisibility(context, true);
			raiseChange(context, true);
		};

		context.name.on('input', function(){ raiseChange(context); });
		context.description.on('input', function(){ raiseChange(context); });
		context.triggerTypes.on('change', raiseImmediateChange);
		context.eventLookup.on('change', function(){ raiseChange(context, true); });
		context.scheduleType.on('change', raiseImmediateChange);
		context.scheduleSeconds.on('input', function(){ raiseChange(context); });
		context.scheduleMinutes.on('input', function(){ raiseChange(context); });
		context.scheduleHours.on('input', function(){ raiseChange(context); });
		context.scheduleDaily.on('input', function(){ raiseChange(context); });

		context.scheduleDailySunday.on('change', raiseImmediateChange);
		context.scheduleDailyMonday.on('change', raiseImmediateChange);
		context.scheduleDailyTuesday.on('change', raiseImmediateChange);
		context.scheduleDailyWednesday.on('change', raiseImmediateChange);
		context.scheduleDailyThursday.on('change', raiseImmediateChange);
		context.scheduleDailyFriday.on('change', raiseImmediateChange);
		context.scheduleDailySaturday.on('change', raiseImmediateChange);

		context.executionUserInput.on('change', raiseImmediateChange);
		context.isSingletonInput.on('change', raiseImmediateChange);

		context.httpAuthentication.on('change', raiseImmediateChange);
	}

	function initTokenEditor(editor, raw, processed, force) {
		var context = $(editor).data('_token_editor_context');
		if(!context) {
			context = {
				rawElement: editor.find('.raw'),
				processedElement: editor.find('.processed'),
				rawValue: (raw || editor.find('.raw').val()),
				processedValue: (processed || editor.find('.processed').text())
			};
			$(editor).data('_token_editor_context', context);

			context.processedElement.on('click', function(){
				context.processedElement.hide();
				context.rawElement.show().trigger('focus');
			});
			context.rawElement.on('blur', function(){
				var value = $.trim(context.rawElement.val());
				if(value == $.trim(context.rawValue)) {
					context.processedElement.text(context.processedValue);
					context.processedElement.show();
					context.rawElement.hide();
				}
			});
		}

		context.rawValue = raw;
		context.processedValue = processed;
		context.processedElement.text(processed);

		if(!context.rawElement.is(':focus') || force) {
			context.rawElement.val(raw);
			context.processedElement.show();
			context.rawElement.hide();
		}
	}

	function focusOnTokenEditor(editor) {
		var context = $(editor).data('_token_editor_context');
		if(context) {
			context.processedElement.hide();
			context.rawElement.show().trigger('focus');
		}
	}

	function initUi(context) {
		var viewModel = $.extend({}, context.model, {
			requestKey: context.serializeRequest(context.request),
			description: context.description
		});

		context.container.empty().append(context.template(viewModel));
		context.headerContainer = context.container.find('.template-editor-header');
		context.headerContainer.append(context.headerTemplate(viewModel))
		context.stateContainer = context.container.find('.template-editor-state');
		context.componentsContainer = context.container.find('.template-editor-components');
		context.actionsContainer = context.container.find('.template-editor-actions');

		// render actions
		var renderedActions = context.actionsTemplate(viewModel);
		context.actionsContainer.empty().append(renderedActions);

		// render state...
		context.stateContainer.empty().append(context.stateTemplate(context.model))

		// render components
		context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, context.model,{
			selected: context.selectedTab,
			selectedTabName: context.selectedTabName
		})));


		context.name = context.container.find('input.name');
		context.description = context.container.find('input.description');
		context.triggerTypes = context.container.find('input.trigger-type');
		context.eventLookup = context.container.find('input.eventLookup');
		context.executionUserInput = context.container.find('.field-item-input.execution-user input.execution-user');
		context.isSingletonInput = context.container.find('.field-item-input.singleton input.singleton');

		context.nameTokenEditor = context.container.find('.field-item-input.name .token-editor');
		context.descriptionTokenEditor = context.container.find('.field-item-input.description .token-editor');

		context.scheduleType = context.container.find('.trigger-form.Job select.ScheduleType');
		context.scheduleSeconds = context.container.find('.trigger-form.Job input.ScheduleSeconds');
		context.scheduleSecondsContainer = context.scheduleSeconds.closest('li');
		context.scheduleMinutes = context.container.find('.trigger-form.Job input.ScheduleMinutes');
		context.scheduleMinutesContainer = context.scheduleMinutes.closest('li');
		context.scheduleHours = context.container.find('.trigger-form.Job input.ScheduleHours');
		context.scheduleHoursContainer = context.scheduleHours.closest('li');
		context.scheduleDaily = context.container.find('.trigger-form.Job div.ScheduleDaily');
		context.scheduleDailyTime = context.container.find('.trigger-form.Job input.ScheduleDailyTime');
		context.scheduleDailySunday = context.container.find('.trigger-form.Job input.ScheduleDailySunday');
		context.scheduleDailyMonday = context.container.find('.trigger-form.Job input.ScheduleDailyMonday');
		context.scheduleDailyTuesday = context.container.find('.trigger-form.Job input.ScheduleDailyTuesday');
		context.scheduleDailyWednesday = context.container.find('.trigger-form.Job input.ScheduleDailyWednesday');
		context.scheduleDailyThursday = context.container.find('.trigger-form.Job input.ScheduleDailyThursday');
		context.scheduleDailyFriday = context.container.find('.trigger-form.Job input.ScheduleDailyFriday');
		context.scheduleDailySaturday = context.container.find('.trigger-form.Job input.ScheduleDailySaturday');

		context.httpAuthentication = context.container.find('.trigger-form.Http select.HttpAuthentication');
		context.httpAuthenticationWarning = context.container.find('.message.auth-none').first();
		context.restScope = context.container.find('.rest-scope').first();

		context.editorComponentsContainer = context.container.find('.components .automation-components');
		context.filesContainer = context.container.find('.components .automation-files');
		context.details = context.container.find('.content.details');

		context.stateLabels = context.container.find('.editor-state');
		context.editorContainer = context.container.find('.editor-content');

		context.stateContainer.on('click', 'a.compare', function(e){
			e.preventDefault();
			var link = $(e.target);
			var variantType = link.data('varianttype');
			if(context.comparison != variantType) {
				context.onCompareRequested(variantType);
			} else {
				context.onCompareRequested(null);
			}
			return false;
		});

		initTokenEditor(context.nameTokenEditor,
			context.model.Name,
			context.model.ProcessedName);

		initTokenEditor(context.descriptionTokenEditor,
			context.model.Description,
			context.model.ProcessedDescription);

		initTriggerUi(context);
	}

	function compareWith(context, variantType) {
		removeDifference(context);
		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.comparison = variantType;

		$.telligent.evolution.administration.loading(true);
		context.loadVariant('staged', true).then(function(stagedRevision){
			context.loadVariant(variantType, true).then(function(r){
				$.telligent.evolution.administration.loading(false);
				if(variantType != context.comparison)
					return;
				compareAndRenderDifferences(context, stagedRevision, r);
			});
		});

		var activatingLink = context.stateContainer.find('a.compare[data-varianttype="' + variantType + '"]');
		activatingLink.text(activatingLink.data('hidelabel'));
		if(context.editorContainer.filter('.editor-content').is(':visible')) {
			context.stateLabels.show();
			context.stateLabels.find('.from').text(activatingLink.data('fromlabel'));
			context.stateLabels.find('.to').text(activatingLink.data('tolabel'));
		}
	}

	function unCompareWith(context) {
		context.stateContainer.find('a.compare').each(function(){
			$(this).text($(this).data('showlabel'));
		});

		context.stateContainer.find('.state-labels').hide();
		removeDifference(context);
		context.comparison = false;
	}

	function attemptToRenderCurrentTriggerEvents(context){
		var eventLookupContainer = getGlowLookupTextBoxContainer(context.eventLookup);
		if(eventLookupContainer.length == 0 || !eventLookupContainer.get(0).offsetHeight) {
			setTimeout(function(){
				attemptToRenderCurrentTriggerEvents(context);
			}, 20)
		} else {
			renderCurrentTriggerEvents(context);
		}
	}

	function resourcesAreSame(modelA, modelB) {
		// shortcuts
		if(modelA == null && modelB == null)
			return true;
		if(modelA == null || modelB == null)
			return false;
		if(modelA.Resources == null && modelB.Resources == null)
			return true;
		if(modelA.Resources == null || modelB.Resources == null)
			return false;
		if(modelA.Resources.length != modelB.Resources.length)
			return false;

		// build sorted arrays of serialized resources for quick comparison
		resourcesA = [];
		resourcesB = [];
		for(var i = 0; i < modelA.Resources.length; i++) {
			resourcesA.push(modelA.Resources[i].Language + ':' + modelA.Resources[i].Name + ':' + modelA.Resources[i].Value);
			resourcesB.push(modelB.Resources[i].Language + ':' + modelB.Resources[i].Name + ':' + modelB.Resources[i].Value);
		}
		resourcesA.sort();
		resourcesB.sort();

		// compare arrays
		for(var i = 0 ; i < resourcesA.length; i++) {
			if(resourcesA[i] != resourcesB[i])
				return false;
		}

		return true;
	}

	function findFile (files, name) {
		if (!files)
			return null;
		var filteredFiles = files.filter(function(f) {
			return f.Name == name;
		});
		return filteredFiles.length > 0 ? filteredFiles[0] : null;
	}

	function diffableValue(value, context) {
		if (!value || $.trim(value).length == 0)
			return context.resources.diffEmpty;
		return value;
	}

	function compareAndRenderDifferences(context, currentModel, variantModel) {
		// name
		if (util.normalize(currentModel.Name || '') !== util.normalize(variantModel.Name || '&nbsp;'))
			context.container.find('.field-item.name .was').text(diffableValue(variantModel.ProcessedName, context));
		// description
		if (util.normalize(currentModel.Description || '') !== util.normalize(variantModel.Description || '&nbsp;'))
			context.container.find('.field-item.description .was').text(diffableValue(variantModel.ProcessedDescription, context));

		if(util.normalize(currentModel.ExecutionScript || '') !== util.normalize(variantModel.ExecutionScript || ''))
			context.container.find('.automation-components .automation-component-link.executionscript').addClass('was');
		if(util.normalize(currentModel.ConfigurationXml || '') !== util.normalize(variantModel.ConfigurationXml || ''))
			context.container.find('.automation-components .automation-component-link.configuration').addClass('was');
		if(!resourcesAreSame(currentModel, variantModel))
			context.container.find('.automation-components .automation-component-link.resources').addClass('was');

		// temporary rendered versions variant files
		var renderedVariantFiles = $('<div>' + context.filesViewTemplate(variantModel) + '</div>');

		// files
		$.each(currentModel.Files, function(i, file) {
			var variantFile = findFile(variantModel.Files, file.Name);
			if (!variantFile || file.Digest !== variantFile.Digest)
				context.container.find('.automation-files .file[data-name="' + file.Name + '"]').addClass('was');
		});
		// deleted
		var fileList = context.container.find('.automation-files ul').first();
		$.each(variantModel.Files, function(i, file) {
			var currentFile = findFile(currentModel.Files, file.Name);
			if (!currentFile) {
				var deletedLink = renderedVariantFiles.find('.file[data-name="' + file.Name + '"]').addClass('was deleted');
				deletedLink.attr('data-tip', deletedLink.attr('data-tip') + '  (' + context.resources.deleted + ')');
				deletedLink.closest('li').prependTo(fileList);
			}
		});

		// trigger
		var currentTriggerSummary = context.triggerSummaryTemplate(currentModel);
		var variantTriggerSummary = context.triggerSummaryTemplate(variantModel);
		if (currentTriggerSummary != variantTriggerSummary) {
			context.container.find('.field-item.trigger .was').html(diffableValue(variantTriggerSummary, context));
		}

		// execution scope
		if(currentModel.ExecuteAsServiceUser !== variantModel.ExecuteAsServiceUser) {
			context.container.find('.field-item.execution-user .field-item-input').addClass('was');
		}

		// singleton
		if(currentModel.IsSingleton !== variantModel.IsSingleton) {
			context.container.find('.field-item.singleton .field-item-input').addClass('was');
		}
	}

	function removeDifference(context) {
		// name
		context.container.find('.field-item.name .was').html('');
		// description
		context.container.find('.field-item.description .was').html('');
		// trigger
		context.container.find('.field-item.trigger .was').html('');

		context.container.find('.automation-components .automation-component-link.executionscript').removeClass('was');
		context.container.find('.automation-components .automation-component-link.configuration').removeClass('was');
		context.container.find('.automation-components .automation-component-link.resources').removeClass('was');

		context.container.find('.automation-files .file.was.deleted').remove();
		context.container.find('.automation-files .file').removeClass('was');

		context.container.find('.field-item.execution-user .field-item-input').removeClass('was');
		context.container.find('.field-item.singleton .field-item-input').removeClass('was');
	}

	function initTriggerUi(context) {
		initEventLookupUi(context);
		initDateTime(context);
		setTriggerFormVisibility(context);
	}

	function initDateTime(context) {
		context.scheduleDailyTime.glowDateTimeSelector($.extend({}, $.fn.glowDateTimeSelector.timeDefaults))
			.on('glowDateTimeSelectorChange', function() {
				raiseChange(context);
			});
	}

	function setTriggerFormVisibility(context, animate) {
		// set visibility of type-based trigger form
		context.triggerTypes.each(function(){
			var triggerForm = context.container.find('.trigger-form.' + this.value);
			if(this.checked && !triggerForm.is(':visible')) {
				if (animate) {
					triggerForm.slideDown(150);
				} else {
					triggerForm.show();
				}
			} else if(!this.checked && (triggerForm.is(':visible') && !triggerForm.is(':animated'))) {
				if (animate) {
					triggerForm.slideUp(150);
				} else {
					triggerForm.hide();
				}
			}
		});

		// set visibility of schedule trigger fields
		context.scheduleSecondsContainer.hide();
		context.scheduleMinutesContainer.hide();
		context.scheduleHoursContainer.hide();
		context.scheduleDaily.hide();
		if (context.scheduleType.is(':visible')) {
			switch(context.scheduleType.val()) {
				case 'Daily':
					context.scheduleDaily.show();
					break;
				case 'Hours':
					context.scheduleHoursContainer.show();
					break;
				case 'Minutes':
					context.scheduleMinutesContainer.show();
					break;
				case 'Seconds':
				default:
					context.scheduleSecondsContainer.show();
					break;
			}
		}

		if (context.httpAuthentication.val() == 'None') {
			context.httpAuthenticationWarning.show();
			context.restScope.hide();
		} else {
			context.httpAuthenticationWarning.hide();
			context.restScope.show();
		}
	}

	function initEventLookupUi(context) {
		context.selectedEventsContainer = context.container.find('.selected-events');
		context.selectedEventsContainer.on('click', 'a.automation-event-delete', function(e) {
			e.preventDefault();
			var eventKey = $(this).data('key');
			if (eventKey && eventKey.length > 0) {
				context.eventLookup.glowLookUpTextBox('removeByValue', eventKey);
				context.eventLookup.trigger('change');
			}
			return false;
		});

		context.selectedEventsContainer.on('click', 'a.automation-event-doc', function(e) {
			e.preventDefault();
			$.telligent.evolution.messaging.publish('studio.view.documentation.show', { target: this, elm: this });
			return false;
		});

		context.eventLookup.glowLookUpTextBox({
			delimiter: ',',
			allowDuplicates: false,
			onGetLookUps: function(textbox, searchText) {
				if(searchText && searchText.length >= 1) {
					textbox.glowLookUpTextBox('updateSuggestions', [
						textbox.glowLookUpTextBox('createLookUp', '', spinner, spinner, false)
					]);
					context.currentSearchText = searchText;

					context.onSearchEvents(searchText).then(function(response){
						if (searchText != context.currentSearchText) {
							return;
						}

						var hasResults = false;
						if (response && response.events.length >= 1) {
							textbox.glowLookUpTextBox('updateSuggestions',
								response.events.map(function(event, i) {
									try {
										lookup = textbox.glowLookUpTextBox(
											'createLookUp',
											event.Key,
											event.Entity + '.' + event.Event,
											event.Entity + '.' + event.Event + (event.Description && event.Description.length > 0 ? ': ' + event.Description : ''),
											true);

										hasResults = true;
										return lookup;
									} catch (e) {}
								}));
						}

						if (!hasResults) {
							textbox.glowLookUpTextBox('updateSuggestions', [
								textbox.glowLookUpTextBox('createLookUp', '', 'No Events Found', 'No Events Found', false)
							]);
						}
					});
				}
			},
			emptyHtml: '',
			selectedLookUpsHtml: [],
			deleteImageUrl: ''
		})
		.on('glowLookUpTextBoxChange', function(){
			context.eventLookup.trigger('change');
		});

		attemptToRenderCurrentTriggerEvents(context);
	}

	function getGlowLookupTextBoxInput(selection) {
		return selection.closest('.field-item').find('.glow-lookuptextbox input[type="text"]').first();
	}

	function getGlowLookupTextBoxContainer(selection) {
		return selection.closest('.field-item').find('.glow-lookuptextbox');
	}

	function renderCurrentTriggerEvents(context) {
		// don't re-render if currently focused
		// unfortunately using a private way of finding the actual input within the glow text box
		var input = getGlowLookupTextBoxInput(context.eventLookup);
		if(input.is(':focus')) {
			return;
		}

		// clear any current selections
		var count = context.eventLookup.glowLookUpTextBox('count');
		for(var i = 0; i < count; i++) {
			var removed = context.eventLookup.glowLookUpTextBox('removeByIndex', 0);
		}

		// add items corresponding to current model's trigger events
		for(var i = 0; i < context.model.Events.length; i++) {
			var event = context.model.Events[i];
			var renderedContextItem = context.eventLookup.glowLookUpTextBox('createLookUp',
				event.Key,
				event.Entity + '.' + event.Event,
				event.Entity + '.' + event.Event,
				true);
			context.eventLookup.glowLookUpTextBox('add', renderedContextItem);
		}
	}

	var AutomationOverviewView = function(options){
		var context = $.extend({}, defaults, options || {});

		return {
			// options:
			// 		request
			// 		container
			// 		model
			//		changed(model)
			render: function(options) {
				$.extend(context, options);

				context.template = $.telligent.evolution.template(context.template);
				context.headerTemplate = $.telligent.evolution.template(context.headerTemplate);
				context.actionsTemplate = $.telligent.evolution.template(context.actionsTemplate);
				context.componentsTemplate = $.telligent.evolution.template(context.componentsTemplate);
				context.stateTemplate = $.telligent.evolution.template(context.stateTemplate);

				context.editComponentsViewTemplate = $.telligent.evolution.template(context.editComponentsViewTemplate);
				context.filesViewTemplate = $.telligent.evolution.template(context.filesViewTemplate);
				context.eventsViewTemplate = $.telligent.evolution.template(context.eventsViewTemplate);
				context.detailsViewTemplate = $.telligent.evolution.template(context.detailsViewTemplate);
				context.triggerSummaryTemplate = $.telligent.evolution.template(context.triggerSummaryTemplate);

				initUi(context);
				handleChanges(context);
			},
			unrender: function() {
			},
			hide: function() {
				// restore comparison mode class if comparing at time of hide
				if(context.comparison) {
					$.telligent.evolution.administration.panelWrapper().addClass('comparing');
				}
			},
			show: function() {
				// hide comparison mode class since has no purpose in this view
				$.telligent.evolution.administration.panelWrapper().removeClass('comparing');
			},
			// options
			// 		model
			// 		force: true|false (when true, updates even if focused)
			update: function(options) {
				initTokenEditor(context.nameTokenEditor,
					context.model.Name,
					context.model.ProcessedName,
					options.force);

				initTokenEditor(context.descriptionTokenEditor,
					context.model.Description,
					context.model.ProcessedDescription,
					options.force);

				// render actions
				var renderedActions = context.actionsTemplate($.extend({}, options.model, {
					requestKey: context.serializeRequest(context.request)
				}));
				context.actionsContainer.empty().append(renderedActions);

				// render state...
				context.stateContainer.empty().append(context.stateTemplate(options.model))

				// render components
				context.componentsContainer.empty().append(context.componentsTemplate($.extend({}, options.model,{
					selected: context.selectedTab,
					selectedTabName: context.selectedTabName
				})));

				// update actions
				context.actionsContainer.empty().append(context.actionsTemplate(
					$.extend({}, options.model, {
						requestKey: context.serializeRequest(context.request)
					})
				));

				if(!context.name.is(':focus') || options.force)
					context.name.val(options.model.Name);
				if(!context.description.is(':focus') || options.force)
					context.description.val(options.model.Description);
				context.triggerTypes.each(function(){
					if(options.model.TriggerTypes.indexOf(this.value) > -1)
						$(this).prop('checked', true);
					else
						$(this).prop('checked', false);
				});

				if (context.model.HttpAuthentication)
					context.httpAuthentication.val(context.model.HttpAuthentication);

				if(context.model.ScheduleType && context.model.ScheduleType.length > 0 && context.model.ScheduleType != 'None')
					context.scheduleType.val(context.model.ScheduleType);
				context.scheduleSeconds.val(context.model.ScheduleSeconds);
				context.scheduleMinutes.val(context.model.ScheduleMinutes);
				context.scheduleHours.val(context.model.ScheduleHours);
				context.scheduleDailyTime.glowDateTimeSelector('val', $.telligent.evolution.parseDate(context.model.ScheduleDailyTime));
				if(context.model.ScheduleDailySunday)
					context.scheduleDailySunday.prop('checked', true);
				else
					context.scheduleDailySunday.prop('checked', false);
				if(context.model.ScheduleDailyMonday)
					context.scheduleDailyMonday.prop('checked', true);
				else
					context.scheduleDailyMonday.prop('checked', false);
				if(context.model.ScheduleDailyTuesday)
					context.scheduleDailyTuesday.prop('checked', true);
				else
					context.scheduleDailyTuesday.prop('checked', false);
				if(context.model.ScheduleDailyWednesday)
					context.scheduleDailyWednesday.prop('checked', true);
				else
					context.scheduleDailyWednesday.prop('checked', false);
				if(context.model.ScheduleDailyThursday)
					context.scheduleDailyThursday.prop('checked', true);
				else
					context.scheduleDailyThursday.prop('checked', false);
				if(context.model.ScheduleDailyFriday)
					context.scheduleDailyFriday.prop('checked', true);
				else
					context.scheduleDailyFriday.prop('checked', false);
				if(context.model.ScheduleDailySaturday)
					context.scheduleDailySaturday.prop('checked', true);
				else
					context.scheduleDailySaturday.prop('checked', false);

				if (context.model.ExecuteAsServiceUser)
					context.executionUserInput.prop('checked', true);
				else
					context.executionUserInput.prop('checked', false);

				if (context.model.IsSingleton)
					context.isSingletonInput.prop('checked', true);
				else
					context.isSingletonInput.prop('checked', false);

				// update events
				setTriggerFormVisibility(context);
				renderCurrentTriggerEvents(context);

				context.editorComponentsContainer.empty().append(context.editComponentsViewTemplate(context.model));
				context.filesContainer.empty().append(context.filesViewTemplate(context.model));
				context.selectedEventsContainer.empty().append(context.eventsViewTemplate(context.model));

				context.container.find('.automation-name').text(options.model.ProcessedName);

				context.container.find('.rest-scope-name').text(options.model.RestScopeName);
				context.container.find('.rest-scope-id').text(options.model.RestScopeId);

				removeDifference(context);
			},
			applyBottomMargin: function (margin) {
				context.container.find('.editor-content').css({
					bottom: margin
				});
			},
			applyComparisonMode: function (variantType) {
				if(variantType) {
					compareWith(context, variantType);
				} else {
					unCompareWith(context);
				}
			}
		}
	};

	return AutomationOverviewView;

}, jQuery, window);
