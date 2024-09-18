/*

Exporter

Exports resources and automations

Can export some, many, or all. When exporting many, it uses temp data to store the precise export list as it can grow too long for the query string.

Example:

	var exporter = new Exporter({
		exportAutomationsUrl: ''
		storeTemporaryExportListUrl: ''
	});

	exporter.exportAllResources();
	exporter.exportResources([
		{ id: '' }
	])

	exporter.exportAllAutomations(includeConfiguration);
	exporter.exportAutomations([
		{ id: '' }
	], includeConfiguration)

*/
define('Exporter', function($, global, undef) {

	var Exporter = function(options){
		this.options = options;
	};

	// serializes either list of objects with id string properties or list of id strings
	function serializeRequests(requests) {
		var serializedParts = [];
		for(var i = 0; i < (requests || []).length; i++) {
			if (typeof requests[i] === 'string') {
				serializedParts.push(requests[i]);
			} else if(requests[i].id) {
				serializedParts.push(requests[i].id);
			}
		}
		return serializedParts.join(',');
	}

	Exporter.prototype.storeTemporaryExportList = function(requests) {
		var self = this;
		return $.telligent.evolution.post({
			url: self.options.storeTemporaryExportListUrl,
			data: {
				_w_ids: serializeRequests(requests)
			}
		});
	}

	/*
	requests: array of requests (StudioNavigator.request) or strings
	*/
	Exporter.prototype.exportResources = function(requests){
		var self = this;
		// if there are many requests, store them in temp data
		if(requests.length > 5) {
			// store the export list (potentially large) in temp storage
			this.storeTemporaryExportList(requests).then(function(temp){
				// then build a GET url that refers to the temp storage of the export list
				var url = $.telligent.evolution.url.modify({
					url: self.options.exportAutomationsUrl,
					query: {
						_w_idsStorageKey: temp.key,
						_w_mode: 'Resource'
					}
				});
				global.open(url);
			});
		} else {
			// if not many (don't bother with temp data)
			var url = $.telligent.evolution.url.modify({
				url: self.options.exportAutomationsUrl,
				query: {
					_w_ids: serializeRequests(requests),
					_w_mode: 'Resource'
				}
			});
			global.open(url);
		}
	};

	Exporter.prototype.exportAllResources = function(){
		var self = this;
		var url = $.telligent.evolution.url.modify({
			url: self.options.exportAutomationsUrl,
			query: {
				_w_mode: 'Resource'
			}
		});
		global.open(url);
	};

	/*
	requests: array of requests (StudioNavigator.request) or strings
	*/
	Exporter.prototype.exportAutomations = function(requests, includeConfiguration){
		var self = this;
		// if there are many requests, store them in temp data
		if(requests.length > 5) {
			// store the export list (potentially large) in temp storage
			this.storeTemporaryExportList(requests).then(function(temp){
				// then build a GET url that refers to the temp storage of the export list
				var url = $.telligent.evolution.url.modify({
					url: self.options.exportAutomationsUrl,
					query: {
						_w_idsStorageKey: temp.key,
						_w_mode: includeConfiguration ? 'Configuration' : 'Definition'
					}
				});
				global.open(url);
			});
		} else {
			// if not many (don't bother with temp data)
			var url = $.telligent.evolution.url.modify({
				url: self.options.exportAutomationsUrl,
				query: {
					_w_ids: serializeRequests(requests),
					_w_mode: includeConfiguration ? 'Configuration' : 'Definition'
				}
			});
			global.open(url);
		}
	};

	Exporter.prototype.exportAllAutomations = function(includeConfiguration) {
		var self = this;
		var url = $.telligent.evolution.url.modify({
			url: self.options.exportAutomationsUrl,
			query: {
				_w_mode: includeConfiguration ? 'Configuration' : 'Definition'
			}
		});
		global.open(url);
	};
	return Exporter;

}, jQuery, window);
