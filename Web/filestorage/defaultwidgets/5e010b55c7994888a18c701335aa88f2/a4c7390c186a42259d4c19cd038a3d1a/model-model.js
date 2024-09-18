 /*

Administration Shell Model Module:

Constructor:

var model = new Model(options)
	options:
		categoriesUrl: '',
		categoryUrl: '',
		panelUrl: '',
		pluginUrl: ''
		searchUrl: ''

	Methods
		// categoriesHtml: ''
		getCategories: function()

		// categoryId: ''
		// categoryHtml: ''
		getCategory: function(categoryId)

		// categoryId: ''
		// panelId: ''
		// panelHtml: ''
		// panelName: ''
		getAdministrativePanel: function(panelId, extraParameters)

		// pluginCategoryTypeName: ''
		// pluginPanelTypeName: ''
		// pluginHtml: ''
		// categoryId: ''
		getPluginPanel: function(pluginTypesPanelTypeName, pluginTypeName)

	// pluginTypeName
		// enabled
		savePlugin: function(options)

		rootParentPluginsUrl

		search: function(options)

	Events:
		none

*/
define('Model', function($, global, undef) {

	var defaults = {
		categoriesUrl: '',
		categoryUrl: '',
		panelUrl: '',
		pluginUrl: ''
	};

	var Model = function(options){
		var context = $.extend({}, defaults, options || {});

		function publishContextChange(categoryId) {
			$.telligent.evolution.messaging.publish('_badgedPanels.contextChanged', {
				contextId: categoryId
			});
		}

		return {
			// categoriesHtml: ''
			getCategories: function() {
				return $.telligent.evolution.get({
					url: context.categoriesUrl,
					data: { }
				});
			},
			// categoryId: ''
			// categoryHtml: ''
			getCategory: function(categoryId) {
				return $.telligent.evolution.get({
					url: context.categoryUrl,
					data: {
						_w_categoryId: categoryId
					}
				}).then(function (r) {
					if (r && r.categoryId) {
						publishContextChange(r.categoryId);
					}
					return r;
				});
			},
			// categoryId: ''
			// panelId: ''
			// panelHtml: ''
			getAdministrativePanel: function(panelId, extraParameters) {
				return $.telligent.evolution.get({
					url: context.panelUrl,
					data: {
						_w_panelId: panelId,
						_w_parameters: extraParameters
					}
				}).then(function (r) {
					if (r && r.categoryId) {
						publishContextChange(r.categoryId);
					}
					return r;
				});
			},
			// pluginCategoryTypeName: ''
			// pluginPanelTypeName: ''
			// pluginHtml: ''
			// categoryId: ''
			getPluginPanel: function(pluginTypesPanelTypeName, pluginTypeName, root) {
				return $.telligent.evolution.get({
					url: context.pluginUrl,
					data: {
						_w_pluginRootLoad: root,
						_w_pluginTypesPanelTypeName: pluginTypesPanelTypeName,
						_w_pluginTypeName: pluginTypeName
					}
				}).then(function (r) {
					if (r && r.categoryId) {
						publishContextChange(r.categoryId);
					}
					return r;
				});
			},
			getRootParentPlugins: function(pluginTypeName, enabling) {
				return $.telligent.evolution.get({
					url: context.rootParentPluginsUrl,
					data: {
						_w_pluginTypeName: pluginTypeName,
						_w_enabling: enabling
					}
				});
			},
			// pluginTypeName
			// enabled
			// configurable: bool
			// configFrame: config <iframe>
			savePlugin: function(options) {
				return $.telligent.evolution.post({
					url: context.pluginSaveUrl,
					data: {
						_w_pluginTypeName: options.pluginTypeName,
						_w_enabled: options.enabled
					}
				}).then(function(r){
					$.telligent.evolution.messaging.publish('plugin-saved', r);
					return r;
				});
			},
			search: function(query, scope, pageSize) {
				return $.telligent.evolution.get({
					url: context.searchUrl,
					data: {
						_w_query: query,
						_w_scope: scope,
						_w_limit: pageSize
					}
				});
			}
		}
	};

	return Model;

}, jQuery, window);
