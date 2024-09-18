/*

StudioTabContentController:

	keeps track of loaded/rendered models with views
	loads up and renders other views according to the
	saves changes from views against the model
	also renders and tracks a very thin UI wrapper around individual content views

	options
		editViewWrapperView: null,
		onConstructView: function() {},
		onSave: function(request, model)
		onWillSave: function()
		editorSettings: function()
		onLoadVariant: function(type, request, includeAllComponents) // type: 'default', 'nonstaged'
		onSerializeRequest: function(request, options) {},
		onParseRequest: function(request) {}
		onSerializeModelIdentifier: function(request, modelType) // modelType: 'component' or 'primary'
		onGetRequestedLineNumber: function(request) {}
		onUpdateEditor: function(editorRequest, updateRequest, updateModel, controller) // implements studio-specific approach for updating an editor instance
			 controller exposes methods for safely applying changes after performing any necessary before steps
				controller.applyModelChanges(requestId)

	Methods:
		render(request, model)
			renders and focuses on a model using a new view instance
			if request already rendered, just focuses insted
		update(request, model, force) // also returns how many instances were updated. When force is passed/true, tells view to "force" an update even if it thinks it shouldn't (if it's focused, etc)

		close(request, forAnyMatchingModel)
		closeAll()

		getRenderedModel(request)
			gets model associated with views, if there is one
			otherwise false
		listRelatedRenderedRequestsForRequest(request);
			lists all requests currently rendered that are related to current
			request (same model, but different component)

		setGlobalSaveState(1,2,3) // 1: queued 2: saving 3: empty
		updateEditorSettings: function(setting)
		applyBottomMargin: function(margin) // offsets the bottom margin absolutely/positioned edit views by applied amount

		applyComparisonMode(request, variantType) // will be set to all views matching request

	Edit View Interface (as returned from onConstructView)
		Methods:
			render()
				request
				container
				model
				willSave: function()
				changed: function(model)
				loadVariant: function(type, includeAllComponents)
			update()
				model
			show(lineNumber)
			hide()
			unrender()
			updateEditorSettings(settings)
			applyBottomMargin(margin)
			applyComparisonMode(variantType)

*/
define('StudioTabContentController', ['StudioTabContentView', 'StudioKeyedQueue'], function(StudioTabContentView, StudioKeyedQueue, $, global, undef) {

	var saveStates = {
		Queued: 1,
		Saving: 2,
		Saved: 3
	};

	var defaults = {
		editViewWrapperView: null,
		onConstructView: function() {},
		onSave: function(request, model, immediately) {},
		onLoadVariant: function(type, request, includeAllComponents) {},
		onWillSave: function() {},
		// serialize a request for a view including all necessary items, beyond just the model identifier (type, line number, etc)
		onSerializeRequest: function(request, options) {},
		onParseRequest: function(request) {},
		// serialize a model identifier for a specific request, either for 'component' or 'primary' model type
		onSerializeModelIdentifier: function(request, modelType) {},
		onGetRequestedLineNumber: function(request) {},
		// implements studio-specific approach for updating an editor instance
		onUpdateEditor: function(editorRequest, updateRequest, updateModel, controller) {}
	};

	function focus(context, requestId, editor, lineNumber) {
		// hide other editors
		var focusedEditor = null;
		$.each(context.editors, function(id, e){
			if(id !== requestId) {
				e.view.hide();
			} else {
				focusedEditor = e;
			}
		});
		context.tabContentView.render(requestId);

		// apply changes queued while tab not visible
		if (focusedEditor.changeQueue) {
			while (!focusedEditor.changeQueue.isEmpty()) {
				var queuedChange = focusedEditor.changeQueue.dequeue();
				if (!queuedChange || !queuedChange.item)
					continue;
				queuedChange.item();
			}
		}

		editor.view.show(lineNumber);
		$.fn.uilinks.forceRender();
	}

	function performNowOrOnNextFocus(context, editor, key, change, explicitRequest) {
		var currentTabKey = context.tabContentView.current();
		var editorKey = context.onSerializeRequest(explicitRequest || editor.request);

		if (currentTabKey == editorKey) {
			change();
		} else {
			if (!editor.changeQueue)
				editor.changeQueue = new StudioKeyedQueue();

			editor.changeQueue.enqueue(key, change);
		}
	}

	function requestPrimaryModelsMatch(context, a, b) {
		return context.onSerializeModelIdentifier(a, 'primary') == context.onSerializeModelIdentifier(b, 'primary');
	}

	// returns editors that match the request's model
	// regardless of whether it matches the component of the model
	function filterEditorsMatchingPrimaryModelOf(context, request) {
		if(!context || !context.editors || !request)
			return [];

		var filteredEditors = [];
		$.each(context.editors, function(id, e) {
			var parsedRequest = context.onParseRequest(id);
			if(requestPrimaryModelsMatch(context, parsedRequest, request)) {
				filteredEditors.push(e);
			}
		});
		return filteredEditors;
	}

	function applyOrUnapplyEmptyContentStyling(context) {
		var wrapper = $.telligent.evolution.administration.panelWrapper().closest('.administration-panel');
		// hide empty editor styling
		if(Object.keys(context.editors).length > 0) {
			wrapper.removeClass('empty-editor');
		// show empty editor styling
		} else {
			wrapper.addClass('empty-editor');
		}
	}

	var StudioTabContentController = function(options){
		var context = $.extend({}, defaults, options || {});

		// each editor:
		//   id: serialized request key
		//   	{ model: model }
		//      { view: view }
		context.editors = {};
		context.uniqueModels = {};
		context.comparisonModes = {};

		context.tabContentView = new StudioTabContentView({
			container: context.editViewWrapperView.viewContainer(),
			onCreateContentContainer: function() {
				return $('<div class="view"></div>');
			}
		});

		function close(editorId, modelId) {
			var editor = context.editors[editorId];

			if(editor)
				editor.view.unrender();

			context.tabContentView.close(editorId);

			// remove the tracked editor
			delete context.editors[editorId];

			// remove the tracked model if no longer in use
			var model = context.uniqueModels[modelId];
			var editorsUsingModel = 0;
			$.each(context.editors, function(editorId, e){
				if(e.model === model) {
					editorsUsingModel++;
				}
			});
			if(editorsUsingModel === 0) {
				delete context.uniqueModels[modelId];
			}

			applyOrUnapplyEmptyContentStyling(context);
		}

		applyOrUnapplyEmptyContentStyling(context);

		return {
			// gets model associated with views, if there is one
			// otherwise false
			getRenderedModel: function(request) {
				if(!request) {
					return false;
				}

				var modelId = context.onSerializeModelIdentifier(request, 'component');
				var model = context.uniqueModels[modelId];

				return model || false;
			},
			// renders and focuses on a model using a new view instance
			// if request already rendered, just focuses insted
			render: function(request, model) {
				var id = context.onSerializeRequest(request);
				var modelId = context.onSerializeModelIdentifier(request, 'component');

				if(context.editors[id]) {
					focus(context, id, context.editors[id], context.onGetRequestedLineNumber(context));
					return;
				}

				var view = context.onConstructView(request, {
					editorSettings: context.editorSettings()
				});

				if(view == null)
					return;

				var viewContainer = context.tabContentView.render(id);

				var editor = {
					model: model,
					view: view,
					request: $.extend({}, request)
				};
				context.editors[id] = editor;

				context.uniqueModels[modelId] = model;

				performNowOrOnNextFocus(context, editor, 'render', function() {
					view.render({
						request: $.extend({}, request),
						container: viewContainer,
						model: model,
						willSave: function() {
							context.onWillSave();
						},
						changed: function(model, immediately) {
							return context.onSave(editor.request, model, immediately);
						},
						loadVariant: function(type, includeAllComponents) {
							return context.onLoadVariant(type, editor.request, includeAllComponents);
						}
					});

					// apply any existing variant type
					var variantType = context.comparisonModes[context.onSerializeModelIdentifier(request, 'primary')];
					if(variantType && view.applyComparisonMode) {
						view.applyComparisonMode(variantType);
					}

					if(view.applyBottomMargin && context.currentBottomMargin !== undef) {
						view.applyBottomMargin(context.currentBottomMargin);
					}

					applyOrUnapplyEmptyContentStyling(context);
				});

				// focus on new editor
				focus(context, id, context.editors[id], context.onGetRequestedLineNumber(context));
			},
			closeAll: function() {
				$.each(context.editors, function(requestId, editor){
					var request = context.onParseRequest(requestId);
					var modelId = context.onSerializeModelIdentifier(request, 'component');

					close(requestId, modelId);
				});
			},
			close: function(request, forAnyMatchingModel) {
				if(forAnyMatchingModel) {
					// close items matching the model id
					$.each(context.editors, function(i, editor){
						if(requestPrimaryModelsMatch(context, editor.request, request)) {
							var requestId = context.onSerializeRequest(editor.request);
							var modelId = context.onSerializeModelIdentifier(editor.request, 'component');

							close(requestId, modelId);
						}
					});
				} else {
					var requestId = context.onSerializeRequest(request);
					var modelId = context.onSerializeModelIdentifier(request, 'component');

					close(requestId, modelId);
				}
			},
			update: function(request, model, force) {
				// filter editor instances to models for the request
				var filteredEditors = filterEditorsMatchingPrimaryModelOf(context, request);
				// instruct each editor view to update itself
				$.each(filteredEditors, function(i, editor){
					var originalEditorRequest = $.extend({}, editor.request);
					context.onUpdateEditor(editor.request, request, model, {
						applyModelChanges: function(modelChanges) {
							performNowOrOnNextFocus(context, editor, 'update', function() {
								// update referenced model instance with new data
								$.extend(editor.model, modelChanges);

								// update the editor
								editor.view.update({
									model: editor.model,
									force: force
								});

								// re-apply any existing variant type
								var variantType = context.comparisonModes[context.onSerializeModelIdentifier(request, 'primary')];
								if(variantType && editor.view.applyComparisonMode) {
									editor.view.applyComparisonMode(variantType);
								}

								// update the editor references if the ids changed
								var oldRequestId = context.onSerializeRequest(originalEditorRequest);
								var newRequestId = context.onSerializeRequest(editor.request);

								if(oldRequestId !== newRequestId) {
									context.tabContentView.updateKey(oldRequestId, newRequestId);

									delete context.editors[oldRequestId];
									context.editors[newRequestId] = editor;

									delete context.uniqueModels[context.onSerializeModelIdentifier(originalEditorRequest, 'component')];
									context.uniqueModels[context.onSerializeModelIdentifier(editor.request, 'component')] = editor.model;
								}
							}, originalEditorRequest);
						}
					});
				});
				return filteredEditors.length;
			},
			// state to show
			setGlobalSaveState: function(state) {
				context.editViewWrapperView.setSaveState(state);
			},
			listRelatedRenderedRequestsForRequest: function(request) {
				// filter editor instances to all models for the request
				var filteredEditors = filterEditorsMatchingPrimaryModelOf(context, request);
				// return only their request portions
				return filteredEditors.map(function(editor){
					return editor.request;
				});
			},
			updateEditorSettings: function(settings) {
				$.each(context.editors, function(id, editor){
					performNowOrOnNextFocus(context, editor, 'updateEditorSettings', function() {
						if(editor.view && editor.view.updateEditorSettings) {
							editor.view.updateEditorSettings(settings);
						}
					});
				});
			},
			applyBottomMargin: function(margin) {
				context.currentBottomMargin = margin;
				$.each(context.editors, function(id, editor){
					performNowOrOnNextFocus(context, editor, 'applyBottomMargin', function() {
						if(editor.view && editor.view.applyBottomMargin) {
							editor.view.applyBottomMargin(margin);
						}
					});
				});
			},
			states: saveStates,
			applyComparisonMode: function(request, variantType) {
				if(request) {
					// filter editor instances to models for the request
					var filteredEditors = filterEditorsMatchingPrimaryModelOf(context, request);
					// instruct each editor view to apply a comparison mode, if possible
					$.each(filteredEditors, function(i, editor){
						performNowOrOnNextFocus(context, editor, 'applyComparisonMode', function() {
							if (editor.view && editor.view.applyComparisonMode) {
								editor.view.applyComparisonMode(variantType);
							}
						});
					});

					if(variantType) {
						context.comparisonModes[context.onSerializeModelIdentifier(request, 'primary')] = variantType;
					} else {
						delete context.comparisonModes[context.onSerializeModelIdentifier(request, 'primary')];
					}

					return filteredEditors.length;
				} else {
					// or apply to all...
					$.each(context.editors, function(id, editor){
						performNowOrOnNextFocus(context, editor, 'applyComparisonMode', function() {
							if (editor.view && editor.view.applyComparisonMode) {
								editor.view.applyComparisonMode(variantType);
							}
						});
					});

					return context.editors.length;
				}

			}
		}
	};

	return StudioTabContentController;

}, jQuery, window);
