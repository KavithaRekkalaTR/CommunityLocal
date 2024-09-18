/*
StudioKeyedQueue - Private API

Supports a queue-like behavior with the difference that items are queued alongside keys, and duplicate keys are disallowed.

If a key is re-used, the previously queued item with that key is removed, and the new item is enqueued to the end.

API:

	var queue = new StudioKeyedQueue();
	queue.enqueue(key, item);
	queue.dequeue();
	queue.isEmpty();
	queue.clear();

*/
define('StudioKeyedQueue', function ($, global, undef) {

	function StudioKeyedQueue() {
		this.clear();
	}

	StudioKeyedQueue.prototype.enqueue = function (key, item) {
		if (!key || !item)
			return;

		var current = this.queue.indexOf(key);
		if (current >= 0) {
			this.queue.splice(current, 1);
		}

		this.queue.push(key);
		this.items[key] = item;
	};

	StudioKeyedQueue.prototype.dequeue = function () {
		if (this.isEmpty())
			return null;

		var key = this.queue.shift();
		var item = {
			key: key,
			item: this.items[key]
		};

		delete this.items[item.key];

		return item;
	};

	StudioKeyedQueue.prototype.isEmpty = function () {
		return this.queue.length == 0;
	};

	StudioKeyedQueue.prototype.clear = function () {
		this.queue = [];
		this.items = {};
	};

	return StudioKeyedQueue;

}, jQuery, window);