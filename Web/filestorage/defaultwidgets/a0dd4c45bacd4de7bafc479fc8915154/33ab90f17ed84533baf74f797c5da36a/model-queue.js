/*

StudioSaveQueue
Ordered, batched, deduplicated processing of tasks

var queue = new StudioSaveQueue(options)
	interval: 5 * 1000,  // batch interval
	onTaskAdd: function(id) {}, // raised when task added
	onTaskBegin: function(id) {},  // raised when task starts
	onTaskDone: function(id) {}, // raised when task resolves
	onTaskFail: function(id) {}, // raised when task errors
	onEmpty: function() {} 		// raised when no tasks are remaining
	coalesce: true // when true, contiguous not-yet-running added tasks with matching IDs are coalesced into a single task where the last one wins, and previous scheduled ones are removed

queue.add(id, task)
	id: task identifier
	task: function which returns a promise
	options:
		immediate: false // when true, immediately runs any pending tasks (still in order), followed by newly added task. doesn't wait for interval.

	schedules a task to be run
	if an existing task with same id is already scheduled that hasn't begun
	is scheduled immediately prior to new task, then the existing task is overwritten with new task
	only *contiguous not-yet-run tasks with matching ids* are "coalesced".

	tasks are taken every interval and operated on in order, only proceding to next one on completion or error of previous

	returns a promise that resolves or rejects when the task's promise resolves or rejects unless the task is replaced/merged
		then the task that was overwritten is immediately rejected with value of 'canceled': true
*/
define('StudioSaveQueue', function($, global, undef) {

	var defaults = {
		interval: 5 * 1000,
		onTaskAdd: function(id) {},
		onTaskBegin: function(id) {},
		onTaskDone: function(id) {},
		onTaskFail: function(id) {},
		onEmpty: function() {},
		coalesce: true
	};

	var state = {
		waiting: 1, // newly added, not yet taken
		scheduled: 2, // taken, will run as soon as any preceding promises are completed
		pending: 3, // promise currently running
		resolved: 4, // done, resolved
		rejected: 5  // done, rejected
	};

	function startNextScheduledTask(context) {
		if(context.queue.length === 0)
			return false;

		if(context.runningCount == 0 && context.queue[0].state === state.scheduled) {
			//var item = context.queue[0];
			var item = context.queue.shift();
			item.state = state.pending;
			if(context.onTaskBegin) {
				context.onTaskBegin(item.id);
			}
			context.runningCount++;
			item.task()
				.done(function(){
					item.state = state.resolved;
					item.dfd.resolve.apply(this, arguments);
					if(context.onTaskDone) {
						context.onTaskDone(item.id);
					}
				})
				.fail(function(){
					item.state = state.rejected;
					item.dfd.reject.apply(this, arguments);
					if(context.onTaskFail) {
						context.onTaskFail(item.id);
					}
				})
				.always(function(){
					context.runningCount--;
					if(!startNextScheduledTask(context)) {
						attemptStop(context);
					}
				});
		}
		return true;
	}

	function attemptStop(context) {
		if(context.runningCount > 0 || context.queue.length > 0)
			return;
		if(context.onEmpty) {
			context.onEmpty();
		}
		global.clearInterval(context.waitInterval);
		context.waitInterval = false;
	}

	function start(context, immediately) {
		// if immediate, don't wait for previous tasks to be scheduled
		// immediately kick off all queued tasks to schedule and run immediately
		if(immediately) {
			global.clearInterval(context.waitInterval);
			context.waitInterval = false;
			scheduleImmediatelyRunAndContinueWithQueuedTasksReadyToRun(context);
		}

		if (!context.waitInterval) {
			context.waitInterval = global.setInterval(function(){
				scheduleImmediatelyRunAndContinueWithQueuedTasksReadyToRun(context);
			}, context.interval);
		}
	}

	function scheduleImmediatelyRunAndContinueWithQueuedTasksReadyToRun(context) {
		// schedule waiting tasks to be run
		for(var i = 0; i < context.queue.length; i++) {
			if(context.queue[i].state === state.waiting) {
				context.queue[i].state = state.scheduled;
			}
		}

		// if there was nothing to be scheduled
		// raise 'onEmpty' and stop the interval until another
		// item is added
		if(!startNextScheduledTask(context)) {
			attemptStop(context);
		}
	}

	var StudioSaveQueue = function(options){
		var context = $.extend({
			runningCount: 0
		}, defaults, options || {});
		context.queue = [];

		return {
			add: function(id, task, options) {
				return $.Deferred(function(d){

					var added = false;

					// when coalescing, look for duplicates only at the end, merging over last
					if(context.coalesce && context.queue.length > 0) {
						var item = context.queue[context.queue.length - 1];
						if(item.id === id && (item.state === state.waiting || item.state === state.scheduled)) {
							added = true;
							item.task = task;
							// reject previous deferred for this task
							item.dfd.reject({
								canceled: true
							});
							// add new one
							item.dfd = d;
						}
					}

					if(!added) {
						context.queue.push({
							id: id,
							task: task,
							state: state.waiting,
							dfd: d
						});
						if(context.onTaskAdd) {
							context.onTaskAdd(id);
						}
						start(context, (options && options.immediate) || false);
					}

				}).promise();
			}
		}
	};

	return StudioSaveQueue;

}, jQuery, window);
