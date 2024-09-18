/*

StudioSeries
Runs an array of promises in sequence

Example:

	var series = new StudioSeries([
		function(){
			return $.Deferred(function(d){
				setTimeout(function(){
					console.log('a');
					d.resolve();
				}, 1000);
			}).promise();
		},
		function(){
			return $.Deferred(function(d){
				setTimeout(function(){
					console.log('b');
					d.resolve();
				}, 1000);
			}).promise();
		},
		function(){
			return $.Deferred(function(d){
				setTimeout(function(){
					console.log('c');
					d.resolve();
				}, 1000);
			}).promise();
		},
		function(){
			return $.Deferred(function(d){
				setTimeout(function(){
					console.log('d');
					d.resolve();
				}, 1000);
			}).promise();
		}
	]);
	series.run().then(function(){
		console.log('series done');
	})

*/
define('StudioSeries', function($, global, undef) {

	var StudioSeries = function(promiseFactories){
		this.factories = promiseFactories || [];
	};

	StudioSeries.prototype.run = function() {
		var self = this;
		return $.Deferred(function(d){
			if(!self.factories || self.factories.length === 0) {
				d.resolve();
			} else {
				var first = self.factories.shift();
				if(first) {
					self._runAndContinue(first, function(){
						d.resolve();
					});
				}
			}
		}).promise();
	};

	StudioSeries.prototype._runAndContinue = function(promiseFactory, onComplete) {
		var self = this;
		return $.Deferred(function(d){
			promiseFactory().always(function(){
				var next = self.factories.shift();
				if(next) {
					self._runAndContinue(next, onComplete);
				} else {
					onComplete();
				}
			});
		}).promise();
	};

	return StudioSeries;

}, jQuery, window);
