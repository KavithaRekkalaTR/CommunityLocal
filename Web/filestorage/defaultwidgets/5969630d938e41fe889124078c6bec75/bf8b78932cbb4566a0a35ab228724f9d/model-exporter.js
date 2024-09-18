/*

Exporter
Exports resources and fragments

Can export some, many, or all. When exporting many, it uses temp data to store the precise export list as it can grow too long for the query string.

Example:

	var exporter = new Exporter({
		exportResourcesUrl: ''
		exportFragmentsUrl: ''
	});

	exporter.exportAllResources();
	exporter.exportResources([
		{ id: 123 },
		{ id: 123, theme: 'abc' }
	])
	exporter.exportAllFragments();
	exporter.exportFragments([
		{ id: 123 },
		{ id: 123, theme: 'abc' }
	])

*/
define('Exporter', function($, global, undef) {

	var Exporter = function(options){
		this.options = options;
	};

	function serializeRequests(requests) {
		var serializedParts = [];
		for(var i = 0; i < (requests || []).length; i++) {
			if(serializedParts.length > 0)
				serializedParts.push(',');
			serializedParts.push(requests[i].id);
			if($.trim(requests[i].theme)) {
				serializedParts.push(':');
				serializedParts.push(requests[i].theme);
			}
		}
		return serializedParts.join('');
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
	requests: array of requests (StudioNavigator.request)
	*/
	Exporter.prototype.exportResources = function(requests){
		var self = this;
		// if there are many requests, store them in temp data
		if(requests.length > 5) {
			// store the export list (potentially large) in temp storage
			this.storeTemporaryExportList(requests).then(function(temp){
				// then build a GET url that refers to the temp storage of the export list
				var url = $.telligent.evolution.url.modify({
					url: self.options.exportResourcesUrl,
					query: {
						_w_idsStorageKey: temp.key
					}
				});
				global.open(url);
			});
		} else {
			// if not many (don't bother with temp data)
			var url = $.telligent.evolution.url.modify({
				url: self.options.exportResourcesUrl,
				query: {
					_w_ids: serializeRequests(requests)
				}
			});
			global.open(url);
		}
	};

	Exporter.prototype.exportAllResources = function(){
		var self = this;
		var url = $.telligent.evolution.url.modify({
			url: self.options.exportResourcesUrl
		});
		global.open(url);
	};

	/*
	requests: array of requests (StudioNavigator.request)
	*/
	Exporter.prototype.exportFragments = function(requests){
		var self = this;
		// if there are many requests, store them in temp data
		if(requests.length > 5) {
			// store the export list (potentially large) in temp storage
			this.storeTemporaryExportList(requests).then(function(temp){
				// then build a GET url that refers to the temp storage of the export list
				var url = $.telligent.evolution.url.modify({
					url: self.options.exportFragmentsUrl,
					query: {
						_w_idsStorageKey: temp.key
					}
				});
				global.open(url);
			});
		} else {
			// if not many (don't bother with temp data)
			var url = $.telligent.evolution.url.modify({
				url: self.options.exportFragmentsUrl,
				query: {
					_w_ids: serializeRequests(requests)
				}
			});
			global.open(url);
		}
	};

	Exporter.prototype.exportAllFragments = function(){
		var self = this;
		var url = $.telligent.evolution.url.modify({
			url: self.options.exportFragmentsUrl
		});
		global.open(url);
	};
	return Exporter;

}, jQuery, window);
