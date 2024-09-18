/*
StudioApiDataModelProvider

Provides access to a singleton-per-panel instance of a StudioApiDataModelProvider.

Usage:

	var model = StudioApiDataModelProvider.model();

*/
define('StudioApiDataModelProvider', [
	'StudioClientCallbackUrls',
	'StudioApiDataProvider',
	'StudioApiDataModel',
	'StudioScriptApiDataModel',
	'StudioLessApiDataModel',
	'StudioTemplateApiDataModel',
	'StudioRuleApiDataModel',
	'StudioConfigApiDataModel',
	'StudioPaletteApiDataModel' ],
function(clientCallbackUrls,
	StudioApiDataProvider,
	StudioApiDataModel,
	StudioScriptApiDataModel,
	StudioLessApiDataModel,
	StudioTemplateApiDataModel,
	StudioRuleApiDataModel,
	StudioConfigApiDataModel,
	StudioPaletteApiDataModel,
	$, global, undef)
{
	var apiDataModel;

	var StudioApiDataModelProvider = {
		model: function() {
			if(apiDataModel == null) {
				var dataProvider = new StudioApiDataProvider(clientCallbackUrls);
				var velocityDataModel = new StudioScriptApiDataModel({ provider: dataProvider, language: 'velocity' });
				var javaScriptDataModel = new StudioScriptApiDataModel({ provider: dataProvider, language: 'javascript' });
				var restDataModel = new StudioScriptApiDataModel({ provider: dataProvider });
				var lessDataModel = new StudioLessApiDataModel({ provider: dataProvider });
				var templateDataModel = new StudioTemplateApiDataModel({ provider: dataProvider });
				var ruleDataModel = new StudioRuleApiDataModel({ provider: dataProvider });
				var configDataModel = new StudioConfigApiDataModel({ templateModel: templateDataModel, ruleModel: ruleDataModel });
				var paletteDataModel = new StudioPaletteApiDataModel({ });

				apiDataModel = new StudioApiDataModel({
					modes: {
						'velocity': velocityDataModel,
						'javascript': javaScriptDataModel,
						'rest': restDataModel,
						'less': lessDataModel,
						'template': templateDataModel,
						'rule': ruleDataModel,
						'config': configDataModel,
						'palette': paletteDataModel
					}
				});

				// clean up on panel unload
				$.telligent.evolution.administration.on('panel.unloaded', function(){
					// unregister all
					apiDataModel = null;
				});
			};
			return apiDataModel;
		}
	};

	return StudioApiDataModelProvider;

}, jQuery, window);
