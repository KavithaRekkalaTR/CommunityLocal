(function($, global, undef) {

	var administration = $.telligent.evolution.administration;

	function collectSelections(context) {
		return context.wrapper
			.find('input.importable-fragment')
			.toArray()
			.map(function(i) {
				var data = $(i);
				return {
					id: $(i).data('id'),
					theme: $(i).data('theme'),
					import: $(i).prop('checked')
				};
			});
	}

	function updateControls(context) {
		context.selected = collectSelections(context).filter(function(a) {
			return a.import;
		});
		if(!context.selected || context.selected.length == 0) {
			context.saveButton.addClass('disabled');
		} else {
			context.saveButton.removeClass('disabled');
		}
	}

	function serializeImportCommands(commands) {
		var serializedParts = [];
		for(var i = 0; i < (commands || []).length; i++) {
			if(serializedParts.length > 0)
				serializedParts.push(',');
			serializedParts.push(commands[i].id);
			if($.trim(commands[i].theme)) {
				serializedParts.push(':');
				serializedParts.push(commands[i].theme);
			}
			serializedParts.push('`');
			if(commands[i].import) {
				serializedParts.push('1');
			} else {
				serializedParts.push('0');
			}
		}
		return serializedParts.join('');
	}

	function performImport(context, selection) {
		return $.telligent.evolution.widgets.fragmentAdministration.loadWithProgress($.telligent.evolution.post({
			url: context.importCallbackUrl,
			data: {
				_w_uploadContext: context.uploadContext,
				_w_fileName: context.fileName,
				_w_importCommands: serializeImportCommands(selection),
				_w_responseType: 'result',
			}
		}))
	}

	function initMultiSelector(context, container) {
		var selectAll = container.find('a.select-all');
		var deSelectAll = container.find('a.de-select-all');

		function processCheckCount() {
			var checkedCount = container.find('input[type="checkbox"]:checked:not(:disabled)').length;
			var uncheckedCount = container.find('input[type="checkbox"]:not(:checked):not(:disabled)').length;
			var totalCount = container.find('input[type="checkbox"]:not(:disabled)').length;

			if (totalCount <= 1) {
				deSelectAll.hide();
				selectAll.hide();
				return;
			}

			if(checkedCount > 0) {
				deSelectAll.show();
			} else {
				deSelectAll.hide();
			}

			if(uncheckedCount > 0) {
				selectAll.show();
			} else {
				selectAll.hide();
			}
		}

		selectAll.on('click', function(e){
			e.preventDefault();

			container.find('input[type="checkbox"]:not(:disabled)').prop('checked', true).trigger('change');
			selectAll.hide();
			deSelectAll.show();

			return false;
		});

		deSelectAll.on('click', function(e){
			e.preventDefault();

			container.find('input[type="checkbox"]:not(:disabled)').prop('checked', false).trigger('change');
			selectAll.show();
			deSelectAll.hide();

			return false;
		});

		container.find('input[type="checkbox"]:not(:disabled)').on('change', processCheckCount);
		processCheckCount();
	}

	var api = {
		register: function(options) {
			var context = $.extend(options, {});

			var headerTemplate = $.telligent.evolution.template(context.importTemplateId);
			var header = $(headerTemplate({}));
			context.saveButton = header.find('a.button');

			$.telligent.evolution.administration.header(header);

			context.wrapper = $.telligent.evolution.administration.panelWrapper();

			updateControls(context);
			context.wrapper.on('change','input[type="checkbox"]', function(e) {
				updateControls(context);
			});

			var messageHandlers = {
				'fragment-import': function(data) {
					if($(data.target).hasClass('disabled'))
						return;

					performImport(context, collectSelections(context)).then(function(){
						administration.loading(false);
						$.telligent.evolution.messaging.publish('fragment-imported');
						$.telligent.evolution.notifications.show(context.importCompleteText);
					});
				},
				'fragment-import-cancel': function(data) {
					$.telligent.evolution.administration.close();
				}
			};
			for(var messageName in messageHandlers) {
				$.telligent.evolution.messaging.subscribe(messageName,
					messageHandlers[messageName]);
			}

			initMultiSelector(context, context.wrapper.find('.field-item.new-fragments'));
			initMultiSelector(context, context.wrapper.find('.field-item.updated-fragments'));
		}
	}

	$.telligent.evolution.widgets.fragmentAdministration.import = api;

})(jQuery, window);